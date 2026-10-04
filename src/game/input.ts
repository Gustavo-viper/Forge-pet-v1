// ============================================================
// FORGE PET — Input global (teclado + joystick virtual)
// ============================================================
export const input = {
  mx: 0, // -1..1 movimento X (câmera relativo)
  mz: 0, // -1..1 movimento Z
  run: false,
  jumpQueued: false,
  interactQueued: false,
};

const keys = new Set<string>();

let attached = false;

export function attachKeyboard() {
  if (attached) return;
  attached = true;
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if (k === " ") { input.jumpQueued = true; e.preventDefault(); }
    if (k === "e" || k === "enter") input.interactQueued = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
}

/** atualiza mx/mz a partir do teclado (chamado no loop do jogo) */
export function pollKeyboard() {
  let x = 0, z = 0;
  if (keys.has("w") || keys.has("arrowup")) z -= 1;
  if (keys.has("s") || keys.has("arrowdown")) z += 1;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;
  if (x !== 0 || z !== 0) {
    const len = Math.hypot(x, z);
    input.mx = x / len;
    input.mx = input.mx; // mantido
    input.mz = z / len;
  } else {
    input.mx = 0;
    input.mz = 0;
  }
  input.run = keys.has("shift");
  return { x, z };
}

export function consumeJump() {
  const j = input.jumpQueued;
  input.jumpQueued = false;
  return j;
}

export function consumeInteract() {
  const i = input.interactQueued;
  input.interactQueued = false;
  return i;
}
