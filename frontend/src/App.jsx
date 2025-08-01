import React, { useEffect } from 'react';
// Import all our new modular components
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import UploadSection from './components/UploadSection';
import WorkArea from './components/WorkArea';
import Footer from './components/Footer';
// Import our custom hooks that handle all the logic
import { useFileUpload } from './hooks/useFileUpload';
import { usePlanGeneration } from './hooks/usePlanGeneration';
import { useImagePreview } from './hooks/useImagePreview';

function App() {
  // File upload hook - handles drag/drop, file selection, data type detection
  const {
    files,                    // Array of selected files
    dataType,                 // 'image', 'csv', or 'text'
    userGoal,                 // User's processing goal text
    setUserGoal,              // Function to update goal
    originalPreviewUrl,       // Blob URL for original image
    showFileList,             // Toggle for file list visibility
    setShowFileList,          // Function to toggle file list
    onDrop,                   // Drag & drop handler
    handleFolderSelect        // Folder selection handler
  } = useFileUpload();

  // Plan generation hook - handles AI plan creation and API calls
  const {
    llmPlan,                  // AI-generated processing plan
    livePlan,                 // Current live plan (user can modify)
    setLivePlan,              // Function to update live plan
    dataPreview,              // Preview data for CSV/text files
    isLoading,                // Loading state for API calls
    error,                    // Error messages
    learningMode,             // AI explanation mode toggle
    setLearningMode,          // Function to toggle learning mode
    explanations,             // AI explanations for each step
    resetPlan,                // Function to clear current plan
    handleGeneratePlan,       // Generate new AI plan
    handleApplyPlanAndDownload, // Apply plan and download results
    getStepExplanation,       // Get AI explanation for a step
    explainAllSteps,          // Generate explanations for all current steps
    clearExplanations         // Clear all explanations
  } = usePlanGeneration();

  // Image preview hook - handles real-time preview updates
  const { processedPreviewUrl, updatePreview } = useImagePreview(originalPreviewUrl);

  // Update preview whenever plan changes (for images only)
  useEffect(() => {
    if (llmPlan && dataType === 'image') {
      updatePreview(files, livePlan);  // Update image preview with current plan
    }
  }, [livePlan, updatePreview, llmPlan, files, dataType]);

  return (
    <>
      {/* App header with PRISM branding */}
      <Header />
      
      {/* Hero section with gradient effects and feature badges */}
      <HeroSection />
      
      <main className="main-layout">
        {/* File upload area with drag/drop and folder selection */}
        <UploadSection
          files={files}
          userGoal={userGoal}
          setUserGoal={setUserGoal}
          showFileList={showFileList}
          setShowFileList={setShowFileList}
          onDrop={onDrop}
          handleFolderSelect={handleFolderSelect}
          handleGeneratePlan={handleGeneratePlan}
          isLoading={isLoading}
          resetPlan={resetPlan}
        />
        
        {/* Main work area - controls and preview panels */}
        <WorkArea
          llmPlan={llmPlan}              // AI plan data
          livePlan={livePlan}            // User-modified plan
          setLivePlan={setLivePlan}      // Update live plan
          dataType={dataType}            // File type (image/csv/text)
          learningMode={learningMode}    // AI explanation mode
          setLearningMode={setLearningMode}
          explanations={explanations}    // AI step explanations
          getStepExplanation={getStepExplanation}
          explainAllSteps={explainAllSteps}
          clearExplanations={clearExplanations}
          userGoal={userGoal}
          files={files}
          error={error}
          isLoading={isLoading}
          handleApplyPlanAndDownload={handleApplyPlanAndDownload}
          originalPreviewUrl={originalPreviewUrl}
          processedPreviewUrl={processedPreviewUrl}
          dataPreview={dataPreview}      // CSV/text preview data
        />
      </main>
      
      {/* Footer with app info */}
      <Footer />
    </>
  );
}

export default App;