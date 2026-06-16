/**
 * preview.js — Live preview panel rendering
 * Generates the full report HTML from formState to simulate the Word template.
 */
const Preview = (function() {
  'use strict';

  let container;

  function init(cont) {
    container = cont;
    FormState.onChange(() => render());
    render();
  }

  function render() {
    if (!container) return;
    const s = FormState.getState();
    const m = s.meta;
    const shipFull = (m.shipName || '______') + '/' + (m.voyage || '______');

    let html = '';

    // ── Cover Page ──
    html += `<div class="cover-title">附件1：</div>`;
    html += `<div class="cover-title">内贸玉米散粮</div>`;
    html += `<div class="cover-subtitle">船 小 结</div>`;
    html += `<div class="cover-ship">船名：${esc(m.shipName || '______')}/${esc(m.voyage || '______')}</div>`;
    html += `<div class="cover-dept">${esc(m.operatingDept || '______经营部')}</div>`;
    html += `<div class="cover-date">${formatDate(m.reportDate) || '______年__月__日'}</div>`;

    // ── TOC ──
    html += `<div class="toc-title">目录</div>`;
    const tocItems = [
      '1. 到港前船舶情况',
      '2. 码头计划仓库情况',
      '3. 船靠泊卸货前情况',
      '4. 船舶从卸货到结束情况',
      '5. 提货情况',
      '6. 成本分析',
      '7. 整船总结'
    ];
    tocItems.forEach(t => { html += `<div class="toc-item">${t}</div>`; });

    // ── Section 1 ──
    html += `<div class="section-heading page-break-before">1. 到港前船舶情况</div>`;
    html += `<div class="field-line">本航次船舶承载【${esc(shipFull)}】，到港前完成各项前置核查，相关情况详细如下：</div>`;
    html += renderFileField('水路运单', s.section1.waterwayWaybillText, s.section1.waterwayWaybillFile, '附图');
    html += renderFieldLine('装运港、数量及时间', `装运港：${v(s.section1.portOfLoading)}；货物总数量：${v(s.section1.cargoQuantity)}吨；装运开始时间：${formatDatetime(s.section1.loadingStartTime)}，装运结束时间：${formatDatetime(s.section1.loadingEndTime)}`);
    html += renderFileField('检验报告及封签', s.section1.inspectionReportText, s.section1.inspectionReportFile, '封签检查情况附图');
    html += renderFileField('封签检查情况', '', s.section1.sealCheckFile);
    html += renderFieldLine('预计到港时间', `预计到港时间：${formatDatetime(s.section1.estimatedArrivalTime)}；实际到港时间：${formatDatetime(s.section1.actualArrivalTime)}`);
    html += renderFieldLine('轨迹情况', `预定航线：${v(s.section1.plannedRoute)}→${v(s.section1.actualRoute)}（起始至终点），实际航行${v(s.section1.routeDeviation, '无偏离预定航线、无违规停靠情况')}；轨迹由${v(s.section1.trackingDevice)}全程记录，数据完整可查询，航行期间${v(s.section1.routeNotes, '无恶劣天气、海上事故等异常')}`);

    // ── Section 2 ──
    html += `<div class="section-heading">2. 码头计划仓库情况</div>`;
    html += `<div class="field-line">提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：</div>`;
    html += renderFieldLine('靠船泊位', `确认靠泊码头：${v(s.section2.dockName)}，泊位：${v(s.section2.berthNumber)}；泊位无障碍物、无其他船舶占用，配套装卸设备${v(s.section2.equipmentStatus, '运行正常')}，具备靠泊及卸货条件。`);
    html += renderFieldLine('码头仓位', `码头预留仓位编号：${v(s.section2.warehousePositions)}，仓位容量：${v(s.section2.warehouseCapacity, '__')}吨，可完全容纳本航次货物（${v(s.section2.cargoWeight, '__')}万吨）；仓储条件良好。`);
    const dp = s.section2.isDirectPickup;
    html += `<div class="field-line"><span class="field-label">是否直提安排：</span>`;
    html += `<span class="checkbox-mark">${dp ? '☑' : '□'}</span> 是 `;
    html += `<span class="checkbox-mark">${dp ? '□' : '☑'}</span> 否`;
    if (dp) {
      html += `；直提开始时间：${formatDatetime(s.section2.directPickupStartTime)}`;
    }
    html += `</div>`;

    // ── Section 3 ──
    html += `<div class="section-heading">3. 船靠泊卸货前情况</div>`;
    const wx = s.section3.weather;
    html += renderFieldLine('天气及风力情况',
      `卸货前现场天气：${wx.sunny ? '☑晴天' : '□晴天'} ${wx.cloudy ? '☑阴天' : '□阴天'} ${wx.overcast ? '☑多云' : '□多云'}；` +
      `现场风力：${v(s.section3.windLevel)}级，风向：${v(s.section3.windDirection)}；` +
      `风力符合卸货作业标准（≤${v(s.section3.windStandard)}级），无影响卸货的天气因素。`);
    const risk = s.section3.riskCheck;
    html += renderFieldLine('风险情况',
      `排查结果：${risk.hasRisk ? '□无异常风险 ☑存在轻微风险' : '☑无异常风险 □存在轻微风险'}` +
      (risk.hasRisk ? `（风险描述：${v(risk.riskDescription)}）；整改措施：${v(risk.remediation)}，整改完成时间：${formatDate(risk.remediationCompleteTime)}，复查结果：${v(risk.recheckResult, '合格')}` : ''));
    html += renderFieldLine('安全责任人', v(s.section3.safetyOfficer));
    html += renderPhotoField('开舱照片', s.section3.hatchPhotos);
    html += renderPhotoField('取样照片', s.section3.samplingPhotos);

    // ── Section 4 ──
    html += `<div class="section-heading">4. 船舶从卸货到结束情况</div>`;
    html += renderFieldLine('码头作业线', `启用码头作业线${v(s.section4.operatingLines.lineCount)}条，每条作业线日装卸${v(s.section4.operatingLines.dailyCapacityPerLine)}吨；作业期间设备运行正常，无故障停机情况，操作人员持证上岗、操作规范。`);
    const ul = s.section4.unloading;
    html += renderFieldLine('卸货天数',
      `卸货开始时间：${formatDatetime(ul.startTime)}，卸货结束时间：${formatDatetime(ul.endTime)}；` +
      `共计卸货${v(ul.totalHours)}小时；日均卸货量：${v(ul.dailyAverage)}万吨` +
      (ul.hasPause ? `；暂停情况：有（原因：${v(ul.pauseReason)}，时长：${v(ul.pauseDuration)}小时）` : '；无暂停'));
    html += renderFieldLine('船舱清仓情况', v(s.section4.holdCleaningResult));
    html += renderFieldLine('品质情况', v(s.section4.qualityInspectionResult));
    html += renderFieldLine('损耗情况',
      `实际损耗量：${v(s.section4.loss.quantity)}吨，损耗率：${v(s.section4.loss.rate)}%；` +
      `合同约定损耗标准：≤${v(s.section4.loss.contractStandard)}%，本次损耗控制在约定范围内；` +
      `损耗原因：${v(s.section4.loss.reason, '无异常损耗')}`);
    const ins = s.section4.insurance;
    html += renderFieldLine('是否保险',
      `${ins.claimed ? '□未出险 ☑出险' : '☑未出险 □出险'}` +
      (ins.claimed ? `；出险时间：${v(ins.timeRange)}；出险原因：${v(ins.reason)}；保险受理情况：${v(ins.acceptanceDetails)}` : ''));

    // ── Section 5 ──
    html += `<div class="section-heading">5. 提货情况</div>`;
    html += renderFieldLine('粮质巡查情况',
      `巡查频次：${v(s.section5.qualityPatrol.frequency)}；巡查内容：${v(s.section5.qualityPatrol.content)}；巡查结果：${v(s.section5.qualityPatrol.results)}`);
    const pu = s.section5.pickup;
    html += renderFieldLine('提货情况',
      `提货开始时间：${formatDatetime(pu.startTime)}，提货结束时间：${formatDatetime(pu.endTime)}，` +
      `共计提货${v(pu.totalDays)}天；累计提货量：${v(pu.cumulativeQuantity)}吨。` +
      `出库损耗量：${v(pu.outboundLossQuantity)}吨，损耗率：${v(pu.outboundLossRate)}%；` +
      `损耗原因：${v(pu.outboundLossReason, '货物自然挥发')}`);
    const vd = s.section5.vendorDeductions;
    html += renderFieldLine('执行商扣情况',
      `${vd.hasDeductions ? '□无商扣 ☑有商扣' : '☑无商扣 □有商扣'}` +
      (vd.hasDeductions ? `；商扣批次：${v(vd.batch)}，商扣原因：${v(vd.reason)}，商扣数量：${v(vd.quantity)}吨，商扣金额：${v(vd.amount)}元` : ''));
    html += renderFileField('附整船执行台账', '', s.section5.executionLedgerFile);

    // ── Section 6 ──
    html += `<div class="section-heading">6. 成本分析</div>`;
    html += renderFieldLine('北方采购价', v(s.section6.northernPurchasePrice));
    html += renderFieldLine('南方港口费用',
      `港口作业费：${v(s.section6.southernPortFees.portOperationFee)}，堆存费：${v(s.section6.southernPortFees.storageFee)}，` +
      `其他杂费：${v(s.section6.southernPortFees.otherFees)}；折合单吨成本：${v(s.section6.southernPortFees.unitCost)}元/吨，` +
      `销售时预估港口费用：${v(s.section6.southernPortFees.estimatedPortFee)}元/吨；` +
      `费用偏差：${v(s.section6.southernPortFees.deviation)}，单吨偏差：${v(s.section6.southernPortFees.unitDeviation)}元/吨`);
    html += renderFieldLine('海运费', v(s.section6.shippingCostPerTon) + ' 元/吨');
    html += renderFieldLine('利润分析', v(s.section6.profitAnalysis));

    // ── Section 7 ──
    html += `<div class="section-heading">7. 整船总结</div>`;
    html += renderFieldLine('作业概况', v(s.section7.operationsOverview));
    html += renderFieldLine('品质管控', v(s.section7.qualityControl));
    html += renderFieldLine('安全及流程', v(s.section7.safetyProcess));
    html += renderFieldLine('不足及改进', v(s.section7.improvements));

    // ── Signatures ──
    html += `<div class="signature-area">`;
    html += `<div class="signature-line">销售支持确认：${v(s.footer.salesSupportConfirm)}</div>`;
    html += `<div class="signature-line">物流现场确认：${v(s.footer.logisticsConfirm)}</div>`;
    html += `<div class="signature-line">销售人员确认：${v(s.footer.salesConfirm)}</div>`;
    html += `<div class="signature-line">报告日期：${formatDate(m.reportDate) || '______年__月__日'}</div>`;
    html += `</div>`;

    container.innerHTML = html;
  }

  // ── Helpers ─────────────────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function v(val, defaultVal) {
    if (val === null || val === undefined || val === '') return defaultVal || '______';
    return esc(String(val));
  }

  function formatDate(val) {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  }

  function formatDatetime(val) {
    if (!val) return '______年__月__日 __:__';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  function renderFieldLine(label, content) {
    return `<div class="field-line"><span class="field-label">${label}：</span>${content}</div>`;
  }

  function renderFileField(label, text, fileData, imgLabel) {
    let html = `<div class="field-line"><span class="field-label">${label}：</span>`;
    if (text) html += esc(text);
    html += `</div>`;
    if (fileData) {
      html += `<div class="photo-placeholder has-photo">[${imgLabel || '附图'}：${esc(fileData.name || '已上传')}]</div>`;
    } else if (imgLabel) {
      html += `<div class="photo-placeholder">[${imgLabel}]</div>`;
    }
    return html;
  }

  function renderPhotoField(label, photoData) {
    let html = `<div class="field-line"><span class="field-label">${label}：</span></div>`;
    const count = photoData.count || (photoData.files && photoData.files.length ? photoData.files.length : '');
    const time = photoData.time ? formatDatetime(photoData.time) : '______年__月__日 __:__';
    const locOrSampler = label.includes('开舱') ? `拍摄地点：${v(photoData.location, '船舶各货舱舱口')}` : `取样人员：${v(photoData.sampler)}`;
    html += `<div class="field-line">${v(count)}张，拍摄时间：${time}，${locOrSampler}</div>`;
    if (photoData.files && photoData.files.length > 0) {
      html += `<div class="photo-placeholder has-photo">[${label}已上传：${photoData.files.map(f => f.name).join(', ')}]</div>`;
      // Show thumbnails for images
      photoData.files.forEach(f => {
        if (f.dataURL && f.type && f.type.startsWith('image/')) {
          html += `<img src="${f.dataURL}" style="max-width:200px;max-height:150px;margin:4px;border:1px solid #ddd;" />`;
        }
      });
    } else {
      html += `<div class="photo-placeholder">[${label}附图]</div>`;
    }
    return html;
  }

  return { init, render };
})();
