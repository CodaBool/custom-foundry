let target, max, actor = game.user.character;

if (typeof args === "undefined" || !args?.length) {
  if (!actor && game.user.isGM) {
    actor = canvas.tokens.controlled[0]?.actor;
    if (actor) ui.notifications.info("using " + actor.name + " actor");
  }
  if (!actor) {
    ui.notifications.error("no character");
    return;
  }

  // Fallbacks when running the macro directly
  target = actor.system?.stats?.combat?.value ?? 0;
  max = actor.system?.stats?.combat?.max ?? target;
} else {
  actor = fromUuidSync(args[0].actorUuid);
  target = args[0].combatValue;
  max = args[0].combatMax;
}

if (!actor) {
  ui.notifications.error("no actor");
  return;
}

if (actor.system?.stats?.combat?.value === 0) {
  ui.notifications.error("you lack the will for this")
  return;
}

const ROMAN_TO_INT = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
};

function getRomanLevelFromName(name = "") {
  const match = name.match(/\b(I|II|III|IV|V)\b\s*$/);
  return match ? ROMAN_TO_INT[match[1]] ?? 0 : 0;
}

function getPowerBaseName(name = "") {
  return name.replace(/\s+(I|II|III|IV|V)\s*$/, "").trim();
}

async function choosePower(powerSkills) {
  const eligible = powerSkills
    .filter(s => s && s.uuid && s.points !== 0)
    .map(s => {
      const page = fromUuidSync(s.uuid);
      return page ? { ...s, page, name: page.name } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!eligible.length) {
    ui.notifications.warn("No powers with points found.");
    return null;
  }

  const formHtml = `
    <form>
      <div style="display:flex;flex-direction:column;gap:0.4rem;">
        ${eligible.map((p, i) => `
          <label style="display:flex;align-items:center;gap:0.5rem;">
            <input type="radio" name="powerUuid" value="${p.uuid}" ${i === 0 ? "checked" : ""}>
            <span>${p.name}</span>
          </label>
        `).join("")}
      </div>
    </form>
  `;

  const selectedUuid = await foundry.applications.api.DialogV2.wait({
    window: { title: "Select Power" },
    content: formHtml,
    buttons: [
      {
        action: "confirm",
        label: "Use Power",
        default: true,
        callback: (_event, button, dialog) => {
          const form = dialog.element.querySelector("form");
          const fd = new FormDataExtended(form);
          return fd.object.powerUuid ?? null;
        }
      },
      {
        action: "cancel",
        label: "Cancel",
        callback: () => null
      }
    ],
    close: () => null
  });

  if (!selectedUuid) return null;

  return eligible.find(p => p.uuid === selectedUuid) ?? null;
}

async function updateStressFromPower(actor, level) {
  const stressData = actor.system?.other?.stress;
  if (!stressData) return null;

  const current = Number(stressData.value ?? 0);
  const min = Number(stressData.min ?? 0);
  const max = Number(stressData.max ?? current + level);
  const next = Math.max(min, Math.min(max, current + level));

  await actor.update({
    "system.other.stress.value": next
  });

  return { from: current, to: next };
}

async function removeBleedEffects(actor) {
  const bleedingItems = actor.items.filter(i => (i.name ?? "").trim() === "Bleeding");

  if (!bleedingItems.length) return 0;

  await actor.deleteEmbeddedDocuments("Item", bleedingItems.map(i => i.id));
  return bleedingItems.length;
}

async function show3dDiceIfAvailable(roll) {
  if (game.dice3d?.showForRoll) {
    try {
      await game.dice3d.showForRoll(roll, game.user, true);
    } catch (err) {
      console.warn("Dice So Nice showForRoll failed:", err);
    }
  }
}

function stripHtmlStyles(html = "") {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("[style]").forEach(el => el.removeAttribute("style"));
  return doc.body.innerHTML
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getSecretPowerEffects() {
  return {
    "Clairvoyance": {
      effect: "The player hears the voice of someone from their past.",
      fail: "The player grows an extra eye."
    },
    "Meditation": {
      effect: "The player's breath fogs the air with impossible symbols.",
      fail: "The player's skin hardens into pale, bark-like plates."
    },
    "Projection": {
      effect: "The player's shadow moves a second too late.",
      fail: "The player's reflection stops matching their body."
    },
    "Telepathy": {
      effect: "Nearby minds briefly echo with an old memory.",
      fail: "The player's thoughts leak aloud in fragments."
    },
    "Psychometry": {
      effect: "Objects nearby become charged with emotional residue.",
      fail: "The player's fingertips blacken with static bruising."
    },
    "Precognition": {
      effect: "The player speaks one sentence a moment before it happens.",
      fail: "The player loses all sense of sequence and déjà vu overwhelms them."
    }
  };
}

function getSecretEffectText(powerBaseName, wasSuccess) {
  const powerEffects = getSecretPowerEffects();
  const fallback = {
    effect: "The player is marked by a subtle psychic disturbance.",
    fail: "The player suffers a visible psychic distortion."
  };

  const entry = powerEffects[powerBaseName] ?? fallback;
  return wasSuccess ? entry.effect : entry.fail;
}

function getActiveGMUserIds() {
  return game.users
    .filter(u => u?.isGM && u?.active)
    .map(u => u.id);
}

async function whisperSecretToGMs({ actor, powerName, powerBaseName, richResult }) {
  const gmIds = getActiveGMUserIds();
  if (!gmIds.length) return;

  const secretText = getSecretEffectText(powerBaseName, richResult.success);
  const label = richResult.success ? "After Effect" : "Failure Effect";

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    whisper: gmIds,
    content: await TextEditor.enrichHTML(`
      <div class="mosh" data-actor-id="${actor.id}">
        <div class="rollcontainer">
          <div class="flexrow" style="margin-bottom:5px">
            <div class="rollweaponh1">Secret GM Note</div>
            <div style="text-align:right">
              <img class="roll-image" src="systems/mosh/images/icons/ui/attributes/intellect.png">
            </div>
          </div>

          <div style="font-size:1.1rem;margin-top:-10px;margin-bottom:5px">
            <strong>${label}</strong>
          </div>

          <div class="description" style="margin-bottom:10px">
            <div class="body">
              <strong>${actor.name}</strong> used <strong>${powerName}</strong>.
            </div>
          </div>

          <div class="description" style="margin-bottom:20px">
            <div class="body">${secretText}</div>
          </div>
        </div>
      </div>
    `, { async: true })
  });
}

