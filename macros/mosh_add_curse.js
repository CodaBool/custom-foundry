let actor = game.user.character;
if (!actor && game.user.isGM) {
  actor = canvas.tokens.controlled[0]?.actor;
  if (actor) ui.notifications.info("using " + actor.name + " actor");
}
if (!actor) {
  ui.notifications.error("no character");
  return;
}

let curseTable = fromUuidSync("Compendium.custom-foundry.codabool-roll.RollTable.wAtXOW8h6O9uJ1Kj");
if (!curseTable) {
  ui.notifications.error("curse roll table not found");
  return;
}

if (!curseTable?.draw) {
  const doc = await fromUuid(curseTable.uuid);
  doc?.sheet?.render(true);

  await new Promise(resolve => setTimeout(resolve, 200));

  curseTable = fromUuidSync("Compendium.custom-foundry.codabool-roll.RollTable.wAtXOW8h6O9uJ1Kj");

  setTimeout(() => {
    foundry.applications.instances.forEach(a => {
      if (a.id === "RollTableSheet-Compendium-custom-foundry-codabool-roll-RollTable-wAtXOW8h6O9uJ1Kj") {
        a.close();
      }
    });
  }, 200);
}

const draw = await curseTable.draw({ displayChat: false });

if (!draw?.results?.length) {
  ui.notifications.warn("no curse result");
  return;
}

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  whisper: [game.user.id],
  content: `
  <div class="mosh" data-actor-id="${actor.id}">
    <div class="rollcontainer" style="padding: 0">
    <h3 style="font-weight: bold; text-transform: uppercase; color: white; padding: 5px; background: black">${draw.results[0].name}</h3>
      <div class="description" >
      <div style="margin: 5px">
        <div class="body">${draw.results[0].text}</div>
      </div>
      </div>
    </div>
  </div>
  `
});
