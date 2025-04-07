import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, Upload, X, Image, Type } from 'lucide-react';

import testImage from '../../../image/test.jpg';
import testFont from '../../../fonts/Pretendard-Regular.ttf';
import { Files, FileWrapper, RawFiles } from './enum';

// 파일 저장
export function storeFilesInIndexedDB(files: RawFiles) {
  return new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open('FileStorage', 1);
    
    request.onupgradeneeded = (e) => {
      const db = request.result;
 
      // 기존의 모든 객체 저장소 삭제
      if (db.objectStoreNames.length > 0) {
        Array.from(db.objectStoreNames).forEach(storeName => {
          db.deleteObjectStore(storeName);
        });
      }
      
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'name' });
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      
      // 모든 파일 타입에 대해 저장
      Object.keys(files).forEach(type => {
        files[type].forEach((file:File) => {
          store.put({
            name: file.name,
            type: file.type,
            data: file,
            fileType: type // file, assets, resource 구분
          });
        });
      });
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (e) => reject(e);
    };
    
    request.onerror = (e) => reject(e);
  });
}

// 파일 불러오기
export function getFilesFromIndexedDB() {
  return new Promise<Files>((resolve, reject) => {
    const request = indexedDB.open('FileStorage', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const files: Files = { file: [], assets: [], resource: [] };
      
      store.openCursor().onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          const fileData = cursor.value;
          files[fileData.fileType].push({
            name: fileData.name,
            url: URL.createObjectURL(new Blob([fileData.data], { type: fileData.type })),
            type: fileData.type
          });
          cursor.continue();
        } else {
          resolve(files);
        }
      };
    };
    
    request.onerror = (e) => reject(e);
  });
}

export const FileUploader = ({ onFileUploaded }:{onFileUploaded:(f:RawFiles)=>void}) => {
  const [files, setFiles] = useState<RawFiles>({
    file: [],
    assets: [],
    resource: []
  });
  
  const fileInputRefs = {
    file: useRef<HTMLInputElement>(null),
    assets: useRef<HTMLInputElement>(null),
    resource: useRef<HTMLInputElement>(null)
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

  const handleDrop = (type:FileWrapper) => (e:React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(type, droppedFiles);
  };

  const handleFileSelect = (type:FileWrapper) => (e:React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files){
      const selectedFiles = Array.from(e.target.files);
      handleFiles(type, selectedFiles);
    }
  };

  const handleFiles = (type:FileWrapper, newFiles: File[]) => {
    const generateRandomId = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      
      // 안전한 난수 생성을 위해 crypto API 사용
      const randomValues = new Uint8Array(16);
      crypto.getRandomValues(randomValues);
      
      for (let i = 0; i < 16; i++) {
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
      
      return new File([file], name, {
        type: file.type,
        lastModified: file.lastModified
      });
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

  const getFileIcon = (file:File) => {
    if (file.type.startsWith('image/')) {
      return <Image size={16} className="file-icon" />;
    } else {
      return <Type size={16} className="file-icon" />;
    }
  };

  const renderFileSection = (type:FileWrapper, title) => (
    <div className="file-section">
      <div className="file-section-title">{title}</div>
      <div 
        className="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop(type)}
        onClick={() => fileInputRefs[type].current?.click()}
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
            <div key={`${type}-${index}`} onClick={(e) => {
              if(type === 'resource')
                navigator.clipboard.writeText(file.name);
              else
                navigator.clipboard.writeText(`\"${file.name}\"`);
            }} className="file-item">
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