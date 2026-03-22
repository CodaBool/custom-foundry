export async function mothership() {


  // Hooks.on("renderApplication", async (app, htmlRaw) => {
  //   console.log("app1", htmlRaw)

  // })


  // Hooks.on("renderApplicationV2", async (app, htmlRaw) => {
  //   console.log("app2", htmlRaw)
  // })


  Hooks.on("renderActorSheet", async (app, htmlRaw) => {
    if (!htmlRaw[0].id.includes("Mothership")) return

    const content = htmlRaw[0].querySelector(".window-content")
    let me = game.user.character

    if (!me && game.user.isGM) {
      me = canvas.tokens.controlled[0]?.actor
      if (!me) {
        ui.notifications.error("no character")
        return
      }
      if (app.actor.uuid !== me.uuid) {
        ui.notifications.error("selected wrong character")
        return
      }
    }
    if (!me) return

    function inject() {
      if (htmlRaw[0].querySelector("#injected-max")) return

      // flaw
      const pronoun = htmlRaw[0].querySelector('input[name="system.pronouns.value"]')
      const pronounLabel = pronoun?.closest("div")?.previousElementSibling
      if (pronounLabel && pronounLabel.classList.contains("headerinputtext")) {
        pronounLabel.textContent = "Flaw"
      }
      pronoun.value = me.flags['custom-foundry']?.flaw || ""
      pronoun.readOnly = true


      // rank -> background
      const rankInput = htmlRaw[0].querySelector('input[name="system.rank.value"]')
      const rankLabel = rankInput?.closest("div")?.previousElementSibling
      if (rankLabel && rankLabel.classList.contains("headerinputtext")) {
        rankLabel.textContent = "Background"
      }


      // credits -> notes
      const creditsInput = htmlRaw[0].querySelector('input[name="system.credits.value"]')
      const creditsLabel = creditsInput?.closest("div")?.previousElementSibling
      if (creditsLabel && creditsLabel.classList.contains("headerinputtext")) {
        creditsLabel.textContent = "Notes (Money)"
      }

      // skill tree -> Abilities
      const el = document.querySelector('.skill-tree-header-button')
      if (el) {
        const textNode = [...el.childNodes].find(
          n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
        );
        if (textNode) textNode.textContent = 'Abilities';
      }


      // combat
      const wrapper = document.querySelectorAll(".mainstatwrapper")[3]
      if (!wrapper) return
      const leftBlock = wrapper.querySelector(".resource.mainstat");
      const leftInput = wrapper.querySelector(".circle-input");
      const rightInput = wrapper.querySelector(".mainstatmod-input");
      const oldSeparator = wrapper.querySelector(".mainstatmod-title");
      const label = wrapper.querySelector(".mainstattext");

      if (leftBlock && leftInput && rightInput) {

        // change Combat → WILL
        if (label) label.textContent = "WILL";

        // remove original "+"
        if (oldSeparator) oldSeparator.remove();

        // make stat container flex
        leftBlock.style.display = "flex";
        leftBlock.style.alignItems = "center";
        leftBlock.style.gap = "6px";
        leftBlock.childNodes[1].style.width = "50%"

        // remove circular styling
        leftInput.style.borderRadius = "6px";


        // create slash divider
        const slash = document.createElement("div");
        slash.textContent = "/";
        slash.style.fontSize = "24px";
        slash.style.margin = "0";
        slash.style.display = "flex";
        slash.style.alignItems = "center";
        slash.style.alignSelf = "center";

        // insert slash
        leftInput.after(slash);

        // make right input match left
        rightInput.className = leftInput.className;
        rightInput.style.cssText = leftInput.style.cssText;
        rightInput.style.textAlign = "center";
        rightInput.style.borderRadius = "6px";

        // point the right input at the "max" field instead of "mod"
        rightInput.name = "system.stats.combat.max"
        rightInput.value = me?.system?.stats?.combat?.max ?? rightInput.value

        // wrapper for max input + label
        const rightWrap = document.createElement("div");
        rightWrap.style.display = "inline-flex";
        rightWrap.style.flexDirection = "column";
        rightWrap.style.alignItems = "center";
        rightWrap.style.marginTop = "18px";

        rightInput.parentNode.insertBefore(rightWrap, rightInput);
        rightWrap.appendChild(rightInput);

        const maxLabel = document.createElement("div");
        maxLabel.textContent = "max";
        maxLabel.id = "injected-max";
        maxLabel.style.fontSize = "18px";
        maxLabel.style.lineHeight = "1";
        maxLabel.style.marginTop = "2px";
        maxLabel.style.textAlign = "center";

        rightWrap.appendChild(maxLabel);

        // place max block after slash
        slash.after(rightWrap)

        if (me?.system?.stats?.combat?.max === 99) {
          // init
          me?.update({ "system.stats.combat.max": me?.system.stats.combat.value });
        } else if (me?.system?.stats?.combat?.max < me?.system?.stats?.combat?.value && me?.system?.stats?.combat?.max !== 10) {
          // value changed in the game naturally
          me?.update({ "system.stats.combat.value": me?.system.stats.combat.max });
        } else if (me?.system?.stats?.combat?.max < me?.system?.stats?.combat?.value && me?.system?.stats?.combat?.max === 10) {
          // character creation fix
          me?.update({ "system.stats.combat.max": me?.system.stats.combat.value });
        }
      }
    }
    // watch for changes
    let debounceTimeout
    const debouncedInject = () => {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => requestAnimationFrame(inject), 1)
    }
    const observer = new MutationObserver(debouncedInject)
    observer.observe(content, { childList: true, subtree: true })
    inject()




    // const sheet = Object.values(ui.windows).find(win => win.id.includes("MothershipActor"))

  })
}
