const files = [];

let dir = "codabool/img/heart/iso_map";
if (typeof args !== "undefined" && args?.[0]) dir = args[0];

const thumbDir = `${dir}/thumbnail`;
const THUMB_WIDTH = 213;
const THUMB_HEIGHT = 120;
const THUMB_FORMAT = "image/webp";
const THUMB_EXT = "webp";
const THUMB_QUALITY = 0.72;

// -----------------------------
// Helpers
// -----------------------------
function getFileName(path) {
  return path.split("/").pop() ?? path;
}

function getBaseName(path) {
  return getFileName(path).replace(/\.[^/.]+$/, "");
}

function getDisplayName(path) {
  return getBaseName(path)
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getThumbFileName(originalPath) {
  // keep extension in name to avoid collisions like foo.png + foo.jpg
  const originalFile = getFileName(originalPath); // e.g. map01.png
  return `${originalFile}.${THUMB_EXT}`;          // e.g. map01.png.webp
}

function getThumbPath(originalPath) {
  return `${thumbDir}/${getThumbFileName(originalPath)}`;
}

async function ensureDirectoryExists(path) {
  try {
    await FilePicker.createDirectory("data", path);
  } catch (err) {
    // Ignore "already exists" style failures
    const msg = String(err?.message ?? err ?? "");
    if (
      !msg.toLowerCase().includes("already") &&
      !msg.toLowerCase().includes("exist")
    ) {
      console.warn("Failed creating directory:", path, err);
      throw err;
    }
  }
}

async function loadImageElement(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.src = src;

  if (img.decode) {
    await img.decode().catch(() => {
      // fallback below
    });
  }

  if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });
  }

  return img;
}

function drawCoverThumb(img, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  const scale = Math.max(width / srcW, height / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const dx = (width - drawW) / 2;
  const dy = (height - drawH) / 2;

  ctx.drawImage(img, dx, dy, drawW, drawH);
  return canvas;
}

async function canvasToFile(canvas, fileName, mimeType, quality) {
  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, mimeType, quality)
  );
  if (!blob) throw new Error(`Failed to encode thumbnail for ${fileName}`);
  return new File([blob], fileName, { type: mimeType });
}

async function generateThumbnailFor(originalPath) {
  const img = await loadImageElement(originalPath);
  const canvas = drawCoverThumb(img, THUMB_WIDTH, THUMB_HEIGHT);
  const thumbFileName = getThumbFileName(originalPath);
  const file = await canvasToFile(canvas, thumbFileName, THUMB_FORMAT, THUMB_QUALITY);

  await FilePicker.upload("data", thumbDir, file, {}, { notify: false });
  return getThumbPath(originalPath);
}

async function getThumbMap(filePaths) {
  await ensureDirectoryExists(thumbDir);

  let existingThumbs = [];
  try {
    const thumbBrowse = await FilePicker.browse("data", thumbDir);
    existingThumbs = thumbBrowse.files ?? [];
  } catch (err) {
    console.warn("Could not browse thumbnail dir yet, continuing:", err);
  }

  const existingSet = new Set(existingThumbs);
  const thumbMap = new Map();

  for (const originalPath of filePaths) {
    const thumbPath = getThumbPath(originalPath);

    if (existingSet.has(thumbPath)) {
      thumbMap.set(originalPath, thumbPath);
      continue;
    }

    try {
      ui.notifications.info(`Generating thumbnail: ${getFileName(originalPath)}`);
      const createdPath = await generateThumbnailFor(originalPath);
      thumbMap.set(originalPath, createdPath);
    } catch (err) {
      console.error("Thumbnail generation failed for", originalPath, err);
      // fallback to original if thumbnail failed
      thumbMap.set(originalPath, originalPath);
    }
  }

  return thumbMap;
}

// -----------------------------
// Main
// -----------------------------
const fileList = await FilePicker.browse("data", dir);
for (const file of fileList.files) {
  files.push(file);
}

if (!files.length) {
  ui.notifications.error("No images found in that folder.");
  return;
}

// Build or reuse cached thumbs
const thumbMap = await getThumbMap(files);

// Build dialog
let content = `
<form>
  <div class="form-group" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
`;

files.forEach((bg, index) => {
  const displayName = getDisplayName(bg);
  const thumb = thumbMap.get(bg) ?? bg;

  content += `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <label
        for="bg-${index}"
        style="
          position:relative;
          display:inline-block;
          width:${THUMB_WIDTH}px;
          height:${THUMB_HEIGHT}px;
          cursor:pointer;
          border:1px solid rgba(255,255,255,0.25);
          border-radius:6px;
          overflow:hidden;
        "
      >
        <input
          type="radio"
          name="background"
          value="${index}"
          id="bg-${index}"
          style="
            position:absolute;
            left:8px;
            top:8px;
            width:18px;
            height:18px;
            z-index:2;
            opacity:1;
            appearance:auto;
          "
        >
        <img
          src="${thumb}"
          width="${THUMB_WIDTH}"
          height="${THUMB_HEIGHT}"
          loading="lazy"
          decoding="async"
          style="display:block; width:100%; height:100%; object-fit:cover;"
        >
      </label>
      <div style="margin-top:4px; font-size:14px; text-align:center;">${displayName}</div>
    </div>
  `;
});

content += `
  </div>
</form>
`;

foundry.applications.api.DialogV2.wait({
  window: { title: "Change Background" },
  position: { width: window.innerWidth * 0.8, height: window.innerHeight * 0.8 },
  content,
  id: "select-background-dialog",
  buttons: [{
    action: "apply",
    label: "Change Background",
    icon: "fas fa-check",
    callback: async () => {
      const el = document.querySelector('#select-background-dialog input[name="background"]:checked');
      if (!el) return;

      const idx = Number(el.value);
      const background = files[idx];
      await canvas.scene.update({ "background.src": background });
    }
  }],
});

setTimeout(() => {
  const section = document.querySelector("#select-background-dialog section");
  if (section) section.style.overflow = "auto";
}, 200);
