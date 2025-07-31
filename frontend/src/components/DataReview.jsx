import React, { useState } from 'react';

function DataReview({ llmPlan, dataPreview, dataType }) {
  const [activeTab, setActiveTab] = useState('preview');

  if (!llmPlan || !dataPreview) {
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
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {dataType === 'csv' ? '📊' : '📝'}
        </div>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Upload {dataType === 'csv' ? 'a CSV file' : 'a text document'} to begin
        </p>
        <p style={{ fontSize: '0.9rem' }}>Data review will appear here</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('preview')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'preview' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
            color: activeTab === 'preview' ? '#8b5cf6' : 'var(--text-light-gray)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          📋 Data Preview
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'profile' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
            color: activeTab === 'profile' ? '#06b6d4' : 'var(--text-light-gray)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          📈 Data Profile
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'preview' && (
          <div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              color: 'var(--text-white)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📋</span>
              {dataType === 'csv' ? 'Processed Data Preview' : 'Processed Text Preview'}
            </h3>
            
            {dataType === 'csv' ? (
              <div style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                overflow: 'auto'
              }}>
                {Object.keys(dataPreview).length > 0 ? (
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '0.8rem'
                  }}>
                    <thead>
                      <tr style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                        {Object.keys(dataPreview).map(column => (
                          <th key={column} style={{ 
                            padding: '0.75rem 0.5rem',
                            textAlign: 'left',
                            color: '#8b5cf6',
                            fontWeight: '600',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(...Object.values(dataPreview).map(arr => arr.length)) }).map((_, rowIndex) => (
                        <tr key={rowIndex} style={{ 
                          borderBottom: rowIndex % 2 === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                        }}>
                          {Object.keys(dataPreview).map(column => (
                            <td key={column} style={{ 
                              padding: '0.5rem',
                              color: 'var(--text-light-gray)',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {dataPreview[column][rowIndex] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dark-gray)' }}>
                    No data preview available
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: '1.4',
                color: 'var(--text-light-gray)',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {dataPreview || 'No text preview available'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && llmPlan.profile && (
          <div>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              color: 'var(--text-white)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📈</span>
              Data Statistics
            </h3>
            
            <div style={{ 
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
            }}>
              {Object.entries(llmPlan.profile).map(([key, value]) => (
                <div key={key} style={{ 
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: '#06b6d4',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    textTransform: 'capitalize'
                  }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem',
                    color: 'var(--text-white)',
                    fontWeight: '500'
                  }}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataReview;