export async function mothership() {


  // Hooks.on("renderApplication", async (app, htmlRaw) => {
  //   console.log("app1", htmlRaw)

  // })


  // Hooks.on("renderApplicationV2", async (app, htmlRaw) => {
  //   console.log("app2", htmlRaw)
  // })


const MODULE_ID = "custom-foundry";
const STAT_OPTIONS = ["speed", "strength", "will"];

Hooks.on("renderItemSheet", (app, htmlRaw) => {
  const root = htmlRaw?.[0];
  if (!root) return;

  // prevent duplicate injection on re-renders
  if (root.querySelector("#custom-foundry-stat-config")) return;

  // safer than name lookup, but we'll also verify below
  // const sourceItem = app.document;
  // if (!sourceItem) return;

  // fallback / verification lookup like you mentioned
  const item = game.items.getName(app.document.name);

  const currentStat = item.getFlag(MODULE_ID, "stat") || "";

  const block = document.createElement("div");
  block.id = "custom-foundry-stat-config";
  block.style.margin = "8px 0";
  block.style.padding = "8px";
  block.style.border = "1px solid rgba(255,255,255,0.15)";
  block.style.borderRadius = "6px";

  block.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <label for="custom-foundry-stat-select" style="font-weight:700;">
        Custom Foundry Stat
      </label>

      <p class="hint" style="margin:0;">
        Choose which stat this item rolls with. Valid options are:
        <strong>speed</strong>, <strong>strength</strong>, or <strong>will</strong>.
      </p>

      <select id="custom-foundry-stat-select" style="width:100%;">
        <option value="" ${!currentStat ? "selected" : ""}>-- none --</option>
        ${STAT_OPTIONS.map(stat => `
          <option value="${stat}" ${currentStat === stat ? "selected" : ""}>
            ${stat.toUpperCase()}
          </option>
        `).join("")}
      </select>
    </div>
  `;

  const select = block.querySelector("#custom-foundry-stat-select");

  select.addEventListener("change", async (ev) => {
    const value = ev.currentTarget.value;


    try {


      if (game.user.isGM) {
        if (!value) {
          await item.unsetFlag(MODULE_ID, "stat");
          ui.notifications.info(`Cleared stat on '${item.name}'`);
          return;
        }

        await item.setFlag(MODULE_ID, "stat", value);
      } else {
        game.socket.emit("module.custom-foundry", {
          action: "setDocumentFlags",
          uuid: item.uuid,
          flags: {
            stat: value,
          }
        });
      }
      ui.notifications.info(`Set '${item.name}' stat to '${value}'`);
    } catch (err) {
      console.error("custom-foundry stat flag update failed", err);
      ui.notifications.error("Failed to update item stat.");
    }
  });

  // pick a place to inject it
  const form =
    root.querySelector("form") ||
    root.querySelector(".window-content") ||
    root;

  form.appendChild(block);
});

Hooks.on("renderActorSheet", (app, htmlRaw) => {
  const root = htmlRaw?.[0];
  if (!root?.id?.includes("Mothership")) return;

  const content = root.querySelector(".window-content");
  if (!content) return;

  const actor = getSheetActor(app);
  if (!actor) return;

  // Clean up old observer if this sheet re-rendered
  if (app._customFoundryObserver) {
    app._customFoundryObserver.disconnect();
    app._customFoundryObserver = null;
  }

  if (app._customFoundryFrame) {
    cancelAnimationFrame(app._customFoundryFrame);
    app._customFoundryFrame = null;
  }

  function getSheetActor(app) {
    let me = game.user.character;

    if (!me && game.user.isGM) {
      me = canvas.tokens.controlled[0]?.actor;
      if (!me) {
        ui.notifications.error("no character");
        return null;
      }
      if (app.actor?.uuid !== me.uuid) {
        ui.notifications.error("selected wrong character");
        return null;
      }
    }

    return me ?? null;
  }

  function relabelHeaderField(inputSelector, newLabel) {
    const input = root.querySelector(inputSelector);
    const label = input?.closest("div")?.previousElementSibling;

    if (label?.classList.contains("headerinputtext") && label.textContent !== newLabel) {
      label.textContent = newLabel;
    }

    return input;
  }

  function applyStaticSheetChanges() {
    // pronouns -> flaw
    const pronounInput = relabelHeaderField('input[name="system.pronouns.value"]', "Flaw");
    if (pronounInput) {
      const flaw = actor.getFlag("custom-foundry", "flaw") || "";
      if (pronounInput.value !== flaw) pronounInput.value = flaw;
      if (!pronounInput.readOnly) pronounInput.readOnly = true;
    }

    // rank -> background
    relabelHeaderField('input[name="system.rank.value"]', "Background");

    // credits -> notes
    relabelHeaderField('input[name="system.credits.value"]', "Notes (Money)");

    // skill tree -> Abilities
    const btn = root.querySelector(".skill-tree-header-button");
    if (btn) {
      const textNode = [...btn.childNodes].find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
      );

      if (textNode && textNode.textContent.trim() !== "Abilities") {
        textNode.textContent = "Abilities";
      }
    }
  }

  function rewriteCombatAsWill() {
    const statWrappers = root.querySelectorAll(".mainstatwrapper");
    const wrapper = statWrappers[3];
    if (!wrapper) return;

    const leftBlock = wrapper.querySelector(".resource.mainstat");
    const label = wrapper.querySelector(".mainstattext");

    // original combat value input
    const leftInput =
      wrapper.querySelector('input[name="system.stats.combat.value"]') ||
      wrapper.querySelector(".circle-input");

    // original combat mod / right-side input, which we are repurposing as max
    const rightInput =
      wrapper.querySelector('input[name="system.stats.combat.max"]') ||
      wrapper.querySelector(".mainstatmod-input");

    const oldSeparator = wrapper.querySelector(".mainstatmod-title");

    if (!leftBlock || !leftInput || !rightInput) return;

    // relabel Combat -> WILL
    if (label) {
      if (label.textContent.trim() !== "WILL") label.textContent = "WILL";
      label.dataset.key = "will";
      label.dataset.label = "Will";
    }

    // layout styling
    leftBlock.style.display = "flex";
    leftBlock.style.alignItems = "center";
    leftBlock.style.gap = "6px";

    const mainLabel = wrapper.querySelector(".mainstatlabel");
    if (mainLabel) mainLabel.style.width = "50%";

    leftInput.style.borderRadius = "6px";

    // remove old "+" title if present
    if (oldSeparator) oldSeparator.remove();

    // create slash once
    let slash = wrapper.querySelector('[data-custom-foundry="combat-slash"]');
    if (!slash) {
      slash = document.createElement("div");
      slash.setAttribute("data-custom-foundry", "combat-slash");
      slash.textContent = "/";
      slash.style.fontSize = "24px";
      slash.style.margin = "0";
      slash.style.display = "flex";
      slash.style.alignItems = "center";
      slash.style.alignSelf = "center";
      leftInput.after(slash);
    }

    // make right input look like the left input
    rightInput.className = leftInput.className;
    rightInput.style.cssText = leftInput.style.cssText;
    rightInput.style.textAlign = "center";
    rightInput.style.borderRadius = "6px";
    rightInput.name = "system.stats.combat.max";

    // create wrapper for max input once
    let rightWrap = wrapper.querySelector('[data-custom-foundry="combat-max-wrap"]');
    if (!rightWrap) {
      rightWrap = document.createElement("div");
      rightWrap.setAttribute("data-custom-foundry", "combat-max-wrap");
      rightWrap.style.display = "inline-flex";
      rightWrap.style.flexDirection = "column";
      rightWrap.style.alignItems = "center";
      rightWrap.style.marginTop = "18px";
    }

    if (rightInput.parentNode !== rightWrap) {
      rightInput.parentNode?.insertBefore(rightWrap, rightInput);
      rightWrap.appendChild(rightInput);
    }

    // create max label once
    let maxLabel = rightWrap.querySelector('[data-custom-foundry="combat-max-label"]');
    if (!maxLabel) {
      maxLabel = document.createElement("div");
      maxLabel.setAttribute("data-custom-foundry", "combat-max-label");
      maxLabel.textContent = "max";
      maxLabel.style.fontSize = "18px";
      maxLabel.style.lineHeight = "1";
      maxLabel.style.marginTop = "2px";
      maxLabel.style.textAlign = "center";
      rightWrap.appendChild(maxLabel);
    }

    // ensure max block sits after slash
    if (slash.nextElementSibling !== rightWrap) {
      slash.after(rightWrap);
    }

    // sync values from combat
    const combatValue = actor.system?.stats?.combat?.value ?? 0;
    const combatMax = actor.system?.stats?.combat?.max ?? 0;

    if (document.activeElement !== leftInput && String(leftInput.value) !== String(combatValue)) {
      leftInput.value = combatValue;
    }

    if (document.activeElement !== rightInput && String(rightInput.value) !== String(combatMax)) {
      rightInput.value = combatMax;
    }

    // keep your earlier combat/max correction logic
    if (combatMax === 99) {
      actor.update({ "system.stats.combat.max": combatValue });
    } else if (combatMax < combatValue && combatMax !== 10) {
      actor.update({ "system.stats.combat.value": combatMax });
    } else if (combatMax < combatValue && combatMax === 10) {
      actor.update({ "system.stats.combat.max": combatValue });
    }
  }

  function bindWeaponRolls() {
    const buttons = root.querySelectorAll(".weapon-roll");

    buttons.forEach((btn) => {
      if (btn.dataset.boundWeaponRoll === "true") return;
      btn.dataset.boundWeaponRoll = "true";

      btn.addEventListener(
        "click",
        (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();

          const li = ev.currentTarget.closest(".item");
          if (!li?.dataset?.itemId) {
            ui.notifications.error("no item id found");
            return;
          }

          const macro = game.macros.getName("mosh use weapon");
          if (!macro) {
            ui.notifications.error("the use weapon macro must be imported");
            return;
          }

          macro.execute({ args: [li.dataset.itemId] });
        },
        true
      );
    });
  }

  function bindWillRoll() {
    const statWrappers = root.querySelectorAll(".mainstatwrapper");
    const wrapper = statWrappers[3];
    if (!wrapper) return;

    const willBtn = wrapper.querySelector(".mainstattext");
    if (!willBtn) return;

    if (willBtn.dataset.boundWillRoll === "true") return;
    willBtn.dataset.boundWillRoll = "true";

    willBtn.addEventListener(
      "click",
      (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        const macro = game.macros.getName("mosh roll will");
        if (!macro) return ui.notifications.error("import 'mosh roll will' macro");
        macro.execute({ args:[{
          actor: actor.name,
          actorUuid: actor.uuid,
          combatValue: actor.system?.stats?.combat?.value,
          combatMax: actor.system?.stats?.combat?.max,
        }] });
      },
      true
    );
  }

  function runPass() {
    if (!root.isConnected) return;

    applyStaticSheetChanges();
    rewriteCombatAsWill();
    bindWillRoll();
    bindWeaponRolls();
  }

  let scheduled = false;

  function scheduleRun() {
    if (scheduled) return;
    scheduled = true;

    app._customFoundryFrame = requestAnimationFrame(() => {
      scheduled = false;
      app._customFoundryFrame = null;

      if (!root.isConnected) {
        app._customFoundryObserver?.disconnect();
        app._customFoundryObserver = null;
        return;
      }

      runPass();
    });
  }

  const observer = new MutationObserver(() => {
    scheduleRun();
  });

  observer.observe(content, {
    childList: true,
    subtree: true,
  });

  app._customFoundryObserver = observer;

  // initial pass only once on render
  runPass();
});
}
