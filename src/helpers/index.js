export function getRemoteId() {
  const remoteId = window.location.pathname.substr(1)
  if (remoteId.length) return remoteId
  return null
}

export class Logger {
  constructor(prefix) {
    this.prefix = prefix
  }

  log() {
    if (this.prefix) {
      console.log(`${this.prefix}:`, ...arguments)
      return this
    }

    console.log(...arguments)
    return this
  }

  line() {
    console.log('-'.repeat(80))
  }
}
