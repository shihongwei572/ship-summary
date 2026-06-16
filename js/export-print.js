/**
 * export-print.js — Print/PDF export logic
 */
const ExportPrint = (function() {
  'use strict';

  function print() {
    window.print();
  }

  function validateBeforePrint() {
    // Check if any key sections are empty
    const s = FormState.getState();
    const warnings = [];

    if (!s.meta.shipName) warnings.push('船名未填写');
    if (!s.section1.cargoQuantity) warnings.push('货物数量未填写');
    if (!s.section2.dockName) warnings.push('靠泊码头未填写');
    if (!s.section4.unloading.startTime) warnings.push('卸货开始时间未填写');

    if (warnings.length > 0) {
      return {
        canPrint: true, // Always allow print with warnings
        warnings
      };
    }
    return { canPrint: true, warnings: [] };
  }

  return { print, validateBeforePrint };
})();
