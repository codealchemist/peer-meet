export async function startCapture() {
  const displayMediaOptions = {
    video: {
      cursor: 'always'
    },
    audio: false
  }
  let captureStream = null

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    )
  } catch (err) {
    console.error('Error: ' + err)
  }
  return captureStream
}

export const isScreenCaptureSupported = () => {
  if (navigator.userAgent.match(/mobile/i)) return false
  return !!navigator.mediaDevices.getDisplayMedia
}
