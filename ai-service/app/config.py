import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Path to the YOLO best.pt model file.
    # Override with MODEL_PATH env var or .env file.
    # Default: food_v3/weights/best.pt (relative to project root)
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        r"C:\Users\Narendra\runs\classify\food_v3\weights\best.pt"
    )
    # Confidence threshold for accepting a prediction (0.0 - 1.0)
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.90"))
    # Image size used during inference — must match training imgsz
    IMGSZ: int = int(os.getenv("IMGSZ", "224"))
    # Maximum allowed upload file size in megabytes
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    # Port the AI inference service listens on
    AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

