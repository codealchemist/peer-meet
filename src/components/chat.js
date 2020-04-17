import React, { useGlobal, useState, useEffect } from 'reactn'
import styled from 'styled-components'
import MicIcon from '@material-ui/icons/Mic'
import MicOffIcon from '@material-ui/icons/MicOff'
import { nanoid } from 'nanoid'
import Peer from 'services/peer'
import Signaling from 'services/signaling'
import { getRemoteId, Logger } from 'helpers'

const logger = new Logger('CHAT')
const connections = {}
const id = nanoid(12) // Our own id.
const localId = id
let localStream = null
let localAudio = null
const initiatorId = getRemoteId()
const signaling = new Signaling(id, initiatorId)
signaling.init(id)

if (initiatorId) {
  // Kickoff signaling.
  logger.log('KICKOFF! Send request...')
  signaling.send({ type: 'request' })
} else {
  logger.log('We are the FIRST PEER 🤘')
}

const messageActionsMap = {
  request: ({ remoteId, peer, signaling, isInitiator }) => {
    logger.log(`Got request from ${remoteId}:`, { peer, signaling })
    logger.log(
      `Got request message from ${remoteId}. We will send signals to this peer when available.`
    )
  },
  offer: ({ peer, signal, signaling }) => {
    logger.log('Got offer', { peer, signal, signaling })
    peer.connect(signal)
  },
  answer: ({ peer, signal, signaling }) => {
    logger.log('Got answer', { peer, signal, signaling })
    peer.connect(signal)
  },
  candidate: ({ peer, signal, signaling }) => {
    logger.log('Got candidate', { peer, signal, signaling })
    peer.connect(signal)
  },
}

// Local signals.
// Remote signals are received thru signaling channel as messages.
const signalActionMap = {
  answer: ({ id, remoteId, signal, peer, signaling }) => {
    logger.log(`Got ANSWER signal for ${remoteId}, sending it...`)
    signaling.send({ type: 'answer', targetId: remoteId, signal })
  },
  offer: ({ id, remoteId, signal, peer, signaling }) => {
    logger.log('Got OFFER signal, sending it...')
    signaling.send({ type: 'offer', targetId: remoteId, signal })
  },
  candidate: ({ id, remoteId, signal, peer, signaling }) => {
    logger.log('Got CANDIDATE signal, sending it...')
    signaling.send({ type: 'candidate', targetId: remoteId, signal })
  },
}

function createPeer({ remoteId, type, addStream, removeStream }) {
  const isInitiator = type === 'request'

  const peer = new Peer({
    id,
    isInitiator,
    stream: localStream,
  })
  peer
    .onSignal(({ signal, id }) => {
      // Signals received from the Peer object are always local.
      const type = signal.type || 'candidate'
      signalActionMap[type]({ id, remoteId, signal, peer, signaling })
    })
    .onStream(({ stream, id }) => {
      logger.log(`Set STREAM from ${id} 🎬`)
      addStream({ id: remoteId, peer, stream })
    })
    .onClose(() => {
      logger.log(`CLOSED ${remoteId} `)
      delete connections[remoteId]
      removeStream(remoteId)
    })
    .onError(({ id, error }) => {
      logger.log(`ERROR on ${remoteId} ❌`, error)
      delete connections[remoteId]
      removeStream(remoteId)
    })
    .init()

  peer.onConnect(() => {
    logger.log(`${localId} CONNECTED to ${remoteId}`)
    connections[remoteId].connected = true
    peer.send({ rock: 'yeah!' })
  })

  return peer
}

// TODO: handle case when two peers send a request almost
// at the same time; decide who will be the initiator.
function getPeer({
  remoteId,
  connections,
  type,
  totalConnections,
  addStream,
  removeStream,
}) {
  if (connections[remoteId]) {
    logger.log(`FOUND CONNECTION for ${remoteId}:`, connections[remoteId])
    return connections[remoteId].peer
  }

  // Create a new peer.
  const peer = createPeer({ remoteId, type, addStream, removeStream })
  logger.log('NEW PEER created', peer)

  connections[remoteId] = {
    id: remoteId,
    peer,
    connected: false,
  }

  return peer
}

const RemoteStreamsContainer = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
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
          height: auto;
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

const LocalVideo = styled.video`
  width: 100px;
  position: fixed;
  top: 10px;
  right: 10px;
  cursor: pointer;
  z-index: 20;
`

