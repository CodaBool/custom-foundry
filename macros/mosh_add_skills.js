let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

const skills = [
  "psychology",
  "linguistics",
  "history",
  "field medicine",
  "biology",
  "chemistry",
  "computers",
  "electronics",
  "engineering",
  "jury-rigging",
  "piloting",
  "ranged combat",
  "close quarters combat",
  "athletics",
  "mathematics",
  "survival",
  "operations",
  "infiltration",
]

const confirm = await foundry.applications.api.DialogV2.confirm({
  window: { title: "Pick a user to see map" },
  classes: ["map-prompt"],
  content: `
      <form>
        <p class="hint">Select 2 <b>Skills</b></p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px">
          ${skills
            .map(
              skill => `
            <label style="display: flex; align-items: center; gap: 10px">
              <input type="checkbox" name="selectedSkills" value="${skill}">
              <span>${skill}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </form>
    `,
})

// console.log("confirm", confirm)
if (confirm) {
  const skillIds = [
    ...document.querySelectorAll('input[name="selectedSkills"]:checked'),
  ].map(e => e.value)
  console.log("values:", skillIds)
  const items = skillIds.map(skill => ({
    name: skill,
    type: "skill",
    system: {
      bonus: 10,
      description: "",
      prerequisite_ids: [],
      rank: "Trained",
      type: "skill",
    },
  }))
  me.createEmbeddedDocuments("Item", items)
  ui.notifications.info(
    "Added " + items.length + " skills " + skillIds.join(", "),
  )
}
