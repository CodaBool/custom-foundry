let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

const className = me.system.class?.value;
if (!className) {
  ui.notifications.error("Your character has no class set.");
  return;
}

const backgroundsByClass = {
  Subject: ["indentured", "defector", "pupil", "liberator", "haunted"],
  Analyst: ["curator", "scientist", "medical", "professor", "glint artisan"],
  Agent: ["dog", "executive", "detective", "social worker", "journalist"],
  Enforcer: ["fugitive", "bounty hunter", "mercenary", "wolf", "bodyguard"],
};

const options = backgroundsByClass[className];
if (!options) {
  ui.notifications.error(`Unsupported class: ${className}`);
  return;
}

const existing = me.getFlag("custom-foundry", "background");

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: "Select Background" },
  classes: ["map-prompt"],
  content: `
    <form>
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <div style="font-size:20px; font-weight:700;">Class: ${className}</div>
          <p class="hint" style="margin:4px 0 0 0;">
            Select a background for your character. Does not necessarily need to match what you do currently.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr; gap:8px;">
          ${options.map((bg, i) => `
            <label style="display:flex; align-items:center; gap:10px; padding:6px 8px; border:1px solid rgba(255,255,255,0.12);">
              <input
                type="radio"
                name="selectedBackground"
                value="${bg}"
                ${(existing ? existing === bg : i === 0) ? "checked" : ""}
              >
              <span style="text-transform:capitalize;">${bg}</span>

              <br />

              ${(className === "Enforcer" && bg === "fugitive") ? `<span class="hint">Something in your past is following you</span>` : ""}
              ${(className === "Enforcer" && bg === "bounty hunter") ? `<span class="hint">You've tracked people who don't want to be found</span>` : ""}
              ${(className === "Enforcer" && bg === "mercenary") ? `<span class="hint">You've sold violence to the highest bidder</span>` : ""}
              ${(className === "Enforcer" && bg === "wolf") ? `<span class="hint">You worked as protection in The Shore.</span>` : ""}
              ${(className === "Enforcer" && bg === "bodyguard") ? `<span class="hint">You've kept an important person alive</span>` : ""}

              ${(className === "Agent" && bg === "dog") ? `<span class="hint">You worked as a guide through The Shore</span>` : ""}
              ${(className === "Agent" && bg === "executive") ? `<span class="hint">There's a lot of money to be made here</span>` : ""}
              ${(className === "Agent" && bg === "detective") ? `<span class="hint">You solved problems others would rather stay buried</span>` : ""}
              ${(className === "Agent" && bg === "social worker") ? `<span class="hint">You've provided aid for the forgotten</span>` : ""}
              ${(className === "Agent" && bg === "journalist") ? `<span class="hint">You've chased the truth even when it's dangerous</span>` : ""}

              ${(className === "Analyst" && bg === "curator") ? `<span class="hint">You've catalogued things which you state as invaluable</span>` : ""}
              ${(className === "Analyst" && bg === "scientist") ? `<span class="hint">You pushed the boundaries of knowledge and consequence</span>` : ""}
              ${(className === "Analyst" && bg === "medical") ? `<span class="hint">You kept people alive in places they shouldn't have been</span>` : ""}
              ${(className === "Analyst" && bg === "professor") ? `<span class="hint">You've studied a profession of your choice</span>` : ""}
              ${(className === "Analyst" && bg === "glint artisan") ? `<span class="hint">You know how to work materials that most have never heard of</span>` : ""}

              ${(className === "Subject" && bg === "indentured") ? `<span class="hint">You belong to someone else and they won't let you forget</span>` : ""}
              ${(className === "Subject" && bg === "defector") ? `<span class="hint">You escaped, but they want you back</span>` : ""}
              ${(className === "Subject" && bg === "pupil") ? `<span class="hint">Someone takes great interest in you</span>` : ""}
              ${(className === "Subject" && bg === "liberator") ? `<span class="hint">You're free now and work to help others do the same</span>` : ""}
              ${(className === "Subject" && bg === "haunted") ? `<span class="hint">You can't forget</span>` : ""}


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
        const selected = dialog.element.querySelector('input[name="selectedBackground"]:checked')?.value;
        if (!selected) {
          ui.notifications.warn("Select a background.");
          return;
        }
        return selected;
      }
    },
    {
      action: "cancel",
      label: "Cancel",
      icon: "fas fa-times",
    }
  ]
});

if (!result || result === "cancel") return;

await me.setFlag("custom-foundry", "background", result);
await me.update({ "system.rank.value": result });

ui.notifications.info(`Set background to '${result}'`);
