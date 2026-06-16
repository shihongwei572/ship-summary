/**
 * form-renderer.js — Dynamic form generation for all 7 sections
 * Uses a declarative field config to build DOM elements.
 */
const FormRenderer = (function() {
  'use strict';

  const SECTION_IDS = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'section7'];
  const SECTION_LABELS = {
    section1: '到港前船舶情况',
    section2: '码头计划仓库情况',
    section3: '船靠泊卸货前情况',
    section4: '船舶从卸货到结束情况',
    section5: '提货情况',
    section6: '成本分析',
    section7: '整船总结'
  };

  // ── Render entire form ──────────────────────────────────
  function renderAll(container) {
    container.innerHTML = '';
    SECTION_IDS.forEach(id => {
      const section = renderSection(id);
      container.appendChild(section);
    });
  }

  // ── Render a single section ─────────────────────────────
  function renderSection(sectionId) {
    const section = document.createElement('div');
    section.className = 'accordion-section open'; // first section open by default
    section.id = `section-${sectionId}`;

    // Header
    const header = document.createElement('div');
    header.className = 'accordion-header';
    const num = sectionId.replace('section', '');
    header.innerHTML = `
      <span class="section-number">${num}</span>
      <span class="section-title">${SECTION_LABELS[sectionId]}</span>
      <span class="status-dot empty" id="status-${sectionId}"></span>
      <span class="arrow">▼</span>
    `;
    header.addEventListener('click', () => {
      section.classList.toggle('open');
    });

    // Body
    const body = document.createElement('div');
    body.className = 'accordion-body';
    body.id = `body-${sectionId}`;

    // Build fields based on section
    switch(sectionId) {
      case 'section1': buildSection1(body); break;
      case 'section2': buildSection2(body); break;
      case 'section3': buildSection3(body); break;
      case 'section4': buildSection4(body); break;
      case 'section5': buildSection5(body); break;
      case 'section6': buildSection6(body); break;
      case 'section7': buildSection7(body); break;
    }

    section.appendChild(header);
    section.appendChild(body);

    // Only first section open by default
    if (num !== '1') section.classList.remove('open');

    return section;
  }

  // ── Field helpers ───────────────────────────────────────
  function makeFormGroup(label, required, extraClass) {
    const div = document.createElement('div');
    div.className = 'form-group' + (extraClass ? ' ' + extraClass : '');
    const lbl = document.createElement('label');
    lbl.className = 'form-label';
    lbl.innerHTML = label + (required ? '<span class="required">*</span>' : '<span class="optional">(选填)</span>');
    div.appendChild(lbl);
    return div;
  }

  function makeInput(path, type, placeholder, cssClass) {
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type === 'textarea') {
      input.className = 'form-textarea';
    } else {
      input.type = type;
      input.className = 'form-input' + (cssClass ? ' ' + cssClass : '');
    }
    if (placeholder) input.placeholder = placeholder;
    // Bind value from state
    const val = FormState.getState(path);
    if (val !== null && val !== undefined && val !== false) {
      input.value = val;
    }
    input.addEventListener('input', () => {
      FormState.set(path, type === 'number' ? input.value : input.value);
    });
    input.setAttribute('data-path', path);
    return input;
  }

  function makeRadioGroup(path, options, onChange) {
    const container = document.createElement('div');
    container.className = 'radio-group';

    const currentVal = FormState.getState(path);

    options.forEach((opt, idx) => {
      const item = document.createElement('label');
      item.className = 'radio-item';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = path;
      radio.value = opt.value;
      if (currentVal === opt.value) radio.checked = true;
      if (idx === 0 && (currentVal === undefined || currentVal === null)) {
        radio.checked = true;
        FormState.set(path, opt.value);
      }
      radio.addEventListener('change', () => {
        FormState.set(path, opt.value);
        if (onChange) onChange(opt.value);
      });
      item.appendChild(radio);
      item.appendChild(document.createTextNode(opt.label));
      container.appendChild(item);
    });

    return container;
  }

  function makeCheckboxGroup(path, options) {
    const container = document.createElement('div');
    container.className = 'checkbox-group';

    options.forEach(opt => {
      const item = document.createElement('label');
      item.className = 'checkbox-item';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = opt.value;
      const val = FormState.getState(path + '.' + opt.value);
      cb.checked = !!val;
      cb.addEventListener('change', () => {
        FormState.set(path + '.' + opt.value, cb.checked);
      });
      item.appendChild(cb);
      item.appendChild(document.createTextNode(opt.label));
      container.appendChild(item);
    });

    return container;
  }

  function makeUploadZone(path, multiple, accept) {
    const container = document.createElement('div');

    const zone = document.createElement('div');
    zone.className = 'upload-zone';
    zone.setAttribute('tabindex', '0'); // make focusable for paste
    zone.setAttribute('data-path', path);
    if (multiple) zone.setAttribute('data-multiple', 'true');
    zone.innerHTML = `
      <div class="upload-icon">📎</div>
      <div class="upload-text">点击、拖拽或 Ctrl+V 粘贴文件到此处</div>
      <div class="upload-hint">${accept || '支持图片、PDF等文件格式'}</div>
    `;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || 'image/*,.pdf';
    if (multiple) input.multiple = true;

    const previewContainer = document.createElement('div');
    previewContainer.className = 'upload-preview';

    // Load existing files
    const existing = FormState.getState(path);
    if (existing) {
      if (Array.isArray(existing)) {
        existing.forEach((f, i) => addFilePreview(previewContainer, f, path, i, true));
      } else if (existing.dataURL) {
        addFilePreview(previewContainer, existing, path, -1, false);
      }
    }

    input.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            dataURL: ev.target.result
          };
          if (multiple) {
            const arr = FormState.getState(path) || [];
            if (!Array.isArray(arr)) { /* convert */ }
            const newArr = Array.isArray(arr) ? [...arr, fileData] : [fileData];
            FormState.set(path, newArr);
            addFilePreview(previewContainer, fileData, path, newArr.length - 1, true);
          } else {
            FormState.set(path, fileData);
            previewContainer.innerHTML = '';
            addFilePreview(previewContainer, fileData, path, -1, false);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    // Drag & drop
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const dt = e.dataTransfer;
      if (dt.files.length) {
        input.files = dt.files;
        input.dispatchEvent(new Event('change'));
      }
    });

    zone.appendChild(input);
    container.appendChild(zone);
    container.appendChild(previewContainer);

    // ── Ctrl+V paste support ──
    zone.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;
          // generate a filename
          const ext = item.type.split('/')[1] || 'png';
          const name = 'paste-' + Date.now() + '.' + ext;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const fileData = { name, size: blob.size, type: item.type, dataURL: ev.target.result };
            if (multiple) {
              const arr = FormState.getState(path) || [];
              const newArr = Array.isArray(arr) ? [...arr, fileData] : [fileData];
              FormState.set(path, newArr);
              addFilePreview(previewContainer, fileData, path, newArr.length - 1, true);
            } else {
              FormState.set(path, fileData);
              previewContainer.innerHTML = '';
              addFilePreview(previewContainer, fileData, path, -1, false);
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    });
    return container;
  }

  function addFilePreview(container, fileData, path, index, isArray) {
    const div = document.createElement('div');
    div.className = 'upload-file-info';

    if (fileData.dataURL && fileData.type && fileData.type.startsWith('image/')) {
      const thumb = document.createElement('img');
      thumb.className = 'upload-thumb';
      thumb.src = fileData.dataURL;
      thumb.style.width = '60px'; thumb.style.height = '60px';
      thumb.style.cursor = 'pointer';
      thumb.title = '点击放大查看';
      // 点击缩略图 → 放大预览
      thumb.addEventListener('click', (ev) => {
        ev.stopPropagation();
        showImageLightbox(fileData.dataURL, fileData.name);
      });
      div.appendChild(thumb);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = fileData.name || '文件';
    div.appendChild(nameSpan);

    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.title = '移除';
    removeBtn.addEventListener('click', () => {
      if (isArray) {
        const arr = FormState.getState(path) || [];
        arr.splice(index, 1);
        FormState.set(path, [...arr]);
      } else {
        FormState.set(path, null);
      }
      div.remove();
    });
    div.appendChild(removeBtn);

    container.appendChild(div);
  }

  function makeConditionalContainer(parentPath, conditionPath, trueValue) {
    const container = document.createElement('div');
    container.className = 'conditional-fields';
    container.setAttribute('data-condition-path', conditionPath);
    container.setAttribute('data-condition-value', String(trueValue));

    // Check initial state
    const condVal = FormState.getState(conditionPath);
    if (condVal === trueValue || condVal === true) {
      container.classList.add('visible');
    }

    // Listen for changes
    FormState.onChange((changedPath) => {
      if (changedPath === conditionPath || changedPath === '*') {
        const v = FormState.getState(conditionPath);
        if (v === trueValue || v === true) {
          container.classList.add('visible');
        } else {
          container.classList.remove('visible');
        }
      }
    });

    return container;
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 1: 到港前船舶情况
  // ══════════════════════════════════════════════════════════
  function buildSection1(body) {
    // Ship name & voyage
    const fg1 = makeFormGroup('船名/航次', true);
    const row1 = document.createElement('div');
    row1.className = 'field-row';
    const shipNameInput = makeInput('meta.shipName', 'text', '如：海鑫成');
    shipNameInput.classList.add('medium');
    const voyageInput = makeInput('meta.voyage', 'text', '如：2609');
    voyageInput.classList.add('small');
    const shipSpan = document.createElement('span');
    shipSpan.style.cssText = 'line-height:36px;font-size:18px;font-weight:700;';
    shipSpan.textContent = '/';
    row1.appendChild(shipNameInput);
    row1.appendChild(shipSpan);
    row1.appendChild(voyageInput);
    fg1.appendChild(row1);
    body.appendChild(fg1);

    // Operating dept & report date
    const fgDept = makeFormGroup('经营部 & 报告日期', true);
    const rowDept = document.createElement('div');
    rowDept.className = 'field-row';
    const deptInput = makeInput('meta.operatingDept', 'text', '如：粤西经营部');
    deptInput.classList.add('medium');
    const dateInput = makeInput('meta.reportDate', 'date', '');
    dateInput.classList.add('medium');
    rowDept.appendChild(deptInput);
    rowDept.appendChild(dateInput);
    fgDept.appendChild(rowDept);
    body.appendChild(fgDept);

    // 水路运单
    const fgWaybill = makeFormGroup('水路运单', false);
    fgWaybill.appendChild(makeInput('section1.waterwayWaybillText', 'textarea', '运单信息描述...'));
    fgWaybill.appendChild(document.createElement('br'));
    fgWaybill.appendChild(makeUploadZone('section1.waterwayWaybillFile', false, 'image/*,.pdf'));
    body.appendChild(fgWaybill);

    // 装运港、数量及时间
    const fgLoad = makeFormGroup('装运港、数量及时间', true);
    const rowLoad = document.createElement('div');
    rowLoad.className = 'field-row';
    const portDiv = document.createElement('div');
    portDiv.className = 'form-group';
    portDiv.innerHTML = '<label class="form-label">装运港</label>';
    portDiv.appendChild(makeInput('section1.portOfLoading', 'text', '如：丹东'));
    rowLoad.appendChild(portDiv);
    const qtyDiv = document.createElement('div');
    qtyDiv.className = 'form-group';
    qtyDiv.innerHTML = '<label class="form-label">货物总数量（吨）</label>';
    qtyDiv.appendChild(makeInput('section1.cargoQuantity', 'number', '如：21462.46'));
    rowLoad.appendChild(qtyDiv);
    fgLoad.appendChild(rowLoad);

    const rowLoad2 = document.createElement('div');
    rowLoad2.className = 'field-row';
    const startDiv = document.createElement('div');
    startDiv.className = 'form-group';
    startDiv.innerHTML = '<label class="form-label">装运开始时间</label>';
    startDiv.appendChild(makeInput('section1.loadingStartTime', 'datetime-local', ''));
    rowLoad2.appendChild(startDiv);
    const endDiv = document.createElement('div');
    endDiv.className = 'form-group';
    endDiv.innerHTML = '<label class="form-label">装运结束时间</label>';
    endDiv.appendChild(makeInput('section1.loadingEndTime', 'datetime-local', ''));
    rowLoad2.appendChild(endDiv);
    fgLoad.appendChild(rowLoad2);
    body.appendChild(fgLoad);

    // 检验报告及封签
    const fgReport = makeFormGroup('检验报告及封签', false);
    fgReport.appendChild(makeInput('section1.inspectionReportText', 'textarea', '检验报告描述...'));
    fgReport.appendChild(document.createElement('br'));
    fgReport.appendChild(makeUploadZone('section1.inspectionReportFile', false, 'image/*,.pdf'));
    body.appendChild(fgReport);

    // 封签检查附图
    const fgSeal = makeFormGroup('封签检查情况附图', false);
    fgSeal.appendChild(makeUploadZone('section1.sealCheckFile', true, 'image/*'));
    body.appendChild(fgSeal);

    // 预计到港时间 vs 实际到港时间
    const fgArrive = makeFormGroup('到港时间', true);
    const rowArrive = document.createElement('div');
    rowArrive.className = 'field-row';
    const estDiv = document.createElement('div');
    estDiv.className = 'form-group';
    estDiv.innerHTML = '<label class="form-label">预计到港时间</label>';
    estDiv.appendChild(makeInput('section1.estimatedArrivalTime', 'datetime-local', ''));
    rowArrive.appendChild(estDiv);
    const actDiv = document.createElement('div');
    actDiv.className = 'form-group';
    actDiv.innerHTML = '<label class="form-label">实际到港时间</label>';
    actDiv.appendChild(makeInput('section1.actualArrivalTime', 'datetime-local', ''));
    rowArrive.appendChild(actDiv);
    fgArrive.appendChild(rowArrive);
    body.appendChild(fgArrive);

    // 轨迹情况
    const fgRoute = makeFormGroup('轨迹情况', true);
    const rowRoute = document.createElement('div');
    rowRoute.className = 'field-row';
    const planDiv = document.createElement('div');
    planDiv.className = 'form-group';
    planDiv.innerHTML = '<label class="form-label">预定航线（起始→终点）</label>';
    planDiv.appendChild(makeInput('section1.plannedRoute', 'text', '如：丹东→阳江'));
    rowRoute.appendChild(planDiv);
    const actRouteDiv = document.createElement('div');
    actRouteDiv.className = 'form-group';
    actRouteDiv.innerHTML = '<label class="form-label">实际航线</label>';
    actRouteDiv.appendChild(makeInput('section1.actualRoute', 'text', '如：实际航行无偏离预定航线'));
    rowRoute.appendChild(actRouteDiv);
    fgRoute.appendChild(rowRoute);

    fgRoute.appendChild(makeInput('section1.routeDeviation', 'text', '是否偏离路线'));
    fgRoute.appendChild(makeInput('section1.trackingDevice', 'text', '轨迹记录设备/单位'));
    fgRoute.appendChild(makeInput('section1.routeNotes', 'textarea', '航行期间天气、事故等异常情况描述...'));
    body.appendChild(fgRoute);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 2: 码头计划仓库情况
  // ══════════════════════════════════════════════════════════
  function buildSection2(body) {
    // 靠船泊位
    const fgBerth = makeFormGroup('靠船泊位', true);
    const rowBerth = document.createElement('div');
    rowBerth.className = 'field-row';
    const dockDiv = document.createElement('div');
    dockDiv.className = 'form-group';
    dockDiv.innerHTML = '<label class="form-label">靠泊码头</label>';
    dockDiv.appendChild(makeInput('section2.dockName', 'text', '如：源强码头'));
    rowBerth.appendChild(dockDiv);
    const berthDiv = document.createElement('div');
    berthDiv.className = 'form-group fixed';
    berthDiv.innerHTML = '<label class="form-label">泊位号</label>';
    berthDiv.appendChild(makeInput('section2.berthNumber', 'text', '如：1号'));
    berthDiv.querySelector('input').classList.add('small');
    rowBerth.appendChild(berthDiv);
    fgBerth.appendChild(rowBerth);
    fgBerth.appendChild(makeInput('section2.equipmentStatus', 'text', '设备状况'));
    body.appendChild(fgBerth);

    // 码头仓位
    const fgWh = makeFormGroup('码头仓位', true);
    const rowWh = document.createElement('div');
    rowWh.className = 'field-row';
    const posDiv = document.createElement('div');
    posDiv.className = 'form-group';
    posDiv.innerHTML = '<label class="form-label">仓位编号</label>';
    posDiv.appendChild(makeInput('section2.warehousePositions', 'text', '如：4、5、6'));
    rowWh.appendChild(posDiv);
    const capDiv = document.createElement('div');
    capDiv.className = 'form-group fixed';
    capDiv.innerHTML = '<label class="form-label">仓位容量（万吨）</label>';
    capDiv.appendChild(makeInput('section2.warehouseCapacity', 'text', '如：3万'));
    rowWh.appendChild(capDiv);
    const wtDiv = document.createElement('div');
    wtDiv.className = 'form-group fixed';
    wtDiv.innerHTML = '<label class="form-label">本航次货物（万吨）</label>';
    wtDiv.appendChild(makeInput('section2.cargoWeight', 'text', '如：2.2'));
    rowWh.appendChild(wtDiv);
    fgWh.appendChild(rowWh);
    fgWh.appendChild(makeInput('section2.storageConditions', 'textarea', '仓位地面平整、干燥、无积水、无杂物，通风、防潮、防鼠设施完善，符合【货物名称】存储要求；仓位已提前清理、消毒，经检查合格后预留使用。'));
    body.appendChild(fgWh);

    // 是否直提
    const fgDirect = makeFormGroup('是否直提安排', true);
    const isDirect = FormState.getState('section2.isDirectPickup');
    const radioGroup = document.createElement('div');
    radioGroup.className = 'radio-group';
    ['是', '否'].forEach((label, idx) => {
      const item = document.createElement('label');
      item.className = 'radio-item';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'section2.isDirectPickup';
      radio.value = String(idx === 0);
      if ((idx === 0 && isDirect === true) || (idx === 1 && isDirect === false) || (idx === 1 && isDirect === undefined)) {
        radio.checked = true;
        if (isDirect === undefined) FormState.set('section2.isDirectPickup', false);
      }
      radio.addEventListener('change', () => {
        FormState.set('section2.isDirectPickup', idx === 0);
      });
      item.appendChild(radio);
      item.appendChild(document.createTextNode(label));
      radioGroup.appendChild(item);
    });
    fgDirect.appendChild(radioGroup);

    const condDiv = makeConditionalContainer('section2', 'section2.isDirectPickup', true);
    condDiv.appendChild(makeInput('section2.directPickupStartTime', 'datetime-local', '直提开始时间'));
    condDiv.appendChild(makeInput('section2.directPickupNotes', 'textarea', '直提备注...'));
    fgDirect.appendChild(condDiv);

    // Also handle radio change for conditional visibility
    radioGroup.querySelectorAll('input').forEach(r => {
      r.addEventListener('change', () => {
        if (r.value === 'true') condDiv.classList.add('visible');
        else condDiv.classList.remove('visible');
      });
    });

    body.appendChild(fgDirect);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 3: 船靠泊卸货前情况
  // ══════════════════════════════════════════════════════════
  function buildSection3(body) {
    // 天气及风力
    const fgWeather = makeFormGroup('天气及风力情况', true);
    fgWeather.appendChild(makeCheckboxGroup('section3.weather', [
      { value: 'sunny', label: '晴天' },
      { value: 'cloudy', label: '阴天' },
      { value: 'overcast', label: '多云' },
      { value: 'noRainThunder', label: '无降雨雷电' }
    ]));
    const rowWind = document.createElement('div');
    rowWind.className = 'field-row';
    const windLvl = document.createElement('div');
    windLvl.className = 'form-group';
    windLvl.innerHTML = '<label class="form-label">风力（级）</label>';
    windLvl.appendChild(makeInput('section3.windLevel', 'text', '如：4'));
    rowWind.appendChild(windLvl);
    const windDir = document.createElement('div');
    windDir.className = 'form-group';
    windDir.innerHTML = '<label class="form-label">风向</label>';
    windDir.appendChild(makeInput('section3.windDirection', 'text', '如：南风'));
    rowWind.appendChild(windDir);
    const windStd = document.createElement('div');
    windStd.className = 'form-group';
    windStd.innerHTML = '<label class="form-label">风力作业标准（≤X级）</label>';
    windStd.appendChild(makeInput('section3.windStandard', 'text', '如：6'));
    rowWind.appendChild(windStd);
    fgWeather.appendChild(rowWind);
    body.appendChild(fgWeather);

    // 风险排查
    const fgRisk = makeFormGroup('风险情况排查', true);
    const isRisk = FormState.getState('section3.riskCheck.hasRisk');
    const riskRadio = document.createElement('div');
    riskRadio.className = 'radio-group';
    [
      { label: '无异常风险', value: false },
      { label: '存在轻微风险', value: true }
    ].forEach(opt => {
      const item = document.createElement('label');
      item.className = 'radio-item';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'section3.riskCheck.hasRisk';
      radio.value = String(opt.value);
      if ((opt.value === false && !isRisk) || (opt.value === true && isRisk) || (opt.value === false && isRisk === undefined)) {
        radio.checked = true;
      }
      radio.addEventListener('change', () => {
        FormState.set('section3.riskCheck.hasRisk', opt.value);
      });
      item.appendChild(radio);
      item.appendChild(document.createTextNode(opt.label));
      riskRadio.appendChild(item);
    });
    fgRisk.appendChild(riskRadio);

    const riskCond = makeConditionalContainer('section3', 'section3.riskCheck.hasRisk', true);
    riskCond.appendChild(makeInput('section3.riskCheck.riskDescription', 'textarea', '风险描述...'));
    riskCond.appendChild(makeInput('section3.riskCheck.remediation', 'text', '整改措施...'));
    riskCond.appendChild(makeInput('section3.riskCheck.remediationCompleteTime', 'datetime-local', '整改完成时间'));
    riskCond.appendChild(makeInput('section3.riskCheck.recheckResult', 'text', '复查结果'));
    fgRisk.appendChild(riskCond);

    riskRadio.querySelectorAll('input').forEach(r => {
      r.addEventListener('change', () => {
        if (r.value === 'true') riskCond.classList.add('visible');
        else riskCond.classList.remove('visible');
      });
    });

    fgRisk.appendChild(makeInput('section3.safetyOfficer', 'text', '安全责任人'));
    body.appendChild(fgRisk);

    // 开舱照片
    const fgHatch = makeFormGroup('开舱照片', false);
    const rowHatch = document.createElement('div');
    rowHatch.className = 'field-row';
    const hCount = document.createElement('div');
    hCount.className = 'form-group fixed';
    hCount.innerHTML = '<label class="form-label">张数</label>';
    hCount.appendChild(makeInput('section3.hatchPhotos.count', 'number', '如：4'));
    rowHatch.appendChild(hCount);
    const hTime = document.createElement('div');
    hTime.className = 'form-group';
    hTime.innerHTML = '<label class="form-label">拍摄时间</label>';
    hTime.appendChild(makeInput('section3.hatchPhotos.time', 'datetime-local', ''));
    rowHatch.appendChild(hTime);
    const hLoc = document.createElement('div');
    hLoc.className = 'form-group';
    hLoc.innerHTML = '<label class="form-label">拍摄地点</label>';
    hLoc.appendChild(makeInput('section3.hatchPhotos.location', 'text', '船舶各货舱舱口'));
    rowHatch.appendChild(hLoc);
    fgHatch.appendChild(rowHatch);
    fgHatch.appendChild(makeInput('section3.hatchPhotos.photographer', 'text', '拍摄人员'));
    fgHatch.appendChild(makeInput('section3.hatchPhotos.notes', 'textarea', '照片描述...'));
    fgHatch.appendChild(makeUploadZone('section3.hatchPhotos.files', true, 'image/*'));
    body.appendChild(fgHatch);

    // 取样照片
    const fgSample = makeFormGroup('取样照片', false);
    const rowSample = document.createElement('div');
    rowSample.className = 'field-row';
    const sCount = document.createElement('div');
    sCount.className = 'form-group fixed';
    sCount.innerHTML = '<label class="form-label">张数</label>';
    sCount.appendChild(makeInput('section3.samplingPhotos.count', 'number', '如：4'));
    rowSample.appendChild(sCount);
    const sTime = document.createElement('div');
    sTime.className = 'form-group';
    sTime.innerHTML = '<label class="form-label">拍摄时间</label>';
    sTime.appendChild(makeInput('section3.samplingPhotos.time', 'datetime-local', ''));
    rowSample.appendChild(sTime);
    const sSampler = document.createElement('div');
    sSampler.className = 'form-group';
    sSampler.innerHTML = '<label class="form-label">取样人员</label>';
    sSampler.appendChild(makeInput('section3.samplingPhotos.sampler', 'text', '取样人员姓名'));
    rowSample.appendChild(sSampler);
    fgSample.appendChild(rowSample);
    fgSample.appendChild(makeInput('section3.samplingPhotos.notes', 'textarea', '取样描述...'));
    fgSample.appendChild(makeUploadZone('section3.samplingPhotos.files', true, 'image/*'));
    body.appendChild(fgSample);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 4: 船舶从卸货到结束情况
  // ══════════════════════════════════════════════════════════
  function buildSection4(body) {
    // 码头作业线
    const fgLine = makeFormGroup('码头作业线', true);
    const rowLine = document.createElement('div');
    rowLine.className = 'field-row';
    const lcDiv = document.createElement('div');
    lcDiv.className = 'form-group fixed';
    lcDiv.innerHTML = '<label class="form-label">作业线条数</label>';
    lcDiv.appendChild(makeInput('section4.operatingLines.lineCount', 'number', '如：3'));
    rowLine.appendChild(lcDiv);
    const dcDiv = document.createElement('div');
    dcDiv.className = 'form-group fixed';
    dcDiv.innerHTML = '<label class="form-label">每条日装卸量（吨）</label>';
    dcDiv.appendChild(makeInput('section4.operatingLines.dailyCapacityPerLine', 'number', '如：5500'));
    rowLine.appendChild(dcDiv);
    fgLine.appendChild(rowLine);
    body.appendChild(fgLine);

    // 卸货天数
    const fgUnload = makeFormGroup('卸货天数', true);
    const rowUnload = document.createElement('div');
    rowUnload.className = 'field-row';
    const uStart = document.createElement('div');
    uStart.className = 'form-group';
    uStart.innerHTML = '<label class="form-label">卸货开始时间</label>';
    uStart.appendChild(makeInput('section4.unloading.startTime', 'datetime-local', ''));
    rowUnload.appendChild(uStart);
    const uEnd = document.createElement('div');
    uEnd.className = 'form-group';
    uEnd.innerHTML = '<label class="form-label">卸货结束时间</label>';
    uEnd.appendChild(makeInput('section4.unloading.endTime', 'datetime-local', ''));
    rowUnload.appendChild(uEnd);
    fgUnload.appendChild(rowUnload);
    const rowUnload2 = document.createElement('div');
    rowUnload2.className = 'field-row';
    const uHrs = document.createElement('div');
    uHrs.className = 'form-group fixed';
    uHrs.innerHTML = '<label class="form-label">共计小时</label>';
    uHrs.appendChild(makeInput('section4.unloading.totalHours', 'text', '如：30.75'));
    rowUnload2.appendChild(uHrs);
    const uDaily = document.createElement('div');
    uDaily.className = 'form-group fixed';
    uDaily.innerHTML = '<label class="form-label">日均卸货量（万吨）</label>';
    uDaily.appendChild(makeInput('section4.unloading.dailyAverage', 'text', '如：1.6'));
    rowUnload2.appendChild(uDaily);
    fgUnload.appendChild(rowUnload2);

    // 暂停情况
    const hasPause = FormState.getState('section4.unloading.hasPause');
    const pauseRadio = document.createElement('div');
    pauseRadio.className = 'radio-group';
    pauseRadio.innerHTML = '<span style="font-size:13px;font-weight:600;margin-right:8px;">是否有暂停：</span>';
    [
      { label: '无暂停', value: false },
      { label: '有暂停', value: true }
    ].forEach(opt => {
      const item = document.createElement('label');
      item.className = 'radio-item';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'section4.unloading.hasPause';
      radio.value = String(opt.value);
      if ((opt.value === false && !hasPause) || (opt.value === true && hasPause) || (opt.value === false && hasPause === undefined)) {
        radio.checked = true;
      }
      radio.addEventListener('change', () => {
        FormState.set('section4.unloading.hasPause', opt.value);
      });
      item.appendChild(radio);
      item.appendChild(document.createTextNode(opt.label));
      pauseRadio.appendChild(item);
    });
    fgUnload.appendChild(pauseRadio);

    const pauseCond = makeConditionalContainer('section4', 'section4.unloading.hasPause', true);
    pauseCond.appendChild(makeInput('section4.unloading.pauseReason', 'text', '暂停原因'));
    pauseCond.appendChild(makeInput('section4.unloading.pauseDuration', 'text', '暂停时长'));
    fgUnload.appendChild(pauseCond);

    pauseRadio.querySelectorAll('input').forEach(r => {
      r.addEventListener('change', () => {
        if (r.value === 'true') pauseCond.classList.add('visible');
        else pauseCond.classList.remove('visible');
      });
    });

    body.appendChild(fgUnload);

    // 船舱清仓
    const fgClean = makeFormGroup('船舱清仓情况', false);
    fgClean.appendChild(makeInput('section4.holdCleaningResult', 'textarea', '清仓结果描述...'));
    body.appendChild(fgClean);

    // 品质情况
    const fgQuality = makeFormGroup('品质情况', false);
    fgQuality.appendChild(makeInput('section4.qualityInspectionResult', 'textarea', '品质检验结果...'));
    body.appendChild(fgQuality);

    // 损耗情况
    const fgLoss = makeFormGroup('损耗情况', true);
    const rowLoss = document.createElement('div');
    rowLoss.className = 'field-row';
    const lQty = document.createElement('div');
    lQty.className = 'form-group';
    lQty.innerHTML = '<label class="form-label">实际损耗量（吨）</label>';
    lQty.appendChild(makeInput('section4.loss.quantity', 'number', '如：10.3'));
    rowLoss.appendChild(lQty);
    const lRate = document.createElement('div');
    lRate.className = 'form-group';
    lRate.innerHTML = '<label class="form-label">损耗率（%）</label>';
    lRate.appendChild(makeInput('section4.loss.rate', 'text', '如：0.05'));
    rowLoss.appendChild(lRate);
    const lStd = document.createElement('div');
    lStd.className = 'form-group';
    lStd.innerHTML = '<label class="form-label">合同约定损耗标准（≤%）</label>';
    lStd.appendChild(makeInput('section4.loss.contractStandard', 'text', '如：0.2'));
    rowLoss.appendChild(lStd);
    fgLoss.appendChild(rowLoss);
    fgLoss.appendChild(makeInput('section4.loss.reason', 'text', '损耗原因'));
    body.appendChild(fgLoss);

    // 保险
    const fgIns = makeFormGroup('是否保险', true);
    const claimed = FormState.getState('section4.insurance.claimed');
    const insRadio = document.createElement('div');
    insRadio.className = 'radio-group';
    [
      { label: '未出险', value: false },
      { label: '出险', value: true }
    ].forEach(opt => {
      const item = document.createElement('label');
      item.className = 'radio-item';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'section4.insurance.claimed';
      radio.value = String(opt.value);
      if ((opt.value === false && !claimed) || (opt.value === true && claimed) || (opt.value === false && claimed === undefined)) {
        radio.checked = true;
      }
      radio.addEventListener('change', () => {
        FormState.set('section4.insurance.claimed', opt.value);
      });
      item.appendChild(radio);
      item.appendChild(document.createTextNode(opt.label));
      insRadio.appendChild(item);
    });
    fgIns.appendChild(insRadio);

    const insCond = makeConditionalContainer('section4', 'section4.insurance.claimed', true);
    insCond.appendChild(makeInput('section4.insurance.timeRange', 'text', '出险时间（起止）'));
    insCond.appendChild(makeInput('section4.insurance.reason', 'textarea', '出险原因'));
    insCond.appendChild(makeInput('section4.insurance.acceptanceDetails', 'textarea', '保险受理情况'));
    fgIns.appendChild(insCond);

    insRadio.querySelectorAll('input').forEach(r => {
      r.addEventListener('change', () => {
        if (r.value === 'true') insCond.classList.add('visible');
        else insCond.classList.remove('visible');
      });
    });

    body.appendChild(fgIns);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 5: 提货情况
  // ══════════════════════════════════════════════════════════
  function buildSection5(body) {
    // 粮质巡查
    const fgPatrol = makeFormGroup('粮质巡查情况', true);
    const rowPatrol = document.createElement('div');
    rowPatrol.className = 'field-row';
    const pfDiv = document.createElement('div');
    pfDiv.className = 'form-group fixed';
    pfDiv.innerHTML = '<label class="form-label">巡查频次</label>';
    pfDiv.appendChild(makeInput('section5.qualityPatrol.frequency', 'text', '如：每周2次'));
    rowPatrol.appendChild(pfDiv);
    fgPatrol.appendChild(rowPatrol);
    fgPatrol.appendChild(makeInput('section5.qualityPatrol.content', 'textarea', '巡查内容...'));
    fgPatrol.appendChild(makeInput('section5.qualityPatrol.results', 'textarea', '巡查结果...'));
    body.appendChild(fgPatrol);

    // 提货情况
    const fgPickup = makeFormGroup('提货情况', true);
    const rowPickup1 = document.createElement('div');
    rowPickup1.className = 'field-row';
    const puStart = document.createElement('div');
    puStart.className = 'form-group';
    puStart.innerHTML = '<label class="form-label">提货开始时间</label>';
    puStart.appendChild(makeInput('section5.pickup.startTime', 'datetime-local', ''));
    rowPickup1.appendChild(puStart);
    const puEnd = document.createElement('div');
    puEnd.className = 'form-group';
    puEnd.innerHTML = '<label class="form-label">提货结束时间</label>';
    puEnd.appendChild(makeInput('section5.pickup.endTime', 'datetime-local', ''));
    rowPickup1.appendChild(puEnd);
    fgPickup.appendChild(rowPickup1);
    const rowPickup2 = document.createElement('div');
    rowPickup2.className = 'field-row';
    const puDays = document.createElement('div');
    puDays.className = 'form-group fixed';
    puDays.innerHTML = '<label class="form-label">共计天数</label>';
    puDays.appendChild(makeInput('section5.pickup.totalDays', 'number', '如：65'));
    rowPickup2.appendChild(puDays);
    const puQty = document.createElement('div');
    puQty.className = 'form-group';
    puQty.innerHTML = '<label class="form-label">累计提货量（吨）</label>';
    puQty.appendChild(makeInput('section5.pickup.cumulativeQuantity', 'number', '如：21444.22'));
    rowPickup2.appendChild(puQty);
    fgPickup.appendChild(rowPickup2);
    const rowPickup3 = document.createElement('div');
    rowPickup3.className = 'field-row';
    const olq = document.createElement('div');
    olq.className = 'form-group fixed';
    olq.innerHTML = '<label class="form-label">出库损耗量（吨）</label>';
    olq.appendChild(makeInput('section5.pickup.outboundLossQuantity', 'number', '如：7.94'));
    rowPickup3.appendChild(olq);
    const olr = document.createElement('div');
    olr.className = 'form-group fixed';
    olr.innerHTML = '<label class="form-label">出库损耗率（%）</label>';
    olr.appendChild(makeInput('section5.pickup.outboundLossRate', 'text', '如：0.04'));
    rowPickup3.appendChild(olr);
    fgPickup.appendChild(rowPickup3);
    fgPickup.appendChild(makeInput('section5.pickup.outboundLossReason', 'text', '损耗原因'));
    body.appendChild(fgPickup);

    // 执行商扣
    const fgDeduct = makeFormGroup('执行商扣情况', false);
    const hasDed = FormState.getState('section5.vendorDeductions.hasDeductions');
    const dedRadio = document.createElement('div');
    dedRadio.className = 'radio-group';
    [
      { label: '无商扣', value: false },
      { label: '有商扣', value: true }
    ].forEach(opt => {
      const item = document.createElement('label');
      item.className = 'radio-item';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'section5.vendorDeductions.hasDeductions';
      radio.value = String(opt.value);
      if ((opt.value === false && !hasDed) || (opt.value === true && hasDed) || (opt.value === false && hasDed === undefined)) {
        radio.checked = true;
      }
      radio.addEventListener('change', () => {
        FormState.set('section5.vendorDeductions.hasDeductions', opt.value);
      });
      item.appendChild(radio);
      item.appendChild(document.createTextNode(opt.label));
      dedRadio.appendChild(item);
    });
    fgDeduct.appendChild(dedRadio);

    const dedCond = makeConditionalContainer('section5', 'section5.vendorDeductions.hasDeductions', true);
    dedCond.appendChild(makeInput('section5.vendorDeductions.batch', 'text', '商扣批次'));
    dedCond.appendChild(makeInput('section5.vendorDeductions.reason', 'text', '商扣原因'));
    const dedRow = document.createElement('div');
    dedRow.className = 'field-row';
    const dedQty = document.createElement('div');
    dedQty.className = 'form-group fixed';
    dedQty.innerHTML = '<label class="form-label">商扣数量（吨）</label>';
    dedQty.appendChild(makeInput('section5.vendorDeductions.quantity', 'number', ''));
    dedRow.appendChild(dedQty);
    const dedAmt = document.createElement('div');
    dedAmt.className = 'form-group fixed';
    dedAmt.innerHTML = '<label class="form-label">商扣金额（元）</label>';
    dedAmt.appendChild(makeInput('section5.vendorDeductions.amount', 'number', ''));
    dedRow.appendChild(dedAmt);
    dedCond.appendChild(dedRow);
    fgDeduct.appendChild(dedCond);

    dedRadio.querySelectorAll('input').forEach(r => {
      r.addEventListener('change', () => {
        if (r.value === 'true') dedCond.classList.add('visible');
        else dedCond.classList.remove('visible');
      });
    });

    body.appendChild(fgDeduct);

    // 执行台账
    const fgLedger = makeFormGroup('附整船执行台账', false);
    fgLedger.appendChild(makeUploadZone('section5.executionLedgerFile', false, 'image/*,.pdf,.xlsx,.xls'));
    body.appendChild(fgLedger);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 6: 成本分析
  // ══════════════════════════════════════════════════════════
  function buildSection6(body) {
    // 北方采购价
    const fgNorth = makeFormGroup('北方采购成本', true);
    fgNorth.appendChild(makeInput('section6.northernPurchasePrice', 'text', '如：2412 元/吨（平仓价格+海运费）'));
    body.appendChild(fgNorth);

    // 南方港口费用
    const fgSouth = makeFormGroup('南方港口费用', true);
    const rowSF = document.createElement('div');
    rowSF.className = 'field-row';
    const pofDiv = document.createElement('div');
    pofDiv.className = 'form-group';
    pofDiv.innerHTML = '<label class="form-label">港口作业费（元/吨或合计元）</label>';
    pofDiv.appendChild(makeInput('section6.southernPortFees.portOperationFee', 'text', '如：38元/吨'));
    rowSF.appendChild(pofDiv);
    const sfDiv = document.createElement('div');
    sfDiv.className = 'form-group';
    sfDiv.innerHTML = '<label class="form-label">堆存费（元）</label>';
    sfDiv.appendChild(makeInput('section6.southernPortFees.storageFee', 'text', '如：31642.03'));
    rowSF.appendChild(sfDiv);
    fgSouth.appendChild(rowSF);
    fgSouth.appendChild(makeInput('section6.southernPortFees.otherFees', 'text', '其他杂费'));
    const rowSF2 = document.createElement('div');
    rowSF2.className = 'field-row';
    const ucDiv = document.createElement('div');
    ucDiv.className = 'form-group';
    ucDiv.innerHTML = '<label class="form-label">折合单吨成本（元/吨）</label>';
    ucDiv.appendChild(makeInput('section6.southernPortFees.unitCost', 'text', ''));
    rowSF2.appendChild(ucDiv);
    const epfDiv = document.createElement('div');
    epfDiv.className = 'form-group';
    epfDiv.innerHTML = '<label class="form-label">销售时预估港口费用（元/吨）</label>';
    epfDiv.appendChild(makeInput('section6.southernPortFees.estimatedPortFee', 'text', ''));
    rowSF2.appendChild(epfDiv);
    fgSouth.appendChild(rowSF2);
    const rowSF3 = document.createElement('div');
    rowSF3.className = 'field-row';
    const devDiv = document.createElement('div');
    devDiv.className = 'form-group';
    devDiv.innerHTML = '<label class="form-label">费用偏差（元）</label>';
    devDiv.appendChild(makeInput('section6.southernPortFees.deviation', 'text', ''));
    rowSF3.appendChild(devDiv);
    const udDiv = document.createElement('div');
    udDiv.className = 'form-group';
    udDiv.innerHTML = '<label class="form-label">单吨偏差（元/吨）</label>';
    udDiv.appendChild(makeInput('section6.southernPortFees.unitDeviation', 'text', ''));
    rowSF3.appendChild(udDiv);
    fgSouth.appendChild(rowSF3);
    body.appendChild(fgSouth);

    // 海运费
    const fgSea = makeFormGroup('海运费', true);
    fgSea.appendChild(makeInput('section6.shippingCostPerTon', 'text', '如：83.6 元/吨'));
    body.appendChild(fgSea);

    // 利润分析
    const fgProfit = makeFormGroup('利润分析', false);
    fgProfit.appendChild(makeInput('section6.profitAnalysis', 'textarea', '综合采购成本、销售单价、单吨盈亏等分析...'));
    body.appendChild(fgProfit);
  }

  // ══════════════════════════════════════════════════════════
  // SECTION 7: 整船总结
  // ══════════════════════════════════════════════════════════
  function buildSection7(body) {
    const fg1 = makeFormGroup('作业概况', true);
    fg1.appendChild(makeInput('section7.operationsOverview', 'textarea', '货物总数量、实际卸货、提货、损耗等概述...'));
    body.appendChild(fg1);

    const fg2 = makeFormGroup('品质管控', false);
    fg2.appendChild(makeInput('section7.qualityControl', 'textarea', '货物品质稳定性、检验巡查记录等...'));
    body.appendChild(fg2);

    const fg3 = makeFormGroup('安全及流程', false);
    fg3.appendChild(makeInput('section7.safetyProcess', 'textarea', '安全风险排查、无安全事故、流程规范等...'));
    body.appendChild(fg3);

    const fg4 = makeFormGroup('不足及改进', false);
    fg4.appendChild(makeInput('section7.improvements', 'textarea', '本次作业存在的不足及后续改进措施...'));
    body.appendChild(fg4);

    // Footer signatures
    const fgSign = makeFormGroup('签署确认', false);
    const rowSign = document.createElement('div');
    rowSign.className = 'field-row';
    const ssDiv = document.createElement('div');
    ssDiv.className = 'form-group';
    ssDiv.innerHTML = '<label class="form-label">销售支持确认</label>';
    ssDiv.appendChild(makeInput('footer.salesSupportConfirm', 'text', ''));
    rowSign.appendChild(ssDiv);
    const logDiv = document.createElement('div');
    logDiv.className = 'form-group';
    logDiv.innerHTML = '<label class="form-label">物流现场确认</label>';
    logDiv.appendChild(makeInput('footer.logisticsConfirm', 'text', ''));
    rowSign.appendChild(logDiv);
    const saleDiv = document.createElement('div');
    saleDiv.className = 'form-group';
    saleDiv.innerHTML = '<label class="form-label">销售人员确认</label>';
    saleDiv.appendChild(makeInput('footer.salesConfirm', 'text', ''));
    rowSign.appendChild(saleDiv);
    fgSign.appendChild(rowSign);
    body.appendChild(fgSign);
  }

  // ── Image lightbox ──
  function showImageLightbox(dataURL, name) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';

    const box = document.createElement('div');
    box.className = 'lightbox-box';

    const img = document.createElement('img');
    img.src = dataURL;
    img.className = 'lightbox-img';

    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    caption.textContent = name || '';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => overlay.remove());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    box.appendChild(closeBtn);
    box.appendChild(img);
    box.appendChild(caption);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ── Public API ──────────────────────────────────────────
  return {
    renderAll,
    renderSection,
    SECTION_IDS,
    SECTION_LABELS
  };
})();
