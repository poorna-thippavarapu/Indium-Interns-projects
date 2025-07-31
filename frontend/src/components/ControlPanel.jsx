import React from 'react';

// Helper to find an operation in the plan array
const findOp = (plan, opName) => plan.find(op => op.op === opName);

function ControlPanel({ llmPlan, livePlan, setLivePlan }) {
  
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
  };

  // Get current values for UI, with fallbacks
  const resizeOp = findOp(livePlan, 'resize');
  const denoiseOp = findOp(livePlan, 'denoise');
  const normalizeOp = findOp(livePlan, 'normalize');
  const augmentOp = findOp(livePlan, 'augment');

  return (
    <div className="control-panel">
      <div className="op-group">
        <label className="op-toggle">
          <input type="checkbox" checked={!!resizeOp} onChange={(e) => handleToggle('resize', e.target.checked)} />
          Enable Resize
        </label>
        {resizeOp && (
          <div className="op-controls">
            <label>Width: <input type="number" value={resizeOp.width || 224} onChange={e => handleChange('resize', 'width', parseInt(e.target.value))} /></label>
            <label>Height: <input type="number" value={resizeOp.height || 224} onChange={e => handleChange('resize', 'height', parseInt(e.target.value))} /></label>
          </div>
        )}
      </div>

      <div className="op-group">
          <label className="op-toggle">
            <input type="checkbox" checked={!!denoiseOp} onChange={(e) => handleToggle('denoise', e.target.checked)} />
            Enable Denoise
          </label>
        {denoiseOp && (
            <div className="op-controls">
                <label>Method: 
                    <select value={denoiseOp.method || 'gaussian'} onChange={e => handleChange('denoise', 'method', e.target.value)}>
                        <option>gaussian</option><option>median</option><option>bilateral</option>
                    </select>
                </label>
                <label>Kernel Size: <span>{denoiseOp.ksize || 5}</span>
                    <input type="range" min="1" max="31" step="2" value={denoiseOp.ksize || 5} onChange={e => handleChange('denoise', 'ksize', parseInt(e.target.value))} />
                </label>
            </div>
        )}
      </div>
      
       <div className="op-group">
        <label className="op-toggle">
            <input type="checkbox" checked={!!normalizeOp} onChange={(e) => handleToggle('normalize', e.target.checked)} />
            Enable Normalize
        </label>
        {normalizeOp && (
            <div className="op-controls">
                <label><input type="radio" name="normalize" value="minmax" checked={normalizeOp.method === 'minmax'} onChange={e => handleChange('normalize', 'method', e.target.value)} /> minmax</label>
                <label><input type="radio" name="normalize" value="zscore" checked={normalizeOp.method === 'zscore'} onChange={e => handleChange('normalize', 'method', e.target.value)} /> zscore</label>
            </div>
        )}
      </div>

      <div className="op-group">
        <label className="op-toggle">
            <input type="checkbox" checked={!!augmentOp} onChange={(e) => handleToggle('augment', e.target.checked)} />
            Enable Augment
        </label>
        {augmentOp && (
            <div className="op-controls">
                <label>Rotation: <span>{augmentOp.rotation || 0}°</span>
                    <input type="range" min="-180" max="180" value={augmentOp.rotation || 0} onChange={e => handleChange('augment', 'rotation', parseInt(e.target.value))} />
                </label>
                <label>Zoom: <span>{augmentOp.zoom || 1.0}x</span>
                    <input type="range" min="0.1" max="2.0" step="0.1" value={augmentOp.zoom || 1.0} onChange={e => handleChange('augment', 'zoom', parseFloat(e.target.value))} />
                </label>
                {/* Add other augmentation controls here following the same pattern */}
            </div>
        )}
      </div>
    </div>
  );
}
export default ControlPanel; 