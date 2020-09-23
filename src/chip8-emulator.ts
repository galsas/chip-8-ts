import Renderer, { RenderConfig } from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import Cpu from './cpu.js';

export interface Chip8EmulatorConfig {
  rendererConfig: RenderConfig
}

export default class Chip8Emulator {

  private readonly renderer: Renderer;
  private readonly keyboard: Keyboard;
  private readonly speaker: Speaker;
  private readonly cpu: Cpu;

  private fps = 60;
  private fpsInterval: number;
  private startTime: number;
  private now: number;
  private then: number;
  private elapsed: number;
  private loop: number;

  private readonly stepBinded: FrameRequestCallback;

  constructor(config: Chip8EmulatorConfig) {
    this.renderer = new Renderer(config.rendererConfig);
    this.keyboard = new Keyboard();
    this.speaker = new Speaker();
    this.cpu = new Cpu(this.renderer, this.keyboard, this.speaker);

    this.stepBinded = this.step.bind(this);
  }

  async init(romUrl: string) {
    this.fpsInterval = 1000 / this.fps;
    this.then = Date.now();
    this.startTime = this.then;

    const romData = await Chip8Emulator.loadRom(romUrl);

    if (romData) {
      this.cpu.loadProgram(romData);
      this.loop = requestAnimationFrame(this.stepBinded);
    }
  }

  setVolume(volume: number) {
    this.speaker.setVolume(volume);
  }

  dispose() {
    this.keyboard.dispose();
    cancelAnimationFrame(this.loop);
  }

  private step(_time: number) {
    this.now = Date.now();
    this.elapsed = this.now - this.then;

    if (this.elapsed > this.fpsInterval) {
      this.cpu.cycleTick();
    }

    this.loop = requestAnimationFrame(this.stepBinded);
  }

  private static async loadRom(url: string): Promise<Uint8Array> {
    const response = await fetch(url);

    if (response.status === 200) {
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }

    return null;
  }

}
