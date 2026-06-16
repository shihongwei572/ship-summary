/**
 * storage.js — LocalStorage persistence (save/load/autosave)
 */
const Storage = (function() {
  'use strict';

  const STORAGE_KEY = 'ship_summary_draft';
  const STORAGE_KEY_BACKUP = 'ship_summary_draft_backup';

  function save() {
    try {
      const json = FormState.exportToJSON();
      // Check size before saving
      const sizeMB = new Blob([json]).size / (1024 * 1024);
      if (sizeMB > 10) {
        console.warn('Draft is large (' + sizeMB.toFixed(1) + 'MB), this may hit LocalStorage limits.');
      }
      // Backup existing draft first
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        localStorage.setItem(STORAGE_KEY_BACKUP, existing);
      }
      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch(e) {
      if (e.name === 'QuotaExceededError') {
        showToast('保存失败：本地存储空间不足。请清理部分文件/照片。', 'error');
      } else {
        showToast('保存失败：' + e.message, 'error');
      }
      return false;
    }
  }

  function load() {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (!json) return null;
      return json;
    } catch(e) {
      return null;
    }
  }

  function hasDraft() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  function loadDraft() {
    const json = load();
    if (!json) return false;
    const success = FormState.importFromJSON(json);
    if (success) {
      showToast('草稿已加载', 'success');
    }
    return success;
  }

  function deleteDraft() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_BACKUP);
  }

  function getTimestamp() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    try {
      const data = JSON.parse(json);
      return data._timestamp || null;
    } catch(e) { return null; }
  }

  // ── Toast helper ──
  function showToast(msg, type) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  // ── Auto-save ──
  let autoSaveTimer = null;

  function startAutoSave(intervalMs) {
    stopAutoSave();
    // Save on change (debounced)
    FormState.onChange(() => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        save();
      }, intervalMs || 30000);
    });
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  return { save, load, loadDraft, hasDraft, deleteDraft, getTimestamp, startAutoSave, stopAutoSave };
})();
