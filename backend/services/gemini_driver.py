import requests
from utils.logger import logger

class GeminiDriver:
    """
    Communicates with the external Google Gemini API endpoint using standard HTTP requests.
    """
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.model_name = model_name

    def generate_response(self, prompt: str, api_key: str) -> str:
        if not api_key:
            raise ValueError("Gemini API key is required but missing.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2
            }
        }

        try:
            logger.info(f"Sending content generation request to Gemini model {self.model_name}...")
            response = requests.post(url, json=payload, headers=headers, timeout=60)
            
            if response.status_code != 200:
                logger.error(f"Gemini API returned error: Status {response.status_code} - {response.text}")
                raise RuntimeError(f"Gemini API error (Status {response.status_code}): {response.text}")

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning("Gemini API returned empty candidates.")
                return "Not found in repository"

            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text.strip()
        except Exception as e:
            logger.error(f"Failed to query Gemini model: {str(e)}")
            raise RuntimeError(f"Gemini Driver query error: {str(e)}")
