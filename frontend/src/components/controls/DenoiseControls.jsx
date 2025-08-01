import React from 'react';

const DenoiseControls = ({ 
  denoiseOp, 
  onToggle, 
  onChange, 
  learningMode, 
  explanations, 
  expandedExplanations, 
  setExpandedExplanations 
}) => {
  return (
    <div style={{ 
      background: 'rgba(6, 182, 212, 0.05)', 
      border: '1px solid rgba(6, 182, 212, 0.2)', 
      borderRadius: '12px', 
      padding: '1rem' 
    }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: denoiseOp ? '1rem' : '0',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-white)',
        cursor: 'pointer'
      }}>
        <input 
          type="checkbox" 
          checked={!!denoiseOp} 
          onChange={(e) => onToggle('denoise', e.target.checked)}
          style={{ 
            transform: 'scale(1.3)',
            accentColor: '#06b6d4'
          }}
        />
        <span style={{ fontSize: '1.1rem' }}>🔧</span>
        Denoise Image
      </label>
      
      {denoiseOp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              fontWeight: '600', 
              color: 'var(--text-light-gray)',
              marginBottom: '0.5rem'
            }}>
              Denoising Method
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                value={denoiseOp.method || 'gaussian'} 
                onChange={e => onChange('denoise', 'method', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '0.75rem 1rem',
                  paddingRight: '3rem',
                  borderRadius: '10px',
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  color: 'var(--text-white)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(6, 182, 212, 0.1)',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1), 0 4px 12px rgba(6, 182, 212, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(6, 182, 212, 0.2)';
                  e.target.style.boxShadow = '0 2px 8px rgba(6, 182, 212, 0.1)';
                }}
              >
                <option value="gaussian" style={{ background: '#1a1a1a', color: 'white' }}>🌊 Gaussian Blur</option>
                <option value="median" style={{ background: '#1a1a1a', color: 'white' }}>🎯 Median Filter</option>
                <option value="bilateral" style={{ background: '#1a1a1a', color: 'white' }}>⚡ Bilateral Filter</option>
              </select>
              <div style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1rem',
                color: 'rgba(6, 182, 212, 0.7)',
                pointerEvents: 'none'
              }}>▼</div>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(6, 182, 212, 0.05)', 
            border: '1px solid rgba(6, 182, 212, 0.15)', 
            borderRadius: '10px', 
            padding: '1rem' 
          }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.85rem', 
              fontWeight: '600', 
              color: 'var(--text-light-gray)',
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}>
              Kernel Size: <span style={{ 
                color: '#06b6d4', 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'rgba(6, 182, 212, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                marginLeft: '0.5rem'
              }}>{denoiseOp.ksize || 5}</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="31" 
              step="2" 
              value={denoiseOp.ksize || 5} 
              onChange={e => onChange('denoise', 'ksize', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((denoiseOp.ksize || 5) - 1) / 30 * 100}%, rgba(6, 182, 212, 0.2) ${((denoiseOp.ksize || 5) - 1) / 30 * 100}%, rgba(6, 182, 212, 0.2) 100%)`,
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '0.75rem', 
              color: 'var(--text-dark-gray)', 
              marginTop: '0.5rem',
              fontWeight: '500'
            }}>
              <span style={{ color: 'rgba(6, 182, 212, 0.8)' }}>Fine</span>
              <span style={{ color: 'rgba(6, 182, 212, 0.8)' }}>Aggressive</span>
            </div>
          </div>
          
          {learningMode && (
            <div style={{ marginTop: '0.5rem' }}>
              <div 
                onClick={() => setExpandedExplanations(prev => ({ ...prev, denoise: !prev.denoise }))}
                style={{ 
                  color: '#06b6d4', 
                  fontSize: '0.85em', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(6, 182, 212, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(6, 182, 212, 0.08)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🤖 AI Explanation {expandedExplanations.denoise ? '▼' : '▶'}
                {!explanations.denoise && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Click "Explain to me")</span>}
              </div>
              {expandedExplanations.denoise && explanations.denoise && (
                <div style={{ 
                  background: 'rgba(6, 182, 212, 0.1)', 
                  border: '1px solid rgba(6, 182, 212, 0.2)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginTop: '0.5rem',
                  fontSize: '0.85em',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(6, 182, 212, 0.1)'
                }}>
                  {explanations.denoise}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DenoiseControls;