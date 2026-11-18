import {
  writeLocalSync,
  readLocalSync,
  removeLocalSync,
  readApsKv,
  writeApsKvVerified,
  pickNewerSnapshot,
} from './storage-kv.js';

const DEFAULT_STORAGE_KEY = 'precinct-84-anna:saves:v1';
const VAULT_STORAGE_KEY = 'precinct-84-anna:blueprint-vault:v1';

export function sanitizeSlotName(slotName) {
  const cleaned = String(slotName || 'quicksave').replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || 'quicksave';
}

export function tierStorageKey(tier) {
  const t = Math.max(1, Math.min(3, Number(tier) || 1));
  return `precinct-84-anna:tier:${t}`;
}

function validateSnapshot(parsed, slotName) {
  if (!parsed || typeof parsed !== 'object' || typeof parsed.scene !== 'string' || typeof parsed.flags !== 'object') {
    throw new Error(`Save slot "${slotName}" is corrupted.`);
  }
  return JSON.parse(JSON.stringify({ ...parsed, undoStack: [] }));
}

export class PrecinctSaveStore {
  constructor(annaRuntime = null, storageKey = DEFAULT_STORAGE_KEY) {
    this.anna = annaRuntime;
    this.storageKey = storageKey;
    this.slots = Object.create(null);
    this.tierSaves = Object.create(null);
    this.blueprintVault = Object.create(null);
    this.pendingWrite = Promise.resolve();
    this.lastError = null;
    this.saveSeq = 0;
    this.status = { mode: annaRuntime?.storage ? 'ready' : 'local', verified: false, lastSavedAt: 0, error: null };
    this.statusListeners = new Set();
  }

  setRuntime(annaRuntime) {
    this.anna = annaRuntime;
    this.emitStatus({ mode: annaRuntime?.storage ? 'ready' : 'local' });
  }

  onStatusChange(cb) {
    this.statusListeners.add(cb);
    cb({ ...this.status });
    return () => this.statusListeners.delete(cb);
  }

  emitStatus(patch) {
    this.status = { ...this.status, ...patch };
    for (const cb of this.statusListeners) cb({ ...this.status });
  }

  nextStamp() {
    this.saveSeq += 1;
    return { _savedAt: Date.now(), _saveSeq: this.saveSeq };
  }

  async load() {
    let cloudPayload = null;
    if (this.anna?.storage) {
      try { cloudPayload = await readApsKv(this.anna, this.storageKey); } catch (err) { this.lastError = err; }
    }
    const localPayload = readLocalSync(this.storageKey);
    const { picked, needsCloudHeal } = pickNewerSnapshot(cloudPayload, localPayload);

    if (picked && typeof picked === 'object' && picked.slots && typeof picked.slots === 'object') {
      const nextSlots = Object.create(null);
      for (const [key, val] of Object.entries(picked.slots)) {
        const safe = sanitizeSlotName(key);
        try { nextSlots[safe] = validateSnapshot(val, safe); } catch {}
      }
      this.slots = nextSlots;
      if (needsCloudHeal && this.anna?.storage) {
        this.pendingWrite = this.pendingWrite.then(() =>
          writeApsKvVerified(this.anna, this.storageKey, picked, (rb, exp) => rb?.updatedAt === exp.updatedAt)
        );
      }
    }
    return { ...this.slots };
  }

  saveSlot(slotName, snapshot) {
    const safeSlot = sanitizeSlotName(slotName);
    const cleanSnapshot = validateSnapshot({ ...snapshot, ...this.nextStamp() }, safeSlot);
    this.slots[safeSlot] = cleanSnapshot;

    const stamp = this.nextStamp();
    const payload = { slots: { ...this.slots }, updatedAt: stamp._savedAt, _savedAt: stamp._savedAt, _saveSeq: stamp._saveSeq };
    const localOk = writeLocalSync(this.storageKey, payload);
    this.emitStatus({ mode: this.anna?.storage ? 'saving' : localOk ? 'local' : 'error', verified: false, error: null });

    if (this.anna?.storage) {
      this.pendingWrite = this.pendingWrite.then(async () => {
        const res = await writeApsKvVerified(this.anna, this.storageKey, payload, (rb, exp) => rb?._saveSeq === exp._saveSeq);
        this.emitStatus({
          mode: res.cloudOk ? 'cloud+local' : localOk ? 'local_only' : 'error',
          verified: res.verified,
          lastSavedAt: stamp._savedAt,
          error: res.error || null,
        });
      });
    } else if (localOk) {
      this.emitStatus({ mode: 'local', verified: true, lastSavedAt: stamp._savedAt });
    }
    return `aps://precinct-84-anna/saves/${safeSlot}`;
  }

  loadSlot(slotName = 'quicksave') {
    const safeSlot = sanitizeSlotName(slotName);
    if (!Object.prototype.hasOwnProperty.call(this.slots, safeSlot)) {
      const local = readLocalSync(this.storageKey);
      if (local?.slots && Object.prototype.hasOwnProperty.call(local.slots, safeSlot)) {
        this.slots[safeSlot] = validateSnapshot(local.slots[safeSlot], safeSlot);
      }
    }
    if (!Object.prototype.hasOwnProperty.call(this.slots, safeSlot)) {
      throw new Error(`No saved game found in slot "${safeSlot}".`);
    }
    return validateSnapshot(this.slots[safeSlot], safeSlot);
  }

  listSlots() {
    return Object.keys(this.slots).sort();
  }

