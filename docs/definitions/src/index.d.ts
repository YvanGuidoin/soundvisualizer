/// <reference types="react" />
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
declare class SoundVisualizer extends React.Component<SoundVisualizerProps, SoundVisualizerState> {
    canvas: React.RefObject<HTMLCanvasElement>;
    spectrum: Uint8Array;
    audioCtx?: AudioContext;
    analyser?: AnalyserNode;
    particles: Array<{
        x: number;
        y: number;
        angle: number;
    }>;
    constructor(props: SoundVisualizerProps);
    componentDidMount(): void;
    static getDerivedStateFromProps(nextProps: SoundVisualizerProps): SoundVisualizerState;
    componentDidUpdate(_prevProps: SoundVisualizerProps, _prevState: SoundVisualizerState): void;
    componentWillUnmount(): void;
    private static distributeAngles(me, total);
    private static getRadiusFromProps(props);
    private static getMaxBarSize(props);
    private processSound(stream);
    draw(): void;
    private drawLogo(canvasCtx, percentage);
    render(): JSX.Element;
}
export default SoundVisualizer;
