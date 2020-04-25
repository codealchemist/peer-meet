import React, { useState, useEffect } from 'react'
import peerManager, { localId } from 'services/peer-manager'
import { Logger, getUserMedia, getMediaDevices } from 'helpers'
import Video from './video'
import {
  RemoteStreamsContainer,
  LocalVideo,
  Title,
  Background,
  BottomLeftButtonContainer,
  BottomRightButtonContainer,
  StyledMicOn,
  StyledMicOff
} from './elements'

const logger = new Logger('CHAT')

function Chat() {
  const [totalConnections, setTotalConnections] = useState(0)
  const [showLocalVideo, setShowLocalVideo] = useState(true)
  const [muted, setMuted] = useState(false)
  const [streams, setStreams] = useState([])
  const [localAudio, setLocalAudio] = useState()
  const [localStream, setLocalStream] = useState()
  const [videoDevices, setVideoDevices] = useState()
  const [totalVideoDevices, setTotalVideoDevices] = useState()
  const [selectedVideoDeviceIndex, setSelectedVideoDeviceIndex] = useState(0)

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

  const onLocalVideoClick = () => {
    // Switch video source if more than one are available.
    if (!videoDevices || totalVideoDevices < 2) return

    let nextIndex = selectedVideoDeviceIndex + 1
    if (nextIndex >= totalVideoDevices) nextIndex = 0 // Rotate.
    setSelectedVideoDeviceIndex(nextIndex)
    const newDevice = videoDevices[nextIndex]
    if (!newDevice) return
    logger.log('📹 Changed video source to:', newDevice)

    // Get stream from selected device.
    getUserMedia(
      (stream) => {
        const [currentVideoTrack] = localStream.getVideoTracks()
        const [newVideoTrack] = stream.getVideoTracks()
        localStream.removeTrack(currentVideoTrack)
        localStream.addTrack(newVideoTrack)
        const videoTracks = {
          currentVideoTrack,
          newVideoTrack
        }
        peerManager.changeVideoStream({
          videoTracks,
          oldStream: localStream,
          newStream: stream
        })
      },
      {
        video: { deviceId: newDevice.deviceId }
      }
    )
  }

  const onTitleClick = () => {
    setShowLocalVideo(!showLocalVideo)
  }

  // Init peer manager, which will handle signaling and peer interaction.
  peerManager.setHooks({ addStream, removeStream })

  useEffect(() => {
    getMediaDevices((devices) => {
      logger.log('Found MEDIA DEVICES 🎤📹', devices)
      setVideoDevices(devices.video)
      setTotalVideoDevices(devices.video.length)
    })
    getUserMedia((stream) => {
      logger.log('Got local stream 🎬', stream)
      setLocalAudio(stream.getAudioTracks()[0])
      setLocalStream(stream)
      peerManager.setStream(stream)
      setSelectedVideoDeviceIndex(0)
    })
  }, [])

  return (
    <>
      <Title onClick={onTitleClick}>{localId}</Title>
      {showLocalVideo && (
        <LocalVideo
          ref={(video) => {
            if (!video || !localStream) return
            video.srcObject = localStream
          }}
          onClick={onLocalVideoClick}
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
