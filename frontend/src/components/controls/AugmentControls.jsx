import React from 'react';

const AugmentControls = ({ 
  augmentOp, 
  onToggle, 
  onChange, 
  learningMode, 
  explanations, 
  expandedExplanations, 
  setExpandedExplanations 
}) => {
  return (
    <div style={{ 
      background: 'rgba(245, 101, 101, 0.05)', 
      border: '1px solid rgba(245, 101, 101, 0.2)', 
      borderRadius: '12px', 
      padding: '1rem' 
    }}>
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem',
        marginBottom: augmentOp ? '1rem' : '0',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-white)',
        cursor: 'pointer'
      }}>
        <input 
          type="checkbox" 
          checked={!!augmentOp} 
          onChange={(e) => onToggle('augment', e.target.checked)}
          style={{ 
            transform: 'scale(1.3)',
            accentColor: '#f56565'
          }}
        />
        <span style={{ fontSize: '1.1rem' }}>🎨</span>
        Data Augmentation
      </label>
      
      {augmentOp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Rotation */}
          <div style={{ 
            background: 'rgba(245, 101, 101, 0.05)', 
            border: '1px solid rgba(245, 101, 101, 0.15)', 
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
              Rotation: <span style={{ 
                color: '#f56565', 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'rgba(245, 101, 101, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                marginLeft: '0.5rem'
              }}>{augmentOp.rotation || 0}°</span>
            </label>
            <input 
              type="range" 
              min="-180" 
              max="180" 
              value={augmentOp.rotation || 0} 
              onChange={e => onChange('augment', 'rotation', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #f56565 0%, #f56565 ${((augmentOp.rotation || 0) + 180) / 360 * 100}%, rgba(245, 101, 101, 0.2) ${((augmentOp.rotation || 0) + 180) / 360 * 100}%, rgba(245, 101, 101, 0.2) 100%)`,
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
              <span style={{ color: 'rgba(245, 101, 101, 0.8)' }}>-180°</span>
              <span style={{ color: 'rgba(245, 101, 101, 0.8)' }}>180°</span>
            </div>
          </div>
          
          {/* Zoom */}
          <div style={{ 
            background: 'rgba(245, 101, 101, 0.05)', 
            border: '1px solid rgba(245, 101, 101, 0.15)', 
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
              Zoom: <span style={{ 
                color: '#f56565', 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'rgba(245, 101, 101, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                marginLeft: '0.5rem'
              }}>{augmentOp.zoom || 1.0}x</span>
            </label>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.1" 
              value={augmentOp.zoom || 1.0} 
              onChange={e => onChange('augment', 'zoom', parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #f56565 0%, #f56565 ${((augmentOp.zoom || 1.0) - 0.1) / 1.9 * 100}%, rgba(245, 101, 101, 0.2) ${((augmentOp.zoom || 1.0) - 0.1) / 1.9 * 100}%, rgba(245, 101, 101, 0.2) 100%)`,
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
              <span style={{ color: 'rgba(245, 101, 101, 0.8)' }}>0.1x</span>
              <span style={{ color: 'rgba(245, 101, 101, 0.8)' }}>2.0x</span>
            </div>
          </div>

          {/* Horizontal and Vertical Shifts */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '500', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.25rem'
              }}>
                H-Shift: <span style={{ color: '#f56565', fontWeight: 'bold' }}>{((augmentOp.h_shift || 0) * 100).toFixed(0)}%</span>
              </label>
              <input 
                type="range" 
                min="-0.3" 
                max="0.3" 
                step="0.05" 
                value={augmentOp.h_shift || 0} 
                onChange={e => onChange('augment', 'h_shift', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(245, 101, 101, 0.2)',
                  outline: 'none',
                  accentColor: '#f56565'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '500', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.25rem'
              }}>
                V-Shift: <span style={{ color: '#f56565', fontWeight: 'bold' }}>{((augmentOp.v_shift || 0) * 100).toFixed(0)}%</span>
              </label>
              <input 
                type="range" 
                min="-0.3" 
                max="0.3" 
                step="0.05" 
                value={augmentOp.v_shift || 0} 
                onChange={e => onChange('augment', 'v_shift', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(245, 101, 101, 0.2)',
                  outline: 'none',
                  accentColor: '#f56565'
                }}
              />
            </div>
          </div>

          {/* Flip Controls */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: augmentOp.h_flip ? '2px solid #f56565' : '2px solid rgba(245, 101, 101, 0.2)',
              background: augmentOp.h_flip ? 'rgba(245, 101, 101, 0.15)' : 'rgba(245, 101, 101, 0.05)',
              flex: 1,
              transition: 'all 0.2s ease',
              fontWeight: '600',
              boxShadow: augmentOp.h_flip ? '0 2px 8px rgba(245, 101, 101, 0.2)' : 'none'
            }}>
              <input 
                type="checkbox" 
                checked={!!augmentOp.h_flip} 
                onChange={e => onChange('augment', 'h_flip', e.target.checked)}
                style={{ accentColor: '#f56565' }}
              />
              🔄 Horizontal Flip
            </label>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: augmentOp.v_flip ? '2px solid #f56565' : '2px solid rgba(245, 101, 101, 0.2)',
              background: augmentOp.v_flip ? 'rgba(245, 101, 101, 0.15)' : 'rgba(245, 101, 101, 0.05)',
              flex: 1,
              transition: 'all 0.2s ease',
              fontWeight: '600',
              boxShadow: augmentOp.v_flip ? '0 2px 8px rgba(245, 101, 101, 0.2)' : 'none'
            }}>
              <input 
                type="checkbox" 
                checked={!!augmentOp.v_flip} 
                onChange={e => onChange('augment', 'v_flip', e.target.checked)}
                style={{ accentColor: '#f56565' }}
              />
              🔁 Vertical Flip
            </label>
          </div>
          
          {learningMode && (
            <div style={{ marginTop: '0.5rem' }}>
              <div 
                onClick={() => setExpandedExplanations(prev => ({ ...prev, augment: !prev.augment }))}
                style={{ 
                  color: '#f56565', 
                  fontSize: '0.85em', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(245, 101, 101, 0.08)',
                  border: '1px solid rgba(245, 101, 101, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  marginTop: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(245, 101, 101, 0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(245, 101, 101, 0.08)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🤖 AI Explanation {expandedExplanations.augment ? '▼' : '▶'}
                {!explanations.augment && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Click "Explain to me")</span>}
              </div>
              {expandedExplanations.augment && explanations.augment && (
                <div style={{ 
                  background: 'rgba(245, 101, 101, 0.1)', 
                  border: '1px solid rgba(245, 101, 101, 0.2)', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginTop: '0.5rem',
                  fontSize: '0.85em',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 8px rgba(245, 101, 101, 0.1)'
                }}>
                  {explanations.augment}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AugmentControls;