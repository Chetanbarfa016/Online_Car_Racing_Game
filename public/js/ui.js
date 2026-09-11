// User Interface, HUD, Speedometer, Minimap Radar & Podium Handler
class UIController {
  constructor(game) {
    this.game = game;
    this.selectedColor = '#ff2a5f';
    this.selectedModel = 'supercar';
    this.selectedTrack = 'neon_city';
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.initEventListeners();
  }

  initEventListeners() {
    // 0. Player Name Input Listener
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const name = e.target.value.trim() || 'Racer_1';
        if (this.game.localCar) {
          this.game.localCar.setPlayerName(name);
        }
        const hudName = document.getElementById('hud-player-name');
        if (hudName) hudName.innerText = name;
      });
    }

    // 1. Car Color Picker (12 Colors)
    const colorDots = document.querySelectorAll('.color-dot');
    colorDots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.selectedColor = dot.getAttribute('data-color');
        if (this.game.localCar) {
          this.game.localCar.setColor(this.selectedColor);
        }
      });
    });

    // 1b. Car Model Selector & Dynamic Stats
    const modelBtns = document.querySelectorAll('.model-btn');
    modelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedModel = btn.getAttribute('data-model');
        
        if (this.game.localCar) {
          this.game.localCar.setModel(this.selectedModel);
          this.game.localCar.setColor(this.selectedColor);
        }

        // Update Stat Bars
        const stats = {
          supercar: { speed: '85%', accel: '80%', drift: '90%' },
          muscle: { speed: '80%', accel: '92%', drift: '96%' },
          formula1: { speed: '98%', accel: '96%', drift: '78%' },
          cybertruck: { speed: '75%', accel: '78%', drift: '95%' }
        }[this.selectedModel];

        if (stats) {
          document.getElementById('stat-speed').style.width = stats.speed;
          document.getElementById('stat-accel').style.width = stats.accel;
          document.getElementById('stat-drift').style.width = stats.drift;
        }
      });
    });

    // 1c. Track / Map Selector
    const trackCards = document.querySelectorAll('.track-card');
    trackCards.forEach(card => {
      card.addEventListener('click', () => {
        trackCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedTrack = card.getAttribute('data-track');
        
        // Live update track in 3D scene
        if (this.game.track) {
          this.game.track.init(this.selectedTrack);
          if (this.game.localCar) {
            this.game.localCar.position.set(0, 0.46, 0);
            this.game.localCar.mesh.position.copy(this.game.localCar.position);
          }
        }
        this.showToast(`🗺️ Loaded Map: ${card.querySelector('.track-name').innerText}`);
      });
    });

    // 2. Mode Selector (Hotspot vs Online)
    const hotspotBtn = document.getElementById('mode-hotspot-btn');
    const onlineBtn = document.getElementById('mode-online-btn');
    const hotspotSection = document.getElementById('hotspot-mode-section');
    const onlineSection = document.getElementById('online-mode-section');

    if (hotspotBtn && onlineBtn) {
      hotspotBtn.addEventListener('click', () => {
        hotspotBtn.classList.add('active');
        onlineBtn.classList.remove('active');
        hotspotSection.classList.add('active');
        onlineSection.classList.remove('active');
      });

      onlineBtn.addEventListener('click', () => {
        onlineBtn.classList.add('active');
        hotspotBtn.classList.remove('active');
        onlineSection.classList.add('active');
        hotspotSection.classList.remove('active');
      });
    }

    // 3. Hotspot Host Game Button
    const btnHotspotHost = document.getElementById('btn-hotspot-host');
    if (btnHotspotHost) {
      btnHotspotHost.addEventListener('click', () => {
        const name = document.getElementById('player-name-input').value.trim() || 'Host Racer';
        this.game.network.createRoom(name, this.selectedColor, this.selectedModel);
      });
    }

    // 4. Hotspot Join Host Button
    const btnHotspotJoin = document.getElementById('btn-hotspot-join');
    if (btnHotspotJoin) {
      btnHotspotJoin.addEventListener('click', () => {
        const ipInput = document.getElementById('hotspot-ip-input').value.trim() || '192.168.43.1';
        const name = document.getElementById('player-name-input').value.trim() || 'Guest Racer';
        
        let targetUrl = ipInput;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = `http://${targetUrl}:3000`;
        }

        this.showToast(`Connecting to Hotspot Host at ${targetUrl}...`);
        this.game.network.connectToServer(targetUrl);
        setTimeout(() => {
          this.game.network.quickMatch(name, this.selectedColor, this.selectedModel);
        }, 800);
      });
    }

    // 5. Create Room Button (Online Mode)
    document.getElementById('btn-create-room').addEventListener('click', () => {
      const name = document.getElementById('player-name-input').value.trim() || 'Racer';
      this.game.network.createRoom(name, this.selectedColor, this.selectedModel);
    });

    // 6. Join Room Button
    document.getElementById('btn-join-room').addEventListener('click', () => {
      const code = document.getElementById('room-code-input').value.trim().toUpperCase();
      const name = document.getElementById('player-name-input').value.trim() || 'Racer';
      if (!code) {
        this.showToast('Please enter a 4-letter Room Code!');
        return;
      }
      this.game.network.joinRoom(code, name, this.selectedColor, this.selectedModel);
    });

    // 7. Quick Match Button
    document.getElementById('btn-quick-match').addEventListener('click', () => {
      const name = document.getElementById('player-name-input').value.trim() || 'Racer';
      this.game.network.quickMatch(name, this.selectedColor, this.selectedModel);
    });

    // 8. Copy Room Code Button
    document.getElementById('btn-copy-code').addEventListener('click', () => {
      const code = document.getElementById('display-room-code').innerText;
      navigator.clipboard.writeText(code);
      this.showToast(`📋 Room Code ${code} copied to clipboard!`);
    });

    // 9. Start Race Button (Host only)
    document.getElementById('btn-start-race').addEventListener('click', () => {
      this.game.network.startRace();
    });

    // 7. Leave Room Button
    document.getElementById('btn-leave-room').addEventListener('click', () => {
      window.location.reload();
    });

    // 8. Back to Lobby from Podium
    document.getElementById('btn-back-lobby').addEventListener('click', () => {
      window.location.reload();
    });

    // 9. Camera Switch Button
    document.getElementById('btn-cam-switch').addEventListener('click', () => {
      this.game.toggleCameraView();
    });

    // 10. Reset Car Button
    document.getElementById('btn-car-reset').addEventListener('click', () => {
      this.game.resetLocalCar();
    });
  }

  showRoomLobby(roomId, roomData, isHost) {
    document.getElementById('menu-overlay').classList.remove('active');
    document.getElementById('room-lobby-overlay').classList.add('active');
    document.getElementById('display-room-code').innerText = roomId;

    this.updatePlayerCards(roomData.players, isHost);
  }

  updatePlayerCards(players, isHost) {
    const container = document.getElementById('players-list-grid');
    container.innerHTML = '';

    players.forEach(p => {
      const card = document.createElement('div');
      card.className = 'player-card';
      card.innerHTML = `
        <div class="player-color-badge" style="background:${p.color};"></div>
        <div class="player-card-info">
          <span class="player-card-name">${p.name}</span>
          ${p.isHost ? '<span class="host-badge">HOST</span>' : ''}
        </div>
      `;
      container.appendChild(card);
    });

    const startBtn = document.getElementById('btn-start-race');
    const waitText = document.getElementById('waiting-for-host');

    if (isHost) {
      startBtn.style.display = 'block';
      waitText.style.display = 'none';
    } else {
      startBtn.style.display = 'none';
      waitText.style.display = 'block';
    }
  }

  showGameHUD() {
    document.getElementById('menu-overlay').classList.remove('active');
    document.getElementById('room-lobby-overlay').classList.remove('active');
    document.getElementById('game-hud').style.display = 'block';
  }

  updateHUD(car, timeElapsed, totalPlayers) {
    // Speedometer
    const speedEl = document.getElementById('hud-speed-value');
    if (speedEl) {
      speedEl.innerText = Math.abs(Math.round(car.speed));
    }

    // Gear Indicator
    const gearEl = document.getElementById('hud-gear-value');
    if (gearEl) {
      gearEl.innerText = car.speed < -1 ? 'R' : (car.currentGear || 1);
    }

    // RPM Bar
    const rpmBar = document.getElementById('rpm-bar-fill');
    if (rpmBar) {
      const rpmPct = Math.min(100, Math.max(10, ((car.rpm || 1000) / 8500) * 100));
      rpmBar.style.width = `${rpmPct}%`;
      // High-rev redline color
      if (rpmPct > 80) {
        rpmBar.style.background = 'linear-gradient(90deg, #ffea00, #ff0033)';
      } else {
        rpmBar.style.background = 'linear-gradient(90deg, #00e5ff, #00e676)';
      }
    }

    // Nitro Bar
    const nitroBar = document.getElementById('nitro-bar-fill');
    if (nitroBar) {
      const pct = (car.nitroAmount / car.nitroMax) * 100;
      nitroBar.style.width = `${pct}%`;
    }

    // Lap
    const lapEl = document.getElementById('hud-lap-text');
    if (lapEl) {
      lapEl.innerText = `${Math.min(car.currentLap, 3)}/3`;
    }

    // Timer
    const timerEl = document.getElementById('hud-timer-text');
    if (timerEl && timeElapsed >= 0) {
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = Math.floor(timeElapsed % 60);
      const ms = Math.floor((timeElapsed * 10) % 10);
      timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
    }

    // Render Minimap Radar
    this.renderMinimap(car);
  }

  renderMinimap(localCar) {
    if (!this.minimapCtx || !this.game.track) return;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Track center offset and scale
    const scale = 0.32;
    const offsetX = w / 2;
    const offsetY = h / 2 - 10;

    // Draw Track Path
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();

    const points = this.game.track.waypoints;
    for (let i = 0; i < points.length; i++) {
      const px = offsetX + points[i].x * scale;
      const py = offsetY + points[i].z * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw Remote Players Dots
    this.game.network.remotePlayers.forEach((rcar) => {
      const rx = offsetX + rcar.mesh.position.x * scale;
      const ry = offsetY + rcar.mesh.position.z * scale;
      ctx.fillStyle = rcar.color || '#ffea00';
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Local Player Dot (White Glowing)
    if (localCar) {
      const lx = offsetX + localCar.mesh.position.x * scale;
      const ly = offsetY + localCar.mesh.position.z * scale;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  updateRankings(rank, total) {
    const rankEl = document.getElementById('hud-rank-text');
    if (rankEl) {
      rankEl.innerHTML = `${rank}<small>/${total}</small>`;
    }
  }

  showCountdown(number) {
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-number');
    overlay.style.display = 'block';

    if (number === 0) {
      numEl.innerText = 'GO!';
      numEl.style.color = '#00e676';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 800);
    } else {
      numEl.innerText = number;
      numEl.style.color = '#ffea00';
    }
  }

  showPodium(winners) {
    const overlay = document.getElementById('podium-overlay');
    const list = document.getElementById('podium-winners-list');
    list.innerHTML = '';

    winners.forEach((w, idx) => {
      const card = document.createElement('div');
      card.className = `winner-card ${idx === 0 ? 'rank-1' : ''}`;
      const medal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `${idx + 1}th`;
      card.innerHTML = `
        <span class="winner-rank">${medal}</span>
        <span class="winner-name" style="color:${w.color};">${w.name}</span>
        <span class="winner-time">${w.time.toFixed(2)}s</span>
      `;
      list.appendChild(card);
    });

    overlay.style.display = 'flex';
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }
}
