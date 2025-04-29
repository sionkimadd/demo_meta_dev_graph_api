import os
from google.cloud import firestore
from google.oauth2 import service_account

KEY_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
PROJECT_ID = os.getenv("GOOGLE_PROJECT_ID")
credentials = service_account.Credentials.from_service_account_file(KEY_PATH)

if PROJECT_ID:
    db = firestore.Client(credentials=credentials, project=PROJECT_ID)
else:
    db = firestore.Client(credentials=credentials)

async def save_token(user_id: str, encrypted_token: str, hours: int):
    doc_ref = db.collection("users").document(user_id).collection("sns").document("facebook")
    doc_ref.set({
        "user_token": encrypted_token,
        "hours": hours,
        "saved_at": firestore.SERVER_TIMESTAMP,
    })

async def save_page_token(user_id: str, page_id: str, encrypted_token: str, hours: int):
    doc_ref = db.collection("users").document(user_id).collection("fb_pages").document(page_id)
    doc_ref.set({
        "page_token": encrypted_token,
        "hours": hours,
        "saved_at": firestore.SERVER_TIMESTAMP,
    })