import SimplePeer from 'simple-peer'
window.SimplePeer = SimplePeer

class Peer {
  constructor({ isInitiator = false, id, stream, config } = {}) {
    this.isInitiator = isInitiator
    this.id = id
    this.stream = stream
    this.config = config || {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        { urls: 'stun:stun.speedy.com.ar:3478' },
        {
          urls: 'turn:holis-turn.tk:3478',
          username: 'bert',
          credential: 'test'
        }
      ]
    }
  }

  init() {
    this.peer = new SimplePeer({
      initiator: this.isInitiator,
      stream: this.stream,
      config: this.config,
      trickle: true
    })
    this.setPeerEvents()
    return this
  }

  setPeerEvents() {
    console.log('set peer events')
    this.peer.on('error', (err) => {
      console.log('error', err)
      if (typeof this.onErrorCallback === 'function') {
        this.onErrorCallback({ id: this.id, error: err })
      }
    })

    this.peer.on('close', (err) => {
      console.log('close, err:', err)
      if (err) {
        if (typeof this.onCloseCallback === 'function') {
          this.onErrorCallback({ id: this.id, error: err })
        }
        return
      }

      if (typeof this.onCloseCallback === 'function') {
        this.onCloseCallback({ id: this.id })
      }
      // this.reconnect()
    })

    this.peer.on('signal', (signal) => {
      this.signal = signal
      if (typeof this.onSignalCallback === 'function') {
        this.onSignalCallback({ signal, id: this.id })
      }
    })

    this.peer.on('stream', (stream) => {
      this.stream = stream
      if (typeof this.onStreamCallback === 'function') {
        this.onStreamCallback({ stream, id: this.id })
      }
    })

    this.peer.on('track', (track, stream) => {
      if (typeof this.onTrackCallback === 'function') {
        this.onTrackCallback({ track, stream, id: this.id })
      }
    })

    this.peer.on('connect', () => {
      console.log('--- PEER CONNECTED ---')
      if (typeof this.onConnectCallback === 'function') {
        this.onConnectCallback()
      }
    })

    this.peer.on('data', (data) => {
      console.log('data: ' + data)
      if (typeof this.onDataCallback === 'function') {
        this.onDataCallback(data)
      }
    })
  }

  reconnect() {
    console.log('RECONNECT')
    this.destroy()
    this.init()
  }

  onError(callback) {
    this.onErrorCallback = callback
    return this
  }

  onClose(callback) {
    this.onCloseCallback = callback
    return this
  }

  onData(callback) {
    this.onDataCallback = callback
    return this
  }

  onSignal(callback) {
    this.onSignalCallback = callback
    return this
  }

  onStream(callback) {
    this.onStreamCallback = callback
    return this
  }

  onTrack(callback) {
    this.onTrackCallback = callback
    return this
  }

  onConnect(callback) {
    this.onConnectCallback = callback
    return this
  }

  send(data) {
    if (!this.peer.connected) return
    const message = JSON.stringify({ payload: data })
    console.log('Peer SEND', message)
    this.peer.send(message)
  }

  connect(remoteSignal) {
    this.peer.signal(remoteSignal)
  }

  destroy() {
    this.peer.destroy()
  }

  getPeerObject() {
    return this.peer
  }
}

export default Peer
