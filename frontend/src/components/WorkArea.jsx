import React from 'react';
import ControlPanel from './ControlPanel';
import DataControlPanel from './DataControlPanel';
import ImagePreview from './ImagePreview';
import DataReview from './DataReview';

const WorkArea = ({ 
  llmPlan, 
  livePlan, 
  setLivePlan,
  dataType,
  learningMode,
  setLearningMode,
  explanations,
  getStepExplanation,
  explainAllSteps,
  clearExplanations,
  userGoal,
  files,
  error,
  isLoading,
  handleApplyPlanAndDownload,
  originalPreviewUrl,
  processedPreviewUrl,
  dataPreview
}) => {
  if (!llmPlan) return null;

  return (
    <div className="work-area">
      {/* Controls Panel */}
      <div className="controls-panel">
        <div className="card fade-in-slide" style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2>{dataType === 'image' ? 'Live Controls' : 'Data Processing Plan'}</h2>
            {dataType === 'image' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label className="learning-mode-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <input 
                    type="checkbox" 
                    checked={learningMode} 
                    onChange={(e) => setLearningMode(e.target.checked)}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  🤖 AI Learning
                </label>
                {learningMode && (
                  <button 
                    className="secondary-button"
                    onClick={explainAllSteps}
                    style={{ 
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15))',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      borderRadius: '8px',
                      color: 'var(--accent-purple)',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(139, 92, 246, 0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(168, 85, 247, 0.25))';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.15))';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.1)';
                    }}
                    onMouseDown={(e) => {
                      e.target.style.transform = 'translateY(0) scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.target.style.transform = 'translateY(-1px) scale(1)';
                    }}
                  >
                    💡 Explain to me
                  </button>
                )}
              </div>
            )}
          </div>
        
          {/* AI Plan Reasoning for Images Only */}
          {dataType === 'image' && llmPlan && (llmPlan.reasoning || llmPlan.notes) && (
            <div style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#8b5cf6'
              }}>
                <span style={{ fontSize: '1rem' }}>🧠</span>
                AI's Initial Analysis
              </div>
              <div style={{
                fontSize: '0.9rem',
                lineHeight: '1.5',
                color: 'var(--text-light-gray)',
                whiteSpace: 'pre-line'
              }}>
                {llmPlan.reasoning || llmPlan.notes}
              </div>
              {llmPlan.notes && llmPlan.reasoning && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  fontStyle: 'italic',
                  color: 'var(--text-dark-gray)'
                }}>
                  Summary: {llmPlan.notes}
                </div>
              )}
            </div>
          )}
          
          {/* Conditional Control Panels */}
          {dataType === 'image' ? (
            <ControlPanel 
              llmPlan={llmPlan} 
              livePlan={livePlan} 
              setLivePlan={setLivePlan}
              learningMode={learningMode}
              explanations={explanations}
              onStepChange={clearExplanations}
            />
          ) : (
            <DataControlPanel 
              llmPlan={llmPlan} 
              livePlan={livePlan} 
              setLivePlan={setLivePlan}
              dataType={dataType}
            />
          )}
          
          <div style={{marginTop: '1.5rem'}}>
            <button 
              className="primary-button" 
              onClick={() => handleApplyPlanAndDownload(files)} 
              disabled={isLoading || files.length === 0 || !llmPlan}
              style={{
                background: isLoading || files.length === 0 || !llmPlan 
                  ? 'rgba(139, 92, 246, 0.3)' 
                  : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading || files.length === 0 || !llmPlan ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isLoading || files.length === 0 || !llmPlan 
                  ? 'none' 
                  : '0 4px 12px rgba(139, 92, 246, 0.3)',
                transform: 'translateY(0)',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && files.length > 0 && llmPlan) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && files.length > 0 && llmPlan) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseDown={(e) => {
                if (!isLoading && files.length > 0 && llmPlan) {
                  e.target.style.transform = 'translateY(0) scale(0.98)';
                }
              }}
              onMouseUp={(e) => {
                if (!isLoading && files.length > 0 && llmPlan) {
                  e.target.style.transform = 'translateY(-2px) scale(1)';
                }
              }}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🚀</span>
                  Apply & Download All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Preview Panel */}
      <div className="preview-panel">
        <div className="card" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2>{dataType === 'image' ? 'Real-time Preview' : 'Data Review'}</h2>
            {llmPlan && (
              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-purple)' }}>
                    {files.length}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dark-gray)' }}>Files</div>
                </div>
                <div style={{ 
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
                    {livePlan.length}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dark-gray)' }}>Steps</div>
                </div>
              </div>
            )}
          </div>
          
          {error && <div className="error-message" style={{marginBottom: '1rem'}}>{error}</div>}
          
          {/* Conditional Preview/Review Content */}
          {dataType === 'image' ? (
            <ImagePreview 
              files={files}
              originalPreviewUrl={originalPreviewUrl}
              processedPreviewUrl={processedPreviewUrl}
              llmPlan={llmPlan}
            />
          ) : (
            <DataReview 
              llmPlan={llmPlan}
              dataPreview={dataPreview}
              dataType={dataType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkArea;