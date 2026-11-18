/**
 * Verified dual-layer persistence primitives (sync localStorage + retried/read-back
 * verified Anna APS KV) ensuring zero silent data or credit loss.
 */

export function getBrowserLocalStorage() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch (err) {
    console.warn('localStorage unavailable:', err);
  }
  return null;
}

export function writeLocalSync(key, value) {
  const ls = getBrowserLocalStorage();
  if (!ls) return false;
  try {
    ls.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`localStorage write failed for "${key}":`, err);
    return false;
  }
}

export function readLocalSync(key) {
  const ls = getBrowserLocalStorage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`localStorage read failed for "${key}":`, err);
    return null;
  }
}

export function removeLocalSync(key) {
  const ls = getBrowserLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(key);
  } catch {}
}

export async function readApsKv(anna, key) {
  if (!anna?.storage?.get) return null;
  const res = await anna.storage.get({ key });
  return res && typeof res === 'object' && 'value' in res ? res.value : res;
}

export async function writeApsKvVerified(anna, key, value, verifyFn = null, maxAttempts = 3) {
  if (!anna?.storage?.set) {
    return { cloudOk: false, verified: false, reason: 'offline' };
  }
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await anna.storage.set({ key, value });
      if (typeof verifyFn === 'function' && typeof anna.storage.get === 'function') {
        const readBack = await readApsKv(anna, key);
        if (!verifyFn(readBack, value)) {
          throw new Error(`Read-back verification mismatch for "${key}"`);
        }
      }
      return { cloudOk: true, verified: true, attempts: attempt };
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts && typeof setTimeout === 'function') {
        await new Promise((r) => setTimeout(r, attempt * 60));
      }
    }
  }
  return { cloudOk: false, verified: false, error: lastErr?.message || 'APS KV write failed' };
}

export function pickNewerSnapshot(cloudVal, localVal) {
  if (!cloudVal && !localVal) return { picked: null, source: null, needsCloudHeal: false };
  if (cloudVal && !localVal) return { picked: cloudVal, source: 'cloud', needsCloudHeal: false };
  if (!cloudVal && localVal) return { picked: localVal, source: 'local', needsCloudHeal: true };
  const ct = Number(cloudVal._savedAt || cloudVal.updatedAt || 0);
  const lt = Number(localVal._savedAt || localVal.updatedAt || 0);
  const cs = Number(cloudVal._saveSeq || 0);
  const ls = Number(localVal._saveSeq || 0);
  if (lt > ct || (lt === ct && ls > cs)) {
    return { picked: localVal, source: 'local', needsCloudHeal: true };
  }
  return { picked: cloudVal, source: 'cloud', needsCloudHeal: false };
}
