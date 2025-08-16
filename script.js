import { KeyboardConfig } from './goonboard-api.js';

let firstLoad = true;

/* <=6-char labels */
const keycodes = {"0":"-","1":"rollov","2":"postfl","3":"undef","4":"a","5":"b","6":"c","7":"d","8":"e","9":"f","10":"g","11":"h","12":"i","13":"j","14":"k","15":"l","16":"m","17":"n","18":"o","19":"p","20":"q","21":"r","22":"s","23":"t","24":"u","25":"v","26":"w","27":"x","28":"y","29":"z","30":"1","31":"2","32":"3","33":"4","34":"5","35":"6","36":"7","37":"8","38":"9","39":"0","40":"enter","41":"esc","42":"bkspc","43":"tab","44":"space","45":"minus","46":"equal","47":"lbrack","48":"rbrack","49":"bkslsh","50":"nuhash","51":"semi","52":"quote","53":"bktick","54":"comma","55":"dot","56":"slash","57":"capslk","58":"f1","59":"f2","60":"f3","61":"f4","62":"f5","63":"f6","64":"f7","65":"f8","66":"f9","67":"f10","68":"f11","69":"f12","70":"prtscr","71":"scrlck","72":"pause","73":"ins","74":"home","75":"pgup","76":"del","77":"end","78":"pgdn","79":"right","80":"left","81":"down","82":"up","83":"numlck","84":"kpslsh","85":"kpastr","86":"kpmin","87":"kppls","88":"kpent","89":"kp1","90":"kp2","91":"kp3","92":"kp4","93":"kp5","94":"kp6","95":"kp7","96":"kp8","97":"kp9","98":"kp0","99":"kpdot","100":"nubsls","101":"app","102":"power","103":"kpeq","104":"f13","105":"f14","106":"f15","107":"f16","108":"f17","109":"f18","110":"f19","111":"f20","112":"f21","113":"f22","114":"f23","115":"f24","116":"exec","117":"help","118":"menu","119":"select","120":"stop","121":"again","122":"undo","123":"cut","124":"copy","125":"paste","126":"find","127":"mute","128":"volup","129":"voldn","130":"capslk","131":"numlck","132":"scrlck","133":"kpcma","134":"kpeqa4","135":"intl1","136":"intl2","137":"intl3","138":"intl4","139":"intl5","140":"intl6","141":"intl7","142":"intl8","143":"intl9","144":"lang1","145":"lang2","146":"lang3","147":"lang4","148":"lang5","149":"lang6","150":"lang7","151":"lang8","152":"lang9","153":"alters","154":"sysrq","155":"cancel","156":"clear","157":"prior","158":"return","159":"seprtr","160":"out","161":"oper","162":"clragn","163":"crsel","164":"exsel","165":"INVAL","166":"INVAL","167":"INVAL","168":"INVAL","169":"INVAL","170":"INVAL","171":"INVAL","172":"INVAL","173":"INVAL","174":"INVAL","175":"INVAL","176":"kp00","177":"kp000","178":"thsep","179":"dcsep","180":"cunit","181":"csub","182":"kplpar","183":"kprpar","184":"kplbrc","185":"kprbrc","186":"kptab","187":"kpbksp","188":"kpa","189":"kpb","190":"kpc","191":"kpd","192":"kpe","193":"kpf","194":"kpxor","195":"kpcart","196":"kpprct","197":"kplstn","198":"kpgrtn","199":"kpampr","200":"kpand","201":"kppipe","202":"kpor","203":"kpclon","204":"kphash","205":"kpspc","206":"kpat","207":"kpexcl","208":"kpmst","209":"kpmrc","210":"kpmcl","211":"kpmad","212":"kpmsb","213":"kpmml","214":"kpmdv","215":"kpplmn","216":"kpclr","217":"kpclen","218":"kpbin","219":"kpoct","220":"kpdec","221":"kphex","222":"INVAL","223":"INVAL","224":"lctrl","225":"lshift","226":"lalt","227":"lgui","228":"rctrl","229":"rshift","230":"ralt","231":"rgui","232":"play","233":"stop","234":"prev","235":"next","236":"eject","237":"volup","238":"voldn","239":"mute","240":"www","241":"back","242":"fwd","243":"cancel","244":"search","245":"INVAL","246":"INVAL","247":"INVAL","248":"sleep","249":"lock","250":"reload","251":"calc","252":"INVAL","253":"INVAL","254":"INVAL","255":"INVAL"};

/* Helper functions */
const nameToCode = (() => {
  const m = Object.create(null);
  for (const [code, name] of Object.entries(keycodes)) {
    const lname = String(name).toLowerCase();
    m[lname] = (lname === 'inval') ? 0 : parseInt(code, 10);
  }
  m['-'] = 0; // placeholder maps to 0
  return m;
})();

function keyNameFromCode(code) {
  if (!Number.isFinite(code)) return '?';
  const n = (code & 0xff).toString();
  return keycodes[n] ?? '?';
}

function getScale() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--scale').trim();
  const v = parseFloat(raw);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function setPreviewLock(lock) {
  document.body.classList.toggle('preview-locked', !!lock);
  const dis = !!lock;
  rtEnTop.disabled  = dis;
  stAEnTop.disabled = dis;
  stBEnTop.disabled = dis;
  document.getElementById('rt-th-input').disabled = dis;
  document.getElementById('rt-sc-input').disabled = dis;
  rtSaveBtn.disabled   = dis;
  stSaveABtn.disabled  = dis;
  stSaveBBtn.disabled  = dis;
}

