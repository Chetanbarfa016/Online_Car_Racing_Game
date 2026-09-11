// High-End 3D Supercar, Suspension Dynamics, VFX Particle Systems & Audio Synth
class Car {
  constructor(scene, color = '#ff2a5f', isLocalPlayer = false) {
    this.scene = scene;
    this.color = color;
    this.isLocalPlayer = isLocalPlayer;

    // Physics & Dynamic State
    this.position = new THREE.Vector3(0, 0.4, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.maxSpeed = 175;       // KM/H standard
    this.maxReverseSpeed = -50;
    this.nitroMaxSpeed = 245;  // KM/H with Nitro Boost
    this.acceleration = 75;
    this.braking = 140;
    this.deceleration = 38;
    this.turnSpeed = 2.6;
    this.driftFactor = 0.94;
    this.steeringAngle = 0;
    this.currentGear = 1;
    this.rpm = 1000;

    // Suspension Animation Physics
    this.pitchAngle = 0; // Front/Back dip
    this.rollAngle = 0;  // Left/Right tilt
    this.suspensionBounce = 0;
    
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

    // 3D Mesh & Component Hierarchy
    this.mesh = new THREE.Group();
    this.bodyGroup = new THREE.Group(); // Inner group for suspension pitch/roll
    this.wheels = [];
    this.frontWheelHubs = [];
    this.discBrakes = [];
    this.exhaustPipes = [];
    this.exhaustFlames = [];
    this.exhaustSparks = [];
    this.underglowLights = [];
    this.taillightMesh = null;
    this.headlightSpotlights = [];

    // Particle Systems (Tire Smoke & Skidmarks)
    this.smokeParticles = [];
    this.smokePool = [];
    this.maxSmoke = 60;

    this.buildCarModel();
    this.initParticleSystems();
    this.scene.add(this.mesh);

    // Web Audio Synthesizer
    if (this.isLocalPlayer) {
      this.initAudio();
    }
  }

  buildCarModel() {
    const carRoot = this.bodyGroup;

    // 1. High-Quality Cyberpunk Supercar Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.color),
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 1.5
    });

