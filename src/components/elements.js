import MicIcon from '@material-ui/icons/Mic'
import MicOffIcon from '@material-ui/icons/MicOff'
import PresentToAllIcon from '@material-ui/icons/PresentToAll'
import styled from 'styled-components'

export const RemoteStreamsContainer = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: grid;
  video {
    width: 100vw;
    height: 100vh;
    object-fit: cover;
  }

  ${({ totalConnections }) => {
    let video = ''
    if (totalConnections > 1) {
      video = `
        video {
          width: 100%;
        }
      `
    }

    if (totalConnections === 2) {
      return `
        ${video}
        grid-template-columns: 50% 50%;
        grid-template-rows: 100%;
      `
    }

    if (totalConnections >= 3) {
      return `
        ${video}
        grid-template-columns: 50% 50%;
        grid-template-rows: 50% 50%;
      `
    }

    if (totalConnections >= 5) {
      return `
        ${video}
        grid-template-columns: 33% 33% 33%;
        grid-template-rows: 50% 50%;
      `
    }

    if (totalConnections >= 7) {
      return `
        ${video}
        grid-template-columns: 33% 33% 33%;
        grid-template-rows: 33% 33% 33%;
      `
    }

    if (totalConnections >= 9) {
      return `
        ${video}
        grid-template-columns: 33% 33% 33%;
        grid-template-rows: 25% 25% 25% 25%;
      `
    }

    if (totalConnections >= 12) {
      return `
        ${video}
        grid-template-columns: 25% 25% 25% 25%;
        grid-template-rows: 25% 25% 25% 25%;
      `
    }
  }}
`

export const LocalVideo = styled.video`
  width: 100px;
  position: fixed;
  top: 10px;
  right: 10px;
  cursor: pointer;
  z-index: 20;
`

export const Title = styled.h2`
  text-align: left;
  margin: 10px;
  cursor: pointer;
  z-index: 30;
  background: black;
  padding: 10px;
  border-radius: 5px;
  position: fixed;
  opacity: 0.5;
`

export const Background = styled.div`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  z-index: -1;
  top: 0;

  div {
    font-size: 40vw;
    opacity: 0.2;
    filter: blur(4px);
  }
`

export const BottomButtonContainer = styled.div`
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  bottom: 10px;
  width: 150px;
  height: 60px;
  cursor: pointer;
  z-index: 20;
  color: #ddd;

  svg {
    padding: 20px;
  }
`

export const BottomLeftButtonContainer = styled(BottomButtonContainer)`
  left: 10px;
`

export const BottomRightButtonContainer = styled(BottomButtonContainer)`
  justify-content: flex-end;
  right: 30px;
`

export const StyledMicOn = styled(MicIcon)`
  color: red;
`

export const StyledMicOff = styled(MicOffIcon)`
  color: white;
`

export const StyledScreenShareOff = styled(PresentToAllIcon)`
  color: white;
`

export const StyledScreenShareOn = styled(PresentToAllIcon)`
  color: red;
`

export const Pad = styled.div`
  ${({ top, right, bottom, left, vertical, horizontal }) => {
    let output = ''
    if (top) output += `padding-top: ${top}px;`
    if (right) output += `padding-right: ${right}px;`
    if (bottom) output += `padding-bottom: ${bottom}px;`
    if (left) output += `padding-left: ${left}px;`
    if (vertical) output += `padding: ${vertical}px 0;`
    if (horizontal) output += `padding: 0 ${horizontal}px;`
    return output
  }}
`
