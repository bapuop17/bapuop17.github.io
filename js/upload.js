/*
 * BapuOP AI - Upload Module
 * Drag and drop, local image conversions, validation, and chat previews
 */

(function () {
  let uploadedFiles = [];

  function setupDragAndDrop(dropArea, onFileUploadedCallback) {
    if (!dropArea) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-active');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-active');
      }, false);
    });

    dropArea.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files, onFileUploadedCallback);
    });
  }

  function handleFiles(files, callback) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('text/') && !file.type.startsWith('application/pdf')) {
        alert('Supported files: Images, Texts, PDFs');
        return;
      }

      // Read file and parse
      const reader = new FileReader();
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          const fileData = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result
          };
          uploadedFiles.push(fileData);
          if (callback) callback(fileData, uploadedFiles);
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          const fileData = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: file.name,
            type: file.type,
            size: file.size,
            textContent: reader.result
          };
          uploadedFiles.push(fileData);
          if (callback) callback(fileData, uploadedFiles);
        };
      }
    });
  }

  function removeFile(fileId) {
    uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
    return uploadedFiles;
  }

  function clearFiles() {
    uploadedFiles = [];
  }

  function getFiles() {
    return uploadedFiles;
  }

  window.UploadEngine = {
    setup: setupDragAndDrop,
    handle: handleFiles,
    remove: removeFile,
    clear: clearFiles,
    get: getFiles
  };
})();
