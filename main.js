// Hooks.once('init', () => {
// })

import { mothership } from "./mothership.js"

Hooks.once("ready", async () => {
  if (!game.socket) return
  game.socket.on(`module.custom-foundry`, async payload => {
    // macro proxy
    if (
      payload.action === "executeMacroContentForPlayer" &&
      payload.macroId &&
      typeof payload.macroId === "string"
    ) {
      let macro = game.macros.get(payload.macroId);
      if (!macro) {
        console.log("macro not found by id attempting uuid");
        macro = fromUuidSync(payload.macroId);
        if (!macro) {
          console.log("macro not found by id or uuid");
          return;
        }
      }

      const command = macro.command;
      if (macro.type === "script") {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const func = command.includes("await")
          ? new AsyncFunction("gmContext", command)
          : new Function("gmContext", command);

        await func.call(globalThis, payload.gmContext || {});
      }
    }

    // document proxy
    else if (
      payload.action === "setDocumentFlags" &&
      payload.uuid &&
      typeof payload.uuid === "string" &&
      payload.flags &&
      typeof payload.flags === "object"
    ) {
      if (!game.user.isGM) return;

      
      const doc = fromUuidSync(payload.uuid);
      console.log("set flag", doc, "flags", payload.flags)
      if (!doc) {
        console.error("custom-foundry | document not found for uuid", payload.uuid);
        return;
      }

      const entries = Object.entries(payload.flags);
      for (const [key, value] of entries) {
        await doc.setFlag("custom-foundry", key, value);
      }
    }
  });




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


Hooks.once("init", async () => {
  // hide some journals
  Hooks.on('renderJournalDirectory', (app, htmlRaw) => {
    let html = htmlRaw
    if (game.release.generation === 12 || html?.length === 1) {
      html = html[0]
    }
    const j = game.journal._source.filter(f => f.flags?.["custom-foundry"]?.hidden)
    if (j.length && !game.user.isGM) {
      j.forEach(entry => {
        const el = html.querySelector(`li[data-entry-id="${entry._id}"]`)
        if (el) el.remove()
      })
    }
  });
})