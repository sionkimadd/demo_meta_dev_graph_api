from dotenv import load_dotenv

load_dotenv()

import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import requests
from backend import auth_utils
from backend.firestore_client import db
from cryptography.fernet import Fernet

app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
fernet = Fernet(ENCRYPTION_KEY.encode())

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/auth/facebook")
def facebook_auth():
    auth_url = auth_utils.generate_fb_auth_url()
    return RedirectResponse(auth_url)

@app.get("/auth/facebook/callback")
async def facebook_callback(request: Request):
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not auth_utils.validate_state(state):
        raise HTMLResponse("<h3>CSRF 실패<h3>", status_code=403)
    user_id = await auth_utils.generate_user_token_n_id(code)
    return RedirectResponse(f"/?status=connected&user_id={user_id}")

@app.get("/facebook/profile")
async def facebook_profile(user_id: str):
    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("sns")
        .document("facebook")
    )
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Not found user id")
    user_token = doc.to_dict().get("user_token")
    decrpted_token = fernet.decrypt(user_token.encode()).decode()

    params = {
        "fields": "id,name,picture{url}",
        "access_token": decrpted_token
    }
    res = requests.get("https://graph.facebook.com/v22.0/me", params=params)
    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail=res.text)
    return JSONResponse(res.json())

@app.get("/facebook/pages")
async def facebook_pages(user_id: str):
    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("sns")
        .document("facebook")
    )
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Not found user id")
    user_token = doc.to_dict().get("user_token")
    decrpted_token = fernet.decrypt(user_token.encode()).decode()

    params = {
        "access_token": decrpted_token
    }
    res = requests.get("https://graph.facebook.com/v22.0/me/accounts", params=params)

    if not res.ok:
        raise HTTPException(status_code=res.status_code, detail=res.text)
    
    pages_data = res.json()
    for page in pages_data.get("data", []):
        if "access_token" in page and "id" in page:
            try:
                await auth_utils.exchange_page_token_to_long_lived(
                    user_id, 
                    page["id"], 
                    page["access_token"]
                )
            except Exception as e:
                print(f"Fail to store (page_id: {page['id']}): {str(e)}")
    
    return JSONResponse(pages_data)

@app.post("/facebook/pages/{page_id}/feed")
async def create_page_post(page_id: str, user_id: str, message: str):
    page_doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("fb_pages")
        .document(page_id)
    )
    page_doc = page_doc_ref.get()
    if not page_doc.exists:
        raise HTTPException(status_code=404, detail="Not found fb_pages")
    
    page_token = page_doc.to_dict().get("page_token")
    decrpted_token = fernet.decrypt(page_token.encode()).decode()
    post_params = {
        "message": message,
        "access_token": decrpted_token
    }
    post_res = requests.post(f"https://graph.facebook.com/v22.0/{page_id}/feed", params=post_params)
    if not post_res.ok:
        raise HTTPException(status_code=post_res.status_code, detail=post_res.text)
    
    return JSONResponse(post_res.json())