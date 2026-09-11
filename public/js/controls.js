// Dual Input Controller: Keyboard (PC) + Mobile On-Screen Touch Controls
class InputController {
  constructor() {
    this.state = {
      gas: false,
      brake: false,
      left: false,
      right: false,
      nitro: false,
      drift: false
    };

    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.state.gas = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.state.brake = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.state.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.state.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.state.nitro = true;
          break;
        case 'Space':
          this.state.drift = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.state.gas = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.state.brake = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.state.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.state.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.state.nitro = false;
          break;
        case 'Space':
          this.state.drift = false;
          break;
      }
    });
  }

  initTouch() {
    const bindTouch = (elemId, key) => {
      const btn = document.getElementById(elemId);
      if (!btn) return;

      const handleStart = (e) => {
        e.preventDefault();
        this.state[key] = true;
      };

      const handleEnd = (e) => {
        e.preventDefault();
        this.state[key] = false;
      };

      btn.addEventListener('touchstart', handleStart, { passive: false });
      btn.addEventListener('touchend', handleEnd, { passive: false });
      btn.addEventListener('touchcancel', handleEnd, { passive: false });

      // Fallback for mouse testing on desktop
      btn.addEventListener('mousedown', handleStart);
      btn.addEventListener('mouseup', handleEnd);
      btn.addEventListener('mouseleave', handleEnd);
    };

    bindTouch('touch-left', 'left');
    bindTouch('touch-right', 'right');
    bindTouch('touch-gas', 'gas');
    bindTouch('touch-brake', 'brake');
    bindTouch('touch-nitro', 'nitro');
  }

  getState() {
    return this.state;
  }
}
