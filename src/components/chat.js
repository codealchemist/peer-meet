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
const initialPeer = createPeer(initiatorId)

if (initiatorId) {
  // Kickoff signaling.
  logger.log('Send request...')
  signaling.send({ type: 'request' })
}

function getLocalSignals(remoteId, callback) {
  if (totalConnections === 1) {
    logger.log('getLocalSignals: Using initial signals')
    callback(initialSignals)
    return
  }
  const signals = localSignals[remoteId]
  if (signals) {
    callback(signals)
    return
  }

  setTimeout(() => {
    logger.log('getLocalSignals: Local signals not ready, retry...')
    getLocalSignals(remoteId, callback)
  }, 1000)
}

const messageActionsMap = {
  request: ({ remoteId, peer, signaling }) => {
    logger.log(`Got request from ${remoteId}:`, { peer, signaling })

    getLocalSignals(remoteId, (signals) => {
      logger.log(`Sending local signals to ${remoteId}...`, signals)
      signals.forEach((signal) => {
        signaling.send({
          id,
          targetId: remoteId,
          signal,
        })
      })
    })
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

const signalActionMap = {
  answer: ({ id, remoteId, signal, peer, signaling }) => {
    logger.log('Got ANSWER signal', { id, signal, peer, signaling })
    // TODO: add id of target peer to avoid using answers on peers that didn't send an offer
    signaling.send({ targetId: remoteId, signal })
  },
  offer: ({ id, signal, peer, signaling }) => {
    logger.log('Got OFFER signal', { id, signal, peer, signaling })
  },
  candidate: ({ id, signal, peer, signaling }) => {
    logger.log('Got CANDIDATE signal', { id, signal, peer, signaling })
  },
}

function createPeer(remoteId) {
  logger.log('createPeer: remoteId:', remoteId)
  const peer = new Peer({
    id,
    isInitiator: !initiatorId,
  })
  peer
    .onSignal(({ signal, id }) => {
      // Signals received from the Peer object are always local.
      // logger.log('Own signal', signal)
      const type = signal.type || 'candidate'
      signalActionMap[type]({ id, remoteId, signal, peer, signaling })

      // Store local signals.
      if (!remoteId) {
        logger.log('createPeer: add initial signal', signal)
        initialSignals.add(signal)
      } else {
        logger.log(`createPeer: add local signal for: ${remoteId}`, signal)
        localSignals[remoteId] = localSignals[remoteId] || []
        localSignals[remoteId].push(signal)
      }
    })
    .init()

  peer.onConnect(() => {
    peer.send({ rock: 'yeah!' })
  })

  return peer
}

function getPeer({ remoteId, connections, initiatorId }) {
  if (connections[remoteId]) {
    logger.log(
      `getPeer: Found connection for ${remoteId}:`,
      connections[remoteId]
    )
    return connections[remoteId].peer
  }

  // Use existing Peer for first connection.
  let peer
  if (totalConnections === 0) {
    peer = initialPeer
    logger.log('getPeer: using initial peer', initialPeer)
  } else {
    peer = createPeer(remoteId)
    logger.log('getPeer: new peer created', peer)
  }

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
  if (connections[id] && connections[id].connected) {
    logger.log('Remote connection already stablished with', id)
    return
  }

  // logger.log('Got remote message', { id, type, signal })
  signal = signal || {}
  type = type || signal.type
  if (!type && signal.candidate) {
    type = 'candidate'
  }

  // We'll create one local peer per remote one.
  const peer = getPeer({ remoteId: id, connections, initiatorId })
  messageActionsMap[type]({ remoteId: id, peer, signal, signaling })
})

function Chat() {
  return null
}

export default Chat
