/**
 * Anna SDK LLM client, model catalog integration, live streaming progress hooks,
 * and verbose testing diagnostics (`DEMO_VERBOSE_ERRORS`).
 */

export const DEMO_VERBOSE_ERRORS = true;

export const MODEL_PRESETS = [
  { id: 'preset:default', shortLabel: 'AUTO DEFAULT', label: 'Auto (Anna Default)', tag: 'Preset' },
  { id: 'preset:fast', shortLabel: 'FAST / LOW CU', label: 'Preset: Fast & Low Cost', tag: 'Fast' },
  { id: 'preset:story', shortLabel: 'SMART STORY', label: 'Preset: High-IQ Detective Story', tag: 'Smart' },
];

export function formatDetailedError(err, meta = {}) {
  const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err));
  const summary = e.message || 'Unknown Anna AI / runtime error';
  const headline = meta.stage ? `${meta.stage} Failed` : 'Anna AI Error';
  const payload = {
    name: e.name,
    message: summary,
    code: e.code ?? err?.code ?? null,
    status: e.status ?? err?.status ?? null,
    demoFlag: DEMO_VERBOSE_ERRORS,
    context: {
      stage: meta.stage || e.llmContext?.stage || null,
      model: meta.selectedModel || e.llmContext?.selectedModel || null,
      elapsedMs: meta.elapsedMs ?? e.llmContext?.elapsedMs ?? null,
      charsReceived: meta.charsReceived ?? e.llmContext?.charsReceived ?? null,
      rawOutput: meta.rawOutput ?? e.llmContext?.rawOutput ?? null,
      extra: meta.extra || e.llmContext?.extra || null,
    },
    rawEvent: e.rawEvent ?? null,
    cause: e.cause ? String(e.cause) : null,
    stack: e.stack || null,
  };
  const details = DEMO_VERBOSE_ERRORS ? JSON.stringify(payload, null, 2) : summary;
  return {
    headline,
    summary,
    details,
    demoVerbose: DEMO_VERBOSE_ERRORS,
    timestamp: new Date().toISOString(),
  };
}

export function formatCuBadge(pricing) {
  if (!pricing) return '';
  if (typeof pricing.estimatedCreditsPerCall === 'number') {
    return ` (~${pricing.estimatedCreditsPerCall.toFixed(1)} CU)`;
  }
  if (typeof pricing.creditsPer1MInputTokens === 'number') {
    return ` (~${Math.round(pricing.creditsPer1MInputTokens)} CU/1M)`;
  }
  return '';
}

export async function loadModelCatalog(anna, onError = null) {
  const list = [...MODEL_PRESETS];
  if (!anna?.llm?.catalog) return list;
  try {
    const cat = await anna.llm.catalog();
    const raw = Array.isArray(cat?.models) ? cat.models : [];
    for (const m of raw) {
      const st = Array.isArray(m?.serviceTypes) ? m.serviceTypes : [];
      const id = String(m?.modelName || '');
      const low = id.toLowerCase();
      const caps = m?.capabilities || {};
      if (!id || !st.includes('text')) continue;
      if (low.includes('-image') && caps.supportsFunctionCalling === false) continue;
      const disp = m.displayName || id;
      const tags = [];
      if (m.isUserPreferred) tags.push('Preferred');
      else if (m.isPlatformDefault) tags.push('Default');
      const shortRaw = disp.length > 22 ? `${disp.slice(0, 20)}..` : disp;
      list.push({
        id: `model:${id}`,
        shortLabel: shortRaw.toUpperCase(),
        label: `${disp}${tags.length ? ` [${tags.join('/')}]` : ''}${formatCuBadge(m.pricing)}`,
        tag: tags[0] || 'Text',
        modelName: id,
      });
    }
  } catch (err) {
    console.warn('Failed to fetch rt.llm.catalog():', err);
    if (typeof onError === 'function') {
      onError(formatDetailedError(err, { stage: 'Model Catalog Fetch' }));
    }
  }
  return list;
}

export function getModelShortLabel(catalog, selectedModel) {
  const hit = (catalog || MODEL_PRESETS).find((m) => m.id === selectedModel);
  if (hit) return hit.shortLabel;
  if (String(selectedModel || '').startsWith('model:')) {
    const raw = selectedModel.slice(6);
    return raw.length > 22 ? raw.slice(0, 22).toUpperCase() : raw.toUpperCase();
  }
  return 'AUTO DEFAULT';
}

export function buildModelRequestOptions(selectedModel = 'preset:default') {
  const sel = String(selectedModel || 'preset:default');
  if (sel.startsWith('model:')) return { modelPreferences: { hints: [sel.slice(6)] } };
  if (sel === 'preset:fast') {
    return {
      modelPreferences: {
        hints: ['google/gemini-3.1-flash-lite-preview', 'xiaomi/mimo-v2.5', 'qwen3.8-flash'],
        costPriority: 0.95,
        speedPriority: 0.85,
        intelligencePriority: 0.2,
      },
      thinking: false,
    };
  }
  if (sel === 'preset:story') {
    return { modelPreferences: { intelligencePriority: 0.95, speedPriority: 0.25, costPriority: 0.1 } };
  }
  return {};
}

