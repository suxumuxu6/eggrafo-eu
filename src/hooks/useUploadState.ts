
import { useState } from 'react';

export interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  errorMessage: string | null;
  currentStage: string;
}

export const useUploadState = () => {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    errorMessage: null,
    currentStage: ''
  });

  const setUploading = (uploading: boolean) => {
    setState(prev => ({
      ...prev,
      isUploading: uploading,
      ...(uploading ? {} : { uploadProgress: 0, currentStage: '' })
    }));
  };

  const setProgress = (progress: number, stage: string = '') => {
    setState(prev => ({
      ...prev,
      uploadProgress: progress,
      currentStage: stage
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      errorMessage: error
    }));
  };

  const resetState = () => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      errorMessage: null,
      currentStage: ''
    });
  };

  return {
    ...state,
    setUploading,
    setProgress,
    setError,
    resetState
  };
};
