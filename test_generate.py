import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

try:
    print("Initializing model...")
    model = genai.GenerativeModel(
        model_name='gemini-flash-latest',
        system_instruction="You are a helpful assistant."
    )
    print("Generating content...")
    response = model.generate_content("Hello")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