function getPowerImage(baseName) {
  if (baseName.toLowerCase() === "meditation") {
    return "systems/mosh/images/icons/ui/attributes/intellect.png";
  }
  return "systems/mosh/images/icons/ui/attributes/intellect.png";
}


async function reduceWillFromRoll(actor, amount) {
  const current = Number(actor.system?.stats?.combat?.value ?? 0);
  const next = Math.max(0, current - Number(amount || 0));
  await actor.update({
    "system.stats.combat.value": next
  });
  return { from: current, to: next };
}

function buildExtraHtml(lines = []) {
  const filtered = lines.filter(Boolean);
  if (!filtered.length) return "";
  return filtered.join("<br>");
}

async function createCombinedPowerMessage({
  actor,
  title,
  image,
  outcomeLabel = "",
  resultBody = "",
  roll,
  bodyHtml = "",
  extraHtml = ""
}) {
  let rollHtml = roll ? await roll.render() : "";

  if (rollHtml) {
    rollHtml = rollHtml.replace(
      /\b1d100\b/g,
      `1d100 <i class="fas fa-less-than"></i> ${target}`
    );
  }

  const content = await TextEditor.enrichHTML(`
    <div class="mosh" data-actor-id="${actor.id}">
      <div class="rollcontainer">
        <div class="flexrow" style="margin-bottom:5px">
          <div class="rollweaponh1">${title}</div>
          <div style="text-align:right">
            <img class="roll-image" src="${image}">
          </div>
        </div>

        ${outcomeLabel ? `
          <div style="font-size:1.1rem;margin-top:-10px;margin-bottom:5px">
            <strong>${outcomeLabel}</strong>
          </div>
        ` : ""}

        ${resultBody ? `
          <div class="description" style="margin-bottom:10px">
            <div class="body">${resultBody}</div>
          </div>
        ` : ""}

        ${rollHtml ? `
          <div style="margin-bottom:10px">
            ${rollHtml}
          </div>
        ` : ""}

        ${bodyHtml ? `
          <div class="description" style="margin-bottom:10px">
            <div class="body">${bodyHtml}</div>
          </div>
        ` : ""}

        ${extraHtml ? `
          <div class="description" style="margin-bottom:20px">
            ${extraHtml}
          </div>
        ` : ""}
      </div>
    </div>
  `, { async: true });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}


