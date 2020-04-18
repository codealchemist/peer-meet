import { nanoid } from 'nanoid'
import Peer from 'services/peer'
import Signaling from 'services/signaling'
import { getRemoteId, Logger } from 'helpers'

const logger = new Logger('PEER-MANAGER')
const connections = {}
export const localId = nanoid(12) // Our own id.
const initiatorId = getRemoteId()
const signaling = new Signaling(localId, initiatorId)
signaling.init(localId)

class PeerManager {
  setHooks({ addStream, removeStream }) {
    this.addStream = addStream
    this.removeStream = removeStream
  }

  setStream(stream) {
    this.localStream = stream
  }
}
const peerManager = new PeerManager()

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

function createPeer({ remoteId, type }) {
  const isInitiator = type === 'request'

  const peer = new Peer({
    id: localId,
    isInitiator,
    stream: peerManager.localStream,
  })
  peer
    .onSignal(({ signal, id }) => {
      // Signals received from the Peer object are always local.
      // if (connections[remoteId] && connections[remoteId].connected) {
      //   logger.log('Already connected! Avoid sending more signals.')
      //   return
      // }

      const type = signal.type || 'candidate'
      signalActionMap[type]({ id, remoteId, signal, peer, signaling })
    })
    .onStream(({ stream, id }) => {
      logger.log(`Set STREAM from ${id} 🎬`)
      peerManager.addStream({ id: remoteId, peer, stream })
    })
    .onClose(() => {
      logger.log(`CLOSED ${remoteId} `)
      delete connections[remoteId]
      peerManager.removeStream(remoteId)
    })
    .onError(({ id, error }) => {
      logger.log(`ERROR on ${remoteId} ❌`, error)
      // peer.reconnect()
    })
    .init()

  peer.onConnect(() => {
    logger.log(`${localId} CONNECTED to ${remoteId}`)
    connections[remoteId].connected = true
  })

  return peer
}

// TODO: handle case when two peers send a request almost
// at the same time; decide who will be the initiator.
function getPeer({ remoteId, connections, type }) {
  if (connections[remoteId]) {
    logger.log(`FOUND CONNECTION for ${remoteId}:`, connections[remoteId])
    return connections[remoteId].peer
  }

  // Create a new peer.
  const peer = createPeer({
    remoteId,
    type,
  })
  logger.log('NEW PEER created', peer)

  connections[remoteId] = {
    id: remoteId,
    peer,
    connected: false,
  }

  return peer
}

signaling.onRemoteSignal(({ id, targetId, type, signal }) => {
  if (targetId && targetId !== localId) {
    logger.log(`Skipping messages for other peer ${targetId}`)
    return
  }

  // if (connections[id] && connections[id].connected) {
  //   logger.log(`Already connected! Skipping message from ${id}`)
  //   return
  // }

  signal = signal || {}
  type = type || signal.type
  if (!type && signal.candidate) {
    type = 'candidate'
  }

  const peer = getPeer({
    remoteId: id,
    connections,
    type,
  })
  messageActionsMap[type]({
    remoteId: id,
    peer,
    signal,
    signaling,
  })
})

export default peerManager

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
