import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import ControlPanel from './components/ControlPanel';
import DataControlPanel from './components/DataControlPanel';
import DataReview from './components/DataReview';

const API_URL = "http://localhost:8000";


function App() {
  const [files, setFiles] = useState([]);
  const [userGoal, setUserGoal] = useState("Prepare for image classification model");
  const [llmPlan, setLlmPlan] = useState(null);
  const [livePlan, setLivePlan] = useState([]);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState('');
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [learningMode, setLearningMode] = useState(false);
  const [explanations, setExplanations] = useState({});
  const [showFileList, setShowFileList] = useState(false);
  const [dataType, setDataType] = useState('image'); // 'image', 'csv', 'text'
  const [dataPreview, setDataPreview] = useState(null); // For CSV/text preview

  const onDrop = useCallback(acceptedFiles => {
    setFiles(acceptedFiles);
    setLlmPlan(null);
    setLivePlan([]);
    setDataPreview(null);
    
    if (acceptedFiles.length > 0) {
      const firstFile = acceptedFiles[0];
      const ext = firstFile.name.split('.').pop().toLowerCase();
      
      if (['png', 'jpg', 'jpeg'].includes(ext)) {
        setDataType('image');
        setOriginalPreviewUrl(URL.createObjectURL(firstFile));
        setProcessedPreviewUrl(URL.createObjectURL(firstFile));
        setUserGoal("Prepare for image classification model");
      } else if (ext === 'csv') {
        setDataType('csv');
        setUserGoal("Prepare for machine learning");
      } else if (['txt', 'md', 'pdf'].includes(ext)) {
        setDataType('text');
        setUserGoal("Prepare for NLP processing");
      }
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/*': ['.txt', '.csv'],
      'application/pdf': ['.pdf']
    }
  });

  const handleFolderSelect = useCallback((event) => {
    const fileList = Array.from(event.target.files);
    setFiles(fileList);
    setLlmPlan(null);
    setLivePlan([]);
    setDataPreview(null);
    
    if (fileList.length > 0) {
      const firstFile = fileList[0];
      const ext = firstFile.name.split('.').pop().toLowerCase();
      
      if (['png', 'jpg', 'jpeg'].includes(ext)) {
        setDataType('image');
        setOriginalPreviewUrl(URL.createObjectURL(firstFile));
        setProcessedPreviewUrl(URL.createObjectURL(firstFile));
        setUserGoal("Prepare for image classification model");
      } else if (ext === 'csv') {
        setDataType('csv');
        setUserGoal("Prepare for machine learning");
      } else if (['txt', 'md', 'pdf'].includes(ext)) {
        setDataType('text');
        setUserGoal("Prepare for NLP processing");
      }
    }
  }, []);

  const handleGeneratePlan = async () => {
    if (files.length === 0) return;
    setIsLoading(true); setError('');
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('user_goal', userGoal);
    try {
      const response = await axios.post(`${API_URL}/generate-plan`, formData);
      
      const planData = {
        ...response.data.plan,
        profile: response.data.profile,
        ops: response.data.plan.ops || [],
        data_type: response.data.data_type
      };
      
      setLlmPlan(planData);
      setLivePlan(planData.ops);
      setDataType(response.data.data_type);
      
      // Set data preview for CSV/text
      if (response.data.data_type === 'csv') {
        setDataPreview(response.data.cleaned_preview);
      } else if (response.data.data_type === 'text') {
        setDataPreview(response.data.cleaned_preview);
      }
      
    } catch (err) { 
      setError(err.response?.data?.detail || "Error generating plan.");
    }
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

  // Create refs to store timeouts and previous URLs for cleanup
  const previewTimeoutRef = React.useRef(null);
  const previousUrlRef = React.useRef(null);
  
  const updatePreview = React.useCallback(async (plan) => {
    
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    // Set a new timeout for debouncing
    previewTimeoutRef.current = setTimeout(async () => {
      if (files.length === 0 || plan.length === 0) {
         // Clean up previous URL
         if (previousUrlRef.current && previousUrlRef.current !== originalPreviewUrl) {
           URL.revokeObjectURL(previousUrlRef.current);
         }
         setProcessedPreviewUrl(originalPreviewUrl);
         previousUrlRef.current = originalPreviewUrl;
         return;
      }
      
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('plan', JSON.stringify({ ops: plan }));
      
      try {
          const response = await axios.post(`${API_URL}/preview-image`, formData, { responseType: 'blob' });
          
          // Clean up previous URL
          if (previousUrlRef.current && previousUrlRef.current !== originalPreviewUrl) {
            URL.revokeObjectURL(previousUrlRef.current);
          }
          
          // Create new URL (blob URLs are already unique)
          const newUrl = URL.createObjectURL(response.data);
          setProcessedPreviewUrl(newUrl);
          previousUrlRef.current = newUrl;
      } catch (err) { 
          // Fallback to original on error
          setProcessedPreviewUrl(originalPreviewUrl);
      }
    }, 300);
  }, [files, originalPreviewUrl]);

  const getStepExplanation = async (step, profile) => {
    if (!learningMode) return;
    
    try {
      const formData = new FormData();
      formData.append('step', JSON.stringify(step));
      formData.append('profile', JSON.stringify(profile));
      formData.append('user_goal', userGoal);
      
      const response = await axios.post(`${API_URL}/explain-step`, formData);
      
      setExplanations(prev => ({
        ...prev,
        [step.op]: response.data.explanation
      }));
    } catch (err) {
      // Silently handle explanation errors
    }
  };

  useEffect(() => {
    if(llmPlan) {
        updatePreview(livePlan);
        
        // Get explanations for learning mode
        if (learningMode && llmPlan.profile) {
          livePlan.forEach(step => {
            getStepExplanation(step, llmPlan.profile);
          });
        }
    }
  }, [livePlan, updatePreview, llmPlan, learningMode]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current && previousUrlRef.current !== originalPreviewUrl) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [originalPreviewUrl]);

  return (
    <>
      {/* Header */}
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Title with Prism Effect */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: '800',
              background: 'linear-gradient(45deg, #8b5cf6 0%, #06b6d4 25%, #10b981 50%, #f59e0b 75%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.05em'
            }}>
              PRISM
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              fontWeight: '500',
              color: 'var(--text-light-gray)',
              marginTop: '-0.2rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              PReprocessing Intelligence for Structured & Media-data
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem 2rem',
        background: 'var(--gradient-bg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'var(--gradient-purple)',
          borderRadius: '50%',
          opacity: '0.1',
          filter: 'blur(40px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: 'var(--gradient-cyan)',
          borderRadius: '50%',
          opacity: '0.1',
          filter: 'blur(40px)'
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '800',
            marginBottom: '1.5rem',
            background: 'linear-gradient(45deg, #8b5cf6 0%, #06b6d4 25%, #10b981 50%, #f59e0b 75%, #ef4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1.1'
          }}>
            Enterprise Data Pipeline
          </h1>
          <p style={{ 
            fontSize: '1.3rem', 
            color: 'var(--text-light-gray)',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Advanced preprocessing intelligence system for heterogeneous data formats. 
            Automated transformation, validation, and optimization workflows for structured datasets, 
            multimedia content, and natural language processing pipelines.
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem'
            }}>
              📊 Tabular ETL
            </div>
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem'
            }}>
              🖼️ Computer Vision
            </div>
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem'
            }}>
              📝 NLP Pipeline
            </div>
          </div>
        </div>
      </section>

      <main className="main-layout">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="card">
            <h2>Upload & Configure</h2>
            <div
              {...getRootProps()}
              className={`file-dropzone ${isDragActive ? 'drag-active' : ''}`}
              style={{marginBottom: '1rem'}}
            >
              <input {...getInputProps()} />
              <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>📊</div>
              <p>Drop files or click to select</p>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-dark-gray)', 
                marginTop: '0.5rem' 
              }}>
                CSV, PDF, TXT, PNG, JPG, JPEG
              </div>
            </div>
            
            {/* Folder Upload Button */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                className="folder-upload-btn"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1rem',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: 'var(--text-white)',
                  transition: 'all 0.3s ease'
                }}>
                <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📁</span>
                Select Folder
                <input
                  type="file"
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFolderSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {files.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Compact File Summary */}
                <div 
                  className="file-summary"
                  onClick={() => setShowFileList(!showFileList)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: showFileList ? '0.5rem' : '0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>📁</span>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-white)', fontSize: '0.9rem' }}>
                        {files.length} file{files.length !== 1 ? 's' : ''} selected
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dark-gray)' }}>
                        {(files.reduce((acc, file) => acc + file.size, 0) / 1024).toFixed(1)} KB total
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-light-gray)'
                  }}>
                    <span>{showFileList ? '▼' : '▶'}</span>
                  </div>
                </div>
                
                {/* Expandable File List */}
                {showFileList && (
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '0.5rem'
                  }}>
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        borderBottom: index < files.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                      }}>
                        <div style={{ fontSize: '0.9rem' }}>
                          {file.type.startsWith('image/') ? '🖼️' : 
                           file.name.endsWith('.csv') ? '📊' : 
                           file.name.endsWith('.pdf') ? '📄' : '📝'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontWeight: '500', 
                            color: 'var(--text-white)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dark-gray)' }}>
                            {(file.size/1024).toFixed(1)} KB
                          </div>
                        </div>
                        <div style={{ 
                          background: 'var(--gradient-cyan)', 
                          padding: '0.2rem 0.4rem', 
                          borderRadius: '3px',
                          fontSize: '0.6rem',
                          fontWeight: '500'
                        }}>
                          Ready
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: 'var(--text-light-gray)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Processing Goal
              </label>
              <input 
                type="text" 
                value={userGoal} 
                onChange={(e) => setUserGoal(e.target.value)} 
                placeholder="e.g., Prepare images for classification model"
                style={{ marginBottom: '1rem' }}
              />
            </div>
            <button className="primary-button" onClick={handleGeneratePlan} disabled={isLoading || files.length === 0}>
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🧠</span>
                  Generate AI Plan
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Work Area - Controls and Preview Side by Side */}
        {llmPlan && (
          <div className="work-area">
            {/* Controls Panel */}
            <div className="controls-panel">
              <div className="card fade-in-slide" style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <h2>{dataType === 'image' ? 'Live Controls' : 'Data Processing Plan'}</h2>
                  {dataType === 'image' && (
                    <label className="learning-mode-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={learningMode} 
                        onChange={(e) => setLearningMode(e.target.checked)}
                        style={{ transform: 'scale(1.1)' }}
                      />
                      🤖 AI Learning
                    </label>
                  )}
                </div>
              
              {/* AI Plan Reasoning for Images Only */}
              {dataType === 'image' && llmPlan && (llmPlan.reasoning || llmPlan.notes) && (
                <div style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#8b5cf6'
                  }}>
                    <span style={{ fontSize: '1rem' }}>🧠</span>
                    AI's Initial Analysis
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    color: 'var(--text-light-gray)',
                    whiteSpace: 'pre-line'
                  }}>
                    {llmPlan.reasoning || llmPlan.notes}
                  </div>
                  {llmPlan.notes && llmPlan.reasoning && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                      color: 'var(--text-dark-gray)'
                    }}>
                      Summary: {llmPlan.notes}
                    </div>
                  )}
                </div>
              )}
              
              {/* Conditional Control Panels */}
              {dataType === 'image' ? (
                <ControlPanel 
                  llmPlan={llmPlan} 
                  livePlan={livePlan} 
                  setLivePlan={setLivePlan}
                  learningMode={learningMode}
                  explanations={explanations}
                  onStepChange={getStepExplanation}
                />
              ) : (
                <DataControlPanel 
                  llmPlan={llmPlan} 
                  livePlan={livePlan} 
                  setLivePlan={setLivePlan}
                  dataType={dataType}
                />
              )}
              <div style={{marginTop: '1.5rem'}}>
                <button className="primary-button" onClick={handleApplyPlanAndDownload} disabled={isLoading || files.length === 0 || !llmPlan}>
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🚀</span>
                      Apply & Download All
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>
            
            {/* Preview Panel */}
            <div className="preview-panel">
              <div className="card" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <h2>{dataType === 'image' ? 'Real-time Preview' : 'Data Review'}</h2>
              {llmPlan && (
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ 
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-purple)' }}>
                      {files.length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dark-gray)' }}>Files</div>
                  </div>
                  <div style={{ 
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                      {livePlan.length}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dark-gray)' }}>Steps</div>
                  </div>
                </div>
              )}
            </div>
            {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}
            
            {/* Conditional Preview/Review Content */}
            {dataType === 'image' ? (
              // Image Preview (existing logic)
              files.length > 0 ? (
                <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <div className="image-preview" style={{ display: 'flex', flex: 1, minHeight: '500px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        marginBottom: '0.75rem', 
                        color: 'var(--text-light-gray)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1rem' }}>📁</span>
                        Original
                      </div>
                      <div style={{
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '2px dashed rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <img 
                          src={originalPreviewUrl} 
                          alt="Original" 
                          className="fade-transition"
                          key={originalPreviewUrl}
                          style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        marginBottom: '0.75rem', 
                        color: 'var(--text-light-gray)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1rem' }}>✨</span>
                        AI Enhanced
                        {llmPlan && (
                          <div style={{
                            marginLeft: 'auto',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                          }}>
                            LIVE
                          </div>
                        )}
                      </div>
                      <div style={{
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        border: '2px dashed rgba(139, 92, 246, 0.3)', 
                        borderRadius: '8px', 
                        padding: '1rem', 
                        background: 'rgba(139, 92, 246, 0.05)',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <img 
                          src={processedPreviewUrl} 
                          alt="Preview" 
                          className="fade-transition"
                          key={processedPreviewUrl}
                          style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: 'var(--text-dark-gray)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload an image to begin</p>
                  <p style={{ fontSize: '0.9rem' }}>Live preview will appear here</p>
                </div>
              )
            ) : (
              // Data Review for CSV/Text
              <DataReview 
                llmPlan={llmPlan}
                dataPreview={dataPreview}
                dataType={dataType}
              />
            )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '2rem',
        marginTop: '3rem',
        fontSize: '0.9rem',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: 'var(--text-light-gray)'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: 'linear-gradient(45deg, #8b5cf6, #06b6d4, #10b981)',
            borderRadius: '2px',
            opacity: 0.7
          }}></div>
          <span style={{ fontWeight: '600' }}>PRISM</span>
          <span style={{ opacity: 0.7 }}>•</span>
          <span>PReprocessing Intelligence for Structured & Media-data</span>
          <span style={{ opacity: 0.7 }}>•</span>
          <span style={{ fontSize: '0.8rem' }}>v2.0.0</span>
        </div>
      </footer>
    </>
  );
}

export default App;