const Title = styled.h2`
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

const Stats = styled.div`
  position: fixed;
  bottom: 3.5vw;
  right: 3.5vw;
`

const Background = styled.div`
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

const BottomButtonContainer = styled.div`
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

const BottomLeftButtonContainer = styled(BottomButtonContainer)`
  left: 10px;
`

const BottomRightButtonContainer = styled(BottomButtonContainer)`
  right: 10px;
`

const StyledMicOn = styled(MicIcon)`
  color: red;
`

const StyledMicOff = styled(MicOffIcon)`
  color: white;
`

function Chat() {
  const [totalConnections, setTotalConnections] = useState(0)
  const [showLocalVideo, setShowLocalVideo] = useState(true)
  const [muted, setMuted] = useState(false)
  const streamsContainerId = 'streams-container'
  let streamsContainerEl = null
  const localVideoEl = React.createRef()

  const addStream = ({ id, peer, stream }) => {
    setTotalConnections(totalConnections + 1)
    logger.log('GOT REMOTE STREAM 🎬', peer)
    const video = document.createElement('video')
    video.srcObject = stream
    video.id = id
    if (!streamsContainerEl) {
      logger.log('EMPTY CONTAINER!', streamsContainerEl)
      return
    }
    streamsContainerEl.appendChild(video)
    video.addEventListener('dblclick', (e) => {
      e.preventDefault()
      e.stopPropagation()
      video.width = '100vw'
    })

    // Maximize / minimize video.
    video.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      const container = document.getElementById(streamsContainerId)
      const videoElements = container.querySelectorAll('video').length
      if (!videoElements || videoElements <= 1) return
      logger.log('Maximize / minimize video', videoElements)

      if (video.style.width === '100vw') {
        video.style.width = '100%'
        video.style.height = 'auto'
        video.style.objectFit = 'unset'
        video.style.zIndex = 10
        video.style.position = 'relative'
      } else {
        video.style.width = '100vw'
        video.style.height = '100vh'
        video.style.objectFit = 'cover'
        video.style.zIndex = 11
        video.style.position = 'absolute'
        video.style.top = 0
        video.style.left = 0
      }
    })
    video.play()
  }

  const removeStream = (id) => {
    setTotalConnections(totalConnections - 1)
    const video = document.getElementById(id)
    if (!video) return
    video.remove()
  }

  signaling.onRemoteSignal(({ id, targetId, type, signal }) => {
    if (targetId && targetId !== localId) {
      logger.log(`Skipping messages for other peer ${targetId}`)
      return
    }

    signal = signal || {}
    type = type || signal.type
    if (!type && signal.candidate) {
      type = 'candidate'
    }

    const peer = getPeer({
      remoteId: id,
      connections,
      type,
      totalConnections,
      addStream,
      removeStream,
    })
    messageActionsMap[type]({
      remoteId: id,
      peer,
      signal,
      signaling,
    })
  })

  const mute = () => {
    setMuted(!muted)
    localAudio.enabled = muted
  }

  useEffect(() => {
    streamsContainerEl = document.querySelector(`#${streamsContainerId}`)

    // Get browser media stream.
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true
      })
      .then((stream) => {
        logger.log('---- GOT LOCAL STREAM 🎬', stream)
        localStream = stream
        localAudio = stream.getAudioTracks()[0]
        localVideoEl.current.srcObject = localStream
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <Title onClick={() => setShowLocalVideo(true)}>{localId}</Title>
      {showLocalVideo && (
        <LocalVideo
          ref={localVideoEl}
          onClick={() => setShowLocalVideo(false)}
          autoPlay
          muted
        />
      )}
      <RemoteStreamsContainer
        id="streams-container"
        totalConnections={totalConnections}
      ></RemoteStreamsContainer>
      <BottomLeftButtonContainer onClick={mute}>
        {muted && <StyledMicOff />}
        {!muted && <StyledMicOn />}
      </BottomLeftButtonContainer>
      <BottomRightButtonContainer>
        🔌 {totalConnections}
      </BottomRightButtonContainer>
      <Background>
        <div>🎬</div>
      </Background>
    </>
  )
}

window.test = (msg) => {
  Object.entries(connections).map(([id, connection]) => {
    logger.log(`== SENDING TEST MESSAGE from ${localId} to ${id}`)
    connection.peer.send({
      from: localId,
      to: id,
      m: msg || `Hello ${id}! This is ${localId} :)`,
    })
  })
}
export default Chat
