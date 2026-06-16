/**
 * export-docx.js — Word (.docx) export using the docx library
 * Generates a .docx file matching the original template format.
 * Requires: docx and FileSaver loaded via <script> tags before this script.
 */
const ExportDocx = (function() {
  'use strict';

  function getDocx() {
    if (typeof docx === 'undefined') {
      throw new Error('docx library not loaded. Please ensure the CDN script is included.');
    }
    return docx;
  }

  function v(val, def) {
    if (val === null || val === undefined || val === '') return def || '________';
    return String(val);
  }

  function fmtDate(val) {
    if (!val) return '________年__月__日';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  }

  function fmtDatetime(val) {
    if (!val) return '________年__月__日 __:__';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  async function generateAndDownload() {
    const D = getDocx();
    const {
      Document, Packer, Paragraph, TextRun,
      HeadingLevel, AlignmentType, PageBreak
    } = D;

    const s = FormState.getState();
    const m = s.meta;

    const FONT_TITLE = 'SimHei';
    const FONT_BODY = 'SimSun';
    const SZ_TITLE = 36;
    const SZ_H = 32;
    const SZ_BODY = 28;
    const SZ_SM = 24;

    function p(text, opts = {}) {
      return new Paragraph({
        children: [new TextRun({ text, font: opts.font || FONT_BODY, size: opts.size || SZ_BODY, bold: opts.bold, ...opts })],
        alignment: opts.alignment,
        spacing: opts.spacing || { after: 120 },
      });
    }

    function pMixed(runs, opts = {}) {
      return new Paragraph({
        children: runs.map(r => typeof r === 'string'
          ? new TextRun({ text: r, font: FONT_BODY, size: SZ_BODY })
          : new TextRun({ font: FONT_BODY, size: SZ_BODY, ...r })),
        alignment: opts.alignment,
        spacing: opts.spacing || { after: 120 },
      });
    }

    function heading(text) {
      return new Paragraph({
        children: [new TextRun({ text, font: FONT_TITLE, size: SZ_H, bold: true })],
        spacing: { before: 280, after: 160 },
      });
    }

    function cb(checked, label) {
      return { text: (checked ? '☑' : '□') + ' ' + label + '  ', font: FONT_BODY, size: SZ_BODY };
    }

    function ul(text) {
      return { text: text || '________', font: FONT_BODY, size: SZ_BODY, underline: text ? { type: 'single' } : { type: 'single' } };
    }

    function imgPlaceholder(label) {
      return p(`[${label}]`, { font: FONT_BODY, size: SZ_SM });
    }

    const children = [];

    // ── Cover ──
    children.push(p('附件1：', { font: FONT_BODY, size: SZ_BODY, alignment: AlignmentType.CENTER }));
    children.push(p('内贸玉米散粮', { font: FONT_TITLE, size: SZ_TITLE, bold: true, alignment: AlignmentType.CENTER }));
    children.push(p('船 小 结', { font: FONT_TITLE, size: 34, bold: true, alignment: AlignmentType.CENTER, spacing: { after: 360 } }));
    children.push(p(`船名：${v(m.shipName)}/${v(m.voyage)}`, { alignment: AlignmentType.CENTER }));
    children.push(p(`${v(m.operatingDept, '______经营部')}`, { alignment: AlignmentType.CENTER }));
    children.push(p(fmtDate(m.reportDate), { alignment: AlignmentType.CENTER, spacing: { after: 400 } }));

    // ── TOC ──
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(p('目录', { font: FONT_TITLE, size: SZ_H, bold: true, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    ['1. 到港前船舶情况','2. 码头计划仓库情况','3. 船靠泊卸货前情况','4. 船舶从卸货到结束情况','5. 提货情况','6. 成本分析','7. 整船总结'].forEach(t => children.push(p(t)));

    // ── Section 1 ──
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(heading('1. 到港前船舶情况'));
    const s1 = s.section1;
    children.push(p(`本航次船舶承载【${v(m.shipName)}/${v(m.voyage)}】，到港前完成各项前置核查，相关情况详细如下：`));
    children.push(pMixed([{ text: '水路运单：', bold: true }, { text: v(s1.waterwayWaybillText || '运单信息与货物、船名航次一致') }]));
    if (s1.waterwayWaybillFile) children.push(p(`[附图：${s1.waterwayWaybillFile.name}]`, { size: SZ_SM }));
    else children.push(imgPlaceholder('水路运单附图'));
    children.push(pMixed([
      { text: '装运港、数量及时间：装运港：', bold: true }, ul(v(s1.portOfLoading)),
      { text: '；货物总数量：' }, ul(v(s1.cargoQuantity)), { text: '吨；' },
      { text: '装运开始时间：' }, ul(fmtDatetime(s1.loadingStartTime)),
      { text: '，装运结束时间：' }, ul(fmtDatetime(s1.loadingEndTime)),
    ]));
    children.push(pMixed([{ text: '检验报告及封签：', bold: true }, { text: v(s1.inspectionReportText || '装港检验报告显示货物品质符合标准，船舱封签完好，无异常。') }]));
    if (s1.inspectionReportFile) children.push(p(`[附图：${s1.inspectionReportFile.name}]`, { size: SZ_SM }));
    if (s1.sealCheckFile) children.push(p(`[封签检查附图：${s1.sealCheckFile.name}]`, { size: SZ_SM }));
    else children.push(imgPlaceholder('封签检查情况附图'));
    children.push(pMixed([{ text: '预计到港时间：', bold: true }, { text: `预计到港时间：${fmtDatetime(s1.estimatedArrivalTime)}；实际到港时间：${fmtDatetime(s1.actualArrivalTime)}` }]));
    children.push(pMixed([{ text: '轨迹情况：', bold: true }, { text: `预定航线：${v(s1.plannedRoute)}→${v(s1.actualRoute)}（起始至终点），实际航行${v(s1.routeDeviation, '无偏离预定航线、无违规停靠情况')}；轨迹由${v(s1.trackingDevice)}全程记录。${v(s1.routeNotes, '航行期间无恶劣天气、海上事故等异常')}` }]));

    // ── Section 2 ──
    children.push(heading('2. 码头计划仓库情况'));
    const s2 = s.section2;
    children.push(p('提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：'));
    children.push(pMixed([
      { text: '靠船泊位：确认靠泊码头：', bold: true }, ul(v(s2.dockName)),
      { text: '，泊位：' }, ul(v(s2.berthNumber)),
      { text: '；泊位无障碍物、无其他船舶占用，配套装卸设备' + v(s2.equipmentStatus, '运行正常') + '，具备靠泊及卸货条件。' }
    ]));
    children.push(pMixed([
      { text: '码头仓位：码头预留仓位编号：', bold: true }, ul(v(s2.warehousePositions)),
      { text: '，仓位容量：' }, ul(v(s2.warehouseCapacity)), { text: '吨，可完全容纳本航次货物（' },
      ul(v(s2.cargoWeight)), { text: '万吨）；仓位地面平整、干燥、无积水、无杂物，通风、防潮、防鼠设施完善，符合存储要求；仓位已提前清理、消毒，经检查合格后预留使用。' }
    ]));
    children.push(pMixed([{ text: '是否直提安排：', bold: true }, cb(s2.isDirectPickup, '是'), cb(!s2.isDirectPickup, '否')]));
    if (s2.isDirectPickup) {
      children.push(pMixed([{ text: '直提开始时间：' }, ul(fmtDatetime(s2.directPickupStartTime))]));
    }

    // ── Section 3 ──
    children.push(heading('3. 船靠泊卸货前情况'));
    const s3 = s.section3;
    const wx = s3.weather;
    children.push(pMixed([
      { text: '天气及风力情况：卸货前现场天气：', bold: true },
      cb(wx.sunny, '晴天'), cb(wx.cloudy, '阴天'), cb(wx.overcast, '多云'),
      { text: `，风力${v(s3.windLevel)}级，风向：${v(s3.windDirection)}，符合卸货作业标准（≤${v(s3.windStandard)}级），无影响卸货的天气因素。` }
    ]));
    children.push(pMixed([
      { text: '风险情况：排查结果：', bold: true },
      cb(!s3.riskCheck.hasRisk, '无异常风险'), cb(s3.riskCheck.hasRisk, '存在轻微风险')
    ]));
    if (s3.riskCheck.hasRisk) {
      children.push(pMixed([{ text: `风险描述：${v(s3.riskCheck.riskDescription)}；整改措施：${v(s3.riskCheck.remediation)}，整改完成时间：${fmtDate(s3.riskCheck.remediationCompleteTime)}，复查结果：${v(s3.riskCheck.recheckResult, '合格')}` }]));
    }
    children.push(pMixed([{ text: '安全责任人：', bold: true }, { text: v(s3.safetyOfficer) }]));
    // 开舱照片
    children.push(pMixed([{ text: '开舱照片：', bold: true }, { text: `${v(s3.hatchPhotos.count)}张，拍摄时间：${fmtDatetime(s3.hatchPhotos.time)}，拍摄地点：${v(s3.hatchPhotos.location, '船舶各货舱舱口')}，拍摄人员：${v(s3.hatchPhotos.photographer)}` }]));
    if (s3.hatchPhotos.files && s3.hatchPhotos.files.length > 0) {
      children.push(p(`[开舱照片已上传：${s3.hatchPhotos.files.map(f=>f.name).join(', ')}]`, { size: SZ_SM }));
    } else {
      children.push(imgPlaceholder('开舱照片'));
    }
    // 取样照片
    children.push(pMixed([{ text: '取样照片：', bold: true }, { text: `${v(s3.samplingPhotos.count)}张，拍摄时间：${fmtDatetime(s3.samplingPhotos.time)}，取样人员：${v(s3.samplingPhotos.sampler)}` }]));
    if (s3.samplingPhotos.files && s3.samplingPhotos.files.length > 0) {
      children.push(p(`[取样照片已上传：${s3.samplingPhotos.files.map(f=>f.name).join(', ')}]`, { size: SZ_SM }));
    } else {
      children.push(imgPlaceholder('取样照片'));
    }

    // ── Section 4 ──
    children.push(heading('4. 船舶从卸货到结束情况'));
    const s4 = s.section4;
    const s4ul = s4.unloading;
    children.push(pMixed([{ text: '码头作业线：启用码头作业线 ', bold: true }, ul(v(s4.operatingLines.lineCount)), { text: ' 条，每条作业线日装卸 ' }, ul(v(s4.operatingLines.dailyCapacityPerLine)), { text: ' 吨；作业期间设备运行正常，操作人员规范。' }]));
    children.push(pMixed([
      { text: '卸货天数：卸货开始时间：', bold: true }, ul(fmtDatetime(s4ul.startTime)),
      { text: '，卸货结束时间：' }, ul(fmtDatetime(s4ul.endTime)),
      { text: '；共计卸货：' }, ul(v(s4ul.totalHours)), { text: '小时；日均卸货量：' }, ul(v(s4ul.dailyAverage)), { text: '万吨' }
    ]));
    children.push(pMixed([{ text: '暂停作业情况：', bold: true }, s4ul.hasPause ? { text: `有（原因：${v(s4ul.pauseReason)}，时长：${v(s4ul.pauseDuration)}小时）` } : { text: '无' }]));
    children.push(pMixed([{ text: '船舱清仓情况：', bold: true }, { text: v(s4.holdCleaningResult) }]));
    children.push(pMixed([{ text: '品质情况：', bold: true }, { text: v(s4.qualityInspectionResult) }]));
    children.push(pMixed([
      { text: '损耗情况：实际损耗量：', bold: true }, ul(v(s4.loss.quantity)), { text: '吨，损耗率：' },
      ul(v(s4.loss.rate)), { text: '%；合同约定损耗标准：≤' }, ul(v(s4.loss.contractStandard)),
      { text: '%；损耗原因：' }, { text: v(s4.loss.reason, '无异常损耗') }
    ]));
    const ins = s4.insurance;
    children.push(pMixed([{ text: '是否保险：', bold: true }, cb(!ins.claimed, '未出险'), cb(ins.claimed, '出险')]));
    if (ins.claimed) {
      children.push(pMixed([{ text: `出险时间：${v(ins.timeRange)}；出险原因：${v(ins.reason)}；保险受理情况：${v(ins.acceptanceDetails)}` }]));
    }

    // ── Section 5 ──
    children.push(heading('5. 提货情况'));
    const s5 = s.section5;
    const pu = s5.pickup;
    children.push(pMixed([{ text: '粮质巡查情况：巡查频次：', bold: true }, ul(v(s5.qualityPatrol.frequency)), { text: '；巡查内容：' + v(s5.qualityPatrol.content, '货物有无霉变、结块、发热、虫蛀等异常') + '；巡查结果：' + v(s5.qualityPatrol.results, '全程无异常，货物品质保持稳定') }]));
    children.push(pMixed([
      { text: '提货情况：提货开始时间：', bold: true }, ul(fmtDatetime(pu.startTime)),
      { text: '，提货结束时间：' }, ul(fmtDatetime(pu.endTime)),
      { text: '，共计提货天数：' }, ul(v(pu.totalDays)), { text: '天；累计提货量：' },
      ul(v(pu.cumulativeQuantity)), { text: '吨。出库损耗量：' }, ul(v(pu.outboundLossQuantity)),
      { text: '吨，损耗率：' }, ul(v(pu.outboundLossRate)), { text: '%；损耗原因：' }, { text: v(pu.outboundLossReason, '货物自然挥发') }
    ]));
    const vd = s5.vendorDeductions;
    children.push(pMixed([{ text: '执行商扣情况：', bold: true }, cb(!vd.hasDeductions, '无商扣'), cb(vd.hasDeductions, '有商扣')]));
    if (vd.hasDeductions) {
      children.push(pMixed([{ text: `商扣批次：${v(vd.batch)}，商扣原因：${v(vd.reason)}，商扣数量：${v(vd.quantity)}吨，商扣金额：${v(vd.amount)}元` }]));
    }

    // ── Section 6 ──
    children.push(heading('6. 成本分析'));
    const s6 = s.section6;
    const sf = s6.southernPortFees;
    children.push(pMixed([{ text: '北方采购成本：', bold: true }, { text: v(s6.northernPurchasePrice) + ' 元/吨' }]));
    children.push(pMixed([{ text: '南方港口费用：港口作业费：', bold: true }, { text: v(sf.portOperationFee) + '；堆存费：' + v(sf.storageFee) + '；其他杂费：' + v(sf.otherFees) + '；折合单吨成本：' + v(sf.unitCost) + '元/吨；销售时预估港口费用：' + v(sf.estimatedPortFee) + '元/吨；费用偏差：' + v(sf.deviation) + '，单吨偏差：' + v(sf.unitDeviation) + '元/吨' }]));
    children.push(pMixed([{ text: '海运费：', bold: true }, { text: v(s6.shippingCostPerTon) + ' 元/吨' }]));
    children.push(pMixed([{ text: '利润分析：', bold: true }, { text: v(s6.profitAnalysis) }]));

    // ── Section 7 ──
    children.push(heading('7. 整船总结'));
    const s7 = s.section7;
    children.push(pMixed([{ text: '作业概况：', bold: true }, { text: v(s7.operationsOverview) }]));
    children.push(pMixed([{ text: '品质管控：', bold: true }, { text: v(s7.qualityControl) }]));
    children.push(pMixed([{ text: '安全及流程：', bold: true }, { text: v(s7.safetyProcess) }]));
    children.push(pMixed([{ text: '不足及改进：', bold: true }, { text: v(s7.improvements) }]));

    // ── Signatures ──
    children.push(p('', { spacing: { before: 300 } }));
    children.push(p('附表：'));
    children.push(p(''));
    children.push(p(`销售支持确认：${v(s.footer.salesSupportConfirm)}`));
    children.push(p(`物流现场确认：${v(s.footer.logisticsConfirm)}`));
    children.push(p(`销售人员确认：${v(s.footer.salesConfirm)}`));
    children.push(p(`报告日期：${fmtDate(m.reportDate)}`));

    // ── Generate & Download ──
    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
        },
        children
      }]
    });

    const blob = await Packer.toBlob(doc);
    if (typeof saveAs !== 'undefined') {
      saveAs(blob, `船小结报告_${v(m.shipName, '未命名')}_${new Date().toISOString().slice(0,10)}.docx`);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `船小结报告_${v(m.shipName, '未命名')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  return { generateAndDownload };
})();
