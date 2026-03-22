// Hooks.once('init', () => {
// })

import { mothership } from "./mothership.js"

Hooks.once("ready", async () => {
  if (!game.socket) return
  game.socket.on(`module.custom-foundry`, async payload => {
    if (payload.action === "executeMacroContentForPlayer" && payload.macroId && typeof payload.macroId === "string") {
      let macro = game.macros.get(payload.macroId)
      if (!macro) {
        console.log("macro not found by id attempting uuid")
        macro = fromUuidSync(payload.macroId)
        if (!macro) {
          console.log("macro not found by id or uuid")
          return
        }
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

  game.settings.register("custom-foundry", "ruler", {
    scope: "world",
    name: "turn off token ruler",
    type: Boolean,
    default: false,
    config: true,
    restricted: true,
    onChange: value => {
      if (value) {
        CONFIG.Token.rulerClass = null
      } else {
        ui.notifications.info("reload to see token ruler again. May need to recreate tokens and combat")
      }
    }
  })


  if (game.settings.get("custom-foundry", "ruler")) {
    CONFIG.Token.rulerClass = null
  }

  if (game.system.id === "mosh") await mothership()
})
