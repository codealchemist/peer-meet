import React, { useGlobal, useState, useEffect } from 'reactn'
import styled from 'styled-components'
import { nanoid } from 'nanoid'
import Peer from 'services/peer'
import Signaling from 'services/signaling'
import { getRemoteId, Logger } from 'helpers'

const logger = new Logger('CHAT')
const connections = {}
const id = nanoid(12) // Our own id.
const localId = id
let localStream = null
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
  }
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
  }
}

function createPeer({ remoteId, type, addStream, removeStream }) {
  const isInitiator = type === 'request'

  const peer = new Peer({
    id,
    isInitiator,
    stream: localStream
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
      removeStream(remoteId)
    })
    .onError(({ id, error }) => {
      logger.log(`ERROR on ${remoteId} ❌`, error)
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
  setTotalConnections,
  addStream,
  removeStream
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

  setTotalConnections(totalConnections + 1)
  return peer
}

const RemoteStreamsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  video {
    width: 40vw;
  }
`

const LocalVideo = styled.video`
  width: 100px;
  position: fixed;
  top: 10px;
  right: 10px;
  cursor: pointer;
`

const Title = styled.h2`
  text-align: left;
  margin: 10px;
  cursor: pointer;
`

const Stats = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
`

function Chat() {
  const [totalConnections, setTotalConnections] = useState(0)
  const [showLocalVideo, setShowLocalVideo] = useState(true)
  const streamsContainerId = 'streams-container'
  let streamsContainerEl = null
  const localVideoEl = React.createRef()

  const addStream = ({id, peer, stream}) => {
    logger.log('GOT REMOTE STREAM 🎬', peer)
    const video = document.createElement('video')
    video.srcObject = stream
    video.id = id
    if (!streamsContainerEl) {
      logger.log('EMPTY CONTAINER!', streamsContainerEl)
      return
    }
    streamsContainerEl.appendChild(video)
    video.play()
  }

  const removeStream = (id) => {
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
      setTotalConnections,
      addStream,
      removeStream
    })
    messageActionsMap[type]({
      remoteId: id,
      peer,
      signal,
      signaling
    })
  })

  useEffect(() => {
    streamsContainerEl = document.querySelector(`#${streamsContainerId}`)

    // Get browser media stream.
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then((stream) => {
      logger.log('---- GOT LOCAL STREAM 🎬', stream)
      localStream = stream
      localVideoEl.current.srcObject = localStream
    }).catch(() => {})
  })

  return (
    <>
      <Title onClick={() => setShowLocalVideo(true)}>{localId}</Title>
      <Stats>
        🔌 {totalConnections}
      </Stats>

      { showLocalVideo &&
        <LocalVideo
          ref={localVideoEl}
          onClick={() => setShowLocalVideo(false)}
          autoPlay
        /> 
      }
      <RemoteStreamsContainer id="streams-container"></RemoteStreamsContainer>
    </>
  )
}

window.test = (msg) => {
  Object.entries(connections).map(([id, connection]) => {
    logger.log(`== SENDING TEST MESSAGE from ${localId} to ${id}`)
    connection.peer.send({
      from: localId,
      to: id,
      m: msg || `Hello ${id}! This is ${localId} :)`
    })
  })
}
export default Chat
