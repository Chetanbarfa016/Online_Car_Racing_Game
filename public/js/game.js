// Master 3D Game Engine, Dynamic Camera, Warp Speed FX, Fireworks & Race Coordinator
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

    this.clock = new THREE.Clock();
    this.cameraMode = 0; // 0: Dynamic Chase, 1: Hood Cam, 2: Orbit/Far Cam

    this.gameState = 'LOBBY';
    this.raceStartTime = 0;
    this.lastNetworkSync = 0;

    // Warp Speed Streak Particles (Need for speed effect)
    this.warpParticles = null;
    this.warpCount = 150;

    // Victory Fireworks / Confetti
    this.fireworks = [];

    this.init();
  }

  init() {
    // 1. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060812);
    this.scene.fog = new THREE.FogExp2(0x060812, 0.0032);

    // 2. Dynamic Perspective Camera
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 15, -25);

    // 3. WebGL Renderer with High-End ToneMapping & Soft Shadows
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
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.initLighting();

    // 5. Track & Warp FX
    this.track = new RacingTrack(this.scene);
    this.initWarpSpeedParticles();

    // 6. Controllers, UI & Network
    this.controls = new InputController();
    this.ui = new UIController(this);
    this.network = new NetworkClient(this);

    // 7. Window Resize Listener
    window.addEventListener('resize', () => this.onWindowResize());

    // 8. Spawn Initial Preview Local Car on Menu
    this.localCar = new Car(this.scene, this.ui.selectedColor, true);
    this.localCar.position.set(0, 0.46, 0);
    this.localCar.mesh.position.copy(this.localCar.position);

    // 9. Start Animation Loop
    this.animate();
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.55);
    this.scene.add(ambientLight);

    const mainCyanLight = new THREE.DirectionalLight(0x00e5ff, 1.3);
    mainCyanLight.position.set(120, 180, 80);
    mainCyanLight.castShadow = true;
    mainCyanLight.shadow.mapSize.width = 2048;
    mainCyanLight.shadow.mapSize.height = 2048;
    mainCyanLight.shadow.camera.near = 10;
    mainCyanLight.shadow.camera.far = 450;
    mainCyanLight.shadow.camera.left = -160;
    mainCyanLight.shadow.camera.right = 160;
    mainCyanLight.shadow.camera.top = 160;
    mainCyanLight.shadow.camera.bottom = -160;
    this.scene.add(mainCyanLight);

    const magentaFillLight = new THREE.DirectionalLight(0xff2a5f, 0.9);
    magentaFillLight.position.set(-120, 90, -120);
    this.scene.add(magentaFillLight);
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

  startCountdown(seconds, roomData) {
    this.gameState = 'COUNTDOWN';
    this.ui.showGameHUD();
    this.setupRoomCars(roomData);

    let count = seconds;
    this.ui.showCountdown(count);

    // Light up starting gantry lamps
    const lights = this.track.startTrafficLights;
    if (lights.length > 0) {
      lights.forEach(l => l.material.color.setHex(0x330000));
    }

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        this.ui.showCountdown(0);
        if (lights.length > 0) {
          lights.forEach(l => l.material.color.setHex(0x00e676)); // Turn Green!
        }
      } else {
        this.ui.showCountdown(count);
        // Sequential Red Lights
        const lightIdx = Math.min(lights.length - 1, (seconds - count));
        if (lights[lightIdx]) {
          lights[lightIdx].material.color.setHex(0xff002b);
        }
      }
    }, 1000);
  }

  setupRoomCars(roomData) {
    this.network.remotePlayers.forEach(c => this.scene.remove(c.mesh));
    this.network.remotePlayers.clear();

    const localSocketId = this.network.socket ? this.network.socket.id : null;

    roomData.players.forEach(p => {
      if (p.id === localSocketId) {
        this.localCar.setColor(p.color);
        this.localCar.position.set(p.position.x, p.position.y, p.position.z);
        this.localCar.rotation.y = p.rotation.y;
        this.localCar.speed = 0;
        this.localCar.currentLap = 1;
        this.localCar.currentCheckpoint = 0;
        this.localCar.finished = false;
        this.localCar.mesh.position.copy(this.localCar.position);
        this.localCar.mesh.rotation.set(0, p.rotation.y, 0);
      } else {
        const remoteCar = new Car(this.scene, p.color, false);
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

  checkLapProgress() {
    if (!this.localCar || this.gameState !== 'RACING' || this.localCar.finished) return;

    const carPos = this.localCar.position;
    const nextCpIdx = (this.localCar.currentCheckpoint + 1) % this.track.checkpoints.length;
    const nextCp = this.track.checkpoints[nextCpIdx];

    const dist = carPos.distanceTo(nextCp.position);

    if (dist < nextCp.radius) {
      this.localCar.currentCheckpoint = nextCpIdx;

      // Completed a full lap
      if (nextCpIdx === 0) {
        this.localCar.currentLap++;
        this.ui.showToast(`🏁 LAP ${this.localCar.currentLap - 1} COMPLETED!`);

        // Check if 3 Laps completed
        if (this.localCar.currentLap > 3) {
          this.localCar.finished = true;
          const totalTime = (performance.now() - this.raceStartTime) / 1000;
          this.network.sendRaceFinished(totalTime);
          this.spawnFireworks();
        }
      }

      this.network.sendCheckpointPassed(this.localCar.currentCheckpoint, this.localCar.currentLap);
    }
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

  // Cinematic Dynamic Camera with Spring Physics & High-Speed FOV Zoom
  updateCamera(delta) {
    if (!this.localCar) return;

    const carPos = this.localCar.position;
    const carRot = this.localCar.rotation.y;
    const speedRatio = Math.abs(this.localCar.speed) / this.localCar.maxSpeed;

    // Dynamic FOV (Speed Zoom Rush)
    const targetFOV = 62 + speedRatio * 16 + (this.localCar.isBoosting ? 6 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFOV, delta * 5);
    this.camera.updateProjectionMatrix();

    // Camera Micro-Shake on high speed / drifting
    let shakeX = 0;
    let shakeY = 0;
    if (this.localCar.isBoosting || this.localCar.isDrifting) {
      shakeX = (Math.random() - 0.5) * 0.15;
      shakeY = (Math.random() - 0.5) * 0.15;
    }

    if (this.cameraMode === 0) {
      // Third-Person Dynamic Chase Camera (Spring Damped)
      const distance = 11.5 + speedRatio * 2.0;
      const height = 4.4 - speedRatio * 0.4;
      
      const offset = new THREE.Vector3(
        -Math.sin(carRot) * distance + shakeX,
        height + shakeY,
        -Math.cos(carRot) * distance
      );
      const targetPos = new THREE.Vector3().addVectors(carPos, offset);
      this.camera.position.lerp(targetPos, delta * 8);

      const lookTarget = new THREE.Vector3(carPos.x, carPos.y + 1.2, carPos.z);
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 1) {
      // Hood / Bumper Camera
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
      // Wide Orbit Camera
      const farOffset = new THREE.Vector3(
        -Math.sin(carRot) * 22,
        10.5,
        -Math.cos(carRot) * 22
      );
      this.camera.position.lerp(new THREE.Vector3().addVectors(carPos, farOffset), delta * 5);
      this.camera.lookAt(carPos);
    }
  }

  // Master Game Render Loop
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    // Track Animation (Chevrons)
    if (this.track) {
      this.track.update(now * 0.001);
    }

    // 1. Lobby 3D Showroom Camera
    if (this.gameState === 'LOBBY') {
      const angle = now * 0.0006;
      this.camera.position.set(Math.sin(angle) * 12, 4.5, Math.cos(angle) * 12);
      this.camera.lookAt(0, 0.5, 0);
    }

    // 2. In-Game State
    if (this.gameState === 'RACING' || this.gameState === 'COUNTDOWN') {
      const input = this.gameState === 'RACING' ? this.controls.getState() : { gas: false, brake: false, left: false, right: false, nitro: false, drift: false };
      
      this.localCar.update(delta, input);
      this.checkLapProgress();
      this.updateCamera(delta);
      this.updateWarpParticles(delta);
      this.updateFireworks(delta);
      this.updateRankings();

      const timeElapsed = (now - this.raceStartTime) / 1000;
      this.ui.updateHUD(this.localCar, timeElapsed, this.network.remotePlayers.size + 1);

      // 3. Network Broadcast (30 FPS rate limit)
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
