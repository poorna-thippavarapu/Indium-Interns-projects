import React from 'react';

const Header = () => {
  return (
    <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
  );
};

export default Header;