let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
    if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

//const flawTable = game.tables.getName("flaw")

let flawTable = fromUuidSync("Compendium.custom-foundry.codabool-roll.RollTable.JVXm2DGBp4H2B3Me")

if (!flawTable?.draw) {
  // console.log("table?", flawTable)
  // a player must open the table first
  const doc = await fromUuid(flawTable.uuid)
  doc?.sheet?.render(true)
  flawTable = fromUuidSync("Compendium.custom-foundry.codabool-roll.RollTable.JVXm2DGBp4H2B3Me")

  // close the opened rolltable sheet (Application V2)
  setTimeout(() => {
    foundry.applications.instances.forEach(a => {if (a.id === "RollTableSheet-Compendium-custom-foundry-codabool-roll-RollTable-JVXm2DGBp4H2B3Me") a.close()}
    )
  }, 200)

}
const { results } = await flawTable.draw()

me.setFlag("custom-foundry", "flaw", results[0].name)
// me.update({ "system.other.flaw.value": results[0].name })
ui.notifications.info("you now have the flaw '" + results[0].name + "'")
