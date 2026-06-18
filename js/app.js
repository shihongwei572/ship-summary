/**
 * app.js — Application entry point, initialization and toolbar wiring
 */
(function() {
  'use strict';

  // ── Initialization ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    // Render form
    const formContainer = document.getElementById('form-panel');
    FormRenderer.renderAll(formContainer);

    // Init preview
    const previewContainer = document.getElementById('preview-content');
    Preview.init(previewContainer);

    // Init auto-save
    Storage.startAutoSave(30000);

    // Wire toolbar buttons
    wireToolbar();

    // Update section status indicators periodically
    updateAllStatusIndicators();
    FormState.onChange(() => updateAllStatusIndicators());

    // Auto-update Section7 summary fields in UI when state changes
    FormState.onChange((path, state) => {
      if (path && (path.startsWith('section1.') || path.startsWith('section2.') || 
          path.startsWith('section4.') || path.startsWith('section5.') || 
          path.startsWith('meta.'))) {
        setTimeout(() => {
          ['section7.operationsOverview', 'section7.qualityControl',
           'section7.safetyProcess', 'section7.improvements'].forEach(p => {
            const el = document.querySelector('[data-path="' + p + '"]');
            if (el) { el.value = FormState.getState(p) || ''; }
          });
        }, 30);
      }
    });

    // Check for saved draft
    checkForDraft();

    // Init toast container
    ensureToastContainer();
  }

  // ── Toolbar ─────────────────────────────────────────────
  function wireToolbar() {
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-load').addEventListener('click', handleLoad);
    document.getElementById('btn-preview').addEventListener('click', handlePreview);
    document.getElementById('btn-export-docx').addEventListener('click', handleExportDocx);
    document.getElementById('btn-export-pdf').addEventListener('click', handleExportPdf);
  }

  function handleNew() {
    if (Storage.hasDraft()) {
      showConfirmModal('新建报告将清空当前所有数据，确定继续吗？', () => {
        Storage.deleteDraft();
        FormState.reset();
        showToast('已新建空白报告', 'info');
      });
    } else {
      FormState.reset();
      showToast('已新建空白报告', 'info');
    }
  }

  function handleSave() {
    // Add timestamp
    FormState.set('_timestamp', new Date().toISOString());
    if (Storage.save()) {
      showToast('草稿已保存 ✓', 'success');
    }
  }

  function handleLoad() {
    if (!Storage.hasDraft()) {
      showToast('没有已保存的草稿', 'warning');
      return;
    }
    const ts = Storage.getTimestamp();
    const msg = ts ? `找到草稿（上次保存：${new Date(ts).toLocaleString('zh-CN')}），是否加载？` : '找到草稿，是否加载？';
    showConfirmModal(msg, () => {
      Storage.loadDraft();
    });
  }

  function handlePreview() {
    // Toggle full preview mode
    const formPanel = document.getElementById('form-panel');
    const previewPanel = document.getElementById('preview-panel');

    if (previewPanel.classList.contains('fullscreen')) {
      previewPanel.classList.remove('fullscreen');
      formPanel.style.display = '';
      document.getElementById('btn-preview').textContent = '全屏预览';
    } else {
      previewPanel.classList.add('fullscreen');
      formPanel.style.display = 'none';
      document.getElementById('btn-preview').textContent = '返回编辑';
    }
  }

  async function handleExportDocx() {
    showToast('正在生成Word文档...', 'info');
    try {
      await ExportDocx.generateAndDownload();
      showToast('Word文档已下载 ✓', 'success');
    } catch(e) {
      console.error('Export error:', e);
      showToast('导出失败：' + e.message, 'error');
    }
  }

  function handleExportPdf() {
    const result = ExportPrint.validateBeforePrint();
    if (result.warnings.length > 0) {
      showConfirmModal(
        `以下字段尚未填写：\n${result.warnings.join('\n')}\n\n仍然继续打印吗？`,
        () => { ExportPrint.print(); }
      );
    } else {
      ExportPrint.print();
    }
  }

  // ── Draft check on startup ──────────────────────────────
  function checkForDraft() {
    if (Storage.hasDraft()) {
      const ts = Storage.getTimestamp();
      const timeStr = ts ? new Date(ts).toLocaleString('zh-CN') : '未知时间';
      showConfirmModal(
        `检测到上次未完成的草稿（保存时间：${timeStr}）。\n是否恢复草稿继续填写？`,
        () => { Storage.loadDraft(); },
        () => { /* User declined, keep empty form */ }
      );
    }
  }

  // ── Status indicators ───────────────────────────────────
  function updateAllStatusIndicators() {
    FormRenderer.SECTION_IDS.forEach(id => {
      const dot = document.getElementById(`status-${id}`);
      if (!dot) return;
      const status = FormState.getSectionStatus(id);
      dot.className = 'status-dot ' + status;
      dot.title = {
        empty: '未填写',
        partial: '部分填写',
        complete: '已完成'
      }[status];
    });
  }

  // ── Toast ───────────────────────────────────────────────
  function ensureToastContainer() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  function showToast(msg, type) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2800);
  }

  // ── Modal ───────────────────────────────────────────────
  function showConfirmModal(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>确认</h3>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.7;">${message}</div>
      <div class="modal-actions">
        <button id="modal-cancel">取消</button>
        <button id="modal-confirm" class="primary">确认</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
      document.body.removeChild(overlay);
    };

    modal.querySelector('#modal-confirm').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });
    modal.querySelector('#modal-cancel').addEventListener('click', () => {
      close();
      if (onCancel) onCancel();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) { close(); if (onCancel) onCancel(); }
    });
  }
})();
