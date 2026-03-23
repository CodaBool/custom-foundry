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

    // verify currently viewed source item
    // const item =
    //   app.document?.id === sourceItem.id
    //     ? sourceItem
    //     : verifyItem;

    // if (!item) {
    //   ui.notifications.error("Could not find source item.");
    //   return;
    // }

    try {
      if (!value) {
        await item.unsetFlag(MODULE_ID, "stat");
        ui.notifications.info(`Cleared stat on '${item.name}'`);
        return;
      }

      await item.setFlag(MODULE_ID, "stat", value);
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

  function getFlagNumber(actor, key, fallback = 0) {
    const raw = actor.getFlag(MODULE_ID, key);
    const num = Number(raw);
    return Number.isFinite(num) ? num : fallback;
  }

  async function saveFlagNumber(actor, key, value) {
    const num = Number(value);
    await actor.setFlag(MODULE_ID, key, Number.isFinite(num) ? num : 0);
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
      const flaw = actor.getFlag(MODULE_ID, "flaw") || "";
      if (pronounInput.value !== flaw) pronounInput.value = flaw;
      if (!pronounInput.readOnly) pronounInput.readOnly = true;
    }

    // rank -> background
    relabelHeaderField('input[name="system.rank.value"]', "Background");

    // credits -> notes
    relabelHeaderField('input[name="system.credits.value"]', "Notes (Money)");

    // skill tree -> abilities
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

  function buildWillBlock() {
    const will = getFlagNumber(actor, "will", 0);
    const willMax = getFlagNumber(actor, "willMax", 0);

    const wrapper = document.createElement("div");
    wrapper.className = "mainstatwrapper";
    wrapper.dataset.injectedWill = "true";

    wrapper.innerHTML = `
      <div class="resource mainstat" style="display:flex;align-items:center;gap:6px;">
        <div class="mainstatlabel" style="width:50%;">
          <span
            class="ability-mod stat-roll rollable mainstattext"
            data-key="will"
            data-roll="d100"
            data-label="Will"
          >WILL</span>
        </div>

        <input
          class="circle-input injected-will"
          type="text"
          value="${will}"
          data-dtype="Number"
          style="border-radius:6px;"
        />

        <div style="font-size:24px;margin:0;display:flex;align-items:center;align-self:center;">/</div>

        <div style="display:inline-flex;flex-direction:column;align-items:center;margin-top:18px;">
          <input
            class="circle-input injected-will-max"
            type="text"
            value="${willMax}"
            data-dtype="Number"
            style="border-radius:6px;text-align:center;"
          />
          <div style="font-size:18px;line-height:1;margin-top:2px;text-align:center;">max</div>
        </div>
      </div>
    `;

    const willInput = wrapper.querySelector(".injected-will");
    const willMaxInput = wrapper.querySelector(".injected-will-max");

    willInput?.addEventListener("change", async (ev) => {
      await saveFlagNumber(actor, "will", ev.currentTarget.value);
    });

    willMaxInput?.addEventListener("change", async (ev) => {
      await saveFlagNumber(actor, "willMax", ev.currentTarget.value);
    });

    return wrapper;
  }

  function syncWillBlock() {
    const statWrappers = root.querySelectorAll(".mainstatwrapper");
    if (!statWrappers.length) return;

    let willWrapper = root.querySelector('.mainstatwrapper[data-injected-will="true"]');
    const anchor = statWrappers[3] ?? statWrappers[statWrappers.length - 1];
    if (!anchor) return;

    if (!willWrapper) {
      willWrapper = buildWillBlock();
      anchor.after(willWrapper);
      return;
    }

    const will = String(getFlagNumber(actor, "will", 0));
    const willMax = String(getFlagNumber(actor, "willMax", 0));

    const willInput = willWrapper.querySelector(".injected-will");
    const willMaxInput = willWrapper.querySelector(".injected-will-max");

    if (willInput && document.activeElement !== willInput && willInput.value !== will) {
      willInput.value = will;
    }

    if (willMaxInput && document.activeElement !== willMaxInput && willMaxInput.value !== willMax) {
      willMaxInput.value = willMax;
    }
  }



  function bindWeaponRolls() {
    const buttons = root.querySelectorAll(".weapon-roll");

    buttons.forEach((btn) => {
      if (btn.dataset.boundWeaponRoll === "true") return;
      btn.dataset.boundWeaponRoll = "true";


      //btn.addEventListener("click", killEvent, true);

      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        const li = ev.currentTarget.closest(".item");
        const macro = game.macros.getName("mosh use weapon")
        if (!macro) ui.notifications.error("the use weapon macro must be imported")
        macro.execute({ args: [li.dataset.itemId] });
      }, true);
    });
  }

  function runPass() {
    if (!root.isConnected) return;

    applyStaticSheetChanges();
    syncWillBlock();
    bindWeaponRolls();
  }

  let scheduled = false;

  // runs on every change
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