  async loadTiers() {
    // Load shadow blueprint vault first so compiled stories can always be recovered
    const cloudVault = this.anna?.storage ? await readApsKv(this.anna, VAULT_STORAGE_KEY).catch(() => null) : null;
    const localVault = readLocalSync(VAULT_STORAGE_KEY);
    const vaultPick = pickNewerSnapshot(cloudVault, localVault);
    if (vaultPick.picked?.tiers) this.blueprintVault = vaultPick.picked.tiers;

    for (const t of [1, 2, 3]) {
      const k = tierStorageKey(t);
      let cloud = null;
      if (this.anna?.storage) {
        try {
          const val = await readApsKv(this.anna, k);
          if (val?.scene) cloud = validateSnapshot(val, k);
        } catch (err) { this.lastError = err; }
      }
      let local = null;
      try {
        const raw = readLocalSync(k);
        if (raw?.scene) local = validateSnapshot(raw, k);
      } catch {}

      const { picked, needsCloudHeal } = pickNewerSnapshot(cloud, local);
      if (picked) {
        this.tierSaves[t] = picked;
        if (needsCloudHeal && this.anna?.storage) {
          this.pendingWrite = this.pendingWrite.then(() =>
            writeApsKvVerified(this.anna, k, picked, (rb, exp) => rb?._saveSeq === exp._saveSeq)
          );
        }
      }
    }
    return { ...this.tierSaves };
  }

  backupCompiledStory(tier, state) {
    if (!state?.tier2Script && !state?.aiCampaign?.active) return;
    const stamp = this.nextStamp();
    this.blueprintVault[tier] = {
      tier2Script: state.tier2Script ? JSON.parse(JSON.stringify(state.tier2Script)) : null,
      aiCampaign: state.aiCampaign ? JSON.parse(JSON.stringify(state.aiCampaign)) : null,
      aiModel: state.aiModel || 'preset:default',
      savedAt: stamp._savedAt,
    };
    const vaultPayload = { tiers: { ...this.blueprintVault }, _savedAt: stamp._savedAt, _saveSeq: stamp._saveSeq };
    writeLocalSync(VAULT_STORAGE_KEY, vaultPayload);
    if (this.anna?.storage) {
      this.pendingWrite = this.pendingWrite.then(() =>
        writeApsKvVerified(this.anna, VAULT_STORAGE_KEY, vaultPayload, (rb, exp) => rb?._saveSeq === exp._saveSeq)
      );
    }
  }

  getVaultStory(tier) {
    return this.blueprintVault[tier] || null;
  }

  saveTierActive(tier, snapshot) {
    const t = Math.max(1, Math.min(3, Number(tier) || 1));
    const k = tierStorageKey(t);
    const stamp = this.nextStamp();
    const clean = validateSnapshot({ ...snapshot, aiTier: t, ...stamp }, k);
    this.tierSaves[t] = clean;
    this.backupCompiledStory(t, clean);

    const localOk = writeLocalSync(k, clean);
    this.emitStatus({ mode: this.anna?.storage ? 'saving' : localOk ? 'local' : 'error', error: null });
    if (this.anna?.storage) {
      const writeOp = writeApsKvVerified(this.anna, k, clean, (rb, exp) => rb?._saveSeq === exp._saveSeq && rb?.scene === exp.scene)
        .then((res) => {
          if (!res.cloudOk && res.error) this.lastError = new Error(res.error);
          this.emitStatus({
            mode: res.cloudOk ? 'cloud+local' : localOk ? 'local_only' : 'error',
            verified: res.verified,
            lastSavedAt: stamp._savedAt,
            error: res.error || null,
          });
          return res;
        });
      this.pendingWrite = this.pendingWrite.then(() => writeOp);
      return writeOp;
    }
    this.emitStatus({ mode: localOk ? 'local' : 'error', verified: localOk, lastSavedAt: stamp._savedAt });
    return Promise.resolve({ cloudOk: false, localOk, verified: localOk });
  }

  async saveTierActiveVerified(tier, snapshot) {
    const res = await this.saveTierActive(tier, snapshot);
    await this.flush();
    return res;
  }

  getTierActive(tier) {
    const t = Math.max(1, Math.min(3, Number(tier) || 1));
    return this.tierSaves[t] ? validateSnapshot(this.tierSaves[t], `tier:${t}`) : null;
  }

  async clearTierActive(tier, clearVault = false) {
    const t = Math.max(1, Math.min(3, Number(tier) || 1));
    const k = tierStorageKey(t);
    delete this.tierSaves[t];
    removeLocalSync(k);
    if (this.anna?.storage?.delete) {
      try { await this.anna.storage.delete({ key: k }); } catch {}
    }
    if (clearVault) {
      delete this.blueprintVault[t];
      const stamp = this.nextStamp();
      const vp = { tiers: { ...this.blueprintVault }, _savedAt: stamp._savedAt, _saveSeq: stamp._saveSeq };
      writeLocalSync(VAULT_STORAGE_KEY, vp);
      if (this.anna?.storage) await writeApsKvVerified(this.anna, VAULT_STORAGE_KEY, vp);
    }
  }

  listTierSummaries() {
    const out = {};
    for (const t of [1, 2, 3]) {
      const s = this.tierSaves[t];
      const v = this.blueprintVault[t];
      const hasVault = Boolean(v && (v.tier2Script || v.aiCampaign?.active));
      if (s) {
        out[t] = { hasProgress: true, score: s.score || 0, scene: s.scene, hasCustomStory: Boolean(s.tier2Script || s.aiCampaign?.active), hasVault };
      } else if (hasVault) {
        out[t] = { hasProgress: false, score: 0, scene: null, hasCustomStory: true, hasVault: true };
      }
    }
    return out;
  }

  async flush() {
    await this.pendingWrite;
  }

  async clear() {
    this.slots = Object.create(null);
    removeLocalSync(this.storageKey);
    if (this.anna?.storage?.delete) {
      try { await this.anna.storage.delete({ key: this.storageKey }); } catch (err) { this.lastError = err; }
    }
  }
}
