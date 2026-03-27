let actor = game.user.character;
if (!actor && game.user.isGM) {
  actor = canvas.tokens.controlled[0]?.actor;
  if (actor) ui.notifications.info("using " + actor.name + " actor");
}
if (!actor) {
  ui.notifications.error("no character");
  return;
}

let amount;
let roll = null;

if (typeof add !== "undefined") {
  amount = Number(add);
  if (Number.isNaN(amount)) {
    ui.notifications.error("invalid add value");
    return;
  }
} else {
  roll = await new Roll("1d10").evaluate();
  amount = roll.total;
}

const currentMax = Number(actor.system?.stats?.combat?.max ?? 0);
const nextMax = currentMax + amount;

await actor.update({
  "system.stats.combat.max": nextMax
});


let rollHtml = "";
if (typeof add === "undefined" && roll) {
  rollHtml = await roll.render();
}

const content = await TextEditor.enrichHTML(`
  <div class="mosh" data-actor-id="${actor.id}">
    <div class="rollcontainer">
      <div class="flexrow" style="margin-bottom:5px">
        <div class="rollweaponh1">Increase Max Will</div>
        <div style="text-align:right">
          <img class="roll-image" src="systems/mosh/images/icons/ui/attributes/intellect.png">
        </div>
      </div>

      <div style="font-size:1.1rem;margin-top:-10px;margin-bottom:5px">
        <strong>WILL INCREASED!</strong>
      </div>

      ${rollHtml ? `
        <div style="margin-bottom:10px">
          ${rollHtml}
        </div>
      ` : ""}

      <div class="description" style="margin-bottom:20px">
        Max Will increased from <strong>${currentMax}</strong> to <strong>${nextMax}</strong>.
      </div>
    </div>
  </div>
`, { async: true });

if (roll) {
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
} else {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}
