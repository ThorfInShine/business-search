import React, { useRef } from 'react';

const FileUpload = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onFileUpload(file);
      } else {
        alert('Silakan pilih file CSV yang valid');
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button onClick={handleClick} className="upload-btn">
        📁 PILIH FILE CSV
      </button>
      <p className="upload-info">
        Format: CSV dengan header di baris pertama
      </p>
    </div>
  );
};

export default FileUpload;