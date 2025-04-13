import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env
load_dotenv()

# Get API key from environment
api_key = os.environ.get('GEMINI_API_KEY')
print(f"API key loaded: {bool(api_key)}")
print(f"API key value: {api_key}")

# Try to use the API key
try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content('Say hello!')
    print(f"API response: {response.text}")
    print("Gemini API is working correctly!")
except Exception as e:
    print(f"Error: {str(e)}")
    print("Gemini API is not working correctly!") 