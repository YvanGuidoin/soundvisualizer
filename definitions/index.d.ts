/// <reference types="react" />
import React from "react";
export interface SoundVisualizerProps {
    soundStream: MediaStream;
    fftSize: number;
    forceUpdater?: number;
}
declare class SoundVisualizer extends React.Component<SoundVisualizerProps> {
    canvas: React.RefObject<HTMLCanvasElement>;
    spectrum: Uint8Array;
    audioCtx?: AudioContext;
    analyser?: AnalyserNode;
    particles: Array<{
        x: number;
        y: number;
        angle: number;
    }>;
    state: {
        logoLoaded: boolean;
    };
    constructor(props: SoundVisualizerProps);
    componentDidMount(): void;
    private distributeAngles(me, total);
    private drawLogo(canvasCtx, percentage);
    draw(): void;
    componentWillReceiveProps(newProps: SoundVisualizerProps): void;
    componentWillUnmount(): void;
    private processSound(stream);
    render(): JSX.Element;
}
export default SoundVisualizer;
