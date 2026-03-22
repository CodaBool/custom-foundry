if (!game.user.isGM) return
// Get images from a specific Journal page
const j = Array.from(game.journal).find(j => j.name === "scripting")
if (!j) {
  ui.notifications.error("Create a journal named 'scripting'");
  return;
}
let page
for (const p of Object.values(j._source.pages)) {
  if (p.name === "background image") {
    page = fromUuidSync(`JournalEntry.${j.id}.JournalEntryPage.${p._id}`);
  }
}

if (!page) {
  ui.notifications.error("Create a page named 'background image' in journal 'scripting'");
  return;
}

const backgrounds = [...page.text.content?.matchAll(/<img[^>]*src="([^"]+)"/g)]?.map(match => match[1])

if (backgrounds.length === 0) {
  ui.notifications.error("in 'background image' create content of images");
  return;
}

// Build dialog content
let content = `
<form>
  <div class="form-group" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
`;

backgrounds.forEach((bg, index) => {
  // Extract readable label from filename
  const fileName = bg.split("/").pop();                // e.g. "city_tokyo.webp"
  const labelName = fileName.replace(/\.[^/.]+$/, ""); // remove extension
  const displayName = labelName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  content += `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <label for="bg-${index}" style="position:relative; display:inline-block; width:213px; height:120px; cursor:pointer; border:1px solid rgba(255,255,255,0.25); border-radius:6px; overflow:hidden;">
        <input type="radio" name="background" value="${index}" id="bg-${index}"
              style="position:absolute; left:8px; top:8px; width:18px; height:18px; z-index:2; opacity:1; appearance:auto;">
        <img src="${bg}" width="213" height="120" style="display:block; width:100%; height:100%; object-fit:cover;">
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
      canvas.scene.update({ "background.src": background });
    }
  }],
});

// Add scrollbar
setTimeout(() => {
  const section = document.querySelector("#select-background-dialog section");
  if (section) section.style.overflow = "auto";
}, 200);
