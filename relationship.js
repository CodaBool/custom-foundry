import {
  RELATIONSHIPS,
  MISSING_RELATIONSHIPS,
  escapeHTML,
  getAvailableRelationships,
} from "./util.js"

const MODULE_ID = "custom-foundry"
const SOCKET = `module.${MODULE_ID}`
const CLAIMS_SETTING = "claimedRelationshipCards"
const MAX_CLAIMS_PER_RELATIONSHIP = 3

/*
Example template to start in players Notes, Use game.users to gather id info

Array.from(game.users).map(u => ({id: u._id, name: u.name}))

<div style="font-size: 1.3em">
	<p><b>Desire</b>: </p>
	<p><b>Relationship with abwlDnKQOBVzQNkF</b>: abwlDnKQOBVzQNkF relation</p>
	<p><b>Relationship with Pz2ru6C0VxkYYcNN</b>: Pz2ru6C0VxkYYcNN relation</p>
	<p><b>Relationship with Yv5mS99tDX1fmABT</b>: Yv5mS99tDX1fmABT relation</p>
	<p><b>Relationship with KrjzAw13XQdHoIdB</b>: KrjzAw13XQdHoIdB relation</p>
	<p><b>Relationship with 3lMgrU8lV28ttUha</b>: 3lMgrU8lV28ttUha relation</p>
</div>

# open
customFoundry.relationships.open()

# clear
customFoundry.relationships.resetClaims()

# inspect
customFoundry.relationships.open()


*/

const { ApplicationV2 } = foundry.applications.api

let activeApp = null

function getClaims() {
  try {
    return foundry.utils.deepClone(
      game.settings.get(MODULE_ID, CLAIMS_SETTING) ?? {},
    )
  } catch {
    return {}
  }
}

function relationshipClaimCount(cardId, claims = getClaims()) {
  const claimsForCard = claims[cardId]
  if (!claimsForCard) return 0
  return Array.isArray(claimsForCard) ? claimsForCard.length : 1
}

function getPrimaryActiveGM() {
  return game.users.contents
    .filter(user => user.isGM && user.active)
    .sort((a, b) => a.id.localeCompare(b.id))[0] ?? null
}

