import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import ControlPanel from './components/ControlPanel';
// import { motion } from 'framer-motion'; // Uncomment if using Framer Motion
// import { FiUpload, FiSettings, FiUser, FiFileText } from 'react-icons/fi'; // Example icons

const API_URL = "http://localhost:8000";

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function App() {
  const [files, setFiles] = useState([]);
  const [userGoal, setUserGoal] = useState("Prepare for image classification model");
  const [llmPlan, setLlmPlan] = useState(null);
  const [livePlan, setLivePlan] = useState([]);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState('');
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(acceptedFiles => {
    setFiles(acceptedFiles);
    setLlmPlan(null);
    setLivePlan([]);
    if (acceptedFiles.length > 0) {
        setOriginalPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
        setProcessedPreviewUrl(URL.createObjectURL(acceptedFiles[0]));
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleGeneratePlan = async () => {
    if (files.length === 0) return;
    setIsLoading(true); setError('');
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('user_goal', userGoal);
    try {
      const response = await axios.post(`${API_URL}/generate-plan`, formData);
      setLlmPlan(response.data.plan);
      setLivePlan(response.data.plan.ops || []);
    } catch (err) { setError(err.response?.data?.detail || "Error generating plan."); }
    finally { setIsLoading(false); }
  };

  const handleApplyPlanAndDownload = async () => {
      if (files.length === 0) return;
      setIsLoading(true);
      setError('');
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('plan', JSON.stringify(llmPlan));
      try {
        const response = await axios.post(`${API_URL}/apply-plan`, formData, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'processed_files.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        setError(err.response?.data?.detail || "An error occurred applying the plan.");
      } finally {
        setIsLoading(false);
      }
  };

  const updatePreview = useCallback(debounce(async (plan) => {
    if (files.length === 0 || plan.length === 0) {
       setProcessedPreviewUrl(originalPreviewUrl);
       return;
    }
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('plan', JSON.stringify({ ops: plan }));
    try {
        const response = await axios.post(`${API_URL}/preview-image`, formData, { responseType: 'blob' });
        setProcessedPreviewUrl(URL.createObjectURL(response.data));
    } catch (err) { console.error("Preview failed:", err); }
  }, 500), [files, originalPreviewUrl]);

  useEffect(() => {
    if(llmPlan) {
        updatePreview(livePlan);
    }
  }, [livePlan, updatePreview, llmPlan]);

  return (
    <>
      {/* Header */}
      <header className="app-header fixed top-0 left-0 w-full h-20 flex items-center px-8 z-50" style={{backdropFilter: 'blur(5px)', background: 'rgba(30,58,138,0.9)'}}>
        {/* <FiFileText className="mr-3 text-2xl" /> */}
        <span className="font-semibold text-xl tracking-tight" style={{fontFamily: 'Inter, sans-serif'}}>Data Preprocessing Agent</span>
        <nav className="ml-10 flex gap-8 text-base font-medium">
          <a href="#" className="hover:text-accent-blue transition-colors">Upload</a>
          <a href="#" className="hover:text-accent-blue transition-colors">History</a>
          <a href="#" className="hover:text-accent-blue transition-colors">Settings</a>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {/* <FiUser className="text-2xl" /> */}
          <span className="font-mono text-sm bg-neutral-light-gray px-3 py-1 rounded shadow">User</span>
        </div>
      </header>
      <main className="main-layout" style={{paddingTop: '100px', maxWidth: 1400, margin: '0 auto'}}>
        {/* Left Panel */}
        <div className="left-panel" style={{minWidth: 400}}>
          <div className="card">
            <h2>1. Upload Data</h2>
            <div
              {...getRootProps()}
              className={`file-dropzone border-2 border-dashed rounded-lg p-6 text-center font-sans transition-all duration-300 ${isDragActive ? 'scale-105 bg-white' : 'bg-neutral-light-gray'}`}
              style={{ borderColor: 'var(--primary-navy)', outline: isDragActive ? '2px solid var(--accent-blue)' : 'none' }}
            >
              <input {...getInputProps()} />
              <p className="text-neutral-dark-gray">Drag 'n' drop files here, or click to select</p>
            </div>
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map(file => (
                  <li key={file.name} className="fade-in flex items-center gap-2 text-xs font-mono bg-neutral-light-gray px-2 py-1 rounded shadow-sm">
                    {/* <FiFileText className="text-lg text-primary-navy" /> */}
                    <span>{file.name}</span>
                    <span className="ml-auto text-neutral-dark-gray">{(file.size/1024).toFixed(1)} KB</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card">
            <h2>2. Define Goal & Generate Plan</h2>
            <input type="text" value={userGoal} onChange={(e) => setUserGoal(e.target.value)} className="w-full mb-4 p-2 rounded border border-neutral-light-gray font-sans text-base" style={{marginBottom: '1rem'}} />
            <button className="primary-button" onClick={handleGeneratePlan} disabled={isLoading || files.length === 0}>
              {isLoading ? <img src="/public/spinner.svg" className="spinner" alt="Loading..." /> : "Generate Plan"}
            </button>
          </div>
          {llmPlan && (
            <div className="card fade-in-slide">
              <h2>3. Adjust Plan</h2>
              <ControlPanel llmPlan={llmPlan} livePlan={livePlan} setLivePlan={setLivePlan} />
            </div>
          )}
        </div>
        {/* Right Panel */}
        <div className="right-panel">
          <div className="card">
            <h2>Result Preview</h2>
            {error && <p className="error-message">{error}</p>}
            {files.length > 0 ? (
              <div className="image-preview flex gap-6">
                <div className="flex-1">
                  <strong className="block mb-2">Original</strong>
                  <img src={originalPreviewUrl} alt="Original" className="rounded shadow" style={{maxWidth: '100%'}} />
                </div>
                <div className="flex-1">
                  <strong className="block mb-2">Preview</strong>
                  <img src={processedPreviewUrl} alt="Preview" className="rounded shadow fade-transition" style={{maxWidth: '100%'}} />
                </div>
              </div>
            ) : <p>Upload an image to begin.</p>}
            <button className="primary-button mt-6" onClick={handleApplyPlanAndDownload} disabled={isLoading || files.length === 0 || !llmPlan}>
              Apply & Download All
            </button>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="w-full bg-neutral-light-gray text-neutral-dark-gray text-xs py-4 px-8 flex justify-between items-center border-t border-neutral-light-gray" style={{marginTop: 24}}>
        <span>v1.0.0, Jul 31, 2025</span>
        <span className="hover:underline cursor-pointer" title="Get help or documentation">Help</span>
      </footer>
    </>
  );
}

export default App;