// Multi-Map 3D Racing Track Generator (Neon City, Metropolis, Jungle Safari, Desert Canyon, Tokyo Drift)
class RacingTrack {
  constructor(scene, trackId = 'neon_city') {
    this.scene = scene;
    this.trackId = trackId;
    this.trackWidth = 24;
    this.checkpoints = [];
    this.trackCurve = null;
    this.roadMesh = null;
    this.environmentMeshes = [];
    this.animatedChevrons = [];
    this.startTrafficLights = [];
    this.stuntRamps = [];
    this.nitroPickups = [];

    this.init(this.trackId);
  }

  init(trackId = 'neon_city') {
    this.trackId = trackId;
    this.clearTrack();

    // Map Specific Waypoint Circuits
    if (this.trackId === 'jungle_safari') {
      // Lush Winding Forest Circuit
      this.waypoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 150),
        new THREE.Vector3(60, 0, 220),
        new THREE.Vector3(140, 0, 190),
        new THREE.Vector3(190, 0, 90),
        new THREE.Vector3(160, 0, -10),
        new THREE.Vector3(100, 0, -90),
        new THREE.Vector3(30, 0, -150),
        new THREE.Vector3(-50, 0, -140),
        new THREE.Vector3(-120, 0, -70),
        new THREE.Vector3(-160, 0, 30),
        new THREE.Vector3(-130, 0, 130),
        new THREE.Vector3(-40, 0, 150),
        new THREE.Vector3(0, 0, 0)
      ];
    } else if (this.trackId === 'city_center') {
      // Metropolis Downtown Grid
      this.waypoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 180),
        new THREE.Vector3(80, 0, 180),
        new THREE.Vector3(180, 0, 180),
        new THREE.Vector3(180, 0, 0),
        new THREE.Vector3(180, 0, -140),
        new THREE.Vector3(90, 0, -140),
        new THREE.Vector3(0, 0, -140),
        new THREE.Vector3(-120, 0, -140),
        new THREE.Vector3(-150, 0, -40),
        new THREE.Vector3(-150, 0, 90),
        new THREE.Vector3(-60, 0, 120),
        new THREE.Vector3(0, 0, 0)
      ];
    } else if (this.trackId === 'desert_canyon') {
      this.waypoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 160),
        new THREE.Vector3(70, 0, 240),
        new THREE.Vector3(160, 0, 200),
        new THREE.Vector3(220, 0, 80),
        new THREE.Vector3(170, 0, -40),
        new THREE.Vector3(120, 0, -120),
        new THREE.Vector3(40, 0, -180),
        new THREE.Vector3(-60, 0, -160),
        new THREE.Vector3(-140, 0, -80),
        new THREE.Vector3(-180, 0, 40),
        new THREE.Vector3(-140, 0, 150),
        new THREE.Vector3(-50, 0, 160),
        new THREE.Vector3(0, 0, 0)
      ];
    } else if (this.trackId === 'tokyo_circuit') {
      this.waypoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 120),
        new THREE.Vector3(35, 0, 170),
        new THREE.Vector3(90, 0, 170),
        new THREE.Vector3(140, 0, 110),
        new THREE.Vector3(140, 0, 20),
        new THREE.Vector3(90, 0, -40),
        new THREE.Vector3(50, 0, -60),
        new THREE.Vector3(0, 0, -90),
        new THREE.Vector3(-45, 0, -70),
        new THREE.Vector3(-90, 0, -30),
        new THREE.Vector3(-110, 0, 30),
        new THREE.Vector3(-90, 0, 110),
        new THREE.Vector3(-40, 0, 130),
        new THREE.Vector3(-15, 0, 60),
        new THREE.Vector3(0, 0, 0)
      ];
    } else {
      // Default: Neon Cyber City
      this.waypoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 140),
        new THREE.Vector3(45, 0, 210),
        new THREE.Vector3(130, 0, 210),
        new THREE.Vector3(200, 0, 140),
        new THREE.Vector3(200, 0, 30),
        new THREE.Vector3(140, 0, -60),
        new THREE.Vector3(80, 0, -95),
        new THREE.Vector3(0, 0, -140),
        new THREE.Vector3(-70, 0, -100),
        new THREE.Vector3(-135, 0, -40),
        new THREE.Vector3(-170, 0, 50),
        new THREE.Vector3(-145, 0, 160),
        new THREE.Vector3(-70, 0, 190),
        new THREE.Vector3(-25, 0, 90),
        new THREE.Vector3(0, 0, 0)
      ];
    }

    this.trackCurve = new THREE.CatmullRomCurve3(this.waypoints, true, 'catmullrom', 0.15);
    this.buildRoadMesh();
    this.buildCheckpoints();
    this.buildStartFinishGantry();
    this.buildAnimatedChevrons();
    this.buildStuntRamps();
    this.buildNitroPickups();
    this.buildEnvironment();
  }

  clearTrack() {
    if (this.roadMesh) {
      this.scene.remove(this.roadMesh);
      this.roadMesh = null;
    }
    this.environmentMeshes.forEach(m => this.scene.remove(m));
    this.environmentMeshes = [];
    this.animatedChevrons.forEach(c => this.scene.remove(c));
    this.animatedChevrons = [];
    this.startTrafficLights = [];
    this.checkpoints = [];
    this.stuntRamps.forEach(r => this.scene.remove(r.mesh));
    this.stuntRamps = [];
    this.nitroPickups.forEach(n => this.scene.remove(n.mesh));
    this.nitroPickups = [];
  }

  buildRoadMesh() {
    const pointsCount = 450;
    const points = this.trackCurve.getPoints(pointsCount);

    const roadGeometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const normals = [];

    const halfWidth = this.trackWidth / 2;

    for (let i = 0; i <= pointsCount; i++) {
      const idx = i % pointsCount;
      const point = points[idx];
      const nextIdx = (idx + 1) % pointsCount;
      const nextPoint = points[nextIdx];

      const tangent = new THREE.Vector3().subVectors(nextPoint, point).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const left = new THREE.Vector3().copy(point).addScaledVector(right, -halfWidth);
      const rightSide = new THREE.Vector3().copy(point).addScaledVector(right, halfWidth);

      left.y = 0.05;
      rightSide.y = 0.05;

      positions.push(left.x, left.y, left.z);
      positions.push(rightSide.x, rightSide.y, rightSide.z);

      const u = i / 8;
      uvs.push(0, u);
      uvs.push(1, u);

      normals.push(0, 1, 0);
      normals.push(0, 1, 0);
    }

    const indices = [];
    for (let i = 0; i < pointsCount; i++) {
      const v1 = i * 2;
      const v2 = v1 + 1;
      const v3 = (i + 1) * 2;
      const v4 = v3 + 1;
      indices.push(v1, v2, v3);
      indices.push(v2, v4, v3);
    }

    roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeometry.setIndex(indices);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // High-Definition Realistic Racing Tarmac Base
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(0, 0, 1024, 1024);

    // Realistic Micro-Asphalt Grain Texture
    for (let j = 0; j < 12000; j++) {
      const shade = Math.random();
      ctx.fillStyle = shade > 0.6 ? '#1b222c' : (shade > 0.3 ? '#141820' : '#080a0e');
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Racing Groove / Rubberized Tire Skid Marks
    const tireGradL = ctx.createLinearGradient(180, 0, 360, 0);
    tireGradL.addColorStop(0, 'rgba(10, 12, 16, 0.0)');
    tireGradL.addColorStop(0.5, 'rgba(5, 7, 10, 0.65)');
    tireGradL.addColorStop(1, 'rgba(10, 12, 16, 0.0)');
    ctx.fillStyle = tireGradL;
    ctx.fillRect(180, 0, 180, 1024);

    const tireGradR = ctx.createLinearGradient(660, 0, 840, 0);
    tireGradR.addColorStop(0, 'rgba(10, 12, 16, 0.0)');
    tireGradR.addColorStop(0.5, 'rgba(5, 7, 10, 0.65)');
    tireGradR.addColorStop(1, 'rgba(10, 12, 16, 0.0)');
    ctx.fillStyle = tireGradR;
    ctx.fillRect(660, 0, 180, 1024);

    // Luminous Edge Strips according to Track Theme
    const edgeColor = this.trackId === 'jungle_safari' ? '#00e676' : this.trackId === 'city_center' ? '#00d2ff' : this.trackId === 'desert_canyon' ? '#ff9800' : this.trackId === 'tokyo_circuit' ? '#ff0055' : '#00e5ff';
    ctx.fillStyle = edgeColor;
    ctx.shadowColor = edgeColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(16, 0, 14, 1024);
    ctx.fillRect(994, 0, 14, 1024);
    ctx.shadowBlur = 0;

    // Outer Asphalt Curbs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 0, 6, 1024);
    ctx.fillRect(982, 0, 6, 1024);

    // Center Dashed Racing Guideline
    ctx.fillStyle = '#ffea00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 8;
    for (let y = 0; y < 1024; y += 128) {
      ctx.fillRect(504, y, 16, 76);
    }
    ctx.shadowBlur = 0;

    const roadTexture = new THREE.CanvasTexture(canvas);
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, 45);

    // Ultra-Realistic Specular Wet-Look Asphalt Material
    const roadMaterial = new THREE.MeshPhysicalMaterial({
      map: roadTexture,
      roughness: 0.38,
      metalness: 0.28,
      clearcoat: 0.45,
      clearcoatRoughness: 0.12,
      reflectivity: 0.8
    });
    this.roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    this.roadMesh.receiveShadow = true;
    this.scene.add(this.roadMesh);

    this.buildCurbsAndGuardrails(points);
  }

  buildCurbsAndGuardrails(points) {
    const railColor = this.trackId === 'jungle_safari' ? 0x00e676 : this.trackId === 'city_center' ? 0x00b4d8 : this.trackId === 'desert_canyon' ? 0xff9800 : this.trackId === 'tokyo_circuit' ? 0xff0055 : 0x00e5ff;
    const railMat = new THREE.MeshStandardMaterial({
      color: railColor,
      emissive: railColor,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.15
    });

    const curbMatRed = new THREE.MeshStandardMaterial({ color: 0xff0033, roughness: 0.6 });
    const curbMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const halfW = (this.trackWidth / 2);

    for (let i = 0; i < points.length; i += 3) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const tangent = new THREE.Vector3().subVectors(p2, p1).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

      [-halfW - 1.2, halfW + 1.2].forEach(offset => {
        const postPos = new THREE.Vector3().copy(p1).addScaledVector(right, offset);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 8), railMat);
        post.position.set(postPos.x, 0.7, postPos.z);
        this.scene.add(post);
        this.environmentMeshes.push(post);
      });

      const curbMat = (Math.floor(i / 3) % 2 === 0) ? curbMatRed : curbMatWhite;
      [-halfW - 0.4, halfW + 0.4].forEach(offset => {
        const curbPos = new THREE.Vector3().copy(p1).addScaledVector(right, offset);
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.8), curbMat);
        curb.position.set(curbPos.x, 0.1, curbPos.z);
        curb.rotation.y = Math.atan2(tangent.x, tangent.z);
        this.scene.add(curb);
        this.environmentMeshes.push(curb);
      });
    }
  }

  buildCheckpoints() {
    const numCheckpoints = 18;
    for (let i = 0; i < numCheckpoints; i++) {
      const t = i / numCheckpoints;
      const point = this.trackCurve.getPointAt(t);
      const tangent = this.trackCurve.getTangentAt(t).normalize();
      
      this.checkpoints.push({
        id: i,
        position: point,
        tangent: tangent,
        radius: this.trackWidth * 0.95
      });
    }
  }

  buildStartFinishGantry() {
    const gantryGroup = new THREE.Group();
    const startPoint = this.waypoints[0];
    const tangent = this.trackCurve.getTangentAt(0).normalize();

    const w = this.trackWidth + 6;
    const h = 9;

    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0f141f, metalness: 0.9, roughness: 0.2 });
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.8, emissive: 0x00e5ff, emissiveIntensity: 0.2 });

    const towerL = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), gantryMat);
    towerL.position.set(-w / 2, h / 2, 0);

    const towerR = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), gantryMat);
    towerR.position.set(w / 2, h / 2, 0);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(w + 2, 2.2, 2.0), trussMat);
    bridge.position.set(0, h, 0);

    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = '#050a14';
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.fillStyle = '#00e5ff';
    bCtx.font = 'bold 44px Orbitron, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText(this.trackId.toUpperCase().replace('_', ' '), 256, 56);
    bCtx.fillStyle = '#ff2a5f';
    bCtx.font = 'bold 30px Orbitron, sans-serif';
    bCtx.fillText('START / FINISH', 256, 100);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(w - 2, 2.0), new THREE.MeshBasicMaterial({ map: bannerTex }));
    banner.position.set(0, h, 1.05);

    for (let i = 0; i < 5; i++) {
      const offsetX = (i - 2) * 2.8;
      const lightHousing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.4), gantryMat);
      lightHousing.position.set(offsetX, h - 1.8, 0.8);

      const lampRed = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), new THREE.MeshBasicMaterial({ color: 0x330000 }));
      lampRed.position.set(offsetX, h - 1.8, 1.05);

      gantryGroup.add(lightHousing, lampRed);
      this.startTrafficLights.push(lampRed);
    }

    gantryGroup.add(towerL, towerR, bridge, banner);
    gantryGroup.rotation.y = Math.atan2(tangent.x, tangent.z);
    gantryGroup.position.set(startPoint.x, 0, startPoint.z);

    this.scene.add(gantryGroup);
    this.environmentMeshes.push(gantryGroup);
  }

  buildAnimatedChevrons() {
    const turnIndices = [2, 4, 6, 7, 9, 11, 13];
    const chevronTexCanvas = document.createElement('canvas');
    chevronTexCanvas.width = 256;
    chevronTexCanvas.height = 128;
    const cCtx = chevronTexCanvas.getContext('2d');
    cCtx.fillStyle = '#000000';
    cCtx.fillRect(0, 0, 256, 128);
    cCtx.fillStyle = this.trackId === 'desert_canyon' ? '#ff9800' : this.trackId === 'jungle_safari' ? '#00e676' : '#ffea00';
    
    cCtx.beginPath();
    cCtx.moveTo(40, 20); cCtx.lineTo(120, 64); cCtx.lineTo(40, 108); cCtx.lineTo(80, 108); cCtx.lineTo(160, 64); cCtx.lineTo(80, 20); cCtx.closePath(); cCtx.fill();
    cCtx.beginPath();
    cCtx.moveTo(120, 20); cCtx.lineTo(200, 64); cCtx.lineTo(120, 108); cCtx.lineTo(160, 108); cCtx.lineTo(240, 64); cCtx.lineTo(160, 20); cCtx.closePath(); cCtx.fill();

    const chevronTexture = new THREE.CanvasTexture(chevronTexCanvas);
    const chevronMat = new THREE.MeshBasicMaterial({ map: chevronTexture, transparent: true });

    turnIndices.forEach(idx => {
      if (idx < this.waypoints.length) {
        const wp = this.waypoints[idx];
        const nextWp = this.waypoints[(idx + 1) % this.waypoints.length];
        const tangent = new THREE.Vector3().subVectors(nextWp, wp).normalize();
        const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

        const boardPos = new THREE.Vector3().copy(wp).addScaledVector(right, (this.trackWidth / 2) + 4);
        const board = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), chevronMat.clone());
        board.position.set(boardPos.x, 3.5, boardPos.z);
        board.rotation.y = Math.atan2(tangent.x, tangent.z);
        this.scene.add(board);
        this.animatedChevrons.push(board);
        this.environmentMeshes.push(board);
      }
    });
  }

  buildEnvironment() {
    let groundColor = 0x060810;
    if (this.trackId === 'jungle_safari') groundColor = 0x142811;
    else if (this.trackId === 'city_center') groundColor = 0x0c0f17;
    else if (this.trackId === 'desert_canyon') groundColor = 0x2e1a0d;
    else if (this.trackId === 'tokyo_circuit') groundColor = 0x070c18;

    const groundGeo = new THREE.PlaneGeometry(1600, 1600, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.environmentMeshes.push(ground);

    if (this.trackId === 'jungle_safari') {
      // 3D Tropical Rainforest Trees & Rocks
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.7 });
      const foliageMatLight = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });

      for (let i = 0; i < 90; i++) {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.2, 10, 8), trunkMat);
        trunk.position.y = 5;

        // Tree Canopy
        const canopy1 = new THREE.Mesh(new THREE.ConeGeometry(5, 7, 8), foliageMat);
        canopy1.position.y = 10;
        const canopy2 = new THREE.Mesh(new THREE.ConeGeometry(3.8, 5.5, 8), foliageMatLight);
        canopy2.position.y = 13.5;

        treeGroup.add(trunk, canopy1, canopy2);

        const angle = (i / 90) * Math.PI * 2 + (Math.random() * 0.1);
        const dist = 160 + Math.random() * 260;
        treeGroup.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);
        const scale = 0.8 + Math.random() * 0.8;
        treeGroup.scale.set(scale, scale, scale);

        this.scene.add(treeGroup);
        this.environmentMeshes.push(treeGroup);
      }
    } else if (this.trackId === 'desert_canyon') {
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x7c3f1d, roughness: 0.9, metalness: 0.1 });
      for (let i = 0; i < 40; i++) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(15 + Math.random() * 25, 1), rockMat);
        const angle = (i / 40) * Math.PI * 2;
        const dist = 180 + Math.random() * 200;
        rock.position.set(Math.sin(angle) * dist, 10, Math.cos(angle) * dist);
        rock.scale.set(1 + Math.random(), 2 + Math.random() * 2, 1 + Math.random());
        this.scene.add(rock);
        this.environmentMeshes.push(rock);
      }
    } else {
      // Modern Downtown & Cyber City Skyscrapers
      const buildingColors = this.trackId === 'city_center' 
        ? [0x1e293b, 0x334155, 0x475569, 0x0f172a] 
        : [0x0b101d, 0x111626, 0x0f172a];
      const neonAccentColors = [0x00e5ff, 0xff2a5f, 0x8b5cf6, 0x00e676, 0xffea00];

      for (let i = 0; i < 70; i++) {
        const angle = (i / 70) * Math.PI * 2;
        const distance = 200 + Math.random() * 280;
        const bx = Math.sin(angle) * distance;
        const bz = Math.cos(angle) * distance;
        const bHeight = 45 + Math.random() * 150;

        const buildingGroup = new THREE.Group();
        const bMat = new THREE.MeshStandardMaterial({ color: buildingColors[i % buildingColors.length], metalness: 0.8, roughness: 0.25 });
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(25 + Math.random() * 30, bHeight, 25 + Math.random() * 30), bMat);
        bMesh.position.y = bHeight / 2;
        buildingGroup.add(bMesh);

        const spireMat = new THREE.MeshBasicMaterial({ color: neonAccentColors[i % neonAccentColors.length] });
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.2, 20, 6), spireMat);
        spire.position.set(0, bHeight + 10, 0);
        buildingGroup.add(spire);

        buildingGroup.position.set(bx, 0, bz);
        this.scene.add(buildingGroup);
        this.environmentMeshes.push(buildingGroup);
      }
    }
  }

  buildBranchingRoutes() {
    this.branchMeshes = [];
    if (this.waypoints.length < 10) return;

    // 1. High-Altitude Skybridge Shortcut Route (Cuts across waypoints 3 -> 8)
    const pStart = this.waypoints[3];
    const pEnd = this.waypoints[7];
    const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    midPoint.y = 8.5; // Elevated high in the sky

    const bridgePoints = [
      new THREE.Vector3(pStart.x, 2.0, pStart.z),
      new THREE.Vector3(pStart.x * 0.7 + pEnd.x * 0.3, 7.5, pStart.z * 0.7 + pEnd.z * 0.3),
      midPoint,
      new THREE.Vector3(pStart.x * 0.3 + pEnd.x * 0.7, 7.0, pStart.z * 0.3 + pEnd.z * 0.7),
      new THREE.Vector3(pEnd.x, 1.5, pEnd.z)
    ];

    const bridgeCurve = new THREE.CatmullRomCurve3(bridgePoints, false);
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 40, 7.0, 8, false);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x0c101d,
      metalness: 0.92,
      roughness: 0.2
    });
    const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.scale.set(1, 0.08, 1);
    this.scene.add(bridgeMesh);
    this.environmentMeshes.push(bridgeMesh);

    // Glowing Neon Rails along Skybridge
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const railGeo = new THREE.TubeGeometry(bridgeCurve, 40, 0.25, 6, false);
    const railMeshL = new THREE.Mesh(railGeo, railMat);
    railMeshL.position.x -= 4.0;
    railMeshL.position.y += 0.6;
    const railMeshR = new THREE.Mesh(railGeo, railMat);
    railMeshR.position.x += 4.0;
    railMeshR.position.y += 0.6;
    this.scene.add(railMeshL, railMeshR);
    this.environmentMeshes.push(railMeshL, railMeshR);

    // Support Concrete Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, metalness: 0.8, roughness: 0.3 });
    [0.25, 0.5, 0.75].forEach(t => {
      const pt = bridgeCurve.getPointAt(t);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, pt.y, 12), pillarMat);
      pillar.position.set(pt.x, pt.y / 2, pt.z);
      this.scene.add(pillar);
      this.environmentMeshes.push(pillar);
    });

    // Super Shockwave Pickup on Skybridge Apex
    const shockwaveGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 16);
    const shockwaveMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 0.9,
      metalness: 0.95
    });
    const shockwavePickup = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwavePickup.position.set(midPoint.x, midPoint.y + 1.2, midPoint.z);
    this.scene.add(shockwavePickup);
    this.nitroPickups.push({
      mesh: shockwavePickup,
      type: 'shockwave_nitro',
      active: true,
      baseY: midPoint.y + 1.2
    });
  }

  buildStuntRamps() {
    const rampIndices = [
      { wpIdx: 2, type: 'barrel_roll', offset: -4.5, angleOffset: 0.25 },
      { wpIdx: 3, type: 'super_jump', offset: 0.0, angleOffset: 0.0 }, // Launch to Skybridge
      { wpIdx: 6, type: 'flat_spin', offset: 4.8, angleOffset: -0.2 },
      { wpIdx: 10, type: 'barrel_roll', offset: -4.0, angleOffset: 0.25 },
      { wpIdx: 13, type: 'flat_spin', offset: 0.0, angleOffset: 0.0 }
    ];

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0x111624,
      metalness: 0.9,
      roughness: 0.2
    });

    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 256;
    hazardCanvas.height = 256;
    const hCtx = hazardCanvas.getContext('2d');
    hCtx.fillStyle = '#ffea00';
    hCtx.fillRect(0, 0, 256, 256);
    hCtx.fillStyle = '#000000';
    for (let i = -256; i < 512; i += 48) {
      hCtx.beginPath();
      hCtx.moveTo(i, 0);
      hCtx.lineTo(i + 24, 0);
      hCtx.lineTo(i - 48, 256);
      hCtx.lineTo(i - 72, 256);
      hCtx.closePath();
      hCtx.fill();
    }
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    hazardTex.repeat.set(2, 2);

    const faceMat = new THREE.MeshBasicMaterial({ map: hazardTex });

    rampIndices.forEach((rData) => {
      if (rData.wpIdx < this.waypoints.length) {
        const wp = this.waypoints[rData.wpIdx];
        const nextWp = this.waypoints[(rData.wpIdx + 1) % this.waypoints.length];
        const tangent = new THREE.Vector3().subVectors(nextWp, wp).normalize();
        const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

        const rampGroup = new THREE.Group();
        const rampGeo = new THREE.BoxGeometry(7.2, 2.2, 11.0);
        const rampMesh = new THREE.Mesh(rampGeo, rampMat);
        rampMesh.rotation.x = -0.24;
        rampMesh.rotation.z = rData.angleOffset || 0;
        rampMesh.position.y = 0.8;
        rampGroup.add(rampMesh);

        // Glowing Arrow Stripe
        const arrowMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 10.5), faceMat);
        arrowMesh.rotation.x = -Math.PI / 2 - 0.24;
        arrowMesh.rotation.z = rData.angleOffset || 0;
        arrowMesh.position.set(0, 0.9, 0);
        rampGroup.add(arrowMesh);

        // Neon Glow Trim
        const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
        neonTrim.position.set(0, 1.85, -5.0);
        rampGroup.add(neonTrim);

        const rampPos = new THREE.Vector3().copy(wp).addScaledVector(right, rData.offset);
        rampGroup.position.set(rampPos.x, 0, rampPos.z);
        rampGroup.rotation.y = Math.atan2(tangent.x, tangent.z);

        this.scene.add(rampGroup);
        this.stuntRamps.push({
          mesh: rampGroup,
          position: rampPos,
          radius: 6.0,
          stuntType: rData.type
        });
      }
    });
  }

  buildNitroPickups() {
    const collectiblePositions = [
      { wpIdx: 1, type: 'yellow_nitro' },
      { wpIdx: 4, type: 'blue_nitro' },
      { wpIdx: 7, type: 'gold_coin' },
      { wpIdx: 9, type: 'blue_nitro' },
      { wpIdx: 11, type: 'yellow_nitro' },
      { wpIdx: 14, type: 'gold_coin' }
    ];

    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00, emissiveIntensity: 0.8, metalness: 0.95 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.8, metalness: 0.95 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb703, emissive: 0xffb703, emissiveIntensity: 0.7, metalness: 0.98, roughness: 0.1 });

    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    collectiblePositions.forEach((cp) => {
      if (cp.wpIdx < this.waypoints.length) {
        const wp = this.waypoints[cp.wpIdx];
        const nextWp = this.waypoints[(cp.wpIdx + 1) % this.waypoints.length];
        const midPoint = new THREE.Vector3().addVectors(wp, nextWp).multiplyScalar(0.5);

        const group = new THREE.Group();

        if (cp.type === 'gold_coin') {
          const coin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.22, 20), goldMat);
          coin.rotation.x = Math.PI / 2;
          group.add(coin);
        } else {
          const isBlue = cp.type === 'blue_nitro';
          const can = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.7, 16), isBlue ? blueMat : yellowMat);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 24), ringMat);
          ring.rotation.x = Math.PI / 2;
          group.add(can, ring);
        }

        group.position.set(midPoint.x, 1.4, midPoint.z);
        this.scene.add(group);
        this.nitroPickups.push({
          mesh: group,
          type: cp.type,
          active: true,
          baseY: 1.4
        });
      }
    });

    this.buildBranchingRoutes();
  }

  buildBranchingRoutes() {
    // 1. High-Altitude Elevated Skybridge Shortcut (Across Middle Waypoints)
    if (this.waypoints.length > 8) {
      const p1 = this.waypoints[3] || this.waypoints[2];
      const p2 = this.waypoints[6] || this.waypoints[5];
      
      const bridgeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(p1.x, 0.4, p1.z),
        new THREE.Vector3((p1.x + p2.x) * 0.5 + 15, 9.5, (p1.z + p2.z) * 0.5),
        new THREE.Vector3(p2.x, 0.4, p2.z)
      ]);

      const bridgePoints = bridgeCurve.getPoints(40);
      const bridgeGeo = new THREE.BufferGeometry();
      const bPositions = [];
      const bNormals = [];
      const bUvs = [];
      const bHalfW = 7.0;

      for (let i = 0; i <= 40; i++) {
        const pt = bridgePoints[i % 40];
        const nextPt = bridgePoints[Math.min(39, i + 1)];
        const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
        const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

        const leftPos = new THREE.Vector3().copy(pt).addScaledVector(right, -bHalfW);
        const rightPos = new THREE.Vector3().copy(pt).addScaledVector(right, bHalfW);

        bPositions.push(leftPos.x, leftPos.y, leftPos.z);
        bPositions.push(rightPos.x, rightPos.y, rightPos.z);

        bNormals.push(0, 1, 0, 0, 1, 0);
        bUvs.push(0, i / 40, 1, i / 40);
      }

      const bIndices = [];
      for (let i = 0; i < 40; i++) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        bIndices.push(row1, row1 + 1, row2);
        bIndices.push(row1 + 1, row2 + 1, row2);
      }

      bridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(bPositions, 3));
      bridgeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(bNormals, 3));
      bridgeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bUvs, 2));
      bridgeGeo.setIndex(bIndices);

      const bridgeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.2
      });

      const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
      this.scene.add(bridgeMesh);
      this.environmentMeshes.push(bridgeMesh);

      // Support Concrete Pillars
      [0.25, 0.5, 0.75].forEach(t => {
        const pillarPos = bridgeCurve.getPointAt(t);
        const pillarGeo = new THREE.CylinderGeometry(1.2, 1.6, pillarPos.y, 12);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(pillarPos.x, pillarPos.y / 2, pillarPos.z);
        this.scene.add(pillar);
        this.environmentMeshes.push(pillar);

        // Neon Light Ring around pillar
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.15, 8, 16), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(pillarPos.x, pillarPos.y * 0.75, pillarPos.z);
        this.scene.add(ring);
        this.environmentMeshes.push(ring);
      });

      // Airborne Shockwave Nitro Cylinder on Apex of Skybridge
      const apexPt = bridgeCurve.getPointAt(0.5);
      const apexGroup = new THREE.Group();
      const shockCan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 2.2, 16),
        new THREE.MeshStandardMaterial({ color: 0xd946ef, emissive: 0xd946ef, emissiveIntensity: 1.0, metalness: 0.95 })
      );
      const shockRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.1, 0.1, 8, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      shockRing.rotation.x = Math.PI / 2;
      apexGroup.add(shockCan, shockRing);
      apexGroup.position.set(apexPt.x, apexPt.y + 1.8, apexPt.z);
      this.scene.add(apexGroup);
      this.nitroPickups.push({
        mesh: apexGroup,
        type: 'shockwave_nitro',
        active: true,
        baseY: apexPt.y + 1.8
      });
    }
  }

  getDistanceToCenterline(pos) {
    if (!this.trackCurve) return 0;
    let minDistSq = Infinity;
    const numSamples = 120;
    for (let i = 0; i < numSamples; i++) {
      const p = this.trackCurve.getPointAt(i / numSamples);
      const dx = pos.x - p.x;
      const dz = pos.z - p.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
      }
    }
    return Math.sqrt(minDistSq);
  }

  update(time) {
    const pulse = 0.6 + 0.4 * Math.sin(time * 6);
    this.animatedChevrons.forEach(c => {
      c.material.opacity = pulse;
    });

    // Animate Collectibles rotation and bobbing
    this.nitroPickups.forEach(np => {
      if (np.active && np.mesh) {
        np.mesh.rotation.y += 0.04;
        np.mesh.position.y = np.baseY + Math.sin(time * 4) * 0.35;
      }
    });
  }
}
