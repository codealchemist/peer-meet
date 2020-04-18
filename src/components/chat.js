import React, { useState, useEffect } from 'react'
import peerManager, { localId } from 'services/peer-manager'
import { Logger } from 'helpers'
import Video from './video'
import {
  RemoteStreamsContainer,
  LocalVideo,
  Title,
  Background,
  BottomLeftButtonContainer,
  BottomRightButtonContainer,
  StyledMicOn,
  StyledMicOff,
} from './elements'

const logger = new Logger('CHAT')

function Chat() {
  const [totalConnections, setTotalConnections] = useState(0)
  const [showLocalVideo, setShowLocalVideo] = useState(true)
  const [muted, setMuted] = useState(false)
  const [streams, setStreams] = useState([])
  const [localAudio, setLocalAudio] = useState()
  const [localStream, setLocalStream] = useState()

  const addStream = ({ id, peer, stream }) => {
    logger.log(`addStream: GOT REMOTE STREAM 🎬 from ${id}`, peer)
    const updatedStreams = streams.concat({ id, stream })
    setStreams(updatedStreams)
    setTotalConnections(updatedStreams.length)
  }

  const removeStream = (id) => {
    logger.log('removeStream', id)
    const updatedStreams = streams.filter((streamObj) => streamObj.id !== id)
    setStreams(updatedStreams)
    setTotalConnections(updatedStreams.length)
  }

  const mute = () => {
    setMuted(!muted)
    localAudio.enabled = muted
  }

  const getUserMedia = async (callback) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      callback(stream)
    } catch (err) {
      logger.log('ERROR getting user media:', err)
    }
  }

  // Init peer manager, which will handle signaling and peer interaction.
  peerManager.setHooks({ addStream, removeStream })

  useEffect(() => {
    getUserMedia((stream) => {
      logger.log('Got local stream 🎬', stream)
      setLocalAudio(stream.getAudioTracks()[0])
      setLocalStream(stream)
      peerManager.setStream(stream)
    })
  }, [])

  return (
    <>
      <Title onClick={() => setShowLocalVideo(true)}>{localId}</Title>
      {showLocalVideo && (
        <LocalVideo
          ref={(video) => {
            if (!video || !localStream) return
            video.srcObject = localStream
          }}
          onClick={() => setShowLocalVideo(false)}
          autoPlay
          muted
        />
      )}
      <RemoteStreamsContainer totalConnections={totalConnections}>
        {streams.map(({ id, stream }) => (
          <Video id={id} stream={stream} key={id} />
        ))}
      </RemoteStreamsContainer>
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

export default Chat
