let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

const classes = ["Analyst", "Enforcer", "Agent", "Subject"]
// todo: update these when moving to compendium
const classUuid = {
  Subject: "Item.Mp9k44R7ZmZ7BRvE",
  Analyst: "Item.6Af6W8ONgnnpw050",
  Agent: "Item.WSNCI7gpdvj9TF1x",
  Enforcer: "Item.eQMxTXShiCGl360a",
};
const existing = me.system.class?.value

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: "Select Class" },
  classes: ["map-prompt"],
  content: `
    <form>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <div style="font-size:20px; font-weight:700;">Select Class</div>
          <p class="hint" style="margin:4px 0 0 0;">
            What kind of role would you like to play?
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:8px;">
          ${classes.map((className, i) => `
            <label style="display:flex; align-items:center; gap:10px; padding:6px 8px; border:1px solid rgba(255,255,255,0.12);">
              <input
                type="radio"
                name="selectedClass"
                value="${className}"
                ${(existing ? existing === className : i === 0) ? "checked" : ""}
              >
              <span>${className}</span>
              <br />

              ${className === "Analyst" ? `<span class="hint" style="">A specialist of knowledge, you solves problems through logic.</span>` : ""}
              ${className === "Enforcer" ? `<span class="hint" style="">A hardened combatant who solves problems through dominance.</span>` : ""}
              ${className === "Agent" ? `<span class="hint" style="">A trained operative who solves problems using their cunning.</span>` : ""}
              ${className === "Subject" ? `<span class="hint" style="">A vulnerable test candidate, you solve problems by will alone.</span>` : ""}
            </label>
          `).join("")}
        </div>
      </div>
    </form>
  `,
  buttons: [
    {
      action: "confirm",
      label: "Confirm",
      icon: "fas fa-check",
      default: true,
      callback: async (event, button, dialog) => {
        const selected = dialog.element.querySelector('input[name="selectedClass"]:checked')?.value
        if (!selected) {
          ui.notifications.warn("Select a class.")
          return
        }
        return selected
      }
    },
    {
      action: "cancel",
      label: "Cancel",
      icon: "fas fa-times",
    }
  ]
})

if (!result || result === "cancel") return

await me.update({
  "system.class.value": result,
  "system.class.uuid": classUuid[result],
})

ui.notifications.info(`Set class to '${result}'`)
