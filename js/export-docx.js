/**
 * export-docx.js — Word (.docx) 导出
 * 所有字体/字号/对齐方式严格按照原始模板的 XML 格式设定。
 * 从模板提取的格式：
 *   标题：微软雅黑 36pt bold (w:sz=72 half-pts)
 *   板块标题：黑体 16pt bold (w:sz=32)
 *   目录标题：黑体 28pt (w:sz=56)
 *   目录项：黑体 20pt (w:sz=40)
 *   正文：宋体 11pt (w:sz=22)
 *   ship name：56 half-pts (28pt), dept/date: 48 half-pts (24pt) bold
 */
const ExportDocx = (function() {
  'use strict';

  // ═══ Half-point to point conversion ═══
  // Word XML stores sizes in half-points. docx library uses half-points directly.
  const HP = {
    TITLE:   72, // 36pt — 内贸玉米散粮 / 船小結
    SHIP:    56, // 28pt — 船名
    DEPT:    48, // 24pt — 经营部/日期
    TOC_H:   56, // 28pt — 目录
    TOC_I:   44, // 22pt — 目录项（一级 bold）
    TOC_II:  40, // 20pt — 目录项（二级）
    SEC_H:   32, // 16pt — 板块标题
    BODY_B:  22, // 11pt — 正文（小标题 bold）
    BODY:    22, // 11pt — 正文
    SMALL:   20, // 10pt — 小字/附图
    SIGN:    24, // 12pt — 签署区
  };

  const FONT = {
    TITLE: 'Microsoft YaHei',    // 微软雅黑
    HEADING: 'SimHei',           // 黑体
    BODY: 'SimSun',              // 宋体
  };

  function v(val, def) {
    if (val === null || val === undefined || val === '') return def || '________';
    return String(val);
  }

  function fmtDate(val) {
    if (!val) return '____年__月__日';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  }

  function fmtDatetime(val) {
    if (!val) return '____年__月__日 __:__';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  async function generateAndDownload() {
    const D = docx;
    const {
      Document, Packer, Paragraph, TextRun,
      AlignmentType, PageBreak, TabStopPosition, TabStopType,
      Header, Footer, PageNumber, NumberFormat
    } = D;

    const s = FormState.getState();
    const m = s.meta;
    const shipFull = v(m.shipName) + '/' + v(m.voyage);

    // ═══ Helpers ═══
    function p(text, opts = {}) {
      return new Paragraph({
        children: [new TextRun({ text, font: opts.font || FONT.BODY, size: opts.size || HP.BODY, bold: opts.bold || false, ...opts })],
        alignment: opts.alignment,
        spacing: opts.spacing || { after: 100, line: 276 }, // 276 = 1.15 line spacing in twips
        indent: opts.indent,
      });
    }

    function pRuns(runs, opts = {}) {
      return new Paragraph({
        children: runs.map(r => typeof r === 'string'
          ? new TextRun({ text: r, font: FONT.BODY, size: HP.BODY })
          : new TextRun({ font: FONT.BODY, size: HP.BODY, ...r })
        ),
        alignment: opts.alignment,
        spacing: opts.spacing || { after: 100, line: 276 },
      });
    }

    function heading(text) {
      return new Paragraph({
        children: [new TextRun({ text, font: FONT.HEADING, size: HP.SEC_H, bold: true })],
        spacing: { before: 200, after: 120, line: 312 },
      });
    }

    function cb(checked, label) {
      return { text: (checked ? '☑' : '□') + ' ' + label + '  ', font: FONT.BODY, size: HP.BODY };
    }

    function uline(text) {
      return { text: text || '________', font: FONT.BODY, size: HP.BODY, underline: { type: 'single' } };
    }

    function boldLabel(text) {
      return { text, font: FONT.BODY, size: HP.BODY, bold: true };
    }

    function normalText(text) {
      return { text, font: FONT.BODY, size: HP.BODY };
    }

    function imgLabel(text) {
      return p('[附图：' + text + ']', { font: FONT.BODY, size: HP.SMALL });
    }

    function emptyPhoto() {
      return p('[附图]', { font: FONT.BODY, size: HP.SMALL });
    }

    const children = [];

    // ═══════════════ COVER PAGE ═══════════════
    children.push(p('附件1：', { font: FONT.TITLE, size: HP.BODY, alignment: AlignmentType.CENTER, spacing: { after: 200, line: 360 } }));
    children.push(p('内贸玉米散粮', { font: FONT.TITLE, size: HP.TITLE, bold: true, alignment: AlignmentType.LEFT }));
    children.push(p('船 小 结', { font: FONT.TITLE, size: HP.TITLE, bold: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 300, line: 400 } }));
    children.push(p('船名：' + shipFull + '        船名：' + shipFull + '        ', { font: FONT.TITLE, size: HP.SHIP, alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: 360 } }));
    children.push(p('船名：' + shipFull + '        ', { font: FONT.TITLE, size: HP.TITLE, bold: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 100, line: 400 } }));
    children.push(p('船名：' + shipFull + '        ', { font: FONT.TITLE, size: HP.TITLE, bold: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 200, line: 400 } }));
    children.push(p(v(m.operatingDept, '______经营部'), { font: FONT.TITLE, size: HP.DEPT, bold: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 } }));
    children.push(p(fmtDate(m.reportDate), { font: FONT.TITLE, size: HP.DEPT, bold: true, alignment: AlignmentType.JUSTIFIED, spacing: { after: 400 } }));

    // ═══════════════ TOC ═══════════════
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(p('目录', { font: FONT.HEADING, size: HP.TOC_H, alignment: AlignmentType.CENTER, spacing: { after: 300, line: 400 } }));
    const tocItems = [
      { text: '1. 到港前船舶情况', size: HP.TOC_I, bold: true },
      { text: '2. 码头计划仓库情况', size: HP.TOC_II },
      { text: '3. 船靠泊卸货前情况', size: HP.TOC_II },
      { text: '4. 船舶从卸货到结束情况', size: HP.TOC_II },
      { text: '5. 提货情况', size: HP.TOC_II },
      { text: '6. 成本分析', size: HP.TOC_II },
      { text: '7. 整船总结', size: HP.TOC_II },
    ];
    tocItems.forEach(t => {
      children.push(p(t.text, { font: FONT.HEADING, size: t.size, bold: t.bold || false, spacing: { after: 80, line: 320 } }));
    });

    // ═══════════════ Section 1 ═══════════════
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(heading('1. 到港前船舶情况'));
    const s1 = s.section1;
    children.push(p('本航次船舶承载【' + shipFull + '】，到港前完成各项前置核查，相关情况详细如下：'));
    // 水路运单
    children.push(pRuns([boldLabel('水路运单：'), normalText(v(s1.waterwayWaybillText, '运单信息与货物、船名航次一致'))]));
    s1.waterwayWaybillFile ? children.push(imgLabel(s1.waterwayWaybillFile.name)) : children.push(emptyPhoto());
    // 装运港
    children.push(pRuns([
      boldLabel('装运港、数量及时间：装运港：'), uline(v(s1.portOfLoading)),
      normalText('；货物总数量：'), uline(v(s1.cargoQuantity)), normalText('吨；'),
      normalText('装运开始时间：'), uline(fmtDatetime(s1.loadingStartTime)),
      normalText('，装运结束时间：'), uline(fmtDatetime(s1.loadingEndTime)),
      normalText('（如有报告可不填）'),
    ]));
    // 检验报告
    children.push(pRuns([boldLabel('检验报告及封签：'), normalText(v(s1.inspectionReportText, '装港检验报告显示货物品质符合标准，船舱封签完好，无异常。'))]));
    s1.inspectionReportFile && children.push(imgLabel(s1.inspectionReportFile.name));
    children.push(pRuns([boldLabel('封签检查情况附图：')]));
    s1.sealCheckFile ? children.push(imgLabel(s1.sealCheckFile.name)) : children.push(emptyPhoto());
    // 到港时间
    children.push(pRuns([
      boldLabel('1.4 预计到港时间：'), normalText('结合航线、航行速度及海域气象，'),
      normalText('预计到港时间：'), uline(fmtDatetime(s1.estimatedArrivalTime)),
      normalText('；实际到港时间：'), uline(fmtDatetime(s1.actualArrivalTime)),
    ]));
    // 轨迹
    children.push(pRuns([
      boldLabel('1.5 轨迹情况：'),
      normalText('船舶全程航行轨迹可追溯，预定航线：'), uline(v(s1.plannedRoute)),
      normalText('→'), uline(v(s1.actualRoute)), normalText('（起始至终点），'),
      normalText('实际航行' + v(s1.routeDeviation, '无偏离预定航线、无违规停靠情况') + '；'),
      normalText('轨迹由'), uline(v(s1.trackingDevice)), normalText('（设备/单位）全程记录，数据完整可查询，'),
      normalText('航行期间' + v(s1.routeNotes, '无恶劣天气、海上事故等异常') + '。'),
    ]));

    // ═══════════════ Section 2 ═══════════════
    children.push(heading('2. 码头计划仓库情况'));
    const s2 = s.section2;
    children.push(p('提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：'));
    children.push(pRuns([
      boldLabel('2.1 靠船泊位：确认靠泊码头：'), uline(v(s2.dockName)),
      normalText('，泊位：'), uline(v(s2.berthNumber)),
      normalText('；泊位无障碍物、无其他船舶占用，配套装卸设备（起重机、传送带等）运行正常，具备靠泊及卸货条件。'),
    ]));
    children.push(pRuns([
      boldLabel('2.2 码头仓位：码头预留仓位编号：'), uline(v(s2.warehousePositions)),
      normalText('，仓位容量：'), uline(v(s2.warehouseCapacity)), normalText('吨，可完全容纳本航次货物（'),
      uline(v(s2.cargoWeight)), normalText('万吨）；'),
      normalText('仓位地面平整、干燥、无积水、无杂物，通风、防潮、防鼠设施完善，符合【货物名称】存储要求；仓位已提前清理、消毒，经检查合格后预留使用。'),
    ]));
    children.push(pRuns([
      boldLabel('2.3 是否直提安排：'), cb(s2.isDirectPickup, '是'), cb(!s2.isDirectPickup, '否'),
      ...(s2.isDirectPickup ? [
        normalText('；若为直提：直提开始时间：'), uline(fmtDatetime(s2.directPickupStartTime)),
        normalText('，直提作业流程已告知相关码头，专人现场值守协调；'),
      ] : [
        normalText('；若为不直提：货物全部存入上述预留码头仓位，后续按提货计划逐步出库，出库流程按码头相关规定执行。'),
      ])
    ]));

    // ═══════════════ Section 3 ═══════════════
    children.push(heading('3. 船靠泊卸货前情况'));
    const s3 = s.section3;
    children.push(p('船舶靠泊后，卸货前完成现场勘察、风险排查及资料留存，确保卸货作业安全、规范，具体情况如下：'));
    const wx = s3.weather;
    children.push(pRuns([
      boldLabel('3.1 天气及风力情况：'), normalText('卸货前现场天气：'),
      cb(wx.sunny, '晴天'), cb(wx.cloudy, '阴天'), cb(wx.overcast, '多云'),
      normalText('（无降雨、雷电等恶劣天气）；'),
      normalText('现场风力：'), uline(v(s3.windLevel)), normalText('级，风向：'), uline(v(s3.windDirection)),
      normalText('；风力符合卸货作业标准（≤'), uline(v(s3.windStandard)), normalText('级），无影响卸货的天气因素。'),
    ]));
    children.push(pRuns([
      boldLabel('3.2 风险情况：'), normalText('组织专人对船舶靠泊状态、码头作业区域、装卸设备、消防设施等进行全面风险排查；'),
      normalText('排查结果：'), cb(!s3.riskCheck.hasRisk, '无异常风险'), cb(s3.riskCheck.hasRisk, '存在轻微风险'),
      ...(s3.riskCheck.hasRisk ? [
        normalText('（风险描述：'), uline(v(s3.riskCheck.riskDescription)), normalText('）'),
        normalText('；整改措施：'), uline(v(s3.riskCheck.remediation)),
        normalText('（如无风险则填"无"），整改完成时间：'), uline(fmtDate(s3.riskCheck.remediationCompleteTime)),
        normalText('，复查结果：'), uline(v(s3.riskCheck.recheckResult, '合格')),
        normalText('，确认无卸货安全风险后，启动卸货准备工作；'),
      ] : [
        normalText('；整改措施：'), uline('无'), normalText('，复查结果：合格，确认无卸货安全风险后，启动卸货准备工作；'),
      ]),
      normalText('现场明确安全责任人：'), uline(v(s3.safetyOfficer)),
      normalText('，应急处置预案已落实。'),
    ]));
    // 开舱照片
    children.push(pRuns([
      boldLabel('3.3 开舱照片、取样照片：'), normalText('卸货前完成开舱、取样照片拍摄，照片清晰可辨、标注完整，全部归档留存；'),
      normalText('开舱照片：'), normalText(v(s3.hatchPhotos.count)), normalText('张，拍摄时间：'), uline(fmtDatetime(s3.hatchPhotos.time)),
      normalText('，拍摄地点：'), uline(v(s3.hatchPhotos.location, '船舶各货舱舱口')),
      normalText('，照片显示：货舱封签完好、货物无坍塌、无霉变、无结块等异常；'),
      normalText('取样照片：'), normalText(v(s3.samplingPhotos.count)), normalText('张，拍摄时间：'), uline(fmtDatetime(s3.samplingPhotos.time)),
      normalText('，取样人员：'), uline(v(s3.samplingPhotos.sampler)),
      normalText('，取样规范、点位覆盖各货舱，样品妥善封存用于后续复检。'),
    ]));
    children.push(p('开舱照片'));
    if (s3.hatchPhotos.files && s3.hatchPhotos.files.length) {
      children.push(p(s3.hatchPhotos.files.map(f => f.name).join(', '), { font: FONT.BODY, size: HP.SMALL }));
    }
    children.push(p('取样照片'));
    if (s3.samplingPhotos.files && s3.samplingPhotos.files.length) {
      children.push(p(s3.samplingPhotos.files.map(f => f.name).join(', '), { font: FONT.BODY, size: HP.SMALL }));
    }

    // ═══════════════ Section 4 ═══════════════
    children.push(heading('4. 船舶从卸货到结束情况'));
    const s4 = s.section4;
    children.push(p('卸货作业按计划推进，全程做好作业记录、品质监控及清仓核查，具体如下：'));
    children.push(pRuns([
      boldLabel('4.1 码头作业线：'), normalText('启用码头作业线'), uline(v(s4.operatingLines.lineCount)),
      normalText('条，每条作业线日装卸'), uline(v(s4.operatingLines.dailyCapacityPerLine)),
      normalText('吨；作业期间设备运行正常，无故障停机情况，操作人员持证上岗、操作规范。'),
    ]));
    const s4ul = s4.unloading;
    children.push(pRuns([
      boldLabel('4.2 卸货天数：'), normalText('卸货开始时间：'), uline(fmtDatetime(s4ul.startTime)),
      normalText('，卸货结束时间：'), uline(fmtDatetime(s4ul.endTime)),
      normalText('；共计卸货'), normalText(v(s4ul.totalHours)), normalText('小时；日均卸货量：'), uline(v(s4ul.dailyAverage)),
      normalText('万吨，整体效率符合预期计划；'),
      normalText('卸货期间暂停作业情况：'), cb(!s4ul.hasPause, '无'), cb(s4ul.hasPause, '有'),
      ...(s4ul.hasPause ? [
        normalText('（暂停原因：'), uline(v(s4ul.pauseReason)),
        normalText('，暂停时长：'), uline(v(s4ul.pauseDuration)),
        normalText('小时，已及时恢复作业，未影响整体进度）'),
      ] : [normalText('；')]),
    ]));
    children.push(pRuns([
      boldLabel('4.3 船舱清仓情况：'),
      normalText(v(s4.holdCleaningResult, '卸货结束后，组织专人对各货舱进行全面清仓检查；清仓结果：各货舱舱壁、舱底无残留货物、无杂物、无积水，清仓干净度符合相关标准；清仓检查记录完整，相关人员签字确认。')),
      normalText('（样本，实际需根据情况填写）'),
    ]));
    children.push(pRuns([
      boldLabel('4.4 品质情况：'),
      normalText(v(s4.qualityInspectionResult, '卸货过程中同步进行货物品质抽样检验，检验点位覆盖各货舱、各批次；检验结果：货物品质与装运港检验报告一致，无霉变、结块、杂质超标、发热等异常，符合合同约定及相关标准，检验记录完整归档。')),
      normalText('（样本，实际需根据情况填写）'),
    ]));
    children.push(pRuns([
      boldLabel('4.5 损耗情况：'), normalText('全程统计卸货损耗，实际损耗量：'), uline(v(s4.loss.quantity)),
      normalText('吨，损耗率：'), uline(v(s4.loss.rate)), normalText('%；合同约定损耗标准：≤'),
      uline(v(s4.loss.contractStandard)), normalText('%，本次损耗控制在约定范围内；'),
      normalText('损耗原因：'), uline(v(s4.loss.reason, '无异常损耗')),
      normalText('（如：货物自然挥发、装卸轻微损耗，无异常损耗）。'),
    ]));
    const ins = s4.insurance;
    children.push(pRuns([
      boldLabel('4.6 是否保险：'), cb(!ins.claimed, '未出险'), cb(ins.claimed, '出险'),
      ...(ins.claimed ? [
        normalText('；出险时间：'), uline(v(ins.timeRange)),
      ] : [normalText('；出险时间：____年__月__日 - ____年__月__日。')]),
    ]));
    children.push(pRuns([boldLabel('出险原因：'), normalText(v(ins.reason))]));
    children.push(pRuns([boldLabel('保险受理情况：'), normalText(v(ins.acceptanceDetails))]));

    // ═══════════════ Section 5 ═══════════════
    children.push(heading('5. 提货情况'));
    const s5 = s.section5;
    children.push(p('货物卸货完成后，按提货计划有序开展提货作业，全程做好粮质巡查、提货统计及商扣记录，具体如下：'));
    children.push(pRuns([
      boldLabel('5.1 粮质巡查情况：'), normalText('出库期间安排专人每周开展粮质巡查，巡查频次：'),
      uline(v(s5.qualityPatrol.frequency)), normalText('；巡查内容：货物有无霉变、结块、发热、虫蛀等异常，仓库通风、防潮设施运行情况（不直提情况下）；巡查结果：'),
      v(s5.qualityPatrol.results) ? normalText(v(s5.qualityPatrol.results)) : normalText('全程无异常，货物品质保持稳定，符合提货标准；巡查记录完整。'),
    ]));
    const pu = s5.pickup;
    children.push(pRuns([
      boldLabel('5.2 提货情况：'), normalText('提货开始时间：'), uline(fmtDatetime(pu.startTime)),
      normalText('，提货结束时间：'), uline(fmtDatetime(pu.endTime)),
      normalText('，共计提货'), uline(v(pu.totalDays)), normalText('天；累计提货量：'),
      uline(v(pu.cumulativeQuantity)), normalText('吨。实际出库损耗量：'), uline(v(pu.outboundLossQuantity)),
      normalText('吨，损耗率：'), uline(v(pu.outboundLossRate)), normalText('%；'),
      normalText('损耗原因：'), uline(v(pu.outboundLossReason, '货物自然挥发')),
      normalText('（如：货物自然挥发、装卸轻微损耗，无异常损耗）。'),
    ]));
    const vd = s5.vendorDeductions;
    children.push(pRuns([
      boldLabel('5.3 执行商扣情况：'), cb(!vd.hasDeductions, '无商扣'), cb(vd.hasDeductions, '有商扣'),
      ...(vd.hasDeductions ? [
        normalText('；商扣批次：'), uline(v(vd.batch)),
        normalText('，商扣原因：'), uline(v(vd.reason)),
        normalText('（如：少量货物杂质轻微超标、提货延迟等），商扣数量：'), uline(v(vd.quantity)),
        normalText('吨，商扣金额：'), uline(v(vd.amount)),
        normalText('元（如有）；商扣手续规范，执行商、货主及相关单位签字确认，商扣记录归档留存。'),
      ] : [
        normalText('；若有商扣：商扣批次：__________，商扣原因：__________（如：少量货物杂质轻微超标、提货延迟等），商扣数量：____吨，商扣金额：__________元（如有）；商扣手续规范。'),
      ]),
    ]));
    children.push(pRuns([boldLabel('附整船执行台账：')]));

    // ═══════════════ Section 6 ═══════════════
    children.push(heading('6. 成本分析'));
    const s6 = s.section6;
    const sf = s6.southernPortFees;
    children.push(pRuns([boldLabel('北方采购价：'), normalText(v(s6.northernPurchasePrice))]));
    children.push(pRuns([
      boldLabel('费用偏差：'),
      normalText('南方港口港杂费' + v(sf.portOperationFee) + '，堆存费' + v(sf.storageFee) + '等各项杂费，'),
      normalText('折合单吨' + v(sf.unitCost) + '元/吨，销售时预估港口费用' + v(sf.estimatedPortFee) + '元/吨，'),
      normalText('费用偏差' + v(sf.deviation) + '元，单吨偏差' + v(sf.unitDeviation) + '元/吨。'),
    ]));
    children.push(pRuns([boldLabel('海运费：'), normalText(v(s6.shippingCostPerTon) + ' 元/吨')]));
    children.push(pRuns([boldLabel('利润分析：'), normalText(v(s6.profitAnalysis))]));

    // ═══════════════ Section 7 ═══════════════
    children.push(heading('7. 整船总结'));
    const s7 = s.section7;
    children.push(p('本航次船舶从装运、航行、靠泊、卸货至提货，全程严格遵循相关规范及作业计划，各环节衔接顺畅、管控到位，整体作业顺利完成，无重大安全事故、品质异常、进度延误等问题，具体总结如下：'));
    children.push(pRuns([boldLabel('1. 作业概况：'), normalText(v(s7.operationsOverview))]));
    children.push(pRuns([boldLabel('2. 品质管控：'), normalText(v(s7.qualityControl))]));
    children.push(pRuns([boldLabel('3. 安全及流程：'), normalText(v(s7.safetyProcess))]));
    children.push(pRuns([boldLabel('4. 不足及改进（可选）：'), normalText(v(s7.improvements))]));
    children.push(pRuns([boldLabel('附表：')]));

    // ═══════════════ Signatures ═══════════════
    children.push(p('', { spacing: { before: 400 } }));
    children.push(p('销售支持确认：' + v(s.footer.salesSupportConfirm), { size: HP.SIGN, spacing: { after: 200 } }));
    children.push(p('物流现场确认：' + v(s.footer.logisticsConfirm), { size: HP.SIGN, spacing: { after: 200 } }));
    children.push(p('销售人员确认：' + v(s.footer.salesConfirm), { size: HP.SIGN, spacing: { after: 200 } }));
    children.push(p('', { spacing: { after: 100 } }));
    children.push(p('报告日期：' + fmtDate(m.reportDate), { size: HP.SIGN }));

    // ═══════════════ Generate Document ═══════════════
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT.BODY, size: HP.BODY },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            size: { width: 11906, height: 16838 }, // A4
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = '船小结报告_' + v(m.shipName, '未命名') + '_' + new Date().toISOString().slice(0,10) + '.docx';
    if (typeof saveAs !== 'undefined') {
      saveAs(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  return { generateAndDownload };
})();
