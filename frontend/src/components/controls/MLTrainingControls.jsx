import React from 'react';

function MLTrainingControls({ augmentOp, onChange, learningMode, explanations, expandedExplanations, setExpandedExplanations }) {
  const toggleExplanation = (op) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [op]: !prev[op]
    }));
  };

  const handleNumVariantsChange = (value) => {
    onChange('augment', 'num_variants', parseInt(value) || 1);
  };

  const handleRangeChange = (param, value) => {
    onChange('augment', param, parseFloat(value) || 0);
  };

  const handleBooleanChange = (param, checked) => {
    onChange('augment', param, checked);
  };

  const handleBrightnessChange = (min, max) => {
    const brightnessRange = [parseFloat(min) || 0.8, parseFloat(max) || 1.2];
    onChange('augment', 'brightness_range', brightnessRange);
  };

  if (!augmentOp || augmentOp.mode !== 'ml_training') {
    return null;
  }

  return (
    <div className="ml-training-controls" style={{
      background: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '8px',
      padding: '1rem',
      marginTop: '0.5rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h4 style={{ 
          color: 'rgb(16, 185, 129)', 
          margin: 0, 
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          🎲 ML Training Mode - Random Augmentation
        </h4>
        {learningMode && explanations['augment'] && (
          <button
            onClick={() => toggleExplanation('augment')}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              padding: '0.3rem 0.6rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'rgb(16, 185, 129)'
            }}
          >
            💡 Explain
          </button>
        )}
      </div>

      {learningMode && explanations['augment'] && expandedExplanations['augment'] && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.1)',
          borderRadius: '6px',
          padding: '0.8rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}>
          {explanations['augment']}
        </div>
      )}

      {/* Number of Variants */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--text-white)'
        }}>
          Number of Variants: {augmentOp.num_variants || 6}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={augmentOp.num_variants || 6}
          onChange={(e) => handleNumVariantsChange(e.target.value)}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(16, 185, 129, 0.2)',
            outline: 'none'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.7rem',
          color: 'var(--text-dark-gray)',
          marginTop: '0.25rem'
        }}>
          <span>1</span>
          <span>20</span>
        </div>
      </div>

      {/* Rotation Range */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--text-white)'
        }}>
          Rotation Range: ±{augmentOp.rotation_range || 0}°
        </label>
        <input
          type="range"
          min="0"
          max="180"
          step="5"
          value={augmentOp.rotation_range || 0}
          onChange={(e) => handleRangeChange('rotation_range', e.target.value)}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(16, 185, 129, 0.2)',
            outline: 'none'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.7rem',
          color: 'var(--text-dark-gray)',
          marginTop: '0.25rem'
        }}>
          <span>0°</span>
          <span>180°</span>
        </div>
      </div>

      {/* Zoom Range */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--text-white)'
        }}>
          Zoom Range: ±{((augmentOp.zoom_range || 0) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.05"
          value={augmentOp.zoom_range || 0}
          onChange={(e) => handleRangeChange('zoom_range', e.target.value)}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(16, 185, 129, 0.2)',
            outline: 'none'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.7rem',
          color: 'var(--text-dark-gray)',
          marginTop: '0.25rem'
        }}>
          <span>0%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Width Shift Range */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--text-white)'
        }}>
          Width Shift: ±{((augmentOp.width_shift_range || 0) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.05"
          value={augmentOp.width_shift_range || 0}
          onChange={(e) => handleRangeChange('width_shift_range', e.target.value)}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(16, 185, 129, 0.2)',
            outline: 'none'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.7rem',
          color: 'var(--text-dark-gray)',
          marginTop: '0.25rem'
        }}>
          <span>0%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Height Shift Range */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--text-white)'
        }}>
          Height Shift: ±{((augmentOp.height_shift_range || 0) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.05"
          value={augmentOp.height_shift_range || 0}
          onChange={(e) => handleRangeChange('height_shift_range', e.target.value)}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(16, 185, 129, 0.2)',
            outline: 'none'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '0.7rem',
          color: 'var(--text-dark-gray)',
          marginTop: '0.25rem'
        }}>
          <span>0%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Brightness Range */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--text-white)'
        }}>
          Brightness Range
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            min="0.1"
            max="2.0"
            step="0.1"
            value={augmentOp.brightness_range ? augmentOp.brightness_range[0] : 0.8}
            onChange={(e) => handleBrightnessChange(e.target.value, augmentOp.brightness_range ? augmentOp.brightness_range[1] : 1.2)}
            style={{
              width: '60px',
              padding: '0.3rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              color: 'var(--text-white)',
              fontSize: '0.8rem'
            }}
          />
          <span style={{ color: 'var(--text-dark-gray)', fontSize: '0.8rem' }}>to</span>
          <input
            type="number"
            min="0.1"
            max="2.0"
            step="0.1"
            value={augmentOp.brightness_range ? augmentOp.brightness_range[1] : 1.2}
            onChange={(e) => handleBrightnessChange(augmentOp.brightness_range ? augmentOp.brightness_range[0] : 0.8, e.target.value)}
            style={{
              width: '60px',
              padding: '0.3rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              color: 'var(--text-white)',
              fontSize: '0.8rem'
            }}
          />
        </div>
      </div>

      {/* Flip Options */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-white)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={augmentOp.horizontal_flip || false}
            onChange={(e) => handleBooleanChange('horizontal_flip', e.target.checked)}
            style={{ accentColor: 'rgb(16, 185, 129)' }}
          />
          Horizontal Flip
        </label>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-white)',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={augmentOp.vertical_flip || false}
            onChange={(e) => handleBooleanChange('vertical_flip', e.target.checked)}
            style={{ accentColor: 'rgb(16, 185, 129)' }}
          />
          Vertical Flip
        </label>
      </div>

      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-dark-gray)', 
        fontStyle: 'italic',
        marginTop: '0.5rem'
      }}>
        💡 Each processed image will generate {augmentOp.num_variants || 6} random variants with different combinations of these transforms.
      </div>
    </div>
  );
}

export default MLTrainingControls;