/**
 * form-state.js — Data model and state management for 船小结 form
 * Single source of truth for all form data across 7 sections.
 */
const FormState = (function() {
  'use strict';

  // ── Initial empty state ──────────────────────────────────
  const EMPTY_STATE = {
    meta: {
      shipName: '',
      voyage: '',
      operatingDept: '',
      reportDate: ''
    },

    section1: {
      // 水路运单
      waterwayWaybillText: '运单信息与货物、船名航次一致，货权清晰',
      waterwayWaybillFile: null,  // { name, size, dataURL }
      // 装运港、数量及时间
      portOfLoading: '',
      cargoQuantity: '',          // 吨
      loadingStartTime: '',
      loadingEndTime: '',
      // 检验报告及封签
      inspectionReportText: '装港检验报告显示货物品质符合标准，船舱封签完好，无异常',
      inspectionReportFile: null,
      sealCheckFile: null,        // 封签检查附图
      // 预计到港时间
      estimatedArrivalTime: '',
      actualArrivalTime: '',
      // 轨迹
      plannedRoute: '',           // 预定航线
      actualRoute: '',            // 实际航线
      routeDeviation: '无偏离预定航线、无违规停靠',
      trackingDevice: 'AIS系统',  // 轨迹记录设备/单位
      routeNotes: '航行期间无恶劣天气、无海上事故，船舶运行正常'
    },

    section2: {
      dockName: '',               // 靠泊码头名称
      berthNumber: '',            // 泊位号
      equipmentStatus: '运行正常',
      warehousePositions: '',     // 仓位编号
      warehouseCapacity: '',      // 仓位容量(万吨)
      cargoWeight: '',            // 货物吨数(万吨)
      storageConditions: '仓位地面平整、干燥、无积水、无杂物，通风、防潮、防鼠设施完善，符合玉米存储要求；仓位已提前清理、消毒，经检查合格后预留使用',
      isDirectPickup: false,      // 是否直提
      directPickupStartTime: '',  // 直提开始时间
      directPickupNotes: '直提作业有序，车辆调度合理，无混货、错发现象'
    },

    section3: {
      // 天气及风力
      weather: {
        sunny: true,
        cloudy: false,
        overcast: false,
        rain: false,               // 下雨
        snow: false,               // 下雪
        fog: false,                // 雾
        noRainThunder: true       // 无降雨雷电
      },
      windLevel: '4',             // 风力级数
      windDirection: '南风',      // 风向
      windStandard: '6',          // 风力作业标准(≤X级)
      // 风险排查
      riskCheck: {
        hasRisk: false,           // false=无异常风险, true=存在风险
        riskDescription: '',
        remediation: '',
        remediationCompleteTime: '',
        recheckResult: '合格'
      },
      safetyOfficer: '',          // 安全责任人
      // 开舱照片
      hatchPhotos: {
        count: '4',
        time: '',
        location: '船舶各货舱舱口',
        photographer: '',
        notes: '货舱封签完好、货物无坍塌、无霉变、无结块等异常',
        files: []                 // [{ name, size, dataURL }]
      },
      // 取样照片
      samplingPhotos: {
        count: '4',
        time: '',
        sampler: '',              // 取样人员
        notes: '取样规范、点位覆盖各货舱，样品妥善封存用于后续复检',
        files: []
      }
    },

    section4: {
      // 码头作业线
      operatingLines: {
        lineCount: '3',
        dailyCapacityPerLine: '5500'  // 吨/日/条
      },
      // 卸货天数
      unloading: {
        startTime: '',
        endTime: '',
        totalHours: '',           // 共计小时（自动计算）
        dailyAverage: '',          // 日均卸货量（自动计算）
        hasPause: false,          // 是否暂停
        pauseReason: '',
        pauseDuration: ''
      },
      // 卸货数量（用于计算损耗率）
      unloadedQuantity: '',       // 卸船数量(吨)
      loadingQuantity: '',        // 装运数量(吨) — reuse section1.cargoQuantity
      // 船舱清仓
      holdCleaningResult: '各货舱舱壁、舱底无残留货物、无杂物、无积水，清仓干净度符合相关标准',
      // 品质情况
      qualityInspectionResult: '货物品质与装运港检验报告一致，无霉变、结块、杂质超标、发热等异常，符合合同约定及相关标准',
      // 损耗情况
      loss: {
        quantity: '',             // 实际损耗量(吨)（自动计算）
        rate: '',                 // 损耗率(%)（自动计算）
        contractStandard: '0.2',  // 合同约定损耗标准
        reason: '货物自然挥发、装卸正常损耗'
      },
      // 保险
      insurance: {
        claimed: false,           // false=未出险, true=出险
        timeRange: '',
        reason: '',
        acceptanceDetails: ''
      }
    },

    section5: {
      // 粮质巡查
      qualityPatrol: {
        frequency: '每周2次',     // 巡查频次
        content: '货物有无霉变、结块、发热、虫蛀等异常，仓库通风、防潮设施运行情况',
        results: '全程无异常，货物品质保持稳定，符合提货标准；巡查记录完整'
      },
      // 提货情况
      pickup: {
        startTime: '',
        endTime: '',
        totalDays: '',             // 共计天数（自动计算）
        cumulativeQuantity: '',   // 累计提货量
        outboundLossQuantity: '', // 出库损耗量
        outboundLossRate: '',     // 出库损耗率（自动计算）
        outboundLossReason: '货物自然挥发'
      },
      // 执行商扣
      vendorDeductions: {
        hasDeductions: false,
        batch: '',                // 商扣批次
        reason: '',               // 商扣原因
        quantity: '',             // 商扣数量
        amount: ''                // 商扣金额
      },
      executionLedgerFile: null   // 整船执行台账附件
    },

    section6: {
      northernPurchasePrice: '',  // 北方采购价
      southernPortFees: {
        portOperationFee: '',     // 港口作业费
        storageFee: '',           // 堆存费
        otherFees: '0',           // 其他杂费
        unitCost: '',             // 折合单吨成本（自动计算）
        estimatedPortFee: '',     // 销售时预估港口费用
        totalPortFee: '',         // 港口费用合计（自动计算）
        deviation: '',            // 费用偏差（自动计算）
        unitDeviation: ''         // 单吨偏差（自动计算）
      },
      shippingCostPerTon: '',     // 海运费(元/吨)
      profitAnalysis: ''          // 利润分析
    },

    section7: {
      operationsOverview: '',     // 作业概况（自动生成）
      qualityControl: '',         // 品质管控（自动生成）
      safetyProcess: '',          // 安全及流程（自动生成）
      improvements: ''            // 不足及改进（自动生成）
    },

    footer: {
      salesSupportConfirm: '',    // 销售支持确认
      logisticsConfirm: '',       // 物流现场确认
      salesConfirm: ''            // 销售人员确认
    }
  };

  // ── Current state ───────────────────────────────────────
  let state = JSON.parse(JSON.stringify(EMPTY_STATE));
  let listeners = [];

  // ── Helpers ─────────────────────────────────────────────
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function notifyListeners(changedPath) {
    // Run auto-calculations before notifying
    recalculateAutoFields();
    listeners.forEach(fn => {
      try { fn(changedPath, state); } catch(e) { console.error('Listener error:', e); }
    });
  }

  // ── Auto-calculations ──────────────────────────────────
  function recalculateAutoFields() {
    const s1 = state.section1;
    const s4 = state.section4;
    const s5 = state.section5;
    const s6 = state.section6;

    // ── 卸货时间 自动计算 ──
    if (s4.unloading.startTime && s4.unloading.endTime) {
      const start = new Date(s4.unloading.startTime);
      const end = new Date(s4.unloading.endTime);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const hours = (end - start) / 3600000;
        s4.unloading.totalHours = hours.toFixed(1);
        const days = hours / 24;
        // 日均卸货量 = 装运数量 / 天数
        const cargoQty = parseFloat(s1.cargoQuantity) || 0;
        if (cargoQty > 0 && days > 0) {
          s4.unloading.dailyAverage = (cargoQty / 10000 / days).toFixed(2); // 万吨
        }
      }
    }

    // ── 卸船损耗 自动计算 ──
    const loadingQty = parseFloat(s1.cargoQuantity) || 0;
    const unloadedQty = parseFloat(s4.unloadedQuantity) || 0;
    if (loadingQty > 0 && unloadedQty > 0) {
      const lossQty = loadingQty - unloadedQty;
      s4.loss.quantity = lossQty.toFixed(2);
      const lossRate = (lossQty / loadingQty) * 100;
      s4.loss.rate = lossRate.toFixed(4);
    }

    // ── 出库损耗率 自动计算 ──
    const cumulativeQty = parseFloat(s5.pickup.cumulativeQuantity) || 0;
    const outLossQty = parseFloat(s5.pickup.outboundLossQuantity) || 0;
    if (cumulativeQty > 0 && outLossQty > 0) {
      const outLossRate = (outLossQty / cumulativeQty) * 100;
      s5.pickup.outboundLossRate = outLossRate.toFixed(4);
    }

    // ── 提货天数 自动计算 ──
    if (s5.pickup.startTime && s5.pickup.endTime) {
      const ps = new Date(s5.pickup.startTime);
      const pe = new Date(s5.pickup.endTime);
      if (!isNaN(ps) && !isNaN(pe) && pe > ps) {
        s5.pickup.totalDays = Math.ceil((pe - ps) / 86400000);
      }
    }

    // ── 港口费用 自动计算 ──
    const portOpFee = parseFloat(s6.southernPortFees.portOperationFee) || 0;
    const storageFee = parseFloat(s6.southernPortFees.storageFee) || 0;
    const otherFees = parseFloat(s6.southernPortFees.otherFees) || 0;
    const totalPortFee = portOpFee + storageFee + otherFees;
    if (totalPortFee > 0) {
      s6.southernPortFees.totalPortFee = totalPortFee.toFixed(2);
      if (loadingQty > 0) {
        s6.southernPortFees.unitCost = (totalPortFee / loadingQty).toFixed(2);
      }
    }
    const estPortFee = parseFloat(s6.southernPortFees.estimatedPortFee) || 0;
    if (estPortFee > 0 && loadingQty > 0) {
      const estTotal = estPortFee * loadingQty;
      s6.southernPortFees.deviation = (totalPortFee - estTotal).toFixed(2);
      s6.southernPortFees.unitDeviation = ((totalPortFee / loadingQty) - estPortFee).toFixed(2);
    }

    // ── 整船总结 自动生成 ──
    autoGenerateSummary(state);
  }

  function autoGenerateSummary(state) {
    const m = state.meta;
    const s1 = state.section1;
    const s2 = state.section2;
    const s4 = state.section4;
    const s5 = state.section5;
    const s6 = state.section6;

    const ship = (m.shipName || '________') + '/' + (m.voyage || '________');
    const cargoQty = s1.cargoQuantity || '____';
    const unloadedQty = s4.unloadedQuantity || '____';
    const pickupQty = s5.pickup.cumulativeQuantity || '____';
    const lossQty = s4.loss.quantity || '____';
    const lossRate = s4.loss.rate || '____';
    const contractStd = s4.loss.contractStandard || '____';
    const unloadingDays = (s4.unloading.totalHours ? (parseFloat(s4.unloading.totalHours) / 24).toFixed(1) : '____');
    const pickupDays = s5.pickup.totalDays || '____';
    const isClaimed = s4.insurance.claimed;
    const dockName = s2.dockName || '____';
    const berth = s2.berthNumber || '____';

    state.section7.operationsOverview = '本次航次' + ship + '货物总数量' + cargoQty + '吨，实际卸货' + unloadedQty +
      '吨、提货' + pickupQty + '吨，损耗' + lossQty + '吨（损耗率' + lossRate +
      '%），均符合合同约定（≤' + contractStd + '%）及相关标准；船舶航行轨迹可追溯、无异常，' +
      '靠泊泊位（' + berth + '）、码头仓位安排合理，卸货效率达标（' + unloadingDays +
      '天完成），清仓质量合格。';

    state.section7.qualityControl = '货物从装运港至提货结束，全程品质稳定，检验、巡查记录完整，无霉变、结块等异常情况，满足提货标准要求。';

    state.section7.safetyProcess = '全程落实安全风险排查，无安全事故发生；靠泊、卸货、提货各环节流程规范，相关记录、照片、报告等资料完整归档，可随时查询核查；' +
      (isClaimed ? '本航次发生出险，已按保险流程处理。' : '本航次未出险。');

    const pd = parseFloat(pickupDays);
    state.section7.improvements = '本次作业整体顺利，各环节衔接顺畅；' +
      (pd > 45 ? '提货周期较长（' + pickupDays + '天），后续需加快提货进度；' : '') +
      '后续将继续优化作业计划，加强沟通对接，提升作业效率和损耗控制水平。';
  }

  // ── Public API ──────────────────────────────────────────
  return {
    /** Get full state or a specific path */
    getState(path) {
      if (!path) return state;
      const keys = path.split('.');
      let val = state;
      for (const k of keys) {
        if (val == null) return undefined;
        val = val[k];
      }
      return val;
    },

    /** Set a value at a dot-separated path. e.g. set('section1.portOfLoading', '北良港') */
    set(path, value) {
      const keys = path.split('.');
      let obj = state;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in obj)) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      const oldVal = obj[keys[keys.length - 1]];
      if (JSON.stringify(oldVal) !== JSON.stringify(value)) {
        obj[keys[keys.length - 1]] = value;
        notifyListeners(path);
      }
    },

    /** Bulk update multiple paths at once (single notification) */
    setMultiple(updates) {
      for (const [path, value] of Object.entries(updates)) {
        const keys = path.split('.');
        let obj = state;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!(keys[i] in obj)) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      }
      notifyListeners('*');
    },

    /** Reset to empty state */
    reset() {
      state = JSON.parse(JSON.stringify(EMPTY_STATE));
      notifyListeners('*');
    },

    /** Import from serialized JSON string */
    importFromJSON(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        // Merge with empty state to handle migrations
        state = JSON.parse(JSON.stringify(EMPTY_STATE));
        deepMerge(state, data);
        notifyListeners('*');
        return true;
      } catch(e) {
        console.error('Failed to import state:', e);
        return false;
      }
    },

    /** Export state as JSON string */
    exportToJSON() {
      return JSON.stringify(state, null, 2);
    },

    /** Subscribe to state changes. Returns unsubscribe function. */
    onChange(fn) {
      listeners.push(fn);
      return () => {
        listeners = listeners.filter(l => l !== fn);
      };
    },

    /** Get section completion status: 'empty' | 'partial' | 'complete' */
    getSectionStatus(sectionId) {
      const section = state[sectionId];
      if (!section) return 'empty';
      const fields = flattenObject(section);
      let filled = 0, total = 0;
      for (const [key, val] of Object.entries(fields)) {
        // Skip file arrays and complex nested objects (handled separately)
        if (key.startsWith('_')) continue;
        if (val === null || val === undefined || val === '' || val === false) {
          total++;
        } else if (Array.isArray(val) && val.length === 0) {
          total++;
        } else if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0) {
          // nested object — count its leaf fields
          const nested = flattenObject(val);
          for (const [nk, nv] of Object.entries(nested)) {
            total++;
            if (nv !== null && nv !== undefined && nv !== '' && nv !== false) filled++;
          }
          continue;
        } else {
          filled++;
          total++;
        }
      }
      if (filled === 0 && total > 0) return 'empty';
      if (filled >= total) return 'complete';
      return 'partial';
    },

    /** Get initial empty state reference for the form renderer */
    getEmptyState() {
      return JSON.parse(JSON.stringify(EMPTY_STATE));
    }
  };

  // ── Internal helpers ────────────────────────────────────
  function flattenObject(obj, prefix = '') {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(result, flattenObject(val, path));
      } else {
        result[path] = val;
      }
    }
    return result;
  }

  function deepMerge(target, source) {
    for (const [key, val] of Object.entries(source)) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && key in target && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        deepMerge(target[key], val);
      } else {
        target[key] = val;
      }
    }
  }
})();
