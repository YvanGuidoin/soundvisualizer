import React from "react";

export interface SoundVisualizerProps {
  soundStream: MediaStream;
  fftSize: number;
  forceUpdater?: number;
  width: number;
  height: number;
  ratio: number;
  lineWidth?: number;
}
export interface SoundVisualizerState {
  circleRadius: number;
  maxBarSize: number;
}

class SoundVisualizer extends React.Component<SoundVisualizerProps, SoundVisualizerState> {
  canvas: React.RefObject<HTMLCanvasElement>;
  spectrum: Uint8Array;
  audioCtx?: AudioContext;
  analyser?: AnalyserNode;
  particles: Array<{ x: number; y: number; angle: number }>;
  constructor(props: SoundVisualizerProps) {
    super(props);
    this.state = {
      circleRadius: SoundVisualizer.getRadiusFromProps(props),
      maxBarSize: SoundVisualizer.getMaxBarSize(props),
    };
    this.canvas = React.createRef();
    this.spectrum = new Uint8Array(props.fftSize / 2);
    this.audioCtx = new AudioContext();
    this.processSound = this.processSound.bind(this);
    this.draw = this.draw.bind(this);
  }

  componentDidMount() {
    const { fftSize } = this.props;
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.6;
    this.processSound(this.props.soundStream);
    requestAnimationFrame(this.draw);
  }
  static getDerivedStateFromProps(nextProps: SoundVisualizerProps): SoundVisualizerState {
    return {
      circleRadius: SoundVisualizer.getRadiusFromProps(nextProps),
      maxBarSize: SoundVisualizer.getMaxBarSize(nextProps),
    };
  }
  componentDidUpdate(_prevProps: SoundVisualizerProps, _prevState: SoundVisualizerState) {
    this.analyser.fftSize = this.props.fftSize;
    this.spectrum = new Uint8Array(this.props.fftSize / 2);
    this.processSound(this.props.soundStream);
  }
  componentWillUnmount() {
    if (this.analyser && this.analyser.numberOfInputs > 0) this.analyser.disconnect();
    if (this.audioCtx) this.audioCtx.close();
    this.analyser = null;
    this.audioCtx = null;
  }
  private static distributeAngles(me: number, total: number) {
    return me / total * 2 * Math.PI + Math.PI / 3;
  }
  private static getRadiusFromProps(props: SoundVisualizerProps): number {
    return Math.min(props.width, props.height) * props.ratio / 2;
  }
  private static getMaxBarSize(props: SoundVisualizerProps): number {
    return Math.min(props.width, props.height) * (1 - props.ratio) / 2;
  }

  private processSound(stream: MediaStream) {
    const { width, height, fftSize } = this.props;
    const { circleRadius } = this.state;
    const particlesNumber = fftSize / 2;
    this.particles = Array(particlesNumber)
      .fill({})
      .map((_v, i) => {
        const angle = SoundVisualizer.distributeAngles(i, particlesNumber);
        return {
          x: width / 2 + Math.cos(angle) * circleRadius,
          y: height / 2 + Math.sin(angle) * circleRadius,
          angle,
        };
      });
    const input = this.audioCtx.createMediaStreamSource(stream);
    input.connect(this.analyser);
  }

  draw() {
    const { width, height, lineWidth, fftSize } = this.props;
    const { maxBarSize, circleRadius } = this.state;
    if (this.analyser && this.analyser.numberOfInputs > 0) {
      this.analyser.getByteFrequencyData(this.spectrum);
      const bufferLength = fftSize / 2;
      const canvasCtx = this.canvas.current.getContext("2d");
      canvasCtx.clearRect(0, 0, width, height);
      canvasCtx.fillStyle = "#ff7f27";
      canvasCtx.strokeStyle = "#ff7f27";
      canvasCtx.lineWidth = lineWidth || 1;
      /*         drawing         */
      let barHeight,
        x2,
        y2,
        overallVolumeSum = 0;
      // loop on each frequency
      for (var i = 0; i < bufferLength; i++) {
        overallVolumeSum += this.spectrum[i];
        barHeight = this.spectrum[i] / 256 * maxBarSize;
        const p = this.particles[i];
        x2 = width / 2 + Math.cos(p.angle) * (barHeight + circleRadius);
        y2 = height / 2 + Math.sin(p.angle) * (barHeight + circleRadius);
        canvasCtx.beginPath();
        canvasCtx.moveTo(p.x, p.y);
        canvasCtx.lineTo(x2, y2);
        canvasCtx.stroke();
        canvasCtx.closePath();
      }
      overallVolumeSum /= bufferLength;
      // overallVolumeSum = Math.sqrt(overallVolumeSum);
      overallVolumeSum /= 256;
      this.drawLogo(canvasCtx, overallVolumeSum);
    }
    requestAnimationFrame(this.draw);
  }

