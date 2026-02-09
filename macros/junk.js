// Macro: Contextual hide/toggle
// - If tile (args[0]) is visible: hide tile + ALL tokens (no dialog)
// - If tile is hidden: show DialogV2 to toggle tile + selected tokens

(async () => {
  if (!args?.[0]) {
    ui.notifications.error("No tile UUID provided in args[0].");
    return;
  }

  const tileDoc = await fromUuid(args[0]);
  if (!tileDoc) {
    ui.notifications.error(`No tile found for UUID: ${args[0]}`);
    return;
  }

  const tileIsHidden = tileDoc.hidden === true;
  const tokenDocs = canvas.tokens.placeables.map(t => t.document);

  // ------------------------------------------------------------
  // CASE 1: Tile is currently VISIBLE -> hide everything, no UI
  // ------------------------------------------------------------
  if (!tileIsHidden) {
    const updates = [];

    // --- Your tile toggle snippet, with targetHidden defined ---
    const targetHidden = true; // always hide the tile in this branch
    const tileIsHiddenNow = tileDoc ? tileDoc.hidden === true : true;
    if (tileDoc && tileIsHiddenNow !== targetHidden) {
      updates.push(tileDoc.update({ hidden: targetHidden }));
    }
    // ----------------------------------------------------------

    // Hide ALL tokens on the scene
    for (const tDoc of tokenDocs) {
      if (!tDoc.hidden) {
        updates.push(tDoc.update({ hidden: true }));
      }
    }

    if (!updates.length) {
      ui.notifications.info("Everything is already hidden.");
      return;
    }

    await Promise.all(updates);
    return; // done, no dialog
  }

  // ------------------------------------------------------------
  // CASE 2: Tile is currently HIDDEN -> show dialog & toggle
  // ------------------------------------------------------------

  if (!tokenDocs.length) {
    ui.notifications.warn("There are no tokens on the current scene.");
  }

  const IMG_SIZE = 120; // big thumbnails

  // Build dialog content with checkboxes for each token
  let content = `
  <form>
    <p>Select which tokens you want to toggle visibility for.</p>
    <div class="form-group" style="max-height: 550px; overflow-y:auto; padding-right:4px;">
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; padding:6px;">Toggle?</th>
            <th style="text-align:left; padding:6px;">Token</th>
          </tr>
        </thead>
        <tbody>
  `;

  for (const doc of tokenDocs) {
    const uuid = doc.uuid;
    const name = doc.name ?? "Unnamed Token";

    content += `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
        <td style="padding:6px; vertical-align:top;">
          <input type="checkbox" name="tokens" value="${uuid}">
        </td>
        <td style="padding:6px; display:flex; align-items:flex-start; gap:10px;">
          <img src="${doc.texture.src}"
               width="${IMG_SIZE}" height="${IMG_SIZE}"
               style="border:1px solid rgba(255,255,255,0.25); border-radius:6px; object-fit:contain; background:#000;">
          <div style="display:flex; flex-direction:column; justify-content:center;">
            <strong>${name}</strong>
          </div>
        </td>
      </tr>
    `;
  }

  content += `
        </tbody>
      </table>
    </div>
  </form>
  `;

  await foundry.applications.api.DialogV2.wait({
    id: "toggle-visibility-dialog",
    window: { title: "Toggle Tile and Token Visibility" },
    position: { width: 650, height: "auto" },
    content,
    buttons: [
      {
        action: "cancel",
        label: "Cancel",
        icon: "fas fa-times",
        callback: () => {}
      },
      {
        action: "apply",
        label: "Toggle Visibility",
        icon: "fas fa-eye-slash",
        callback: async () => {
          const checked = document.querySelectorAll(
            '#toggle-visibility-dialog input[name="tokens"]:checked'
          );
          const tokenUUIDs = Array.from(checked).map(el => el.value);

          const updates = [];

          // --- Your tile toggle snippet (now going from hidden -> visible) ---
          const tileIsHiddenCurrent = tileDoc ? tileDoc.hidden === true : true;
          const targetHidden = !tileIsHiddenCurrent; // flip visibility
          if (tileDoc) updates.push(tileDoc.update({ hidden: targetHidden }));
          // -------------------------------------------------------------------

          // Toggle selected tokens
          for (const uuid of tokenUUIDs) {
            const tokenDoc = await fromUuid(uuid);
            if (!tokenDoc) continue;
            const tokenHidden = tokenDoc.hidden === true;
            updates.push(tokenDoc.update({ hidden: !tokenHidden }));
          }

          if (!updates.length) {
            ui.notifications.info("Nothing to toggle.");
            return;
          }

          await Promise.all(updates);
        }
      }
    ]
  });
})();
