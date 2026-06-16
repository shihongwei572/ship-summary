/**
 * file-upload.js — File/image upload handling
 * Provides enhanced drag-drop and click-to-browse functionality.
 */
const FileUpload = (function() {
  'use strict';

  function initUploadZones() {
    // Upload zones are already initialized via form-renderer's makeUploadZone
    // This module provides shared utilities
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
    return size.toFixed(1) + ' ' + units[i];
  }

  function isImageType(type) {
    return type && type.startsWith('image/');
  }

  return { initUploadZones, formatFileSize, isImageType };
})();
