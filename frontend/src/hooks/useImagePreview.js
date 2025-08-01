import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8000";

export const useImagePreview = (originalPreviewUrl) => {
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState('');
  const previewTimeoutRef = useRef(null);
  const previousUrlRef = useRef(null);

  const updatePreview = useCallback(async (files, plan) => {
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    // Set a new timeout for debouncing
    previewTimeoutRef.current = setTimeout(async () => {
      if (files.length === 0 || plan.length === 0) {
        // Clean up previous URL
        if (previousUrlRef.current && previousUrlRef.current !== originalPreviewUrl) {
          URL.revokeObjectURL(previousUrlRef.current);
        }
        setProcessedPreviewUrl(originalPreviewUrl);
        previousUrlRef.current = originalPreviewUrl;
        return;
      }
      
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('plan', JSON.stringify({ ops: plan }));
      
      try {
        const response = await axios.post(`${API_URL}/preview-image`, formData, { responseType: 'blob' });
        
        // Clean up previous URL
        if (previousUrlRef.current && previousUrlRef.current !== originalPreviewUrl) {
          URL.revokeObjectURL(previousUrlRef.current);
        }
        
        // Create new URL
        const newUrl = URL.createObjectURL(response.data);
        setProcessedPreviewUrl(newUrl);
        previousUrlRef.current = newUrl;
      } catch (err) { 
        // Fallback to original on error
        setProcessedPreviewUrl(originalPreviewUrl);
      }
    }, 300);
  }, [originalPreviewUrl]);

  // Initialize processed preview URL
  useEffect(() => {
    setProcessedPreviewUrl(originalPreviewUrl);
  }, [originalPreviewUrl]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current && previousUrlRef.current !== originalPreviewUrl) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [originalPreviewUrl]);

  return {
    processedPreviewUrl,
    updatePreview
  };
};