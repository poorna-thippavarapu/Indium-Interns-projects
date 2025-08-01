import React from 'react';
import { useDropzone } from 'react-dropzone';

const UploadSection = ({ 
  files, 
  userGoal, 
  setUserGoal, 
  showFileList, 
  setShowFileList, 
  onDrop, 
  handleFolderSelect, 
  handleGeneratePlan, 
  isLoading,
  resetPlan 
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, resetPlan),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/*': ['.txt', '.csv'],
      'application/pdf': ['.pdf']
    }
  });

  return (
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
              onChange={(e) => handleFolderSelect(e, resetPlan)}
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
        
        <button 
          className="primary-button" 
          onClick={() => handleGeneratePlan(files, userGoal)} 
          disabled={isLoading || files.length === 0}
        >
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
  );
};

export default UploadSection;