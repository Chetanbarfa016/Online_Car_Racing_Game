// Master 3D Game Engine, AAA Showroom Turntable, AI Racers, Crash Lifeline & Ad Coordinator
class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.track = null;
    this.localCar = null;
    this.controls = null;
    this.network = null;
    this.ui = null;
    this.aiBots = []; // Array of AICarController

    this.clock = new THREE.Clock();
    this.cameraMode = 0; // 0: Dynamic Chase, 1: Hood Cam, 2: Orbit/Far Cam

    this.gameState = 'LOBBY';
    this.raceStartTime = 0;
    this.lastNetworkSync = 0;

    // Showroom Interactive Orbit Drag State
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.showroomAngle = Math.PI / 4;
    this.showroomElevation = 2.4;
    this.turntableMesh = null;
    this.showroomSpotlight = null;

    // Lighting References
    this.ambientLight = null;
    this.mainSunLight = null;
    this.fillLight = null;
    this.timeOfDay = 'night';

    // Warp Speed Streak Particles (Need for speed effect)
    this.warpParticles = null;
    this.warpCount = 150;

    // Victory Fireworks / Confetti
    this.fireworks = [];
    this.isPlatformPaused = false;

    this.init();
  }

  init() {
    // 1. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060812);
    this.scene.fog = new THREE.FogExp2(0x060812, 0.0032);

    // 2. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 15, -25);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting & Showroom
    this.initStudioEnvironment();
    this.initLighting();
    this.createShowroomTurntable();

    // 5. Track & Warp FX
    this.track = new RacingTrack(this.scene);
    this.initWarpSpeedParticles();

    // 6. Controllers, UI & Network
    this.controls = new InputController();
    this.ui = new UIController(this);
    this.network = new NetworkClient(this);

    // 7. Interactive Showroom Orbit Drag Listeners
    this.initShowroomControls();

    // 8. Window Resize & Playgama Platform Bridge Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.initPlatformBridgeListeners();

    // 9. Spawn Initial Preview Local Car on Menu
    this.localCar = new Car(this.scene, this.ui.selectedColor, true, this.ui.selectedModel, 'Racer_1');
    this.localCar.position.set(0, 0.46, 0);
    this.localCar.mesh.position.copy(this.localCar.position);

    // 10. Start Animation Loop
    this.animate();

    window.game = this;
    if (window.isPlaygamaReady && window.bridge && bridge.platform && bridge.platform.sendMessage) {
      try {
        bridge.platform.sendMessage('game_ready');
      } catch (e) {}
    }
  }

  initPlatformBridgeListeners() {
    // 1. Playgama Platform Sound & Audio State Listener (interstitial-ads-sound compliance)
    if (window.bridge && bridge.platform) {
      bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, (isAudioEnabled) => {
        console.log('[Playgama] Audio State:', isAudioEnabled);
        if (this.localCar && this.localCar.audioCtx) {
          if (!isAudioEnabled) {
            this.localCar.audioCtx.suspend();
          } else {
            this.localCar.audioCtx.resume();
          }
        }
      });

      // 2. Playgama Platform Pause State Listener
      bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, (isPaused) => {
        console.log('Playgama Pause State:', isPaused);
        this.isPlatformPaused = isPaused;
        if (isPaused && this.localCar && this.localCar.audioCtx) {
          this.localCar.audioCtx.suspend();
        } else if (!isPaused && this.localCar && this.localCar.audioCtx) {
          this.localCar.audioCtx.resume();
        }
      });
    }

    // 3. Browser Tab Switch (Visibility) Sound & Pause Compliance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.localCar && this.localCar.audioCtx) {
          this.localCar.audioCtx.suspend();
        }
      } else {
        if (this.localCar && this.localCar.audioCtx && !this.isPlatformPaused) {
          this.localCar.audioCtx.resume();
        }
      }
    });
  }

  initStudioEnvironment() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Sleek Dark Horizon Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.42, '#1e293b');
      bgGrad.addColorStop(0.55, '#0b1329');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 512);

      // Huge overhead softbox white light strip (produces razor-sharp car bodyline reflections)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 45;
      ctx.fillRect(200, 50, 624, 100);

      // Secondary softbox strip
      ctx.fillStyle = '#e2e8f0';
      ctx.shadowBlur = 30;
      ctx.fillRect(150, 160, 724, 40);

      // Left vibrant Cyan Studio Rim Softbox
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 50;
      ctx.fillRect(40, 180, 90, 180);

      // Right vibrant Magenta Studio Rim Softbox
      ctx.fillStyle = '#ff2a5f';
      ctx.shadowColor = '#ff2a5f';
      ctx.shadowBlur = 50;
      ctx.fillRect(894, 180, 90, 180);

      // Floor Horizon Line Reflection
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 20;
      ctx.fillRect(0, 265, 1024, 10);

      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = envTexture;
    } catch (e) {
      console.warn('Studio env map init notice:', e);
    }
  }

  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambientLight);

    // Key Front-Top Light
    this.mainSunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.mainSunLight.position.set(100, 160, 90);
    this.mainSunLight.castShadow = true;
    this.mainSunLight.shadow.mapSize.width = 2048;
    this.mainSunLight.shadow.mapSize.height = 2048;
    this.scene.add(this.mainSunLight);

    // Rim Backlight 1 (Cyan)
    this.fillLight = new THREE.DirectionalLight(0x00e5ff, 1.8);
    this.fillLight.position.set(-100, 90, -100);
    this.scene.add(this.fillLight);

    // Rim Backlight 2 (Magenta / Orange)
    this.rimLight2 = new THREE.DirectionalLight(0xff2a5f, 1.6);
    this.rimLight2.position.set(100, 70, -100);
    this.scene.add(this.rimLight2);

    // Showroom Overhead Focused Spotlight
    this.showroomSpotlight = new THREE.SpotLight(0xffffff, 3.2, 40, Math.PI / 3.5, 0.2, 1.0);
    this.showroomSpotlight.position.set(0, 12, 0);
    this.showroomSpotlight.castShadow = true;
    this.scene.add(this.showroomSpotlight);
  }

  setTimeOfDay(timeMode = 'night') {
    this.timeOfDay = timeMode;
    if (timeMode === 'day') {
      this.scene.background = new THREE.Color(0x60a5fa);
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0022);
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.9;
      }
      if (this.mainSunLight) {
        this.mainSunLight.color.setHex(0xfffbeb);
        this.mainSunLight.intensity = 1.8;
        this.mainSunLight.position.set(150, 220, 100);
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0xbae6fd);
        this.fillLight.intensity = 0.6;
        this.fillLight.position.set(-100, 80, -100);
      }
    } else if (timeMode === 'sunset') {
      this.scene.background = new THREE.Color(0x451a03);
      this.scene.fog = new THREE.FogExp2(0x78350f, 0.0028);
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xfef08a);
        this.ambientLight.intensity = 0.75;
      }
      if (this.mainSunLight) {
        this.mainSunLight.color.setHex(0xf97316);
        this.mainSunLight.intensity = 1.7;
        this.mainSunLight.position.set(200, 70, 120);
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0xec4899);
        this.fillLight.intensity = 0.85;
        this.fillLight.position.set(-120, 40, -120);
      }
    } else {
      this.scene.background = new THREE.Color(0x060812);
      this.scene.fog = new THREE.FogExp2(0x060812, 0.0032);
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xdbeafe);
        this.ambientLight.intensity = 0.65;
      }
      if (this.mainSunLight) {
        this.mainSunLight.color.setHex(0x00e5ff);
        this.mainSunLight.intensity = 1.4;
        this.mainSunLight.position.set(120, 180, 80);
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0xff2a5f);
        this.fillLight.intensity = 1.0;
        this.fillLight.position.set(-120, 90, -120);
      }
    }
  }

  createShowroomTurntable() {
    const turntableGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(5.2, 5.6, 0.3, 40);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111624,
      metalness: 0.95,
      roughness: 0.15
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    base.receiveShadow = true;

    const ringGeo = new THREE.TorusGeometry(5.25, 0.08, 12, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.31;

    const innerRingGeo = new THREE.TorusGeometry(3.5, 0.04, 12, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xff2a5f });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.31;

    turntableGroup.add(base, ring, innerRing);
    this.scene.add(turntableGroup);
    this.turntableMesh = turntableGroup;
  }

  initShowroomControls() {
    const handleStart = (clientX, clientY) => {
      if (this.gameState !== 'LOBBY') return;
      this.isDragging = true;
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isDragging || this.gameState !== 'LOBBY') return;
      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.showroomAngle -= deltaX * 0.008;
      this.showroomElevation = Math.max(1.2, Math.min(5.0, this.showroomElevation + deltaY * 0.01));
      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      this.isDragging = false;
    };

    window.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handleEnd);

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', handleEnd);
  }

  initWarpSpeedParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < this.warpCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 35,
        Math.random() * 8 + 0.5,
        Math.random() * 60 - 30
      );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.28,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    this.warpParticles = new THREE.Points(geometry, material);
    this.scene.add(this.warpParticles);
  }

  updateWarpParticles(delta) {
    if (!this.warpParticles || !this.localCar) return;

    const isHighSpeed = this.localCar.speed > 130 || this.localCar.isBoosting;
    const targetOpacity = isHighSpeed ? (this.localCar.isBoosting ? 0.8 : 0.4) : 0.0;
    this.warpParticles.material.opacity = THREE.MathUtils.lerp(
      this.warpParticles.material.opacity,
      targetOpacity,
      delta * 6
    );

    if (this.warpParticles.material.opacity > 0.02) {
      this.warpParticles.position.copy(this.localCar.position);
      this.warpParticles.rotation.y = this.localCar.rotation.y;

      const positions = this.warpParticles.geometry.attributes.position.array;
      for (let i = 2; i < positions.length; i += 3) {
        positions[i] -= (this.localCar.speed * 0.4) * delta;
        if (positions[i] < -30) {
          positions[i] = 30;
        }
      }
      this.warpParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Pre-Race & Post-Race Ad Hook (Playgama Bridge)
  showInterstitialAd(callback, placement = 'race_finished') {
    if (this.ui) {
      this.ui.showAdOverlay(() => {
        if (callback) callback();
      }, placement);
    } else {
      if (callback) callback();
    }
  }

  showRewardedAd(placement = 'bonus_nitro', callback) {
    if (this.ui) {
      this.ui.showRewardedAd(placement, callback);
    } else {
      if (callback) callback();
    }
  }

  // Start Single Player Quick Match vs AI Bots
  startSinglePlayerGame(skipAd = false) {
    const launch = () => {
      this.clearAIBots();
      this.localCar.repair();
      this.localCar.position.set(-3.5, 0.46, -10);
      this.localCar.rotation.set(0, 0, 0);
      this.localCar.speed = 0;
      this.localCar.currentLap = 1;
      this.localCar.currentCheckpoint = 0;
      this.localCar.finished = false;
      this.localCar.mesh.position.copy(this.localCar.position);
      this.localCar.mesh.rotation.set(0, 0, 0);

      this.spawnAIBots();

      const mockRoomData = {
        trackId: this.ui.selectedTrack || 'neon_city',
        players: [{ id: 'local', name: this.localCar.playerName, color: this.localCar.color, carModel: this.localCar.carModel }]
      };

      this.startCountdown(3, mockRoomData);
    };

    if (skipAd) {
      launch();
    } else {
      this.showInterstitialAd(launch, 'race_start');
    }
  }

  spawnAIBots() {
    this.clearAIBots();
    const botConfigs = [
      { name: 'Apex Bot', model: 'formula1', color: '#00e5ff', x: 3.5, z: -10, baseSpeed: 185, maxSpeed: 240 },
      { name: 'Solaris Bot', model: 'hypercar', color: '#ffea00', x: -3.5, z: -25, baseSpeed: 180, maxSpeed: 235 },
      { name: 'Thunder Bot', model: 'muscle', color: '#2979ff', x: 3.5, z: -25, baseSpeed: 175, maxSpeed: 230 },
      { name: 'Quantum Bot', model: 'speedster', color: '#ec4899', x: -3.5, z: -40, baseSpeed: 182, maxSpeed: 238 }
    ];

    botConfigs.forEach(cfg => {
      const car = new Car(this.scene, cfg.color, false, cfg.model, cfg.name);
      car.position.set(cfg.x, 0.46, cfg.z);
      car.mesh.position.copy(car.position);
      const botController = new AICarController(this, car, cfg);
      this.aiBots.push(botController);
    });
  }

  clearAIBots() {
    this.aiBots.forEach(b => {
      if (b.car && b.car.mesh) {
        this.scene.remove(b.car.mesh);
      }
    });
    this.aiBots = [];
  }

  startCountdown(seconds, roomData) {
    this.gameState = 'COUNTDOWN';
    this.ui.showGameHUD();
    this.ui.updateLifelines(this.localCar.lives, this.localCar.maxLives);

    if (this.turntableMesh) this.turntableMesh.visible = false;
    if (this.showroomSpotlight) this.showroomSpotlight.visible = false;

    let count = seconds;
    this.ui.showCountdown(count);

    const lights = this.track.startTrafficLights;
    if (lights.length > 0) {
      lights.forEach(l => l.material.color.setHex(0x330000));
    }

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        this.ui.showCountdown(0);
        this.startRace();
        if (lights.length > 0) {
          lights.forEach(l => l.material.color.setHex(0x00e676));
        }
      } else {
        this.ui.showCountdown(count);
        const lightIdx = Math.min(lights.length - 1, (seconds - count));
        if (lights[lightIdx]) {
          lights[lightIdx].material.color.setHex(0xff002b);
        }
      }
    }, 1000);
  }

  setupRoomCars(roomData) {
    if (roomData.trackId && this.track.trackId !== roomData.trackId) {
      this.track.init(roomData.trackId);
    }

    this.clearAIBots();
    this.network.remotePlayers.forEach(c => this.scene.remove(c.mesh));
    this.network.remotePlayers.clear();

    const localSocketId = this.network.socket ? this.network.socket.id : null;

    roomData.players.forEach(p => {
      if (p.id === localSocketId) {
        this.localCar.repair();
        this.localCar.setModel(p.carModel || 'supercar');
        this.localCar.setColor(p.color);
        this.localCar.setPlayerName(p.name || 'Racer');
        this.localCar.position.set(p.position.x, p.position.y, p.position.z);
        this.localCar.rotation.y = p.rotation.y;
        this.localCar.speed = 0;
        this.localCar.currentLap = 1;
        this.localCar.currentCheckpoint = 0;
        this.localCar.finished = false;
        this.localCar.mesh.position.copy(this.localCar.position);
        this.localCar.mesh.rotation.set(0, p.rotation.y, 0);

        const hudName = document.getElementById('hud-player-name');
        if (hudName) hudName.innerText = p.name || 'Racer';
      } else {
        const remoteCar = new Car(this.scene, p.color, false, p.carModel || 'supercar', p.name || 'Racer');
        remoteCar.position.set(p.position.x, p.position.y, p.position.z);
        remoteCar.mesh.position.copy(remoteCar.position);
        remoteCar.mesh.rotation.y = p.rotation.y;
        this.network.remotePlayers.set(p.id, remoteCar);
      }
    });
  }

  startRace() {
    this.gameState = 'RACING';
    this.raceStartTime = performance.now();
  }

  toggleCameraView() {
    this.cameraMode = (this.cameraMode + 1) % 3;
  }

  resetLocalCar() {
    if (!this.localCar || !this.track) return;
    const cp = this.track.checkpoints[this.localCar.currentCheckpoint] || this.track.checkpoints[0];
    this.localCar.resetToTrack(cp.position, cp.tangent);
  }

  // Crash Barrier Collision & 5-Hit Health System
  checkTrackCollision(delta) {
    if (!this.localCar || this.localCar.isWrecked || this.gameState !== 'RACING') return;

    const carPos = this.localCar.position;
    const halfWidth = (this.track.trackWidth || 24) / 2; // 12m
    const distToCenter = this.track.getDistanceToCenterline ? this.track.getDistanceToCenterline(carPos) : 0;
    const curCp = (this.track.checkpoints && this.track.checkpoints[this.localCar.currentCheckpoint]) ? this.track.checkpoints[this.localCar.currentCheckpoint] : { position: new THREE.Vector3(0, 0.46, 0) };

    // Check Stunt Ramps on Track
    if (this.track && this.track.stuntRamps) {
      this.track.stuntRamps.forEach(ramp => {
        if (!this.localCar.isAirborne && carPos.distanceTo(ramp.position) < ramp.radius) {
          this.localCar.triggerRampJump(ramp.stuntType);
        }
      });
    }

    // Check Nitro Pickups on Track
    if (this.track && this.track.nitroPickups) {
      this.track.nitroPickups.forEach(np => {
        if (np.active && carPos.distanceTo(np.mesh.position) < 3.5) {
          np.active = false;
          np.mesh.visible = false;
          this.localCar.nitroAmount = 100;
          this.ui.showToast('⚡ NITRO TANK COLLECTED! +100% BOOST');
          setTimeout(() => {
            np.active = true;
            np.mesh.visible = true;
          }, 8000);
        }
      });
    }

    // Case 1: Road se zyada bahar chala gaya (> 14m) -> Smoothly steer back onto road with momentum
    if (distToCenter > halfWidth + 1.8) {
      // Smoothly guide back onto the drivable track surface without stopping the race
      this.localCar.position.x = THREE.MathUtils.lerp(this.localCar.position.x, curCp.position.x, delta * 3.5);
      this.localCar.position.z = THREE.MathUtils.lerp(this.localCar.position.z, curCp.position.z, delta * 3.5);
      this.localCar.mesh.position.copy(this.localCar.position);
      this.localCar.speed = Math.max(35, this.localCar.speed * 0.88);
      this.localCar.emitCrashSparks(carPos);
      return;
    }

    // Case 2: Deewar / Guardrail se takraye / ragad khaye (Wall Scraping & Friction)
    if (distToCenter >= halfWidth - 0.4) {
      const speedAbs = Math.abs(this.localCar.speed);
      if (speedAbs > 10) {
        // Apply realistic wall friction deceleration (speed kam hoti hai lekin car smooth chalti rehti hai)
        this.localCar.speed *= Math.max(0.65, 1 - 0.55 * delta);

        // Continuous shower of sparks along the barrier
        this.localCar.emitCrashSparks(carPos);

        // Gently deflect car away from the wall so it slides smoothly along the barrier without getting stuck
        const pushDir = new THREE.Vector3().subVectors(curCp.position, carPos).setY(0).normalize();
        this.localCar.position.addScaledVector(pushDir, 0.28);
        this.localCar.mesh.position.copy(this.localCar.position);

        if (this.localCar.damageCooldown <= 0) {
          this.localCar.damageCooldown = 0.35;
          if (this.localCar.playCrashSound) {
            this.localCar.playCrashSound();
          }
        }
      }
    }
  }

  // Asphalt Nitro Combat & Takedown Collision System
  checkVehicleCollisions(delta) {
    if (!this.localCar || this.localCar.isWrecked || this.gameState !== 'RACING') return;

    const carPos = this.localCar.position;

    this.aiBots.forEach((bot) => {
      if (!bot.car || bot.car.isWrecked) return;

      const botPos = bot.car.position;
      const dist = carPos.distanceTo(botPos);

      if (dist < 3.2) {
        // Takedown Condition: Local player is Boosting / Shockwave at high speed
        if (this.localCar.isBoosting && Math.abs(this.localCar.speed) > 100) {
          bot.knockdown(this.localCar.velocity);
          this.localCar.nitroAmount = 100;
          this.localCar.emitCrashSparks(botPos);

          if (this.ui) {
            const takedownText = this.localCar.isShockwave ? '⚡ SHOCKWAVE TAKEDOWN!' : '💥 KNOCKDOWN!';
            this.ui.showStuntBadge(takedownText + ' +100% NITRO');
            this.ui.showToast('🏆 ' + takedownText + ' AI WRECKED!');
          }
        } else {
          // Regular bumper nudge collision
          const pushVector = new THREE.Vector3().subVectors(botPos, carPos).normalize();
          bot.car.position.addScaledVector(pushVector, 0.4);
          bot.car.mesh.position.copy(bot.car.position);
          this.localCar.position.addScaledVector(pushVector, -0.4);
          this.localCar.mesh.position.copy(this.localCar.position);
          this.localCar.emitCrashSparks(carPos);
        }
      }
    });
  }

  checkLapProgress() {
    if (!this.localCar || this.gameState !== 'RACING' || this.localCar.finished) return;

    const carPos = this.localCar.position;
    const nextCpIdx = (this.localCar.currentCheckpoint + 1) % this.track.checkpoints.length;
    const nextCp = this.track.checkpoints[nextCpIdx];

    const dist = carPos.distanceTo(nextCp.position);

    if (dist < nextCp.radius) {
      this.localCar.currentCheckpoint = nextCpIdx;

      if (nextCpIdx === 0) {
        this.localCar.currentLap++;
        this.ui.showToast('🏁 LAP ' + (this.localCar.currentLap - 1) + ' COMPLETED!');

        if (this.localCar.currentLap > 3) {
          this.localCar.finished = true;
          const totalTime = (performance.now() - this.raceStartTime) / 1000;
          this.network.sendRaceFinished(totalTime);
          this.spawnFireworks();

          // Trigger Post-Race Interstitial Ad before showing Podium
          setTimeout(() => {
            this.showInterstitialAd(() => {
              this.showPodiumResults();
            }, 'race_finished');
          }, 1200);
        }
      }

      this.network.sendCheckpointPassed(this.localCar.currentCheckpoint, this.localCar.currentLap);
    }
  }

  showPodiumResults() {
    const allRacers = [
      {
        name: this.localCar.playerName,
        lap: this.localCar.currentLap,
        cp: this.localCar.currentCheckpoint,
        color: this.localCar.color,
        model: this.localCar.carModel,
        time: ((performance.now() - this.raceStartTime) / 1000).toFixed(2) + 's'
      }
    ];

    this.aiBots.forEach(bot => {
      allRacers.push({
        name: bot.name,
        lap: bot.car.currentLap,
        cp: bot.car.currentCheckpoint,
        color: bot.car.color,
        model: bot.car.carModel,
        time: ((performance.now() - this.raceStartTime) / 1000 + Math.random() * 2).toFixed(2) + 's'
      });
    });

    this.network.remotePlayers.forEach((rcar, id) => {
      allRacers.push({
        name: rcar.playerName || 'Racer',
        lap: rcar.currentLap || 1,
        cp: rcar.currentCheckpoint || 0,
        color: rcar.color,
        model: rcar.carModel,
        time: 'Finished'
      });
    });

    allRacers.sort((a, b) => {
      if (b.lap !== a.lap) return b.lap - a.lap;
      return b.cp - a.cp;
    });

    this.ui.showPodiumScreen(allRacers);
  }

  spawnFireworks() {
    const colors = [0x00e5ff, 0xff2a5f, 0xffea00, 0x00e676, 0xffffff];
    for (let f = 0; f < 5; f++) {
      const pCount = 80;
      const geo = new THREE.BufferGeometry();
      const pos = [];
      const vel = [];

      const origin = new THREE.Vector3().copy(this.localCar.position).add(
        new THREE.Vector3((Math.random() - 0.5) * 30, 15 + Math.random() * 10, (Math.random() - 0.5) * 30)
      );

      for (let i = 0; i < pCount; i++) {
        pos.push(origin.x, origin.y, origin.z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const spd = 6 + Math.random() * 12;
        vel.push(
          Math.sin(phi) * Math.cos(theta) * spd,
          Math.cos(phi) * spd,
          Math.sin(phi) * Math.sin(theta) * spd
        );
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: colors[f % colors.length],
        size: 0.4,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
      });

      const particleSystem = new THREE.Points(geo, mat);
      this.scene.add(particleSystem);
      this.fireworks.push({ system: particleSystem, velocities: vel, life: 0, maxLife: 2.0 });
    }
  }

  updateFireworks(delta) {
    for (let f = this.fireworks.length - 1; f >= 0; f--) {
      const fw = this.fireworks[f];
      fw.life += delta;
      if (fw.life >= fw.maxLife) {
        this.scene.remove(fw.system);
        this.fireworks.splice(f, 1);
      } else {
        const positions = fw.system.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3] += fw.velocities[i * 3] * delta;
          positions[i * 3 + 1] += fw.velocities[i * 3 + 1] * delta - (9.8 * delta * delta);
          positions[i * 3 + 2] += fw.velocities[i * 3 + 2] * delta;
        }
        fw.system.geometry.attributes.position.needsUpdate = true;
        fw.system.material.opacity = 1 - (fw.life / fw.maxLife);
      }
    }
  }

  updateRankings() {
    if (!this.localCar) return;

    const allRacers = [
      {
        id: 'local',
        lap: this.localCar.currentLap,
        cp: this.localCar.currentCheckpoint,
        pos: this.localCar.position
      }
    ];

    this.aiBots.forEach((bot, idx) => {
      allRacers.push({
        id: 'ai_' + idx,
        lap: bot.car.currentLap || 1,
        cp: bot.car.currentCheckpoint || 0,
        pos: bot.car.position
      });
    });

    this.network.remotePlayers.forEach((rcar, id) => {
      allRacers.push({
        id: id,
        lap: rcar.currentLap || 1,
        cp: rcar.currentCheckpoint || 0,
        pos: rcar.mesh.position
      });
    });

    allRacers.sort((a, b) => {
      if (b.lap !== a.lap) return b.lap - a.lap;
      return b.cp - a.cp;
    });

    const myRank = allRacers.findIndex(r => r.id === 'local') + 1;
    this.ui.updateRankings(myRank, allRacers.length);
  }

  updateCamera(delta) {
    if (!this.localCar) return;

    const carPos = this.localCar.position;
    const carRot = this.localCar.rotation.y;
    const speedRatio = Math.abs(this.localCar.speed) / this.localCar.maxSpeed;

    const targetFOV = 60 + speedRatio * 18 + (this.localCar.isBoosting ? 8 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 6);
    this.camera.updateProjectionMatrix();

    let shakeX = 0;
    let shakeY = 0;
    if (this.localCar.isBoosting || this.localCar.isDrifting || this.localCar.damageCooldown > 0.5) {
      shakeX = (Math.random() - 0.5) * 0.22;
      shakeY = (Math.random() - 0.5) * 0.22;
    }

    if (this.cameraMode === 0) {
      const distance = 10.5 + speedRatio * 2.2;
      const height = (this.localCar.isAirborne ? 5.2 : 3.8) - speedRatio * 0.3;
      
      const driftLateralOffset = this.localCar.isDrifting ? (this.localCar.steeringAngle * 2.2) : 0;
      
      const offset = new THREE.Vector3(
        -Math.sin(carRot) * distance + Math.cos(carRot) * driftLateralOffset + shakeX,
        height + shakeY,
        -Math.cos(carRot) * distance - Math.sin(carRot) * driftLateralOffset
      );
      const targetPos = new THREE.Vector3().addVectors(carPos, offset);
      this.camera.position.lerp(targetPos, delta * 9);

      const lookTarget = new THREE.Vector3(carPos.x, carPos.y + 1.1, carPos.z);
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 1) {
      const hoodOffset = new THREE.Vector3(
        Math.sin(carRot) * 0.9 + shakeX,
        1.15 + shakeY,
        Math.cos(carRot) * 0.9
      );
      this.camera.position.copy(carPos).add(hoodOffset);

      const forward = new THREE.Vector3(
        Math.sin(carRot) * 25,
        0,
        Math.cos(carRot) * 25
      );
      this.camera.lookAt(new THREE.Vector3().addVectors(this.camera.position, forward));
    } else {
      const farOffset = new THREE.Vector3(
        -Math.sin(carRot) * 20,
        9.5,
        -Math.cos(carRot) * 20
      );
      this.camera.position.lerp(new THREE.Vector3().addVectors(carPos, farOffset), delta * 6);
      this.camera.lookAt(carPos);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    if (this.isPlatformPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.track) {
      this.track.update(now * 0.001);
    }

    // 1. AAA Showroom Camera & Turntable Orbit (Lobby State)
    if (this.gameState === 'LOBBY') {
      if (!this.isDragging) {
        this.showroomAngle += delta * 0.25;
      }

      const orbitDist = 7.0;
      const camX = Math.sin(this.showroomAngle) * orbitDist;
      const camZ = Math.cos(this.showroomAngle) * orbitDist;
      
      this.camera.position.set(camX, this.showroomElevation, camZ);
      this.camera.lookAt(0, 0.6, 0);

      if (this.turntableMesh) {
        this.turntableMesh.visible = true;
        this.turntableMesh.rotation.y += delta * 0.18;
      }
      if (this.showroomSpotlight) {
        this.showroomSpotlight.visible = true;
      }
    }

    // 2. In-Game State
    if (this.gameState === 'RACING' || this.gameState === 'COUNTDOWN') {
      const input = this.gameState === 'RACING' ? this.controls.getState() : { gas: false, brake: false, left: false, right: false, nitro: false, drift: false };
      
      this.localCar.update(delta, input);
      this.checkTrackCollision(delta);
      this.checkVehicleCollisions(delta);
      this.checkLapProgress();
      this.updateCamera(delta);
      this.updateWarpParticles(delta);
      this.updateFireworks(delta);
      this.updateRankings();

      // Update AI Opponents
      if (this.gameState === 'RACING') {
        this.aiBots.forEach(bot => bot.update(delta));
      }

      const timeElapsed = (now - this.raceStartTime) / 1000;
      this.ui.updateHUD(this.localCar, timeElapsed, this.network.remotePlayers.size + this.aiBots.length + 1);

      if (now - this.lastNetworkSync > 33) {
        this.lastNetworkSync = now;
        this.network.sendPlayerUpdate(
          this.localCar.position,
          this.localCar.rotation,
          this.localCar.speed,
          this.localCar.steeringAngle,
          this.localCar.isBoosting,
          this.localCar.isDrifting,
          this.localCar.currentLap,
          this.localCar.currentCheckpoint
        );
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