/* Current (device) state, flattened 96 */
const MAX_KEYS_PER_ROW = 16;
let keymap     = Array(96).fill(NaN);
let actuations = Array(96).fill(NaN);
let rotary     = Array(3).fill(NaN);
let thresholds = Array(3).fill(NaN);
let snaptap    = Array(6).fill(NaN);

/* Grid */
const NUM_KEYS_PER_ROW = [14, 15, 15, 14, 14, 10];
const KEY_WIDTHS  = NUM_KEYS_PER_ROW.map(n => Array(n).fill(0));
const KEY_MARGINS = NUM_KEYS_PER_ROW.map(n => Array(n).fill(null));

KEY_MARGINS[0][0] = 41;  KEY_MARGINS[0][4] = 41;  KEY_MARGINS[0][8] = 41;  KEY_MARGINS[0][12] = 41;
KEY_WIDTHS[1][13] = 200; KEY_WIDTHS[2][0]  = 150; KEY_WIDTHS[2][13] = 150;
KEY_WIDTHS[3][0]  = 180; KEY_WIDTHS[3][12] = 236;
KEY_WIDTHS[4][0]  = 250; KEY_WIDTHS[4][11] = 166;
KEY_WIDTHS[5][0]  = 133.32; KEY_WIDTHS[5][1] = 133.34; KEY_WIDTHS[5][2] = 133.34; KEY_WIDTHS[5][3] = 680;

const btnFetch  = document.getElementById('fetch');
const btnLoad   = document.getElementById('loadJson');
const btnUpload = document.getElementById('uploadJson');
const fileInput = document.getElementById('fileInput');
const keyboard  = document.getElementById('keyboard');
const btnClear  = document.getElementById('clearPreview');
const btnExport = document.getElementById('exportJson');

const rtEnTop  = document.getElementById('rt-en-top');
const stAEnTop = document.getElementById('st-a-en-top');
const stBEnTop = document.getElementById('st-b-en-top');

const rtThInput = document.getElementById('rt-th-input');
const rtScInput = document.getElementById('rt-sc-input');
const rtSaveBtn = document.getElementById('rt-save');

const stSaveABtn = document.getElementById('st-save-a');
const stSaveBBtn = document.getElementById('st-save-b');

btnLoad.disabled = true;
btnExport.disabled = true;

const LABEL_RT  = 'Rapid Trigger';
const LABEL_STA = 'SnapTap A';
const LABEL_STB = 'SnapTap B';

const rtEnTopLbl  = document.getElementById('rt-en-top').parentElement.querySelector('span');
const stAEnTopLbl = document.getElementById('st-a-en-top').parentElement.querySelector('span');
const stBEnTopLbl = document.getElementById('st-b-en-top').parentElement.querySelector('span');

let rtEnableUI = true; // local UI state for RT enable (device payload lacks an enable bit)

function resetToQuestionMarks() {
  firstLoad = true;
  parsedForUpload = null;

  // reset device-driven state
  keymap     = Array(MAX_KEYS_PER_ROW * NUM_KEYS_PER_ROW.length).fill(NaN);
  actuations = Array(MAX_KEYS_PER_ROW * NUM_KEYS_PER_ROW.length).fill(NaN);
  rotary     = Array(3).fill(NaN);
  thresholds = Array(3).fill(NaN);   // [enabled?, rt_th, rt_sc] if you use 3 bytes
  snaptap    = Array(6).fill(NaN);

  // UI: unlock + disable actions that need a device/preview
  setPreviewLock(false);
  applyTopTogglePreview(false);
  if (btnLoad)    btnLoad.disabled    = true;
  if (btnUpload)  btnUpload.disabled  = true;
  if (btnClear)   btnClear.disabled   = true;
  if (rtSaveBtn)  rtSaveBtn.disabled  = true;
  if (stSaveABtn) stSaveABtn.disabled = true;
  if (stSaveBBtn) stSaveBBtn.disabled = true;
  if (rtThInput)  rtThInput.disabled  = true;
  if (rtScInput)  rtScInput.disabled  = true;
  if (rtEnTop)    rtEnTop.disabled    = true;
  if (stAEnTop)   stAEnTop.disabled   = true;
  if (stBEnTop)   stBEnTop.disabled   = true;

  renderGrid();
  renderAdvanced();
}

if (navigator.hid && typeof navigator.hid.addEventListener === 'function') {
  navigator.hid.addEventListener('disconnect', () => {
    resetToQuestionMarks();
    KeyboardConfig.invalidateDevice();
  });
}

function applyTopTogglePreview(on) {
  rtEnTopLbl.textContent  = on ? `(${LABEL_RT})`  : LABEL_RT;
  stAEnTopLbl.textContent = on ? `(${LABEL_STA})` : LABEL_STA;
  stBEnTopLbl.textContent = on ? `(${LABEL_STB})` : LABEL_STB;
}

/* Parsed JSON to preview & upload (kept separate from current state) */
let parsedForUpload = null; // { rows, keys, codes2D, acts2D, thresholds, snaptapA, snaptapB }

