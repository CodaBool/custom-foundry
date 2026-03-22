
const user = Array.from(game.users).find(j => j.name === "OBS")
const macroId = Array.from(game.macros).find(m => m.name === "theatre interval")
game.socket.emit(
  "module.custom-foundry",
  {
    action: "executeMacroContentForPlayer",
    macroId: macroId,
  },
  {
    recipients: [user.id],
  },
)
