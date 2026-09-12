// Dual Input Controller: Keyboard (PC) + Ergonomic Mobile On-Screen Touch Controls
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

    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window) || window.innerWidth < 900;

    this.initKeyboard();
    this.initTouch();
    this.initAutoRotateAndFullscreen();
  }

  initAutoRotateAndFullscreen() {
    const tryLandscapeAndFullscreen = () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (e) {}

      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen && !document.fullscreenElement) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen && !document.webkitFullscreenElement) {
          docEl.webkitRequestFullscreen();
        }
      } catch (e) {}
    };

    window.addEventListener('touchstart', tryLandscapeAndFullscreen, { once: true, passive: true });
    window.addEventListener('click', tryLandscapeAndFullscreen, { once: true, passive: true });
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
        case 'KeyC':
          if (window.game && typeof window.game.toggleCameraView === 'function') {
            window.game.toggleCameraView();
          }
          break;
        case 'KeyR':
          if (window.game && window.game.gameState === 'RACING' && typeof window.game.resetLocalCar === 'function') {
            window.game.resetLocalCar();
          }
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
        if (e.cancelable) e.preventDefault();
        this.state[key] = true;
        btn.classList.add('btn-pressed');
        if (navigator.vibrate) {
          navigator.vibrate(15);
        }
      };

      const handleEnd = (e) => {
        if (e.cancelable) e.preventDefault();
        this.state[key] = false;
        btn.classList.remove('btn-pressed');
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
