
export interface RenderConfig {
  scale: number;
  canvas: HTMLCanvasElement;
  fillColor: string;
  cols: number;
  rows: number;
}

export default class Renderer {

  private readonly ctx: CanvasRenderingContext2D | null;
  private displayBuffer: number[];

  constructor(private config: RenderConfig) {
    this.ctx = config.canvas.getContext('2d');

    config.canvas.width = this.config.cols * config.scale;
    config.canvas.height = this.config.rows * config.scale;

    this.initDisplayBuffer();
  }

  setPixel(x: number, y: number): boolean {
    if (x > this.config.cols) {
      x -= this.config.cols;
    } else if (x < 0) {
      x += this.config.cols;
    }

    if (y > this.config.rows) {
      y -= this.config.rows;
    } else if (y < 0) {
      y += this.config.rows;
    }

    let pixelLoc = x + (y * this.config.cols);
    this.displayBuffer[pixelLoc] ^= 1;

    return !this.displayBuffer[pixelLoc];
  }

  render() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);

    for (let i = 0; i < this.config.cols * this.config.rows; i++) {
      if (this.displayBuffer[i]) {
        const x = (i % this.config.cols) * this.config.scale;
        const y = Math.floor(i / this.config.cols) * this.config.scale;

        this.ctx.fillStyle = this.config.fillColor;
        this.ctx.fillRect(x, y, this.config.scale, this.config.scale);
      }
    }
  }

  clear(): void {
    this.initDisplayBuffer();
  }

  private initDisplayBuffer(): void {
    this.displayBuffer = new Array(this.config.cols * this.config.rows);
  }

}