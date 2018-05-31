import React from "react";

import SoundVisualizer from "..";

export interface DeviceList {
  audio: Array<MediaDeviceInfo>;
}

function PromiseWaiter(time: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });
}
const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gridGap: "1rem",
  padding: "1rem",
};
const canvasStyle: React.CSSProperties = {
  backgroundColor: "white",
};

class WebRTCTestPage extends React.Component<{}> {
  state: {
    devices?: DeviceList;
    selectedMic?: string;
    displayTestAudio: boolean;
    audioStreamForceUpdate: number;
    width: number;
    height: number;
    ratio: number;
    fftSize: number;
    lineWidth: number;
  };
  testStreamAudio?: MediaStream;

  constructor(props: {}) {
    super(props);
    this.state = {
      devices: null,
      selectedMic: null,
      displayTestAudio: false,
      audioStreamForceUpdate: 1,
      width: 400,
      height: 400,
      ratio: 0.5,
      fftSize: 8,
      lineWidth: 1.2,
    };
    this.createDevices = this.createDevices.bind(this);
    this.changeTestAudioSource = this.changeTestAudioSource.bind(this);
  }

  componentWillMount() {
    this.createDevices();
  }

  componentWillUnmount() {
    if (this.testStreamAudio) this.testStreamAudio.getTracks().forEach(t => t.stop());
  }

  private async createDevices() {
    if (navigator.mediaDevices.enumerateDevices) {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS);
        const d = await navigator.mediaDevices.enumerateDevices();
        const devices = {
          audio: d.filter(i => i.kind === "audioinput"),
        };
        const tracks = stream.getTracks();
        const audioTrack = tracks.find(t => t.kind === "audio");
        const fromAudio = devices.audio.find(v => v.label === audioTrack.label);
        const selectedMic = fromAudio
          ? fromAudio.deviceId
          : devices.audio.length > 0
            ? devices.audio[0].deviceId
            : null;
        this.setState(
          {
            devices,
            selectedMic,
          },
          () => this.changeTestAudioSource(),
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (stream) stream.getTracks().forEach(t => t.stop());
      }
    }
  }

  private async changeTestAudioSource() {
    const { selectedMic } = this.state;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        deviceId: selectedMic,
        // sampleSize: { ideal: 8 },
        sampleRate: { ideal: 8000 },
      },
    });
    await PromiseWaiter(500); // to avoid sound noise on mic change
    if (this.testStreamAudio) this.testStreamAudio.getTracks().forEach(t => t.stop());
    this.testStreamAudio = stream;
    this.setState({
      displayTestAudio: true,
    });
  }

  render() {
    const { devices, selectedMic, displayTestAudio, width, height, ratio, lineWidth } = this.state;
    return (
      <div style={gridStyle}>
        <label>
          Microphone:
          <select
            value={selectedMic || ""}
            onChange={m => this.setState({ selectedMic: m.target.value }, () => this.changeTestAudioSource())}>
            {devices &&
              devices.audio &&
              devices.audio.map(m => (
                <option key={m.deviceId} value={m.deviceId}>
                  {m.label}
                </option>
              ))}
          </select>
        </label>
        <label>
          Width:
          <input
            type="number"
            value={this.state.width}
            min={1}
            max={1000}
            onChange={e => this.setState({ width: Number.parseInt(e.target.value) })}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            value={this.state.height}
            min={1}
            max={1000}
            onChange={e => this.setState({ height: Number.parseInt(e.target.value) })}
          />
        </label>
        <label>
          Ratio:
          <input
            type="range"
            value={this.state.ratio}
            step={0.01}
            min={0}
            max={1}
            onChange={e => this.setState({ ratio: Number.parseFloat(e.target.value) })}
          />
        </label>
        <label>
          FFT Size:
          <input
            type="range"
            value={this.state.fftSize}
            step={1}
            min={4}
            max={14}
            onChange={e => this.setState({ fftSize: Number.parseInt(e.target.value) })}
          />
        </label>
        <label>
          Line Width:
          <input
            type="range"
            value={this.state.lineWidth}
            step={0.1}
            min={0.1}
            max={10}
            onChange={e => this.setState({ lineWidth: Number.parseFloat(e.target.value) })}
          />
        </label>
        <div style={canvasStyle}>
          {displayTestAudio && (
            <SoundVisualizer
              soundStream={this.testStreamAudio}
              fftSize={Math.pow(2, this.state.fftSize)}
              forceUpdater={++this.state.audioStreamForceUpdate}
              width={width}
              height={height}
              ratio={ratio}
              lineWidth={lineWidth}
            />
          )}
        </div>
      </div>
    );
  }
}

export default WebRTCTestPage;
