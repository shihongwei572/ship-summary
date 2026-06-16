/**
 * preview.js — Live preview panel
 *
 * 封面：logo + 内贸玉米散粮 36pt + 船小结 36pt + 船名 28pt + 经营部 24pt + 日期
 * 目录：仿宋 28pt 居中标题 + 条目（左文字 + 右页码）
 * 正文：等线 11pt / 标题 16pt
 */
const Preview = (function() {
  'use strict';
  let container;

  function init(cont) { container = cont; FormState.onChange(() => render()); render(); }

  function render() {
    if (!container) return;
    const s = FormState.getState(), m = s.meta;
    const ship = esc((m.shipName || '______') + '/' + (m.voyage || '______'));

    let h = '';

    /* ═══════════════ 封面 ═══════════════ */
    h += '<div class="page-cover">';
    h += '<div class="cv-logo"><img src="img/cofco-logo.png" alt="COFCO"></div>';
    h += '<div class="cv-title-l">内贸玉米散粮</div>';
    h += '<div class="cv-title-l cv-title-gap">船 小 结</div>';
    h += '<div class="cv-ship-name">船名：' + ship + '</div>';
    h += '<div class="cv-spacer"></div>';
    h += '<div class="cv-dept-name">' + esc(m.operatingDept || '______经营部') + '</div>';
    h += '<div class="cv-report-date">' + (fd(m.reportDate) || '______年__月__日') + '</div>';
    h += '</div>';

    /* ═══════════════ 目录 ═══════════════ */
    h += '<div class="page-toc">';
    h += '<div class="toc-heading">目录</div>';
    const tocItems = [
      ['一、到港前船舶情况', '3'],
      ['二、码头计划仓库情况', '4'],
      ['三、船靠泊卸货前情况', '5'],
      ['四、船舶从卸货到结束情况', '6'],
      ['五、提货情况', '8'],
      ['六、成本分析', '10'],
      ['七、整船总结', '10'],
    ];
    tocItems.forEach(([t, p]) => {
      h += '<div class="toc-row"><span class="toc-label">' + t + '</span><span class="toc-page">' + p + '</span></div>';
    });
    h += '</div>';

    /* ═══════════════ 正文 ═══════════════ */
    const s1 = s.section1;
    h += sectionH('一、到港前船舶情况');
    h += docP('本航次船舶承载【' + ship + '】，到港前完成各项前置核查，相关情况详细如下：');
    h += docF('水路运单', s1.waterwayWaybillText, '运单信息与货物、船名航次一致');
    h += docPhoto(s1.waterwayWaybillFile, '水路运单附图');
    h += docF('装运港、数量及时间', '装运港：' + uv(s1.portOfLoading) + '；货物总数量：' + uv(s1.cargoQuantity) + '吨；装运开始时间：' + fdt(s1.loadingStartTime) + '，装运结束时间：' + fdt(s1.loadingEndTime) + '（如有报告可不填）');
    h += docF('检验报告及封签', s1.inspectionReportText, '装港检验报告显示货物品质符合标准，船舱封签完好，无异常');
    if (s1.inspectionReportFile) h += docPhoto(s1.inspectionReportFile);
    h += docPhoto(s1.sealCheckFile, '封签检查情况附图');
    h += docF('预计到港时间', '预计到港时间：' + fdt(s1.estimatedArrivalTime) + '；实际到港时间：' + fdt(s1.actualArrivalTime));
    h += docF('轨迹情况', '预定航线：' + uv(s1.plannedRoute) + '→' + uv(s1.actualRoute) + '（起始至终点），实际航行' + uv(s1.routeDeviation, '无偏离预定航线、无违规停靠情况') + '；轨迹由' + uv(s1.trackingDevice) + '全程记录，航行期间' + uv(s1.routeNotes, '无恶劣天气、海上事故等异常') + '。');

    const s2 = s.section2;
    h += sectionH('二、码头计划仓库情况');
    h += docP('提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：');
    h += docF('靠船泊位', '确认靠泊码头：' + uv(s2.dockName) + '，泊位：' + uv(s2.berthNumber) + '；泊位无障碍物、无其他船舶占用，配套装卸设备运行正常，具备靠泊及卸货条件');
    h += docF('码头仓位', '码头预留仓位编号：' + uv(s2.warehousePositions) + '，仓位容量：' + uv(s2.warehouseCapacity) + '吨，可完全容纳本航次货物（' + uv(s2.cargoWeight) + '万吨）；仓位地面平整、干燥、无积水、无杂物，符合存储要求；仓位已提前清理、消毒，经检查合格后预留使用');
    h += docP('<b>是否直提安排：</b>' + ck(s2.isDirectPickup) + ' 是 ' + ck(!s2.isDirectPickup) + ' 否；' + (s2.isDirectPickup ? '直提开始时间：' + fdt(s2.directPickupStartTime) : '若为不直提：货物全部存入上述预留码头仓位，后续按提货计划逐步出库'));

    const s3 = s.section3, wx = s3.weather;
    h += sectionH('三、船靠泊卸货前情况');
    h += docP('船舶靠泊后，卸货前完成现场勘察、风险排查及资料留存，具体情况如下：');
    h += docP('<b>天气及风力情况：</b>' + ck(wx.sunny) + '晴天 ' + ck(wx.cloudy) + '阴天 ' + ck(wx.overcast) + '多云（无降雨、雷电等恶劣天气）；风力：' + uv(s3.windLevel) + '级，风向：' + uv(s3.windDirection) + '；风力符合卸货作业标准（≤' + uv(s3.windStandard) + '级），无影响卸货的天气因素');
    h += docP('<b>风险情况：</b>排查结果：' + ck(!s3.riskCheck.hasRisk) + '无异常风险 ' + ck(s3.riskCheck.hasRisk) + '存在轻微风险' + (s3.riskCheck.hasRisk ? '（风险描述：' + uv(s3.riskCheck.riskDescription) + '；整改措施：' + uv(s3.riskCheck.remediation) + '）' : '；整改措施：无，复查结果：合格，确认无卸货安全风险后，启动卸货准备工作'));
    h += docP('<b>开舱照片、取样照片：</b>开舱照片：' + uv(s3.hatchPhotos.count) + '张，拍摄时间：' + fdt(s3.hatchPhotos.time) + '，拍摄地点：' + uv(s3.hatchPhotos.location, '船舶各货舱舱口') + '；取样照片：' + uv(s3.samplingPhotos.count) + '张，拍摄时间：' + fdt(s3.samplingPhotos.time) + '，取样人员：' + uv(s3.samplingPhotos.sampler));

    const s4 = s.section4, u = s4.unloading, ins = s4.insurance;
    h += sectionH('四、船舶从卸货到结束情况');
    h += docP('卸货作业按计划推进，全程做好作业记录、品质监控及清仓核查，具体如下：');
    h += docF('码头作业线', '启用码头作业线' + uv(s4.operatingLines.lineCount) + '条，每条作业线日装卸' + uv(s4.operatingLines.dailyCapacityPerLine) + '吨；作业期间设备运行正常，操作人员持证上岗、操作规范');
    h += docF('卸货天数', '卸货开始时间：' + fdt(u.startTime) + '，卸货结束时间：' + fdt(u.endTime) + '；共计卸货' + uv(u.totalHours) + '小时；日均卸货量：' + uv(u.dailyAverage) + '万吨；暂停作业情况：' + ck(!u.hasPause) + '无 ' + ck(u.hasPause) + '有' + (u.hasPause ? '（原因：' + uv(u.pauseReason) + '，时长：' + uv(u.pauseDuration) + '小时）' : ''));
    h += docF('船舱清仓情况', s4.holdCleaningResult);
    h += docF('品质情况', s4.qualityInspectionResult);
    h += docF('损耗情况', '实际损耗量：' + uv(s4.loss.quantity) + '吨，损耗率：' + uv(s4.loss.rate) + '%；合同约定损耗标准：≤' + uv(s4.loss.contractStandard) + '%；损耗原因：' + uv(s4.loss.reason, '无异常损耗') + '（如：货物自然挥发、装卸轻微损耗，无异常损耗）');
    h += docP('<b>是否保险：</b>' + ck(!ins.claimed) + '未出险 ' + ck(ins.claimed) + '出险；出险时间：' + (ins.claimed ? uv(ins.timeRange) : '____年__月__日 - ____年__月__日'));

    const s5 = s.section5, pu = s5.pickup, vd = s5.vendorDeductions;
    h += sectionH('五、提货情况');
    h += docP('货物卸货完成后，按提货计划有序开展提货作业，全程做好粮质巡查、提货统计及商扣记录，具体如下：');
    h += docF('粮质巡查情况', '巡查频次：' + uv(s5.qualityPatrol.frequency) + '；巡查内容：货物有无霉变、结块、发热、虫蛀等异常；巡查结果：' + uv(s5.qualityPatrol.results, '全程无异常，货物品质保持稳定') + '；巡查记录完整');
    h += docF('提货情况', '提货开始时间：' + fdt(pu.startTime) + '，提货结束时间：' + fdt(pu.endTime) + '，共计提货' + uv(pu.totalDays) + '天；累计提货量：' + uv(pu.cumulativeQuantity) + '吨。出库损耗量：' + uv(pu.outboundLossQuantity) + '吨，损耗率：' + uv(pu.outboundLossRate) + '%；损耗原因：' + uv(pu.outboundLossReason, '货物自然挥发'));
    h += docP('<b>执行商扣情况：</b>' + ck(!vd.hasDeductions) + '无商扣 ' + ck(vd.hasDeductions) + '有商扣；' + (vd.hasDeductions ? '商扣批次：' + uv(vd.batch) + '，商扣原因：' + uv(vd.reason) + '，商扣数量：' + uv(vd.quantity) + '吨，商扣金额：' + uv(vd.amount) + '元' : '若有商扣：商扣批次：__________'));

    const s6 = s.section6, sf6 = s6.southernPortFees;
    h += sectionH('六、成本分析');
    h += docF('北方采购价', uv(s6.northernPurchasePrice));
    h += docF('费用偏差', '南方港口港杂费' + uv(sf6.portOperationFee) + '，堆存费' + uv(sf6.storageFee) + '等各项杂费，折合单吨' + uv(sf6.unitCost) + '元/吨，销售时预估港口费用' + uv(sf6.estimatedPortFee) + '元/吨，费用偏差' + uv(sf6.deviation) + '，单吨偏差' + uv(sf6.unitDeviation) + '元/吨');
    h += docF('海运费', uv(s6.shippingCostPerTon) + ' 元/吨');
    h += docF('利润分析', uv(s6.profitAnalysis));

    const s7 = s.section7;
    h += sectionH('七、整船总结');
    h += docP('本航次船舶从装运、航行、靠泊、卸货至提货，全程严格遵循相关规范及作业计划，各环节衔接顺畅、管控到位，整体作业顺利完成，具体总结如下：');
    h += docP('<b>作业概况：</b>' + uv(s7.operationsOverview));
    h += docP('<b>品质管控：</b>' + uv(s7.qualityControl));
    h += docP('<b>安全及流程：</b>' + uv(s7.safetyProcess));
    h += docP('<b>不足及改进：</b>' + uv(s7.improvements));

    /* ═══════════════ 签署 ═══════════════ */
    h += '<div class="doc-signatures">';
    h += '<p>销售支持确认：' + uv(s.footer.salesSupportConfirm) + '</p>';
    h += '<p>物流现场确认：' + uv(s.footer.logisticsConfirm) + '</p>';
    h += '<p>销售人员确认：' + uv(s.footer.salesConfirm) + '</p>';
    h += '<p class="sig-date">报告日期：' + (fd(m.reportDate) || '____年__月__日') + '</p>';
    h += '</div>';

    container.innerHTML = h;
  }

  // ── helpers ──
  function esc(s) { if (!s) return ''; return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function uv(v, d) { if (v === null || v === undefined || v === '') return d || '<span class="gap">______</span>'; return esc(String(v)); }
  function fd(v) { if (!v) return ''; const d = new Date(v); if (isNaN(d.getTime())) return v; return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
  function fdt(v) { if (!v) return ''; const d = new Date(v); if (isNaN(d.getTime())) return v; return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function ck(c) { return '<span class="chk">' + (c ? '☑' : '□') + '</span>'; }
  function sectionH(t) { return '<h2 class="doc-sec-heading">' + t + '</h2>'; }
  function docP(t) { return '<p class="doc-p">' + t + '</p>'; }
  function docF(l, c, d) { return '<p class="doc-p"><b>' + l + '：</b>' + (c || d || '______') + '</p>'; }
  function docPhoto(fd, label) { if (fd && fd.name) return '<div class="doc-photo has-file">[附图：' + esc(fd.name) + ']</div>'; if (label) return '<div class="doc-photo">[' + label + ']</div>'; return ''; }

  return { init, render };
})();
