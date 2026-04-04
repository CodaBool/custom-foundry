if (typeof pageUuid === "undefined" || typeof skill === "undefined") {
  ui.notifications.error("this macro needs an argument of pageUuid & skill")
  return
}

let me = game.user.character
if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

const uuid = pageUuid;
const skills = me.flags["skill-tree"].skills
  .filter(s => s && s.uuid && s.points !== 0)
  .map(s => {
    const page = fromUuidSync(s.uuid);
    return page ? { ...s, page, name: page.name } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(j => j.name)
//console.log("OWNER", skill.name, skills)
if (!skills.includes(skill.name)) return
const page = fromUuidSync(uuid);
game.socket.emit("module.custom-foundry", {
  action: "setOwnership",
  uuid,
  ownershipLevel: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
  userIds: [game.user.id]
});
setTimeout(() => page.sheet.render(true), 1_200)