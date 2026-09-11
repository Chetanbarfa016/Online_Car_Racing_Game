// Room Manager for Multiplayer Racing Game
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom(hostSocketId, playerName, carColor, carModel = 'speedster') {
    let roomId = this.generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomCode();
    }

    const room = {
      id: roomId,
      hostId: hostSocketId,
      state: 'LOBBY', // 'LOBBY', 'COUNTDOWN', 'RACING', 'FINISHED'
      maxPlayers: 8,
      totalLaps: 3,
      trackId: 'neon_city',
      countdownTime: 3,
      players: new Map(),
      winners: [],
      createdAt: Date.now()
    };

    const spawnPosition = this.getSpawnPosition(0);

    room.players.set(hostSocketId, {
      id: hostSocketId,
      name: playerName || 'Player 1',
      color: carColor || '#ff2a5f',
      carModel: carModel,
      isHost: true,
      ready: false,
      slot: 0,
      position: { x: spawnPosition.x, y: 0.5, z: spawnPosition.z },
      rotation: { x: 0, y: spawnPosition.rotY, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      speed: 0,
      steering: 0,
      drifting: false,
      boosting: false,
      currentLap: 1,
      checkpoint: 0,
      finished: false,
      finishTime: null
    });

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, socketId, playerName, carColor, carModel = 'speedster') {
    roomId = roomId.toUpperCase().trim();
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, message: 'Room not found! Check the room code.' };
    }

    if (room.state !== 'LOBBY') {
      return { success: false, message: 'Race already in progress in this room!' };
    }

    if (room.players.size >= room.maxPlayers) {
      return { success: false, message: 'Room is already full (Max 8 players)!' };
    }

    const slot = room.players.size;
    const spawnPosition = this.getSpawnPosition(slot);

    room.players.set(socketId, {
      id: socketId,
      name: playerName || `Player ${slot + 1}`,
      color: carColor || this.getRandomColor(slot),
      carModel: carModel,
      isHost: false,
      ready: false,
      slot: slot,
      position: { x: spawnPosition.x, y: 0.5, z: spawnPosition.z },
      rotation: { x: 0, y: spawnPosition.rotY, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      speed: 0,
      steering: 0,
      drifting: false,
      boosting: false,
      currentLap: 1,
      checkpoint: 0,
      finished: false,
      finishTime: null
    });

    return { success: true, room };
  }

  getSpawnPosition(slot) {
    // 2-column staggered grid on starting straight
    const row = Math.floor(slot / 2);
    const col = slot % 2;
    const sideOffset = (col === 0 ? -4 : 4);
    const backOffset = row * 10;
    
    // Starting line is around z = 0 on the straight track segment
    return {
      x: sideOffset,
      z: -15 - backOffset,
      rotY: 0
    };
  }

  getRandomColor(slot) {
    const colors = [
      '#ff2a5f', // Neon Red/Pink
      '#00e5ff', // Cyan / Neon Blue
      '#ffea00', // Yellow
      '#00e676', // Bright Green
      '#b388ff', // Purple
      '#ff9100', // Orange
      '#ffffff', // White
      '#2979ff'  // Royal Blue
    ];
    return colors[slot % colors.length];
  }

  leaveRoom(socketId) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.has(socketId)) {
        const isHost = room.players.get(socketId).isHost;
        room.players.delete(socketId);

        if (room.players.size === 0) {
          this.rooms.delete(roomId);
          return { roomId, empty: true };
        } else if (isHost) {
          // Assign next player as host
          const nextHostId = room.players.keys().next().value;
          room.players.get(nextHostId).isHost = true;
          room.hostId = nextHostId;
        }

        return { roomId, empty: false, room };
      }
    }
    return null;
  }

  getRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        return room;
      }
    }
    return null;
  }

  serializeRoom(room) {
    if (!room) return null;
    return {
      id: room.id,
      hostId: room.hostId,
      state: room.state,
      totalLaps: room.totalLaps,
      trackId: room.trackId,
      winners: room.winners,
      players: Array.from(room.players.values())
    };
  }
}

module.exports = new RoomManager();
