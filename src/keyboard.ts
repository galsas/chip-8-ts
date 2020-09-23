
const KEYMAP = {
  49: 0x1, // 1
  50: 0x2, // 2
  51: 0x3, // 3
  52: 0xc, // 4
  81: 0x4, // Q
  87: 0x5, // W
  69: 0x6, // E
  82: 0xD, // R
  65: 0x7, // A
  83: 0x8, // S
  68: 0x9, // D
  70: 0xE, // F
  90: 0xA, // Z
  88: 0x0, // X
  67: 0xB, // C
  86: 0xF  // V
}

export type NextKeyPressHandler = (keyCode: number) => void;

export default class Keyboard {

  private keysPressed: boolean[] = [];
  private onNextKeyPressHandler: NextKeyPressHandler = null;
  private onKeyDownBinding: (event: KeyboardEvent) => void;
  private onKeyUpBinding: (event: KeyboardEvent) => void;

  constructor() {
    this.bindEvents();
  }

  set onNextKeyPress(handler: NextKeyPressHandler) {
    this.onNextKeyPressHandler = handler;
  }

  isKeyPressed(keyCode: number): boolean {
    return this.keysPressed[keyCode];
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDownBinding, false);
    window.removeEventListener('keyup', this.onKeyUpBinding, false);
  }

  private bindEvents(): void {
    this.onKeyDownBinding = this.onKeyDown.bind(this);
    this.onKeyUpBinding = this.onKeyUp.bind(this);
    window.addEventListener('keydown', this.onKeyDownBinding, false);
    window.addEventListener('keyup', this.onKeyUpBinding, false);
  }

  private onKeyDown(event: KeyboardEvent): void {
    const key = KEYMAP[event.keyCode];

    if (key) {
      this.keysPressed[key] = true;

      // onNextKeyPress mapped to a Chip-8 key
      if (this.onNextKeyPressHandler !== null) {
        this.onNextKeyPressHandler(parseInt(key));
        this.onNextKeyPressHandler = null;
      }
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const key = KEYMAP[event.keyCode];
    if (key) {
      this.keysPressed[key] = false;
    }
  }

}
