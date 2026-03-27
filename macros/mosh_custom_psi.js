let me = game.user.character
if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) return ui.notifications.error("no character")

const domains = [
  ["dominion", "DOMINION", "https://i.imgur.com/1jsYCh6.jpeg", "#5B2A86", [
    "Commanding", "Authoritative", "Controlling", "Decisive", "Ambitious", "Disciplined", "Confident", "Proud", "Dogmatic", "Lawful", "Hierarchical", "Resolute"
  ]],
  ["oblivion", "OBLIVION", "https://i.imgur.com/P0MFj8u.jpeg", "#0D0F1A", [
    "Nihilistic", "Detached", "Merciless", "Silent", "Exhausted", "Chaotic", "Negating", "Smothering", "Apathetic", "Unstable", "Violent", "Disruptive"
  ]],
  ["guile", "GUILE", "https://i.imgur.com/xCiKXfe.jpeg", "#1FAF8F", [
    "Cunning", "Manipulative", "Subtle", "Calculating", "Opportunistic", "Persuasive", "Rebellious", "Playful", "Sarcastic", "Irreverent", "Watchful", "Suggestive"
  ]],
  ["ward", "WARD", "https://i.imgur.com/iryk3HK.jpeg", "#3A6EA5", [
    "Protective", "Loyal", "Vigilant", "Guarded", "Patient", "Balanced", "Dutiful", "Grounded", "Traditional", "Focused", "Prepared", "Persistent"
  ]],
  ["vitalis", "VITALIS", "https://i.imgur.com/89sqyOl.jpeg", "#FF9F1C", [
    "Compassionate", "Supportive", "Generous", "Hopeful", "Curious", "Attentive", "Creative", "Uplifting", "Empathetic", "Naturalistic", "Receptive", "talkative"
  ]],
].map(([key, label, image, color, words]) => ({ key, label, image, color, words }))


const verbs = {
  dominion: [
    "command",
    "compel",
    "enforce",
    "seize",
    "bind",
    "dominate",
    "impose",
    "override",
    "suppress",
    "constrain",
    "halt",
    "stabilize",
    "fortify",
    "mark",
    "elevate",
    "judge",
    "break",
    "force",
    "channel",
    "assert"
  ],
  oblivion: [
    "erase",
    "negate",
    "nullify",
    "smother",
    "drain",
    "decay",
    "dissolve",
    "unmake",
    "consume",
    "collapse",
    "rupture",
    "blight",
    "extinguish",
    "disrupt",
    "unravel",
    "corrode",
    "infect",
    "hollow",
    "warp",
    "sever"
  ],
  guile: [
    "trick",
    "mislead",
    "deceive",
    "mask",
    "hide",
    "evade",
    "feint",
    "lure",
    "subvert",
    "sabotage",
    "twist",
    "influence",
    "coax",
    "provoke",
    "switch",
    "steal",
    "infiltrate",
    "bypass",
    "confuse",
    "mimic"
  ],

  ward: [
    "guard",
    "shield",
    "preserve",
    "stabilize",
    "anchor",
    "fortify",
    "block",
    "deflect",
    "repel",
    "endure",
    "contain",
    "seal",
    "watch",
    "detect",
    "mend",
    "restore",
    "reinforce",
    "absorb",
    "ground",
    "resist"
  ],

  vitalis: [
    "heal",
    "restore",
    "revive",
    "grow",
    "nurture",
    "uplift",
    "bolster",
    "soothe",
    "renew",
    "cleanse",
    "adapt",
    "reshape",
    "weave",
    "quicken",
    "attune",
    "sense",
    "communicate",
    "resonate",
    "guide",
    "invigorate"
  ]
}

const domainQuotes = {
  dominion: "“The world bends to our will. As it should...”",

  oblivion: "“Maybe it's easier this way...”",

  guile: "“Well that's new. Maybe this could work in our favor...”",

  ward: "“Remember why you're here. Get a grip on yourself...”",

  vitalis: "“The only thing constant is change. We ought to embrace this...”"
}

const STYLE_ID = "psi-domain-styles"

const css = `
.psi-domain-shell{display:flex;flex-direction:column;gap:14px;min-height:0}
.psi-domain-title{font-size:26px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}
.psi-domain-subtitle{margin:0;font-size:1.4em;}
.psi-domain-viewport{height:460px;overflow:hidden;position:relative}
.psi-domain-grid{display:flex;gap:18px;height:460px;padding:16px 8px 12px;box-sizing:border-box;align-items:flex-start}
.psi-domain-option{position:relative;display:block;flex:0 0 auto;--domain-color:#666}
.psi-domain-option input{position:absolute;opacity:0;pointer-events:none}
.psi-card{position:relative;width:260px;height:420px;perspective:1200px;cursor:pointer;user-select:none}
.psi-card-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .26s ease}
.psi-card:hover .psi-card-inner{transform:rotateY(180deg)}
.psi-card-face{position:absolute;inset:0;border-radius:16px;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.psi-card-back{transform:rotateY(180deg)}
.psi-card-frame{position:relative;width:100%;height:100%;border-radius:16px;overflow:hidden;box-sizing:border-box;border:1px solid rgba(255,255,255,.18);background:rgba(12,12,14,.96);box-shadow:0 10px 28px rgba(0,0,0,.36);transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
.psi-card:hover .psi-card-frame{transform:translateY(-2px);box-shadow:0 12px 24px rgba(0,0,0,.38)}
.psi-domain-option input:checked + .psi-card .psi-card-frame{border-color:var(--domain-color);box-shadow:0 0 0 2px var(--domain-color),0 14px 32px rgba(0,0,0,.45)}
.psi-front-image-wrap,.psi-front-overlay{position:absolute;inset:0}
.psi-front-image{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.psi-front-overlay{background:linear-gradient(to bottom,rgba(0,0,0,.10) 0%,rgba(0,0,0,.30) 48%,rgba(0,0,0,.90) 100%);pointer-events:none}
.psi-front-title-wrap{position:absolute;left:14px;right:14px;bottom:14px;z-index:2;padding:14px 12px 12px;border-radius:12px;background:rgba(0,0,0,.58);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(4px);box-sizing:border-box}
.psi-front-title,.psi-back-title{font-family:"Modesto Condensed","Arial Narrow","Impact",sans-serif;font-weight:700;font-size:1.8em;letter-spacing:.08em;text-transform:uppercase;text-align:center;color:#fff}
.psi-front-title{font-size:38px;line-height:.95;text-shadow:0 2px 10px rgba(0,0,0,.65)}
.psi-card-back .psi-card-frame{display:flex;flex-direction:column;align-items:center;gap:14px;padding:18px 4px 18px 4px;background:linear-gradient(180deg,color-mix(in srgb,var(--domain-color) 22%,#111) 0%,#0c0c10 100%)}
.psi-word-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0, 1fr));
  grid-template-rows:repeat(6, auto);
  gap:8px 10px;
  width:100%;
  padding-top:6px;
  align-items:stretch;
}
.psi-word{font-size:17px;padding:6px;background:rgba(255,255,255,.04);border-radius:6px}
`

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}

