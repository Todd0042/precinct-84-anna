import { addLog, cloneState, makeSnapshot, triggerFail, MAX_UNDO_DEPTH } from '../game/state.js';
import { CHARACTER_PROFILES, buildScopedHelpContext } from './case-context.js';
import { invokeAnnaLlm, extractJsonObject, hasLlmSupport, formatDetailedError } from './anna-ai.js';
import { formatThemeDirective } from './story-bible.js';

export function buildDirectorErrorInfo(err, stage, model, rawOutput = null) {
  return formatDetailedError(err, {
    stage,
    selectedModel: model,
    rawOutput,
    charsReceived: typeof rawOutput === 'string' ? rawOutput.length : err?.llmContext?.charsReceived ?? null,
    elapsedMs: err?.llmContext?.elapsedMs ?? null,
  });
}

export async function runClaireHint({ anna, state, question = '', onProgress = null }) {
  const next = cloneState(state);
  const ctx = buildScopedHelpContext(next);
  const out = [];
  if (!hasLlmSupport(anna)) {
    const tip = ctx.pendingSteps.length
      ? `Claire (#089): "By the book, Marcus. Next here: try '${ctx.pendingSteps[0]}' (path: ${ctx.suggestedCommands})."`
      : 'Claire (#089): "Covered this lead, partner. Use your action chips or "continue story"."';
    addLog(next, out, 'DIALOG', tip);
    return { state: next, sfx: 'tick' };
  }
  const themeNote = formatThemeDirective(next.storyTheme);
  const sys = `You are Officer Claire Bellamy (#089) in 1984 Oakridge City. Give short 2-sentence beat-cop tactical hints ONLY for the current scene. Never reveal spoilers.${themeNote ? ` ${themeNote}` : ''}`;
  try {
    const reply = await invokeAnnaLlm(anna, {
      systemPrompt: sys,
      messages: [{ role: 'user', content: `State JSON:\n${JSON.stringify(ctx)}\nMarcus asks: ${question || 'What next?'}` }],
      selectedModel: next.aiModel,
      maxTokens: 150,
      temperature: 0.55,
      stage: 'Ask Claire Hint',
      onProgress,
    });
    addLog(next, out, 'DIALOG', `Claire (#089): ${reply.replace(/^Claire\s*(?:\(#089\))?:\s*/i, '')}`);
    return { state: next, sfx: 'squelch' };
  } catch (err) {
    const error = buildDirectorErrorInfo(err, 'Ask Claire Hint', next.aiModel);
    addLog(next, out, 'ALERT', `[ERROR] ${error.headline}: ${error.summary}`);
    return { state: next, sfx: 'hazard', error };
  }
}

export async function runNpcQuestion({ anna, state, rawInput, onProgress = null }) {
  const next = cloneState(state);
  const out = [];
  if (!hasLlmSupport(anna)) {
    const error = buildDirectorErrorInfo(new Error('Anna LLM runtime unavailable.'), 'Live Interrogation', next.aiModel);
    addLog(next, out, 'ALERT', `[ERROR] ${error.summary}`);
    return { state: next, sfx: 'tick', error };
  }
  if (next.scene === 'interrogation_room' && (!next.flags?.recorderOn || !next.flags?.eddieMiranda)) {
    next.undoStack = [...(state.undoStack || []).slice(-(MAX_UNDO_DEPTH - 1)), makeSnapshot(state)];
    triggerFail(next, out, 'CUSTODIAL QUESTIONING VIOLATION', 'MIRANDA-384', 'Questioned Eddie Rourke before starting the recorder and reading Miranda Rights!');
    return { state: next, sfx: 'gameover' };
  }
  const who = next.scene === 'interrogation_room' ? CHARACTER_PROFILES.eddie : next.scene === 'pier84_office' ? CHARACTER_PROFILES.castellano : CHARACTER_PROFILES.claire;
  const themeNote = formatThemeDirective(next.storyTheme);
  try {
    const reply = await invokeAnnaLlm(anna, {
      systemPrompt: `Roleplay strictly in 1984 Oakridge noir (${who}). Alignment: ${JSON.stringify(next.alignment || {})}.${themeNote ? ` ${themeNote}` : ''} 2 crisp sentences.`,
      messages: [{ role: 'user', content: rawInput }],
      selectedModel: next.aiModel,
      maxTokens: 150,
      temperature: 0.7,
      stage: 'Live Suspect Questioning',
      onProgress,
    });
    addLog(next, out, 'DIALOG', reply);
    return { state: next, sfx: 'tick' };
  } catch (err) {
    const error = buildDirectorErrorInfo(err, 'Live Suspect Questioning', next.aiModel);
    addLog(next, out, 'ALERT', `[ERROR] ${error.headline}: ${error.summary}`);
    return { state: next, sfx: 'hazard', error };
  }
}

export async function generateIaDebrief({ anna, state, onProgress = null }) {
  if (!hasLlmSupport(anna)) return null;
  const next = cloneState(state);
  const out = [];
  try {
    const text = await invokeAnnaLlm(anna, {
      systemPrompt: 'Captain Morales delivering final IA review for Marcus Mercer (#084). Address his alignment (byTheBook vs corruption/rogue) in 2 sentences.',
      messages: [{ role: 'user', content: `Score: ${next.score}/${next.maxScore}, Alignment: ${JSON.stringify(next.alignment || {})}` }],
      selectedModel: next.aiModel,
      maxTokens: 140,
      temperature: 0.6,
      stage: 'IA Epilogue Debrief',
      onProgress,
    });
    addLog(next, out, 'DIALOG', `Capt. Morales (IA): ${text}`);
    return { state: next };
  } catch (err) {
    const error = buildDirectorErrorInfo(err, 'IA Epilogue Debrief', next.aiModel);
    addLog(next, out, 'ALERT', `[ERROR] ${error.headline}: ${error.summary}`);
    return { state: next, error };
  }
}

export async function chooseAutoPlayOption({ anna, state, options = [], onProgress = null }) {
  if (!options.length || !hasLlmSupport(anna)) return null;
  const optsList = options.map((o, i) => `${i + 1}. command="${o.command}" label="${o.label || o.command}"`).join('\n');
  const recentLog = (state?.log || []).slice(-4).map((l) => l.text).join(' ');
  try {
    const raw = await invokeAnnaLlm(anna, {
      systemPrompt: 'You are driving Auto-Play for Officer Marcus Mercer in Precinct 84. Pick ONE command from the list to advance the story coherently. Return ONLY JSON: {"command":"..."}',
      messages: [{ role: 'user', content: `Scene: ${state.scene}\nRecent: ${recentLog}\nOptions:\n${optsList}` }],
      selectedModel: state.aiModel,
      maxTokens: 50,
      temperature: 0.6,
      stage: 'Auto-Play Decision',
      onProgress,
    });
    const parsed = extractJsonObject(raw);
    const cmd = String(parsed?.command || '').toLowerCase().trim();
    return options.find((o) => o.command.toLowerCase() === cmd) || options[0];
  } catch {
    return options[0];
  }
}
