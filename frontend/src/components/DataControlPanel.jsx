import React, { useState } from 'react';

function DataControlPanel({ llmPlan, livePlan, setLivePlan, dataType }) {
  const [expandedPlan, setExpandedPlan] = useState(false);
  
  if (dataType === 'image') {
    return null; // Use the regular ControlPanel for images
  }

  return (
    <div className="data-control-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* LLM Generated Plan Display */}
      <div style={{ 
        background: 'rgba(139, 92, 246, 0.05)', 
        border: '1px solid rgba(139, 92, 246, 0.2)', 
        borderRadius: '12px', 
        padding: '1rem' 
      }}>
        <div 
          onClick={() => setExpandedPlan(!expandedPlan)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--text-white)',
            marginBottom: expandedPlan ? '1rem' : '0'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🧠</span>
          AI Generated Plan
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
            {expandedPlan ? '▼' : '▶'}
          </span>
        </div>
        
        {expandedPlan && (
          <div style={{ 
            background: 'rgba(139, 92, 246, 0.1)', 
            border: '1px solid rgba(139, 92, 246, 0.2)', 
            borderRadius: '8px', 
            padding: '1rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#8b5cf6' }}>Operations:</strong>
              <div style={{ marginTop: '0.5rem' }}>
                {llmPlan?.ops?.map((op, index) => (
                  <div key={index} style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '0.5rem', 
                    borderRadius: '4px', 
                    marginBottom: '0.5rem',
                    fontSize: '0.8rem'
                  }}>
                    <strong>{op.op}</strong>
                    {Object.entries(op).filter(([k, v]) => k !== 'op').map(([key, value]) => (
                      <div key={key} style={{ marginLeft: '1rem', color: 'var(--text-light-gray)' }}>
                        {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {llmPlan?.notes && (
              <div>
                <strong style={{ color: '#8b5cf6' }}>AI Notes:</strong>
                <div style={{ 
                  marginTop: '0.5rem', 
                  color: 'var(--text-light-gray)',
                  fontStyle: 'italic'
                }}>
                  {llmPlan.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan Status */}
      <div style={{ 
        background: 'rgba(16, 185, 129, 0.05)', 
        border: '1px solid rgba(16, 185, 129, 0.2)', 
        borderRadius: '12px', 
        padding: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: '#10b981',
          marginBottom: '0.5rem'
        }}>
          ✅ Plan Ready
        </div>
        <div style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-light-gray)'
        }}>
          {livePlan.length} operation{livePlan.length !== 1 ? 's' : ''} configured for {dataType.toUpperCase()} processing
        </div>
      </div>

      {/* Data Type Info */}
      <div style={{ 
        background: 'rgba(6, 182, 212, 0.05)', 
        border: '1px solid rgba(6, 182, 212, 0.2)', 
        borderRadius: '12px', 
        padding: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'var(--text-white)',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>
            {dataType === 'csv' ? '📊' : '📝'}
          </span>
          {dataType === 'csv' ? 'Tabular Data Processing' : 'Text Data Processing'}
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-light-gray)',
          lineHeight: '1.4'
        }}>
          {dataType === 'csv' 
            ? 'Operations will be applied to clean and prepare your CSV data for machine learning.'
            : 'Text operations will clean and preprocess your documents for NLP tasks.'
          }
        </div>
      </div>
    </div>
  );
}

export default DataControlPanel;