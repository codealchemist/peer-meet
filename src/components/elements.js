import MicIcon from '@material-ui/icons/Mic'
import MicOffIcon from '@material-ui/icons/MicOff'
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
  justify-content: center;
  bottom: 10px;
  width: 10vh;
  height: 10vh;
  cursor: pointer;
  z-index: 20;
  color: #ddd;
`

export const BottomLeftButtonContainer = styled(BottomButtonContainer)`
  left: 10px;
`

export const BottomRightButtonContainer = styled(BottomButtonContainer)`
  right: 10px;
`

export const StyledMicOn = styled(MicIcon)`
  color: red;
`

export const StyledMicOff = styled(MicOffIcon)`
  color: white;
`
