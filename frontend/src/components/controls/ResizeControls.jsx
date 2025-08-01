import React from 'react';

const ResizeControls = ({ 
  resizeOp, 
  onToggle, 
  onChange, 
  learningMode, 
  explanations, 
  expandedExplanations, 
  setExpandedExplanations 
}) => {
  return (
    <div style={{ 
      background: 'rgba(139, 92, 246, 0.05)', 
      border: '1px solid rgba(139, 92, 246, 0.2)', 
      borderRadius: '12px', 
      padding: '1rem' 
    }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: resizeOp ? '1rem' : '0',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-white)',
        cursor: 'pointer'
      }}>
        <input 
          type="checkbox" 
          checked={!!resizeOp} 
          onChange={(e) => onToggle('resize', e.target.checked)}
          style={{ 
            transform: 'scale(1.3)',
            accentColor: '#8b5cf6'
          }}
        />
        <span style={{ fontSize: '1.1rem' }}>📏</span>
        Resize Image
      </label>
      
      {resizeOp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.5rem'
              }}>
                Width (px)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  value={resizeOp.width || 224} 
                  onChange={e => onChange('resize', 'width', parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    color: 'var(--text-white)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.1)';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.8rem',
                  color: 'rgba(139, 92, 246, 0.7)',
                  pointerEvents: 'none'
                }}>px</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.5rem'
              }}>
                Height (px)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  value={resizeOp.height || 224} 
                  onChange={e => onChange('resize', 'height', parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid rgba(139, 92, 246, 0.2)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    color: 'var(--text-white)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.1)';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.8rem',
                  color: 'rgba(139, 92, 246, 0.7)',
                  pointerEvents: 'none'
                }}>px</div>
              </div>
            </div>
          </div>
          
          {learningMode && (
            <div style={{ marginTop: '0.5rem' }}>
              <div 
                onClick={() => setExpandedExplanations(prev => ({ ...prev, resize: !prev.resize }))}
                style={{ 
                  color: '#8b5cf6', 
                  fontSize: '0.85em', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(139, 92, 246, 0.08)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🤖 AI Explanation {expandedExplanations.resize ? '▼' : '▶'}
                {!explanations.resize && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Click "Explain to me")</span>}
              </div>
              {expandedExplanations.resize && explanations.resize && (
                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  border: '1px solid rgba(139, 92, 246, 0.2)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginTop: '0.5rem',
                  fontSize: '0.85em',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
                }}>
                  {explanations.resize}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResizeControls;