import React from 'react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 125;
const RADIUS = CANVAS_HEIGHT * 0.4;
const MAX_BAR_SIZE = CANVAS_HEIGHT * 0.1;

class SoundVisualizer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logoLoaded: false
    };
    this.canvas = React.createRef();
    this.spectrum = new Uint8Array(props.fftSize / 2);
    this.audioCtx = new AudioContext();
    this.processSound = this.processSound.bind(this);
    this.draw = this.draw.bind(this);
  }

  componentDidMount() {
    const fftSize = this.props.fftSize;
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.6;
    this.processSound(this.props.soundStream);
    requestAnimationFrame(this.draw);
  }

  distributeAngles(me, total) {
    return me / total * 2 * Math.PI + Math.PI / 3;
  }

  drawLogo(canvasCtx, percentage) {
    const midX = CANVAS_WIDTH / 2;
    const midY = CANVAS_HEIGHT / 2;
    const micCircleRadius = RADIUS / 4;
    const paths = [c => {
      c.moveTo(midX - RADIUS / 3, midY + RADIUS / 2);
      c.lineTo(midX + RADIUS / 3, midY + RADIUS / 2);
    }, c => {
      c.moveTo(midX, midY + RADIUS / 2);
      c.lineTo(midX, midY + RADIUS / 3);
    }, c => {
      c.arc(midX, midY, RADIUS / 3, 0, Math.PI);
    }, c => {
      c.arc(midX, midY, micCircleRadius, 0, Math.PI);
      c.moveTo(midX + micCircleRadius, midY - micCircleRadius);
      c.lineTo(midX + micCircleRadius, midY);
      c.arc(midX, midY - micCircleRadius, micCircleRadius, 0, Math.PI, true);
      c.moveTo(midX - micCircleRadius, midY - micCircleRadius);
      c.lineTo(midX - micCircleRadius, midY);
    }];
    paths.forEach(f => {
      canvasCtx.beginPath();
      f(canvasCtx);
      canvasCtx.stroke();
      canvasCtx.closePath();
    });
    const fullHeight = micCircleRadius * 3;
    const sizeToFill = Math.floor(fullHeight * percentage);

    if (sizeToFill < 1) {
      return;
    } else if (sizeToFill < micCircleRadius) {
      // only part lower arc
      const sinusArc = (micCircleRadius - sizeToFill) / micCircleRadius;
      const angle = Math.asin(sinusArc);
      const cosinusBegin = Math.cos(angle);
      canvasCtx.beginPath();
      canvasCtx.arc(midX, midY, micCircleRadius, angle, Math.PI - angle);
      canvasCtx.lineTo(midX + cosinusBegin * micCircleRadius, midY + sinusArc * micCircleRadius);
      canvasCtx.closePath();
      canvasCtx.fill();
    } else if (sizeToFill < micCircleRadius * 2) {
      // lower arc + part of lines
      const heightOfLine = sizeToFill - micCircleRadius;
      canvasCtx.beginPath();
      canvasCtx.arc(midX, midY, micCircleRadius, 0, Math.PI);
      canvasCtx.lineTo(midX - micCircleRadius, midY - heightOfLine);
      canvasCtx.lineTo(midX + micCircleRadius, midY - heightOfLine);
      canvasCtx.lineTo(midX + micCircleRadius, midY);
      canvasCtx.closePath();
      canvasCtx.fill();
    } else {
      // lower arc + lines + part of higher arc
      const sinusArc = (micCircleRadius - (sizeToFill - micCircleRadius * 2)) / micCircleRadius;
      const angle = Math.asin(sinusArc);
      const cosinusBegin = Math.cos(angle);
      canvasCtx.beginPath();
      canvasCtx.arc(midX, midY, micCircleRadius, 0, Math.PI);
      canvasCtx.lineTo(midX - micCircleRadius, midY - micCircleRadius);
      canvasCtx.arc(midX, midY - micCircleRadius, micCircleRadius, Math.PI, Math.PI + angle);
      canvasCtx.lineTo(midX + cosinusBegin * micCircleRadius, midY - micCircleRadius - sinusArc * micCircleRadius);
      canvasCtx.arc(midX, midY - micCircleRadius, micCircleRadius, Math.PI * 2 - angle, Math.PI * 2);
      canvasCtx.lineTo(midX + micCircleRadius, midY);
      canvasCtx.closePath();
      canvasCtx.fill();
    }
  }

  draw() {
    if (this.analyser && this.analyser.numberOfInputs > 0) {
      this.analyser.getByteFrequencyData(this.spectrum);
      const bufferLength = this.analyser.frequencyBinCount;
      const canvasCtx = this.canvas.current.getContext("2d");
      canvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      canvasCtx.fillStyle = "#ff7f27";
      canvasCtx.strokeStyle = "#ff7f27";
      canvasCtx.lineWidth = 1.25;
      /*         drawing         */

      let barHeight,
          x2,
          y2,
          overallVolumeSum = 0; // loop on each frequency

      for (var i = 0; i < bufferLength; i++) {
        overallVolumeSum += this.spectrum[i] * this.spectrum[i];
        barHeight = this.spectrum[i] / 256 * MAX_BAR_SIZE;
        const p = this.particles[i];
        x2 = CANVAS_WIDTH / 2 + Math.cos(p.angle) * (barHeight + RADIUS);
        y2 = CANVAS_HEIGHT / 2 + Math.sin(p.angle) * (barHeight + RADIUS);
        canvasCtx.beginPath();
        canvasCtx.moveTo(p.x, p.y);
        canvasCtx.lineTo(x2, y2);
        canvasCtx.stroke();
        canvasCtx.closePath();
      }

      overallVolumeSum /= bufferLength;
      overallVolumeSum = Math.sqrt(overallVolumeSum);
      overallVolumeSum /= 256;
      this.drawLogo(canvasCtx, overallVolumeSum);
    }

    requestAnimationFrame(this.draw);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.forceUpdater && newProps.forceUpdater !== this.props.forceUpdater) {
      this.processSound(newProps.soundStream);
    }
  }

  componentWillUnmount() {
    if (this.analyser && this.analyser.numberOfInputs > 0) this.analyser.disconnect();
    if (this.audioCtx) this.audioCtx.close();
    this.analyser = null;
    this.audioCtx = null;
  }

  processSound(stream) {
    const particlesNumber = this.analyser.frequencyBinCount;
    this.particles = Array(particlesNumber).fill({}).map((_v, i) => {
      const angle = this.distributeAngles(i, particlesNumber / 2);
      return {
        x: CANVAS_WIDTH / 2 + Math.cos(angle) * RADIUS,
        y: CANVAS_HEIGHT / 2 + Math.sin(angle) * RADIUS,
        angle
      };
    });
    const input = this.audioCtx.createMediaStreamSource(stream);
    input.connect(this.analyser);
  }

  render() {
    return React.createElement("canvas", {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      ref: this.canvas
    });
  }

}

export default SoundVisualizer;
//# sourceMappingURL=index.es6.js.map
