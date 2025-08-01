import { useState, useCallback } from 'react';

// Custom hook to handle file uploads, data type detection, and preview URLs
export const useFileUpload = () => {
  // State for file management
  const [files, setFiles] = useState([]);                              // Selected files array
  const [dataType, setDataType] = useState('image');                   // Detected data type
  const [userGoal, setUserGoal] = useState("Prepare for image classification model");  // Processing goal
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState('');    // Blob URL for image preview
  const [showFileList, setShowFileList] = useState(false);             // Toggle for file list visibility

  // Detect data type and suggest goal based on file extension
  const detectDataType = useCallback((file) => {
    const ext = file.name.split('.').pop().toLowerCase();  // Get file extension
    
    // Image files - return image type and classification goal
    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      return {
        type: 'image',
        goal: "Prepare for image classification model"
      };
    } 
    // CSV files - return csv type and ML goal
    else if (ext === 'csv') {
      return {
        type: 'csv',
        goal: "Prepare for machine learning"
      };
    } 
    // Text files - return text type and NLP goal
    else if (['txt', 'md', 'pdf'].includes(ext)) {
      return {
        type: 'text',
        goal: "Prepare for NLP processing"
      };
    }
    // Default to image if unknown
    return { type: 'image', goal: "Prepare for image classification model" };
  }, []);

  // Handle file selection (both drag/drop and folder select)
  const handleFilesSelected = useCallback((selectedFiles, resetPlan) => {
    setFiles(selectedFiles);  // Store selected files
    resetPlan();              // Clear any existing plan
    
    if (selectedFiles.length > 0) {
      const firstFile = selectedFiles[0];               // Use first file for type detection
      const { type, goal } = detectDataType(firstFile); // Detect type and goal
      
      setDataType(type);    // Set detected data type
      setUserGoal(goal);    // Set suggested goal
      
      // Create preview URL for images
      if (type === 'image') {
        setOriginalPreviewUrl(URL.createObjectURL(firstFile));
      }
    }
  }, [detectDataType]);

  // Handle drag and drop
  const onDrop = useCallback((acceptedFiles, resetPlan) => {
    handleFilesSelected(acceptedFiles, resetPlan);
  }, [handleFilesSelected]);

  // Handle folder selection from input
  const handleFolderSelect = useCallback((event, resetPlan) => {
    const fileList = Array.from(event.target.files);  // Convert FileList to array
    handleFilesSelected(fileList, resetPlan);
  }, [handleFilesSelected]);

  // Return all state and handlers
  return {
    files,                // Selected files
    dataType,             // Detected data type
    userGoal,             // Current processing goal
    setUserGoal,          // Update goal function
    originalPreviewUrl,   // Image preview URL
    showFileList,         // File list visibility toggle
    setShowFileList,      // Toggle file list function
    onDrop,               // Drag/drop handler
    handleFolderSelect    // Folder select handler
  };
};