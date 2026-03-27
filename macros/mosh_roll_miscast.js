let actor = game.user.character;
if (!actor && game.user.isGM) {
  actor = canvas.tokens.controlled[0]?.actor;
  if (actor) ui.notifications.info("using " + actor.name + " actor");
}
if (!actor) {
  ui.notifications.error("no character");
  return;
}

let miscastTable = fromUuidSync("Compendium.custom-foundry.codabool-roll.RollTable.cLsOJM41cQqlClqi");
if (!miscastTable) {
  ui.notifications.error("miscast roll table not found");
  return;
}

if (!miscastTable?.draw) {
  const doc = await fromUuid(miscastTable.uuid);
  doc?.sheet?.render(true);

  await new Promise(resolve => setTimeout(resolve, 200));

  miscastTable = fromUuidSync("Compendium.custom-foundry.codabool-roll.RollTable.cLsOJM41cQqlClqi");

  setTimeout(() => {
    foundry.applications.instances.forEach(a => {
      if (a.id === "RollTableSheet-Compendium-custom-foundry-codabool-roll-RollTable-cLsOJM41cQqlClqi") {
        a.close();
      }
    });
  }, 200);
}

const draw = await miscastTable.draw();

if (!draw?.results?.length) {
  ui.notifications.warn("no miscast result");
  return;
}
