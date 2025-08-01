import React, { useState } from 'react';
import ResizeControls from './controls/ResizeControls';
import DenoiseControls from './controls/DenoiseControls';
import NormalizeControls from './controls/NormalizeControls';
import AugmentControls from './controls/AugmentControls';

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
      }
    } else {
      // Remove the operation
      newPlan = newPlan.filter(op => op.op !== opName);
      // Clear explanation when removing operation
      setExpandedExplanations(prev => ({ ...prev, [opName]: false }));
    }
    
    setLivePlan(newPlan);
    // Clear explanations when plan changes - user will need to click "Explain to me"
    if (onStepChange) {
      onStepChange(); // Signal that plan changed
    }
  };

  const handleChange = (opName, param, value) => {
    const newPlan = livePlan.map(op => {
      if (op.op === opName) {
        return { ...op, [param]: value };
      }
      return op;
    });
    
    setLivePlan(newPlan);
    
    // Clear explanations when plan changes - user will need to click "Explain to me"
    if (onStepChange) {
      onStepChange(); // Signal that plan changed
    }
  };

  // Get current values for UI, with fallbacks
  const resizeOp = findOp(livePlan, 'resize');
  const denoiseOp = findOp(livePlan, 'denoise');
  const normalizeOp = findOp(livePlan, 'normalize');
  const augmentOp = findOp(livePlan, 'augment');

  return (
    <div className="control-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ResizeControls
        resizeOp={resizeOp}
        onToggle={handleToggle}
        onChange={handleChange}
        learningMode={learningMode}
        explanations={explanations}
        expandedExplanations={expandedExplanations}
        setExpandedExplanations={setExpandedExplanations}
      />
      
      <DenoiseControls
        denoiseOp={denoiseOp}
        onToggle={handleToggle}
        onChange={handleChange}
        learningMode={learningMode}
        explanations={explanations}
        expandedExplanations={expandedExplanations}
        setExpandedExplanations={setExpandedExplanations}
      />
      
      <NormalizeControls
        normalizeOp={normalizeOp}
        onToggle={handleToggle}
        onChange={handleChange}
        learningMode={learningMode}
        explanations={explanations}
        expandedExplanations={expandedExplanations}
        setExpandedExplanations={setExpandedExplanations}
      />
      
      <AugmentControls
        augmentOp={augmentOp}
        onToggle={handleToggle}
        onChange={handleChange}
        learningMode={learningMode}
        explanations={explanations}
        expandedExplanations={expandedExplanations}
        setExpandedExplanations={setExpandedExplanations}
      />
    </div>
  );
}
export default ControlPanel; 