import io
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from contextlib import asynccontextmanager

from app.config import settings
from app.predictor import predictor

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("food_classification")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model ONCE — never reload per-request
    try:
        predictor.load_model()
        logger.info(f"Confidence threshold : {settings.CONFIDENCE_THRESHOLD} ({settings.CONFIDENCE_THRESHOLD * 100:.0f}%)")
        logger.info(f"Image size           : {settings.IMGSZ}px")
        logger.info(f"Max file size        : {settings.MAX_FILE_SIZE_MB} MB")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
    yield
    # Shutdown
    logger.info("Shutting down Nutrack AI inference service...")


app = FastAPI(
    title="Nutrack Food AI — Inference API",
    description="Backend inference API for YOLO11n-cls food classification model (V3, 55 classes).",
    version="3.0.0",
    lifespan=lifespan
)

# CORS — allow all origins for local development/demo
# IMPORTANT: Restrict allow_origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check — verify server and model status."""
    model_loaded = predictor.model is not None
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_path": settings.MODEL_PATH,
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "imgsz": settings.IMGSZ,
    }


def validate_and_load_image(file: UploadFile, max_size_bytes: int) -> Image.Image:
    """
    Validates the uploaded file:
    1. Checks content-type header (soft check)
    2. Reads bytes, checks file size
    3. Validates image is not corrupt
    Returns a PIL Image (RGB).
    """
    # 1. Content-type check (not all clients send this, so it's a soft check)
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File yang dikirim bukan gambar. Harap upload file gambar (JPG, PNG, WEBP, dll)."
        )

    try:
        image_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal membaca file: {str(e)}"
        )

    # 2. Size check
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File gambar kosong (0 bytes)."
        )

    if len(image_bytes) > max_size_bytes:
        size_mb = len(image_bytes) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file terlalu besar ({size_mb:.1f} MB). Maksimal {settings.MAX_FILE_SIZE_MB} MB."
        )

    # 3. Validate image integrity
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image.verify()  # Raises if corrupt
        # Re-open after verify() (verify consumes the stream)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return image
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File bukan gambar yang valid atau gambar corrupt."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memproses gambar: {str(e)}"
        )


@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """
    Main prediction endpoint.
    Accepts a food image via multipart/form-data.
    Runs YOLO V3 classification and returns:
      - accepted=True  if confidence >= threshold (90%)
      - accepted=False if confidence < threshold (retake required)
    """
    if not file or not file.filename:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "status": "error",
                "food": None,
                "confidence": None,
                "accepted": False,
                "message": "File tidak ditemukan dalam request."
            }
        )

    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    # --- Step 1: Validate & load image ---
    try:
        image = validate_and_load_image(file, max_size_bytes)
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={
                "success": False,
                "status": "error",
                "food": None,
                "confidence": None,
                "accepted": False,
                "message": e.detail
            }
        )

    # --- Step 2: Run inference ---
    try:
        inference_time_ms, prediction_data = predictor.predict(image)
    except RuntimeError as e:
        logger.error(f"Model not loaded: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "status": "error",
                "food": None,
                "confidence": None,
                "accepted": False,
                "message": "Model AI tidak tersedia. Pastikan backend sudah berjalan dengan benar."
            }
        )
    except Exception as e:
        logger.error(f"Inference error: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "status": "error",
                "food": None,
                "confidence": None,
                "accepted": False,
                "message": "Terjadi kesalahan pada server saat melakukan analisis gambar."
            }
        )

    top1_class = prediction_data["top1_class"]
    confidence = prediction_data["top1_confidence"]
    threshold = settings.CONFIDENCE_THRESHOLD
    accepted = confidence >= threshold

    # --- Debug logging ---
    logger.info("=" * 52)
    logger.info(f"  File      : {file.filename}")
    logger.info(f"  Predicted : {top1_class}")
    logger.info(f"  Confidence: {confidence:.4f} ({confidence * 100:.2f}%)")
    logger.info(f"  Threshold : {threshold:.2f} ({threshold * 100:.0f}%)")
    logger.info(f"  Status    : {'✅ ACCEPTED' if accepted else '🔁 RETAKE'}")
    logger.info(f"  Inference : {inference_time_ms:.1f} ms")
    logger.info("=" * 52)

    # --- Step 3: Apply threshold ---
    if accepted:
        return {
            "success": True,
            "status": "accepted",
            "food": top1_class,
            "confidence": round(confidence, 4),
            "confidence_percent": round(confidence * 100, 2),
            "accepted": True,
            "threshold": threshold,
            "message": f"Makanan berhasil dikenali."
        }
    else:
        return {
            "success": True,
            "status": "retake",
            "food": top1_class,
            "confidence": round(confidence, 4),
            "confidence_percent": round(confidence * 100, 2),
            "accepted": False,
            "threshold": threshold,
            "message": "Foto belum cukup jelas. Coba foto kembali dengan makanan terlihat jelas dan pencahayaan yang cukup."
        }


@app.post("/predict/debug")
async def predict_image_debug(file: UploadFile = File(...)):
    """
    Debug endpoint — returns top-5 predictions.
    Use during development to inspect model output.
    """
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    try:
        image = validate_and_load_image(file, max_size_bytes)
        inference_time_ms, prediction_data = predictor.predict(image)
        return {
            "filename": file.filename,
            "inference_time_ms": round(inference_time_ms, 1),
            "top1": {
                "food": prediction_data["top1_class"],
                "confidence": round(prediction_data["top1_confidence"], 4),
                "accepted": prediction_data["top1_confidence"] >= settings.CONFIDENCE_THRESHOLD,
            },
            "top5_predictions": prediction_data["top5_predictions"],
            "threshold": settings.CONFIDENCE_THRESHOLD,
        }
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content={"error": e.detail}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.AI_SERVICE_PORT,
        reload=False,  # MUST be False — model loads only once at startup
    )
