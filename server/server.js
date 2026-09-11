const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const roomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Socket.io Real-Time Game Communication
io.on('connection', (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  // 1. Create Room
  socket.on('create_room', ({ playerName, carColor, carModel }) => {
    const room = roomManager.createRoom(socket.id, playerName, carColor, carModel);
    socket.join(room.id);
    console.log(`[Room Created] ID: ${room.id} by ${playerName} (${socket.id})`);
    socket.emit('room_created', {
      roomId: room.id,
      roomData: roomManager.serializeRoom(room)
    });
  });

  // 2. Join Room
  socket.on('join_room', ({ roomId, playerName, carColor, carModel }) => {
    const result = roomManager.joinRoom(roomId, socket.id, playerName, carColor, carModel);
    if (!result.success) {
      socket.emit('error_message', result.message);
      return;
    }

    socket.join(result.room.id);
    console.log(`[Player Joined] ${playerName} joined Room: ${result.room.id}`);
    
    // Notify the joining player
    socket.emit('room_joined', {
      roomId: result.room.id,
      roomData: roomManager.serializeRoom(result.room)
    });

    // Notify everyone in the room about updated player list
    io.to(result.room.id).emit('player_list_updated', roomManager.serializeRoom(result.room));
  });

  // 3. Quick Match
  socket.on('quick_match', ({ playerName, carColor, carModel }) => {
    // Find first available room in LOBBY state with open slots
    let targetRoom = null;
    for (const room of roomManager.rooms.values()) {
      if (room.state === 'LOBBY' && room.players.size < room.maxPlayers) {
        targetRoom = room;
        break;
      }
    }

    if (targetRoom) {
      const result = roomManager.joinRoom(targetRoom.id, socket.id, playerName, carColor, carModel);
      socket.join(result.room.id);
      socket.emit('room_joined', {
        roomId: result.room.id,
        roomData: roomManager.serializeRoom(result.room)
      });
      io.to(result.room.id).emit('player_list_updated', roomManager.serializeRoom(result.room));
    } else {
      // Create new room if none available
      const room = roomManager.createRoom(socket.id, playerName, carColor, carModel);
      socket.join(room.id);
      socket.emit('room_created', {
        roomId: room.id,
        roomData: roomManager.serializeRoom(room)
      });
    }
  });

  // 4. Update Player Customization (Color/Model/Ready)
  socket.on('update_customization', ({ color, carModel, ready }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.state !== 'LOBBY') return;

    const player = room.players.get(socket.id);
    if (player) {
      if (color) player.color = color;
      if (carModel) player.carModel = carModel;
      if (typeof ready === 'boolean') player.ready = ready;
      io.to(room.id).emit('player_list_updated', roomManager.serializeRoom(room));
    }
  });

  // 4b. Host Changes Selected Track / Map
  socket.on('change_track', ({ trackId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostId !== socket.id || room.state !== 'LOBBY') return;

    room.trackId = trackId;
    io.to(room.id).emit('track_changed', { trackId });
    io.to(room.id).emit('player_list_updated', roomManager.serializeRoom(room));
  });

  // 5. Host Starts Countdown & Race
  socket.on('start_race', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostId !== socket.id || room.state !== 'LOBBY') return;

    room.state = 'COUNTDOWN';
    room.winners = [];
    room.raceStartTime = Date.now() + 3500; // Countdown 3 seconds + GO buffer

    // Reset player race stats
    let slot = 0;
    for (const player of room.players.values()) {
      const spawn = roomManager.getSpawnPosition(slot);
      player.position = { x: spawn.x, y: 0.5, z: spawn.z };
      player.rotation = { x: 0, y: spawn.rotY, z: 0 };
      player.velocity = { x: 0, y: 0, z: 0 };
      player.speed = 0;
      player.currentLap = 1;
      player.checkpoint = 0;
      player.finished = false;
      player.finishTime = null;
      slot++;
    }

    io.to(room.id).emit('race_starting', {
      countdownSeconds: 3,
      roomData: roomManager.serializeRoom(room)
    });

    setTimeout(() => {
      if (roomManager.rooms.has(room.id)) {
        room.state = 'RACING';
        io.to(room.id).emit('race_started');
      }
    }, 3000);
  });

  // 6. High-Frequency Real-Time Car Transform Sync
  socket.on('player_update', (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.state !== 'RACING') return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Update server state
    player.position = data.pos;
    player.rotation = data.rot;
    player.speed = data.speed;
    player.steering = data.steering;
    player.drifting = data.drifting;
    player.boosting = data.boosting;
    player.currentLap = data.lap || player.currentLap;
    player.checkpoint = data.checkpoint || player.checkpoint;

    // Broadcast to other players in the same room
    socket.to(room.id).emit('remote_player_updated', {
      id: socket.id,
      pos: data.pos,
      rot: data.rot,
      speed: data.speed,
      steering: data.steering,
      drifting: data.drifting,
      boosting: data.boosting,
      lap: player.currentLap,
      checkpoint: player.checkpoint
    });
  });

  // 7. Checkpoint / Lap Passed
  socket.on('checkpoint_passed', ({ checkpoint, lap }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.state !== 'RACING') return;

    const player = room.players.get(socket.id);
    if (player) {
      player.checkpoint = checkpoint;
      player.currentLap = lap;

      io.to(room.id).emit('leaderboard_update', {
        players: Array.from(room.players.values()).map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          lap: p.currentLap,
          checkpoint: p.checkpoint,
          speed: p.speed,
          finished: p.finished
        }))
      });
    }
  });

  // 8. Player Finished Race
  socket.on('race_finished', ({ totalTime }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.state !== 'RACING') return;

    const player = room.players.get(socket.id);
    if (player && !player.finished) {
      player.finished = true;
      player.finishTime = totalTime;
      room.winners.push({
        rank: room.winners.length + 1,
        id: player.id,
        name: player.name,
        color: player.color,
        time: totalTime
      });

      console.log(`[Race Finish] ${player.name} finished #${room.winners.length} with time ${totalTime}s`);

      io.to(room.id).emit('player_finished', {
        winner: room.winners[room.winners.length - 1],
        winners: room.winners
      });

      // If all players finished
      const allFinished = Array.from(room.players.values()).every(p => p.finished);
      if (allFinished) {
        room.state = 'FINISHED';
        io.to(room.id).emit('race_completed', { winners: room.winners });
      }
    }
  });

  // 9. Play Again / Return to Lobby
  socket.on('return_to_lobby', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    if (room.hostId === socket.id) {
      room.state = 'LOBBY';
      room.winners = [];
      io.to(room.id).emit('lobby_reset', roomManager.serializeRoom(room));
    }
  });

  // 10. Disconnect
  socket.on('disconnect', () => {
    console.log(`[-] Player disconnected: ${socket.id}`);
    const leaveResult = roomManager.leaveRoom(socket.id);
    if (leaveResult && !leaveResult.empty && leaveResult.room) {
      io.to(leaveResult.roomId).emit('player_left', {
        id: socket.id,
        roomData: roomManager.serializeRoom(leaveResult.room)
      });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏎️ Online 3D Car Racing Server Running on Port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📲 Mobile Network: Open http://<YOUR_PC_IP>:${PORT}`);
  console.log(`====================================================`);
});
