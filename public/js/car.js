// High-End 3D Supercar, Multi-Model Generator, Dynamic NameTags, VFX Particle Systems & Audio Synth
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

    // Lap & Race Stats
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.finished = false;
    this.wrongWay = false;

    // 3D Mesh Hierarchy
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.wheels = [];
    this.frontWheelHubs = [];
    this.exhaustFlames = [];
    this.underglowLights = [];
    this.taillightMesh = null;
    this.headlightSpotlights = [];
    this.nameTagSprite = null;

    // Particle Systems (Tire Smoke Pool)
    this.smokePool = [];
    this.maxSmoke = 50;

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
        return { maxSpeed: 170, nitroMaxSpeed: 235, acceleration: 85, turnSpeed: 2.3, driftFactor: 0.96, name: 'V8 Thunder Muscle' };
      case 'formula1': // Apex F1
        return { maxSpeed: 190, nitroMaxSpeed: 260, acceleration: 92, turnSpeed: 3.1, driftFactor: 0.90, name: 'Apex F1 Speedster' };
      case 'cybertruck': // Titan CyberTruck 4x4
        return { maxSpeed: 165, nitroMaxSpeed: 230, acceleration: 78, turnSpeed: 2.1, driftFactor: 0.97, name: 'Titan CyberTruck 4x4' };
      case 'supercar':
      default: // Cyber Phantom Supercar
        return { maxSpeed: 178, nitroMaxSpeed: 248, acceleration: 76, turnSpeed: 2.6, driftFactor: 0.94, name: 'Cyber Phantom GT' };
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

    const carRoot = this.bodyGroup;

    // Common Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color),
      metalness: 0.9,
      roughness: 0.15
    });

    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x14171d, metalness: 0.95, roughness: 0.25 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x07111e, metalness: 0.2, roughness: 0.05, transmission: 0.85, transparent: true, opacity: 0.85 });
    const glowHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xecfeff });
    const glowTaillightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const neonUnderglowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.color) });
    const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0xff002b, metalness: 0.8, roughness: 0.3 });
    const discBrakeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });

    // Distinct Mesh Variations Based on Model
    if (this.carModel === 'formula1') {
      // ===== 1. FORMULA 1 OPEN-WHEEL RACER =====
      // Monocoque Nosecone
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.2, 8), bodyMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.45, 1.3);
      
      // Cockpit Pod & Halo
      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 2.0), carbonMat);
      cockpit.position.set(0, 0.5, -0.6);

      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 16), carbonMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.85, -0.4);

      // Front & Rear Giant F1 Wings
      const fWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.8), carbonMat);
      fWing.position.set(0, 0.22, 2.6);

      const rWing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.7), carbonMat);
      rWing.position.set(0, 1.25, -2.1);

      carRoot.add(nose, cockpit, halo, fWing, rWing);

      // F1 Headlights / Taillight
      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.5, -2.1);
      carRoot.add(this.taillightMesh);

    } else if (this.carModel === 'muscle') {
      // ===== 2. V8 MUSCLE BEAST =====
      // Aggressive Boxy Muscle Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 4.6), bodyMat);
      chassis.position.y = 0.55;
      
      // Giant Blower / Supercharger sticking out of hood
      const blower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.7), chromeMat);
      blower.position.set(0, 0.95, 1.2);
      
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 2.0), glassMat);
      cabin.position.set(0, 1.05, -0.3);

      // Dual Racing Stripes (Black/Carbon)
      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 4.6), carbonMat);
      stripeL.position.set(-0.25, 0.86, 0);
      const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 4.6), carbonMat);
      stripeR.position.set(0.25, 0.86, 0);

      // Ducktail Spoiler
      const ducktail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.25, 0.1), carbonMat);
      ducktail.position.set(0, 0.95, -2.3);
      ducktail.rotation.x = -0.3;

      carRoot.add(chassis, blower, cabin, stripeL, stripeR, ducktail);

      // Headlights & Taillights
      const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), glowHeadlightMat);
      hlL.position.set(-0.8, 0.58, 2.31);
      const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), glowHeadlightMat);
      hlR.position.set(0.8, 0.58, 2.31);

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.65, -2.31);

      carRoot.add(hlL, hlR, this.taillightMesh);

    } else if (this.carModel === 'cybertruck') {
      // ===== 3. TITAN CYBERTRUCK 4x4 =====
      // Angular Polygonal Cyber Body
      const lower = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 4.8), bodyMat);
      lower.position.y = 0.65;

      const roofApex = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.9, 4), bodyMat);
      roofApex.rotation.y = Math.PI / 4;
      roofApex.position.set(0, 1.45, -0.1);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 2.6), glassMat);
      cabin.position.set(0, 1.15, -0.1);

      // Front Full Lightbar
      const hlBar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.1), glowHeadlightMat);
      hlBar.position.set(0, 0.9, 2.41);

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.9, -2.41);

      carRoot.add(lower, roofApex, cabin, hlBar, this.taillightMesh);

    } else {
      // ===== 4. CYBER PHANTOM GT SUPERCAR (Default) =====
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.42, 4.5), bodyMat);
      chassis.position.y = 0.46;

      const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.08, 0.7), carbonMat);
      splitter.position.set(0, 0.26, 2.3);

      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.2, 1.5), bodyMat);
      hood.position.set(0, 0.62, 1.4);
      hood.rotation.x = -0.14;

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.46, 2.3), glassMat);
      cabin.position.set(0, 0.96, -0.2);

      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 0.55), carbonMat);
      wingBlade.position.set(0, 1.32, -2.15);
      wingBlade.rotation.x = 0.08;

      const wingStalkL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.15), carbonMat);
      wingStalkL.position.set(-0.7, 1.02, -2.1);
      const wingStalkR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.15), carbonMat);
      wingStalkR.position.set(0.7, 1.02, -2.1);

      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.15), glowHeadlightMat);
      hlL.position.set(-0.78, 0.58, 2.26);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.15), glowHeadlightMat);
      hlR.position.set(0.78, 0.58, 2.26);

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.12), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.68, -2.28);

      carRoot.add(chassis, splitter, hood, cabin, wingBlade, wingStalkL, wingStalkR, hlL, hlR, this.taillightMesh);
    }

    // Exhaust Pipes & Multi-layer Nitro Flames
    [-0.45, 0.45].forEach((offsetX) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12), chromeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(offsetX, 0.36, -2.3);
      carRoot.add(pipe);

      const outerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 1.2, 10),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
      );
      outerFlame.rotation.x = -Math.PI / 2;
      outerFlame.position.set(offsetX, 0.36, -2.9);

      const innerCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
      );
      innerCore.rotation.x = -Math.PI / 2;
      innerCore.position.set(offsetX, 0.36, -2.7);

      carRoot.add(outerFlame, innerCore);
      this.exhaustFlames.push({ outer: outerFlame, inner: innerCore });
    });

    // Underglow Neon
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.0), neonUnderglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.08;
    carRoot.add(underglow);
    this.underglowLights.push(underglow);

    // 4 Wheels with Rims & Disc Brakes
    const wheelPositions = [
      { x: -1.1, y: 0.38, z: 1.35, isFront: true },
      { x: 1.1, y: 0.38, z: 1.35, isFront: true },
      { x: -1.1, y: 0.42, z: -1.35, isFront: false },
      { x: 1.1, y: 0.42, z: -1.35, isFront: false }
    ];

    const tireRadius = this.carModel === 'cybertruck' ? 0.48 : this.carModel === 'formula1' ? 0.44 : 0.4;
    const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, 0.4, 20);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.85 });
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

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.14), brakeCaliperMat);
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
      if (child.isMesh && child.material && child.material.metalness === 0.9 && child.material.roughness === 0.15) {
        child.material.color.set(hex);
      }
    });
    this.underglowLights.forEach(u => u.material.color.set(hex));
    this.createNameTag();
  }

  initParticleSystems() {
    const smokeGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 });

    for (let i = 0; i < this.maxSmoke; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({ mesh: p, velocity: new THREE.Vector3(), life: 0, maxLife: 0.8, scale: 1 });
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

  updateParticles(delta) {
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
  }

  update(delta, input) {
    if (!this.isLocalPlayer) {
      this.updateParticles(delta);
      return;
    }

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