function renderGrid() {
  const scale = getScale();
  keyboard.innerHTML = '';

  NUM_KEYS_PER_ROW.forEach((count, rowIdx) => {
    const row = document.createElement('div');
    row.className = 'row';

    for (let colIdx = 0; colIdx < count; colIdx++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'key-wrapper';

      const cell = document.createElement('div');
      cell.className = 'key';
      cell.onclick = () => createEditPopup(rowIdx, colIdx, wrapper);

      const idx = rowIdx * MAX_KEYS_PER_ROW + colIdx;

      // CURRENT values
      const codeCur = keymap[idx];
      const nameCur = !Number.isNaN(codeCur) ? (keycodes[String(codeCur)] ?? String(codeCur)) : '?';
      const actCur  = !Number.isNaN(actuations[idx]) ? (actuations[idx] / 10).toFixed(1) + ' mm' : '? mm';

      // PREVIEW values (from loaded JSON), if present and in range
      let nameNew = null, actNew = null;
      if (parsedForUpload && rowIdx < parsedForUpload.rows && colIdx < parsedForUpload.keys[rowIdx]) {
        const codeNew = parsedForUpload.codes2D[rowIdx][colIdx];
        nameNew = keycodes[String(codeNew)] ?? String(codeNew);
        const actVal = parsedForUpload.acts2D[rowIdx][colIdx];
        actNew = `${actVal.toFixed(1)} mm`;
      }

      // Fit preview into cell
      // ...after computing nameNew/actNew and before setting innerHTML...
      if (nameNew || actNew) {
        cell.classList.add('has-preview');
      } else {
        cell.classList.remove('has-preview');
      }

      // Build content: preview key on top, current below. Actuation current then preview.
      const keyTop = nameNew ? `<span class="keymap-preview">(${nameNew})</span><br>` : '';
      const keyBottom = `<span class="key-label">${nameCur}</span><br>`;
      const actLines  =
        `<span class="actuation-label">${actCur}</span>` +
        (actNew ? `<br><span class="actuation-preview">(${actNew})</span>` : '');

      cell.innerHTML = keyTop + keyBottom + actLines;

      const w = KEY_WIDTHS[rowIdx][colIdx];
      if (w > 0) cell.style.width = `${w * scale}px`;

      const m = KEY_MARGINS[rowIdx][colIdx];
      if (m !== null) cell.style.marginRight = `${m * scale}px`;

      // SnapTap highlighting
      const aEnabled = !!(snaptap[0] | 0);
      const aK1 = snaptap[1] | 0, aK2 = snaptap[2] | 0;
      const bEnabled = !!(snaptap[3] | 0);
      const bK1 = snaptap[4] | 0, bK2 = snaptap[5] | 0;

      const isA = aEnabled && (idx === aK1 || idx === aK2);
      const isB = bEnabled && (idx === bK1 || idx === bK2);

      cell.classList.remove('st-a', 'st-b', 'st-ab');
      if (isA && isB) {
        cell.classList.add('st-ab');
      } else if (isA) {
        cell.classList.add('st-a');
      } else if (isB) {
        cell.classList.add('st-b');
      }

      const labels = [];
      const a1 = snaptap[1], a2 = snaptap[2], b1 = snaptap[4], b2 = snaptap[5];
      if (Number.isFinite(a1) && idx === (a1 | 0)) labels.push('A1');
      if (Number.isFinite(a2) && idx === (a2 | 0)) labels.push('A2');
      if (Number.isFinite(b1) && idx === (b1 | 0)) labels.push('B1');
      if (Number.isFinite(b2) && idx === (b2 | 0)) labels.push('B2');

      if (labels.length) {
        const badgeWrap = document.createElement('div');
        badgeWrap.className = 'st-badges';
        badgeWrap.innerHTML = labels.map(t => `<span class="st-badge">${t}</span>`).join('');
        cell.appendChild(badgeWrap);
      }

      wrapper.appendChild(cell);
      row.appendChild(wrapper);
    }

    if (rowIdx === 0) {
      const circle = document.createElement('div');
      circle.className = 'circle';
      circle.title = 'Rotary Encoder';

      // show preview if present, otherwise current device values
      const usePreview = !!(parsedForUpload && Array.isArray(parsedForUpload.rotaryCodes));
      const src = usePreview ? parsedForUpload.rotaryCodes : rotary; // [ccw, cw, pb]

      const top = document.createElement('div');
      if (usePreview) {
        top.className = 'rotary-label rotary-top-preview';
        top.textContent = `(${keyNameFromCode(src[1])})`; // CW on top
      }
      else {
        top.className = 'rotary-label rotary-top';
        top.textContent = keyNameFromCode(src[1]); // CW on top
      }

      const mid = document.createElement('div');
      if (usePreview) {
        mid.className = 'rotary-label rotary-mid-preview';
        mid.textContent = `(${keyNameFromCode(src[2])})`; // PB middle
      }
      else {
        mid.className = 'rotary-label rotary-mid';
        mid.textContent = keyNameFromCode(src[2]); // PB middle
      }
      

      const bot = document.createElement('div');
      if (usePreview) {
        bot.className = 'rotary-label rotary-bot-preview';
        bot.textContent = `(${keyNameFromCode(src[0])})`; // CCW bottom
      }
      else {
        bot.className = 'rotary-label rotary-bot';
        bot.textContent = keyNameFromCode(src[0]); // CCW bottom
      }

      circle.appendChild(top);
      circle.appendChild(mid);
      circle.appendChild(bot);

      circle.style.cursor = 'pointer';
      circle.onclick = () => createRotaryPopup(circle);

      row.appendChild(circle);
    }

    keyboard.appendChild(row);
  });
}

