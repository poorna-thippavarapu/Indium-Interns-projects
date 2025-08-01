import React from 'react';

const ImagePreview = ({ files, originalPreviewUrl, processedPreviewUrl, llmPlan }) => {
  if (files.length === 0) {
    return (
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
    );
  }

  return (
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
  );
};

export default ImagePreview;