import React, { useState, useEffect } from 'react'
import peerManager, { localId } from 'services/peer-manager'
import { Logger, getUserMedia, getMediaDevices } from 'helpers'
import { startCapture, isScreenCaptureSupported } from 'services/screen-share'
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
  StyledScreenShareOn,
  StyledScreenShareOff
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
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenSharingStream, setScreenSharingStream] = useState()

  const addStream = ({ id, peer, stream }) => {
    logger.log(`addStream: GOT REMOTE STREAM 🎬 from ${id}`, peer)
    const updatedStreams = streams.concat({ id, stream })
    setStreams(updatedStreams)
    setTotalConnections(updatedStreams.length)
  }

  const removeStream = ({ id, stream }) => {
    logger.log('removeStream', id, streams)
    const updatedStreams = streams.filter(
      (streamObj) => streamObj.stream !== stream
    )
    setStreams(updatedStreams)
    setTotalConnections(updatedStreams.length)
  }

  const mute = () => {
    setMuted(!muted)
    if (!localAudio) return
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

  const shareScreen = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false)
      removeStream({ id: localId, stream: screenSharingStream })
      peerManager.removeStreamFromAll(screenSharingStream)
      screenSharingStream.getTracks().forEach((track) => track.stop())
      setScreenSharingStream(null)
      return
    }

    const stream = await startCapture()
    if (!stream) return
    addStream({ id: localId, stream })
    setScreenSharingStream(stream)
    setIsScreenSharing(true)
    peerManager.addStreamToAll(stream)
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
        {streams.map(({ id, stream }, i) => (
          <Video id={id} stream={stream} key={`${i}-${id}`} />
        ))}
      </RemoteStreamsContainer>
      <BottomLeftButtonContainer>
        {muted && <StyledMicOff onClick={mute} />}
        {!muted && <StyledMicOn onClick={mute} />}

        {isScreenCaptureSupported() && (
          <>
            {isScreenSharing && <StyledScreenShareOn onClick={shareScreen} />}
            {!isScreenSharing && <StyledScreenShareOff onClick={shareScreen} />}
          </>
        )}
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