/* -------------------------------------------- */
/* Pull available powers                        */
/* -------------------------------------------- */


const powerSkills = actor?.flags?.["skill-tree"]?.skills ?? []
const chosenPower = await choosePower(powerSkills);
if (!chosenPower) {
  ui.notifications.info("Power selection cancelled.");
  return;
}

const powerPage = chosenPower.page;
const powerName = powerPage.name ?? "Unknown Power";
const powerBaseName = getPowerBaseName(powerName);
const powerLevel = getRomanLevelFromName(powerName);

if (!powerLevel) {
  ui.notifications.warn(`Could not parse Roman numeral from "${powerName}".`);
}

/* -------------------------------------------- */
/* Main check roll                              */
/* -------------------------------------------- */

const roll = await new Roll("1d100").evaluate();

const zeroBased = true;
const checkCrit = true;
const richResult = actor.parseRollResult("1d100", roll, zeroBased, checkCrit, target, "<=");

let outcomeLabel = "";
let resultBody = "";
let extraOutcomeBody = "";


const miscast = game.macros.getName("mosh roll miscast")
if (!miscast) {
  ui.notifications.error("Import the Roll Miscast macro");
  return;
}
const changeWill = game.macros.getName("mosh change will max")
if (!changeWill) {
  ui.notifications.error("Import the Change Will macro");
  return;
}

if (richResult.success && richResult.critical) {
  outcomeLabel = "CRITICAL SUCCESS!";
  resultBody = 'You rolled a <strong>critical success</strong> at or under your <strong>Will</strong>.';
  extraOutcomeBody = `<div class="body">You gain confidence in your ability, @UUID[${changeWill.uuid}]{Increase your max Will}</div><br><br>`

  // TODO: increase max will here
} else if (richResult.success && !richResult.critical) {
  outcomeLabel = "SUCCESS!";
  resultBody = 'You rolled at or under your <strong>Will</strong>.';
  extraOutcomeBody = '<div class="body">You gain confidence in your ability</div>';
  changeWill.execute({add: "1"})

  // TODO: increase max will here
} else if (!richResult.success && richResult.critical) {

  const panicCheck = game.macros.getName("Panic Check")
  if (!panicCheck) {
    ui.notifications.error("Import the Panic Check macro");
    return;
  }
  const curse = game.macros.getName("mosh roll curse")
  if (!curse) {
    ui.notifications.error("Import the Roll Curse macro");
    return;
  }

  outcomeLabel = "CRITICAL MISCAST!";
  resultBody = 'You rolled a <strong>critical failure</strong>.';
  extraOutcomeBody = `
      <div class="body">Your power catastrophically misfires, roll a @UUID[${curse.uuid}]{curse}</div><br><br>
      <div class="body">Additionally roll a @UUID[${panicCheck.uuid}]{panic check}</div>
    `

} else {
  outcomeLabel = "MISCAST!";
  resultBody = 'You did not roll at or under your <strong>Will</strong>.';
  extraOutcomeBody = `<div class="body">Roll a @UUID[${miscast.uuid}]{miscast}</div><br><br>`
}


