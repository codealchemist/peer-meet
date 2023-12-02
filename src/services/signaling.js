import { Realtime } from 'ably'
import { Logger } from 'helpers'

const logger = new Logger('[ SIGNALLING ]')
const baseUrl = window.location.origin

class Signaling {
  constructor(id, remoteId) {
    this.client = new Realtime({
      authUrl: `${baseUrl}/.netlify/functions/ably-token-request?clientId=${id}`,
      echoMessages: false
    })

    this.id = id
    this.initiatorId = remoteId
    this.isInitiator = !remoteId
    this.baseUrl = `${window.location.protocol}//${window.location.host}`
    this.onErrorCallback = null
    this.isConnected = false
    this.keepAliveSeconds = 10

    // Set sharing URL only when not connecting to an initiator.
    // The initiator creates sharing.
    this.shareUrl = ''
    if (this.isInitiator) this.setSharingUrl()
  }

  setSharingUrl() {
    this.shareUrl = `${this.baseUrl}/${this.id}`
    logger.log('CHANNEL: setSharingUrl', this.shareUrl)
    window.history.replaceState(null, document.title, this.shareUrl)
    return this
  }

  connect() {
    // this.socket = new WebSocket(`${this.serverUrl}/${this.channelId}`)
    this.channel = this.client.channels.get(this.channelId)
    return this
  }

  setEvents() {
    this.client.connection.on('connected', () => {
      logger.log('Connected to ably!')
      this.isConnected = true
    })

    this.client.connection.on('failed', () => {
      logger.log('Connection to ably failed')
    })

    this.channel.subscribe('message', (raw) => {
      const { data } = raw
      this.onMessage(data)
    })

    // this.socket.onopen = () => {
    //   this.isConnected = true
    //   logger.log('SOCKET CONNECTED')
    // }
    // this.socket.onmessage = (message) => {
    //   if (message.data === 'ping') return
    //   this.onMessage(message)
    // }
    // this.socket.onclose = (event) => {
    //   this.isConnected = false
    //   if (event.wasClean) {
    //     logger.log(
    //       `WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`
    //     )
    //     this.isConnected = false
    //     this.reconnect()
    //   } else {
    //     // e.g. server process killed or network down
    //     // event.code is usually 1006 in this case
    //     logger.log('WebSocket connection died')
    //     this.isConnected = false
    //     this.reconnect()
    //   }
    // }
    // this.socket.onerror = (error) => {
    //   logger.log('WebSocket connection error:', error.message)
    // }

    return this
  }

  init() {
    logger.log('PEER ID', this.id)
    logger.log('INITIATOR ID:', this.initiatorId || `${this.id} (me)`)
    this.channelId = this.initiatorId || this.id
    logger.log('CHANNEL', this.channelId)
    this.connect().setEvents()

    return this
  }

  reconnect() {
    logger.log('Reconnecting...')
    this.connect().setEvents()
  }

  // keepAlive() {
  //   setInterval(() => {
  //     if (!this.isConnected) return

  //     logger.log('🏓')
  //     this.socket.send('ping')
  //   }, 1000 * this.keepAliveSeconds)
  // }

  onMessage(message) {
    logger.log('new message received', message)

    if (typeof this.onRemoteSignalCallback === 'function') {
      this.onRemoteSignalCallback(message)
    }
    return this
  }

  send(message) {
    // Wait for connection.
    if (!this.isConnected) {
      logger.log('Wait for socket connection...')
      setTimeout(() => this.send(message), 250)
      return
    }

    this.channel.publish('message', message)

    // const data = JSON.stringify(message)
    // this.socket.send(data)
    return this
  }

  onRemoteSignal(callback) {
    this.onRemoteSignalCallback = callback
    return this
  }
}

export default Signaling
