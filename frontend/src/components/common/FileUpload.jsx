import React, { useRef, useState } from 'react';
import { FiUpload, FiFile, FiX } from 'react-icons/fi';
import Button from './Button';
import './FileUpload.css';

const FileUpload = ({
  label,
  accept = '.txt,.csv',
  onChange,
  error,
  hint,
  maxSize = 5, // MB
  required = false
}) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setFile(selectedFile);
    onChange && onChange(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    onChange && onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label className={`form-label ${required ? 'required' : ''}`}>
          {label}
        </label>
      )}
      
      <div
        className={`file-upload-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''} ${error ? 'error' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="file-input"
        />
        
        {file ? (
          <div className="file-preview">
            <div className="file-info">
              <FiFile size={24} />
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<FiX />}
              onClick={handleRemove}
            />
          </div>
        ) : (
          <div className="upload-placeholder">
            <FiUpload size={32} />
            <p>Drag and drop a file here, or click to select</p>
            <span className="upload-hint">Accepted: {accept} (Max {maxSize}MB)</span>
          </div>
        )}
      </div>
      
      {error && <span className="form-error">{error}</span>}
      {hint && !error && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export default FileUpload;