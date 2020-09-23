import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';

declare type Uint16 = number;
declare type Uint8 = number;

/**
 * Sprites definition
 */
const SPRITES = [
// Hex     Binary      "0"
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0x90, // 10010000 // *  *
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****

// Hex     Binary      "1"
  0x20, // 00100000 //   *
  0x60, // 01100000 //  **
  0x20, // 00100000 //   *
  0x20, // 00100000 //   *
  0x70, // 01110000 //  ***

// Hex     Binary      "2"
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****

// Hex     Binary      "3"
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0xF0, // 11110000 // ****

// Hex     Binary      "4"
  0x90, // 10010000 // *  *
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0x10, // 00010000 //    *

// Hex     Binary      "5"
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0xF0, // 11110000 // ****

// Hex     Binary      "6"
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****

// Hex     Binary      "7"
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0x20, // 00100000 //   *
  0x40, // 01000000 //  *
  0x40, // 01000000 //  *

// Hex     Binary      "8"
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****

// Hex     Binary      "9"
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****
  0x10, // 00010000 //    *
  0xF0, // 11110000 // ****

// Hex     Binary      "A"
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0xF0, // 11110000 // ****
  0x90, // 10010000 // *  *
  0x90, // 10010000 // *  *

// Hex     Binary      "B"
  0xE0, // 11100000 // ***
  0x90, // 10010000 // *  *
  0xE0, // 11100000 // ***
  0x90, // 10010000 // *  *
  0xE0, // 11100000 // ***

// Hex     Binary      "C"
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0x80, // 10000000 // *
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****

// Hex     Binary      "D"
  0xE0, // 11100000 // ***
  0x90, // 10010000 // *  *
  0x90, // 10010000 // *  *
  0x90, // 10010000 // *  *
  0xE0, // 11100000 // ***

// Hex     Binary      "E"
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****

// Hex     Binary      "F"
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0xF0, // 11110000 // ****
  0x80, // 10000000 // *
  0x80, // 10000000 // *
];

export default class Cpu {

  private readonly memory: Uint8Array; // 4kb of memory
  private readonly v: Uint8Array; // 16 registers of 8-bit

  private i: Uint16; // address register 16-bit
  private pc: Uint16; // program counter 16-bit
  private stack: number[]; // stack size 16 - 16-bit

  private delayTimer: Uint8; // unsigned 8-bit value
  private soundTimer: Uint8; // unsigned 8-bit value

  private paused: boolean;
  private readonly speed: number;

  constructor(private renderer: Renderer,
              private keyboard: Keyboard,
              private speaker: Speaker) {

    this.memory = new Uint8Array(4096);
    this.v = new Uint8Array(16);
    this.i = 0;
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.pc = 0x200; // Start of most Chip-8 programs
    this.paused = false; // Some instructions require pausing, such as Fx0A.
    this.speed = 10;

    this.loadSprites();
  }

  loadProgram(programData: Uint8Array): void {
    for (let loc = 0; loc < programData.length; loc++) {
      this.memory[0x200 + loc] = programData[loc];
    }
  }

  cycleTick(): void {
    if (!this.paused) {
      for (let i = 0; i < this.speed; i++) {
        const opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];
        this.executeInstruction(opcode);
      }

      this.updateTimers();
    }

