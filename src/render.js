// Buttons
const videoEl = document.querySelector("video")
const startBtn = document.getElementById("startBtn")
const stopBtn = document.getElementById("stopBtn")
const videoSelectBtn = document.getElementById("videoSelectBtn")

let mediaRecorder // MediaRecorder instance to capture footage
const recordedChunks = []

const { desktopCapturer, remote } = require("electron")
const fs = require("fs")

const { Menu, dialog } = remote

videoSelectBtn.onclick = getVideoSources

startBtn.onclick = (e) => {
  mediaRecorder.start()
  startBtn.classList.add("is-danger")
  startBtn.innerText = "Recording"
}

stopBtn.onclick = (e) => {
  mediaRecorder.stop()
  startBtn.classList.remove("is-danger")
  startBtn.innerText = "Start"
}

/**
 * Get the available video sources
 */
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  })

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return { label: source.name, click: () => selectSource(source) }
    })
  )

  videoOptionsMenu.popup()
}

/**
 * Change the videoSource window to record
 */
async function selectSource(source) {
  videoSelectBtn.innerText = source.name

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  }

  // Create a stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  // Preview the soure in a video element
  videoEl.srcObject = stream
  videoEl.play()

  // Create the Media Recorder
  const options = { mimeType: "video/webm; codecs=vp9" }
  mediaRecorder = new MediaRecorder(stream, options)

  // Register event handlers
  mediaRecorder.ondataavailable = handleDataAvailable
  mediaRecorder.onstop = handleStop
}

/**
 * Captures all recorded chunks
 */
function handleDataAvailable(e) {
  console.log("Video available")
  recordedChunks.push(e.data)
}

/**
 * Saves the video file on stop
 */
async function handleStop(e) {
  const blob = new Blob(recordedChunks, { type: "video/webm; codecs=vp9" })

  const buffer = Buffer.from(await blob.arrayBuffer())

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  })

  fs.writeFile(filePath, buffer, () => console.log("Saved!"))
}
