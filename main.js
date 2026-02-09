// Hooks.once('init', () => {
// })

Hooks.once("ready", () => {
  if (!game.socket) return
  game.socket.on(`module.custom-foundry`, async payload => {
    if (payload.action === "executeMacroContentForPlayer" && payload.macroId && typeof payload.macroId === "string") {
      const macro = game.macros.get(payload.macroId)
      if (!macro) {
        console.log("macro not found")
        return
      }
      const command = macro.command
      if (macro.type === "script") {
        const AsyncFunction = Object.getPrototypeOf(
          async function () {},
        ).constructor
        const func = command.includes("await")
          ? new AsyncFunction("gmContext", command)
          : new Function("gmContext", command)
        await func.call(globalThis, payload.gmContext || {})
      }
    }
  })
})
