const recipients = game.users.filter(u => u.active).map(u => u.id)
const pretty = recipients.map(u => game.users.get(u).name)
const macro = Array.from(game.macros).find(m => m.name === "pixelate")
console.log("sending macro", macro.name, "to", pretty)
game.socket.emit(`module.custom-foundry`, {
        action: "executeMacroContentForPlayer",
        macroId: macro.id,
        gmContext: { isTableGridArg: args[0], blockMin: args[1] || 3, blockMax: args[2] || 3.02, cycleMs: args[3] || 5000}
    }
, { recipients });