function randomRequestId() {
  if (foundry.utils.randomID) return foundry.utils.randomID()
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function emit(payload) {
  game.socket.emit(SOCKET, payload)
}

function relationshipCardById(id) {
  return RELATIONSHIPS.find(card => card.id === Number(id)) ?? null
}

function isRelationshipAvailable(id) {
  const cardId = Number(id)
  return (
    relationshipCardById(cardId) &&
    !MISSING_RELATIONSHIPS.includes(cardId) &&
    relationshipClaimCount(cardId) < MAX_CLAIMS_PER_RELATIONSHIP
  )
}

function userById(id) {
  return game.users.get(id) ?? null
}

function relationshipTargets() {
  return game.users.contents
    .filter(user => user.active && !user.isGM && user.id !== game.user.id)
    .sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
}

function field(label, value) {
  if (!value) return ""
  return `
    <div class="cf-detail">
      <div class="cf-detail-label">${escapeHTML(label)}</div>
      <div class="cf-detail-value">${escapeHTML(value)}</div>
    </div>
  `
}

function relationshipNoteLabel(relationship) {
  if (relationship.privateRelationship === relationship.publicRelationship) {
    return relationship.privateRelationship
  }

  return `${relationship.privateRelationship} (publicly known as ${relationship.publicRelationship})`
}

function replaceBootstrapRelationshipLabels(container) {
  for (const label of container.querySelectorAll("strong, b")) {
    const userId = label.textContent.trim().match(/^Relationship with (.+)$/)?.[1]
    const user = userId ? userById(userId) : null

    if (user?.character?.name) {
      label.textContent = `Relationship with ${user.character.name}`
    }
  }
}

async function saveRelationshipToActorNotes(actor, relationship, targetUserId) {
  const target = userById(targetUserId)
  if (!actor || !target?.character?.name) return false

  const notes = String(actor.system.notes ?? "")
  if (!notes) return false

  const container = document.createElement("div")
  container.innerHTML = notes
  replaceBootstrapRelationshipLabels(container)

  const targetLabel = `Relationship with ${target.character.name}`
  const relationshipLabel = relationshipNoteLabel(relationship)
  const label = [...container.querySelectorAll("strong, b")].find(element => {
    return element.textContent.trim() === targetLabel
  })

  if (!label?.parentElement) return false

  // Preserve the bootstrap's wrapper element while replacing only its value.
  label.parentElement.replaceChildren(
    label,
    document.createTextNode(`: ${relationshipLabel}`),
  )

  await actor.update({ "system.notes": container.innerHTML })
  return true
}

function stepClass(current, expected) {
  if (current === expected) return "is-active"
  if (current > expected) return "is-complete"
  return ""
}

export function initRelationships() {
  game.settings.register(MODULE_ID, CLAIMS_SETTING, {
    name: "Claimed Relationship Cards",
    hint: "Relationship claims made during character setup.",
    scope: "world",
    config: false,
    type: Object,
    default: {},
    restricted: true,
  })
}

export function readyRelationships() {
  globalThis.customFoundry ??= {}

  globalThis.customFoundry.relationships = {
    open: openRelationshipApp,
    resetClaims: resetRelationshipClaims,
    getClaims,
    missingRelationships: [...MISSING_RELATIONSHIPS],
  }
}

export async function resetRelationshipClaims() {
  if (!game.user.isGM) {
    ui.notifications.warn("Only a GM can reset relationship card claims.")
    return false
  }

  await game.settings.set(MODULE_ID, CLAIMS_SETTING, {})

  emit({
    action: "relationshipClaimsReset",
  })

  ui.notifications.info("Relationship card claims have been reset.")
  return true
}

export function openRelationshipApp() {
  if (activeApp?.rendered) {
    activeApp.bringToFront()
    return activeApp
  }

  activeApp = new RelationshipSetupApp()
  activeApp.render(true)
  return activeApp
}

/**
 * Call this near the top of your existing module.custom-foundry socket listener.
 *
 * Returns true when the payload belonged to this relationship-card system.
 */
export async function handleRelationshipSocket(payload) {
  if (!payload || typeof payload !== "object") return false

  if (payload.action === "relationshipClaimRequest") {
    if (!game.user.isGM) return true

    const primaryGM = getPrimaryActiveGM()
    if (!primaryGM || primaryGM.id !== game.user.id) return true

    await processRelationshipClaim(payload)
    return true
  }

  if (payload.action === "relationshipCardClaimed") {
    activeApp?.relationshipClaimed(payload)
    return true
  }

  if (payload.action === "relationshipClaimRejected") {
    if (payload.requesterUserId === game.user.id) {
      activeApp?.relationshipClaimRejected(payload)
    }
    return true
  }

  if (payload.action === "relationshipClaimsReset") {
    activeApp?.claimsReset()
    return true
  }

  return false
}

async function processRelationshipClaim(payload) {
  const cardId = Number(payload.cardId)
  const requestId = String(payload.requestId ?? "")
  const requesterUserId = String(payload.requesterUserId ?? "")
  const giverUserId = String(payload.giverUserId ?? "")
  const takerUserId = String(payload.takerUserId ?? "")

  const reject = reason => {
    emit({
      action: "relationshipClaimRejected",
      requestId,
      requesterUserId,
      cardId,
      reason,
    })
  }

  if (!requestId || !requesterUserId || !giverUserId || !takerUserId) {
    reject("The relationship claim was incomplete.")
    return
  }

  if (giverUserId === takerUserId) {
    reject("The giver and taker cannot be the same user.")
    return
  }

  const card = relationshipCardById(cardId)

  if (!card || MISSING_RELATIONSHIPS.includes(cardId)) {
    reject("That relationship card is not available in this rulebook.")
    return
  }

  const giver = userById(giverUserId)
  const taker = userById(takerUserId)

  if (!giver || !taker) {
    reject("The giver or taker no longer exists.")
    return
  }

  const claims = getClaims()

  if (relationshipClaimCount(cardId, claims) >= MAX_CLAIMS_PER_RELATIONSHIP) {
    reject("That relationship has reached its three-use limit.")
    return
  }

  const claim = {
    cardId,
    giverUserId,
    giverName: giver.name,
    takerUserId,
    takerName: taker.name,
    claimedAt: new Date().toISOString(),
  }

  const existingClaims = claims[cardId]
  claims[cardId] = [
    ...(Array.isArray(existingClaims) ? existingClaims : existingClaims ? [existingClaims] : []),
    claim,
  ]
  await game.settings.set(MODULE_ID, CLAIMS_SETTING, claims)

  try {
    await Promise.all([
      saveRelationshipToActorNotes(giver.character, card, takerUserId),
      saveRelationshipToActorNotes(taker.character, card, giverUserId),
    ])
  } catch (error) {
    console.error("Unable to save relationship notes to the participant actors.", error)
  }

  emit({
    action: "relationshipCardClaimed",
    requestId,
    requesterUserId,
    cardId,
    claim,
    claimCount: claims[cardId].length,
  })
}

class RelationshipSetupApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "custom-foundry-relationship-setup",
    classes: [
      "custom-foundry",
      "custom-foundry-relationship-setup",
      "themed",
      "theme-dark",
    ],
    tag: "div",
    position: {
      width: 1120,
      height: 820,
    },
    window: {
      title: "Relationship",
      icon: "fa-solid fa-heart",
      minimizable: true,
      resizable: true,
    },
  }

  step = 1
  selectedRelationshipId = null
  selectedTargetId = null
  pendingRequestId = null
  remoteClaimCounts = new Map()

  async _renderHTML() {
    return `
      <style>${this.#styles()}</style>
      <form class="cf-setup-form" autocomplete="off">
        ${this.#renderProgress()}
        <div class="cf-body">
          ${this.#renderCurrentStep()}
        </div>
      </form>
    `
  }

  _replaceHTML(result, content) {
    content.innerHTML = result
  }

  async _onRender(context, options) {
    await super._onRender(context, options)

    const root = this.element

    root.querySelector(".cf-setup-form")?.addEventListener("submit", event => {
      event.preventDefault()
    })

    for (const element of root.querySelectorAll("[data-cf-action]")) {
      element.addEventListener("click", event => {
        event.preventDefault()
        this.#handleAction(event.currentTarget)
      })
    }

    for (const radio of root.querySelectorAll(
      'input[name="relationship-target"]',
    )) {
      radio.addEventListener("change", event => {
        this.selectedTargetId = event.currentTarget.value
        this.render()
      })
    }

    this.#resizeForState()
  }

  async _onClose(options) {
    if (activeApp === this) activeApp = null
    await super._onClose(options)
  }

  async relationshipClaimed(payload) {
    const cardId = Number(payload.cardId)
    this.remoteClaimCounts.set(
      cardId,
      Number(payload.claimCount) || (this.remoteClaimCounts.get(cardId) ?? 0) + 1,
    )

    const mine =
      payload.requesterUserId === game.user.id &&
      payload.requestId === this.pendingRequestId

    if (mine) {
      this.pendingRequestId = null
      this.step = 3
      this.render()
      return
    }

    if (
      this.selectedRelationshipId === cardId &&
      this.#relationshipIsClaimed(cardId)
    ) {
      this.selectedRelationshipId = null
      this.selectedTargetId = null
      this.pendingRequestId = null
      this.step = 1
      ui.notifications.warn(
        "That relationship is no longer available. Choose another.",
      )
    }

    this.render()
  }

  relationshipClaimRejected(payload) {
    if (payload.requestId !== this.pendingRequestId) return

    this.pendingRequestId = null

    if (Number(payload.cardId) === this.selectedRelationshipId) {
      this.selectedRelationshipId = null
      this.selectedTargetId = null
      this.step = 1
    }

    ui.notifications.warn(
      payload.reason ?? "That relationship card could not be claimed.",
    )

    this.render()
  }

  claimsReset() {
    this.remoteClaimCounts.clear()
    this.render()
  }

  #renderProgress() {
    return `
      <nav class="cf-progress" aria-label="Character setup progress">
        <div class="cf-progress-step ${stepClass(this.step, 1)}">
          <span>1</span>
          <strong>Relationship</strong>
        </div>
        <div class="cf-progress-line"></div>
        <div class="cf-progress-step ${stepClass(this.step, 2)}">
          <span>2</span>
          <strong>Taker</strong>
        </div>
      </nav>
    `
  }

  #renderCurrentStep() {
    if (this.step === 1) return this.#renderRelationships()
    if (this.step === 2) return this.#renderTargetSelection()
    return this.#renderComplete()
  }

  #availableRelationships() {
    return getAvailableRelationships().filter(card => {
      return this.#relationshipClaimCount(card.id) < MAX_CLAIMS_PER_RELATIONSHIP
    })
  }

  #renderRelationships() {
    const selected = relationshipCardById(this.selectedRelationshipId)

    if (
      selected &&
      !MISSING_RELATIONSHIPS.includes(selected.id) &&
      !this.#relationshipIsClaimed(selected.id)
    ) {
      return `
        <section class="cf-stage">
          <div class="cf-stage-heading">
            <div>
              <div class="cf-kicker">Relationship · Public side revealed</div>
              <h2>${escapeHTML(selected.publicRelationship)}</h2>
            </div>
          </div>

          <article class="cf-expanded-card cf-relationship-public">
            ${field("Public Relationship", selected.publicRelationship)}
            ${field("Public Description", selected.publicDescription)}
          </article>

          <div class="cf-actions">
            <button type="button" class="cf-secondary" data-cf-action="deselect-relationship">
              <i class="fa-solid fa-arrow-left"></i>
              Deselect
            </button>
            <button type="button" class="cf-primary" data-cf-action="continue-relationship">
              Continue
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </section>
      `
    }

    if (selected) this.selectedRelationshipId = null

    const cards = this.#availableRelationships()

    return `
      <section class="cf-stage">
        <div class="cf-stage-heading">
          <div>
            <div class="cf-kicker">Step 1</div>
            <h2>Choose a relationship</h2>
            <p>
              These are the private sides. Select one to reveal its public side.
              Each relationship can be selected up to three times.
            </p>
            <p class="cf-instruction">
              Relationship cards contain the terminology ‘giver’ and ‘taker’, so
              you can tell who is who in the relationship. ‘Giver’ refers to you.
              ‘Taker’ refers to the person who will take the card from you.
            </p>
          </div>
        </div>

        ${
          cards.length
            ? `
              <div class="cf-card-grid">
                ${cards.map(card => this.#relationshipPrivate(card)).join("")}
              </div>
            `
            : `
              <div class="cf-empty">
                <i class="fa-solid fa-cards-blank"></i>
                <h3>No relationship cards remain</h3>
                <p>Ask the GM to reset the relationship claims if this is unexpected.</p>
              </div>
            `
        }
      </section>
    `
  }

  #relationshipPrivate(card) {
    return `
      <button
        type="button"
        class="cf-card cf-relationship-private"
        data-cf-action="select-relationship"
        data-card-id="${card.id}"
      >
        <div class="cf-card-topline">
          <span>Relationship</span>
          <span class="cf-pill cf-private-pill">Private</span>
        </div>

        <h3>${escapeHTML(card.privateRelationship)}</h3>
        <p>${escapeHTML(card.privateDescription)}</p>

        <div class="cf-card-hint">
          Select to reveal public side
        </div>
      </button>
    `
  }

  #renderTargetSelection() {
    const relationship = relationshipCardById(this.selectedRelationshipId)

    if (!relationship || this.#relationshipIsClaimed(relationship.id)) {
      this.selectedRelationshipId = null
      this.selectedTargetId = null
      this.step = 1
      return this.#renderRelationships()
    }

    const targets = relationshipTargets()
    const targetExists = targets.some(user => user.id === this.selectedTargetId)

    if (!targetExists) this.selectedTargetId = null

    return `
      <section class="cf-stage cf-target-stage">
        <div class="cf-stage-heading">
          <div>
            <div class="cf-kicker">Step 2</div>
            <h2>Who receives this relationship?</h2>
          </div>
        </div>

        <div class="cf-selection-summary">
          <div>
            <span>Relationship</span>
            <strong>${escapeHTML(relationship.privateRelationship)}</strong>
          </div>
          <div class="cf-arrow">
            <i class="fa-solid fa-arrow-right"></i>
          </div>
          <div>
            <span>Giver</span>
            <strong>${escapeHTML(game.user.name)}</strong>
          </div>
        </div>

        ${
          targets.length
            ? `
              <fieldset class="cf-targets">
                <legend>Select the taker</legend>
                ${targets.map(user => this.#targetOption(user)).join("")}
              </fieldset>
            `
            : `
              <div class="cf-empty">
                <h3>No other player users were found</h3>
                <p>Create or enable another non-GM user before assigning a relationship.</p>
              </div>
            `
        }

        <div class="cf-actions">
          <button
            type="button"
            class="cf-secondary"
            data-cf-action="back-to-relationship"
            ${this.pendingRequestId ? "disabled" : ""}
          >
            <i class="fa-solid fa-arrow-left"></i>
            Back
          </button>

          <button
            type="button"
            class="cf-primary"
            data-cf-action="confirm-relationship"
            ${!this.selectedTargetId || this.pendingRequestId ? "disabled" : ""}
          >
            ${
              this.pendingRequestId
                ? `<i class="fa-solid fa-spinner fa-spin"></i> Claiming…`
                : `Confirm relationship <i class="fa-solid fa-check"></i>`
            }
          </button>
        </div>
      </section>
    `
  }

  #targetOption(user) {
    const checked = this.selectedTargetId === user.id ? "checked" : ""

    return `
      <label class="cf-target ${checked ? "is-selected" : ""}">
        <input
          type="radio"
          name="relationship-target"
          value="${escapeHTML(user.id)}"
          ${checked}
        >
        <span class="cf-radio"></span>
        <span class="cf-target-copy">
          <strong>${escapeHTML(user.name)}</strong>
          <small>${user.active ? "Connected" : "Offline"}</small>
        </span>
      </label>
    `
  }

  #renderComplete() {
    const relationship = relationshipCardById(this.selectedRelationshipId)
    const target = userById(this.selectedTargetId)

    return `
      <section class="cf-stage cf-complete">
        <div class="cf-success-icon">
          <i class="fa-solid fa-check"></i>
        </div>

        <div class="cf-kicker">Relationship Established</div>
        <h2>${escapeHTML(relationship?.privateRelationship ?? "Selected")}</h2>

        <div class="cf-complete-grid">
          <div>
            <span>Taker</span>
            <strong>${escapeHTML(target?.name ?? "Selected")}</strong>
          </div>
        </div>

        <div class="cf-actions cf-actions-centered">
          <button type="button" class="cf-primary" data-cf-action="new-relationship">
            Form a new relationship
          </button>
        </div>
      </section>
    `
  }

  #relationshipIsClaimed(cardId) {
    return this.#relationshipClaimCount(cardId) >= MAX_CLAIMS_PER_RELATIONSHIP
  }

  #relationshipClaimCount(cardId) {
    return Math.max(
      relationshipClaimCount(cardId),
      this.remoteClaimCounts.get(Number(cardId)) ?? 0,
    )
  }

  #handleAction(target) {
    const action = target.dataset.cfAction
    const cardId = Number(target.dataset.cardId)

    if (action === "select-relationship") {
      if (!isRelationshipAvailable(cardId)) {
        ui.notifications.warn("That relationship is no longer available.")
        this.render()
        return
      }

      this.selectedRelationshipId = cardId
      this.selectedTargetId = null
      this.render()
      return
    }

    if (action === "deselect-relationship") {
      this.selectedRelationshipId = null
      this.selectedTargetId = null
      this.render()
      return
    }

    if (action === "continue-relationship") {
      if (!this.selectedRelationshipId) return

      if (this.#relationshipIsClaimed(this.selectedRelationshipId)) {
        ui.notifications.warn(
          "That relationship has reached its three-use limit. Choose another.",
        )
        this.selectedRelationshipId = null
        this.render()
        return
      }

      this.step = 2
      this.render()
      return
    }

    if (action === "back-to-relationship") {
      if (this.pendingRequestId) return
      this.step = 1
      this.selectedTargetId = null
      this.render()
      return
    }

    if (action === "confirm-relationship") {
      this.#confirmRelationship()
      return
    }

    if (action === "new-relationship") {
      this.selectedRelationshipId = null
      this.selectedTargetId = null
      this.step = 1
      this.render()
    }
  }

  async #confirmRelationship() {
    if (
      !this.selectedRelationshipId ||
      !this.selectedTargetId ||
      this.pendingRequestId
    ) {
      return
    }

    if (this.#relationshipIsClaimed(this.selectedRelationshipId)) {
      ui.notifications.warn(
        "That relationship has reached its three-use limit. Choose another.",
      )
      this.selectedRelationshipId = null
      this.selectedTargetId = null
      this.step = 1
      this.render()
      return
    }

    const target = userById(this.selectedTargetId)
    if (!target || target.isGM || target.id === game.user.id) {
      ui.notifications.warn("Choose another player as the taker.")
      return
    }

    const primaryGM = getPrimaryActiveGM()

    if (!primaryGM) {
      ui.notifications.error(
        "An active GM is required to claim a relationship card.",
      )
      return
    }

    const requestId = randomRequestId()

    this.pendingRequestId = requestId
    this.render()

    const payload = {
      action: "relationshipClaimRequest",
      requestId,
      requesterUserId: game.user.id,
      giverUserId: game.user.id,
      takerUserId: this.selectedTargetId,
      cardId: this.selectedRelationshipId,
    }

    // A GM using the app can process their own request directly. This avoids
    // depending on whether the socket server echoes a message to its sender.
    if (game.user.isGM && primaryGM.id === game.user.id) {
      await processRelationshipClaim(payload)
      return
    }

    emit(payload)
  }

  #resizeForState() {
    if (this.step === 1 && this.selectedRelationshipId) {
      this.setPosition({ width: 820, height: 700 })
      return
    }

    if (this.step === 2) {
      this.setPosition({ width: 760, height: 720 })
      return
    }

    if (this.step === 3) {
      this.setPosition({ width: 760, height: 620 })
      return
    }

    this.setPosition({ width: 1120, height: 820 })
  }

  #styles() {
    return `
      .custom-foundry-relationship-setup .window-content {
        padding: 0;
        overflow: hidden;
      }

      .cf-setup-form {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        margin: 0;
        background:
          radial-gradient(circle at top, rgba(255,255,255,0.055), transparent 34%),
          var(--color-bg, #171717);
      }

      .cf-progress {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 16px 22px;
        border-bottom: 1px solid rgba(255,255,255,0.12);
        background: rgba(0,0,0,0.16);
      }

      .cf-progress-step {
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0.45;
      }

      .cf-progress-step span {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border: 1px solid currentColor;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
      }

      .cf-progress-step.is-active,
      .cf-progress-step.is-complete {
        opacity: 1;
      }

      .cf-progress-step.is-active span {
        background: rgba(255,255,255,0.15);
      }

      .cf-progress-line {
        width: 48px;
        height: 1px;
        background: rgba(255,255,255,0.22);
      }

      .cf-body {
        min-height: 0;
        flex: 1 1 auto;
        overflow: auto;
      }

      .cf-stage {
        min-height: 100%;
        box-sizing: border-box;
        padding: 26px;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .cf-stage-heading {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 18px;
      }

      .cf-stage-heading h2,
      .cf-complete h2 {
        margin: 3px 0 4px;
        font-size: 30px;
        line-height: 1.05;
      }

      .cf-stage-heading p {
        max-width: 760px;
        margin: 6px 0 0;
        opacity: 0.8;
        line-height: 1.45;
      }

      .cf-kicker {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 800;
        opacity: 0.62;
      }

      .cf-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
        gap: 14px;
        align-items: stretch;
      }

      button.cf-card {
        appearance: none;
        text-align: left;
        min-height: 230px;
        height: auto;
        padding: 18px;
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 13px;
        color: inherit;
        background:
          linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025));
        box-shadow: 0 8px 20px rgba(0,0,0,0.18);
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow: visible;
        white-space: normal;
        cursor: pointer;
        transition:
          transform 120ms ease,
          border-color 120ms ease,
          background 120ms ease;
      }

      button.cf-card:hover,
      button.cf-card:focus-visible {
        transform: translateY(-2px);
        border-color: rgba(255,255,255,0.42);
        background:
          linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04));
      }

      .cf-card-topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.82;
      }

      .cf-pill {
        white-space: nowrap;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 999px;
        padding: 3px 8px;
        font-size: 10px;
        letter-spacing: 0.05em;
      }

      .cf-private-pill {
        background: rgba(255,255,255,0.07);
      }

      .cf-relationship-private h3 {
        margin: 8px 0 0;
        font-size: 22px;
        line-height: 1.2;
        overflow-wrap: anywhere;
      }

      .cf-relationship-private p {
        flex: 1 1 auto;
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
        overflow-wrap: anywhere;
        opacity: 0.86;
      }

      .cf-card-hint {
        margin-top: auto;
        padding-top: 12px;
        border-top: 1px solid rgba(255,255,255,0.1);
        font-size: 11px;
        font-weight: 700;
        opacity: 0.55;
      }

      .cf-expanded-card {
        width: min(100%, 730px);
        align-self: center;
        box-sizing: border-box;
        padding: 26px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 16px;
        background:
          linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
        box-shadow: 0 14px 32px rgba(0,0,0,0.25);
      }

      .cf-detail + .cf-detail {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.11);
      }

      .cf-detail-label {
        margin-bottom: 7px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        font-size: 10px;
        font-weight: 800;
        opacity: 0.56;
      }

      .cf-detail-value {
        font-size: 17px;
        line-height: 1.55;
      }

      .cf-actions {
        margin-top: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-top: 8px;
      }

      .cf-actions-centered {
        justify-content: center;
      }

      .cf-actions button {
        min-height: 38px;
        padding: 8px 14px;
        border-radius: 8px;
        font-weight: 700;
      }

      .cf-primary {
        border: 1px solid rgba(255,255,255,0.28);
        background: rgba(255,255,255,0.14);
        color: inherit;
      }

      .cf-secondary {
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.04);
        color: inherit;
      }

      .cf-actions button:disabled {
        opacity: 0.38;
        cursor: not-allowed;
      }

      .cf-instruction {
        padding: 14px 16px;
        border-left: 3px solid rgba(255,255,255,0.4);
        background: rgba(255,255,255,0.045);
      }

      .cf-selection-summary {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 18px;
        align-items: center;
        padding: 18px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        background: rgba(255,255,255,0.04);
      }

      .cf-selection-summary > div:not(.cf-arrow) {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .cf-selection-summary span,
      .cf-complete-grid span {
        text-transform: uppercase;
        letter-spacing: 0.09em;
        font-size: 10px;
        font-weight: 800;
        opacity: 0.55;
      }

      .cf-selection-summary strong {
        font-size: 18px;
      }

      .cf-arrow {
        opacity: 0.4;
      }

      .cf-targets {
        margin: 0;
        padding: 14px;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 10px;
      }

      .cf-targets legend {
        padding: 0 8px;
        font-weight: 800;
      }

      .cf-target {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border: 1px solid rgba(255,255,255,0.11);
        border-radius: 9px;
        background: rgba(255,255,255,0.035);
        cursor: pointer;
      }

      .cf-target:hover,
      .cf-target.is-selected {
        border-color: rgba(255,255,255,0.36);
        background: rgba(255,255,255,0.09);
      }

      .cf-target input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .cf-radio {
        width: 18px;
        height: 18px;
        box-sizing: border-box;
        border: 2px solid rgba(255,255,255,0.45);
        border-radius: 50%;
        display: inline-block;
      }

      .cf-target.is-selected .cf-radio {
        border: 5px solid rgba(255,255,255,0.82);
      }

      .cf-target-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .cf-target-copy small {
        opacity: 0.55;
      }

      .cf-empty {
        margin: auto;
        max-width: 520px;
        padding: 28px;
        text-align: center;
        opacity: 0.72;
      }

      .cf-complete {
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .cf-success-icon {
        width: 68px;
        height: 68px;
        display: grid;
        place-items: center;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 50%;
        font-size: 28px;
      }

      .cf-complete-grid {
        width: min(100%, 640px);
        display: grid;
        gap: 10px;
      }

      .cf-complete-grid > div {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 13px;
        border: 1px solid rgba(255,255,255,0.11);
        border-radius: 9px;
        background: rgba(255,255,255,0.035);
      }

      @media (max-width: 800px) {
        .cf-card-grid {
          grid-template-columns: 1fr;
        }

        .cf-progress-step strong {
          display: none;
        }

        .cf-progress-line {
          width: 24px;
        }
      }
    `
  }
}
