import os

# Unit tests always run the mocked pipeline, even when a real GEMINI_API_KEY is in
# .env — only test_gemini_live.py talks to Gemini, and it calls the client directly.
os.environ["WISER_LIVE_LLM"] = "0"

# Never let unit tests touch the real Supabase DB — persistence degrades to no-op.
import app.config  # noqa: E402  (triggers dotenv load first)
os.environ.pop("DATABASE_URL", None)
