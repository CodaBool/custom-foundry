const files = []

let dir = "codabool/audio/effects"
if (typeof args !== "undefined" && args?.[0]) dir = args[0]

const fileList = await FilePicker.browse("data", dir)
fileList.files.forEach((file) => files.push(file))

let content = `
<form>
  <div class="form-group" style="
    display:flex;
    flex-wrap:wrap;
    gap:6px;
    justify-content:center;
    align-items:flex-start;
  ">
`

files.forEach((file, index) => {
  const fileName = file.split("/").pop() || file
  const labelName = fileName.replace(/\.[^/.]+$/, "")
  const displayName = labelName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  content += `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <label for="sfx-${index}"
        title="${fileName}"
        style="
          position:relative;
          display:inline-block;
          width:170px;
          height:44px;
          cursor:pointer;
          border:1px solid rgba(255,255,255,0.22);
          border-radius:6px;
          overflow:hidden;
          background:rgba(0,0,0,0.32);
          padding:6px 8px 6px 30px;
          box-sizing:border-box;
        ">
        <input type="radio" name="select-me" value="${index}" id="sfx-${index}"
          style="
            position:absolute;
            left:7px;
            top:7px;
            width:16px;
            height:16px;
            z-index:2;
            opacity:1;
            appearance:auto;
            -webkit-appearance:radio;
            pointer-events:auto;
          ">
        <div style="
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          font-size:12px;
          line-height:1.05;
          word-break:break-word;
          overflow:hidden;
        ">
          ${displayName}
        </div>
      </label>
    </div>
  `
})

content += `
  </div>
</form>
`

foundry.applications.api.DialogV2.wait({
  window: { title: "Play Sound" },
  position: { width: window.innerWidth * 0.8, height: window.innerHeight * 0.8 },
  content,
  id: "select-dialog",
  buttons: [
    {
      action: "play",
      label: "Play Sound",
      icon: "fas fa-volume-up",
      callback: () => {
        const selected = document.querySelector('#select-dialog input[name="select-me"]:checked')?.value
        if (selected == null) return ui.notifications.error("No sound selected.")

        const file = files[Number(selected)]
        AudioHelper.play({ src: file, volume: 1.0, autoplay: true, loop: false }, true)
      },
    },
  ],
})

setTimeout(() => {
  const section = document.querySelector("#select-dialog section")
  if (section) section.style.overflow = "auto"
}, 200)
