from vertexai.preview.generative_models import GenerativeModel
from dotenv import load_dotenv
import os
import replicate
import uuid
from typing import Optional
import requests

load_dotenv()

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_API_TOKEN:
    raise RuntimeError("REPLICATE_API_TOKEN is missing from .env")

os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

def generate_text(topic: str) -> str:
    model = GenerativeModel("gemini-2.0-flash-lite-001")
    prompt = f"Write a stylish Instagram caption about: {topic}. Add emojis and hashtags."
    response = model.generate_content(prompt)
    return response.text

def generate_caption_and_hashtags(keyword: str) -> tuple[str, str]:
    if not keyword:
        raise ValueError("Keyword cannot be empty")
    
    try:
        generated_text = generate_text(keyword)
        parts = generated_text.split("#")
        caption = parts[0].strip()
        hashtags = "#" + " #".join(parts[1:]) if len(parts) > 1 else ""
        return caption, hashtags
    except Exception as e:
        raise Exception(f"Failed to generate caption: {str(e)}")

def generate_img(user_prompt: str, output_dir: Optional[str] = "./tmp") -> str:
    os.makedirs(output_dir, exist_ok=True)

    prompt = (
        f"Aesthetic and artistic photo of {user_prompt}, "
        f"vibrant colors, dreamy style, Instagram trending, 4K"
    )

    input = {
        "prompt": prompt,
        "scheduler": "K_EULER"
    }

    output = replicate.run(
        "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input=input
    )

    filename = f"{uuid.uuid4().hex}.png"
    file_path = os.path.join(output_dir, filename)

    for item in output:
        with open(file_path, "wb") as f:
            f.write(item.read())

    import base64
    with open(file_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    
    os.remove(file_path)
    
    return f"data:image/png;base64,{encoded_string}"