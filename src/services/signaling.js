import signalhub from 'signalhub'

class Signaling {
  constructor(id, remoteId) {
    this.id = id
    this.initiatorId = remoteId
    this.isInitiator = !remoteId
    this.baseUrl = `${window.location.protocol}//${window.location.host}`
    this.onErrorCallback = null

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
    this.channelName = this.initiatorId || this.id
    console.log('CHANNEL', this.channelName)
    this.hub = signalhub('peer-chat', [
      'https://peer-chat-signalhub.herokuapp.com',
    ])
    this.hub
      .subscribe(this.channelName)
      .on('data', (message) => this.onSignalMessage(message))

    // If not the initiator, request offer to initiator.
    // if (!this.isInitiator) {
    //   console.log('Signaling: SEND REQUEST MSG')
    //   this.hub.broadcast(this.channelName, { id: this.id, type: 'request' })
    // }

    return this
  }

  onSignalMessage(message) {
    const { id } = message || {}

    // Ignore own messages.
    if (id === this.id) return this
    console.log('new message received', message)

    // Only the initiator will answer with offers to other peers.
    // Send offer using signaling channel.
    // if (type === 'request') {
    //   this.hub.broadcast(this.channelName, {
    //     id: this.id,
    //     type: 'offer',
    //     signal: this.getOfferSignal(),
    //   })
    //   return this
    // }

    // Only normal peers will use signaling data from the initiator.
    // if (!this.isInitiator && type === 'request') return this
    // if (!signal) return this

    if (typeof this.onRemoteSignalCallback === 'function') {
      this.onRemoteSignalCallback(message)
    }
    return this
  }

  send(message) {
    this.hub.broadcast(this.channelName, {
      id: this.id,
      ...message,
    })
    return this
  }

  onRemoteSignal(callback) {
    this.onRemoteSignalCallback = callback
    return this
  }
}

export default Signaling
