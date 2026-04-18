import { useState, useEffect } from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; 

const SAMPLES = [
  { name: 'Tomato (Healthy)', fileName: 'sample1.jpg' },
  { name: 'Potato (Early Blight)', fileName: 'sample2.jpg' },
  { name: 'Pepper Bell (Bacterial Spot)', fileName: 'sample3.jpg' },
];

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeSampleIndex, setActiveSampleIndex] = useState(null);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (result) {
      setAnimatedConfidence(0);
      setTimeout(() => setAnimatedConfidence(result.confidence), 100);
    }
  }, [result]);

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
    setActiveSampleIndex(null);
    setAnimatedConfidence(0);
    // THE FIX: Wipe the physical input element's text
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg("Please upload a valid image file (JPG/PNG).");
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setErrorMsg(null);
      setActiveSampleIndex(null);
    }
  };

  const loadSampleImage = async (sampleFileName, index) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const sampleUrl = `/${sampleFileName}`;
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const file = new File([blob], "sample.jpg", { type: "image/jpeg" });
      
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setActiveSampleIndex(index);
    } catch (err) {
      setErrorMsg("Failed to load sample image.");
    }
    setIsLoading(false);
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.detail || "The server rejected the file.");
      } else {
        setErrorMsg("Cannot reach the AI Server. Is the Python terminal running?");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="app-container">
      {/* The card physically widens if a preview exists */}
      <div className={`glass-card ${preview ? 'expanded' : ''}`}>
        
        {/* LEFT SIDE: Controls */}
        <div className="control-panel">
          <h1>🌿 Plant Pathology AI</h1>
          <p>Upload a leaf image or select a sample below to detect diseases instantly.</p>

          <div className="samples-section">
            <p className="section-label">Try a pre-loaded sample:</p>
            <div className="sample-options">
              {SAMPLES.map((sample, index) => (
                <button 
                  key={index} 
                  onClick={() => loadSampleImage(sample.fileName, index)} 
                  className={`sample-btn ${index === activeSampleIndex ? 'active' : ''}`}
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          <div className="upload-area">
            <p className="section-label">Or upload your own:</p>
            <input type="file" accept="image/*" onChange={onFileChange} className="file-input" ref={fileInputRef} />
          </div>

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <button 
            onClick={analyzeImage} 
            disabled={!selectedFile || isLoading}
            className="analyze-btn"
          >
            {isLoading ? "⚙️ Analyzing Image..." : "🔍 Analyze Leaf"}
          </button>
        </div>

        {/* RIGHT SIDE: Image & Results (Only visible when an image is selected) */}
        {preview && (
          <div className="display-panel">
            <div className="display-header">
              <span className="display-title">Target Image</span>
              <button onClick={clearSelection} className="clear-btn">✕ Clear</button>
            </div>
            
            <img src={preview} alt="Leaf Preview" className="image-preview" />
            
            {result && (
              <div className="results-card">
                <h3 className="disease-title">{result.class}</h3>
                <div className="bar-wrap">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${animatedConfidence}%`, 
                      backgroundColor: result.confidence > 80 ? '#27ae60' : result.confidence > 60 ? '#f39c12' : '#e74c3c'
                    }}>
                  </div>
                </div>
                <p className="confidence-value">Confidence: {result.confidence}%</p>
                {result.warning && <p className="warning-txt">⚠️ {result.warning}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;