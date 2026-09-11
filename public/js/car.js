// High-End Next-Gen 3D Supercar, Active Aero Spoilers, 4-Hit Lifeline System, Collision VFX & Sound Synth
class Car {
  constructor(scene, color = '#ff2a5f', isLocalPlayer = false, carModel = 'supercar', playerName = 'Racer') {
    this.scene = scene;
    this.color = color;
    this.isLocalPlayer = isLocalPlayer;
    this.carModel = carModel || 'supercar';
    this.playerName = playerName || 'Racer';

    // Model Performance Stats
    this.stats = this.getModelStats(this.carModel);

    // Physics & Dynamic State
    this.position = new THREE.Vector3(0, 0.46, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.maxSpeed = this.stats.maxSpeed;
    this.maxReverseSpeed = -50;
    this.nitroMaxSpeed = this.stats.nitroMaxSpeed;
    this.acceleration = this.stats.acceleration;
    this.braking = 140;
    this.deceleration = 38;
    this.turnSpeed = this.stats.turnSpeed;
    this.driftFactor = this.stats.driftFactor;
    this.steeringAngle = 0;
    this.currentGear = 1;
    this.rpm = 1000;

    // Suspension Animation Physics
    this.pitchAngle = 0;
    this.rollAngle = 0;
    
    // Nitro state
    this.nitroAmount = 100;
    this.nitroMax = 100;
    this.isBoosting = false;
    this.isDrifting = false;
    this.isBraking = false;

    // 4-Hit Crash Lifeline / Health System
    this.maxLives = 4;
    this.lives = 4;
    this.isWrecked = false;
    this.damageCooldown = 0;

    // Lap & Race Stats
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.finished = false;
    this.wrongWay = false;

    // 3D Mesh Hierarchy & Animated Parts
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.wheels = [];
    this.frontWheelHubs = [];
    this.exhaustFlames = [];
    this.underglowLights = [];
    this.taillightMesh = null;
    this.headlightSpotlights = [];
    this.nameTagSprite = null;
    this.activeSpoilerMesh = null;

    // Particle Systems (Tire Smoke, Crash Sparks, Fire/Wreck Smoke)
    this.smokePool = [];
    this.maxSmoke = 50;
    this.sparkPool = [];
    this.maxSparks = 40;
    this.wreckParticles = [];

    this.buildCarModel();
    this.createNameTag();
    this.initParticleSystems();
    this.scene.add(this.mesh);

    if (this.isLocalPlayer) {
      this.initAudio();
    }
  }

  getModelStats(model) {
    switch (model) {
      case 'muscle': // Heavy Muscle V8
        return { maxSpeed: 172, nitroMaxSpeed: 238, acceleration: 86, turnSpeed: 2.35, driftFactor: 0.96, name: 'V8 Thunder Muscle' };
      case 'formula1': // Apex F1
        return { maxSpeed: 192, nitroMaxSpeed: 262, acceleration: 94, turnSpeed: 3.15, driftFactor: 0.90, name: 'Apex F1 Speedster' };
      case 'cybertruck': // Titan CyberTruck 4x4
        return { maxSpeed: 168, nitroMaxSpeed: 232, acceleration: 80, turnSpeed: 2.15, driftFactor: 0.97, name: 'Titan CyberTruck 4x4' };
      case 'supercar':
      default: // Cyber Phantom Supercar
        return { maxSpeed: 180, nitroMaxSpeed: 250, acceleration: 78, turnSpeed: 2.65, driftFactor: 0.94, name: 'Cyber Phantom GT' };
    }
  }

  buildCarModel() {
    // Clear any previous parts
    while (this.bodyGroup.children.length > 0) {
      this.bodyGroup.remove(this.bodyGroup.children[0]);
    }
    this.wheels = [];
    this.frontWheelHubs = [];
    this.exhaustFlames = [];
    this.underglowLights = [];
    this.activeSpoilerMesh = null;

    const carRoot = this.bodyGroup;

    // High-End Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color),
      metalness: 0.92,
      roughness: 0.12,
      envMapIntensity: 1.5
    });

    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x111317, metalness: 0.95, roughness: 0.2 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.98, roughness: 0.08 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x07111e,
      metalness: 0.3,
      roughness: 0.05,
      transmission: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const glowHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xecfeff });
    const glowTaillightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const neonUnderglowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.color) });
    const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, metalness: 0.8, roughness: 0.2 });
    const discBrakeMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.95, roughness: 0.15 });

    if (this.carModel === 'formula1') {
      // ===== 1. FORMULA 1 HYPER-AERODYNAMIC =====
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.4, 12), bodyMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.42, 1.35);

      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.48, 2.1), carbonMat);
      cockpit.position.set(0, 0.48, -0.6);

      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.045, 10, 20), carbonMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.88, -0.4);

      // Multi-element Front Wing
      const fWing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 0.9), carbonMat);
      fWing.position.set(0, 0.2, 2.7);
      const fWingPlateL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.9), carbonMat);
      fWingPlateL.position.set(-1.25, 0.3, 2.7);
      const fWingPlateR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.9), carbonMat);
      fWingPlateR.position.set(1.25, 0.3, 2.7);

      // Rear DRS Wing
      const rWingGroup = new THREE.Group();
      rWingGroup.position.set(0, 1.25, -2.15);
      const rWing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.75), carbonMat);
      rWingGroup.add(rWing);
      this.activeSpoilerMesh = rWingGroup;

      carRoot.add(nose, cockpit, halo, fWing, fWingPlateL, fWingPlateR, rWingGroup);

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.5, -2.15);
      carRoot.add(this.taillightMesh);

    } else if (this.carModel === 'muscle') {
      // ===== 2. V8 THUNDER MUSCLE =====
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.62, 4.65), bodyMat);
      chassis.position.y = 0.56;

      const blower = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.75), chromeMat);
      blower.position.set(0, 0.98, 1.25);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.52, 2.1), glassMat);
      cabin.position.set(0, 1.08, -0.3);

      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 4.65), carbonMat);
      stripeL.position.set(-0.28, 0.88, 0);
      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 4.65), carbonMat);
      stripeR.position.set(0.28, 0.88, 0);

      const ducktail = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.28, 0.12), carbonMat);
      ducktail.position.set(0, 0.98, -2.35);
      ducktail.rotation.x = -0.32;
      this.activeSpoilerMesh = ducktail;

      carRoot.add(chassis, blower, cabin, stripeL, stripeR, ducktail);

      // Projector Dual Headlights
      [-0.82, 0.82].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), glowHeadlightMat);
        hl.position.set(hx, 0.6, 2.34);
        carRoot.add(hl);
      });

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.66, -2.34);
      carRoot.add(this.taillightMesh);

    } else if (this.carModel === 'cybertruck') {
      // ===== 3. TITAN CYBERTRUCK 4x4 =====
      const lower = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.72, 4.85), bodyMat);
      lower.position.y = 0.68;

      const roofApex = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.95, 4), bodyMat);
      roofApex.rotation.y = Math.PI / 4;
      roofApex.position.set(0, 1.48, -0.1);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.58, 2.7), glassMat);
      cabin.position.set(0, 1.18, -0.1);

      const hlBar = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.09, 0.1), glowHeadlightMat);
      hlBar.position.set(0, 0.92, 2.44);

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.09, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.92, -2.44);

      carRoot.add(lower, roofApex, cabin, hlBar, this.taillightMesh);

    } else {
      // ===== 4. CYBER PHANTOM GT SUPERCAR (Ultra Modern) =====
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.44, 4.55), bodyMat);
      chassis.position.y = 0.48;

      const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.75), carbonMat);
      splitter.position.set(0, 0.26, 2.32);

      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.22, 1.55), bodyMat);
      hood.position.set(0, 0.64, 1.42);
      hood.rotation.x = -0.15;

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.48, 2.35), glassMat);
      cabin.position.set(0, 0.98, -0.2);

      // Side Air Intakes
      [-1.02, 1.02].forEach(ix => {
        const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 1.2), carbonMat);
        scoop.position.set(ix, 0.52, -0.4);
        carRoot.add(scoop);
      });

      // Active Dynamic Aero Wing
      const spoilerGroup = new THREE.Group();
      spoilerGroup.position.set(0, 1.08, -2.18);
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.6), carbonMat);
      wingBlade.position.y = 0.28;
      const wingStalkL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.15), carbonMat);
      wingStalkL.position.set(-0.7, 0, 0);
      const wingStalkR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.15), carbonMat);
      wingStalkR.position.set(0.7, 0, 0);
      spoilerGroup.add(wingBlade, wingStalkL, wingStalkR);
      carRoot.add(spoilerGroup);
      this.activeSpoilerMesh = spoilerGroup;

      // LED Matrix Headlights
      [-0.8, 0.8].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.15), glowHeadlightMat);
        hl.position.set(hx, 0.6, 2.29);
        carRoot.add(hl);
      });

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.09, 0.12), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.7, -2.3);

      carRoot.add(chassis, splitter, hood, cabin, this.taillightMesh);
    }

    // Exhaust Pipes & Multi-layer Nitro Flames
    [-0.45, 0.45].forEach((offsetX) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12), chromeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(offsetX, 0.36, -2.32);
      carRoot.add(pipe);

      const outerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.26, 1.3, 10),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
      );
      outerFlame.rotation.x = -Math.PI / 2;
      outerFlame.position.set(offsetX, 0.36, -2.95);

      const innerCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.85, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
      );
      innerCore.rotation.x = -Math.PI / 2;
      innerCore.position.set(offsetX, 0.36, -2.75);

      carRoot.add(outerFlame, innerCore);
      this.exhaustFlames.push({ outer: outerFlame, inner: innerCore });
    });

    // Underglow Neon
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.0), neonUnderglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.08;
    carRoot.add(underglow);
    this.underglowLights.push(underglow);

    // 4 Wheels with Alloy Rims, Calipers & Discs
    const wheelPositions = [
      { x: -1.12, y: 0.38, z: 1.35, isFront: true },
      { x: 1.12, y: 0.38, z: 1.35, isFront: true },
      { x: -1.12, y: 0.42, z: -1.35, isFront: false },
      { x: 1.12, y: 0.42, z: -1.35, isFront: false }
    ];

    const tireRadius = this.carModel === 'cybertruck' ? 0.48 : this.carModel === 'formula1' ? 0.44 : 0.4;
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, 0.4, 22);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.85 });
    const rimSpokeMat = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.95, roughness: 0.15 });

    wheelPositions.forEach((wp) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(wp.x, wp.y, wp.z);

      const rotatingWheel = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      rotatingWheel.add(tire);

      const rimLip = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.75, tireRadius * 0.75, 0.41, 16), chromeMat);
      rimLip.rotation.z = Math.PI / 2;
      rotatingWheel.add(rimLip);

      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, tireRadius * 0.7, 0.41), rimSpokeMat);
        spoke.rotation.x = (s * Math.PI) / 2.5;
        rotatingWheel.add(spoke);
      }

      const disc = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, 0.05, 16), discBrakeMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = wp.x > 0 ? -0.1 : 0.1;

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.14), brakeCaliperMat);
      caliper.position.set(wp.x > 0 ? -0.1 : 0.1, 0.14, 0.12);

      wheelHub.add(rotatingWheel, disc, caliper);
      carRoot.add(wheelHub);

      this.wheels.push(rotatingWheel);
      if (wp.isFront) {
        this.frontWheelHubs.push(wheelHub);
      }
    });

    if (this.mesh.children.indexOf(this.bodyGroup) === -1) {
      this.mesh.add(this.bodyGroup);
    }
  }

  // 3D Floating NameTag Sprite above the car
  createNameTag() {
    if (this.nameTagSprite) {
      this.mesh.remove(this.nameTagSprite);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Rounded background pill
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.strokeStyle = this.color || '#00e5ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 48, 20);
    ctx.fill();
    ctx.stroke();

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.playerName, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.nameTagSprite = new THREE.Sprite(spriteMat);
    this.nameTagSprite.scale.set(3.5, 0.9, 1);
    this.nameTagSprite.position.set(0, 2.2, 0);

    this.mesh.add(this.nameTagSprite);
  }

  setPlayerName(name) {
    this.playerName = name;
    this.createNameTag();
  }

  setModel(model) {
    this.carModel = model;
    this.stats = this.getModelStats(model);
    this.maxSpeed = this.stats.maxSpeed;
    this.nitroMaxSpeed = this.stats.nitroMaxSpeed;
    this.acceleration = this.stats.acceleration;
    this.turnSpeed = this.stats.turnSpeed;
    this.driftFactor = this.stats.driftFactor;
    this.buildCarModel();
  }

  setColor(hex) {
    this.color = hex;
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material && child.material.metalness >= 0.9 && child.material.roughness <= 0.2) {
        child.material.color.set(hex);
      }
    });
    this.underglowLights.forEach(u => u.material.color.set(hex));
    this.createNameTag();
  }

  initParticleSystems() {
    // Tire Smoke Pool
    const smokeGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 });
    for (let i = 0; i < this.maxSmoke; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({ mesh: p, velocity: new THREE.Vector3(), life: 0, maxLife: 0.8, scale: 1 });
    }

    // Collision Spark Pool
    const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    for (let i = 0; i < this.maxSparks; i++) {
      const spk = new THREE.Mesh(sparkGeo, sparkMat.clone());
      spk.visible = false;
      this.scene.add(spk);
      this.sparkPool.push({ mesh: spk, velocity: new THREE.Vector3(), life: 0, maxLife: 0.45 });
    }
  }

  emitTireSmoke(delta) {
    if (!this.isDrifting && Math.abs(this.speed) < 130) return;
    [-1.1, 1.1].forEach(sideX => {
      if (Math.random() > 0.4) {
        const particle = this.smokePool.find(p => !p.mesh.visible);
        if (particle) {
          const spawnOffset = new THREE.Vector3(sideX, 0.15, -1.4).applyEuler(this.rotation);
          particle.mesh.position.copy(this.position).add(spawnOffset);
          particle.mesh.visible = true;
          particle.life = 0;
          particle.scale = 0.5;
          particle.mesh.scale.set(0.5, 0.5, 0.5);
          particle.mesh.material.opacity = 0.45;
          particle.velocity.set((Math.random() - 0.5) * 2, Math.random() * 1.5 + 0.5, (Math.random() - 0.5) * 2);
        }
      }
    });
  }

  emitCrashSparks(hitPos) {
    for (let i = 0; i < 15; i++) {
      const spk = this.sparkPool.find(p => !p.mesh.visible);
      if (spk) {
        spk.mesh.position.copy(hitPos || this.position);
        spk.mesh.visible = true;
        spk.life = 0;
        spk.velocity.set(
          (Math.random() - 0.5) * 14,
          Math.random() * 8 + 3,
          (Math.random() - 0.5) * 14
        );
      }
    }
  }

  takeDamage(amount = 1, impactPosition = null) {
    if (this.isWrecked) return;
    if (amount < 4 && this.damageCooldown > 0) return;
    this.damageCooldown = 1.0; // 1s invulnerability for minor hits

    this.lives = Math.max(0, this.lives - amount);
    this.emitCrashSparks(impactPosition || this.position);

    // Play Crash Impact Sound
    this.playCrashSound();

    if (this.lives <= 0) {
      this.isWrecked = true;
      this.speed = 0;
      this.velocity.set(0, 0, 0);
      this.createWreckFire();
    }
  }

  repair() {
    this.lives = this.maxLives;
    this.isWrecked = false;
    this.damageCooldown = 0;
    this.clearWreckFire();
  }

  createWreckFire() {
    this.clearWreckFire();
    // Create Fire and Smoke Emitter on engine
    const colors = [0xff2200, 0xff7700, 0x111111, 0x333333];
    for (let i = 0; i < 24; i++) {
      const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.25, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.8
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(this.position).add(new THREE.Vector3(0, 0.6, 0.5));
      this.scene.add(m);
      this.wreckParticles.push({
        mesh: m,
        basePos: new THREE.Vector3(0, 0.6, 0.5),
        offsetY: Math.random() * 2,
        speed: 1.5 + Math.random() * 2
      });
    }
  }

  clearWreckFire() {
    this.wreckParticles.forEach(wp => this.scene.remove(wp.mesh));
    this.wreckParticles = [];
  }

  updateParticles(delta) {
    // Smoke
    this.smokePool.forEach(p => {
      if (p.mesh.visible) {
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.velocity, delta);
          p.scale += delta * 2.5;
          p.mesh.scale.set(p.scale, p.scale, p.scale);
          p.mesh.material.opacity = (1 - (p.life / p.maxLife)) * 0.4;
        }
      }
    });

    // Sparks
    this.sparkPool.forEach(s => {
      if (s.mesh.visible) {
        s.life += delta;
        if (s.life >= s.maxLife) {
          s.mesh.visible = false;
        } else {
          s.velocity.y -= 25 * delta; // Gravity
          s.mesh.position.addScaledVector(s.velocity, delta);
        }
      }
    });

    // Wreck Fire/Smoke
    if (this.isWrecked && this.wreckParticles.length > 0) {
      this.wreckParticles.forEach(wp => {
        wp.offsetY += wp.speed * delta;
        if (wp.offsetY > 3.0) wp.offsetY = 0;
        wp.mesh.position.copy(this.position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          0.6 + wp.offsetY,
          0.5 + (Math.random() - 0.5) * 0.4
        ));
        wp.mesh.material.opacity = Math.max(0, 1 - (wp.offsetY / 3.0));
      });
    }
  }

  update(delta, input) {
    if (this.damageCooldown > 0) {
      this.damageCooldown -= delta;
    }

    if (this.isWrecked) {
      this.speed = 0;
      this.updateParticles(delta);
      return;
    }

    if (!this.isLocalPlayer) {
      this.updateParticles(delta);
      return;
    }

    // Nitro
    if (input.nitro && this.nitroAmount > 0 && input.gas) {
      this.isBoosting = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - delta * 32);
    } else {
      this.isBoosting = false;
      this.nitroAmount = Math.min(this.nitroMax, this.nitroAmount + delta * 9);
    }

    this.exhaustFlames.forEach((f) => {
      if (this.isBoosting) {
        const flicker = 0.8 + Math.random() * 0.4;
        f.outer.material.opacity = 0.85;
        f.inner.material.opacity = 1.0;
        f.outer.scale.set(1, 1.2 * flicker, 1);
        f.inner.scale.set(1, 1.4 * flicker, 1);
      } else {
        f.outer.material.opacity = 0.0;
        f.inner.material.opacity = 0.0;
      }
    });

    const targetMaxSpeed = this.isBoosting ? this.nitroMaxSpeed : this.maxSpeed;

    this.isBraking = input.brake && this.speed > 5;
    if (input.gas) {
      const accelRate = this.isBoosting ? this.acceleration * 1.7 : this.acceleration;
      if (this.speed < targetMaxSpeed) {
        this.speed += accelRate * delta;
      }
    } else if (input.brake) {
      if (this.speed > 0) {
        this.speed -= this.braking * delta;
      } else if (this.speed > this.maxReverseSpeed) {
        this.speed -= (this.acceleration * 0.7) * delta;
      }
    } else {
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration * delta);
      }
    }

    if (this.taillightMesh) {
      if (this.isBraking) {
        this.taillightMesh.material.color.setHex(0xff0000);
        this.taillightMesh.scale.set(1.05, 1.8, 1);
      } else {
        this.taillightMesh.material.color.setHex(0xaa0022);
        this.taillightMesh.scale.set(1, 1, 1);
      }
    }

    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    this.isDrifting = input.drift && speedRatio > 0.4;

    if (Math.abs(this.speed) > 1) {
      const dir = this.speed >= 0 ? 1 : -1;
      const turnMultiplier = (this.isDrifting ? 1.6 : 1.0) * (1 - speedRatio * 0.3);

      if (input.left) {
        this.rotation.y += this.turnSpeed * turnMultiplier * delta * dir;
        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, 0.48, delta * 12);
      } else if (input.right) {
        this.rotation.y -= this.turnSpeed * turnMultiplier * delta * dir;
        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, -0.48, delta * 12);
      } else {
        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, 0, delta * 12);
      }
    } else {
      this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, 0, delta * 12);
    }

    this.frontWheelHubs.forEach((hub) => {
      hub.rotation.y = this.steeringAngle;
      hub.rotation.z = -this.steeringAngle * 0.12;
    });

    // Active Aero Spoiler Dynamics
    if (this.activeSpoilerMesh) {
      const targetSpoilerTilt = this.isBraking ? -0.4 : (speedRatio > 0.7 ? 0.25 : 0.0);
      this.activeSpoilerMesh.rotation.x = THREE.MathUtils.lerp(this.activeSpoilerMesh.rotation.x, targetSpoilerTilt, delta * 8);
    }

    const targetPitch = (input.gas ? -0.04 : 0) + (this.isBraking ? 0.07 : 0);
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, delta * 8);

    const targetRoll = -this.steeringAngle * speedRatio * 0.18;
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, delta * 10);

    this.bodyGroup.rotation.x = this.pitchAngle;
    this.bodyGroup.rotation.z = this.rollAngle;

    const forward = new THREE.Vector3(Math.sin(this.rotation.y), 0, Math.cos(this.rotation.y));
    const velocityMagnitude = (this.speed / 3.6) * delta;
    this.position.addScaledVector(forward, velocityMagnitude);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation.y;

    const wheelSpin = velocityMagnitude / 0.4;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += wheelSpin;
    });

    this.emitTireSmoke(delta);
    this.updateParticles(delta);
    this.updateAudio();
    this.updateGearRPM();
  }

  updateGearRPM() {
    const spd = Math.abs(this.speed);
    if (spd < 35) this.currentGear = 1;
    else if (spd < 70) this.currentGear = 2;
    else if (spd < 110) this.currentGear = 3;
    else if (spd < 150) this.currentGear = 4;
    else if (spd < 190) this.currentGear = 5;
    else this.currentGear = 6;

    const gearBases = [0, 0, 35, 70, 110, 150, 190];
    const gearSpan = [35, 35, 35, 40, 40, 40, 60];
    const curBase = gearBases[this.currentGear];
    const curSpan = gearSpan[this.currentGear];
    const frac = Math.min(1.0, Math.max(0.0, (spd - curBase) / curSpan));
    this.rpm = Math.round(2000 + frac * 6500);
  }

  setRemoteTransform(pos, rotY, speed, steering, boosting) {
    this.mesh.position.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), 0.35);
    const diff = ((rotY - this.mesh.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.mesh.rotation.y += diff * 0.35;
    
    this.speed = speed;
    this.isBoosting = boosting;

    this.frontWheelHubs.forEach(w => {
      w.rotation.y = steering || 0;
    });

    this.exhaustFlames.forEach(f => {
      f.outer.material.opacity = boosting ? 0.85 : 0.0;
      f.inner.material.opacity = boosting ? 1.0 : 0.0;
    });
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      this.engineOsc = this.audioCtx.createOscillator();
      this.engineGain = this.audioCtx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime);
      this.engineGain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);

      this.subOsc = this.audioCtx.createOscillator();
      this.subGain = this.audioCtx.createGain();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.setValueAtTime(40, this.audioCtx.currentTime);
      this.subGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

      this.engineOsc.connect(this.engineGain);
      this.subOsc.connect(this.subGain);
      this.engineGain.connect(this.audioCtx.destination);
      this.subGain.connect(this.audioCtx.destination);

      this.engineOsc.start();
      this.subOsc.start();
    } catch (e) {
      console.warn('AudioContext requires user interaction');
    }
  }

  playCrashSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {}
  }

  updateAudio() {
    if (!this.audioCtx || !this.engineOsc) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const freq = 45 + (this.rpm / 8500) * 220 + (this.isBoosting ? 70 : 0);
    this.engineOsc.frequency.setTargetAtTime(freq, this.audioCtx.currentTime, 0.04);
    this.subOsc.frequency.setTargetAtTime(freq * 0.5, this.audioCtx.currentTime, 0.04);
  }

  resetToTrack(checkpointPos, tangent) {
    this.position.copy(checkpointPos);
    this.position.y = 0.46;
    this.speed = 0;
    this.rotation.y = Math.atan2(tangent.x, tangent.z);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, this.rotation.y, 0);
  }
}
