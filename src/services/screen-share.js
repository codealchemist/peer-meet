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