const flawTable = game.tables.getName("flaw")
const { results } = await flawTable.draw()

let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
    if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

me.update({ "system.other.stressdesc.value": results[0].name })
ui.notifications.info("you now have the flaw '" + results[0].name + "'")
