// GM guard (optional but recommended)
if (!game.user.isGM) return

// === 1. Get images from a specific Journal page ===
// Replace this UUID with your actual journal page UUID
const j = Array.from(game.journal).find(j => j.name === "scripting")
if (!j) {
  ui.notifications.error("Create a journal named 'scripting'");
  return;
}
let page
for (const p of Object.values(j._source.pages)) {
  if (p.name === "popup") {
    page = fromUuidSync(`JournalEntry.${j.id}.JournalEntryPage.${p._id}`);
  }
}

if (!page) {
  ui.notifications.error("Create a page named 'popup' in journal 'scripting'");
  return;
}

const html = page.text?.content ?? "";
const backgrounds = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(match => match[1]);


if (backgrounds.length === 0) {
  ui.notifications.error("in 'popup' create content of images");
  return;
}

// === 2. Build dialog content with thumbnails ===
let content = `
<form>
  <div class="form-group" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
`;

backgrounds.forEach((bg, index) => {
  const fileName = bg.split("/").pop();                 // e.g. "city_tokyo.webp"
  const labelName = fileName.replace(/\.[^/.]+$/, "");  // remove extension
  const displayName = labelName
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());

  content += `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <label for="bg-${index}"
        style="
          position:relative;
          display:inline-block;
          width:320px;
          height:180px;
          cursor:pointer;
          border:1px solid rgba(255,255,255,0.25);
          border-radius:6px;
          overflow:hidden;
          background:#000;
        ">
        <input type="radio" name="background" value="${index}" id="bg-${index}"
          style="
            position:absolute;
            left:8px;
            top:8px;
            width:18px;
            height:18px;
            z-index:2;
            opacity:1;
            appearance:auto;
          ">
        <img src="${bg}" width="320" height="180"
          style="display:block; width:100%; height:100%; object-fit:cover;">
      </label>
      <div style="margin-top:4px; font-size:14px; text-align:center; max-width:340px;">
        ${displayName}
      </div>
    </div>
  `;
});

content += `
  </div>
</form>
`;

// === 3. DialogV2 that shows image to everyone on confirm ===
foundry.applications.api.DialogV2.wait({
  window: { title: "Show Journal Image To Players" },
  position: {
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8
  },
  content,
  id: "show-journal-image-dialog",
  buttons: [{
    action: "show",
    label: "Show To Everyone",
    icon: "fas fa-eye",
    callback: () => {
      const el = document.querySelector('#show-journal-image-dialog input[name="background"]:checked');
      if (!el) {
        ui.notifications.warn("No image selected.");
        return;
      }

      const idx = Number(el.value);
      const src = backgrounds[idx];

      // Nice title based on filename
      const fileName = src.split("/").pop();
      const labelName = fileName.replace(/\.[^/.]+$/, "");
      const title = labelName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

      const data = {
        src,
        uuid: page.uuid ?? null,
        window: { title }
      };

      // Local popout
      let popout;
      try {
        popout = new foundry.applications.apps.ImagePopout(data);
        popout.render(true);
      } catch (e) {
        console.error("Error creating ImagePopout:", e);
        ui.notifications.error("Failed to create image popout.");
        return;
      }

      // Share with all connected players
      // Support both instance and static API depending on Foundry version
      try {
        if (popout.shareImage) {
          // Instance method (v11+)
          popout.shareImage();
        } else if (foundry.applications.apps.ImagePopout.shareImage) {
          // Static helper (some versions)
          foundry.applications.apps.ImagePopout.shareImage(data);
        } else {
          ui.notifications.warn("This Foundry version does not support automatic image sharing.");
        }
      } catch (e) {
        console.error("Error sharing image:", e);
        ui.notifications.error("Failed to share image with players.");
      }
    }
  }]
});

// Make dialog scrollable if needed
setTimeout(() => {
  const section = document.querySelector("#show-journal-image-dialog section");
  if (section) section.style.overflow = "auto";
}, 200);
