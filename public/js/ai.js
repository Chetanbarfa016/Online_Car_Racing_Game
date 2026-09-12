// Smart Autonomous AI Racer Controller for Single Player Practice & Quick Play
class AICarController {
  constructor(game, car, botConfig = {}) {
    this.game = game;
    this.car = car;
    this.name = botConfig.name || 'AI Bot';
    this.baseSpeed = botConfig.baseSpeed || 170;
    this.maxSpeed = botConfig.maxSpeed || 230;
    this.aggressiveness = botConfig.aggressiveness || 0.85;
    this.skill = botConfig.skill || 0.9;
    this.targetOffset = (Math.random() - 0.5) * 6; // Lane variance

    this.currentWaypointIdx = 0;
    this.nitroTimer = 0;
    this.isNitroReady = true;
    this.recoveryTimer = 0;
    this.tumbleAngle = 0;
  }

  knockdown(impactVelocity) {
    if (this.car.isWrecked) return;
    this.car.isWrecked = true;
    this.car.speed = 0;
    this.recoveryTimer = 3.0; // 3 second knockdown duration
    this.tumbleAngle = 0;

    // Emit crash effects
    this.car.emitCrashSparks(this.car.position);
    this.car.createWreckFire();

    // Sound effect
    if (this.car.playCrashSound) {
      this.car.playCrashSound();
    }
  }

  update(delta) {
    if (!this.car || !this.game.track || !this.game.track.waypoints) return;

    // Handle Knockdown & Wreck Recovery
    if (this.car.isWrecked) {
      this.recoveryTimer -= delta;
      this.car.updateParticles(delta);

      // Tumble Spin Animation
      this.tumbleAngle += delta * 8;
      this.car.bodyGroup.rotation.z = Math.min(Math.PI, this.tumbleAngle);
      this.car.bodyGroup.rotation.x = Math.sin(this.tumbleAngle) * 0.4;
      this.car.position.y = 0.46 + Math.max(0, Math.sin(this.tumbleAngle * 0.5) * 1.5);
      this.car.mesh.position.copy(this.car.position);

      if (this.recoveryTimer <= 0) {
        // Respawn AI on track
        this.car.repair();
        this.car.bodyGroup.rotation.set(0, 0, 0);
        this.car.position.y = 0.46;
        const targetWp = this.game.track.waypoints[this.currentWaypointIdx] || this.game.track.waypoints[0];
        const nextWp = this.game.track.waypoints[(this.currentWaypointIdx + 1) % this.game.track.waypoints.length];
        const tangent = new THREE.Vector3().subVectors(nextWp, targetWp).normalize();
        this.resetToTrack(targetWp, Math.atan2(tangent.x, tangent.z));
      }
      return;
    }

    const waypoints = this.game.track.waypoints;
    const carPos = this.car.position;

    // Find next waypoint target
    const targetWp = waypoints[this.currentWaypointIdx];
    if (!targetWp) return;

    // Calculate distance to current target waypoint
    const targetWithOffset = new THREE.Vector3(
      targetWp.x + this.targetOffset,
      targetWp.y,
      targetWp.z
    );

    const dx = targetWithOffset.x - carPos.x;
    const dz = targetWithOffset.z - carPos.z;
    const distToTarget = Math.sqrt(dx * dx + dz * dz);

    // Switch to next waypoint when close
    if (distToTarget < 28) {
      this.currentWaypointIdx = (this.currentWaypointIdx + 1) % waypoints.length;
      this.targetOffset = (Math.random() - 0.5) * 8; // Change lane dynamically
    }

    // Desired heading angle
    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - this.car.rotation.y;

    // Normalize angle difference to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Calculate steering input
    const steerInput = Math.max(-1, Math.min(1, angleDiff * 2.8 * this.skill));

    // Dynamic speed adjustment based on sharp turns
    const isSharpTurn = Math.abs(angleDiff) > 0.45;
    const targetSpeed = isSharpTurn ? (this.baseSpeed * 0.72) : this.maxSpeed;

    // Throttle & Brake logic
    let gas = true;
    let brake = false;
    if (this.car.speed > targetSpeed) {
      gas = false;
      brake = isSharpTurn;
    }

    // AI Nitro logic on straight roads
    let nitro = false;
    if (!isSharpTurn && Math.abs(angleDiff) < 0.15 && this.car.nitroAmount > 30) {
      nitro = true;
    }

    // AI Drift on sharp corners
    let drift = isSharpTurn && this.car.speed > 110;

    // Construct input state for Car physics engine
    const aiInput = {
      gas: gas,
      brake: brake,
      left: steerInput < -0.1,
      right: steerInput > 0.1,
      nitro: nitro,
      drift: drift,
      steerAmount: steerInput
    };

    // Update the physical car instance
    this.car.update(delta, aiInput);

    // Track AI Checkpoint & Lap Progress
    this.checkLapProgress();
  }

  checkLapProgress() {
    if (!this.game.track || !this.game.track.checkpoints) return;
    const checkpoints = this.game.track.checkpoints;
    const nextCpIdx = (this.car.currentCheckpoint + 1) % checkpoints.length;
    const nextCp = checkpoints[nextCpIdx];
    if (!nextCp) return;

    const dist = this.car.position.distanceTo(nextCp.position);
    if (dist < nextCp.radius + 6) {
      this.car.currentCheckpoint = nextCpIdx;
      if (nextCpIdx === 0) {
        this.car.currentLap++;
      }
    }
  }

  resetToTrack(position, forwardAngle) {
    if (this.car) {
      this.car.position.copy(position);
      this.car.rotation.y = forwardAngle;
      this.car.speed = 0;
      this.car.velocity.set(0, 0, 0);
      this.car.mesh.position.copy(position);
      this.car.mesh.rotation.set(0, forwardAngle, 0);
    }
  }
}