/* First render */
resetToQuestionMarks();

function createEditPopup(rowIdx, colIdx, anchorEl) {
  if (firstLoad) return;
  removeEditPopup();

  const popup = document.createElement('div');
  popup.className = 'edit-popup';

  // Row 1: Edit Keymap
  const rowActions = document.createElement('div');
  rowActions.className = 'popup-row';
  const keymapBtn = document.createElement('button');
  keymapBtn.textContent = 'Keymap';
  keymapBtn.onclick = () => showKeymapEditor(rowIdx, colIdx, popup);
  rowActions.appendChild(keymapBtn);

  // Row 2: Edit Actuation (single row, beneath keymap)
  const rowAct = document.createElement('div');
  rowAct.className = 'popup-row';
  const actuationBtn = document.createElement('button');
  actuationBtn.textContent = 'Actuation';
  actuationBtn.onclick = () => showActuationEditor(rowIdx, colIdx, popup);
  rowAct.appendChild(actuationBtn);

  // Rows 3–4: SnapTap assignment buttons (A1/A2 on one row, B1/B2 on next)
  const rowA = document.createElement('div');
  rowA.className = 'popup-row pair';

  const rowB = document.createElement('div');
  rowB.className = 'popup-row pair';

  const a1Btn = document.createElement('button'); a1Btn.textContent = 'A1';
  const a2Btn = document.createElement('button'); a2Btn.textContent = 'A2';
  const b1Btn = document.createElement('button'); b1Btn.textContent = 'B1';
  const b2Btn = document.createElement('button'); b2Btn.textContent = 'B2';

  const idx = rowIdx * MAX_KEYS_PER_ROW + colIdx;

  a1Btn.onclick = async () => {
    removeEditPopup();
    const en = !!(snaptap[0] | 0) ? 1 : 0;
    const k2 = snaptap[2] | 0;
    await KeyboardConfig.editSnapTapA(en, idx, k2);
    const cfg = await KeyboardConfig.fetchFromDevice();
    snaptap = Array.from(cfg.snaptap); renderGrid(); renderAdvanced();
  };

  a2Btn.onclick = async () => {
    removeEditPopup();
    const en = !!(snaptap[0] | 0) ? 1 : 0;
    const k1 = snaptap[1] | 0;
    await KeyboardConfig.editSnapTapA(en, k1, idx);
    const cfg = await KeyboardConfig.fetchFromDevice();
    snaptap = Array.from(cfg.snaptap); renderGrid(); renderAdvanced();
  };

  b1Btn.onclick = async () => {
    removeEditPopup();
    const en = !!(snaptap[3] | 0) ? 1 : 0;
    const k2 = snaptap[5] | 0;
    await KeyboardConfig.editSnapTapB(en, idx, k2);
    const cfg = await KeyboardConfig.fetchFromDevice();
    snaptap = Array.from(cfg.snaptap); renderGrid(); renderAdvanced();
  };

  b2Btn.onclick = async () => {
    removeEditPopup();
    const en = !!(snaptap[3] | 0) ? 1 : 0;
    const k1 = snaptap[4] | 0;
    await KeyboardConfig.editSnapTapB(en, k1, idx);
    const cfg = await KeyboardConfig.fetchFromDevice();
    snaptap = Array.from(cfg.snaptap); renderGrid(); renderAdvanced();
  };

  rowA.appendChild(a1Btn);
  rowA.appendChild(a2Btn);
  rowB.appendChild(b1Btn);
  rowB.appendChild(b2Btn);

  popup.appendChild(rowActions);
  popup.appendChild(rowAct);
  popup.appendChild(rowA);
  popup.appendChild(rowB);
  document.body.appendChild(popup);

  // position
  const rect = anchorEl.getBoundingClientRect();
  const pr = popup.getBoundingClientRect();
  const centerX = rect.left + window.scrollX + rect.width / 2;
  const centerY = rect.top + window.scrollY + rect.height / 2;
  const customMargin = KEY_MARGINS[rowIdx][colIdx] ?? 16;
  popup.style.left = `${centerX - ((pr.width + customMargin) - (4 * getScale())) / 2}px`;
  popup.style.top  = `${centerY - pr.height / 2}px`;

  // click-outside-to-close
  setTimeout(() => {
    const outside = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('mousedown', outside);
      }
    };
    document.addEventListener('mousedown', outside);
  }, 0);
}

function removeEditPopup() {
  document.querySelectorAll('.edit-popup').forEach(p => p.remove());
}

