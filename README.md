# Plant Pathology AI Pipeline

**Live Demo:** [https://plant-pathology-ai-yrih.vercel.app/](https://plant-pathology-ai-yrih.vercel.app/)

![TensorFlow](https://img.shields.io/badge/TensorFlow-%23FF6F00.svg?style=for-the-badge&logo=TensorFlow&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

An end-to-end Machine Learning pipeline and diagnostic web application for detecting plant diseases from leaf imagery. Built with a decoupled architecture, this project features a custom-trained computer vision model served via a FastAPI REST backend and consumed by a responsive React UI.

## 🚀 Key Project Features

* **End-to-End Architecture:** A fully decoupled, cloud-hosted pipeline demonstrating the complete lifecycle of an ML project from Jupyter notebook training to production deployment.
* **Pre-loaded Sandbox:** Users can test the model's inference capabilities immediately using pre-loaded sample imagery, bypassing the need to source their own datasets.
* **REST API:** Fully documented, interactive API endpoints automatically generated via Swagger UI, allowing for easy third-party integration.

## 🧠 Advanced ML Engineering 

Moving beyond standard tutorial implementations, this model was heavily optimized for real-world constraints:

* **Handling Imbalanced Data (Class Weights):** The PlantVillage dataset suffers from severe class imbalance (e.g., thousands of Early Blight samples vs. very few Mosaic Virus samples). To prevent the model from overfitting to the majority class, **dynamic class weights** were computed and applied to the loss function during training, heavily penalizing misclassifications of minority classes and significantly improving overall recall.
* **Deployment Optimization (Quantization):** Deploying heavy Deep Learning models to serverless cloud environments often results in out-of-memory (OOM) crashes. The EfficientNet architecture was optimized and **quantized** for CPU inference, drastically reducing the memory footprint of the `.h5` model graph. This allows the model to run reliably on free-tier cloud instances without sacrificing validation accuracy.

## ⚠️ Engineering Notes & Known Limitations

For engineering teams reviewing this repository, the following notes detail the architectural trade-offs and infrastructure limitations present in this V1 build:

### 1. Infrastructure Latency (The "Cold Start" Problem)
**Note on the live demo:** You may experience a 3 to 4-minute delay on the very first prediction. 
* **The Cause:** The inference API is hosted on a free-tier serverless environment (Render) which spins down after 15 minutes of inactivity. When waking up, the server must provision the environment, download the heavy TensorFlow C++ binaries, and load the entire EfficientNet model graph into CPU memory.
* **The Reality:** Once the server is "warm", subsequent inference requests process in under 500ms. 
* **Production Solution:** In an enterprise environment, this is mitigated by provisioning dedicated, always-on instances, or by converting the model into strict ONNX or TensorFlow Lite formats to drop the boot time to seconds.

### 2. Data Distribution Shift
The model achieved a 97.45% validation accuracy during training. However, the model excels primarily at diagnosing laboratory-staged leaves (solid backgrounds, perfect lighting). Real-world images with complex backgrounds (dirt, shadows, overlapping plants) introduce visual noise that the model was not trained to ignore, occasionally leading to false positives.

### 3. The Softmax Trap (Confidently Wrong)
Neural network Softmax activations inherently force output probabilities to sum to 100%. When presented with an Out-of-Distribution (OOD) image—such as an unrepresented disease or a non-plant object—the model will often confidently "hallucinate" the nearest visually similar class rather than outputting a low confidence score. Future iterations would require a dedicated OOD anomaly detection algorithm prior to the classification step.

## 💻 Local Setup & Installation

### 1. The Backend (API)
Navigate to the `api` directory and set up the Python virtual environment:

```bash
cd api
python3 -m venv dl_env
source dl_env/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

*The REST API and auto-generated Swagger documentation will be available at `http://localhost:8000/docs`*

### 2. The Frontend (UI)
In a separate terminal, navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

*The UI will be available at `http://localhost:5173`*

## 📁 Repository Structure
```text
├── api/                   # FastAPI backend
│   ├── main.py            # API routing and inference logic
│   ├── requirements.txt   # Backend dependencies
│   └── (model.h5)         # Saved TensorFlow model (Excluded via .gitignore)
├── frontend/              # React/Vite frontend
│   ├── src/               # UI components, state management, and CSS
│   └── public/            # Static assets and sample images
└── README.md
```