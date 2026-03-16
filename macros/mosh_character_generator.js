let me = game.user.character;

if (!me && game.user.isGM) {
  me = canvas.tokens.controlled[0]?.actor;
  if (me) ui.notifications.info("using " + me.name + " actor");
}
if (!me) {
  ui.notifications.error("no character");
  return;
}

me.sheet.render(true)

await new Promise((resolve) => {
  setTimeout(() => {
    resolve(true)
  }, 800)
})


const beforeGeneratorOpened = me.system.class.value

// open generator
document.querySelector("a.header-button.control.configure-actor")?.click();

// wait until the generator app exists
const app = await new Promise((resolve) => {
  const maxTries = 40;
  let tries = 0;

  const iv = setInterval(() => {
    tries++;

    const found = Object.values(ui.windows).find(w => w.constructor?.name === "DLActorGenerator");

    if (found) {
      clearInterval(iv);
      resolve(found);
    } else if (tries >= maxTries) {
      clearInterval(iv);
      resolve(null);
    }
  }, 100);
});

if (!app) {
  ui.notifications.error("generator window not found");
  return;
}

// find the class item by name
const className = beforeGeneratorOpened
if (!className) {
  ui.notifications.error("actor has no class value");
  return;
}

let classItem =
  game.items.find(i => i.type === "class" && i.name === className);

if (!classItem) {
  for (const pack of game.packs) {
    const docs = await pack.getDocuments({ type: "class" });
    classItem = docs.find(i => i.name === className);
    if (classItem) break;
  }
}

if (!classItem) {
  ui.notifications.error(`class not found: ${className}`);
  return;
}

// this is the important part
await app.updateClass(classItem.uuid);

ui.notifications.info(`loaded class ${classItem.name}`);
