class Signaling {
  constructor(id, remoteId, serverUrl) {
    if (!serverUrl) {
      console.error('SIGNALING ERROR: serverUrl is required!')
    }

    this.id = id
    this.initiatorId = remoteId
    this.isInitiator = !remoteId
    this.baseUrl = `${window.location.protocol}//${window.location.host}`
    this.onErrorCallback = null
    this.isConnected = false
    this.serverUrl = serverUrl

    // Set sharing URL only when not connecting to an initiator.
    // The initiator creates sharing.
    this.shareUrl = ''
    if (this.isInitiator) this.setSharingUrl()
  }

  setSharingUrl() {
    this.shareUrl = `${this.baseUrl}/${this.id}`
    console.log('CHANNEL: setSharingUrl', this.shareUrl)
    window.history.replaceState(null, document.title, this.shareUrl)
    return this
  }

  init() {
    console.log('PEER ID', this.id)
    console.log('INITIATOR ID:', this.initiatorId || `${this.id} (me)`)
    this.channelId = this.initiatorId || this.id
    console.log('CHANNEL', this.channelId)
    this.socket = new WebSocket(`${this.serverUrl}/${this.channelId}`)
    this.socket.onopen = () => {
      this.isConnected = true
      console.log('SOCKET CONNECTED')
    }
    this.socket.onmessage = message => this.onMessage(message)
    this.socket.onclose = (event) => {
      this.isConnected = false
      if (event.wasClean) {
        console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`)
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        console.log('WebSocket connection died')
      }
    }
    this.socket.onerror = (error) => {
      console.log('WebSocket connection error:', error.message)
    }

    return this
  }

  onMessage({ data }) {
    const message = JSON.parse(data)
    console.log('new message received', message)

    if (typeof this.onRemoteSignalCallback === 'function') {
      this.onRemoteSignalCallback(message)
    }
    return this
  }

  send(message) {
    // Wait for connection.
    if (!this.isConnected) {
      console.log('Wait for socket connection...')
      setTimeout(() => this.send(message), 250)
      return
    }

    const data = JSON.stringify(message)
    this.socket.send(data)
    return this
  }

  onRemoteSignal(callback) {
    this.onRemoteSignalCallback = callback
    return this
  }
}

export default Signaling
