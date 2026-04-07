let me = game.user.character

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor
  if (me) ui.notifications.info("using " + me.name + " actor")
}
if (!me) {
  ui.notifications.error("no character")
  return
}

const items = {
  general: [
    "Flashlight",
    "First Aid Kit",
    "Duct Tape",
    "Paracord (50m)",
    "Walkie Talkie",
    "Binoculars",
    "Notebook",
    "Lighter",
    "Face Mask",
    "Battery (High Power)",
    "Assorted Tools",
    "Screwdriver",
    "Pliers",
    "Toolbelt",
    "Zip Ties",
    "Evidence Bags",
    "USB Drives",
    "Radio Scanner",
    "Body Bag",
    "Head Lamp",
    "Water Filtration Device",
    "Mylar Blanket",
    "Camping Gear",
    "Bolt Cutters",
    "Lockpick Set",
    "Fake ID",
    "Burner Smartphone",
    "Camera",
    "Audio Recorder",

    "Rucksack",
    "Extension Cord (20m)",
    "Stimpak",
    "Pen Knife",
    "Cigarettes",
    "Shovel",
    "Six Pack of Beer",
    "Cat",
    "Leash",
    "Tennis Ball",
    "Foldable Stretcher",
    "Flare Gun",
    "Mylar Blanket",
    "Drill",
    "Standard Crew Attire",
    "Manufacturer Supplied Attire",
    "Rigging Gun",
  ],

  class: {
    Agent: [
      "Burner Smartphone",
      "Camera",
      "Audio Recorder",
      "Evidence Bags",
      "Binoculars",
      "Walkie Talkie",
      "Personal Locator",
      "Fake ID",
      "Notebook",
      "Corporate Attire",
      "Long-range Comms",
    "VIP Corporate Key Card",
          "Challenge Coin",
      "USB Drives",
      "Portable Computer Terminal",
      "Radio Scanner",
      "Polaroid Camera",
      "Keycard Cloner",
      "Flashlight",
      "Subsurface Scanner",
      "Satchel",
      "Briefcase",
      "Dog"
    ],

    Analyst: [
      "Forensic Tools",
      "Evidence Bags",
      "Drug Kit",
      "Thermal Camera",
      "Geiger Counter",
          "Stimpak",
          "Scrubs",
          "Vial of Acid",
          "Prescription Pad",
      "Sample Collection Kit",
      "Electronic Tool Set",
      "Bioscanner",
      "Defibrillator",
      "First Aid Kit",
      "Foldable Stretcher",
      "Lab Coat",
      "Medscanner",
      "Portable Computer Terminal",
      "Cybernetic Diagnostic Scanner",
      "Notebook",
      "Polaroid Camera",
      "Black Site File"
    ],

    Enforcer: [
    "Nail Gun",
      "Revolver",
      "Combat Knife",
      "Steel Pipe",
      "Baseball Bat",
      "Infrared Goggles",
      "Wrench",
      "Crowbar",
      "Zip Ties",
          "Stun Baton",
          "MRE",
      "Flashbang",
          "Ammo",
      "Flare",
      "Bolt Cutters",
      "Lockpick Set",
      "Tank Top & Camo Pants",
      "Walkie Talkie",
      "Face Mask",
      "Body Bag",
      "Bear Trap",
      "Tranquilizer",
    ],

    Subject: [
      "Amulet",
      "Sedative Pills",
      "Tranq Pistol",
      "Switchblade",
      "Pill Bottle",
      "Ritual Dagger",
      "Box Cutter",
      "Lighter",
      "Broken Bottle",
      "Notebook",
      "Fake ID",
      "Lockbox",
      "Audio Recorder",
      "Black Site File",
      "Face Mask",
      "Grease",
      "Spray Paint",
      "Body Bag",
    ]
  },

  background: {
    Agent: {
      dog: ["Walkie Talkie", "Personal Locator"],
      executive: ["Briefcase", "Burner Smartphone"],
      detective: ["Camera", "Audio Recorder"],
      "social worker": ["First Aid Kit", "Notebook"],
      journalist: ["Audio Recorder", "Polaroid Camera"]
    },

    Analyst: {
      curator: ["Evidence Bags", "Camera"],
      scientist: ["Sample Collection Kit", "Geiger Counter"],
      medical: ["Defibrillator", "Scalpel"],
      professor: ["Notebook", "Portable Computer Terminal"],
      "glint artisan": ["Assorted Tools", "Drill"]
    },

    Enforcer: {
      fugitive: ["Fake ID", "Burner Smartphone"],
      "bounty hunter": ["Tranq Pistol", "Binoculars"],
      mercenary: ["Semi-Auto Pistol", "Body Bag"],
      wolf: ["Walkie Talkie", "Switchblade"],
      bodyguard: ["Revolver", "Utility Knife"]
    },

    Subject: {
      indentured: ["Broken Bottle", "Pill Bottle"],
      defector: ["Fake ID", "Black Site File"],
      pupil: ["Notebook", "Sedative Pills"],
      liberator: ["Bolt Cutters", "Spray Paint"],
      haunted: ["Lockpick Set", "Audio Recorder"]
    }
  }
}


