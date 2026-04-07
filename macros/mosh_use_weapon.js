(async () => {
  const MODULE_ID = "custom-foundry";
  const FLAG_KEY = "stat";
  const STAT_OPTIONS = ["speed", "strength", "will"];

  let me = game.user.character;

  if (!me && game.user.isGM) {
    me = canvas.tokens.controlled[0]?.actor;
    if (me) ui.notifications.info("using " + me.name + " actor");
  }

  if (!me) {
    ui.notifications.error("no character");
    return;
  }

  if (typeof args === "undefined") {
    ui.notifications.error("no itemId was passed to the macro");
    return;
  }

  const itemId = args[0]

  const sourceItem = me.getEmbeddedDocument("Item", itemId);
  if (!sourceItem) {
    ui.notifications.error("could not find clicked item on actor");
    return;
  }

  const item = game.items.getName(sourceItem.name)

  let stat = item.getFlag(MODULE_ID, FLAG_KEY);

  if (!STAT_OPTIONS.includes(stat)) {
    const descriptions = {
      speed: "Mainly requires percision",
      strength: "Mainly requires power",
      will: "Mainly requires brainpower",
    };

    const result = await foundry.applications.api.DialogV2.wait({
      window: { title: "Select Stat" },
      classes: ["map-prompt"],
      content: `
        <form>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <p class="hint" style="margin:4px 0 0 0; max-width: 330px">
                Dougie has not defined a fixed stat usage for this item. If the choice is obvious, pick it. Otherwise ask what stat to roll against.
              </p>
            </div>

            <div style="display:grid; grid-template-columns:1fr; gap:8px;">
              ${STAT_OPTIONS.map((statName, i) => `
                <label style="display:flex; align-items:flex-start; gap:10px; padding:6px 8px; border:1px solid rgba(255,255,255,0.12);">
                  <input
                    type="radio"
                    name="selectedStat"
                    value="${statName}"
                    ${i === 0 ? "checked" : ""}
                  >
                  <div style="display:flex; flex-direction:column; gap:2px;">
                    <span style="font-weight:700;">${statName.toUpperCase()}</span>
                    <span class="hint">${descriptions[statName] ?? ""}</span>
                  </div>
                </label>
              `).join("")}
            </div>
          </div>
        </form>
      `,
      buttons: [
        {
          action: "confirm",
          label: "Confirm",
          icon: "fas fa-check",
          default: true,
          callback: async (_event, _button, dialog) => {
            const selected = dialog.element.querySelector('input[name="selectedStat"]:checked')?.value;
            if (!selected) {
              ui.notifications.warn("select a stat");
              return;
            }
            return selected;
          }
        },
        {
          action: "cancel",
          label: "Cancel",
          icon: "fas fa-times",
        }
      ]
    });

    if (!result || result === "cancel") return;

    stat = result;

    if (game.user.isGM) {
      await item.setFlag(MODULE_ID, FLAG_KEY, stat);
    } else {
      game.socket.emit("module.custom-foundry", {
        action: "setDocumentFlags",
        uuid: item.uuid,
        flags: {
          stat,
        }
      });
    }
  }

  await me.rollCheck(null, "low", stat, null, null, item);
})();
