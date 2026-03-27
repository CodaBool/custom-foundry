let me = game.user.character
if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}


const current = Number(me.system.stats.combat.value ?? 0);
const max = Number(me.system.stats.combat.max ?? 0);

foundry.applications.api.DialogV2.wait({
  window: { title: "WILL" },
  classes: ["number-prompt"],
  content: `
    <form>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <div style="font-size:14px; opacity:0.8;">Current</div>
          <div style="font-size:24px; font-weight:700;">${current} / ${max}</div>
        </div>

        <label style="display:flex; align-items:center; gap:10px;">
          <span style="min-width:60px;">Modify</span>
          <input
            type="number"
            name="selectedNumber"
            value="0"
            step="1"
            style="width:120px;"
          >
        </label>

        <p class="hint" style="margin:0;">
          Enter a positive or negative number to modify WILL, or reset it to max.
        </p>
      </div>
    </form>
  `,
  buttons: [
    {
      action: "modify",
      label: "Confirm",
      icon: "fas fa-sliders-h",
      default: true,
      callback: async (event, button, dialog) => {
        const input = dialog.element.querySelector('input[name="selectedNumber"]');
        const num = input ? Number(input.value) : NaN;

        if (Number.isNaN(num)) {
          ui.notifications.warn("Enter a valid number.");
          return;
        }

        const currentValue = Number(me.system.stats.combat.value ?? 0);
        const maxValue = Number(me.system.stats.combat.max ?? 0);
        const newValue = Math.min(currentValue + num, maxValue);

        if (newValue === currentValue) {
          ui.notifications.info(`WILL remains at '${currentValue}'`);
          return;
        }

        await me.update({ "system.stats.combat.value": newValue });

        if (currentValue + num > maxValue) {
          ui.notifications.info(`Hit max WILL at '${maxValue}'`);
        } else {
          ui.notifications.info(`Modified WILL to '${newValue}'`);
        }
      }
    },
    {
      action: "reset",
      label: "Reset to Max",
      icon: "fas fa-undo",
      callback: async () => {
        const maxValue = Number(me.system.stats.combat.max ?? 0);
        await me.update({ "system.stats.combat.value": maxValue });
        ui.notifications.info(`Reset WILL to max '${maxValue}'`);
      }
    },
    {
      action: "cancel",
      label: "Cancel",
      icon: "fas fa-times"
    }
  ]
});
