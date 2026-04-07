let me = game.user.character;

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor;
  if (me) ui.notifications.info("using " + me.name + " actor");
}
if (!me) {
  ui.notifications.error("no character");
  return;
}

const MAX_SKILLS = 2;

const skills = [
  "psychology",
  "linguistics",
  "history",
  "field medicine",
  "biology",
  "chemistry",
  "electronics",
  "engineering",
  "piloting",
  "ranged combat",
  "close quarters combat",
  "athletics",
  "mathematics",
  "survival",
  "art",
  "infiltration",
];

// exit early if actor already has any skill items
const existingSkills = me.items.filter(i => i.type === "skill");
if (existingSkills.length > 0) {
  ui.notifications.warn("You already have skills for this character.");
  return;
}

const confirmed = await foundry.applications.api.DialogV2.confirm({
  window: { title: "Select Skills" },
  classes: ["map-prompt"],
  content: `
    <form>
      <p style="text-align: center">Select exactly <b>${MAX_SKILLS}</b> skill${MAX_SKILLS === 1 ? "" : "s"}</p>
      <p class="hint" style="text-align:center">You will gain <b>[+]</b> on relevant rolls</p>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px">
        ${skills.map(skill => `
          <label style="display: flex; align-items: center; gap: 10px">
            <input type="checkbox" name="selectedSkills" value="${skill}">
            <span>${skill}</span>
          </label>
        `).join("")}
      </div>
    </form>
  `,
});

if (!confirmed) return;

const selectedSkills = [
  ...document.querySelectorAll('input[name="selectedSkills"]:checked'),
].map(e => e.value);

if (selectedSkills.length !== MAX_SKILLS) {
  ui.notifications.error(
    `Select exactly ${MAX_SKILLS} skill${MAX_SKILLS === 1 ? "" : "s"} and try again.`
  );
  return;
}

const items = selectedSkills.map(skill => ({
  name: skill,
  type: "skill",
  system: {
    bonus: 10,
    description: "",
    prerequisite_ids: [],
    rank: "Trained",
    type: "skill",
  },
}));

await me.createEmbeddedDocuments("Item", items);

ui.notifications.info(
  "Added " + items.length + " skills: " + selectedSkills.join(", ")
);
