import React from "react";

import SoundVisualizer from "..";
import PromiseWaiter from "./PromiseWaiter";

export interface DeviceList {
  video: Array<MediaDeviceInfo>;
  audio: Array<MediaDeviceInfo>;
}

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 }
  }
};

class WebRTCTestPage extends React.Component<{}> {
  state: {
    devices?: DeviceList;
    selectedMic?: string;
    selectedCam?: string;
    displayTestCam: boolean;
    displayTestAudio: boolean;
    audioStreamForceUpdate: number;
  };
  testVideo?: React.RefObject<HTMLVideoElement>;
  testStreamVideo?: MediaStream;
  testStreamAudio?: MediaStream;

  constructor(props: {}) {
    super(props);
    this.state = {
      devices: null,
      selectedMic: null,
      selectedCam: null,
      displayTestCam: false,
      displayTestAudio: false,
      audioStreamForceUpdate: 1
    };
    this.testVideo = React.createRef();
    this.testStreamVideo = null;
    this.changeConf = this.changeConf.bind(this);
    this.createDevices = this.createDevices.bind(this);
    this.changeTestVideoSource = this.changeTestVideoSource.bind(this);
    this.changeTestAudioSource = this.changeTestAudioSource.bind(this);
  }

  componentWillMount() {
    this.createDevices();
  }

  componentWillUnmount() {
    if (this.testStreamVideo)
      this.testStreamVideo.getTracks().forEach(t => t.stop());
    if (this.testStreamAudio)
      this.testStreamAudio.getTracks().forEach(t => t.stop());
  }

  private async createDevices() {
    if (navigator.mediaDevices.enumerateDevices) {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS);
        const d = await navigator.mediaDevices.enumerateDevices();
        const devices = {
          video: d.filter(i => i.kind === "videoinput"),
          audio: d.filter(i => i.kind === "audioinput")
        };
        const tracks = stream.getTracks();
        // audio
        const audioTrack = tracks.find(t => t.kind === "audio");
        const fromAudio = devices.audio.find(v => v.label === audioTrack.label);
        const selectedMic = fromAudio
          ? fromAudio.deviceId
          : devices.audio.length > 0
            ? devices.audio[0].deviceId
            : null;
        // video
        const videoTrack = tracks.find(t => t.kind === "video");
        const fromVideo = devices.video.find(v => v.label === videoTrack.label);
        const selectedCam = fromVideo
          ? fromVideo.deviceId
          : devices.video.length > 0
            ? devices.video[0].deviceId
            : null;
        this.setState(
          {
            devices,
            selectedMic,
            selectedCam
          },
          () => this.changeConf()
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (stream) stream.getTracks().forEach(t => t.stop());
      }
    }
  }

  private changeConf() {
    const { selectedCam, selectedMic } = this.state;
    this.changeTestAudioSource(selectedMic);
    this.changeTestVideoSource(selectedCam);
  }

  private async changeTestVideoSource(newDeviceID: string) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: newDeviceID,
        ...(DEFAULT_CONSTRAINTS.video as MediaTrackConstraints)
      },
      audio: false
    });
    await PromiseWaiter(500); // to avoid flashing cam
    if (this.testStreamVideo)
      this.testStreamVideo.getTracks().forEach(t => t.stop());
    this.testStreamVideo = stream;
    this.testVideo.current.srcObject = stream;
    this.testVideo.current.play();
    this.setState({ displayTestCam: true });
  }

  private async changeTestAudioSource(newDeviceID: string) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        deviceId: newDeviceID,
        // sampleSize: { ideal: 8 },
        sampleRate: { ideal: 8000 }
      }
    });
    await PromiseWaiter(500); // to avoid flashing cam
    if (this.testStreamAudio)
      this.testStreamAudio.getTracks().forEach(t => t.stop());
    this.testStreamAudio = stream;
    this.setState({
      displayTestAudio: true,
      audioStreamForceUpdate: this.state.audioStreamForceUpdate + 1
    });
  }

  render() {
    const {
      devices,
      selectedCam,
      selectedMic,
      displayTestAudio,
      displayTestCam
    } = this.state;
    return (
      <div>
        <div>
          {devices &&
            devices.video && (
              <label>
                <select
                  value={selectedCam}
                  onChange={m =>
                    this.setState({ selectedCam: m.target.value }, () =>
                      this.changeConf()
                    )
                  }
                >
                  {devices.video.map(m => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          <video
            ref={this.testVideo}
            style={!displayTestCam ? { height: 0 } : {}}
            muted
          />
          {devices &&
            devices.audio && (
              <label>
                <select
                  value={selectedMic}
                  onChange={m =>
                    this.setState({ selectedMic: m.target.value }, () =>
                      this.changeConf()
                    )
                  }
                >
                  {devices.audio.map(m => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          <div>
            {displayTestAudio && (
              <SoundVisualizer
                soundStream={this.testStreamAudio}
                fftSize={512}
                forceUpdater={this.state.audioStreamForceUpdate}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default WebRTCTestPage;
