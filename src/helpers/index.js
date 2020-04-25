export function getRemoteId() {
  const remoteId = window.location.pathname.substr(1)
  if (remoteId.length) return remoteId
  return null
}

export class Logger {
  constructor(prefix) {
    this.prefix = prefix
  }

  log() {
    if (this.prefix) {
      console.log(`${this.prefix}:`, ...arguments)
      return this
    }

    console.log(...arguments)
    return this
  }

  line() {
    console.log('-'.repeat(80))
  }
}

export const getMediaDevices = async (callback) => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const devicesByType = devices.reduce(
      (output, device) => {
        if (device.kind === 'videoinput') {
          output.video.push(device)
        }
        if (device.kind === 'audioinput') {
          output.audio.push(device)
        }
        return output
      },
      { audio: [], video: [] }
    )
    callback(devicesByType)
  } catch (err) {
    console.log('ERROR getting media devices:', err)
  }
}

export const getUserMedia = async (callback, config) => {
  try {
    const defaultConfig = {
      video: { facingMode: 'user' }, // Default to front camera.
      audio: true,
      options: {
        mirror: true
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia(
      config || defaultConfig
    )
    callback(stream)
  } catch (err) {
    console.log('ERROR getting user media:', err)
  }
}
