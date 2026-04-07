let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
    if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

const flawTable = await fromUuid("Compendium.custom-foundry.codabool-roll.RollTable.JVXm2DGBp4H2B3Me")
const { results } = await flawTable.draw()

me.setFlag("custom-foundry", "flaw", results[0].name)
ui.notifications.info("you now have the flaw '" + results[0].name + "'")
