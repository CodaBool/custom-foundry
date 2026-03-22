// FoundryVTT Macro: Toggle Oscillating Pixelation Effect (robust / desync-safe)
// Usage:
//   await togglePixelEffect("false"); // single fullscreen
//   await togglePixelEffect("true");  // 4-way table grid

async function togglePixelEffect(isTableGridArg = "false", blockMin = 3, blockMax = 3.02, cycleMs = 5000) {
  const isTableGrid = String(isTableGridArg ?? "false").toLowerCase() === "true";

  // --- helpers ---
  const getState = () => {
    if (!window.pixelEffectState) {
      window.pixelEffectState = {
        active: false,
        sprites: [],
        handler: null,
        filter: null,
        _createdAt: Date.now(),
      };
    }
    return window.pixelEffectState;
  };

  const isSpriteUsable = (s) => {
    // PIXI v6/v7 variants differ; cover common cases
    if (!s) return false;
    if (s.destroyed === true) return false;
    if (s._destroyed === true) return false;
    // If it’s not a display object anymore, it’s not usable
    if (typeof s.renderable !== "undefined" && s.renderable === false && !s.parent) {
      // still could be ok, but likely stale
    }
    return true;
  };

  const safeRemoveTicker = (handler) => {
    try {
      if (handler && PIXI?.Ticker?.shared) PIXI.Ticker.shared.remove(handler);
    } catch (e) {
      console.warn("PixelEffect: failed removing ticker handler (ignored)", e);
    }
  };

  const safeRemoveFromParent = (s) => {
    try {
      if (s?.parent) s.parent.removeChild(s);
    } catch (e) {
      console.warn("PixelEffect: failed removing child from parent (ignored)", e, s);
    }
  };

  const safeClearFilters = (s) => {
    try {
      if (s && "filters" in s) s.filters = null;
    } catch (e) {
      // ignore
    }
  };

  const safeDestroySprite = (s) => {
    if (!s) return;

    // Best-effort detach first
    safeClearFilters(s);
    safeRemoveFromParent(s);

    // Some PIXI Sprite.destroy paths blow up if texture/baseTexture is already null.
    // Nuke references first so destroy has less to touch.
    try { s.texture = PIXI.Texture.EMPTY; } catch (_) {}
    try { s.shader = null; } catch (_) {}
    try { s._texture = PIXI.Texture.EMPTY; } catch (_) {}

    // Final destroy: never let it crash macro cleanup
    try {
      // children doesn't matter for Sprite, but keep your intent
      s.destroy({ children: true });
    } catch (e) {
      console.warn("PixelEffect: sprite.destroy failed (ignored)", e, s);
      // If destroy fails, at least mark it unusable and detach
      try { s.visible = false; } catch (_) {}
    }
  };

  const safeDestroyFilter = (f) => {
    if (!f) return;
    try { f.enabled = false; } catch (_) {}
    try { f.destroy?.(); } catch (_) {}
  };

  const healState = (state) => {
    // Drop obviously dead references so later operations don’t explode
    state.sprites = Array.isArray(state.sprites) ? state.sprites.filter(isSpriteUsable) : [];
    if (state.filter && state.filter.destroyed) state.filter = null;

    // If we thought we were active but we have no sprites, treat as inactive
    if (state.active && state.sprites.length === 0) {
      state.active = false;
      state.handler = null;
      state.filter = null;
    }
  };

  const fullCleanup = (state) => {
    // Remove ticker first so nothing keeps touching uniforms
    safeRemoveTicker(state.handler);

    // Snapshot list, then clear state FIRST to avoid re-entrancy weirdness
    const sprites = Array.isArray(state.sprites) ? [...state.sprites] : [];
    const filter = state.filter;

    state.active = false;
    state.sprites = [];
    state.handler = null;
    state.filter = null;

    // Cleanup objects best-effort
    for (const s of sprites) safeDestroySprite(s);
    safeDestroyFilter(filter);
  };

  const state = getState();
  healState(state);

  // --- TURN OFF ---
  if (state.active) {
    fullCleanup(state);
    return;
  }

  // --- TURN ON (but if state is weird, force-clean first) ---
  if (state.sprites?.length || state.handler || state.filter) {
    // stale leftovers even though active=false
    fullCleanup(state);
  }

  const scene = canvas?.scene;
  const imgPath = scene?.background?.src ?? scene?.img;
  if (!scene || !imgPath) {
    // nothing to do
    return;
  }

  // Root for world content; we want to be at the bottom of this
  const layerRoot = canvas?.primary ?? canvas?.app?.stage;
  if (!layerRoot) return;

  // Load texture safely
  let tex;
  try {
    tex = await loadTexture(imgPath);
  } catch (e) {
    console.warn("PixelEffect: failed loading texture, aborting", e);
    return;
  }
  if (!tex || tex === PIXI.Texture.EMPTY) return;

  const sceneW = scene.width;
  const sceneH = scene.height;

  const sprites = [];
  const overlapFactor = 1.05; // 5% bigger in each dimension

  const makeSprite = () => {
    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5);
    return sprite;
  };

  if (!isTableGrid) {
    const sprite = makeSprite();
    sprite.position.set(sceneW / 2, sceneH / 2);
    sprite.width  = sceneW * overlapFactor;
    sprite.height = sceneH * overlapFactor;

    try { layerRoot.addChildAt(sprite, 0); } catch (e) { console.warn("PixelEffect: addChildAt failed", e); }
    sprites.push(sprite);
  } else {
    const quadW = sceneW / 2;
    const quadH = sceneH / 2;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const sprite = makeSprite();
        sprite.position.set(quadW * (col + 0.5), quadH * (row + 0.5));
        sprite.width  = quadW * overlapFactor;
        sprite.height = quadH * overlapFactor;
        if (row === 0) sprite.rotation = Math.PI;

        try { layerRoot.addChildAt(sprite, 0); } catch (e) { console.warn("PixelEffect: addChildAt failed", e); }
        sprites.push(sprite);
      }
    }
  }

  const fragmentSrc = `
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform float blockSize;
    uniform vec2 textureSize;

    void main() {
      vec2 texSize = textureSize;
      vec2 coord = vTextureCoord * texSize;

      vec2 center = texSize * 0.5;
      vec2 fromCenter = coord - center;

      vec2 snappedFromCenter = floor(fromCenter / blockSize) * blockSize + blockSize * 0.5;
      vec2 snapped = center + snappedFromCenter;

      vec2 sampleUV = snapped / texSize;
      sampleUV = clamp(sampleUV, 0.0, 1.0);

      gl_FragColor = texture2D(uSampler, sampleUV);
    }
  `;

  class PixelFilter extends PIXI.Filter {
    constructor(initial, texSize) {
      super(undefined, fragmentSrc, {
        blockSize: initial,
        textureSize: texSize
      });
    }
  }

  // texture sizes can be 0 if something is invalid; guard it
  const tw = Math.max(1, tex.width  || 1);
  const th = Math.max(1, tex.height || 1);

  const filter = new PixelFilter(blockMin, [tw, th]);
  for (const s of sprites) {
    try { s.filters = [filter]; } catch (_) {}
  }

  state.active  = true;
  state.sprites = sprites;
  state.filter  = filter;

  const start = performance.now();
  const handler = () => {
    // If a desync nukes our sprites/filter mid-run, self-heal and stop
    if (!state.active || !state.filter) return;

    // Prune dead sprites during runtime too
    state.sprites = state.sprites.filter(isSpriteUsable);
    if (state.sprites.length === 0) {
      fullCleanup(state);
      return;
    }

    const p   = ((performance.now() - start) % cycleMs) / cycleMs;
    const osc = Math.sin(p * Math.PI * 2.0) * 0.5 + 0.5;

    try {
      state.filter.uniforms.blockSize = blockMin + osc * (blockMax - blockMin);
    } catch (e) {
      // If uniforms explode, bail out cleanly
      console.warn("PixelEffect: uniform update failed, cleaning up", e);
      fullCleanup(state);
    }
  };

  state.handler = handler;
  try {
    PIXI.Ticker.shared.add(handler);
  } catch (e) {
    console.warn("PixelEffect: failed to add ticker handler, cleaning up", e);
    fullCleanup(state);
  }
}

// Final call: use args[0] for the tableGrid flag
if (typeof gmContext === "undefined") {
  await togglePixelEffect("false");
} else {
  // e.g. = togglePixelEffect(false 8 8.02 5000)
  await togglePixelEffect(gmContext.isTableGridArg, gmContext.blockMin, gmContext.blockMax, gmContext.cycleMs);
}