export function hasLlmSupport(anna) {
  return Boolean(anna?.llm?.stream || anna?.llm?.complete);
}

export async function invokeAnnaLlm(
  anna,
  {
    systemPrompt,
    messages,
    selectedModel = 'preset:default',
    maxTokens = 450,
    temperature = 0.65,
    stage = 'Anna LLM Call',
    onToken = null,
    onProgress = null,
  }
) {
  if (!hasLlmSupport(anna)) {
    const offErr = new Error('Anna LLM runtime unavailable (running in standalone offline mode).');
    offErr.code = 'OFFLINE_NO_LLM';
    offErr.llmContext = { stage, selectedModel, elapsedMs: 0, charsReceived: 0 };
    throw offErr;
  }

  const startedAt = Date.now();
  const req = {
    systemPrompt,
    messages,
    maxTokens,
    temperature,
    ...buildModelRequestOptions(selectedModel),
  };

  if (typeof onProgress === 'function') {
    onProgress({ active: true, stage, selectedModel, chars: 0, chunks: 0, elapsedMs: 0, phase: 'connecting' });
  }

  let acc = '';
  let chunks = 0;
  let streamErr = null;
  if (typeof anna.llm.stream === 'function') {
    try {
      const stream = anna.llm.stream(req);
      for await (const ev of stream) {
        if (ev?.event === 'model_token' && ev.text) {
          acc += ev.text;
          chunks += 1;
          if (typeof onProgress === 'function') {
            onProgress({ active: true, stage, selectedModel, chars: acc.length, chunks, elapsedMs: Date.now() - startedAt, phase: 'streaming' });
          }
          if (typeof onToken === 'function') onToken(acc, ev.text);
        } else if (ev?.event === 'complete' && ev.text && !acc) {
          acc = ev.text;
        } else if (ev?.event === 'error') {
          streamErr = new Error(ev.message || ev.code || 'rt.llm.stream returned an error event');
          streamErr.code = ev.code || 'STREAM_ERROR';
          streamErr.rawEvent = ev;
        }
      }
    } catch (err) {
      streamErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  if ((!acc || streamErr) && typeof anna.llm.complete === 'function') {
    try {
      if (typeof onProgress === 'function') {
        onProgress({ active: true, stage: `${stage} (fallback)`, selectedModel, chars: acc.length, chunks, elapsedMs: Date.now() - startedAt, phase: 'completing' });
      }
      const res = await anna.llm.complete(req);
      acc = res?.text || res?.content || acc;
      if (acc) streamErr = null;
    } catch (err) {
      streamErr = err instanceof Error ? err : new Error(String(err));
    }
  }

  const elapsedMs = Date.now() - startedAt;
  if (streamErr) {
    streamErr.llmContext = { stage, selectedModel, elapsedMs, charsReceived: acc.length, rawOutput: acc || null };
    throw streamErr;
  }
  const finalStr = String(acc || '').trim();
  if (!finalStr) {
    const emptyErr = new Error('Anna LLM returned an empty response.');
    emptyErr.code = 'EMPTY_RESPONSE';
    emptyErr.llmContext = { stage, selectedModel, elapsedMs, charsReceived: 0 };
    throw emptyErr;
  }
  return finalStr;
}

export function extractJsonObject(rawText) {
  const s = String(rawText || '').trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : s;
  const start = candidate.indexOf('{');
  if (start === -1) return null;
  const end = candidate.lastIndexOf('}');
  const slice = (end > start ? candidate.slice(start, end + 1) : candidate.slice(start)).replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(slice);
  } catch {
    const stack = [];
    let inStr = false;
    let esc = false;
    for (const ch of slice) {
      if (esc) { esc = false; continue; }
      if (ch === '\\' && inStr) { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
      else if ((ch === '}' || ch === ']') && stack.at(-1) === ch) stack.pop();
    }
    let fixed = slice.replace(/,\s*$/, '');
    if (inStr) fixed += '"';
    if (stack.length > 0 || inStr) {
      try {
        return JSON.parse(fixed.replace(/,\s*$/, '') + stack.reverse().join(''));
      } catch {
        // Drop trailing incomplete key/value element after last comma and retry closing
        const lastComma = fixed.lastIndexOf(',');
        if (lastComma > 0) {
          const trimmed = fixed.slice(0, lastComma);
          const s2 = [];
          let ins = false;
          let esc2 = false;
          for (const ch of trimmed) {
            if (esc2) { esc2 = false; continue; }
            if (ch === '\\' && ins) { esc2 = true; continue; }
            if (ch === '"') { ins = !ins; continue; }
            if (ins) continue;
            if (ch === '{' || ch === '[') s2.push(ch === '{' ? '}' : ']');
            else if ((ch === '}' || ch === ']') && s2.at(-1) === ch) s2.pop();
          }
          try { return JSON.parse(trimmed + s2.reverse().join('')); } catch {}
        }
      }
    }
    return null;
  }
}
