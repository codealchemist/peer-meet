import React, { useGlobal } from 'reactn'
import { nanoid } from 'nanoid'
import Peer from 'services/peer'
import Signaling from 'services/signaling'
import { getRemoteId, Logger } from 'helpers'

const logger = new Logger('CHAT')
const connections = {}
let totalConnections = 0
const localSignals = {}
const initialSignals = new Set()
const id = nanoid(12) // Our own id.
const localId = id
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
    if (!isInitiator) {
      logger.log('We are NOT the initiator peer, ignore request message.')
      return
    }
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
    logger.log(`Got ANSWER signal for ${remoteId}, sending it...`, {
      id,
      signal,
      peer,
      signaling,
    })
    // TODO: add id of target peer to avoid using answers on peers that didn't send an offer
    signaling.send({ targetId: remoteId, signal })
  },
  offer: ({ id, remoteId, signal, peer, signaling }) => {
    logger.log('Got OFFER signal', { id, signal, peer, signaling })
    signaling.send({
      id,
      targetId: remoteId,
      signal,
    })
  },
  candidate: ({ id, remoteId, signal, peer, signaling }) => {
    logger.log('Got CANDIDATE signal', { id, signal, peer, signaling })
    signaling.send({
      id,
      targetId: remoteId,
      signal,
    })
  },
}

function createPeer(remoteId, isInitiator) {
  logger.log('createPeer: remoteId:', remoteId)
  logger.log('Is initiator?', isInitiator)
  const peer = new Peer({
    id,
    isInitiator,
  })
  peer
    .onSignal(({ signal, id }) => {
      // Signals received from the Peer object are always local.
      const type = signal.type || 'candidate'
      signalActionMap[type]({ id, remoteId, signal, peer, signaling })
    })
    .init()

  peer.onConnect(() => {
    peer.send({ rock: 'yeah!' })
  })

  return peer
}

function getPeer({ remoteId, connections, isInitiator }) {
  if (connections[remoteId]) {
    logger.log(`FOUND CONNECTION for ${remoteId}:`, connections[remoteId])
    return connections[remoteId].peer
  }

  // Create a new peer.
  const peer = createPeer(remoteId, isInitiator)
  logger.log('NEW PEER created', peer)

  connections[remoteId] = {
    id: remoteId,
    peer,
    connected: false,
  }

  peer.onConnect(() => {
    connections[remoteId].connected = true
  })

  totalConnections += 1
  return peer
}

signaling.onRemoteSignal(({ id, targetId, type, signal }) => {
  if (targetId && targetId !== localId) {
    logger.log(`Skipping messages for other peer ${targetId}`)
    return
  }
  // if (connections[id] && connections[id].connected) {
  //   logger.log('Remote connection already stablished with', id)
  //   return
  // }

  // logger.log('Got remote message', { id, type, signal })
  signal = signal || {}
  type = type || signal.type
  if (!type && signal.candidate) {
    type = 'candidate'
  }

  // We'll create one local peer per remote one.
  let isInitiator = !initiatorId
  if (!isInitiator && type === 'request') {
    const initiatorId = [id, localId].sort().shift()
    if (initiatorId === localId) {
      isInitiator = true
    }
  }
  const peer = getPeer({ remoteId: id, connections, isInitiator })
  messageActionsMap[type]({
    remoteId: id,
    peer,
    signal,
    signaling,
    isInitiator,
  })
})

function Chat() {
  return null
}

window.test = () => {
  Object.entries(connections).map(([id, connection]) => {
    logger.log(`== SENDING TEST MESSAGE from ${localId} to ${id}`)
    connection.peer.send({ m: `Hello ${id}! This is ${localId} :)` })
  })
}
export default Chat
