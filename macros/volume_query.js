const MIN = 15;
const MAX = 35;

const playing = [];
let manualSounds
for (const playlist of game.playlists) {
  manualSounds = playlist.sounds.filter(s => s.volume !== 0.25 && s.flags?.["custom-foundry"]?.volume)
  for (const sound of playlist.sounds) {
    if (sound.playing) playing.push({ playlist, sound });
  }
}

game.socket.emit("module.custom-foundry", {
  action: "volumeQuery",
});


console.log("I have", manualSounds.length, "custom sound volumes in this world")
if (!playing.length) return

let content = `
<style>
  #sound-mixer-dialog section {
    overflow: auto;
  }

  #sound-mixer-dialog .sound-row {
    margin-bottom: 18px;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
  }

  #sound-mixer-dialog .sound-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  #sound-mixer-dialog .sound-name {
    font-size: 16px;
    font-weight: 700;
  }

  #sound-mixer-dialog .sound-value {
    font-size: 14px;
    min-width: 72px;
    text-align: right;
    opacity: 0.9;
  }

  #sound-mixer-dialog .sound-slider {
    width: 100%;
  }

  #sound-mixer-dialog .permanent-row {
    margin-bottom: 18px;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  #sound-mixer-dialog .permanent-row label {
    font-weight: 700;
    cursor: pointer;
  }
</style>

<form>
  <div style="display:flex; flex-direction:column; gap:10px;">
    <div class="permanent-row">
      <input type="checkbox" id="sound-mixer-permanent" name="permanent" />
      <label for="sound-mixer-permanent">If checked this volume change will be permanent</label>
    </div>
`;

playing.forEach(({ playlist, sound }, index) => {
  const rawValue = Math.round(sound.volume * 100);
  const clamped = Math.max(MIN, Math.min(MAX, rawValue));

  content += `
    <div class="sound-row">
      <div class="sound-header">
        <div class="sound-name">${sound.name}</div>
        <div class="sound-value" id="sound-value-${index}">${clamped}</div>
      </div>

      <input
        class="sound-slider"
        type="range"
        name="sound-${index}"
        value="${clamped}"
        min="${MIN}"
        max="${MAX}"
        step="1"
        data-index="${index}"
        data-playlist-id="${playlist.id}"
        data-sound-id="${sound.id}"
      />
    </div>
  `;
});

content += `
  </div>
</form>
`;

foundry.applications.api.DialogV2.wait({
  window: { title: "Playing Track Mixer" },
  position: {
    width: Math.min(window.innerWidth * 0.75, 900),
  },
  content,
  id: "sound-mixer-dialog",
  buttons: [{
    action: "apply",
    label: "Apply Volumes",
    icon: "fas fa-check",
    callback: async () => {
      const root = document.querySelector("#sound-mixer-dialog");
      if (!root) return;

      const permanent = !!root.querySelector("#sound-mixer-permanent")?.checked;
      const inputs = root.querySelectorAll(".sound-slider");

      for (const input of inputs) {
        const playlist = game.playlists.get(input.dataset.playlistId);
        const sound = playlist?.sounds.get(input.dataset.soundId);
        if (!sound) continue;

        const newVolume = Number(input.value) / 100;
        const changed = Math.abs(sound.volume - newVolume) >= 0.001;

        if (changed) {
          await sound.update({ volume: newVolume });
        }

        if (permanent) {
          await sound.setFlag("custom-foundry", "volume", newVolume);
        }
      }
    }
  }]
});

// Wait for dialog to actually exist, then bind listeners
setTimeout(() => {
  const root = document.querySelector("#sound-mixer-dialog");
  if (!root) return;

  const section = root.querySelector("section");
  if (section) section.style.overflow = "auto";

  const sliders = root.querySelectorAll(".sound-slider");

  for (const slider of sliders) {
    slider.addEventListener("input", (event) => {
      const el = event.currentTarget;
      const index = el.dataset.index;
      const valueEl = document.querySelector(`#sound-value-${index}`);
      if (valueEl) valueEl.textContent = el.value;
    });
  }
}, 200);
