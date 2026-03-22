// Theatre Dock Animator (robust, single-instance)
// - Stores state on window so re-running the macro won't start duplicates
// - Toggle behavior: run once to start, run again to stop

const KEY = "__theatreDockAnimator";

// Init global state container
window[KEY] ??= {
  intervalId: null,
  toggle: false,
  primeBar: null,
  dock: null,
  startedAt: null,
};

const state = window[KEY];

function stop(reason) {
  if (state.intervalId) clearInterval(state.intervalId);
  state.intervalId = null;
  state.toggle = false;
  state.startedAt = null;
  // keep cached nodes; they may be reused if still valid

  if (reason) console.log(`[TheatreDockAnimator] stopped: ${reason}`);
  ui?.notifications?.info?.("Theatre dock animation stopped.");
}

// Toggle: if already running, stop and exit
if (state.intervalId) {
  stop("toggle-off");
  return;
}

// Grab / refresh DOM refs
state.primeBar = document.getElementById("theatre-prime-bar");
state.dock = document.getElementById("theatre-dock");

if (!state.primeBar || !state.dock) {
  ui?.notifications?.error?.("Theatre elements not found (prime bar or dock).");
  // Ensure no stale running state
  stop("missing-elements");
  return;
}

// Optional: set a transition so transform changes animate smoothly
// (won't override if already set by Theatre, but helps if it's blank)
if (!state.dock.style.transition) {
  state.dock.style.transition = "transform 250ms ease";
}

const INTERVAL_MS = 5_000;

state.startedAt = Date.now();
state.intervalId = setInterval(() => {
  const primeBar = state.primeBar;
  const dock = state.dock;

  // If Theatre UI was removed / re-rendered, stop to avoid errors
  if (!primeBar || !dock || !document.body.contains(primeBar) || !document.body.contains(dock)) {
    stop("elements-removed");
    return;
  }

  const opacity = Number(getComputedStyle(primeBar).opacity);
  if (!opacity) return; // hidden / not visible, don't flip

  state.toggle = !state.toggle;

  dock.style.transform = state.toggle
    ? "translate(-310px, 150px) rotate(180deg) scale(.5)"
    : "translate(310px, -150px) rotate(0deg) scale(.5)";
}, INTERVAL_MS);

console.log(`[TheatreDockAnimator] started (every ${INTERVAL_MS}ms)`);
ui?.notifications?.info?.("Theatre dock animation started. Run macro again to stop.");
