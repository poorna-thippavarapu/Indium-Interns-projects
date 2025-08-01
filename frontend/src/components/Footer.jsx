import React from 'react';

const Footer = () => {
  return (
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
  );
};

export default Footer;