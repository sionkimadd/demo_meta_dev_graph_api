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
    import base64
    import os
    import replicate

    os.makedirs(output_dir, exist_ok=True)

    input = {
        "size": "1365x1024",
        "prompt": user_prompt
    }

    try:
        output = replicate.run(
            "recraft-ai/recraft-v3",
            input=input
        )

        if hasattr(output, "read"):
            file_bytes = output.read()
        elif isinstance(output, (list, tuple)):
            first = output[0]
            if hasattr(first, "read"):
                file_bytes = first.read()
            else:
                import requests
                response = requests.get(first)
                file_bytes = response.content
        elif hasattr(output, "__iter__"):
            first = next(iter(output))
            if hasattr(first, "read"):
                file_bytes = first.read()
            else:
                import requests
                response = requests.get(first)
                file_bytes = response.content

        encoded_string = base64.b64encode(file_bytes).decode('utf-8')
        return f"data:image/webp;base64,{encoded_string}"
    except Exception:
        raise