  private drawLogo(canvasCtx: CanvasRenderingContext2D, percentage: number): void {
    const { width, height } = this.props;
    const { circleRadius } = this.state;
    const midX = width / 2;
    const midY = height / 2;
    const smallCircleRadius = circleRadius / 3;

    const paths = [
      (c: CanvasRenderingContext2D) => {
        c.moveTo(midX - circleRadius / 3, midY + circleRadius / 2);
        c.lineTo(midX + circleRadius / 3, midY + circleRadius / 2);
      },
      (c: CanvasRenderingContext2D) => {
        c.moveTo(midX, midY + circleRadius / 2);
        c.lineTo(midX, midY + circleRadius / 3);
      },
      (c: CanvasRenderingContext2D) => {
        c.arc(midX, midY, circleRadius / 3, 0, Math.PI);
      },
      (c: CanvasRenderingContext2D) => {
        c.arc(midX, midY, smallCircleRadius, 0, Math.PI);
        c.moveTo(midX + smallCircleRadius, midY - smallCircleRadius);
        c.lineTo(midX + smallCircleRadius, midY);
        c.arc(midX, midY - smallCircleRadius, smallCircleRadius, 0, Math.PI, true);
        c.moveTo(midX - smallCircleRadius, midY - smallCircleRadius);
        c.lineTo(midX - smallCircleRadius, midY);
      },
    ];
    paths.forEach(f => {
      canvasCtx.beginPath();
      f(canvasCtx);
      canvasCtx.stroke();
      canvasCtx.closePath();
    });
    const fullHeight = circleRadius;
    const sizeToFill = Math.floor(fullHeight * percentage);
    if (sizeToFill < 1) {
      return;
    } else if (sizeToFill < smallCircleRadius) {
      // only part lower arc
      const sinusArc = (smallCircleRadius - sizeToFill) / smallCircleRadius;
      const angle = Math.asin(sinusArc);
      const cosinusBegin = Math.cos(angle);
      canvasCtx.beginPath();
      canvasCtx.arc(midX, midY, smallCircleRadius, angle, Math.PI - angle);
      canvasCtx.lineTo(midX + cosinusBegin * smallCircleRadius, midY + sinusArc * smallCircleRadius);
      canvasCtx.closePath();
      canvasCtx.fill();
    } else if (sizeToFill < smallCircleRadius * 2) {
      // lower arc + part of lines
      const heightOfLine = sizeToFill - smallCircleRadius;
      canvasCtx.beginPath();
      canvasCtx.arc(midX, midY, smallCircleRadius, 0, Math.PI);
      canvasCtx.lineTo(midX - smallCircleRadius, midY - heightOfLine);
      canvasCtx.lineTo(midX + smallCircleRadius, midY - heightOfLine);
      canvasCtx.lineTo(midX + smallCircleRadius, midY);
      canvasCtx.closePath();
      canvasCtx.fill();
    } else {
      // lower arc + lines + part of higher arc
      const sinusArc = (smallCircleRadius - (sizeToFill - smallCircleRadius * 2)) / smallCircleRadius;
      const angle = Math.asin(sinusArc);
      const cosinusBegin = Math.cos(angle);
      canvasCtx.beginPath();
      canvasCtx.arc(midX, midY, smallCircleRadius, 0, Math.PI);
      canvasCtx.lineTo(midX - smallCircleRadius, midY - smallCircleRadius);
      canvasCtx.arc(midX, midY - smallCircleRadius, smallCircleRadius, Math.PI, Math.PI + angle);
      canvasCtx.lineTo(
        midX + cosinusBegin * smallCircleRadius,
        midY - smallCircleRadius - sinusArc * smallCircleRadius,
      );
      canvasCtx.arc(midX, midY - smallCircleRadius, smallCircleRadius, Math.PI * 2 - angle, Math.PI * 2);
      canvasCtx.lineTo(midX + smallCircleRadius, midY);
      canvasCtx.closePath();
      canvasCtx.fill();
    }
  }

  render() {
    return <canvas width={this.props.width} height={this.props.height} ref={this.canvas} />;
  }
}

export default SoundVisualizer;
