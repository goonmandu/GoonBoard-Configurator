export const VID                            = 0x2B00;
export const PID                            = 0xB1E5;
export const FETCH_CONFIG_REPORT_ID         = 0xC0;
export const NUM_ROWS                       = 6;
export const NUM_COLS                       = 16;
export const KEYMAP_SIZE                    = NUM_ROWS * NUM_COLS;
export const ACTUATION_SIZE                 = KEYMAP_SIZE;
export const ROTARY_SIZE                    = 3;
export const THRESHOLD_SIZE                 = 3;
export const SNAPTAP_SIZE                   = 6;
export const FULL_CONFIG_SIZE               = KEYMAP_SIZE + ACTUATION_SIZE + ROTARY_SIZE + THRESHOLD_SIZE + SNAPTAP_SIZE;

let device = null;

// ---- pacing: serialize calls, enforce 10 ms between them ----
const MIN_API_GAP_MS = 10;
let _queue = Promise.resolve();

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function pace(run) {
  const task = async () => {
    const result = await run();
    await sleep(MIN_API_GAP_MS);       // gap before next queued call
    return result;
  };
  _queue = _queue.then(task, task);    // keep queue alive even if a task rejects
  return _queue;
}
// ----------------------------------------------------------------

export class KeyboardConfig {
  constructor(keymap, actuations, rotary, thresholds, snaptap) {
    this.keymap     = keymap;
    this.actuations = actuations;
    this.rotary     = rotary;
    this.thresholds = thresholds;
    this.snaptap    = snaptap;
  }

  static async connectDevice() {
    const devices = await navigator.hid.requestDevice({
    filters: [{ vendorId: VID, productId: PID }]
    });
    for (const d of devices) {
    const c = d.collections?.[0];
    if (c && c.usagePage === 0xFF60 && c.usage === 0x61) {
        device = d;
        return;
    }
    }
    throw new Error('RawHID interface not found (2B00:B1E5, usagePage 0xFF60, usage 0x61)');
  }

  static async fetchFromDevice() {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      const dv = await device.receiveFeatureReport(FETCH_CONFIG_REPORT_ID);
      await device.close();

      const data = new Uint8Array(dv.buffer);
      if (data.length < FULL_CONFIG_SIZE) {
        throw new Error(`Expected ${FULL_CONFIG_SIZE} bytes, got ${data.length}`);
      }

      const keymap     = data.slice(1, KEYMAP_SIZE + 1);
      const actuations = data.slice(KEYMAP_SIZE + 1, KEYMAP_SIZE + ACTUATION_SIZE + 1);
      const rotary     = data.slice(KEYMAP_SIZE + ACTUATION_SIZE + 1, KEYMAP_SIZE + ACTUATION_SIZE + ROTARY_SIZE + 1);
      const thresholds = data.slice(
        KEYMAP_SIZE + ACTUATION_SIZE + ROTARY_SIZE + 1,
        KEYMAP_SIZE + ACTUATION_SIZE + ROTARY_SIZE + THRESHOLD_SIZE + 1
      );
      const snaptap    = data.slice(-SNAPTAP_SIZE);

      const ret = new KeyboardConfig(keymap, actuations, rotary, thresholds, snaptap);
      return ret;
    });
  }

  static async editKeymap(row, col, code) {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      await device.sendFeatureReport(
        0xFE,
        new Uint8Array([0xA0, row & 0xff, col & 0xff, code & 0xff])
      );
      await device.close();
    });
  }

  static async editActuation(row, col, mm) {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      await device.sendFeatureReport(
        0xFE,
        new Uint8Array([0xA1, row & 0xff, col & 0xff, mm & 0xff])
      );
      await device.close();
    });
  }

  static async editRotary(ctclkw, clkw, pb) {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      await device.sendFeatureReport(
        0xFE,
        new Uint8Array([0xA2, ctclkw & 0xff, clkw & 0xff, pb & 0xff])
      );
      await device.close();
    });
  }

  static async editRapidTrigger(en, th, sc) {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      await device.sendFeatureReport(
        0xFE,
        new Uint8Array([0xD0, en & 0xff, th & 0xff, sc & 0xff])
      );
      await device.close();
    });
  }

  static async editSnapTapA(en, k1, k2) {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      await device.sendFeatureReport(
        0xFE,
        new Uint8Array([0xB0, en & 0xff, k1 & 0xff, k2 & 0xff])
      );
      await device.close();
    });
  }

  static async editSnapTapB(en, k1, k2) {
    return pace(async () => {
      if (!device) await KeyboardConfig.connectDevice();
      await device.open();
      await device.sendFeatureReport(
        0xFE,
        new Uint8Array([0xB1, en & 0xff, k1 & 0xff, k2 & 0xff])
      );
      await device.close();
    });
  }
}
