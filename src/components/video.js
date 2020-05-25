import React, { useState } from 'reactn'
import styled from 'styled-components'
import { Logger } from 'helpers'

const logger = new Logger('VIDEO')

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ isMaximized }) => {
    if (isMaximized) {
      return `
        width: 100vw;
        height: 100vh;
        background: black;
        position: absolute;
        z-index: 20;

        video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: contain !important;
          z-index: 11;
          position: absolute;
          top: 0;
          left: 0;
        }
      `
    }

    return `
      z-index: 10;
      position: relative;

      video {
        width: 100%;
        height: unset;
        object-fit: unset;
        z-index: 10;
        position: relative;
      }
    `
  }}
`

const Video = ({ id, stream }) => {
  const [isMaximized, setIsMaximized] = useState(false)

  const onVideoClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    logger.log('Maximize / minimize video', e)
    setIsMaximized(!isMaximized)
  }

  return (
    <VideoContainer onClick={onVideoClick} isMaximized={isMaximized}>
      <video
        ref={(video) => {
          if (!video || !stream) return
          video.srcObject = stream
        }}
        autoPlay
      />
    </VideoContainer>
  )
}

export default Video
