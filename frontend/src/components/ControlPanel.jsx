import React, { useState } from 'react';

// Helper to find an operation in the plan array
const findOp = (plan, opName) => plan.find(op => op.op === opName);

function ControlPanel({ llmPlan, livePlan, setLivePlan, learningMode = false, explanations = {}, onStepChange }) {
  const [expandedExplanations, setExpandedExplanations] = useState({});
  
  const handleToggle = (opName, checked) => {
    let newPlan = [...livePlan];
    if (checked) {
      // Add the operation if it doesn't exist
      if (!findOp(newPlan, opName)) {
        // Get default values from LLM plan or use hardcoded defaults
        const defaultOp = llmPlan.ops.find(op => op.op === opName) || { op: opName };
        newPlan.push({ ...defaultOp });
        
        // Auto-expand explanation and request it for newly added operations
        if (learningMode && onStepChange) {
          setExpandedExplanations(prev => ({ ...prev, [opName]: true }));
          onStepChange(defaultOp, llmPlan?.profile || {});
        }
      }
    } else {
      // Remove the operation
      newPlan = newPlan.filter(op => op.op !== opName);
      // Clear explanation when removing operation
      setExpandedExplanations(prev => ({ ...prev, [opName]: false }));
    }
    
    setLivePlan(newPlan);
  };

  const handleChange = (opName, param, value) => {
    const newPlan = livePlan.map(op => {
      if (op.op === opName) {
        return { ...op, [param]: value };
      }
      return op;
    });
    
    setLivePlan(newPlan);
    
    // Trigger explanation if learning mode is on
    if (learningMode && onStepChange) {
      const updatedStep = newPlan.find(op => op.op === opName);
      if (updatedStep) {
        onStepChange(updatedStep, llmPlan?.profile || {});
        // Auto-expand explanation when parameter changes
        setExpandedExplanations(prev => ({ ...prev, [opName]: true }));
      }
    }
  };

  // Get current values for UI, with fallbacks
  const resizeOp = findOp(livePlan, 'resize');
  const denoiseOp = findOp(livePlan, 'denoise');
  const normalizeOp = findOp(livePlan, 'normalize');
  const augmentOp = findOp(livePlan, 'augment');

  return (
    <div className="control-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Resize Controls */}
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
            onChange={(e) => handleToggle('resize', e.target.checked)}
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
                  fontWeight: '500', 
                  color: 'var(--text-light-gray)',
                  marginBottom: '0.25rem'
                }}>
                  Width (px)
                </label>
                <input 
                  type="number" 
                  value={resizeOp.width || 224} 
                  onChange={e => handleChange('resize', 'width', parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-white)',
                    fontSize: '0.9rem'
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
                  Height (px)
                </label>
                <input 
                  type="number" 
                  value={resizeOp.height || 224} 
                  onChange={e => handleChange('resize', 'height', parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-white)',
                    fontSize: '0.9rem'
                  }}
                />
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
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🤖 AI Explanation {expandedExplanations.resize ? '▼' : '▶'}
                  {!explanations.resize && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Loading...)</span>}
                </div>
                {expandedExplanations.resize && explanations.resize && (
                  <div style={{ 
                    background: 'rgba(139, 92, 246, 0.1)', 
                    border: '1px solid rgba(139, 92, 246, 0.2)', 
                    borderRadius: '6px', 
                    padding: '8px', 
                    marginTop: '4px',
                    fontSize: '0.8em',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.4'
                  }}>
                    {explanations.resize}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Denoise Controls */}
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
            onChange={(e) => handleToggle('denoise', e.target.checked)}
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
                fontWeight: '500', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.25rem'
              }}>
                Method
              </label>
              <select 
                value={denoiseOp.method || 'gaussian'} 
                onChange={e => handleChange('denoise', 'method', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-white)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="gaussian">Gaussian Blur</option>
                <option value="median">Median Filter</option>
                <option value="bilateral">Bilateral Filter</option>
              </select>
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '500', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.25rem'
              }}>
                Kernel Size: <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{denoiseOp.ksize || 5}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="31" 
                step="2" 
                value={denoiseOp.ksize || 5} 
                onChange={e => handleChange('denoise', 'ksize', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  outline: 'none',
                  accentColor: '#06b6d4'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dark-gray)', marginTop: '0.25rem' }}>
                <span>1</span>
                <span>31</span>
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
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🤖 AI Explanation {expandedExplanations.denoise ? '▼' : '▶'}
                  {!explanations.denoise && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Loading...)</span>}
                </div>
                {expandedExplanations.denoise && explanations.denoise && (
                  <div style={{ 
                    background: 'rgba(6, 182, 212, 0.1)', 
                    border: '1px solid rgba(6, 182, 212, 0.2)', 
                    borderRadius: '6px', 
                    padding: '8px', 
                    marginTop: '4px',
                    fontSize: '0.8em',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.4'
                  }}>
                    {explanations.denoise}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Normalize Controls */}
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
            onChange={(e) => handleToggle('normalize', e.target.checked)}
            style={{ 
              transform: 'scale(1.3)',
              accentColor: '#10b981'
            }}
          />
          <span style={{ fontSize: '1.1rem' }}>📊</span>
          Normalize Values
        </label>
        {normalizeOp && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              border: normalizeOp.method === 'minmax' ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
              background: normalizeOp.method === 'minmax' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
            }}>
              <input 
                type="radio" 
                name="normalize" 
                value="minmax" 
                checked={normalizeOp.method === 'minmax'} 
                onChange={e => handleChange('normalize', 'method', e.target.value)}
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
              padding: '0.5rem',
              borderRadius: '6px',
              border: normalizeOp.method === 'zscore' ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
              background: normalizeOp.method === 'zscore' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
            }}>
              <input 
                type="radio" 
                name="normalize" 
                value="zscore" 
                checked={normalizeOp.method === 'zscore'} 
                onChange={e => handleChange('normalize', 'method', e.target.value)}
                style={{ accentColor: '#10b981' }}
              /> 
              Z-Score
            </label>
          </div>
        )}
        {normalizeOp && learningMode && (
          <div style={{ marginTop: '0.5rem' }}>
            <div 
              onClick={() => setExpandedExplanations(prev => ({ ...prev, normalize: !prev.normalize }))}
              style={{ 
                color: '#10b981', 
                fontSize: '0.85em', 
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🤖 AI Explanation {expandedExplanations.normalize ? '▼' : '▶'}
              {!explanations.normalize && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Loading...)</span>}
            </div>
            {expandedExplanations.normalize && explanations.normalize && (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: '6px', 
                padding: '8px', 
                marginTop: '4px',
                fontSize: '0.8em',
                whiteSpace: 'pre-line',
                lineHeight: '1.4'
              }}>
                {explanations.normalize}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Augment Controls */}
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
            onChange={(e) => handleToggle('augment', e.target.checked)}
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
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '500', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.25rem'
              }}>
                Rotation: <span style={{ color: '#f56565', fontWeight: 'bold' }}>{augmentOp.rotation || 0}°</span>
              </label>
              <input 
                type="range" 
                min="-180" 
                max="180" 
                value={augmentOp.rotation || 0} 
                onChange={e => handleChange('augment', 'rotation', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(245, 101, 101, 0.2)',
                  outline: 'none',
                  accentColor: '#f56565'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dark-gray)', marginTop: '0.25rem' }}>
                <span>-180°</span>
                <span>180°</span>
              </div>
            </div>
            
            {/* Zoom */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.85rem', 
                fontWeight: '500', 
                color: 'var(--text-light-gray)',
                marginBottom: '0.25rem'
              }}>
                Zoom: <span style={{ color: '#f56565', fontWeight: 'bold' }}>{augmentOp.zoom || 1.0}x</span>
              </label>
              <input 
                type="range" 
                min="0.1" 
                max="2.0" 
                step="0.1" 
                value={augmentOp.zoom || 1.0} 
                onChange={e => handleChange('augment', 'zoom', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'rgba(245, 101, 101, 0.2)',
                  outline: 'none',
                  accentColor: '#f56565'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dark-gray)', marginTop: '0.25rem' }}>
                <span>0.1x</span>
                <span>2.0x</span>
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
                  onChange={e => handleChange('augment', 'h_shift', parseFloat(e.target.value))}
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
                  onChange={e => handleChange('augment', 'v_shift', parseFloat(e.target.value))}
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
                padding: '0.5rem',
                borderRadius: '6px',
                border: augmentOp.h_flip ? '2px solid #f56565' : '1px solid rgba(245, 101, 101, 0.3)',
                background: augmentOp.h_flip ? 'rgba(245, 101, 101, 0.1)' : 'transparent',
                flex: 1
              }}>
                <input 
                  type="checkbox" 
                  checked={!!augmentOp.h_flip} 
                  onChange={e => handleChange('augment', 'h_flip', e.target.checked)}
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
                padding: '0.5rem',
                borderRadius: '6px',
                border: augmentOp.v_flip ? '2px solid #f56565' : '1px solid rgba(245, 101, 101, 0.3)',
                background: augmentOp.v_flip ? 'rgba(245, 101, 101, 0.1)' : 'transparent',
                flex: 1
              }}>
                <input 
                  type="checkbox" 
                  checked={!!augmentOp.v_flip} 
                  onChange={e => handleChange('augment', 'v_flip', e.target.checked)}
                  style={{ accentColor: '#f56565' }}
                />
                🔁 Vertical Flip
              </label>
            </div>
          </div>
        )}
        {augmentOp && learningMode && (
          <div style={{ marginTop: '0.5rem' }}>
            <div 
              onClick={() => setExpandedExplanations(prev => ({ ...prev, augment: !prev.augment }))}
              style={{ 
                color: '#f56565', 
                fontSize: '0.85em', 
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🤖 AI Explanation {expandedExplanations.augment ? '▼' : '▶'}
              {!explanations.augment && <span style={{fontSize: '0.7em', opacity: 0.7}}>(Loading...)</span>}
            </div>
            {expandedExplanations.augment && explanations.augment && (
              <div style={{ 
                background: 'rgba(245, 101, 101, 0.1)', 
                border: '1px solid rgba(245, 101, 101, 0.2)', 
                borderRadius: '6px', 
                padding: '8px', 
                marginTop: '4px',
                fontSize: '0.8em',
                whiteSpace: 'pre-line',
                lineHeight: '1.4'
              }}>
                {explanations.augment}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
export default ControlPanel; 