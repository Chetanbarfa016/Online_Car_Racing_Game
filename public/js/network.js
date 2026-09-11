// Network Client for Socket.io Real-time Multiplayer Racing (Online & Offline Hotspot)
class NetworkClient {
  constructor(game) {
    this.game = game;
    this.socket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.remotePlayers = new Map(); // socketId -> Car
    this.serverUrl = window.location.origin;

    this.connectToServer(this.serverUrl);
  }

  connectToServer(targetUrl) {
    if (this.socket) {
      this.socket.disconnect();
    }

    try {
      this.serverUrl = targetUrl;
      console.log(`[Socket] Connecting to server at: ${targetUrl}`);
      
      this.socket = io(targetUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 5000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('[Socket] Connected to server with ID:', this.socket.id);
        this.game.ui.showToast('✅ Connected to Game Host!');
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      // 1. Room Created
      this.socket.on('room_created', ({ roomId, roomData }) => {
        this.currentRoom = roomData;
        this.game.ui.showRoomLobby(roomId, roomData, true);
      });

      // 2. Room Joined
      this.socket.on('room_joined', ({ roomId, roomData }) => {
        const isHost = roomData.hostId === this.socket.id;
        this.currentRoom = roomData;
        this.game.ui.showRoomLobby(roomId, roomData, isHost);
      });

      // 3. Player List Updated
      this.socket.on('player_list_updated', (roomData) => {
        this.currentRoom = roomData;
        const isHost = roomData.hostId === this.socket.id;
        this.game.ui.updatePlayerCards(roomData.players, isHost);
      });

      // 4. Race Starting Countdown
      this.socket.on('race_starting', ({ countdownSeconds, roomData }) => {
        this.currentRoom = roomData;
        this.game.startCountdown(countdownSeconds, roomData);
      });

      // 5. Race Started (GO!)
      this.socket.on('race_started', () => {
        this.game.startRace();
      });

      // 6. Remote Player Real-Time Update
      this.socket.on('remote_player_updated', (data) => {
        const remoteCar = this.remotePlayers.get(data.id);
        if (remoteCar) {
          remoteCar.setRemoteTransform(data.pos, data.rot.y, data.speed, data.steering, data.boosting);
          remoteCar.currentLap = data.lap;
          remoteCar.currentCheckpoint = data.checkpoint;
        }
      });

      // 7. Player Finished
      this.socket.on('player_finished', ({ winner, winners }) => {
        this.game.ui.showToast(`🏁 ${winner.name} finished in ${winner.time.toFixed(1)}s!`);
      });

      // 8. Race Completed (All finished / Winner Podium)
      this.socket.on('race_completed', ({ winners }) => {
        this.game.ui.showPodium(winners);
      });

      // 9. Error Message
      this.socket.on('error_message', (msg) => {
        this.game.ui.showToast(`⚠️ ${msg}`);
      });

      // 10. Player Left
      this.socket.on('player_left', ({ id, roomData }) => {
        if (this.remotePlayers.has(id)) {
          const car = this.remotePlayers.get(id);
          this.game.scene.remove(car.mesh);
          this.remotePlayers.delete(id);
        }
        if (roomData) {
          const isHost = roomData.hostId === this.socket.id;
          this.game.ui.updatePlayerCards(roomData.players, isHost);
        }
      });

    } catch (err) {
      console.error('[Socket] Init failed:', err);
    }
  }

  createRoom(playerName, carColor) {
    if (!this.socket || !this.isConnected) {
      this.game.ui.showToast('⚠️ Connecting to server, please wait...');
      return;
    }
    this.socket.emit('create_room', { playerName, carColor });
  }

  joinRoom(roomId, playerName, carColor) {
    if (!this.socket || !this.isConnected) {
      this.game.ui.showToast('⚠️ Connecting to server, please wait...');
      return;
    }
    this.socket.emit('join_room', { roomId, playerName, carColor });
  }

  quickMatch(playerName, carColor) {
    if (!this.socket || !this.isConnected) {
      this.game.ui.showToast('⚠️ Connecting to server, please wait...');
      return;
    }
    this.socket.emit('quick_match', { playerName, carColor });
  }

  startRace() {
    if (!this.socket) return;
    this.socket.emit('start_race');
  }

  sendPlayerUpdate(pos, rot, speed, steering, isBoosting, isDrifting, lap, checkpoint) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit('player_update', {
      pos: { x: pos.x, y: pos.y, z: pos.z },
      rot: { x: rot.x, y: rot.y, z: rot.z },
      speed: speed,
      steering: steering,
      boosting: isBoosting,
      drifting: isDrifting,
      lap: lap,
      checkpoint: checkpoint
    });
  }

  sendCheckpointPassed(checkpoint, lap) {
    if (!this.socket) return;
    this.socket.emit('checkpoint_passed', { checkpoint, lap });
  }

  sendRaceFinished(totalTime) {
    if (!this.socket) return;
    this.socket.emit('race_finished', { totalTime });
  }
}
