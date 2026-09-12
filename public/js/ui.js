// User Interface, HUD, Speedometer, Lifeline Hearts, Damage VFX & Ad Coordinator
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
    const colorSwatches = document.querySelectorAll('.color-swatch, .color-dot');
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.selectedColor = swatch.getAttribute('data-color');
        if (this.game.localCar) {
          this.game.localCar.setColor(this.selectedColor);
        }
      });
    });

    // 1b. Car Model Selector & Dynamic Stats
    const modelCards = document.querySelectorAll('.model-card, .model-btn');
    modelCards.forEach(card => {
      card.addEventListener('click', () => {
        modelCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedModel = card.getAttribute('data-model');
        
        if (this.game.localCar) {
          this.game.localCar.setModel(this.selectedModel);
          this.game.localCar.setColor(this.selectedColor);
        }

        const stats = {
          supercar: { speed: '88%', accel: '85%', drift: '93%', speedVal: '255 KM/H', accelVal: '0-100 in 2.6s', driftVal: '9.3 / 10' },
          hypercar: { speed: '94%', accel: '92%', drift: '92%', speedVal: '268 KM/H', accelVal: '0-100 in 2.2s', driftVal: '9.2 / 10' },
          formula1: { speed: '98%', accel: '98%', drift: '88%', speedVal: '275 KM/H', accelVal: '0-100 in 1.8s', driftVal: '8.8 / 10' },
          muscle: { speed: '84%', accel: '88%', drift: '96%', speedVal: '248 KM/H', accelVal: '0-100 in 2.7s', driftVal: '9.6 / 10' },
          speedster: { speed: '96%', accel: '95%', drift: '89%', speedVal: '270 KM/H', accelVal: '0-100 in 1.9s', driftVal: '8.9 / 10' }
        }[this.selectedModel] || { speed: '88%', accel: '85%', drift: '93%', speedVal: '255 KM/H', accelVal: '0-100 in 2.6s', driftVal: '9.3 / 10' };

        if (stats) {
          const sSpeed = document.getElementById('stat-speed');
          const sAccel = document.getElementById('stat-accel');
          const sDrift = document.getElementById('stat-drift');
          if (sSpeed) sSpeed.style.width = stats.speed;
          if (sAccel) sAccel.style.width = stats.accel;
          if (sDrift) sDrift.style.width = stats.drift;

          const vSpeed = document.getElementById('stat-val-speed');
          const vAccel = document.getElementById('stat-val-accel');
          const vDrift = document.getElementById('stat-val-drift');
          if (vSpeed) vSpeed.innerText = stats.speedVal;
          if (vAccel) vAccel.innerText = stats.accelVal;
          if (vDrift) vDrift.innerText = stats.driftVal;
        }
      });
    });

    // 1c. Track / Map Selector
    const trackRows = document.querySelectorAll('.track-row, .track-card');
    trackRows.forEach(row => {
      row.addEventListener('click', () => {
        trackRows.forEach(r => r.classList.remove('active'));
        row.classList.add('active');
        this.selectedTrack = row.getAttribute('data-track');
        
        if (this.game.track) {
          this.game.track.init(this.selectedTrack);
          if (this.game.localCar) {
            this.game.localCar.position.set(0, 0.46, 0);
            this.game.localCar.mesh.position.copy(this.game.localCar.position);
          }
        }
        const titleEl = row.querySelector('.t-title, .track-name');
        const title = titleEl ? titleEl.innerText : this.selectedTrack;
        this.showToast('🗺️ Loaded Map: ' + title);
      });
    });

    // 1d. Time of Day Selector (Day, Sunset, Night)
    const timeChips = document.querySelectorAll('.time-chip');
    timeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        timeChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const timeMode = chip.getAttribute('data-time') || 'night';
        if (this.game) {
          this.game.setTimeOfDay(timeMode);
        }
        const timeName = chip.querySelector('.time-name') ? chip.querySelector('.time-name').innerText : timeMode;
        this.showToast('✨ Lighting: ' + timeName + ' Mode Activated');
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
          targetUrl = 'http://' + targetUrl + ':3000';
        }

        this.showToast('Connecting to Hotspot Host at ' + targetUrl + '...');
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

    // 7. Quick Match Button (Single Player vs AI Bots or Quick Match)
    const btnQuickMatch = document.getElementById('btn-quick-match');
    if (btnQuickMatch) {
      btnQuickMatch.addEventListener('click', () => {
        const name = document.getElementById('player-name-input').value.trim() || 'Racer';
        this.showAdOverlay(() => {
          // If server is connected, quick match online, or launch Single Player AI race!
          if (this.game.network && this.game.network.isConnected) {
            this.game.network.quickMatch(name, this.selectedColor, this.selectedModel);
          } else {
            this.game.startSinglePlayerGame(true);
          }
        }, 'race_start');
      });
    }

    // 8. Copy Room Code Button
    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        const code = document.getElementById('display-room-code').innerText;
        navigator.clipboard.writeText(code);
        this.showToast('📋 Room Code ' + code + ' copied to clipboard!');
      });
    }

    // 9. Start Race Button (Host only)
    const btnStartRace = document.getElementById('btn-start-race');
    if (btnStartRace) {
      btnStartRace.addEventListener('click', () => {
        this.showAdOverlay(() => {
          this.game.network.startRace();
        }, 'race_start');
      });
    }

    // 10. Leave Room Button
    const btnLeaveRoom = document.getElementById('btn-leave-room');
    if (btnLeaveRoom) {
      btnLeaveRoom.addEventListener('click', () => {
        window.location.reload();
      });
    }

    // 11. Back to Lobby from Podium
    const btnBackLobby = document.getElementById('btn-back-lobby');
    if (btnBackLobby) {
      btnBackLobby.addEventListener('click', () => {
        this.showAdOverlay(() => {
          window.location.reload();
        }, 'race_finished');
      });
    }

    // 12. Camera Switch Button
    document.getElementById('btn-cam-switch').addEventListener('click', () => {
      this.game.toggleCameraView();
    });

    // 13. Reset Car Button
    document.getElementById('btn-car-reset').addEventListener('click', () => {
      this.game.resetLocalCar();
    });

    // 14. Wrecked Modal Buttons (Respawn, Watch Ad, Showroom)
    const btnRespawn = document.getElementById('btn-respawn-repair');
    if (btnRespawn) {
      btnRespawn.addEventListener('click', () => {
        document.getElementById('wrecked-overlay').style.display = 'none';
        if (this.game.localCar) {
          this.game.localCar.repair();
          this.game.resetLocalCar();
          this.updateLifelines(this.game.localCar.lives, this.game.localCar.maxLives);
          this.showToast('🔧 Car Repaired! 5/5 Health Restored!');
        }
      });
    }

    // Playgama Compliant Rewarded Ad: Free Respawn [AD]
    const btnWatchAdRespawn = document.getElementById('btn-watch-ad-respawn');
    if (btnWatchAdRespawn) {
      btnWatchAdRespawn.addEventListener('click', () => {
        this.showRewardedAd('free_respawn', () => {
          document.getElementById('wrecked-overlay').style.display = 'none';
          if (this.game.localCar) {
            this.game.localCar.repair();
            this.game.resetLocalCar();
            this.updateLifelines(this.game.localCar.lives, this.game.localCar.maxLives);
            this.showToast('✨ Rewarded! Free Full Repair Restored! [AD]');
          }
        });
      });
    }

    // Playgama Compliant Rewarded Ad: Free 100% Nitro Boost in Garage [AD]
    const btnGarageNitro = document.getElementById('btn-garage-bonus-nitro');
    if (btnGarageNitro) {
      btnGarageNitro.addEventListener('click', () => {
        this.showRewardedAd('bonus_nitro', () => {
          if (this.game.localCar) {
            this.game.localCar.nitroAmount = 100;
          }
          this.showToast('🚀 REWARDED! +100% NITRO BOOST ACTIVATED FOR RACE! [AD]');
        });
      });
    }

    const btnTopNitro = document.getElementById('btn-top-reward-nitro');
    if (btnTopNitro) {
      btnTopNitro.addEventListener('click', () => {
        this.showRewardedAd('bonus_nitro', () => {
          if (this.game.localCar) {
            this.game.localCar.nitroAmount = 100;
          }
          this.showToast('🚀 REWARDED! +100% NITRO BOOST ACTIVATED FOR RACE! [AD]');
        });
      });
    }

    // Check platform rewarded support and update visibility
    this.updateRewardedAdSupportUI();

    const btnWreckGarage = document.getElementById('btn-wreck-garage');
    if (btnWreckGarage) {
      btnWreckGarage.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }

  // Update Lifeline / Armor Hearts (❤️❤️❤️❤️❤️)
  updateLifelines(lives, maxLives = 5) {
    const container = document.getElementById('hud-lifelines');
    if (!container) return;

    const hearts = container.querySelectorAll('.heart-icon');
    hearts.forEach((h, idx) => {
      if (idx < lives) {
        h.classList.remove('lost');
        h.classList.add('active');
      } else {
        h.classList.remove('active');
        h.classList.add('lost');
      }
    });
  }

  // Screen Damage Glitch Flash Effect
  flashDamageEffect() {
    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.add('active');
      setTimeout(() => {
        vignette.classList.remove('active');
      }, 250);
    }
  }

  showWreckedOverlay() {
    const overlay = document.getElementById('wrecked-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
    }
  }

  // Update UI based on platform support for Rewarded Ads
  updateRewardedAdSupportUI() {
    if (window.bridge && bridge.advertisement && bridge.advertisement.isRewardedSupported === false) {
      document.querySelectorAll('.btn-reward-ad').forEach(btn => {
        btn.style.display = 'none';
      });
    } else {
      document.querySelectorAll('.btn-reward-ad').forEach(btn => {
        btn.style.display = 'flex';
      });
    }
  }

  // Playgama Official Rewarded Ad Integration (Strict State Validation for Early Close & Completion Tests)
  showRewardedAd(placement = 'bonus_nitro', onRewardSuccess) {
    if (window.bridge && bridge.advertisement && typeof bridge.advertisement.showRewarded === 'function') {
      let hasRewarded = false;

      // Playgama Rule: Reward player ONLY when state is 'rewarded'
      const onStateChanged = (state) => {
        console.log('[Playgama] Rewarded State Changed:', state);
        if (state === 'rewarded') {
          hasRewarded = true;
        } else if (state === 'closed') {
          if (bridge.advertisement.off && bridge.EVENT_NAME && bridge.EVENT_NAME.REWARDED_STATE_CHANGED) {
            bridge.advertisement.off(bridge.EVENT_NAME.REWARDED_STATE_CHANGED, onStateChanged);
          }
          if (hasRewarded) {
            console.log('[Playgama] Rewarded full completion: granting reward');
            if (onRewardSuccess) onRewardSuccess();
          } else {
            console.log('[Playgama] Rewarded early close: NO reward granted');
            this.showToast('⚠️ Ad closed early. No reward granted.');
          }
        } else if (state === 'failed') {
          if (bridge.advertisement.off && bridge.EVENT_NAME && bridge.EVENT_NAME.REWARDED_STATE_CHANGED) {
            bridge.advertisement.off(bridge.EVENT_NAME.REWARDED_STATE_CHANGED, onStateChanged);
          }
          console.warn('[Playgama] Rewarded ad failed or unavailable');
          this.showToast('⚠️ Ad is temporarily unavailable.');
        }
      };

      if (bridge.advertisement.on && bridge.EVENT_NAME && bridge.EVENT_NAME.REWARDED_STATE_CHANGED) {
        bridge.advertisement.on(bridge.EVENT_NAME.REWARDED_STATE_CHANGED, onStateChanged);
      }

      try {
        bridge.advertisement.showRewarded(placement);
      } catch (err) {
        console.error('[Playgama] Error calling showRewarded:', err);
      }
      return;
    }

    // Fallback: Local / Standalone Rewarded Ad Simulation (Enforcing Full Watch)
    this.showCustomRewardedSimulator(onRewardSuccess);
  }

  showCustomRewardedSimulator(onRewardSuccess) {
    const adOverlay = document.getElementById('ad-overlay');
    const timerEl = document.getElementById('ad-countdown');
    const skipBtn = document.getElementById('btn-skip-ad');
    const brandTitle = document.getElementById('ad-brand-title');
    const brandDesc = document.getElementById('ad-brand-desc');
    const ctaLink = document.getElementById('ad-cta-link');

    if (!adOverlay) {
      if (onRewardSuccess) onRewardSuccess();
      return;
    }

    if (brandTitle) brandTitle.innerText = 'REWARDED VIDEO AD [AD]';
    if (brandDesc) brandDesc.innerText = 'Watch the full video to claim your in-game reward!';
    if (ctaLink) {
      ctaLink.innerText = 'CLAIM REWARD';
      ctaLink.href = '#';
    }

    adOverlay.style.display = 'flex';
    if (skipBtn) skipBtn.style.display = 'none';

    let timeLeft = 5;
    if (timerEl) timerEl.innerText = 'Reward in ' + timeLeft + 's (Do not close)';

    const interval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(interval);
        if (timerEl) timerEl.innerText = '✅ Reward Unlocked! Click Finish to Claim';
        if (skipBtn) {
          skipBtn.style.display = 'inline-block';
          skipBtn.innerText = 'CLAIM REWARD ✅';
          skipBtn.onclick = () => {
            adOverlay.style.display = 'none';
            skipBtn.onclick = null;
            if (onRewardSuccess) onRewardSuccess();
          };
        }
      } else {
        if (timerEl) timerEl.innerText = 'Reward in ' + timeLeft + 's';
      }
    }, 1000);
  }

  // Interstitial Ad Management (Playgama Bridge + Google Ads / Sponsor Simulation)
  showAdOverlay(callback, placement = 'race_start') {
    // 1. Check Playgama Bridge Official Ad first
    if (window.bridge && bridge.advertisement && typeof bridge.advertisement.showInterstitial === 'function') {
      let completed = false;
      const finish = () => {
        if (!completed) {
          completed = true;
          if (bridge.advertisement.off && bridge.EVENT_NAME && bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED) {
            bridge.advertisement.off(bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onStateChanged);
          }
          if (callback) callback();
        }
      };

      const onStateChanged = (state) => {
        if (state === 'closed' || state === 'failed') {
          finish();
        }
      };

      if (bridge.advertisement.on && bridge.EVENT_NAME && bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED) {
        bridge.advertisement.on(bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onStateChanged);
      }

      try {
        const adPromise = bridge.advertisement.showInterstitial(placement);
        if (adPromise && typeof adPromise.then === 'function') {
          adPromise
            .then(() => {
              finish();
            })
            .catch(() => {
              if (!completed) {
                if (bridge.advertisement.off && bridge.EVENT_NAME && bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED) {
                  bridge.advertisement.off(bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, onStateChanged);
                }
                this.showCustomAdModal(callback, placement);
              }
            });
        }
      } catch (e) {
        this.showCustomAdModal(callback, placement);
      }

      // Safety timeout: Ensure game continues even if bridge freezes
      setTimeout(() => {
        if (!completed) {
          finish();
        }
      }, 12000);
      return;
    }

    // 2. Otherwise Show High-Converting Monetization Ad Modal
    this.showCustomAdModal(callback, placement);
  }

  showCustomAdModal(callback, placement = 'race_start') {
    const adOverlay = document.getElementById('ad-overlay');
    const timerEl = document.getElementById('ad-countdown');
    const skipBtn = document.getElementById('btn-skip-ad');
    const brandTitle = document.getElementById('ad-brand-title');
    const brandDesc = document.getElementById('ad-brand-desc');
    const ctaLink = document.getElementById('ad-cta-link');

    if (!adOverlay) {
      if (callback) callback();
      return;
    }

    // Dynamic high-paying gaming sponsor rotation
    const sponsors = [
      {
        title: 'TURBO RACER PRO: NITRO PASS',
        desc: 'Unlock 50+ Custom Supercars, Rare Paint Decals & Maximum Boost!',
        cta: '🚀 PLAY / INSTALL NOW',
        url: 'https://playgama.com'
      },
      {
        title: 'CYBER DRIFT ARENA 3D',
        desc: 'Compete in live PvP street tournaments and win rare supercar blueprints!',
        cta: '⚡ PLAY NOW FREE',
        url: 'https://playgama.com'
      },
      {
        title: 'HYPER FORMULA RACING 2026',
        desc: 'Official Next-Gen Formula Aero Simulation with Ultra Realistic Physics!',
        cta: '🏎️ JOIN CHAMPIONSHIP',
        url: 'https://playgama.com'
      }
    ];

    const currentSponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
    if (brandTitle) brandTitle.innerText = currentSponsor.title;
    if (brandDesc) brandDesc.innerText = currentSponsor.desc;
    if (ctaLink) {
      ctaLink.innerText = currentSponsor.cta;
      ctaLink.href = currentSponsor.url;
    }

    adOverlay.style.display = 'flex';
    if (skipBtn) skipBtn.style.display = 'none';

    const isPreRace = (placement === 'race_start');
    let timeLeft = 4;
    if (timerEl) timerEl.innerText = isPreRace ? 'Race starting in ' + timeLeft + 's' : 'Ad closes in ' + timeLeft + 's';

    const interval = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(interval);
        if (timerEl) timerEl.innerText = isPreRace ? '🚦 READY TO RACE!' : 'Ready to Continue';
        if (skipBtn) {
          skipBtn.style.display = 'inline-block';
          skipBtn.innerText = isPreRace ? 'START RACE 🏎️' : 'CONTINUE ⏭️';
          skipBtn.onclick = () => {
            adOverlay.style.display = 'none';
            skipBtn.onclick = null;
            if (callback) callback();
          };
        }
      } else {
        if (timerEl) timerEl.innerText = isPreRace ? 'Race starting in ' + timeLeft + 's' : 'Ad closes in ' + timeLeft + 's';
      }
    }, 1000);
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
      card.innerHTML = '<div class="player-color-badge" style="background:' + p.color + ';"></div><div class="player-card-info"><span class="player-card-name">' + p.name + '</span>' + (p.isHost ? '<span class="host-badge">HOST</span>' : '') + '</div>';
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
    const speedEl = document.getElementById('hud-speed-value');
    if (speedEl) {
      speedEl.innerText = Math.abs(Math.round(car.speed));
    }

    const gearEl = document.getElementById('hud-gear-value');
    if (gearEl) {
      gearEl.innerText = car.speed < -1 ? 'R' : (car.currentGear || 1);
    }

    const rpmBar = document.getElementById('rpm-bar-fill');
    if (rpmBar) {
      const rpmPct = Math.min(100, Math.max(10, ((car.rpm || 1000) / 8500) * 100));
      rpmBar.style.width = rpmPct + '%';
      if (rpmPct > 80) {
        rpmBar.style.background = 'linear-gradient(90deg, #ffea00, #ff0033)';
      } else {
        rpmBar.style.background = 'linear-gradient(90deg, #00e5ff, #00e676)';
      }
    }

    const nitroBar = document.getElementById('nitro-bar-fill');
    if (nitroBar) {
      const pct = (car.nitroAmount / car.nitroMax) * 100;
      nitroBar.style.width = pct + '%';
      if (car.isShockwave) {
        nitroBar.style.background = 'linear-gradient(90deg, #ec4899, #d946ef, #ffffff)';
        nitroBar.style.boxShadow = '0 0 15px #d946ef';
      } else if (car.nitroStage === 2) {
        nitroBar.style.background = 'linear-gradient(90deg, #00e5ff, #38bdf8, #ffffff)';
        nitroBar.style.boxShadow = '0 0 12px #00e5ff';
      } else {
        nitroBar.style.background = 'linear-gradient(90deg, #ff9800, #ffea00)';
        nitroBar.style.boxShadow = '0 0 8px #ffea00';
      }
    }

    const lapEl = document.getElementById('hud-lap-text');
    if (lapEl) {
      lapEl.innerText = Math.min(car.currentLap, 3) + '/3';
    }

    const timerEl = document.getElementById('hud-timer-text');
    if (timerEl && timeElapsed >= 0) {
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = Math.floor(timeElapsed % 60);
      const ms = Math.floor((timeElapsed * 10) % 10);
      timerEl.innerText = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + ms;
    }

    this.renderMinimap(car);
  }

  renderMinimap(localCar) {
    if (!this.minimapCtx || !this.game.track) return;

    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const scale = 0.32;
    const offsetX = w / 2;
    const offsetY = h / 2 - 10;

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

    // AI Bots Dots (Yellow / Blue)
    this.game.aiBots.forEach(bot => {
      if (bot.car && bot.car.mesh) {
        const bx = offsetX + bot.car.mesh.position.x * scale;
        const by = offsetY + bot.car.mesh.position.z * scale;
        ctx.fillStyle = bot.car.color || '#ffea00';
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Remote Players Dots
    this.game.network.remotePlayers.forEach((rcar) => {
      const rx = offsetX + rcar.mesh.position.x * scale;
      const ry = offsetY + rcar.mesh.position.z * scale;
      ctx.fillStyle = rcar.color || '#ffea00';
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Local Player Dot
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
      rankEl.innerHTML = rank + '<small>/' + total + '</small>';
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

  // Enhanced Winner Podium Screen with 1st, 2nd, 3rd, 4th Positions & Lap Times
  showPodiumScreen(allRacers) {
    const overlay = document.getElementById('podium-overlay');
    const list = document.getElementById('podium-winners-list');
    list.innerHTML = '';

    const medals = ['🥇 1ST', '🥈 2ND', '🥉 3RD', '4TH'];

    allRacers.forEach((r, idx) => {
      const card = document.createElement('div');
      card.className = 'winner-card rank-' + (idx + 1);
      const medalText = medals[idx] || (idx + 1) + 'TH';
      card.innerHTML = '<span class="w-rank-badge">' + medalText + '</span><div class="w-details"><span class="w-name" style="color:' + (r.color || '#fff') + ';">' + r.name + '</span><span class="w-model">' + (r.model || 'supercar').toUpperCase() + ' MACHINE</span></div><span class="w-time">' + r.time + '</span>';
      list.appendChild(card);
    });

    overlay.style.display = 'flex';
  }

  showStuntBadge(msg) {
    let stuntEl = document.getElementById('hud-stunt-banner');
    if (!stuntEl) {
      stuntEl = document.createElement('div');
      stuntEl.id = 'hud-stunt-banner';
      stuntEl.className = 'stunt-banner';
      document.body.appendChild(stuntEl);
    }
    stuntEl.innerText = msg;
    stuntEl.classList.add('active');
    setTimeout(() => {
      stuntEl.classList.remove('active');
    }, 1800);
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

// Global Automated Test Hooks for Playgama Moderation QA
window.showPlaygamaRewardedAd = (placement = 'bonus_nitro') => {
  if (window.game && window.game.ui) {
    window.game.ui.showRewardedAd(placement, () => {
      console.log('[Playgama QA] Rewarded callback triggered');
    });
  } else if (window.bridge && bridge.advertisement && bridge.advertisement.showRewarded) {
    bridge.advertisement.showRewarded(placement);
  }
};

window.showPlaygamaInterstitialAd = (placement = 'race_start') => {
  if (window.game && window.game.ui) {
    window.game.ui.showAdOverlay(() => {
      console.log('[Playgama QA] Interstitial callback triggered');
    }, placement);
  } else if (window.bridge && bridge.advertisement && bridge.advertisement.showInterstitial) {
    bridge.advertisement.showInterstitial(placement);
  }
};

