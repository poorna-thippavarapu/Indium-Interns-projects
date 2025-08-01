import React from 'react';

const NormalizeControls = ({ 
  normalizeOp, 
  onToggle, 
  onChange, 
  learningMode, 
  explanations, 
  expandedExplanations, 
  setExpandedExplanations 
}) => {
  return (
    <div style={{ 
      background: 'rgba(16, 185, 129, 0.05)', 
      border: '1px solid rgba(16, 185, 129, 0.2)', 
      borderRadius: '12px', 
      padding: '1rem' 
    }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: normalizeOp ? '1rem' : '0',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-white)',
        cursor: 'pointer'
      }}>
        <input 
          type="checkbox" 
          checked={!!normalizeOp} 
          onChange={(e) => onToggle('normalize', e.target.checked)}
          style={{ 
            transform: 'scale(1.3)',
            accentColor: '#10b981'
          }}
        />
        <span style={{ fontSize: '1.1rem' }}>📊</span>
        Normalize Values
      </label>
      
      {normalizeOp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: normalizeOp.method === 'minmax' ? '2px solid #10b981' : '2px solid rgba(16, 185, 129, 0.2)',
              background: normalizeOp.method === 'minmax' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.05)',
              transition: 'all 0.2s ease',
              fontWeight: '600',
              boxShadow: normalizeOp.method === 'minmax' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none'
            }}>
              <input 
                type="radio" 
                name="normalize" 
                value="minmax" 
                checked={normalizeOp.method === 'minmax'} 
                onChange={e => onChange('normalize', 'method', e.target.value)}
                style={{ accentColor: '#10b981' }}
              /> 
              Min-Max (0-1)
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: normalizeOp.method === 'zscore' ? '2px solid #10b981' : '2px solid rgba(16, 185, 129, 0.2)',
              background: normalizeOp.method === 'zscore' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.05)',
              transition: 'all 0.2s ease',
              fontWeight: '600',
              boxShadow: normalizeOp.method === 'zscore' ? '0 2px 8px rgba(16, 185, 129, 0.2)' : 'none'
            }}>
              <input 
                type="radio" 
                name="normalize" 
                value="zscore" 
                checked={normalizeOp.method === 'zscore'} 
                onChange={e => onChange('normalize', 'method', e.target.value)}
                style={{ accentColor: '#10b981' }}
              /> 
              Z-Score
            </label>
          </div>
          
          {learningMode && (
            <div style={{ marginTop: '0.5rem' }}>
              <div 
                onClick={() => setExpandedExplanations(prev => ({ ...prev, normalize: !prev.normalize }))}
                style={{ 
                  color: '#10b981', 
                  fontSize: '0.85em', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(16, 185, 129, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(16, 185, 129, 0.08)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🤖 AI Explanation {expandedExplanations.normalize ? '▼' : '▶'}
                {!explanations.normalize && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Click "Explain to me")</span>}
              </div>
              {expandedExplanations.normalize && explanations.normalize && (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginTop: '0.5rem',
                  fontSize: '0.85em',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                }}>
                  {explanations.normalize}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NormalizeControls;