function showKeymapEditor(rowIdx, colIdx, container) {
  container.innerHTML = '';

  const select = document.createElement('select');
  for (const [code, label] of Object.entries(keycodes)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code}: ${label}`;
    select.appendChild(option);
  }

  const idx = rowIdx * MAX_KEYS_PER_ROW + colIdx;
  const current = keymap[idx];
  if (!Number.isNaN(current)) select.value = String(current);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = async () => {
    const code = parseInt(select.value, 10) & 0xff;
    try {
      await KeyboardConfig.editKeymap(rowIdx, colIdx, code);
      const cfg = await KeyboardConfig.fetchFromDevice();
      keymap     = Array.from(cfg.keymap);
      actuations = Array.from(cfg.actuations);
      thresholds = Array.from(cfg.thresholds);
      snaptap    = Array.from(cfg.snaptap);
      removeEditPopup();
      renderGrid();
    } catch (e) {
      console.error('editKeymap failed:', e);
    }
  };

  container.appendChild(select);
  container.appendChild(saveBtn);
}

function showActuationEditor(rowIdx, colIdx, container) {
  container.innerHTML = '';

  const input = document.createElement('input');
  input.type = 'number';
  input.step = '0.1';
  input.min = '0.1';
  input.max = '3.4';
  input.placeholder = 'mm';
  const idx = rowIdx * MAX_KEYS_PER_ROW + colIdx;
  if (!Number.isNaN(actuations[idx])) input.value = (actuations[idx] / 10).toFixed(1);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.onclick = async () => {
    const val = parseFloat(input.value);
    if (!(val > 0 && val < 3.5)) return;
    const mm = Math.round(val * 10);
    try {
      await KeyboardConfig.editActuation(rowIdx, colIdx, mm);
      const cfg = await KeyboardConfig.fetchFromDevice();
      keymap     = Array.from(cfg.keymap);
      actuations = Array.from(cfg.actuations);
      thresholds = Array.from(cfg.thresholds);
      snaptap    = Array.from(cfg.snaptap);
      removeEditPopup();
      renderGrid();
      renderAdvanced();
    } catch (e) {
      console.error('editActuation failed:', e);
    }
  };

  container.appendChild(input);
  container.appendChild(saveBtn);
}

function createRotaryPopup(anchorEl) {
  removeEditPopup();
  const popup = document.createElement('div');
  popup.className = 'edit-popup';

  const r1 = document.createElement('div'); r1.className = 'popup-row';
  const cwBtn = document.createElement('button');
  cwBtn.textContent = 'Edit CW';
  cwBtn.onclick = () => showRotaryEditor('cw', popup);
  r1.appendChild(cwBtn);

  const r2 = document.createElement('div'); r2.className = 'popup-row';
  const pbBtn = document.createElement('button');
  pbBtn.textContent = 'Edit Button';
  pbBtn.onclick = () => showRotaryEditor('pb', popup);
  r2.appendChild(pbBtn);

  const r3 = document.createElement('div'); r3.className = 'popup-row';
  const ccwBtn = document.createElement('button');
  ccwBtn.textContent = 'Edit CCW';
  ccwBtn.onclick = () => showRotaryEditor('ccw', popup);
  r3.appendChild(ccwBtn);

  popup.appendChild(r1);
  popup.appendChild(r2);
  popup.appendChild(r3);
  document.body.appendChild(popup);

  const rect = anchorEl.getBoundingClientRect();
  const pr = popup.getBoundingClientRect();
  const centerX = rect.left + window.scrollX + rect.width / 2;
  const centerY = rect.top + window.scrollY + rect.height / 2;
  popup.style.left = `${centerX - pr.width / 2}px`;
  popup.style.top  = `${centerY - pr.height / 2}px`;

  setTimeout(() => {
    const outside = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('mousedown', outside);
      }
    };
    document.addEventListener('mousedown', outside);
  }, 0);
}

function showRotaryEditor(which, container) {
  container.innerHTML = '';
  const select = document.createElement('select');

  for (const [code, label] of Object.entries(keycodes)) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${code}: ${label}`;
    select.appendChild(opt);
  }

  // preselect current
  const current = which === 'ccw' ? rotary[0] : which === 'cw' ? rotary[1] : rotary[2];
  if (Number.isFinite(current)) select.value = String(current & 0xff);

  const save = document.createElement('button');
  save.textContent = 'Save';
  save.onclick = async () => {
    const code = parseInt(select.value, 10) & 0xff;
    const ccw = which === 'ccw' ? code : (rotary[0] | 0);
    const cw  = which === 'cw'  ? code : (rotary[1] | 0);
    const pb  = which === 'pb'  ? code : (rotary[2] | 0);

    try {
      await KeyboardConfig.editRotary(ccw, cw, pb);
      const cfg = await KeyboardConfig.fetchFromDevice();
      rotary     = Array.from(cfg.rotary);
      keymap     = Array.from(cfg.keymap);
      actuations = Array.from(cfg.actuations);
      thresholds = Array.from(cfg.thresholds);
      snaptap    = Array.from(cfg.snaptap);
      removeEditPopup();
      renderGrid();
      renderAdvanced();
    } catch (e) {
      console.error('editRotary failed:', e);
    }
  };

  container.appendChild(select);
  container.appendChild(save);
}


btnFetch.addEventListener('click', async () => {
  try {
    await KeyboardConfig.connectDevice();
    btnLoad.disabled = false;
    btnExport.disabled = false;

    const cfg = await KeyboardConfig.fetchFromDevice();
    console.log(cfg)
    keymap     = Array.from(cfg.keymap);
    actuations = Array.from(cfg.actuations);
    rotary     = Array.from(cfg.rotary);
    thresholds = Array.from(cfg.thresholds);
    snaptap    = Array.from(cfg.snaptap);

    firstLoad = false;
    applyTopTogglePreview(false); // ensure labels are not parenthesized
    renderGrid();
    renderAdvanced();
    setPreviewLock(false);
  } catch (err) {
    console.error('Error fetching config:', err);
  }
});

