let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

me.sheet.render(true)

setTimeout(() => {
  document.querySelector('a[data-tab="relationships"]')?.click()
  ui.notifications.info("Please roll a random relationship for each other player")
}, 1_000)
