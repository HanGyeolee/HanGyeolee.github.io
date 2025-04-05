import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, Upload, X, Image, Type } from 'lucide-react';

import testImage from '../../../image/test.jpg';
import testFont from '../../../fonts/Pretendard-Regular.ttf';

export const FileUploader = ({ onFileUploaded }:{onFileUploaded:(f:Record<string, File[]>)=>void}) => {
  const [files, setFiles] = useState<Record<string, File[]>>({
    file: [],
    assets: [],
    resource: []
  });
  
  const fileInputRefs = {
    file: useRef(null),
    assets: useRef(null),
    resource: useRef(null)
  };
  
  // Load test files from src directory on component mount
  useEffect(() => {
    const loadTestFiles = async () => {
      try {
        // Fetch the images and convert them to File objects
        const [imageResponse, fontResponse] = await Promise.all([
          fetch(testImage),
          fetch(testFont)
        ]);
        
        const [imageBlob, fontBlob] = await Promise.all([
          imageResponse.blob(),
          fontResponse.blob()
        ]);
        
        // Create File objects
        const imageFile = new File([imageBlob], 'test-image.jpg', { type: 'image/jpg' });
        const fontFile = new File([fontBlob], 'test-font.ttf', { type: 'font/ttf' });
        const imageResource = new File([imageBlob], 'R.id.testImage', { type: 'image/jpg' });
        
        // Update state with test files
        setFiles({
          file: [imageFile],
          assets: [fontFile],
          resource: [imageResource]
        });
        
        // Notify parent component
        onFileUploaded({
          file: [imageFile],
          assets: [fontFile],
          resource: [imageResource]
        });
      } catch (error) {
        console.error('Error loading test files:', error);
      }
    };
    
    loadTestFiles();
    
    // Cleanup function
    return () => {
      if (window.uploadedFiles) {
        Object.values(window.uploadedFiles).flat().forEach(file => {
          if (file.url) URL.revokeObjectURL(file.url);
        });
      }
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');
  };

  const handleDrop = (type) => (e:React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(type, droppedFiles);
  };

  const handleFileSelect = (type) => (e:React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files){
      const selectedFiles = Array.from(e.target.files);
      handleFiles(type, selectedFiles);
    }
  };

  const handleFiles = (type, newFiles: File[]) => {
    const generateRandomId = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      
      // 안전한 난수 생성을 위해 crypto API 사용
      const randomValues = new Uint8Array(32);
      crypto.getRandomValues(randomValues);
      
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(randomValues[i] % chars.length);
      }
      
      return result;
    };
    // Filter for image and font files
    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isFont = file.type.includes('font') || 
                     file.name.endsWith('.ttf')
                    //   || 
                    //  file.name.endsWith('.otf') ||
                    //  file.name.endsWith('.woff') ||
                    //  file.name.endsWith('.woff2');
      return isImage || isFont;
    }).map(file => {
      let name = file.name;
      const fileName = name.split('/').pop()?.split('\\').pop();
      if(fileName){
        name = fileName;
      }
      if (/[^\u0000-\u007F]/.test(name)) {
        const extension = name.includes('.') ? 
          '.' + name.split('.').pop()?.toLowerCase() : '';
        name = generateRandomId() + extension;
      }
                
      // Special handling for resource type files
      if (type === 'resource') {
        // 1. Remove file extension
        name = name.replace(/\.[^/.]+$/, "");
        
        // 2. Convert kebab-case to camelCase
        name = name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
        name = `R.id.${name}`;
      }
      
      return {
        ...file, name: name
      };
    });

    if (validFiles.length > 0) {
      setFiles(prev => {
        const updatedFiles = {
          ...prev,
          [type]: [...prev[type], ...validFiles]
        };
        onFileUploaded(updatedFiles);
        return updatedFiles;
      });
    }
  };

  const removeFile = (type, index) => {
    setFiles(prev => {
      const updatedFiles = {
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      };
      onFileUploaded(updatedFiles);
      return updatedFiles;
    });
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image size={16} className="file-icon" />;
    } else {
      return <Type size={16} className="file-icon" />;
    }
  };

  const renderFileSection = (type, title) => (
    <div className="file-section">
      <div className="file-section-title">{title}</div>
      <div 
        className="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop(type)}
        onClick={() => fileInputRefs[type].current.click()}
      >
        <Upload size={20} />
        <div className="dropzone-text">Drag & drop files or click to upload</div>
        <div className="dropzone-subtext">Images or Fonts only</div>
        <input
          type="file"
          ref={fileInputRefs[type]}
          onChange={handleFileSelect(type)}
          className="hidden"
          accept="image/*,.ttf,.otf,.woff,.woff2,font/*"
          multiple
          style={{ display: 'none' }}
        />
      </div>
      {files[type].length > 0 && (
        <div className="file-list">
          {files[type].map((file, index) => (
            <div key={`${type}-${index}`} className="file-item">
              <div className="file-name">
                {getFileIcon(file)}
                <span>{file.name}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(type, index);
                }}
                className="remove-file"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="file-uploader">
      {renderFileSection('file', 'File')}
      {renderFileSection('assets', 'Assets')}
      {renderFileSection('resource', 'Resource')}
    </div>
  );
};

export default FileUploader;