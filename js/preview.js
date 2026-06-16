/**
 * preview.js — Live preview panel rendering
 * Styled to match the Word template: SimSun body, SimHei headings, simulates paper page.
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

    // ── Cover ──
    html += `<div class="doc-cover">
      <div class="cover-attach">附件1：</div>
      <div class="cover-title-large">内贸玉米散粮</div>
      <div class="cover-title-large cover-spacing">船 小 结</div>
      <div class="cover-ship-name">船名：${esc(m.shipName || '信耀')}/${esc(m.voyage || '2604')}</div>
      <div class="cover-ship-name">船名：${esc(m.shipName || '______')}/${esc(m.voyage || '______')}</div>
      <div class="cover-dept">${esc(m.operatingDept || '______经营部')}</div>
      <div class="cover-date">${formatDate(m.reportDate) || '______年__月__日'}</div>
    </div>`;

    // ── TOC ──
    html += `<div class="doc-toc">
      <div class="toc-title">目录</div>
      <div class="toc-list">
        <div class="toc-item">1. 到港前船舶情况</div>
        <div class="toc-item toc-sub">2. 码头计划仓库情况</div>
        <div class="toc-item toc-sub">3. 船靠泊卸货前情况</div>
        <div class="toc-item toc-sub">4. 船舶从卸货到结束情况</div>
        <div class="toc-item toc-sub">5. 提货情况</div>
        <div class="toc-item toc-sub">6. 成本分析</div>
        <div class="toc-item toc-sub">7. 整船总结</div>
      </div>
    </div>`;

    // ── Section 1 ──
    html += renderSectionHeading('1. 到港前船舶情况');
    html += `<p class="doc-p">本航次船舶承载【${esc(shipFull)}】，到港前完成各项前置核查，相关情况详细如下：</p>`;
    html += renderField('水路运单', s.section1.waterwayWaybillText, s.section1.waterwayWaybillFile);
    html += renderField('装运港、数量及时间',
      `装运港：${uv(s.section1.portOfLoading)}；货物总数量：${uv(s.section1.cargoQuantity)}吨；装运开始时间：${formatDatetime(s.section1.loadingStartTime)}，装运结束时间：${formatDatetime(s.section1.loadingEndTime)}（如有报告可不填）`);
    html += renderField('检验报告及封签', s.section1.inspectionReportText, s.section1.inspectionReportFile);
    html += renderField('封签检查情况', '', s.section1.sealCheckFile, '封签检查情况附图');
    html += renderField('1.4 预计到港时间',
      `结合航线、航行速度及海域气象，预计到港时间：${uv(formatDatetime(s.section1.estimatedArrivalTime))}；实际到港时间：${uv(formatDatetime(s.section1.actualArrivalTime))}`);
    html += renderField('1.5 轨迹情况',
      `船舶全程航行轨迹可追溯，预定航线：${uv(s.section1.plannedRoute)}→${uv(s.section1.actualRoute)}（起始至终点），实际航行${uv(s.section1.routeDeviation, '无偏离预定航线、无违规停靠情况')}；轨迹由${uv(s.section1.trackingDevice)}（设备/单位）全程记录，数据完整可查询，航行期间${uv(s.section1.routeNotes, '无恶劣天气、海上事故等异常')}。`);

    // ── Section 2 ──
    html += renderSectionHeading('2. 码头计划仓库情况');
    html += `<p class="doc-p">提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：</p>`;
    html += renderField('2.1 靠船泊位',
      `确认靠泊码头：${uv(s.section2.dockName)}，泊位：${uv(s.section2.berthNumber)}；泊位无障碍物、无其他船舶占用，配套装卸设备（起重机、传送带等）运行正常，具备靠泊及卸货条件。`);
    html += renderField('2.2 码头仓位',
      `码头预留仓位编号：${uv(s.section2.warehousePositions)}，仓位容量：${uv(s.section2.warehouseCapacity)}吨，可完全容纳本航次货物（${uv(s.section2.cargoWeight)}万吨）；仓位地面平整、干燥、无积水、无杂物，通风、防潮、防鼠设施完善，符合存储要求；仓位已提前清理、消毒，经检查合格后预留使用。`);
    const dp = s.section2.isDirectPickup;
    html += `<p class="doc-p"><b>2.3 是否直提安排：</b>` +
      `<span class="chk">${dp ? '☑' : '□'}</span> 是 <span class="chk">${dp ? '□' : '☑'}</span> 否；` +
      (dp ? `直提开始时间：${uv(formatDatetime(s.section2.directPickupStartTime))}` : '若为不直提：货物全部存入上述预留码头仓位，后续按提货计划逐步出库。') +
      `</p>`;

    // ── Section 3 ──
    html += renderSectionHeading('3. 船靠泊卸货前情况');
    html += `<p class="doc-p">船舶靠泊后，卸货前完成现场勘察、风险排查及资料留存，确保卸货作业安全、规范，具体情况如下：</p>`;
    const wx = s.section3.weather;
    html += `<p class="doc-p"><b>3.1 天气及风力情况：</b>卸货前现场天气：` +
      `<span class="chk">${wx.sunny ? '☑' : '□'}</span> 晴天 <span class="chk">${wx.cloudy ? '☑' : '□'}</span> 阴天 <span class="chk">${wx.overcast ? '☑' : '□'}</span> 多云（无降雨、雷电等恶劣天气）；` +
      `现场风力：${uv(s.section3.windLevel)}级，风向：${uv(s.section3.windDirection)}；风力符合卸货作业标准（≤${uv(s.section3.windStandard)}级），无影响卸货的天气因素。</p>`;
    const risk = s.section3.riskCheck;
    html += `<p class="doc-p"><b>3.2 风险情况：</b>组织专人对船舶靠泊状态、码头作业区域、装卸设备、消防设施等进行全面风险排查；` +
      `排查结果：<span class="chk">${risk.hasRisk ? '□' : '☑'}</span> 无异常风险 <span class="chk">${risk.hasRisk ? '☑' : '□'}</span> 存在轻微风险` +
      (risk.hasRisk ? `（风险描述：${uv(risk.riskDescription)}）；整改措施：${uv(risk.remediation)}，整改完成时间：${formatDate(risk.remediationCompleteTime)}，复查结果：${uv(risk.recheckResult, '合格')}` :
        `；整改措施：${uv('无')}，复查结果：合格，确认无卸货安全风险后，启动卸货准备工作；`) +
      `现场明确安全责任人：${uv(s.section3.safetyOfficer)}，应急处置预案已落实。</p>`;
    if (!risk.hasRisk) {
      html = html.replace('整改措施：无', '整改措施：无（如无风险则填"无"）');
    }
    html += renderField('3.3 开舱照片、取样照片',
      `卸货前完成开舱、取样照片拍摄，照片清晰可辨、标注完整，全部归档留存；开舱照片：${uv(s.section3.hatchPhotos.count)}张，拍摄时间：${uv(formatDatetime(s.section3.hatchPhotos.time))}，拍摄地点：${uv(s.section3.hatchPhotos.location, '船舶各货舱舱口')}，照片显示：货舱封签完好、货物无坍塌、无霉变、无结块等异常；取样照片：${uv(s.section3.samplingPhotos.count)}张，拍摄时间：${uv(formatDatetime(s.section3.samplingPhotos.time))}，取样人员：${uv(s.section3.samplingPhotos.sampler)}，取样规范、点位覆盖各货舱，样品妥善封存用于后续复检。`);
    html += renderPhotoPlaceholder('开舱照片', s.section3.hatchPhotos);
    html += renderPhotoPlaceholder('取样照片', s.section3.samplingPhotos);

    // ── Section 4 ──
    html += renderSectionHeading('4. 船舶从卸货到结束情况');
    html += `<p class="doc-p">卸货作业按计划推进，全程做好作业记录、品质监控及清仓核查，具体如下：</p>`;
    html += renderField('4.1 码头作业线',
      `启用码头作业线${uv(s.section4.operatingLines.lineCount)}条，每条作业线日装卸${uv(s.section4.operatingLines.dailyCapacityPerLine)}吨；作业期间设备运行正常，无故障停机情况，操作人员持证上岗、操作规范。`);
    const ul = s.section4.unloading;
    html += renderField('4.2 卸货天数',
      `卸货开始时间：${uv(formatDatetime(ul.startTime))}，卸货结束时间：${uv(formatDatetime(ul.endTime))}；共计卸货${uv(ul.totalHours)}小时；日均卸货量：${uv(ul.dailyAverage)}万吨，整体效率符合预期计划；卸货期间暂停作业情况：` +
      `<span class="chk">${ul.hasPause ? '□' : '☑'}</span> 无 <span class="chk">${ul.hasPause ? '☑' : '□'}</span> 有` +
      (ul.hasPause ? `（暂停原因：${uv(ul.pauseReason)}，暂停时长：${uv(ul.pauseDuration)}小时，已及时恢复作业，未影响整体进度）` : ''));
    html += renderField('4.3 船舱清仓情况',
      uv(s.section4.holdCleaningResult, '卸货结束后，组织专人对各货舱进行全面清仓检查。清仓结果：各货舱舱壁、舱底无残留货物、无杂物、无积水，清仓干净度符合相关标准；清仓检查记录完整，相关人员签字确认。'));
    html += renderField('4.4 品质情况',
      uv(s.section4.qualityInspectionResult, '卸货过程中同步进行货物品质抽样检验，检验点位覆盖各货舱、各批次；检验结果：货物品质与装运港检验报告一致，无霉变、结块、杂质超标、发热等异常，符合合同约定及相关标准，检验记录完整归档。'));
    html += renderField('4.5 损耗情况',
      `全程统计卸货损耗，实际损耗量：${uv(s.section4.loss.quantity)}吨，损耗率：${uv(s.section4.loss.rate)}%；合同约定损耗标准：≤${uv(s.section4.loss.contractStandard)}%，本次损耗控制在约定范围内；损耗原因：${uv(s.section4.loss.reason, '无异常损耗')}（如：货物自然挥发、装卸轻微损耗，无异常损耗）。`);
    const ins = s.section4.insurance;
    html += renderField('4.6 是否保险',
      `<span class="chk">${ins.claimed ? '□' : '☑'}</span> 未出险 <span class="chk">${ins.claimed ? '☑' : '□'}</span> 出险；出险时间：${ins.claimed ? uv(ins.timeRange) : '____年__月__日 - ____年__月__日'}。`);
    html += `<p class="doc-p"><b>出险原因：</b>${uv(ins.reason)}</p>`;
    html += `<p class="doc-p"><b>保险受理情况：</b>${uv(ins.acceptanceDetails)}</p>`;

    // ── Section 5 ──
    html += renderSectionHeading('5. 提货情况');
    html += `<p class="doc-p">货物卸货完成后，按提货计划有序开展提货作业，全程做好粮质巡查、提货统计及商扣记录，具体如下：</p>`;
    html += renderField('5.1 粮质巡查情况',
      `出库期间安排专人每周开展粮质巡查，巡查频次：${uv(s.section5.qualityPatrol.frequency)}；巡查内容：货物有无霉变、结块、发热、虫蛀等异常，仓库通风、防潮设施运行情况；巡查结果：${uv(s.section5.qualityPatrol.results, '全程无异常，货物品质保持稳定，符合提货标准；巡查记录完整。')}`);
    const pu = s.section5.pickup;
    html += renderField('5.2 提货情况',
      `提货开始时间：${uv(formatDatetime(pu.startTime))}，提货结束时间：${uv(formatDatetime(pu.endTime))}，共计提货${uv(pu.totalDays)}天；累计提货量：${uv(pu.cumulativeQuantity)}吨。实际出库损耗量：${uv(pu.outboundLossQuantity)}吨，损耗率：${uv(pu.outboundLossRate)}%；损耗原因：${uv(pu.outboundLossReason, '货物自然挥发')}（如：货物自然挥发、装卸轻微损耗，无异常损耗）。`);
    const vd = s.section5.vendorDeductions;
    html += renderField('5.3 执行商扣情况',
      `<span class="chk">${vd.hasDeductions ? '□' : '☑'}</span> 无商扣 <span class="chk">${vd.hasDeductions ? '☑' : '□'}</span> 有商扣；` +
      (vd.hasDeductions ? `商扣批次：${uv(vd.batch)}，商扣原因：${uv(vd.reason)}（如：少量货物杂质轻微超标、提货延迟等），商扣数量：${uv(vd.quantity)}吨，商扣金额：${uv(vd.amount)}元。` : '若有商扣：商扣批次：__________，商扣原因：__________'));
    html += `<p class="doc-p"><b>附整船执行台账：</b></p>`;

    // ── Section 6 ──
    html += renderSectionHeading('6. 成本分析');
    html += renderField('北方采购价', uv(s.section6.northernPurchasePrice));
    const sf = s.section6.southernPortFees;
    html += renderField('费用偏差',
      `南方港口港杂费${uv(sf.portOperationFee)}，堆存费${uv(sf.storageFee)}等各项杂费，折合单吨${uv(sf.unitCost)}元/吨，销售时预估港口费用${uv(sf.estimatedPortFee)}元/吨，费用偏差${uv(sf.deviation)}元，单吨偏差${uv(sf.unitDeviation)}元/吨。`);
    html += renderField('海运费', uv(s.section6.shippingCostPerTon) + ' 元/吨');
    html += renderField('利润分析', uv(s.section6.profitAnalysis));

    // ── Section 7 ──
    html += renderSectionHeading('7. 整船总结');
    html += `<p class="doc-p">本航次船舶从装运、航行、靠泊、卸货至提货，全程严格遵循相关规范及作业计划，各环节衔接顺畅、管控到位，整体作业顺利完成，具体总结如下：</p>`;
    html += `<p class="doc-p"><b>1. 作业概况：</b>${uv(s.section7.operationsOverview)}</p>`;
    html += `<p class="doc-p"><b>2. 品质管控：</b>${uv(s.section7.qualityControl)}</p>`;
    html += `<p class="doc-p"><b>3. 安全及流程：</b>${uv(s.section7.safetyProcess)}</p>`;
    html += `<p class="doc-p"><b>4. 不足及改进（可选）：</b>${uv(s.section7.improvements)}</p>`;

    // ── Signatures ──
    html += `<div class="doc-signatures">
      <p>销售支持确认：${uv(s.footer.salesSupportConfirm)}</p>
      <p>物流现场确认：${uv(s.footer.logisticsConfirm)}</p>
      <p>销售人员确认：${uv(s.footer.salesConfirm)}</p>
      <p>报告日期：${formatDate(m.reportDate) || '____年__月__日'}</p>
    </div>`;

    container.innerHTML = html;
  }

  // ── Helpers ──
  function esc(s) { if (!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function uv(val, def) { if (val === null || val === undefined || val === '') return def || '<span class="gap">______</span>'; return esc(String(val)); }
  function formatDate(val) { if (!val) return ''; const d = new Date(val); if (isNaN(d.getTime())) return val; return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`; }
  function formatDatetime(val) { if (!val) return ''; const d = new Date(val); if (isNaN(d.getTime())) return val; return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

  function renderSectionHeading(text) {
    return `<h2 class="doc-sec-heading">${text}</h2>`;
  }

  function renderField(label, content, fileData, imgLabelText) {
    let html = `<p class="doc-p"><b>${label}：</b>${content}</p>`;
    if (fileData) {
      html += `<div class="doc-photo has-file">[附图：${esc(fileData.name || '已上传')}]</div>`;
    } else if (imgLabelText) {
      html += `<div class="doc-photo">[${imgLabelText}]</div>`;
    }
    return html;
  }

  function renderPhotoPlaceholder(label, photoData) {
    if (photoData.files && photoData.files.length > 0) {
      let h = `<div class="doc-photo has-file">[${label}：已上传 ${photoData.files.length} 张]</div>`;
      photoData.files.forEach(f => {
        if (f.dataURL && f.type && f.type.startsWith('image/')) {
          h += `<img src="${f.dataURL}" class="doc-inline-img" />`;
        }
      });
      return h;
    }
    return `<div class="doc-photo">[${label}附图]</div>`;
  }

  return { init, render };
})();
