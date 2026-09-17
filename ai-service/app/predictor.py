import torch
import time
import logging
from ultralytics import YOLO
from PIL import Image
from typing import Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("food_classification")

class FoodPredictor:
    def __init__(self):
        self.model = None
        self.device = "cpu"
        self.names = {}
        
    def load_model(self):
        # Determine device
        if torch.cuda.is_available():
            self.device = "cuda:0"
            gpu_name = torch.cuda.get_device_name(0)
            logger.info(f"Model device: CUDA")
            logger.info(f"GPU: {gpu_name}")
        else:
            self.device = "cpu"
            logger.info("Model device: CPU")
            
        # Load model
        logger.info(f"Loading YOLO model from {settings.MODEL_PATH}...")
        try:
            self.model = YOLO(settings.MODEL_PATH)
            # Send to appropriate device if needed, but YOLO usually handles it in .predict
            self.names = self.model.names
            logger.info(f"Model loaded successfully with {len(self.names)} classes.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Could not load model from {settings.MODEL_PATH}")

    def predict(self, image: Image.Image) -> Tuple[float, Dict[str, Any]]:
        """
        Runs inference on the image.
        Returns:
            inference_time (ms), result dictionary
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded.")
            
        start_time = time.time()
        
        # We let Ultralytics handle preprocessing including resizing to imgsz
        results = self.model.predict(
            source=image, 
            imgsz=settings.IMGSZ, 
            device=self.device, 
            verbose=False
        )
        
        inference_time_ms = (time.time() - start_time) * 1000
        
        # Get the first result (since we pass a single image)
        result = results[0]
        
        # YOLO11n-cls probabilities
        probs = result.probs
        
        top1_index = probs.top1
        top1_conf = float(probs.top1conf)
        top1_class = self.names[top1_index]
        
        # Also extract top 5 for debug purposes
        top5_indices = probs.top5
        top5_confs = probs.top5conf.tolist()
        
        top5_predictions = [
            {"class": self.names[idx], "confidence": conf}
            for idx, conf in zip(top5_indices, top5_confs)
        ]
        
        return inference_time_ms, {
            "top1_class": top1_class,
            "top1_confidence": top1_conf,
            "top5_predictions": top5_predictions
        }

# Singleton instance
predictor = FoodPredictor()