const CLASS_KEYS = Object.keys(items.class)
const BACKGROUND_KEYS = {
  Agent: Object.keys(items.background.Agent),
  Analyst: Object.keys(items.background.Analyst),
  Enforcer: Object.keys(items.background.Enforcer),
  Subject: Object.keys(items.background.Subject)
}

function normalize(str) {
  return String(str ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function sampleUnique(arr, count) {
  const pool = [...arr]
  const out = []
  while (pool.length && out.length < count) {
    const i = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(i, 1)[0])
  }
  return out
}

function findFirstString(obj, paths) {
  for (const path of paths) {
    let cur = obj
    let ok = true
    for (const part of path) {
      cur = cur?.[part]
      if (cur == null) {
        ok = false
        break
      }
    }
    if (ok && typeof cur === "string" && cur.trim()) return cur.trim()
  }
  return null
}

function detectClassFromActor(actor) {
  return actor.system.class.value
}

function detectBackgroundFromActor(actor, classKey) {
  return actor.flags["custom-foundry"].background
}

async function resolveItemByName(name) {
  const wanted = normalize(name)

  const worldItem = game.items.find(i => normalize(i.name) === wanted)
  if (worldItem) return worldItem.uuid

  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue
    const idx = await pack.getIndex({ fields: ["name"] })
    const hit = idx.find(i => normalize(i.name) === wanted)
    if (hit) {
      const doc = await pack.getDocument(hit._id)
      return doc?.uuid ?? null
    }
  }

  return null
}

async function addItemsToActor(actor, names) {
  function normalize(str) {
    return String(str ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
  }

  // count requested items by normalized name
  const wantedCounts = {}
  for (const name of names) {
    const key = normalize(name)
    if (!wantedCounts[key]) {
      wantedCounts[key] = { name, qty: 0 }
    }
    wantedCounts[key].qty += 1
  }

  // build lookup of world items by normalized name
  const worldItemsByName = new Map()
  for (const item of game.items) {
    const key = normalize(item.name)
    if (!worldItemsByName.has(key)) {
      worldItemsByName.set(key, item)
    }
  }

  const updates = []
  const creates = []

  for (const { name, qty } of Object.values(wantedCounts)) {
    const key = normalize(name)
    const sourceItem = worldItemsByName.get(key)

    if (!sourceItem) {
      ui.notifications.warn(`Item not found in game.items: ${name}`)
      console.warn(`Loadout item not found in game.items: ${name}`)
      continue
    }

    // see if actor already has this item
    const existing = actor.items.find(i => normalize(i.name) === key)

    if (existing) {
      const data = { _id: existing.id }

      // best-effort quantity handling across systems
      if (existing.system && typeof existing.system.quantity === "number") {
        data["system.quantity"] = existing.system.quantity + qty
      } else if (existing.system && typeof existing.system.qty === "number") {
        data["system.qty"] = existing.system.qty + qty
      } else if (existing.system && typeof existing.system.amount === "number") {
        data["system.amount"] = existing.system.amount + qty
      } else {
        // no quantity field found, create duplicates instead
        for (let i = 0; i < qty; i++) {
          creates.push(sourceItem.toObject())
        }
        continue
      }

      updates.push(data)
    } else {
      const itemData = sourceItem.toObject()

      // best-effort quantity assignment on first creation
      if (itemData.system) {
        if (typeof itemData.system.quantity === "number") {
          itemData.system.quantity = qty
        } else if (typeof itemData.system.qty === "number") {
          itemData.system.qty = qty
        } else if (typeof itemData.system.amount === "number") {
          itemData.system.amount = qty
        } else if (qty > 1) {
          // no quantity field, create duplicates below instead
          for (let i = 0; i < qty; i++) {
            creates.push(sourceItem.toObject())
          }
          continue
        }
      }

      creates.push(itemData)
    }
  }

  if (updates.length) {
    await actor.updateEmbeddedDocuments("Item", updates)
  }

  if (creates.length) {
    await actor.createEmbeddedDocuments("Item", creates)
  }
}

const classKey = detectClassFromActor(me)
if (!classKey) {
  ui.notifications.error(`could not detect class for ${me.name}`)
  console.error("Could not detect class from actor:", me)
  return
}

const backgroundKey = detectBackgroundFromActor(me, classKey)
if (!backgroundKey) {
  ui.notifications.error(`could not detect background for ${me.name}`)
  console.error("Could not detect background from actor:", me, "class:", classKey)
  return
}


const generalRoll = sampleUnique(items.general, 2)
const classRoll = sampleUnique(items.class[classKey], 2)
const backgroundItems = items.background[classKey]?.[backgroundKey] ?? []

if (backgroundItems.length !== 2) {
  ui.notifications.error(`background "${backgroundKey}" does not have exactly 2 items`)
  return
}

const loadoutItems = [
  ...generalRoll,
  ...classRoll,
  ...backgroundItems
]

console.log("Rolling for:", classKey, backgroundKey)
console.log("Random 2 General:", generalRoll)
console.log("Random 2 Class:", classRoll)
console.log("Set 2 Background:", backgroundItems)


if (me.items.size > 2) {
  ui.notifications.error("loadout cannot be rerolled")
  return
}

await addItemsToActor(me, loadoutItems)

ui.notifications.info(
  `Loadout items: ${loadoutItems.join(", ")}`
)
