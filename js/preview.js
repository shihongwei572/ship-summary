/**
 * preview.js — Live preview panel
 * Fonts match template: 标题→微软雅黑, 目录→仿宋, 正文→等线
 */
const Preview = (function() {
  'use strict';
  let container;

  function init(cont) { container = cont; FormState.onChange(() => render()); render(); }

  function render() {
    if (!container) return;
    const s = FormState.getState(), m = s.meta, shipFull = (m.shipName||'______')+'/'+(m.voyage||'______');

    let h = '';
    // ── COVER ──
    h += `<div class="doc-cover">
      <div class="cv-attach">附件1：</div>
      <div class="cv-title">内贸玉米散粮</div>
      <div class="cv-title cv-title-j">船 小 结</div>
      <div class="cv-logo"><img src="img/cofco-logo.png" alt="COFCO" style="max-width:200px;"></div>
      <div class="cv-ship">船名：${esc(shipFull)}</div>
      <div class="cv-ship-b">船名：${esc(shipFull)}</div>
      <div class="cv-dept">${esc(m.operatingDept||'______经营部')}</div>
      <div class="cv-date">${fd(m.reportDate)||'______年__月__日'}</div>
    </div>`;

    // ── TOC ──
    h += `<div class="doc-toc">
      <div class="toc-title">目录</div>
      <div class="toc-list">
        <div class="toc-item toc-l1">1. 到港前船舶情况<span class="toc-pg">3</span></div>
        <div class="toc-item">2. 码头计划仓库情况<span class="toc-pg">3</span></div>
        <div class="toc-item">3. 船靠泊卸货前情况<span class="toc-pg">4</span></div>
        <div class="toc-item">4. 船舶从卸货到结束情况<span class="toc-pg">5</span></div>
        <div class="toc-item">5. 提货情况<span class="toc-pg">6</span></div>
        <div class="toc-item">6. 成本分析<span class="toc-pg">7</span></div>
        <div class="toc-item">7. 整船总结<span class="toc-pg">7</span></div>
      </div>
    </div>`;

    // ── SECTIONS ──
    const s1 = s.section1;
    h += sh('1. 到港前船舶情况');
    h += dp('本航次船舶承载【'+esc(shipFull)+'】，到港前完成各项前置核查，相关情况详细如下：');
    h += rf('水路运单', s1.waterwayWaybillText, '运单信息与货物、船名航次一致');
    h += photo(s1.waterwayWaybillFile, '水路运单附图');
    h += rf('装运港、数量及时间', '装运港：'+uv(s1.portOfLoading)+'；货物总数量：'+uv(s1.cargoQuantity)+'吨；装运开始时间：'+fdt(s1.loadingStartTime)+'，装运结束时间：'+fdt(s1.loadingEndTime));
    h += rf('检验报告及封签', s1.inspectionReportText, '装港检验报告显示货物品质符合标准，船舱封签完好，无异常。');
    if(s1.inspectionReportFile) h += photo(s1.inspectionReportFile);
    h += rf('封签检查情况', '', '');
    h += photo(s1.sealCheckFile, '封签检查情况附图');
    h += rf('1.4 预计到港时间', '预计到港时间：'+fdt(s1.estimatedArrivalTime)+'；实际到港时间：'+fdt(s1.actualArrivalTime));
    h += rf('1.5 轨迹情况', '预定航线：'+uv(s1.plannedRoute)+'→'+uv(s1.actualRoute)+'（起始至终点），实际航行'+uv(s1.routeDeviation,'无偏离预定航线、无违规停靠情况')+'；轨迹由'+uv(s1.trackingDevice)+'（设备/单位）全程记录，航行期间'+uv(s1.routeNotes,'无恶劣天气、海上事故等异常')+'。');

    const s2 = s.section2;
    h += sh('2. 码头计划仓库情况');
    h += dp('提前与码头、仓库、船代及执行商对接，确认各项作业计划，保障船舶靠泊、卸货顺畅推进，具体如下：');
    h += rf('2.1 靠船泊位', '确认靠泊码头：'+uv(s2.dockName)+'，泊位：'+uv(s2.berthNumber)+'；泊位无障碍物、无其他船舶占用，配套装卸设备运行正常，具备靠泊及卸货条件。');
    h += rf('2.2 码头仓位', '码头预留仓位编号：'+uv(s2.warehousePositions)+'，仓位容量：'+uv(s2.warehouseCapacity)+'吨，可完全容纳本航次货物（'+uv(s2.cargoWeight)+'万吨）；仓位地面平整、干燥、无积水、无杂物，通风、防潮、防鼠设施完善，符合存储要求。');
    h += dp('<b>2.3 是否直提安排：</b>'+ck(s2.isDirectPickup)+' 是 '+ck(!s2.isDirectPickup)+' 否；'+(s2.isDirectPickup?'直提开始时间：'+fdt(s2.directPickupStartTime):'若为不直提：货物全部存入上述预留码头仓位。'));

    const s3 = s.section3, wx = s3.weather;
    h += sh('3. 船靠泊卸货前情况');
    h += dp('船舶靠泊后，卸货前完成现场勘察、风险排查及资料留存，具体情况如下：');
    h += dp('<b>3.1 天气及风力情况：</b>'+ck(wx.sunny)+'晴天 '+ck(wx.cloudy)+'阴天 '+ck(wx.overcast)+'多云（无降雨雷电）；风力：'+uv(s3.windLevel)+'级，风向：'+uv(s3.windDirection)+'；符合卸货作业标准（≤'+uv(s3.windStandard)+'级），无影响卸货的天气因素。');
    h += dp('<b>3.2 风险情况：</b>排查结果：'+ck(!s3.riskCheck.hasRisk)+'无异常风险 '+ck(s3.riskCheck.hasRisk)+'存在轻微风险'+(s3.riskCheck.hasRisk?'（风险描述：'+uv(s3.riskCheck.riskDescription)+'；整改措施：'+uv(s3.riskCheck.remediation)+'）':'；整改措施：无')+'；安全责任人：'+uv(s3.safetyOfficer)+'。');
    h += dp('<b>3.3 开舱照片、取样照片：</b>开舱照片：'+uv(s3.hatchPhotos.count)+'张，拍摄时间：'+fdt(s3.hatchPhotos.time)+'，拍摄地点：'+uv(s3.hatchPhotos.location,'船舶各货舱舱口')+'；取样照片：'+uv(s3.samplingPhotos.count)+'张，拍摄时间：'+fdt(s3.samplingPhotos.time)+'，取样人员：'+uv(s3.samplingPhotos.sampler)+'。');
    h += pp('开舱照片', s3.hatchPhotos);
    h += pp('取样照片', s3.samplingPhotos);

    const s4 = s.section4, u = s4.unloading, ins = s4.insurance;
    h += sh('4. 船舶从卸货到结束情况');
    h += dp('卸货作业按计划推进，全程做好作业记录、品质监控及清仓核查，具体如下：');
    h += rf('4.1 码头作业线', '启用码头作业线'+uv(s4.operatingLines.lineCount)+'条，每条作业线日装卸'+uv(s4.operatingLines.dailyCapacityPerLine)+'吨；作业期间设备运行正常，操作人员规范。');
    h += rf('4.2 卸货天数', '卸货开始时间：'+fdt(u.startTime)+'，卸货结束时间：'+fdt(u.endTime)+'；共计卸货'+uv(u.totalHours)+'小时；日均卸货量：'+uv(u.dailyAverage)+'万吨；暂停作业情况：'+ck(!u.hasPause)+'无 '+ck(u.hasPause)+'有'+(u.hasPause?'（原因：'+uv(u.pauseReason)+'，时长：'+uv(u.pauseDuration)+'小时）':''));
    h += rf('4.3 船舱清仓情况', s4.holdCleaningResult);
    h += rf('4.4 品质情况', s4.qualityInspectionResult);
    h += rf('4.5 损耗情况', '实际损耗量：'+uv(s4.loss.quantity)+'吨，损耗率：'+uv(s4.loss.rate)+'%；合同约定损耗标准：≤'+uv(s4.loss.contractStandard)+'%；损耗原因：'+uv(s4.loss.reason,'无异常损耗'));
    h += rf('4.6 是否保险', ck(!ins.claimed)+'未出险 '+ck(ins.claimed)+'出险；出险时间：'+(ins.claimed?uv(ins.timeRange):'____年__月__日 - ____年__月__日。'));
    h += dp('<b>出险原因：</b>'+uv(ins.reason));
    h += dp('<b>保险受理情况：</b>'+uv(ins.acceptanceDetails));

    const s5 = s.section5, pu = s5.pickup, vd = s5.vendorDeductions;
    h += sh('5. 提货情况');
    h += dp('货物卸货完成后，按提货计划有序开展提货作业，全程做好粮质巡查、提货统计及商扣记录，具体如下：');
    h += rf('5.1 粮质巡查情况', '巡查频次：'+uv(s5.qualityPatrol.frequency)+'；巡查内容：货物有无霉变、结块、发热、虫蛀等异常；巡查结果：'+uv(s5.qualityPatrol.results,'全程无异常，货物品质保持稳定')+'；巡查记录完整。');
    h += rf('5.2 提货情况', '提货开始时间：'+fdt(pu.startTime)+'，提货结束时间：'+fdt(pu.endTime)+'，共计提货'+uv(pu.totalDays)+'天；累计提货量：'+uv(pu.cumulativeQuantity)+'吨。出库损耗量：'+uv(pu.outboundLossQuantity)+'吨，损耗率：'+uv(pu.outboundLossRate)+'%；损耗原因：'+uv(pu.outboundLossReason,'货物自然挥发'));
    h += rf('5.3 执行商扣情况', ck(!vd.hasDeductions)+'无商扣 '+ck(vd.hasDeductions)+'有商扣'+(vd.hasDeductions?'；商扣批次：'+uv(vd.batch)+'，商扣原因：'+uv(vd.reason)+'，商扣数量：'+uv(vd.quantity)+'吨，商扣金额：'+uv(vd.amount)+'元':'；若有商扣：商扣批次：__________'));
    h += dp('<b>附整船执行台账：</b>');

    const s6 = s.section6, sf6 = s6.southernPortFees;
    h += sh('6. 成本分析');
    h += rf('北方采购价', uv(s6.northernPurchasePrice));
    h += rf('费用偏差', '南方港口港杂费'+uv(sf6.portOperationFee)+'，堆存费'+uv(sf6.storageFee)+'等各项杂费，折合单吨'+uv(sf6.unitCost)+'元/吨，销售时预估港口费用'+uv(sf6.estimatedPortFee)+'元/吨，费用偏差'+uv(sf6.deviation)+'元，单吨偏差'+uv(sf6.unitDeviation)+'元/吨。');
    h += rf('海运费', uv(s6.shippingCostPerTon)+' 元/吨');
    h += rf('利润分析', uv(s6.profitAnalysis));

    const s7 = s.section7;
    h += sh('7. 整船总结');
    h += dp('本航次船舶从装运、航行、靠泊、卸货至提货，全程严格遵循相关规范及作业计划，各环节衔接顺畅、管控到位，整体作业顺利完成，具体总结如下：');
    h += dp('<b>1. 作业概况：</b>'+uv(s7.operationsOverview));
    h += dp('<b>2. 品质管控：</b>'+uv(s7.qualityControl));
    h += dp('<b>3. 安全及流程：</b>'+uv(s7.safetyProcess));
    h += dp('<b>4. 不足及改进（可选）：</b>'+uv(s7.improvements));
    h += dp('<b>附表：</b>');

    // ── SIGNATURES ──
    h += `<div class="doc-signatures">
      <p>销售支持确认：${uv(s.footer.salesSupportConfirm)}</p>
      <p>物流现场确认：${uv(s.footer.logisticsConfirm)}</p>
      <p>销售人员确认：${uv(s.footer.salesConfirm)}</p>
      <p class="sig-date">报告日期：${fd(m.reportDate)||'____年__月__日'}</p>
    </div>`;

    container.innerHTML = h;
  }

  // ── HELPERS ──
  function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function uv(v,d){if(v===null||v===undefined||v==='')return d||'<span class="gap">______</span>';return esc(String(v));}
  function fd(v){if(!v)return'';const d=new Date(v);if(isNaN(d.getTime()))return v;return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';}
  function fdt(v){if(!v)return'';const d=new Date(v);if(isNaN(d.getTime()))return v;return d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日 '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
  function ck(c){return '<span class="chk">'+(c?'☑':'□')+'</span>';}
  function sh(t){return '<h2 class="doc-sec-heading">'+t+'</h2>';}
  function dp(t){return '<p class="doc-p">'+t+'</p>';}
  function rf(l,c,d){let hh='<p class="doc-p"><b>'+l+'：</b>'+(c||d||'______')+'</p>';return hh;}
  function photo(fd,label){if(fd&&fd.name)return '<div class="doc-photo has-file">[附图：'+esc(fd.name)+']</div>';if(label)return '<div class="doc-photo">['+label+']</div>';return '';}
  function pp(label,pd){if(pd.files&&pd.files.length){let hh='<div class="doc-photo has-file">['+label+'：已上传'+pd.files.length+'张]</div>';pd.files.forEach(f=>{if(f.dataURL&&f.type&&f.type.startsWith('image/'))hh+='<img src="'+f.dataURL+'" class="doc-inline-img" />';});return hh;}return '<div class="doc-photo">['+label+'附图]</div>';}

  return { init, render };
})();
