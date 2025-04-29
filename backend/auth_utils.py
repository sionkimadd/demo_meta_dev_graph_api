import time
import os, urllib.parse, secrets, requests
from cryptography.fernet import Fernet
from .firestore_client import save_page_token, save_token

STATE_TOKEN = secrets.token_urlsafe(16)

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
fernet = Fernet(ENCRYPTION_KEY.encode())

def generate_fb_auth_url():
    params = {
        "client_id": os.getenv("FB_APP_ID"),
        "redirect_uri": os.getenv("FB_REDIRECT_URI"),
        "state": STATE_TOKEN,
        "scope": ", ".join([
            "pages_show_list",
            "instagram_basic",
            "instagram_content_publish",
            "pages_read_engagement",
            "pages_manage_posts",
            "business_management"
        ]),
        "response_type": "code",
    }
    url = f"https://www.facebook.com/v22.0/dialog/oauth?{urllib.parse.urlencode(params)}"
    return url

def validate_state(state):
    return state == STATE_TOKEN

async def generate_user_token_n_id(code):
    # Short Token
    short_token_res = requests.get(
        "https://graph.facebook.com/v22.0/oauth/access_token",
        params={
            "client_id": os.getenv("FB_APP_ID"),
            "redirect_uri": os.getenv("FB_REDIRECT_URI"),
            "client_secret": os.getenv("FB_APP_SECRET"),
            "code": code,
        },
    ).json()
    short_token = short_token_res["access_token"]

    # Long Token
    long_token_res = requests.get(
        "https://graph.facebook.com/v22.0/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": os.getenv("FB_APP_ID"),
            "client_secret": os.getenv("FB_APP_SECRET"),
            "fb_exchange_token": short_token,
        },
    ).json()
    long_token = long_token_res["access_token"]

    debug_res = requests.get(
        "https://graph.facebook.com/debug_token",
        params={
            "input_token": long_token,
            "access_token": f"{os.getenv('FB_APP_ID')}|{os.getenv('FB_APP_SECRET')}"
        },
    )
    debug_data = debug_res.json().get("data", {})
    data_expiry_ts = debug_data.get("data_access_expires_at")
    
    if not data_expiry_ts:
        raise Exception("Failed to get data_expiry_ts")
    hours = (data_expiry_ts - int(time.time())) / 3600

    me = requests.get(
        "https://graph.facebook.com/v22.0/me",
        params={"access_token": long_token}
    ).json()
    user_id = me["id"]

    encrypted_token = fernet.encrypt(long_token.encode()).decode()
    await save_token(user_id, encrypted_token, hours)

    return user_id

async def exchange_page_token_to_long_lived(user_id, page_id, short_page_token):
    long_res = requests.get(
        "https://graph.facebook.com/v22.0/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": os.getenv("FB_APP_ID"),
            "client_secret": os.getenv("FB_APP_SECRET"),
            "fb_exchange_token": short_page_token,
        },
    ).json()
        
    long_page_token = long_res["access_token"]
    
    debug_res = requests.get(
        "https://graph.facebook.com/debug_token",
        params={
            "input_token": long_page_token,
            "access_token": f"{os.getenv('FB_APP_ID')}|{os.getenv('FB_APP_SECRET')}"
        },
    )
    debug_data = debug_res.json().get("data", {})
    data_expiry_ts = debug_data.get("data_access_expires_at")
    
    if not data_expiry_ts:
        raise Exception("Failed to get data_expiry_ts")
    hours = (data_expiry_ts - int(time.time())) / 3600
        
    encrypted_token = fernet.encrypt(long_page_token.encode()).decode()
    await save_page_token(user_id, page_id, encrypted_token, hours)
    
    return long_page_token