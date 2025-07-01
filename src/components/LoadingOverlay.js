import React from 'react';

const LoadingOverlay = ({ isLoading, message = "Memuat data...", onCancel }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner-large"></div>
        <p>{message}</p>
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