const wordsHtml = (words) => words.map(w => `<span class="psi-word">${w}</span>`).join("")

const cardHtml = (domain, checked = false) => `
  <label class="psi-domain-option" style="--domain-color:${domain.color}">
    <input type="radio" name="selectedDomain" value="${domain.key}" ${checked ? "checked" : ""}>
    <div class="psi-card" data-domain="${domain.key}">
      <div class="psi-card-inner">
        <div class="psi-card-face psi-card-front">
          <div class="psi-card-frame">
            <div class="psi-front-image-wrap">
              <img class="psi-front-image" src="${domain.image}" alt="${domain.label}">
            </div>
            <div class="psi-front-overlay"></div>
            <div class="psi-front-title-wrap">
              <div class="psi-front-title">${domain.label}</div>
            </div>
          </div>
        </div>
        <div class="psi-card-face psi-card-back">
          <div class="psi-card-frame">
            <div class="psi-back-title" style="text-align: center; font-size: 1.5em; font-weight: 800">${domain.label}</div>
            <div class="psi-word-grid">${wordsHtml(domain.words)}</div>
          </div>
        </div>
      </div>
    </div>
  </label>
`

const content = `
<form class="psi-domain-form">
  <div class="psi-domain-shell">
    <div class="psi-domain-header">
      <h1 class="psi-domain-title" style="margin: 0; text-align: center">Select Your Instinct</h1>
      <p class="psi-domain-subtitle" style="opacity: 0.5; text-align: center">Select a card that matches your personality</p>
    </div>
    <div class="psi-domain-viewport">
      <div class="psi-domain-grid">
        ${domains.map((d, i) => cardHtml(d, i === 0)).join("")}
      </div>
    </div>
  </div>
</form>
`

const result = await foundry.applications.api.DialogV2.wait({
  window: { title: "Select Instinct" },
  classes: ["map-prompt"],
  id: "select-dialog",
  content,
  render: (event, dialog) => {
    ensureStyles()

    const root = dialog.element
    if (!root) return

    root.querySelector(".psi-domain-grid")?.addEventListener("click", (e) => {
      const card = e.target.closest(".psi-card")
      if (!card) return
      const input = root.querySelector(`input[name="selectedDomain"][value="${card.dataset.domain}"]`)
      if (input) input.checked = true
    })

    if (globalThis.gsap) {
      root.querySelectorAll(".psi-card").forEach((card) => {
        const inner = card.querySelector(".psi-card-inner")
        if (!inner) return
        card.addEventListener("mouseenter", () => gsap.to(inner, {
          rotateY: 180,
          duration: 0.42,
          ease: "power2.out",
          overwrite: true,
        }))
        card.addEventListener("mouseleave", () => gsap.to(inner, {
          rotateY: 0,
          duration: 0.42,
          ease: "power2.out",
          overwrite: true,
        }))
      })
    }
  },
  buttons: [
    {
      action: "confirm",
      label: "Confirm",
      icon: "fas fa-check",
      default: true,
      callback: (event, button, dialog) => {
        const selected = dialog.element.querySelector('input[name="selectedDomain"]:checked')?.value
        if (!selected) return ui.notifications.warn("Select a PSI domain.")
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

const domainVerbList = verbs[result] ?? []
if (!domainVerbList.length) return ui.notifications.error(`No verbs found for domain "${result}"`)

const domainVerbHere = domainVerbList[Math.floor(Math.random() * domainVerbList.length)]

await ChatMessage.create({
  speaker: { alias: `'${result.toUpperCase()}' TAKES ROOT IN ${game.user.name.toUpperCase()}` },
  content: `
    <div style="font-size: 1.2em">
      <h1 style="font-size: 1.7em; margin: 0 0 0.4em 0;">
      A tingle in your spine
      </h1>

      <blockquote style="
        font-style: italic;
        opacity: 0.85;
        border-left: 3px solid #888;
        margin: 0 0 0.6em 0;
        padding-left: 0.6em;
      ">
        ${domainQuotes[result]}
      </blockquote>

      <p style="margin: 0; text-align: center; font-size: 1.4em">
        ${game.user.name}'s verb is <strong>${domainVerbHere.toUpperCase()}</strong>
      </p>
    </div>
  `,
})
