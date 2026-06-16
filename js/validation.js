/**
 * validation.js — Form validation rules
 */
const Validation = (function() {
  'use strict';

  // Define which fields are required per section
  const REQUIRED_FIELDS = {
    meta: ['shipName', 'voyage'],
    section1: ['portOfLoading', 'cargoQuantity', 'plannedRoute'],
    section2: ['dockName', 'berthNumber', 'warehousePositions'],
    section3: ['windLevel', 'windDirection'],
    section4: ['operatingLines.lineCount', 'unloading.startTime', 'unloading.endTime'],
    section5: ['qualityPatrol.frequency', 'pickup.startTime', 'pickup.endTime', 'pickup.cumulativeQuantity'],
    section6: ['northernPurchasePrice', 'shippingCostPerTon'],
    section7: ['operationsOverview'],
    footer: []
  };

  function validateSection(sectionId) {
    const required = REQUIRED_FIELDS[sectionId] || [];
    const errors = [];
    required.forEach(fieldPath => {
      const fullPath = sectionId === 'meta' || sectionId === 'footer'
        ? (sectionId === 'meta' ? `meta.${fieldPath}` : `footer.${fieldPath}`)
        : `${sectionId}.${fieldPath}`;
      const val = FormState.getState(fullPath);
      if (val === null || val === undefined || val === '' || val === false) {
        errors.push({ path: fullPath, message: '此字段为必填项' });
      }
    });
    return errors;
  }

  function validateAll() {
    const sections = ['meta', ...FormRenderer.SECTION_IDS, 'footer'];
    const allErrors = {};
    sections.forEach(id => {
      const errors = validateSection(id);
      if (errors.length > 0) {
        allErrors[id] = errors;
      }
    });
    return allErrors;
  }

  function highlightErrors(allErrors) {
    // Clear previous errors
    document.querySelectorAll('.form-input.error, .form-textarea.error').forEach(el => el.classList.remove('error'));

    // Mark error fields
    for (const [sectionId, errors] of Object.entries(allErrors)) {
      errors.forEach(err => {
        const el = document.querySelector(`[data-path="${err.path}"]`);
        if (el) el.classList.add('error');
      });
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.form-input.error, .form-textarea.error').forEach(el => el.classList.remove('error'));
  }

  return { validateSection, validateAll, highlightErrors, clearHighlights, REQUIRED_FIELDS };
})();
