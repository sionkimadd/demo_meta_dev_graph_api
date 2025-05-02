from vertexai.preview.generative_models import GenerativeModel

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