rtSaveBtn.addEventListener('click', async () => {
  const en = rtEnTop.checked ? 1 : 0;
  const th = parseFloat(document.getElementById('rt-th-input').value);
  const sc = parseFloat(document.getElementById('rt-sc-input').value);
  if (!(th > 0 && th < 3.5) || !(sc > 0 && sc < 3.5)) return;

  try {
    await KeyboardConfig.editRapidTrigger(en, Math.round(th * 10), Math.round(sc * 10));
    const cfg = await KeyboardConfig.fetchFromDevice();
    thresholds = Array.from(cfg.thresholds);
    rtEnableUI = !!en;
    renderAdvanced();
    renderGrid();
    alert('Rapid Trigger saved'); // notification
  } catch (e) {
    console.error('editRapidTrigger failed:', e);
    alert('Rapid Trigger save failed: see browser console.'); // notification
  }
});


function renderAdvanced() {
  rtEnableUI = !!thresholds[0]
  const thCur = Number.isNaN(thresholds[1]) ? 0 : (thresholds[1] / 10);
  const scCur = Number.isNaN(thresholds[2]) ? 0 : (thresholds[2] / 10);

  if (parsedForUpload && parsedForUpload.thresholds) {
    rtEnTop.checked = !!parsedForUpload.thresholds.enabled;
    document.getElementById('rt-th-input').value = parsedForUpload.thresholds.rt_threshold.toFixed(1);
    document.getElementById('rt-sc-input').value = parsedForUpload.thresholds.rt_sc_threshold.toFixed(1);

    // SnapTap preview overrides top toggles
    stAEnTop.checked = !!parsedForUpload.snaptapA.enabled;
    stBEnTop.checked = !!parsedForUpload.snaptapB.enabled;
  } else {
    rtEnTop.checked = !!rtEnableUI;
    document.getElementById('rt-th-input').value = thCur.toFixed(1);
    document.getElementById('rt-sc-input').value = scCur.toFixed(1);

    // SnapTap from device
    stAEnTop.checked = !!(snaptap[0] | 0);
    stBEnTop.checked = !!(snaptap[3] | 0);
  }

  // keep existing #st summary if you still show it
  const stAEl = document.getElementById('st-a');
  const stBEl = document.getElementById('st-b');
  if (stAEl && stBEl) {
    const aOn = !!(snaptap[0] | 0), aK1 = snaptap[1] | 0, aK2 = snaptap[2] | 0;
    const bOn = !!(snaptap[3] | 0), bK1 = snaptap[4] | 0, bK2 = snaptap[5] | 0;
    stAEl.textContent = `${aOn ? 'on' : 'off'} ${aK1}, ${aK2}`;
    stBEl.textContent = `${bOn ? 'on' : 'off'} ${bK1}, ${bK2}`;
  }
}


/* JSON import + validation + preview (does NOT overwrite current until upload) */
btnLoad.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', onPickFile);

async function onPickFile(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  try {
    const text = await f.text();
    const cfg  = JSON.parse(text);
    parsedForUpload = validateExternalConfig(cfg);

    // show parentheses on top labels and override top toggles to preview values
    applyTopTogglePreview(true);
    rtEnTop.checked  = !!parsedForUpload.thresholds.enabled;
    stAEnTop.checked = !!parsedForUpload.snaptapA.enabled;
    stBEnTop.checked = !!parsedForUpload.snaptapB.enabled;

    firstLoad = false;
    renderGrid();
    renderAdvanced();
    setPreviewLock(true);
    btnUpload.disabled = false;
    btnClear.disabled  = false;
  } catch (err) {
    parsedForUpload = null;
    btnUpload.disabled = true;
    alert(`Invalid config: ${err.message || err}`);
  } finally {
    fileInput.value = '';
  }
}

/* Upload */
btnUpload.addEventListener('click', async () => {
  if (!parsedForUpload) return;
  if (!confirm('Upload configuration to the keyboard?')) return;

  setPreviewLock(true);
  btnUpload.disabled = true;

  const prevLabel = btnUpload.textContent;
  btnUpload.textContent = 'Uploading...';
  btnUpload.disabled = true;
  btnLoad.disabled = true;
  btnFetch.disabled = true;

  try {
    const { rows, keys, codes2D, acts2D, rotaryCodes, thresholds: rt, snaptapA, snaptapB } = parsedForUpload;

    // keymap + actuation
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < keys[r]; c++) {
        await KeyboardConfig.editKeymap(r, c, (codes2D[r][c] & 0xff));
        await KeyboardConfig.editActuation(r, c, Math.round(acts2D[r][c] * 10));
      }
    }

    // rotary encoder
    await KeyboardConfig.editRotary(rotaryCodes[0] & 0xff, rotaryCodes[1] & 0xff, rotaryCodes[2] & 0xff);

    // rapid trigger
    await KeyboardConfig.editRapidTrigger(
      rt.enabled ? 1 : 0,
      Math.round(rt.rt_threshold * 10),
      Math.round(rt.rt_sc_threshold * 10)
    );

    // snaptap A/B
    await KeyboardConfig.editSnapTapA(snaptapA.enabled ? 1 : 0, snaptapA.key1 | 0, snaptapA.key2 | 0);
    await KeyboardConfig.editSnapTapB(snaptapB.enabled ? 1 : 0, snaptapB.key1 | 0, snaptapB.key2 | 0);

    // refresh
    const cfg = await KeyboardConfig.fetchFromDevice();
    keymap     = Array.from(cfg.keymap);
    actuations = Array.from(cfg.actuations);
    thresholds = Array.from(cfg.thresholds);
    snaptap    = Array.from(cfg.snaptap);
    renderGrid();
    rtEnableUI = !!parsedForUpload.thresholds.enabled;
    applyTopTogglePreview(false);
    renderAdvanced();
    btnUpload.textContent = 'Uploaded!';
  } catch (err) {
    console.error('Upload failed:', err);
    btnUpload.textContent = 'Error!';
  } finally {
    btnLoad.disabled = false;
    btnFetch.disabled = false;
    setTimeout(() => {
      btnUpload.textContent = prevLabel;
      btnUpload.disabled = !parsedForUpload;
    }, 1200);
  }
});

