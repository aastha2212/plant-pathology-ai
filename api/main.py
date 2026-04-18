from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image
import tensorflow as tf
import traceback

#initializing api with documentation metadata
app = FastAPI(title = "Plant Pathology API", description = "Edge - Optimized ML inference Server")

#security layer: CORS allows React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

#loading the model
model_path = "../models/plant_model_quantized.tflite"
try:
    #we use the TFLite Interpreter instead of standard keras.load_model
    #interpreter runs the quantized model giving correct predicitons
    #workflow Load model → Allocate tensors → Set input data → Invoke → Get output.
    interpreter = tf.lite.Interpreter(model_path = model_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
except Exception as e:
    print(f"CriticalError: Failed to load TFLite model.{e}")

class_names = [
    'Pepper Bell (Bacterial Spot)', 'Pepper Bell (Healthy)', 
    'Potato (Early Blight)', 'Potato (Late Blight)', 'Potato (Healthy)', 
    'Tomato (Bacterial Spot)', 'Tomato (Early Blight)', 'Tomato (Late Blight)', 
    'Tomato (Leaf Mold)', 'Tomato (Septoria Leaf Spot)', 
    'Tomato (Spider Mites)', 'Tomato (Target Spot)', 
    'Tomato (Yellow Leaf Curl Virus)', 'Tomato (Mosaic Virus)', 
    'Tomato (Healthy)'
]

#this function safely decodes raw byte data into a 224X224 RGB numpy array
def read_file_as_image(data) -> np.ndarray:
    image = Image.open(BytesIO(data)).convert('RGB')
    image = image.resize((224,224))
    return np.array(image, dtype=np.float32) 

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"): #case 1: rejecting non-image files
        raise HTTPException(status_code = 400, detail = 'Invalid file type. Upload an Image.')

    try:
        image_data = await file.read()          #reading the file
        image = read_file_as_image(image_data)  #and format it into
        image_batch = np.expand_dims(image, 0)  #a batch of 1

        interpreter.set_tensor(input_details[0]['index'], image_batch)
        interpreter.invoke() #injecting image in interpreter's memory
                         #and running it

        probabilities = interpreter.get_tensor(output_details[0]['index'])[0] #extracting 15 probabilities 

        confidence = float(np.max(probabilities))
        predicted_class = class_names[np.argmax(probabilities)]

        if confidence < 0.65: #case2: if someone uploads an unrelated picture 
            return {
                "class" : "Unrecognized / No Disease Detected",
                "confidence" : round(confidence*100,2),
                "warning" : "Confidence is very low. Please ensure the image is a clear leaf."
            }

        #standard successful response 
        return {
            "class" : predicted_class,
            "confidence" : round(confidence * 100,2)
        }
    except Exception as e: #case 3: catch unexpected crashes
        error_trace = traceback.format_exc()
        print(f"\n--- AI CRASH LOG ---\n{error_trace}\n--------------------------\n")

        return JSONResponse(status_code=500, content={"detail": f"Internal Server Error: {str(e)}"})
        

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)