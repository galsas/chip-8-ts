
export default class Speaker {

  private readonly audioContext: AudioContext;
  private oscillator: OscillatorNode;
  private readonly gainNode: GainNode;
  private readonly destination: AudioDestinationNode;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.destination = this.audioContext.destination;

    this.gainNode.connect(this.destination);
  }

  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(volume / 100, this.audioContext.currentTime);
  }

  play(frequency: number): void {
    if (!this.oscillator) {
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.frequency.setValueAtTime(frequency || 480, this.audioContext.currentTime);
      this.oscillator.type = 'sine';
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
    }
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
  }

}
