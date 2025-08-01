import React from 'react';

const HeroSection = () => {
  return (
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
  );
};

export default HeroSection;