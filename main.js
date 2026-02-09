// Hooks.once("init", () => {
//   game.settings.register("maps-in-cyberspace", "seen-chat-message", {
//     scope: "world",
//     restricted: true,
//     type: Boolean,
//     default: false,
//   })
// })
Hooks.once("ready", () => {
  if (!game.user.isGM) return

  console.log("init")
})
