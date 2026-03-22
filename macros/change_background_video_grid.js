if (!game.user.isGM) return
// Get images from a specific Journal page
const j = Array.from(game.journal).find(j => j.name === "scripting")
if (!j) {
  ui.notifications.error("Create a journal named 'scripting'");
  return;
}
let page
for (const p of Object.values(j._source.pages)) {
  if (p.name === "background video") {
    page = fromUuidSync(`JournalEntry.${j.id}.JournalEntryPage.${p._id}`);
  }
}

if (!page) {
  ui.notifications.error("Create a page named 'background video' in journal 'scripting'");
  return;
}

const backgrounds = [
  ...page.text.content?.matchAll(/<video[^>]*src="([^"]+)"/g) ?? []
].map(match => match[1]);

if (backgrounds.length === 0) {
  ui.notifications.error("in 'background image' create content of images");
  return;
}

// Build dialog content with visible radios + clickable tiles
let content = `
<form>
  <div class="form-group" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
`;

backgrounds.forEach((bg, index) => {
  // Get the file name (e.g., "city_bright_tokyo.webm")
  const fileName = bg.split("/").pop();
  // Remove extension and replace underscores with spaces
  const labelName = fileName.replace(".webm", "").replace(/_/g, " ");
  // Capitalize words
  const displayName = labelName.replace(/\b\w/g, c => c.toUpperCase());

  content += `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <label for="bg-${index}" style="position:relative; display:inline-block; width:213px; height:120px; cursor:pointer; border:1px solid rgba(255,255,255,0.25); border-radius:6px; overflow:hidden;">
        <input type="radio" name="background" value="${index}" id="bg-${index}"
              style="position:absolute; left:8px; top:8px; width:18px; height:18px; z-index:2; opacity:1; appearance:auto;">
        <video width="213" height="120" autoplay loop muted playsinline
          style="display:block; width:100%; height:100%; object-fit:cover;">
          <source src="${bg}" type="video/webm">
        </video>
      </label>
      <div style="margin-top:4px; font-size:14px; text-align:center;">${displayName}</div>
    </div>
  `;
});

content += `
  </div>
</form>
`;

// Show dialog
foundry.applications.api.DialogV2.wait({
  window: { title: "Change Background" },
  position: { width: window.innerWidth * 0.8, height: window.innerHeight * 0.8 },
  content,
  id: "select-background-dialog",
  buttons: [{
    action: "apply",
    label: "Change Background",
    icon: "fas fa-check",
    callback: () => {
      const el = document.querySelector('#select-background-dialog input[name="background"]:checked');
      if (!el) return; // nothing selected
      const idx = Number(el.value);
      const background = backgrounds[idx];


      const tile1 = fromUuidSync("Scene.UaZKZtKYTwRCUxxA.Tile.wvNrGgLv4CxipCK5")
      const tile2 = fromUuidSync("Scene.UaZKZtKYTwRCUxxA.Tile.hueWGCfaY98VaO3v")
      const tile3 = fromUuidSync("Scene.UaZKZtKYTwRCUxxA.Tile.vrHmMAO6PMaSt0n9")
      const tile4 = fromUuidSync("Scene.UaZKZtKYTwRCUxxA.Tile.SCgLTPY1W6Mcwkxi")
      tile1.update({
          "texture.src": background,
          "rotation": 180,
      })
      tile2.update({
          "texture.src": background,
          "rotation": 180,
      })
      tile3.update({
          "texture.src": background,
      })
      tile4.update({
          "texture.src": background,
      })
    }
  }],
});

// Scrollbar, just in case
setTimeout(() => {
  const section = document.querySelector("#select-background-dialog section");
  if (section) section.style.overflow = "auto";
}, 200);
