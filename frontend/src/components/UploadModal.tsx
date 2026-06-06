import React, { useState } from 'react';
import { api } from '../services/api';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [bank, setBank] = useState('HDFC Bank');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('bankName', bank);

    try {
      await api.statements.upload(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content">
        <h3>Upload Statement</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Upload your bank statement PDF for AI analysis.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Select Bank</label>
            {/* Fixed: added explicit value attributes to all options */}
            <select className="form-input" value={bank} onChange={e => setBank(e.target.value)}>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="SBI">SBI</option>
              <option value="Axis Bank">Axis Bank</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="file-dropzone" onClick={() => document.getElementById('file-input')?.click()}>
            <input 
              id="file-input"
              type="file" 
              style={{ display: 'none' }} 
              accept=".pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? file.name : 'Click to select PDF or drag and drop'}
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={handleUpload} 
              disabled={!file || uploading}
              style={{ flex: 2 }}
            >
              {uploading ? 'Processing...' : 'Upload & Analyze'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