btnClear.addEventListener('click', () => {
  parsedForUpload = null;
  applyTopTogglePreview(false);  // remove parentheses on labels
  renderGrid();
  renderAdvanced();              // restore top toggles from device/UI state
  setPreviewLock(false);
  btnUpload.disabled = true;
  btnClear.disabled = true;
});

stAEnTop.addEventListener('change', async (e) => {
  const en = e.target.checked ? 1 : 0;
  const k1 = snaptap[1] | 0, k2 = snaptap[2] | 0;
  await KeyboardConfig.editSnapTapA(en, k1, k2);
  const cfg = await KeyboardConfig.fetchFromDevice();
  snaptap = Array.from(cfg.snaptap);
  renderGrid(); renderAdvanced();
});

stBEnTop.addEventListener('change', async (e) => {
  const en = e.target.checked ? 1 : 0;
  const k1 = snaptap[4] | 0, k2 = snaptap[5] | 0;
  await KeyboardConfig.editSnapTapB(en, k1, k2);
  const cfg = await KeyboardConfig.fetchFromDevice();
  snaptap = Array.from(cfg.snaptap);
  renderGrid(); renderAdvanced();
});

stSaveABtn.addEventListener('click', async () => {
  try {
    const en = stAEnTop.checked ? 1 : 0;
    const k1 = snaptap[1] | 0;
    const k2 = snaptap[2] | 0;
    await KeyboardConfig.editSnapTapA(en, k1, k2);
    const cfg = await KeyboardConfig.fetchFromDevice();
    snaptap = Array.from(cfg.snaptap);
    renderGrid();
    renderAdvanced();
    alert('SnapTap A saved'); // notification
  } catch (e) {
    console.error('Save SnapTap A failed:', e);
    alert("SnapTap A save failed: see browser console.");
  }
});

stSaveBBtn.addEventListener('click', async () => {
  try {
    const en = stBEnTop.checked ? 1 : 0;
    const k1 = snaptap[4] | 0;
    const k2 = snaptap[5] | 0;
    await KeyboardConfig.editSnapTapB(en, k1, k2);
    const cfg = await KeyboardConfig.fetchFromDevice();
    snaptap = Array.from(cfg.snaptap);
    renderGrid();
    renderAdvanced();
    alert('SnapTap B saved'); // notification
  } catch (e) {
    console.error('Save SnapTap B failed:', e);
    alert("SnapTap B save failed: see browser console.");
  }
});

