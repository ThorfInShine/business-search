import React from 'react';

const LoadingOverlay = ({ isLoading, message = "Memuat data...", progress = null, onCancel }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner-large"></div>
        <p>{message}</p>
        
        {progress !== null && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
        
        {onCancel && (
          <button 
            className="cancel-loading-btn" 
            onClick={onCancel}
            title="Batalkan operasi"
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;