const rollResultHtml = `
  <div class="body">${resultBody}</div>
  ${extraOutcomeBody ? `<div class="body" style="margin-top:8px">${extraOutcomeBody}</div>` : ""}
`;

/* -------------------------------------------- */
/* Stress & Will automation                     */
/* -------------------------------------------- */

const stressChange = await updateStressFromPower(actor, powerLevel);
// round down to nearest 10 for will cost
const willCost = Math.floor(roll.total / 10) * 10;
const willChange = await reduceWillFromRoll(actor, willCost);
console.log(willCost, willChange)
await whisperSecretToGMs({
  actor,
  powerName,
  powerBaseName,
  richResult
});

/* -------------------------------------------- */
/* Power card / special automation              */
/* -------------------------------------------- */

const rawPageHtml = powerPage?.text?.content ?? "";
const pageHtml = stripHtmlStyles(rawPageHtml);
const image = getPowerImage(powerBaseName);

const baseExtraLines = [
  `Stress increased from <strong>${stressChange.from}</strong> to <strong>${stressChange.to}</strong>.`,
  `Will decreased from <strong>${willChange.from}</strong> to <strong>${willChange.to}</strong>.`,
];

await show3dDiceIfAvailable(roll);

if (powerName === "Meditation I") {
  const healRoll = await new Roll("1d5 + 3").evaluate();
  await show3dDiceIfAvailable(healRoll);

  const currentHp = Number(actor.system?.health?.value ?? 0);
  const maxHp = Number(actor.system?.health?.max ?? currentHp);
  const healedTo = Math.min(maxHp, currentHp + healRoll.total);

  await actor.update({ "system.health.value": healedTo });

  const removedBleedCount = await removeBleedEffects(actor);
  const healRollHtml = await healRoll.render();

  const customMeditationHtml = `
    Accelerate growth. Heal and stop any bleed. As a by product your hair and nails rapidly grow as well.
  `;

  const extraLines = [
    healRollHtml,
    `Health increased from <strong>${currentHp}</strong> to <strong>${healedTo}</strong>.`,
    removedBleedCount
      ? `Removed <strong>bleed</strong>.`
      : `No Bleeding items were found.`,
    ...baseExtraLines
  ];



  await createCombinedPowerMessage({
    actor,
    title: powerName,
    image,
    outcomeLabel,
    resultBody: rollResultHtml,
    roll,
    bodyHtml: customMeditationHtml,
    extraHtml: buildExtraHtml(extraLines)
  });
}
else if (powerName === "Meditation III") {
  const minuteRoll = await new Roll("1d10").evaluate();
  await show3dDiceIfAvailable(minuteRoll);

  const minuteRollHtml = await minuteRoll.render();

  const customMeditationHtml = `
    A chosen sense becomes extremely sensitive for 1d10 minutes. If choosing vision, you can see electrical fields.
    May also choose to control the need for a bodily function (e.g. lungs, heart, digestion).
  `;

  const extraLines = [
    minuteRollHtml,
    `Duration: <strong>${minuteRoll.total}</strong> minute${minuteRoll.total === 1 ? "" : "s"}.`,
    ...baseExtraLines
  ];

  await createCombinedPowerMessage({
    actor,
    title: powerName,
    image,
    outcomeLabel,
    resultBody: rollResultHtml,
    roll,
    bodyHtml: customMeditationHtml,
    extraHtml: buildExtraHtml(extraLines)
  });
}
else {
  await createCombinedPowerMessage({
    actor,
    title: powerName,
    image,
    outcomeLabel,
    resultBody: rollResultHtml,
    roll,
    bodyHtml: pageHtml,
    extraHtml: buildExtraHtml(baseExtraLines)
  });
}