    this.playSound();
    this.renderer.render();
  }

  /**
   * Load sprites into the Chip-8 memory,
   * data should be stored in the interpreter area (0x000 to 0x1FF)
   */
  private loadSprites(): void {
    for (let i = 0; i < SPRITES.length; i++) {
      this.memory[i] = SPRITES[i];
    }
  }

  private updateTimers(): void {
    if (this.delayTimer > 0) {
      this.delayTimer -= 1;
    }

    if (this.soundTimer > 0) {
      this.soundTimer -= 1;
    }
  }

  private playSound() {
    if (this.soundTimer > 0) {
      this.speaker.play(480);
    } else {
      this.speaker.stop();
    }
  }

  private executeInstruction(opcode: number): void {
    // Each instruction is 2 bytes long
    this.pc += 2;

    // Value of the 2nd nibble
    const x = (opcode & 0x0F00) >> 8;

    // Value of the 3rd nibble
    const y = (opcode & 0x00F0) >> 4;

    switch (opcode & 0xF000) {
      case 0x0000:
        switch (opcode) {
          // 00E0 - CLS
          case 0x00E0:
            this.renderer.clear();
            break;

          // 00EE - RET
          case 0x00EE:
            this.pc = this.stack.pop();
            break;
        }
        break;

      // 1nnn - JP addr
      case 0x1000:
        this.pc = (opcode & 0xFFF);
        break;

      // 2nnn - CALL addr
      case 0x2000:
        this.stack.push(this.pc);
        this.pc = (opcode & 0xFFF);
        break;

      // 3xkk - SE Vx, byte
      case 0x3000:
        if (this.v[x] === (opcode & 0xFF)) {
          this.pc += 2;
        }
        break;

      // 4xkk - SNE Vx, byte
      case 0x4000:
        if (this.v[x] !== (opcode & 0xFF)) {
          this.pc += 2;
        }
        break;

      // 5xy0 - SE Vx, Vy
      case 0x5000:
        if (this.v[x] === this.v[y]) {
          this.pc += 2;
        }
        break;

      // 6xkk - LD Vx, byte
      case 0x6000:
        this.v[x] = (opcode & 0xFF);
        break;

      // 7xkk - ADD Vx, byte
      case 0x7000:
        this.v[x] += (opcode & 0xFF);
        break;

      case 0x8000:
        switch (opcode & 0xF) {
          // 8xy0 - LD Vx, Vy
          case 0x0:
            this.v[x] = this.v[y];
            break;

          // 8xy1 - OR Vx, Vy
          case 0x1:
            this.v[x] |= this.v[y];
            break;

          // 8xy2 - AND Vx, Vy
          case 0x2:
            this.v[x] &= this.v[y];
            break;

          // 8xy3 - XOR Vx, Vy
          case 0x3:
            this.v[x] ^= this.v[y];
            break;

          // 8xy4 - ADD Vx, Vy
          case 0x4:
            const sum = this.v[x] += this.v[y];
            this.v[0xF] = sum > 0xFF ? 1 : 0;
            break;

          // 8xy5 - SUB Vx, Vy
          case 0x5:
            this.v[0xF] = this.v[x] > this.v[y] ? 1 : 0;
            this.v[x] -= this.v[y];
            break;

          // 8xy6 - SHR Vx {, Vy}
          case 0x6:
            this.v[0xF] = this.v[x] & 0x1;
            this.v[x] >>= 1;
            break;

          // 8xy7 - SUBN Vx, Vy
          case 0x7:
            this.v[0xF] = this.v[y] > this.v[x] ? 1 : 0;
            this.v[x] = this.v[y] - this.v[x];
            break;

          // 8xyE - SHL Vx {, Vy}
          case 0xE:
            this.v[0xF] = this.v[x] & 0x80;
            this.v[x] <<= 1;
            break;
        }
        break;

      // 9xy0 - SNE Vx, Vy
      case 0x9000:
        if (this.v[x] !== this.v[y]) {
          this.pc += 2;
        }
        break;

      // Annn - LD I, addr
      case 0xA000:
        this.i = (opcode & 0xFFF);
        break;

      // Bnnn - JP V0, addr
      case 0xB000:
        this.pc = (opcode & 0xFFF) + this.v[0];
        break;

      // Cxkk - RND Vx, byte
      case 0xC000:
        const randValue = Math.floor(Math.random() * 0xFF);
        this.v[x] = randValue & (opcode & 0xFF);
        break;

      // Dxyn - DRW Vx, Vy, nibble
      case 0xD000:
        const width = 8;
        const height = (opcode & 0xF);

        this.v[0xF] = 0;

        for (let row = 0; row < height; row++) {
          let spriteRowValue = this.memory[this.i + row];

          for (let col = 0; col < width; col++) {
            if ((spriteRowValue & 0x80) > 0) {
              if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                this.v[0xF] = 1;
              }
            }
            spriteRowValue <<= 1;
          }
        }
        break;

      case 0xE000:
        switch (opcode & 0xFF) {
          // Ex9E - SKP Vx
          case 0x9E:
            if (this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;

          // ExA1 - SKNP Vx
          case 0xA1:
            if (!this.keyboard.isKeyPressed(this.v[x])) {
              this.pc += 2;
            }
            break;
        }

        break;

      case 0xF000:
        switch (opcode & 0xFF) {
          // Fx07 - LD Vx, DT
          case 0x07:
            this.v[x] = this.delayTimer;
            break;

          // Fx0A - LD Vx, K
          case 0x0A:
            this.paused = true;
            this.keyboard.onNextKeyPress = key => {
              this.v[x] = key;
              this.paused = false;
            };
            break;

          // Fx15 - LD DT, Vx
          case 0x15:
            this.delayTimer = this.v[x];
            break;

          // Fx18 - LD ST, Vx
          case 0x18:
            this.soundTimer = this.v[x];
            break;

          // Fx1E - ADD I, Vx
          case 0x1E:
            this.i += this.v[x];
            break;

          // Fx29 - LD F, Vx - ADD I, Vx
          case 0x29:
            this.i = this.v[x] * 5;
            break;

          // Fx33 - LD B, Vx
          case 0x33:
            // @ts-ignore
            this.memory[this.i] = parseInt(this.v[x] / 100);
            // @ts-ignore
            this.memory[this.i + 1] = parseInt((this.v[x] % 100) / 10);
            // @ts-ignore
            this.memory[this.i + 2] = parseInt(this.v[x] % 10);
            break;

          // Fx55 - LD [I], Vx
          case 0x55:
            for (let regIndex = 0; regIndex <= x; regIndex++) {
              this.memory[this.i + regIndex] = this.v[regIndex];
            }
            break;

          // Fx65 - LD Vx, [I]
          case 0x65:
            for (let regIndex = 0; regIndex <= x; regIndex++) {
              this.v[regIndex] = this.memory[this.i + regIndex];
            }
            break;
        }
        break;

      default:
        throw Error(`Unknown opcode ${opcode}`);
    }
  }

}