/* JSON Validation */
function validateExternalConfig(cfg) {
  if (!cfg || (cfg.scheme !== 'keynames' && cfg.scheme !== 'keycodes')) {
    throw new Error('scheme must be "keynames" or "keycodes"');
  }
  const rows = cfg.rows | 0;
  if (!(rows >= 1 && rows <= 6)) throw new Error('rows must be 1..6');

  if (!Array.isArray(cfg.keys) || cfg.keys.length !== rows) {
    throw new Error('"keys" must be an array of length = rows');
  }
  const keys = cfg.keys.map((n) => {
    const v = n | 0;
    if (!(v > 0 && v <= 16)) throw new Error('each keys[] must be 1..16');
    return v;
  });

  // keymap + actuations
  const codes2D = [];
  const acts2D  = [];
  for (let r = 0; r < rows; r++) {
    const km = cfg.keymap?.[`row${r}`];
    const ac = cfg.actuations?.[`row${r}`];
    if (!Array.isArray(km) || !Array.isArray(ac)) {
      throw new Error(`row${r} missing in keymap/actuations`);
    }
    if (km.length !== ac.length || km.length > keys[r]) {
      throw new Error(`row${r} lengths mismatch or exceed keys[r]`);
    }

    // map keynames → codes or validate codes
    if (cfg.scheme === 'keynames') {
      const rowCodes = km.map((s) => {
        if (typeof s !== 'string') throw new Error(`row${r} key not string`);
        const code = nameToCode[s.toLowerCase()];
        if (!Number.isInteger(code)) throw new Error(`unknown keyname "${s}" in row${r}`);
        return code;
      });
      codes2D.push(rowCodes);
    } else {
      const rowCodes = km.map((n) => {
        const v = n | 0;
        if (!(v >= 0 && v <= 255)) throw new Error(`row${r} keycode out of range`);
        return v;
      });
      codes2D.push(rowCodes);
    }

    const rowActs = ac.map((v) => {
      const x = Number(v);
      if (!(x > 0 && x < 3.5)) throw new Error(`row${r} actuation must be 0 < v < 3.5`);
      return +x.toFixed(1);
    });
    acts2D.push(rowActs);
  }

  // rotary
  if (!Array.isArray(cfg.rotary) || cfg.rotary.length !== 3) {
    throw new Error('rotary must be an array of 3 items [ccw, cw, pb]');
  }
  const rotaryCodes = (cfg.scheme === 'keynames')
    ? cfg.rotary.map((s, i) => {
        if (typeof s !== 'string') throw new Error('rotary entries must be strings for keynames');
        const code = nameToCode[s.toLowerCase()];
        if (!Number.isInteger(code)) throw new Error(`unknown rotary keyname "${s}" at index ${i}`);
        return code;
      })
    : cfg.rotary.map((n) => {
        const v = n | 0;
        if (!(v >= 0 && v <= 255)) throw new Error('rotary codes must be 0..255');
        return v;
      });

  // rapid trigger
  const rt = cfg.rapid_trigger ?? {};
  const enabled = !!rt.enabled;
  const rt_threshold    = Number(rt.rt_threshold);
  const rt_sc_threshold = Number(rt.rt_sc_threshold);
  if (!(rt_threshold > 0 && rt_threshold < 3.5))    throw new Error('rt_threshold must be 0 < v < 3.5');
  if (!(rt_sc_threshold > 0 && rt_sc_threshold < 3.5)) throw new Error('rt_sc_threshold must be 0 < v < 3.5');

  // snaptap modules
  const stA = cfg.snaptap_a ?? {};
  const stB = cfg.snaptap_b ?? {};
  const snapA = {
    enabled: !!stA.enabled,
    key1: stA.key1 | 0,
    key2: stA.key2 | 0,
  };
  const snapB = {
    enabled: !!stB.enabled,
    key1: stB.key1 | 0,
    key2: stB.key2 | 0,
  };
  if (!(snapA.key1 >= 0 && snapA.key1 < 96 && snapA.key2 >= 0 && snapA.key2 < 96)) {
    throw new Error('snaptap_a key indices must be 0..95');
  }
  if (!(snapB.key1 >= 0 && snapB.key1 < 96 && snapB.key2 >= 0 && snapB.key2 < 96)) {
    throw new Error('snaptap_b key indices must be 0..95');
  }

  return {
    scheme: cfg.scheme,
    rows,
    keys,
    codes2D,
    acts2D,
    rotaryCodes,
    thresholds: { enabled, rt_threshold, rt_sc_threshold },
    snaptapA: snapA,
    snaptapB: snapB,
  };
}

document.getElementById('exportJson').addEventListener('click', () => {
  const rows = NUM_KEYS_PER_ROW.length;
  const keys = NUM_KEYS_PER_ROW.map((n, i) => (i === 0 ? n - 1 : n)); // exclude knob from row 0

  const keymapOut = {};
  const actsOut   = {};

  for (let r = 0; r < rows; r++) {
    const count = keys[r];
    const rowNames = [];
    const rowActs  = [];
    for (let c = 0; c < count; c++) {
      const idx  = r * MAX_KEYS_PER_ROW + c;
      const code = Number.isNaN(keymap[idx]) ? 0 : (keymap[idx] & 0xff);
      const name = keycodes[String(code)] ?? "-";
      const act  = Number.isNaN(actuations[idx]) ? 1.5 : (actuations[idx] / 10);
      rowNames.push(name);
      rowActs.push(+act.toFixed(1));
    }
    keymapOut[`row${r}`] = rowNames;
    actsOut[`row${r}`]   = rowActs;
  }

  const rt_en  = Number.isNaN(thresholds[0]) ? 0   : thresholds[0];
  const rt_th  = Number.isNaN(thresholds[1]) ? 0.3 : thresholds[1] / 10;
  const rt_sct = Number.isNaN(thresholds[2]) ? 0.3 : thresholds[2] / 10;

  const stA = { enabled: !!(snaptap[0] | 0), key1: (snaptap[1] | 0), key2: (snaptap[2] | 0) };
  const stB = { enabled: !!(snaptap[3] | 0), key1: (snaptap[4] | 0), key2: (snaptap[5] | 0) };

  // rotary as keynames [ccw, cw, pb]
  const rotaryOut = [
    keycodes[String((rotary[0] | 0) & 0xff)] ?? "-",
    keycodes[String((rotary[1] | 0) & 0xff)] ?? "-",
    keycodes[String((rotary[2] | 0) & 0xff)] ?? "-"
  ];

  const out = {
    scheme: "keynames",
    rows,
    keys,
    keymap: keymapOut,
    actuations: actsOut,
    rotary: rotaryOut,
    rapid_trigger: {
      enabled: rt_en ? 1 : 0,
      rt_threshold: +rt_th.toFixed(1),
      rt_sc_threshold: +rt_sct.toFixed(1)
    },
    snaptap_a: stA,
    snaptap_b: stB
  };

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'goonboard-config-keynames.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