    const carbonFiberMat = new THREE.MeshStandardMaterial({
      color: 0x14171d,
      metalness: 0.95,
      roughness: 0.25
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x07111e,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.85,
      transparent: true,
      opacity: 0.85
    });

    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1 });
    const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0xff002b, metalness: 0.8, roughness: 0.3 });
    const discBrakeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 });

    const glowHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xecfeff });
    const glowTaillightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const neonUnderglowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.color) });

    // 2. Main Chassis (Sculpted Aerodynamic Lower Body)
    const chassisGeo = new THREE.BoxGeometry(2.15, 0.42, 4.5);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.46;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carRoot.add(chassis);

    // Front Splitter / Air Dam (Carbon fiber)
    const splitterGeo = new THREE.BoxGeometry(2.25, 0.08, 0.7);
    const splitter = new THREE.Mesh(splitterGeo, carbonFiberMat);
    splitter.position.set(0, 0.26, 2.3);
    splitter.castShadow = true;
    carRoot.add(splitter);

    // Front Aerodynamic Hood & Scoop
    const hoodGeo = new THREE.BoxGeometry(1.95, 0.2, 1.5);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.62, 1.4);
    hood.rotation.x = -0.14;
    hood.castShadow = true;
    carRoot.add(hood);

    // Hood Air Intake Vent
    const scoopGeo = new THREE.BoxGeometry(0.7, 0.1, 0.6);
    const scoop = new THREE.Mesh(scoopGeo, carbonFiberMat);
    scoop.position.set(0, 0.72, 1.3);
    carRoot.add(scoop);

    // 3. Cockpit Cabin (Curved Fastback Roofline)
    const cabinGeo = new THREE.BoxGeometry(1.65, 0.46, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 0.96, -0.2);
    cabin.castShadow = true;
    carRoot.add(cabin);

    // Roof Center Carbon Spine
    const roofSpine = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 2.1), carbonFiberMat);
    roofSpine.position.set(0, 1.2, -0.2);
    carRoot.add(roofSpine);

    // Side Mirrors
    [-1.0, 1.0].forEach((side) => {
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.08), carbonFiberMat);
      mirrorArm.position.set(side * 0.95, 0.85, 0.6);
      const mirrorCap = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.16), bodyMat);
      mirrorCap.position.set(side * 1.08, 0.88, 0.6);
      carRoot.add(mirrorArm, mirrorCap);
    });

    // 4. Rear Diffuser & Quad Exhausts
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 0.6), carbonFiberMat);
    diffuser.position.set(0, 0.32, -2.25);
    carRoot.add(diffuser);

    // Rear GT Spoiler Wing
    const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 0.55), carbonFiberMat);
    wingBlade.position.set(0, 1.32, -2.15);
    wingBlade.rotation.x = 0.08;

    const wingEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.6), bodyMat);
    wingEndL.position.set(-1.18, 1.34, -2.15);
    const wingEndR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.6), bodyMat);
    wingEndR.position.set(1.18, 1.34, -2.15);

    const wingStalkL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.15), carbonFiberMat);
    wingStalkL.position.set(-0.7, 1.02, -2.1);
    const wingStalkR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.15), carbonFiberMat);
    wingStalkR.position.set(0.7, 1.02, -2.1);

    carRoot.add(wingBlade, wingEndL, wingEndR, wingStalkL, wingStalkR);

    // 5. Quad Exhausts & High-Intensity Nitro Plasma Thrusters
    [-0.55, -0.3, 0.3, 0.55].forEach((offsetX) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), chromeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(offsetX, 0.36, -2.3);
      carRoot.add(pipe);

      // Multi-layer Nitro Flame (Outer Plasma + Inner Core)
      const outerFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 1.1, 10),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
      );
      outerFlame.rotation.x = -Math.PI / 2;
      outerFlame.position.set(offsetX, 0.36, -2.8);

      const innerCore = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.7, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
      );
      innerCore.rotation.x = -Math.PI / 2;
      innerCore.position.set(offsetX, 0.36, -2.6);

      carRoot.add(outerFlame, innerCore);
      this.exhaustFlames.push({ outer: outerFlame, inner: innerCore });
    });

    // 6. LED Headlights & Taillights
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.15), glowHeadlightMat);
    hlL.position.set(-0.78, 0.58, 2.26);
    hlL.rotation.y = 0.15;

    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.15), glowHeadlightMat);
    hlR.position.set(0.78, 0.58, 2.26);
    hlR.rotation.y = -0.15;

    // Full-Width Cyberpunk Taillight Bar
    this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.12), glowTaillightMat);
    this.taillightMesh.position.set(0, 0.68, -2.28);

    carRoot.add(hlL, hlR, this.taillightMesh);

    // Realistic Forward Headlight Projection SpotLights (For local car)
    if (this.isLocalPlayer) {
      [-0.75, 0.75].forEach((offsetX) => {
        const spot = new THREE.SpotLight(0x00f0ff, 1.8, 45, Math.PI / 5, 0.4, 1.2);
        spot.position.set(offsetX, 0.6, 2.2);
        const target = new THREE.Object3D();
        target.position.set(offsetX * 1.5, 0, 30);
        carRoot.add(spot, target);
        spot.target = target;
        this.headlightSpotlights.push(spot);
      });
    }

    // 7. Neon Pulsing Underglow
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.0), neonUnderglowMat);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.08;
    carRoot.add(underglow);
    this.underglowLights.push(underglow);

    // 8. Realistic 3D Wheels with Disc Brakes & Brembo Calipers
    const wheelPositions = [
      { x: -1.1, y: 0.38, z: 1.35, isFront: true },   // Front-Left
      { x: 1.1, y: 0.38, z: 1.35, isFront: true },    // Front-Right
      { x: -1.1, y: 0.42, z: -1.35, isFront: false }, // Rear-Left
      { x: 1.1, y: 0.42, z: -1.35, isFront: false }   // Rear-Right
    ];

    const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.38, 20);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x151618, roughness: 0.85 });
    const rimSpokeMat = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.95, roughness: 0.15 });

    wheelPositions.forEach((wp) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(wp.x, wp.y, wp.z);

      // Rotating Wheel assembly
      const rotatingWheel = new THREE.Group();

      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      rotatingWheel.add(tire);

      // Rim Spokes & Center Nut
      const rimLip = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.39, 16), chromeMat);
      rimLip.rotation.z = Math.PI / 2;
      rotatingWheel.add(rimLip);

      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.39), rimSpokeMat);
        spoke.rotation.x = (s * Math.PI) / 2.5;
        rotatingWheel.add(spoke);
      }

      // Disc Brake (Fixed behind wheel)
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16), discBrakeMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = wp.x > 0 ? -0.1 : 0.1;

      // Brake Caliper (Red)
      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.14), brakeCaliperMat);
      caliper.position.set(wp.x > 0 ? -0.1 : 0.1, 0.14, 0.12);

      wheelHub.add(rotatingWheel, disc, caliper);
      carRoot.add(wheelHub);

      this.wheels.push(rotatingWheel);
      if (wp.isFront) {
        this.frontWheelHubs.push(wheelHub);
      }
    });

    this.mesh.add(this.bodyGroup);
  }

  // Particle System Pool for Drift Smoke
  initParticleSystems() {
    const smokeGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.4
    });

    for (let i = 0; i < this.maxSmoke; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({
        mesh: p,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.8,
        scale: 1
      });
    }
  }

  emitTireSmoke(delta) {
    if (!this.isDrifting && Math.abs(this.speed) < 130) return;

    // Emit from rear tires
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
          particle.velocity.set(
            (Math.random() - 0.5) * 2,
            Math.random() * 1.5 + 0.5,
            (Math.random() - 0.5) * 2
          );
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

  // Update Car Color dynamically
  setColor(hex) {
    this.color = hex;
    this.mesh.traverse((child) => {
      if (child.isMesh && child.material && child.material.metalness === 0.9 && child.material.roughness === 0.15) {
        child.material.color.set(hex);
      }
    });
    this.underglowLights.forEach(u => u.material.color.set(hex));
  }

  // Local Player Physics & Animation Update
  update(delta, input) {
    if (!this.isLocalPlayer) {
      this.updateParticles(delta);
      return;
    }

    // 1. Nitro System & Particle Thrusters
    if (input.nitro && this.nitroAmount > 0 && input.gas) {
      this.isBoosting = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - delta * 32);
    } else {
      this.isBoosting = false;
      this.nitroAmount = Math.min(this.nitroMax, this.nitroAmount + delta * 9); // Auto recharge
    }

    // Nitro Thruster Flame Animation (Pulse & Flicker)
    this.exhaustFlames.forEach((f, idx) => {
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

    // 2. Acceleration, Braking & Reverse
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
      // Natural Deceleration / Friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.deceleration * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.deceleration * delta);
      }
    }

    // Taillight Brake Flare Animation
    if (this.taillightMesh) {
      if (this.isBraking) {
        this.taillightMesh.material.color.setHex(0xff0000);
        this.taillightMesh.scale.set(1.05, 1.8, 1);
      } else {
        this.taillightMesh.material.color.setHex(0xaa0022);
        this.taillightMesh.scale.set(1, 1, 1);
      }
    }

    // 3. Steering & High-Speed Drift Physics
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

    // Animate Front Steering Wheels with Dynamic Camber Angle
    this.frontWheelHubs.forEach((hub) => {
      hub.rotation.y = this.steeringAngle;
      hub.rotation.z = -this.steeringAngle * 0.12; // Realistic camber tilt
    });

    // 4. Suspension Physics Animations (Pitch, Roll & Squat)
    // Pitch (Brake Dive / Accel Squat)
    const targetPitch = (input.gas ? -0.04 : 0) + (this.isBraking ? 0.07 : 0);
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, delta * 8);

    // Roll (Centrifugal Lean in turns)
    const targetRoll = -this.steeringAngle * speedRatio * 0.18;
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, delta * 10);

    // Apply suspension rotation to car body group
    this.bodyGroup.rotation.x = this.pitchAngle;
    this.bodyGroup.rotation.z = this.rollAngle;

    // 5. Position Translation & Wheel Rotation
    const forward = new THREE.Vector3(
      Math.sin(this.rotation.y),
      0,
      Math.cos(this.rotation.y)
    );

    const velocityMagnitude = (this.speed / 3.6) * delta;
    this.position.addScaledVector(forward, velocityMagnitude);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation.y;

    // Wheel Spin
    const wheelSpin = velocityMagnitude / 0.4;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += wheelSpin;
    });

    // 6. Particle & Audio Updates
    this.emitTireSmoke(delta);
    this.updateParticles(delta);
    this.updateAudio();

    // Calculate Dynamic Gear & RPM
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

  // Set transform for Remote Multiplayer Cars with smooth interpolation
  setRemoteTransform(pos, rotY, speed, steering, boosting) {
    this.mesh.position.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), 0.35);
    
    // Smooth angle interpolation
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

  // Web Audio Synth for High-Revving V10 Engine & Turbo Spool
  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();

      // Main Engine Sawtooth Oscillator
      this.engineOsc = this.audioCtx.createOscillator();
      this.engineGain = this.audioCtx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime);
      this.engineGain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);

      // Low-end Sub Rumble
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
