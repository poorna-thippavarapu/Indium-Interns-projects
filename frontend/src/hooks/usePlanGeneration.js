import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = "http://localhost:8000";  // Backend API endpoint

// Custom hook to handle AI plan generation, API calls, and learning mode
export const usePlanGeneration = () => {
  // State for plan management
  const [llmPlan, setLlmPlan] = useState(null);           // Original AI-generated plan
  const [livePlan, setLivePlan] = useState([]);           // User-modifiable live plan
  const [dataPreview, setDataPreview] = useState(null);   // Preview data for CSV/text files
  const [isLoading, setIsLoading] = useState(false);      // Loading state for API calls
  const [error, setError] = useState('');                 // Error messages
  const [learningMode, setLearningMode] = useState(false); // AI explanation mode toggle
  const [explanations, setExplanations] = useState({});   // AI explanations cache

  // Reset all plan-related state when new files are selected
  const resetPlan = useCallback(() => {
    setLlmPlan(null);      // Clear AI plan
    setLivePlan([]);       // Clear live plan
    setDataPreview(null);  // Clear data preview
  }, []);

  // Generate AI plan based on uploaded file and user goal
  const handleGeneratePlan = useCallback(async (files, userGoal) => {
    if (files.length === 0) return;  // No files to process
    
    setIsLoading(true);  // Start loading
    setError('');        // Clear previous errors
    
    // Prepare form data for API
    const formData = new FormData();
    formData.append('file', files[0]);        // Send first file
    formData.append('user_goal', userGoal);   // Send processing goal
    
    try {
      // Call AI plan generation API
      const response = await axios.post(`${API_URL}/generate-plan`, formData);
      
      // Structure the plan data
      const planData = {
        ...response.data.plan,                    // Copy plan properties
        profile: response.data.profile,          // Data profile information
        ops: response.data.plan.ops || [],       // Operations array
        data_type: response.data.data_type       // Detected data type
      };
      
      setLlmPlan(planData);        // Store original AI plan
      setLivePlan(planData.ops);   // Initialize live plan with AI ops
      
      // Set preview data for non-image files
      if (response.data.data_type === 'csv' || response.data.data_type === 'text') {
        setDataPreview(response.data.cleaned_preview);
      }
      
    } catch (err) { 
      // Handle API errors
      setError(err.response?.data?.detail || "Error generating plan.");
    } finally { 
      setIsLoading(false);  // End loading
    }
  }, []);

  // Apply the current plan to all files and download results
  const handleApplyPlanAndDownload = useCallback(async (files) => {
    if (files.length === 0) return;  // No files to process
    
    setIsLoading(true);  // Start loading
    setError('');        // Clear previous errors
    
    // Prepare form data with all files
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));  // Add all files
    formData.append('plan', JSON.stringify(llmPlan));       // Add current plan
    
    try {
      // Call plan application API
      const response = await axios.post(`${API_URL}/apply-plan`, formData, {
        responseType: 'blob',  // Expect zip file response
      });
      
      // Download the processed files
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'processed_files.zip');  // Set filename
      document.body.appendChild(link);
      link.click();      // Trigger download
      link.remove();     // Clean up DOM
    } catch (err) {
      // Handle API errors
      setError(err.response?.data?.detail || "An error occurred applying the plan.");
    } finally {
      setIsLoading(false);  // End loading
    }
  }, [llmPlan]);

  // Get AI explanation for a specific processing step
  const getStepExplanation = useCallback(async (step, profile, userGoal, forceRefresh = false) => {
    if (!learningMode) return;  // Only get explanations in learning mode
    
    // Check if explanation already exists and not forcing refresh
    if (explanations[step.op] && !forceRefresh) return;
    
    try {
      // Prepare explanation request
      const formData = new FormData();
      formData.append('step', JSON.stringify(step));        // Processing step
      formData.append('profile', JSON.stringify(profile));  // Data profile
      formData.append('user_goal', userGoal);               // User's goal
      
      // Call explanation API
      const response = await axios.post(`${API_URL}/explain-step`, formData);
      
      // Cache the explanation
      setExplanations(prev => ({
        ...prev,
        [step.op]: response.data.explanation  // Store by operation name
      }));
    } catch (err) {
      // Silently handle explanation errors (non-critical)
    }
  }, [learningMode, explanations]);

  // Generate explanations for all current steps (manual trigger)
  const explainAllSteps = useCallback(async () => {
    if (!learningMode || !llmPlan?.profile) return;
    
    // Clear existing explanations first
    setExplanations({});
    
    // Generate fresh explanations for all current steps
    const explanationPromises = livePlan.map(step => 
      getStepExplanation(step, llmPlan.profile, 'Current plan configuration', true)
    );
    
    await Promise.all(explanationPromises);
  }, [learningMode, llmPlan, livePlan, getStepExplanation]);

  // Clear explanations when plan changes
  const clearExplanations = useCallback(() => {
    setExplanations({});
  }, []);

  // Return all state and handlers
  return {
    llmPlan,                      // Original AI plan
    livePlan,                     // User-modifiable plan
    setLivePlan,                  // Update live plan
    dataPreview,                  // CSV/text preview data
    isLoading,                    // Loading state
    error,                        // Error messages
    learningMode,                 // AI explanation mode
    setLearningMode,              // Toggle learning mode
    explanations,                 // AI explanations cache
    resetPlan,                    // Reset all plans
    handleGeneratePlan,           // Generate new AI plan
    handleApplyPlanAndDownload,   // Apply plan and download
    getStepExplanation,           // Get AI explanation for step
    explainAllSteps,              // Generate explanations for all current steps
    clearExplanations             // Clear all explanations
  };
};