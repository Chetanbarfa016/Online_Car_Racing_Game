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
    
    // Asphalt Nitro Stunt Dynamics (Airborne Jumps, Barrel Rolls, 360 Flat Spins)
    this.isAirborne = false;
    this.jumpVelocityY = 0;
    this.stuntType = null;
    this.stuntAngle = 0;
    this.stuntSpinSpeed = 0;
    this.lastStuntAwarded = false;

    // Nitro state & Tuning Options
    this.nitroAmount = 100;
    this.nitroMax = 100;
    this.nitroTuneStage = 1;
    this.nitroRechargeRate = 18;
    this.isBoosting = false;
    this.isDrifting = false;
    this.isBraking = false;
    this.driftYawAngle = 0;
    this.velocityHeading = 0;

    // 5-Hit Crash Lifeline / Health System
    this.maxLives = 5;
    this.lives = 5;
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
    this.brakeDiscs = [];
    this.frontWheelHubs = [];
    this.exhaustFlames = [];
    this.underglowLights = [];
    this.taillightMesh = null;
    this.headlightSpotlights = [];
    this.nameTagSprite = null;
    this.activeSpoilerMesh = null;
    this.exhaustLight = null;

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
      case 'hypercar': // Solaris Hyper GT (Yellow Concept)
        return { maxSpeed: 195, nitroMaxSpeed: 268, acceleration: 92, turnSpeed: 2.85, driftFactor: 0.92, name: 'Solaris Hyper GT' };
      case 'formula1': // Apex F1 Aero (Formula E)
        return { maxSpeed: 205, nitroMaxSpeed: 275, acceleration: 98, turnSpeed: 3.25, driftFactor: 0.88, name: 'Apex F1 Aero' };
      case 'speedster': // Quantum F1 Speedster
        return { maxSpeed: 200, nitroMaxSpeed: 270, acceleration: 95, turnSpeed: 3.10, driftFactor: 0.89, name: 'Quantum Speedster' };
      case 'muscle': // Thunder GT Touring (Lexus GT)
        return { maxSpeed: 185, nitroMaxSpeed: 248, acceleration: 88, turnSpeed: 2.45, driftFactor: 0.96, name: 'Thunder GT Touring' };
      case 'supercar': // Phantom GT3 Supercar (Orange GT3)
      default:
        return { maxSpeed: 190, nitroMaxSpeed: 255, acceleration: 85, turnSpeed: 2.70, driftFactor: 0.93, name: 'Phantom GT3 Supercar' };
    }
  }

  buildCarModel() {
    // Clear any previous parts
    while (this.bodyGroup.children.length > 0) {
      this.bodyGroup.remove(this.bodyGroup.children[0]);
    }
    this.wheels = [];
    this.brakeDiscs = [];
    this.frontWheelHubs = [];
    this.exhaustFlames = [];
    this.underglowLights = [];
    this.activeSpoilerMesh = null;

    const carRoot = this.bodyGroup;

    // High-Gloss Automotive Candy Paint with Clear-Coat
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.color),
      metalness: 0.82,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 1.0
    });
    bodyMat.userData = { isBodyMat: true };

    const bodyMatDark = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.color).multiplyScalar(0.75),
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });
    bodyMatDark.userData = { isBodyMatDark: true };

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      metalness: 0.9,
      roughness: 0.3
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fb,
      metalness: 0.98,
      roughness: 0.06
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x050c18,
      metalness: 0.9,
      roughness: 0.04,
      transmission: 0.88,
      transparent: true,
      opacity: 0.9,
      reflectivity: 1.0
    });

    const glowHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff });
    const glowTaillightMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const neonUnderglowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.color) });
    neonUnderglowMat.userData = { isNeonMat: true };

    const brakeCaliperMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, metalness: 0.8, roughness: 0.2 });
    const discBrakeMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.95, roughness: 0.15 });

    if (this.carModel === 'formula1') {
      // ===== 1. APEX F1 AERO (Formula E Aero Racer - Matching car_formula_aero.jpg) =====
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 3.4, 16), bodyMat);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 0.42, 1.35);

      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.5, 2.2), carbonMat);
      cockpit.position.set(0, 0.5, -0.55);

      // FIA Halo Ring
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 12, 28), carbonMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 0.95, -0.4);

      // Driver Helmet inside Cockpit
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), new THREE.MeshStandardMaterial({ color: 0xffea00, metalness: 0.8 }));
      helmet.position.set(0, 0.75, -0.5);

      // Multi-tier Delta Front Wing
      const fWing = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.08, 1.05), carbonMat);
      fWing.position.set(0, 0.22, 2.7);
      const fWingPlateL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 1.05), bodyMat);
      fWingPlateL.position.set(-1.32, 0.36, 2.7);
      const fWingPlateR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 1.05), bodyMat);
      fWingPlateR.position.set(1.32, 0.36, 2.7);

      // Aero Side Pods
      [-0.95, 0.95].forEach(sx => {
        const sidePod = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 2.3), bodyMat);
        sidePod.position.set(sx, 0.45, -0.5);
        carRoot.add(sidePod);
      });

      // Shark Fin & Rear Wing
      const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 1.5), carbonMat);
      sharkFin.position.set(0, 1.02, -1.4);

      const rWingGroup = new THREE.Group();
      rWingGroup.position.set(0, 1.28, -2.15);
      const rWing = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.08, 0.8), carbonMat);
      rWingGroup.add(rWing);
      this.activeSpoilerMesh = rWingGroup;

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.48, -2.15);

      carRoot.add(nose, cockpit, halo, helmet, fWing, fWingPlateL, fWingPlateR, sharkFin, rWingGroup, this.taillightMesh);

    } else if (this.carModel === 'hypercar') {
      // ===== 2. SOLARIS HYPER GT (Yellow Pininfarina Battista Concept - Matching car_yellow_hyper.jpg) =====
      // Main sculpted low-slung chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.46, 4.8), bodyMat);
      chassis.position.y = 0.48;

      // Sculpted Front Hood Slope
      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 1.6), bodyMat);
      hood.position.set(0, 0.62, 1.4);
      hood.rotation.x = -0.12;

      // Front Sharp Nose Cone
      const frontNose = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.2, 16), bodyMat);
      frontNose.rotation.x = Math.PI / 2;
      frontNose.position.set(0, 0.44, 2.35);

      // Low Carbon Splitter
      const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 0.8), carbonMat);
      frontSplitter.position.set(0, 0.22, 2.45);

      // Sleek Aerodynamic Bubble Canopy & Roof
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.12, 20, 16), glassMat);
      canopy.scale.set(0.86, 0.54, 1.9);
      canopy.position.set(0, 0.86, -0.15);

      const roofSpine = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 2.4), bodyMat);
      roofSpine.position.set(0, 1.08, -0.25);

      // Sculpted Rear Engine Deck & Diffuser
      const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.38, 1.5), bodyMat);
      rearDeck.position.set(0, 0.65, -1.45);

      // Side Air Intakes & Aerodynamic Side Skirts
      [-1.12, 1.12].forEach(sx => {
        const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 3.2), carbonMat);
        skirt.position.set(sx, 0.42, -0.2);
        const intake = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.9), carbonMat);
        intake.position.set(sx * 0.95, 0.65, -0.85);
        carRoot.add(skirt, intake);
      });

      // Active Rear DRS / Airbrake Spoiler Wing
      const activeAeroWing = new THREE.Group();
      activeAeroWing.position.set(0, 1.02, -2.25);
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.08, 0.72), carbonMat);
      const wingStalkL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.15), carbonMat);
      wingStalkL.position.set(-0.75, -0.18, 0);
      const wingStalkR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.15), carbonMat);
      wingStalkR.position.set(0.75, -0.18, 0);
      activeAeroWing.add(wingBlade, wingStalkL, wingStalkR);
      carRoot.add(activeAeroWing);
      this.activeSpoilerMesh = activeAeroWing;

      // Ultra-thin Full Width Horizontal LED Lightbar
      [-0.8, 0.8].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.15), glowHeadlightMat);
        hl.position.set(hx, 0.54, 2.42);
        carRoot.add(hl);
      });

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.12), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.66, -2.42);

      carRoot.add(chassis, hood, frontNose, frontSplitter, canopy, roofSpine, rearDeck, this.taillightMesh);

    } else if (this.carModel === 'speedster') {
      // ===== 3. QUANTUM F1 SPEEDSTER (Open-Cockpit Futuristic Racer - Matching car_f1_speedster.jpg) =====
      const bodyCone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 4.8, 16), bodyMat);
      bodyCone.rotation.x = Math.PI / 2;
      bodyCone.position.set(0, 0.5, 0.2);

      const cockpitHole = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 1.5), carbonMat);
      cockpitHole.position.set(0, 0.68, -0.2);

      // Twin Aerodynamic Speedster Roll Humps
      const aeroHumpL = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 12), bodyMat);
      aeroHumpL.rotation.x = -Math.PI / 2;
      aeroHumpL.position.set(-0.38, 0.86, -0.95);
      const aeroHumpR = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.25, 12), bodyMat);
      aeroHumpR.rotation.x = -Math.PI / 2;
      aeroHumpR.position.set(0.38, 0.86, -0.95);

      // Pushrods
      [-0.85, 0.85].forEach(sx => {
        const pushrod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), chromeMat);
        pushrod.rotation.z = sx > 0 ? -Math.PI / 4 : Math.PI / 4;
        pushrod.position.set(sx * 0.6, 0.48, 1.35);
        carRoot.add(pushrod);
      });

      const frontSplitter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.9), carbonMat);
      frontSplitter.position.set(0, 0.24, 2.55);

      const highDownforceWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.72), carbonMat);
      highDownforceWing.position.set(0, 1.24, -2.25);
      this.activeSpoilerMesh = highDownforceWing;

      [-0.65, 0.65].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), glowHeadlightMat);
        hl.position.set(hx, 0.52, 2.3);
        carRoot.add(hl);
      });

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.62, -2.28);

      carRoot.add(bodyCone, cockpitHole, aeroHumpL, aeroHumpR, frontSplitter, highDownforceWing, this.taillightMesh);

    } else if (this.carModel === 'muscle') {
      // ===== 4. THUNDER GT TOURING (Lexus F-Sport Touring GT - Matching car_blue_touring.jpg) =====
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.65, 4.75), bodyMat);
      chassis.position.y = 0.58;

      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.55, 0.25), carbonMat);
      grille.position.set(0, 0.54, 2.38);

      const wideFenderL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 4.55), bodyMat);
      wideFenderL.position.set(-1.18, 0.56, 0);
      const wideFenderR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 4.55), bodyMat);
      wideFenderR.position.set(1.18, 0.56, 0);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.58, 2.3), glassMat);
      cabin.position.set(0, 1.15, -0.3);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 2.1), bodyMat);
      roof.position.set(0, 1.45, -0.3);

      const gt3WingGroup = new THREE.Group();
      gt3WingGroup.position.set(0, 1.32, -2.3);
      const gt3Wing = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.65), carbonMat);
      gt3WingGroup.add(gt3Wing);
      this.activeSpoilerMesh = gt3WingGroup;

      [-0.85, 0.85].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), glowHeadlightMat);
        hl.position.set(hx, 0.64, 2.38);
        carRoot.add(hl);
      });

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 0.1), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.7, -2.38);

      carRoot.add(chassis, grille, wideFenderL, wideFenderR, cabin, roof, gt3WingGroup, this.taillightMesh);

    } else {
      // ===== 5. PHANTOM GT3 SUPERCAR (Orange GT3 Lamborghini - Matching car_orange_gt.jpg) =====
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.48, 4.7), bodyMat);
      chassis.position.y = 0.5;

      const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.08, 0.82), carbonMat);
      splitter.position.set(0, 0.26, 2.38);

      [-1.2, 1.2].forEach(cx => {
        const canard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.38), carbonMat);
        canard.position.set(cx, 0.4, 2.32);
        carRoot.add(canard);
      });

      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.24, 1.6), bodyMat);
      hood.position.set(0, 0.66, 1.45);
      hood.rotation.x = -0.16;

      const roofScoop = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.8), carbonMat);
      roofScoop.position.set(0, 1.3, -0.4);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.5, 2.42), glassMat);
      cabin.position.set(0, 1.02, -0.2);

      const spoilerGroup = new THREE.Group();
      spoilerGroup.position.set(0, 1.22, -2.25);
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.65), carbonMat);
      wingBlade.position.y = 0.3;
      const wingStalkL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.16), carbonMat);
      wingStalkL.position.set(-0.72, 0, 0);
      const wingStalkR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.16), carbonMat);
      wingStalkR.position.set(0.72, 0, 0);
      spoilerGroup.add(wingBlade, wingStalkL, wingStalkR);
      carRoot.add(spoilerGroup);
      this.activeSpoilerMesh = spoilerGroup;

      [-0.82, 0.82].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.15), glowHeadlightMat);
        hl.position.set(hx, 0.62, 2.35);
        carRoot.add(hl);
      });

      this.taillightMesh = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.1, 0.12), glowTaillightMat);
      this.taillightMesh.position.set(0, 0.72, -2.36);

      carRoot.add(chassis, splitter, hood, roofScoop, cabin, this.taillightMesh);
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

      const disc = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius * 0.65, tireRadius * 0.65, 0.05, 16), discBrakeMat.clone());
      disc.rotation.z = Math.PI / 2;
      disc.position.x = wp.x > 0 ? -0.1 : 0.1;
      this.brakeDiscs.push(disc);

      const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.14), brakeCaliperMat);
      caliper.position.set(wp.x > 0 ? -0.1 : 0.1, 0.14, 0.12);

      wheelHub.add(rotatingWheel, disc, caliper);
      carRoot.add(wheelHub);

      this.wheels.push(rotatingWheel);
      if (wp.isFront) {
        this.frontWheelHubs.push(wheelHub);
      }
    });

    // 3D Volumetric Headlight Projection Beams on Asphalt
    const beamGeo = new THREE.ConeGeometry(1.6, 12.0, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xd0f0ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    [-0.75, 0.75].forEach(hx => {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.x = Math.PI / 2 - 0.08;
      beam.position.set(hx, 0.35, 7.8);
      carRoot.add(beam);
    });

    // Real HD Photographic Car Body Shell with Studio Specular Clearcoat
    this.loadRealCarTexture(this.carModel, (carTexture) => {
      const realCarMat = new THREE.MeshPhysicalMaterial({
        map: carTexture,
        transparent: true,
        alphaTest: 0.05,
        roughness: 0.14,
        metalness: 0.52,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        reflectivity: 1.0,
        side: THREE.DoubleSide
      });
      const topShell = new THREE.Mesh(new THREE.PlaneGeometry(2.38, 4.8), realCarMat);
      topShell.rotation.x = -Math.PI / 2;
      topShell.position.set(0, 0.72, 0.05);
      carRoot.add(topShell);
    });

    // Asphalt Nitro Shockwave Plasma Aura
    const auraGeo = new THREE.SphereGeometry(2.6, 16, 12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xd946ef,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.scale.set(0.65, 0.35, 1.25);
    auraMesh.position.set(0, 0.7, 0);
    carRoot.add(auraMesh);
    this.shockwaveAuraMesh = auraMesh;

    // Dynamic Nitro Exhaust Point Light
    this.exhaustLight = new THREE.PointLight(0x00e5ff, 0, 10);
    this.exhaustLight.position.set(0, 0.4, -2.8);
    carRoot.add(this.exhaustLight);

    if (this.mesh.children.indexOf(this.bodyGroup) === -1) {
      this.mesh.add(this.bodyGroup);
    }
  }

  loadRealCarTexture(modelName, callback) {
    const carImageMap = {
      'formula1': 'car_formula_aero.jpg',
      'hypercar': 'car_yellow_hyper.jpg',
      'speedster': 'car_f1_speedster.jpg',
      'muscle': 'car_blue_touring.jpg',
      'supercar': 'car_orange_gt.jpg'
    };
    const imgName = carImageMap[modelName] || 'car_orange_gt.jpg';
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const isHorizontal = img.width > img.height;
      const targetW = 512;
      const targetH = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      ctx.save();
      if (isHorizontal) {
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -targetH / 2, -targetW / 2, targetH, targetW);
      } else {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      }
      ctx.restore();

      try {
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 235 && g > 235 && b > 235) {
            data[i + 3] = 0;
          } else if (r > 210 && g > 210 && b > 210) {
            data[i + 3] = Math.floor(((255 - ((r + g + b) / 3)) / 45) * 255);
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) {
        console.warn('Canvas pixel processing note:', e);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      if (callback) callback(texture);
    };
    img.src = 'images/cars/' + imgName;
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
    try {
      if (ctx.roundRect) {
        ctx.roundRect(8, 8, 240, 48, 20);
      } else {
        ctx.rect(8, 8, 240, 48);
      }
    } catch(e) {
      ctx.rect(8, 8, 240, 48);
    }
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
      if (child.isMesh && child.material) {
        if (child.material.userData && child.material.userData.isBodyMat) {
          child.material.color.set(hex);
        } else if (child.material.userData && child.material.userData.isNeonMat) {
          child.material.color.set(hex);
        }
      }
    });
    this.underglowLights.forEach(u => {
      if (u.material) u.material.color.set(hex);
    });
    this.createNameTag();
  }

  setNitroTune(stage = 1) {
    this.nitroTuneStage = stage;
    const baseNitroSpeed = (this.stats && this.stats.nitroMaxSpeed) ? this.stats.nitroMaxSpeed : 255;
    if (stage === 1) {
      this.nitroMaxSpeed = baseNitroSpeed;
      this.nitroRechargeRate = 18;
    } else if (stage === 2) {
      this.nitroMaxSpeed = baseNitroSpeed * 1.08;
      this.nitroRechargeRate = 26;
    } else if (stage === 3) {
      this.nitroMaxSpeed = baseNitroSpeed * 1.15;
      this.nitroRechargeRate = 34;
    }
  }

  initParticleSystems() {
    // Tire Smoke Pool
    const smokeGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4 });
    for (let i = 0; i < this.maxSmoke; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      this.scene.add(p);
      this.smokePool.push({ mesh: p, velocity: new THREE.Vector3(), life: 0, maxLife: 0.8, scale: 0.5 });
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
    const spawnChance = this.isDrifting ? 0.2 : 0.45;
    [-1.1, 1.1].forEach(sideX => {
      if (Math.random() > spawnChance) {
        const particle = this.smokePool.find(p => !p.mesh.visible);
        if (particle) {
          const spawnOffset = new THREE.Vector3(sideX, 0.15, -1.4).applyEuler(this.rotation);
          particle.mesh.position.copy(this.position).add(spawnOffset);
          particle.mesh.visible = true;
          particle.life = 0;
          particle.scale = this.isDrifting ? 0.7 : 0.5;
          particle.mesh.scale.set(particle.scale, particle.scale, particle.scale);
          particle.mesh.material.opacity = this.isDrifting ? 0.6 : 0.45;
          particle.velocity.set((Math.random() - 0.5) * 2.5, Math.random() * 1.8 + 0.5, (Math.random() - 0.5) * 2.5);
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

  // Asphalt Stunt Ramp Launch
  triggerRampJump(stuntType = 'barrel_roll') {
    if (this.isAirborne || this.isWrecked) return;
    this.isAirborne = true;
    this.jumpVelocityY = 16.5;
    this.stuntType = stuntType;
    this.stuntAngle = 0;
    this.stuntSpinSpeed = (Math.PI * 2) / 1.1; // 360 spin in 1.1s
    this.lastStuntAwarded = false;

    if (window.game && window.game.ui) {
      if (stuntType === 'barrel_roll') {
        window.game.ui.showStuntBadge('🌀 BARREL ROLL!');
      } else {
        window.game.ui.showStuntBadge('⚡ 360 FLAT SPIN!');
      }
    }
  }

  takeDamage(amount = 1, impactPosition = null) {
    if (this.isWrecked) return;
    if (amount < 5 && this.damageCooldown > 0) return;
    this.damageCooldown = 0.6; // 0.6s cooldown between consecutive wall hits

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

    // Triple-Stage Nitro State Logic (Yellow -> Blue -> Purple Shockwave)
    const isNitroPressed = input.nitro && this.nitroAmount > 3;
    if (isNitroPressed) {
      this.isBoosting = true;
      if (this.nitroAmount > 80 || this.isShockwave) {
        // Stage 3: NITRO SHOCKWAVE (Purple Superboost)
        this.nitroStage = 3;
        this.isShockwave = true;
        this.nitroAmount = Math.max(0, this.nitroAmount - delta * 32);
      } else if (this.nitroAmount > 38) {
        // Stage 2: Perfect Blue Nitro
        this.nitroStage = 2;
        this.isShockwave = false;
        this.nitroAmount = Math.max(0, this.nitroAmount - delta * 24);
      } else {
        // Stage 1: Yellow Nitro
        this.nitroStage = 1;
        this.isShockwave = false;
        this.nitroAmount = Math.max(0, this.nitroAmount - delta * 18);
      }
    } else {
      this.nitroStage = 0;
      this.isBoosting = false;
      this.isShockwave = false;
      // Drift refills nitro significantly faster (+28% / sec)
      const rechargeRate = (this.isDrifting && Math.abs(this.speed) > 25) 
        ? (this.nitroRechargeRate || 18) * 1.8 
        : (this.nitroRechargeRate || 18) * 0.6;
      this.nitroAmount = Math.min(this.nitroMax, this.nitroAmount + delta * rechargeRate);
    }

    // Shockwave Aura & Exhaust Flame Animation
    if (this.shockwaveAuraMesh) {
      if (this.isShockwave) {
        this.shockwaveAuraMesh.material.opacity = 0.6 + Math.sin(performance.now() * 0.03) * 0.3;
        this.shockwaveAuraMesh.rotation.y += 0.12;
      } else {
        this.shockwaveAuraMesh.material.opacity = 0.0;
      }
    }

    this.exhaustFlames.forEach((f) => {
      if (this.isBoosting) {
        const flicker = 0.85 + Math.random() * 0.4;
        f.outer.material.opacity = 0.95;
        f.inner.material.opacity = 1.0;
        if (this.nitroStage === 3) {
          f.outer.material.color.setHex(0xd946ef); // Purple Shockwave
          f.outer.scale.set(1.4, 2.0 * flicker, 1.4);
        } else if (this.nitroStage === 2) {
          f.outer.material.color.setHex(0x00e5ff); // Cyan Blue
          f.outer.scale.set(1.2, 1.5 * flicker, 1.2);
        } else {
          f.outer.material.color.setHex(0xffea00); // Yellow
          f.outer.scale.set(1.0, 1.2 * flicker, 1.0);
        }
      } else {
        f.outer.material.opacity = 0.0;
        f.inner.material.opacity = 0.0;
      }
    });

    if (this.exhaustLight) {
      if (this.isShockwave) {
        this.exhaustLight.color.setHex(0xd946ef);
        this.exhaustLight.intensity = 4.0;
      } else if (this.isBoosting) {
        this.exhaustLight.color.setHex(0x00e5ff);
        this.exhaustLight.intensity = 2.5;
      } else {
        this.exhaustLight.intensity = 0;
      }
    }

    const shockwaveMultiplier = this.isShockwave ? 1.22 : 1.0;
    const targetMaxSpeed = this.isBoosting ? (this.nitroMaxSpeed * shockwaveMultiplier) : this.maxSpeed;

    this.isBraking = input.brake && this.speed > 5;
    const isAccelerating = input.gas || isNitroPressed;
    if (isAccelerating) {
      const accelRate = this.isShockwave ? (this.acceleration * 2.2) : (this.isBoosting ? this.acceleration * 1.85 : this.acceleration);
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

    // Dynamic Thermal Brake Glow on Hard Braking
    if (this.brakeDiscs && this.brakeDiscs.length > 0) {
      const isHardBraking = this.isBraking && Math.abs(this.speed) > 35;
      this.brakeDiscs.forEach(disc => {
        if (disc.material) {
          if (isHardBraking) {
            disc.material.color.setHex(0xff3300);
            disc.material.emissive = new THREE.Color(0xff2200);
            disc.material.emissiveIntensity = THREE.MathUtils.lerp(disc.material.emissiveIntensity || 0, 1.4, delta * 8);
          } else {
            disc.material.color.setHex(0x999999);
            if (disc.material.emissive) {
              disc.material.emissiveIntensity = THREE.MathUtils.lerp(disc.material.emissiveIntensity || 0, 0, delta * 3);
            }
          }
        }
      });
    }

    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    this.isDrifting = (input.drift || false) && (Math.abs(this.speed) > 25);

    // Steering & Lateral Slip Drift Dynamics
    if (Math.abs(this.speed) > 1) {
      const dir = this.speed >= 0 ? 1 : -1;
      const turnMultiplier = (this.isDrifting ? 1.55 : 1.0) * (1 - speedRatio * 0.22);

      if (input.left) {
        this.rotation.y += this.turnSpeed * turnMultiplier * delta * dir;
        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, 0.52, delta * 14);
      } else if (input.right) {
        this.rotation.y -= this.turnSpeed * turnMultiplier * delta * dir;
        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, -0.52, delta * 14);
      } else {
        this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, 0, delta * 14);
      }
    } else {
      this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, 0, delta * 14);
    }

    // Visual Drift Body Yaw Angle
    const driftSteer = input.left ? 1 : (input.right ? -1 : 0);
    const targetDriftYaw = this.isDrifting ? (driftSteer * 0.40) : 0;
    this.driftYawAngle = THREE.MathUtils.lerp(this.driftYawAngle, targetDriftYaw, delta * 8);

    // Front Wheel Steering & Camber Tilt
    this.frontWheelHubs.forEach((hub) => {
      hub.rotation.y = this.steeringAngle;
      hub.rotation.z = -this.steeringAngle * 0.16;
    });

    // Active Aero Dynamics (Spoiler tilts with speed / airbrake)
    if (this.activeSpoilerMesh) {
      const targetSpoilerTilt = this.isBraking ? -0.48 : (this.isBoosting ? 0.35 : (speedRatio > 0.65 ? 0.2 : 0.0));
      this.activeSpoilerMesh.rotation.x = THREE.MathUtils.lerp(this.activeSpoilerMesh.rotation.x, targetSpoilerTilt, delta * 10);
    }

    // Suspension Physics (Squat, Dive & Body Roll)
    const targetPitch = (isAccelerating ? -0.065 : 0) + (this.isBraking ? 0.095 : 0);
    this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, delta * 10);

    const targetRoll = -this.steeringAngle * speedRatio * 0.3;
    this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, delta * 12);

    // Engine Harmonic & Road Jitter
    const engineHarmonic = (this.rpm / 8500) * 0.003;
    const roadJitter = speedRatio > 0.08 ? (Math.sin(performance.now() * 0.04) * 0.004 * speedRatio) : 0;

    // Handle Airborne Jump & Stunt Rotations
    if (this.isAirborne) {
      this.jumpVelocityY -= 28 * delta; // Gravity
      this.position.y += this.jumpVelocityY * delta;

      if (this.stuntType === 'barrel_roll') {
        this.stuntAngle += this.stuntSpinSpeed * delta;
        this.bodyGroup.rotation.z = this.stuntAngle;
        this.bodyGroup.rotation.x = 0.2;
      } else if (this.stuntType === 'flat_spin') {
        this.stuntAngle += this.stuntSpinSpeed * delta;
        this.bodyGroup.rotation.y = this.stuntAngle;
        this.bodyGroup.rotation.z = this.rollAngle;
        this.bodyGroup.rotation.x = 0;
      }

      // Check Landing on Road
      if (this.position.y <= 0.46) {
        this.position.y = 0.46;
        this.isAirborne = false;
        this.jumpVelocityY = 0;
        this.bodyGroup.rotation.set(0, 0, 0);

        // Stunt Landing Reward: Full Nitro + UI Notice
        if (!this.lastStuntAwarded) {
          this.nitroAmount = 100;
          this.lastStuntAwarded = true;
          this.emitCrashSparks(this.position);
          if (window.game && window.game.ui) {
            window.game.ui.showToast('🚀 STUNT LANDED! +100% NITRO RECHARGED!');
          }
        }
      }
    } else {
      this.position.y = 0.46;
      this.bodyGroup.position.y = roadJitter + engineHarmonic;
      this.bodyGroup.rotation.x = this.pitchAngle;
      this.bodyGroup.rotation.z = this.rollAngle;
      this.bodyGroup.rotation.y = this.driftYawAngle;
    }

    // Smooth Lateral Slip during Drift
    if (this.velocityHeading === undefined) {
      this.velocityHeading = this.rotation.y;
    }

    if (this.isDrifting) {
      // Velocity direction lags behind vehicle heading for authentic slide momentum
      this.velocityHeading = THREE.MathUtils.lerp(this.velocityHeading, this.rotation.y, delta * 3.6);
    } else {
      this.velocityHeading = THREE.MathUtils.lerp(this.velocityHeading, this.rotation.y, delta * 14);
    }

    const driftBlend = this.isDrifting ? 0.35 : 0.0;
    const moveHeading = THREE.MathUtils.lerp(this.velocityHeading, this.rotation.y, driftBlend);
    const moveVector = new THREE.Vector3(Math.sin(moveHeading), 0, Math.cos(moveHeading));
    const velocityMagnitude = (this.speed / 3.6) * delta;
    this.position.addScaledVector(moveVector, velocityMagnitude);

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation.y;

    // Smooth Wheel Rotation Physics
    const wheelSpin = velocityMagnitude / 0.41;
    this.wheels.forEach(wheel => {
      wheel.rotation.x += wheelSpin;
    });

    // Drift Sparks Effect
    if (this.isDrifting && Math.abs(this.speed) > 35) {
      this.emitCrashSparks(this.position.clone().add(new THREE.Vector3(0, 0.1, -1.2).applyEuler(this.rotation)));
    }

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
    this.isAirborne = false;
    this.jumpVelocityY = 0;
    this.rotation.y = Math.atan2(tangent.x, tangent.z);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, this.rotation.y, 0);
    this.bodyGroup.rotation.set(0, 0, 0);
  }
}
