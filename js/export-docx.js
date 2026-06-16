/**
 * export-docx.js — Word (.docx) export
 * 所有上传的照片都会作为真实图片嵌入 .docx
 */
const ExportDocx = (function() {
  'use strict';

  const HP = { TITLE: 72, SHIP: 56, DEPT: 48, TOC_H: 56, TOC_I: 44, SEC_H: 32, BODY: 22, SMALL: 20, SIGN: 24 };
  const F = { TITLE: 'Microsoft YaHei', TOC: 'FangSong', H: 'DengXian', BODY: 'DengXian', SIGN: 'DengXian' };

  function v(x, d) { return (x === null || x === undefined || x === '') ? (d || '________') : String(x); }
  function fd(v) { if (!v) return '____年__月__日'; const d = new Date(v); if (isNaN(d.getTime())) return v; return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
  function fdt(v) { if (!v) return '____年__月__日 __:__'; const d = new Date(v); if (isNaN(d.getTime())) return v; return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

  /**
   * 把 base64 dataURL 转成 ImageRun
   * 格式: data:image/png;base64,iVBOR...
   */
  async function dataURLtoImageRun(dataURL, maxWidth) {
    if (!dataURL) return null;
    try {
      const m = dataURL.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!m) return null;
      const type = m[1];
      const b64 = m[2];
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const w = maxWidth || 400;
      return new docx.ImageRun({ data: bytes, transformation: { width: w, height: Math.round(w * 0.75) }, type: type.split('/')[1] });
    } catch(e) { console.error('ImageRun error:', e); return null; }
  }

  /**
   * 处理文件数据（单个文件或文件数组），返回 Paragraph 数组
   */
  async function embedFiles(files, label) {
    if (!files) return [];
    const list = Array.isArray(files) ? files : [files];
    const result = [];
    for (const f of list) {
      if (f && f.dataURL) {
        const ir = await dataURLtoImageRun(f.dataURL, 400);
        if (ir) {
          result.push(new docx.Paragraph({
            children: [ir],
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 120, before: 80 },
          }));
          result.push(new docx.Paragraph({
            children: [new docx.TextRun({ text: f.name || '', font: F.BODY, size: HP.SMALL, italics: true })],
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 160 },
          }));
        }
      }
    }
    if (result.length === 0 && label) {
      result.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: label, font: F.BODY, size: HP.SMALL })],
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 120 },
      }));
    }
    return result;
  }

  async function generateAndDownload() {
    const D = docx;
    const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, PageBreak } = D;
    const s = FormState.getState(), m = s.meta;
    const ship = v(m.shipName) + '/' + v(m.voyage);

    const C = [];

    /* ═══════════════ 封面 ═══════════════ */
    try {
      const resp = await fetch('img/cofco-logo.png');
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        C.push(new Paragraph({ children: [new ImageRun({ data: new Uint8Array(buf), transformation: { width: 124, height: 60 }, type: 'png' })], alignment: AlignmentType.CENTER, spacing: { after: 240, before: 200 } }));
      }
    } catch (_) {}

    C.push(new Paragraph({ children: [new TextRun({ text: '内贸玉米散粮', font: F.TITLE, size: HP.TITLE, bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 100, line: 400 } }));
    C.push(new Paragraph({ children: [new TextRun({ text: '船 小 结', font: F.TITLE, size: HP.TITLE, bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 480, line: 400 } }));
    C.push(new Paragraph({ children: [new TextRun({ text: '船名：' + ship, font: F.TITLE, size: HP.SHIP })], alignment: AlignmentType.CENTER, spacing: { after: 80, line: 360 } }));
    for (let i = 0; i < 4; i++) C.push(new Paragraph({ children: [], spacing: { after: 80 } }));
    C.push(new Paragraph({ children: [new TextRun({ text: v(m.operatingDept, '______经营部'), font: F.TITLE, size: HP.DEPT, bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 80, line: 360 } }));
    C.push(new Paragraph({ children: [new TextRun({ text: fd(m.reportDate), font: F.TITLE, size: HP.DEPT, bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }));

    /* ═══════════════ 目录 ═══════════════ */
    C.push(new Paragraph({ children: [new PageBreak()] }));
    C.push(new Paragraph({ children: [new TextRun({ text: '目录', font: F.TOC, size: HP.TOC_H })], alignment: AlignmentType.CENTER, spacing: { after: 360, line: 400 } }));
    const RIGHT_TAB = { type: 'right', position: 9026 };
    [
      ['一、到港前船舶情况', '3'], ['二、码头计划仓库情况', '4'], ['三、船靠泊卸货前情况', '5'],
      ['四、船舶从卸货到结束情况', '6'], ['五、提货情况', '8'], ['六、成本分析', '10'], ['七、整船总结', '10']
    ].forEach(([t, pg]) => {
      C.push(new Paragraph({ children: [new TextRun({ text: t, font: F.TOC, size: HP.TOC_I, bold: true }), new TextRun({ text: '\t' + pg, font: F.TOC, size: HP.TOC_I })], tabStops: [RIGHT_TAB], alignment: AlignmentType.LEFT, spacing: { after: 160, line: 360 } }));
    });

    /* ═══════════════ Helpers ═══════════════ */
    const P = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text, font: opts.font || F.BODY, size: opts.size || HP.BODY, bold: opts.bold || false })], alignment: opts.alignment, spacing: opts.spacing || { after: 100, line: 276 } });
    const PR = (runs, opts = {}) => new Paragraph({ children: runs.map(r => typeof r === 'string' ? new TextRun({ text: r, font: F.BODY, size: HP.BODY }) : new TextRun({ font: F.BODY, size: HP.BODY, ...r })), alignment: opts.alignment, spacing: opts.spacing || { after: 100, line: 276 } });
    const H = text => new Paragraph({ children: [new TextRun({ text, font: F.H, size: HP.SEC_H, bold: true })], spacing: { before: 240, after: 120, line: 312 } });
    const cb = (c, l) => ({ text: (c ? '☑' : '□') + ' ' + l + '  ', font: F.BODY, size: HP.BODY });
    const ul = t => ({ text: t || '________', font: F.BODY, size: HP.BODY, underline: { type: 'single' } });
    const BL = t => ({ text: t, font: F.BODY, size: HP.BODY, bold: true });
    const NT = t => ({ text: t, font: F.BODY, size: HP.BODY });
    async function embed(fileData) {
      if (!fileData) return [];
      const list = Array.isArray(fileData) ? fileData : [fileData];
      const res = [];
      for (const f of list) {
        if (f && f.dataURL) {
          // 缩小图嵌入，宽度 360px，高度等比缩放
          const img = await dataURLtoImageRun(f.dataURL, 360);
          if (img) {
            res.push(new Paragraph({ children: [img], alignment: AlignmentType.CENTER, spacing: { after: 60, before: 80 } }));
            res.push(P(f.name || '', { font: F.BODY, size: HP.SMALL, alignment: AlignmentType.CENTER, spacing: { after: 160 } }));
          }
        }
      }
      return res;
    }

    /* ═══════════════ 第一章 ═══════════════ */
    C.push(new Paragraph({ children: [new PageBreak()] }));
    C.push(H('一、到港前船舶情况'));
    const s1 = s.section1;
    C.push(P('本航次船舶承载【' + ship + '】，到港前完成各项前置核查，相关情况详细如下：'));
    C.push(PR([BL('水路运单：'), NT(v(s1.waterwayWaybillText, '运单信息与货物、船名航次一致'))]));
    C.push(...await embed(s1.waterwayWaybillFile));
    C.push(PR([BL('装运港、数量及时间：装运港：'), ul(v(s1.portOfLoading)), NT('；货物总数量：'), ul(v(s1.cargoQuantity)), NT('吨；装运开始时间：'), ul(fdt(s1.loadingStartTime)), NT('，装运结束时间：'), ul(fdt(s1.loadingEndTime)), NT('（如有报告可不填）')]));
    C.push(PR([BL('检验报告及封签：'), NT(v(s1.inspectionReportText, '装港检验报告显示货物品质符合标准，船舱封签完好，无异常。'))]));
    C.push(...await embed(s1.inspectionReportFile));
    C.push(PR([BL('封签检查情况附图：')]));
    C.push(...await embed(s1.sealCheckFile));
    C.push(PR([BL('预计到港时间：'), NT('预计到港时间：'), ul(fdt(s1.estimatedArrivalTime)), NT('；实际到港时间：'), ul(fdt(s1.actualArrivalTime))]));
    C.push(PR([BL('轨迹情况：'), NT('船舶全程航行轨迹可追溯，预定航线：'), ul(v(s1.plannedRoute)), NT('→'), ul(v(s1.actualRoute)), NT('（起始至终点），实际航行' + v(s1.routeDeviation, '无偏离预定航线、无违规停靠情况') + '；轨迹由'), ul(v(s1.trackingDevice)), NT('全程记录，航行期间' + v(s1.routeNotes, '无恶劣天气、海上事故等异常') + '。')]));

    /* ═══════════════ 第二章 ═══════════════ */
    C.push(H('二、码头计划仓库情况'));
    const s2 = s.section2;
    C.push(P('提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：'));
    C.push(PR([BL('靠船泊位：确认靠泊码头：'), ul(v(s2.dockName)), NT('，泊位：'), ul(v(s2.berthNumber)), NT('；泊位无障碍物、无其他船舶占用，配套装卸设备运行正常，具备靠泊及卸货条件。')]));
    C.push(PR([BL('码头仓位：码头预留仓位编号：'), ul(v(s2.warehousePositions)), NT('，仓位容量：'), ul(v(s2.warehouseCapacity)), NT('吨，可完全容纳本航次货物（'), ul(v(s2.cargoWeight)), NT('万吨）；仓位地面平整、干燥、符合存储要求。')]));
    C.push(PR([BL('是否直提安排：'), cb(s2.isDirectPickup, '是'), cb(!s2.isDirectPickup, '否'), ...(s2.isDirectPickup ? [NT('；直提开始时间：'), ul(fdt(s2.directPickupStartTime))] : [NT('；货物全部存入预留码头仓位，后续按提货计划出库。')])]));

    /* ═══════════════ 第三章 ═══════════════ */
    C.push(H('三、船靠泊卸货前情况'));
    const s3 = s.section3, wx = s3.weather;
    C.push(P('船舶靠泊后，卸货前完成现场勘察、风险排查及资料留存，具体情况如下：'));
    C.push(PR([BL('天气及风力情况：'), NT('卸货前现场天气：'), cb(wx.sunny, '晴天'), cb(wx.cloudy, '阴天'), cb(wx.overcast, '多云'), NT('（无降雨、雷电等恶劣天气）；风力：'), ul(v(s3.windLevel)), NT('级，风向：'), ul(v(s3.windDirection)), NT('；风力符合卸货作业标准（≤'), ul(v(s3.windStandard)), NT('级），无影响卸货的天气因素。')]));
    C.push(PR([BL('风险情况：'), NT('排查结果：'), cb(!s3.riskCheck.hasRisk, '无异常风险'), cb(s3.riskCheck.hasRisk, '存在轻微风险'), ...(s3.riskCheck.hasRisk ? [NT('（风险描述：'), ul(v(s3.riskCheck.riskDescription)), NT('）；整改措施：'), ul(v(s3.riskCheck.remediation))] : [NT('；整改措施：无，复查结果：合格')]), NT('；安全责任人：'), ul(v(s3.safetyOfficer)), NT('，应急处置预案已落实。')]));
    C.push(PR([BL('开舱照片、取样照片：'), NT('卸货前完成开舱、取样照片拍摄。开舱照片：'), NT(v(s3.hatchPhotos.count)), NT('张，拍摄时间：'), ul(fdt(s3.hatchPhotos.time)), NT('，拍摄地点：'), ul(v(s3.hatchPhotos.location, '船舶各货舱舱口')), NT('；取样照片：'), NT(v(s3.samplingPhotos.count)), NT('张，拍摄时间：'), ul(fdt(s3.samplingPhotos.time)), NT('，取样人员：'), ul(v(s3.samplingPhotos.sampler)), NT('，取样规范、点位覆盖各货舱。')]));
    C.push(P('【开舱照片】', { font: F.BODY, size: HP.BODY, bold: true, spacing: { before: 120, after: 80 } }));
    C.push(...await embed(s3.hatchPhotos.files));
    C.push(P('【取样照片】', { font: F.BODY, size: HP.BODY, bold: true, spacing: { before: 120, after: 80 } }));
    C.push(...await embed(s3.samplingPhotos.files));

    /* ═══════════════ 第四章 ═══════════════ */
    C.push(H('四、船舶从卸货到结束情况'));
    const s4 = s.section4, u = s4.unloading, ins = s4.insurance;
    C.push(P('卸货作业按计划推进，全程做好作业记录、品质监控及清仓核查，具体如下：'));
    C.push(PR([BL('码头作业线：'), NT('启用码头作业线'), ul(v(s4.operatingLines.lineCount)), NT('条，每条作业线日装卸'), ul(v(s4.operatingLines.dailyCapacityPerLine)), NT('吨；作业期间设备运行正常，操作人员持证上岗、操作规范。')]));
    C.push(PR([BL('卸货天数：'), NT('卸货开始时间：'), ul(fdt(u.startTime)), NT('，卸货结束时间：'), ul(fdt(u.endTime)), NT('；共计卸货'), NT(v(u.totalHours)), NT('小时；日均卸货量：'), ul(v(u.dailyAverage)), NT('万吨；暂停作业情况：'), cb(!u.hasPause, '无'), cb(u.hasPause, '有'), ...(u.hasPause ? [NT('（原因：'), ul(v(u.pauseReason)), NT('，时长：'), ul(v(u.pauseDuration)), NT('小时）')] : [])]));
    C.push(PR([BL('船舱清仓情况：'), NT(v(s4.holdCleaningResult))]));
    C.push(PR([BL('品质情况：'), NT(v(s4.qualityInspectionResult))]));
    C.push(PR([BL('损耗情况：'), NT('实际损耗量：'), ul(v(s4.loss.quantity)), NT('吨，损耗率：'), ul(v(s4.loss.rate)), NT('%；约定标准：≤'), ul(v(s4.loss.contractStandard)), NT('%；损耗原因：'), ul(v(s4.loss.reason, '无异常损耗')), NT('（如：货物自然挥发、装卸轻微损耗）。')]));
    C.push(PR([BL('是否保险：'), cb(!ins.claimed, '未出险'), cb(ins.claimed, '出险'), NT('；出险时间：'), ins.claimed ? ul(v(ins.timeRange)) : NT('____年__月__日 - ____年__月__日。')]));
    C.push(PR([BL('出险原因：'), NT(v(ins.reason))]));
    C.push(PR([BL('保险受理情况：'), NT(v(ins.acceptanceDetails))]));

    /* ═══════════════ 第五章 ═══════════════ */
    C.push(H('五、提货情况'));
    const s5 = s.section5, pu = s5.pickup, vd = s5.vendorDeductions;
    C.push(P('货物卸货完成后，按提货计划有序开展提货作业，全程做好粮质巡查、提货统计及商扣记录，具体如下：'));
    C.push(PR([BL('粮质巡查情况：'), NT('巡查频次：'), ul(v(s5.qualityPatrol.frequency)), NT('；巡查内容：货物有无霉变、结块、发热、虫蛀等异常；巡查结果：'), ul(v(s5.qualityPatrol.results, '全程无异常')), NT('；巡查记录完整。')]));
    C.push(PR([BL('提货情况：'), NT('提货开始时间：'), ul(fdt(pu.startTime)), NT('，提货结束时间：'), ul(fdt(pu.endTime)), NT('，共计提货'), ul(v(pu.totalDays)), NT('天；累计提货量：'), ul(v(pu.cumulativeQuantity)), NT('吨。出库损耗量：'), ul(v(pu.outboundLossQuantity)), NT('吨，损耗率：'), ul(v(pu.outboundLossRate)), NT('%；损耗原因：'), ul(v(pu.outboundLossReason, '货物自然挥发'))]));
    C.push(PR([BL('执行商扣情况：'), cb(!vd.hasDeductions, '无商扣'), cb(vd.hasDeductions, '有商扣'), ...(vd.hasDeductions ? [NT('；商扣批次：'), ul(v(vd.batch)), NT('，商扣原因：'), ul(v(vd.reason)), NT('，商扣数量：'), ul(v(vd.quantity)), NT('吨，商扣金额：'), ul(v(vd.amount)), NT('元')] : [NT('；若有商扣：商扣批次：__________，商扣原因：__________')])]));
    C.push(PR([BL('附整船执行台账：')]));
    C.push(...await embed(s5.executionLedgerFile));

    /* ═══════════════ 第六章 ═══════════════ */
    C.push(H('六、成本分析'));
    const s6 = s.section6, sf6 = s6.southernPortFees;
    C.push(PR([BL('北方采购价：'), NT(v(s6.northernPurchasePrice))]));
    C.push(PR([BL('费用偏差：'), NT('南方港口港杂费' + v(sf6.portOperationFee) + '，堆存费' + v(sf6.storageFee) + '等各项杂费，折合单吨' + v(sf6.unitCost) + '元/吨，销售时预估港口费用' + v(sf6.estimatedPortFee) + '元/吨，费用偏差' + v(sf6.deviation) + '，单吨偏差' + v(sf6.unitDeviation) + '元/吨。')]));
    C.push(PR([BL('海运费：'), NT(v(s6.shippingCostPerTon) + ' 元/吨')]));
    C.push(PR([BL('利润分析：'), NT(v(s6.profitAnalysis))]));

    /* ═══════════════ 第七章 ═══════════════ */
    C.push(H('七、整船总结'));
    const s7 = s.section7;
    C.push(P('本航次船舶从装运、航行、靠泊、卸货至提货，全程严格遵循相关规范及作业计划，各环节衔接顺畅、管控到位，整体作业顺利完成，具体总结如下：'));
    C.push(PR([BL('作业概况：'), NT(v(s7.operationsOverview))]));
    C.push(PR([BL('品质管控：'), NT(v(s7.qualityControl))]));
    C.push(PR([BL('安全及流程：'), NT(v(s7.safetyProcess))]));
    C.push(PR([BL('不足及改进：'), NT(v(s7.improvements))]));
    C.push(PR([BL('附表：')]));

    /* ═══════════════ 签署 ═══════════════ */
    C.push(P('', { spacing: { before: 400 } }));
    C.push(P('销售支持确认：' + v(s.footer.salesSupportConfirm), { font: F.SIGN, size: HP.SIGN, spacing: { after: 200, line: 360 } }));
    C.push(P('物流现场确认：' + v(s.footer.logisticsConfirm), { font: F.SIGN, size: HP.SIGN, spacing: { after: 200, line: 360 } }));
    C.push(P('销售人员确认：' + v(s.footer.salesConfirm), { font: F.SIGN, size: HP.SIGN, spacing: { after: 200, line: 360 } }));
    C.push(P('', { spacing: { after: 100 } }));
    C.push(P('报告日期：' + fd(m.reportDate), { font: F.SIGN, size: HP.SIGN }));

    /* ═══════════════ 生成 ═══════════════ */
    const doc = new Document({ styles: { default: { document: { run: { font: F.BODY, size: HP.BODY } } } }, sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, size: { width: 11906, height: 16838 } } }, children: C }] });
    const blob = await Packer.toBlob(doc);
    const fn = '船小结报告_' + v(m.shipName, '未命名') + '_' + new Date().toISOString().slice(0, 10) + '.docx';
    if (typeof saveAs !== 'undefined') { saveAs(blob, fn); }
    else { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = fn; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); }
  }

  return { generateAndDownload };
})();
