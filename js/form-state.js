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
      waterwayWaybillText: '',
      waterwayWaybillFile: null,  // { name, size, dataURL }
      // 装运港、数量及时间
      portOfLoading: '',
      cargoQuantity: '',          // 吨
      loadingStartTime: '',
      loadingEndTime: '',
      // 检验报告及封签
      inspectionReportText: '',
      inspectionReportFile: null,
      sealCheckFile: null,        // 封签检查附图
      // 预计到港时间
      estimatedArrivalTime: '',
      actualArrivalTime: '',
      // 轨迹
      plannedRoute: '',           // 预定航线
      actualRoute: '',            // 实际航线
      routeDeviation: '无',       // 是否偏离路线
      trackingDevice: '',         // 轨迹记录设备/单位
      routeNotes: ''              // 航行备注(天气/事故等)
    },

    section2: {
      dockName: '',               // 靠泊码头名称
      berthNumber: '',            // 泊位号
      equipmentStatus: '运行正常', //
      warehousePositions: '',     // 仓位编号
      warehouseCapacity: '',      // 仓位容量(万吨)
      cargoWeight: '',            // 货物吨数(万吨)
      storageConditions: '',      // 存储条件(默认已填模板文字)
      isDirectPickup: false,      // 是否直提
      directPickupStartTime: '',  // 直提开始时间
      directPickupNotes: ''       // 直提备注
    },

    section3: {
      // 天气及风力
      weather: {
        sunny: true,
        cloudy: false,
        overcast: false,
        noRainThunder: true       // 无降雨雷电
      },
      windLevel: '',              // 风力级数
      windDirection: '',          // 风向
      windStandard: '',           // 风力作业标准(≤X级)
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
        count: '',
        time: '',
        location: '船舶各货舱舱口',
        photographer: '',
        notes: '货舱封签完好、货物无坍塌、无霉变、无结块等异常',
        files: []                 // [{ name, size, dataURL }]
      },
      // 取样照片
      samplingPhotos: {
        count: '',
        time: '',
        sampler: '',              // 取样人员
        notes: '取样规范、点位覆盖各货舱，样品妥善封存用于后续复检',
        files: []
      }
    },

    section4: {
      // 码头作业线
      operatingLines: {
        lineCount: '',
        dailyCapacityPerLine: ''  // 吨/日/条
      },
      // 卸货天数
      unloading: {
        startTime: '',
        endTime: '',
        totalHours: '',           // 共计小时
        dailyAverage: '',          // 日均卸货量
        hasPause: false,          // 是否暂停
        pauseReason: '',
        pauseDuration: ''
      },
      // 船舱清仓
      holdCleaningResult: '各货舱舱壁、舱底无残留货物、无杂物、无积水，清仓干净度符合相关标准',
      // 品质情况
      qualityInspectionResult: '货物品质与装运港检验报告一致，无霉变、结块、杂质超标、发热等异常，符合合同约定及相关标准',
      // 损耗情况
      loss: {
        quantity: '',             // 实际损耗量(吨)
        rate: '',                 // 损耗率(%)
        contractStandard: '',     // 合同约定损耗标准
        reason: ''                // 损耗原因
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
        frequency: '',            // 巡查频次
        content: '货物有无霉变、结块、发热、虫蛀等异常，仓库通风、防潮设施运行情况',
        results: ''               // 巡查结果
      },
      // 提货情况
      pickup: {
        startTime: '',
        endTime: '',
        totalDays: '',
        cumulativeQuantity: '',   // 累计提货量
        outboundLossQuantity: '', // 出库损耗量
        outboundLossRate: '',     // 出库损耗率
        outboundLossReason: ''    // 损耗原因
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
        otherFees: '',            // 其他杂费
        unitCost: '',             // 折合单吨成本
        estimatedPortFee: '',     // 销售时预估港口费用
        deviation: '',            // 费用偏差
        unitDeviation: ''         // 单吨偏差
      },
      shippingCostPerTon: '',     // 海运费(元/吨)
      profitAnalysis: ''          // 利润分析
    },

    section7: {
      operationsOverview: '',     // 作业概况
      qualityControl: '',         // 品质管控
      safetyProcess: '',          // 安全及流程
      improvements: ''            // 不足及改进
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
    listeners.forEach(fn => {
      try { fn(changedPath, state); } catch(e) { console.error('Listener error:', e); }
    });
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
