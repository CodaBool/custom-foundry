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
      const macro = await fromUuid(payload.macroId)
      if (!macro) {
        console.log("macro not found by uuid")
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

    // document proxy
    else if (
      payload.action === "setDocumentFlags" &&
      payload.uuid &&
      typeof payload.uuid === "string" &&
      payload.flags &&
      typeof payload.flags === "object"
    ) {
      if (!game.user.isGM) return

      const doc = fromUuidSync(payload.uuid)
      console.log("set flag", doc, "flags", payload.flags)
      if (!doc) {
        console.error(
          "custom-foundry | document not found for uuid",
          payload.uuid,
        )
        return
      }

      const entries = Object.entries(payload.flags)
      for (const [key, value] of entries) {
        await doc.setFlag("custom-foundry", key, value)
      }
    } else if (
      payload.action === "setOwnership" &&
      payload.uuid &&
      payload.userIds &&
      payload.ownershipLevel
    ) {
      if (!game.user.isGM) return
      const doc = fromUuidSync(payload.uuid)

      if (!doc) {
        console.error(
          "custom-foundry | document not found for uuid",
          payload.uuid,
        )
        return
      }
      const ownership = doc.ownership
      payload.userIds.forEach(id => {
        ownership[id] = payload.ownershipLevel
      })
      doc.update({ ownership })
    } else if (payload.action === "volumeQuery") {
      if (game.user.isGM) return
      let playing
      if (game.playlists.playing.length) {
        playing = game.playlists.playing[0].sounds._source.find(
          p => p.playing,
        )?.volume
      }
      game.socket.emit("module.custom-foundry", {
        action: "log",
        data: {
          playlist: game.settings.get("core", "globalPlaylistVolume"),
          ambient: game.settings.get("core", "globalAmbientVolume"),
          interface: game.settings.get("core", "globalInterfaceVolume"),
          playing,
        },
        msg: `${game.user.name} | playlist: ${game.settings.get("core", "globalPlaylistVolume")} | ambient: ${game.settings.get("core", "globalAmbientVolume")} | interface: ${game.settings.get("core", "globalInterfaceVolume")} | playing: ${playing}`,
      })
    } else if (payload.action === "log") {
      if (!game.user.isGM) return
      console.log(payload.data)
      ui.notifications.info(payload.msg)
    }
  })

  // general code
  CONFIG.debug.hooks = false

  game.settings.set("core", "globalPlaylistVolume", 0.5)
  game.settings.set("core", "globalAmbientVolume", 0.5)
  game.settings.set("core", "globalInterfaceVolume", 0.5)

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
        ui.notifications.info(
          "reload to see token ruler again. May need to recreate tokens and combat",
        )
      }
    },
  })

  game.settings.register("custom-foundry", "volume", {
    scope: "world",
    name: "normalize music",
    type: Number,
    default: 0.08,
    config: true,
    restricted: true,
  })

  game.settings.register("custom-foundry", "pointerCursor", {
    name: 'Pointer Cursor',
    scope: "world",
    config: true,
    type: String,
    default: "codabool/img/heart/junk/cursor.png",
    filePicker: "image",
    requiresReload: true
  });

  game.settings.register("custom-foundry", "grabCursor", {
    name: 'Grab Cursor',
    scope: "world",
    config: true,
    type: String,
    default: "codabool/img/heart/junk/wii-open.png",
    filePicker: "image",
    requiresReload: true
  });

  // sets all playlists to "volume" setting if not already set through a flag "volume"
  setTimeout(() => {
    if (game.user.isGM) {
      const volume = game.settings.get("custom-foundry", "volume")
      let skipped = 0,
        fullUpdate = []

      for (const playlist of game.playlists) {
        const updates = playlist.sounds.filter(
          s => s.volume !== volume && !s.flags?.["custom-foundry"]?.volume,
        )
        if (updates.length) {
          fullUpdate.push(updates)
        } else {
          skipped++
        }
      }
      for (const playlists of fullUpdate) {
        for (const playlist of playlists) {
          playlist.update({ volume: volume })
        }
      }
      console.log(
        `updated ${fullUpdate.length} playlists to ${volume}, skipped ${skipped}`,
      )
    }
  }, 5_000)

  if (game.settings.get("custom-foundry", "ruler")) {
    CONFIG.Token.rulerClass = null
  }

  if (game.system.id === "mosh") await mothership()
})

Hooks.once("init", async () => {
  // OBS specific
  setTimeout(() => {
    if (game.user.name === "OBS") {
      document.querySelector("#fvtt-party-resources-status-bar")?.remove()
    } else {
      const bar = document.querySelector("#fvtt-party-resources-status-bar")
      if (bar) bar.style.opacity = 0.3
    }
  }, 12_000)
  Hooks.on("createChatMessage", async m => {
    if (
      typeof m?.flavor === "string" &&
      m?.flavor.includes("rolls for Initiative!") &&
      game.user.isGM
    ) {
      await m.delete()
    }
  })

  const pointer = game.settings.get("custom-foundry", "pointerCursor");
  const grab = game.settings.get("custom-foundry", "grabCursor");

  Object.assign(CONFIG.cursors, {
      default: pointer,
      ["default-down"]: pointer,
      pointer,
      ["pointer-down"]: pointer,
      grab,
      ["grab-down"]: grab,
  });

  // hide journals with the flag "hidden"
  Hooks.on("renderJournalDirectory", (app, htmlRaw) => {
    let html = htmlRaw
    if (html?.length === 1) {
      html = html[0]
    }
    const j = game.journal._source.filter(
      f => f.flags?.["custom-foundry"]?.hidden,
    )
    if (j.length && !game.user.isGM) {
      j.forEach(entry => {
        const el = html.querySelector(`li[data-entry-id="${entry._id}"]`)
        if (el) el.remove()
      })
    }
  })
})
