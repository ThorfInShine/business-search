// File: components/StatusEditor.js
import React, { useState } from 'react';

const StatusEditor = ({ business, onStatusUpdate, onClose }) => {
  const [newStatus, setNewStatus] = useState(business.statusEntri || 'Belum');
  const [newPetugas, setNewPetugas] = useState(business.namaPetugas || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'Belum', label: 'Belum', color: 'status-pending' },
    { value: 'Progress', label: 'Progress', color: 'status-progress' },
    { value: 'Sudah', label: 'Sudah', color: 'status-completed' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onStatusUpdate(business.id, {
        statusEntri: newStatus,
        namaPetugas: newPetugas.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengupdate status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="status-editor-overlay" onClick={onClose}>
      <div className="status-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="status-editor-header">
          <h3>📝 EDIT STATUS ENTRI</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="status-editor-content">
          <div className="business-info">
            <h4>{business.namaUsaha}</h4>
            <p>{business.alamat}</p>
          </div>

          <form onSubmit={handleSubmit} className="status-form">
            <div className="form-group">
              <label htmlFor="status-select">Status Entri:</label>
              <select 
                id="status-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="status-select"
                disabled={isLoading}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className={`status-preview ${statusOptions.find(opt => opt.value === newStatus)?.color}`}>
                {newStatus}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="petugas-input">Nama Petugas:</label>
              <input
                id="petugas-input"
                type="text"
                value={newPetugas}
                onChange={(e) => setNewPetugas(e.target.value)}
                placeholder="Masukkan nama petugas..."
                className="petugas-input"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                onClick={onClose}
                className="cancel-btn"
                disabled={isLoading}
              >
                BATAL
              </button>
              <button 
                type="submit"
                className="save-btn"
                disabled={isLoading}
              >
                {isLoading ? '⏳ MENYIMPAN...' : '💾 SIMPAN'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StatusEditor;