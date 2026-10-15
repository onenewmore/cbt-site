// Tiny hand-off between tools: one tool jumps to another and passes parameters.
const pending = new Map();

export function gotoTool(tool, params) {
  if (params) pending.set(tool, params);
  document.dispatchEvent(new CustomEvent('cbt:goto', { detail: tool }));
}

export function takePending(tool) {
  const p = pending.get(tool) || null;
  pending.delete(tool);
  return p;
}
