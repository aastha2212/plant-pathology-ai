# 🌿 Plant Pathology Expert System: EfficientNet & TFLite 

An end-to-end Machine Learning web application designed to diagnose 15 distinct plant diseases across Tomatoes, Potatoes, and Bell Peppers using Deep Learning and a decoupled microservice architecture.

## 🚀 Architectural Highlights

* **Compound Scaling (Transfer Learning):** Utilized `EfficientNetB0` to drastically reduce parameter count while maintaining high feature extraction capabilities.
* **Mathematical Data Balancing:** Implemented dynamic `class_weights` during model fitting to forcefully penalize the network for ignoring statistically rare healthy leaves, mitigating severe dataset imbalance without risking data leakage from synthetic oversampling.
* **Automated MLOps:** Integrated Keras Callbacks (`EarlyStopping`, `ReduceLROnPlateau`) to autonomously prevent overfitting and manage the learning rate during training.
* **Edge-Optimized Inference:** Converted the heavy `Float32` `.keras` model into an `Int8` quantized `.tflite` model. This reduced the storage footprint by over 75% and enabled lightning-fast, CPU-only inference.
* **Robust Microservice Backend:** Engineered a FastAPI backend equipped with CORS middleware, strict file-type validation, and low-confidence prediction thresholding.
* **Modern Frontend:** Built a responsive, state-driven user interface using React (Vite).

## ⚙️ Repository Structure
* `/notebooks/`: Data exploration, pipeline optimization, model training, and post-training quantization logic.
* `/models/`: Saved model artifacts (`.keras` and optimized `.tflite`).
* `/api/`: The Python FastAPI server handling ML inference.
* `/frontend/`: The React web application.

## 💻 How to Run Locally

### 1. Start the ML Backend
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload