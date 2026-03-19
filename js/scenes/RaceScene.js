/*
 * このファイルの責務:
 * - 横スクロール 2D レースの進行、速度段階、スタミナ、順位、CPU AI を処理する。
 * 依存している config / module:
 * - gameConfig.js, courseConfig.js, raceConfig.js, characterFactory.js, formatters.js, terrainUtils.js。
 * 将来どこを拡張する想定か:
 * - 交代、スキル、障害物、観客演出、詳細リプレイの追加。
 */
import { GAME_CONFIG } from '../config/gameConfig.js';
import { getCourseById } from '../config/courseConfig.js';
import { AI_PROFILES, CPU_RUNNER_TEMPLATES, PLAYER_CONTROL_HINTS, RACE_UI_CONFIG, SPEED_TIERS, SPEED_TIER_ORDER } from '../config/raceConfig.js';
import { createRunner } from '../data/characterFactory.js';
import { formatDistance, formatGap, formatPercent, formatSeconds, getPlacementLabel } from '../utils/formatters.js';
import { getSegmentForDistance, getTerrainAffinityForSegment } from '../utils/terrainUtils.js';

class RaceScene {
  constructor(game) {
    this.game = game;
    this.uiRoot = game.uiRoot;
    this.course = null;
    this.runners = [];
    this.playerRunner = null;
    this.finishOrder = [];
    this.cameraX = 0;
    this.raceTime = 0;
    this.uiRefs = null;
    this.boundTierButtons = [];
  }

  enter() {
    this.course = getCourseById(this.game.state.selectedCourseId);
    this.buildField();
    this.cameraX = 0;
    this.raceTime = 0;
    this.renderUI();
    this.game.input.bindKeyboard({
      '1': 'tier-low',
      '2': 'tier-mid',
      '3': 'tier-high',
      '4': 'tier-spurt',
    });
  }

  exit() {
    this.uiRoot.innerHTML = '';
    this.uiRefs = null;
    this.boundTierButtons = [];
    this.game.input.unbindKeyboard();
    this.game.input.clear();
  }

  buildField() {
    const laneYs = RACE_UI_CONFIG.laneYs;
    this.finishOrder = [];

    this.playerRunner = createRunner(this.game.state.selectedCharacterId, {
      runnerId: 'player',
      displayName: 'プレイヤー',
      controlType: 'player',
      speedTierId: 'mid',
      laneIndex: 2,
    });

    const cpuRunners = CPU_RUNNER_TEMPLATES.map((template, index) => createRunner(template.characterId, {
      runnerId: template.slotId,
      displayName: template.nickname,
      controlType: 'cpu',
      aiProfile: template.aiProfile,
      speedTierId: AI_PROFILES[template.aiProfile].preferredStartTier,
      laneIndex: index >= 2 ? index + 1 : index,
    }));

    this.runners = [this.playerRunner, ...cpuRunners]
      .map((runner, index) => ({
        ...runner,
        laneY: laneYs[runner.laneIndex] ?? laneYs[index] ?? laneYs[laneYs.length - 1],
        lastPlacement: index + 1,
      }));
  }

  update(deltaTime) {
    if (!this.course) return;

    this.raceTime += deltaTime;
    this.applyPlayerInput();

    this.runners.forEach((runner) => {
      if (runner.controlType === 'cpu') {
        this.updateCpuDecision(runner);
      }
      this.updateRunner(runner, deltaTime);
    });

    this.updatePlacements();
    this.updateCamera(deltaTime);
    this.updateUIValues();

    if (this.finishOrder.length === this.runners.length) {
      const playerPlace = this.finishOrder.findIndex((runnerId) => runnerId === this.playerRunner.id) + 1;
      this.game.showResult({
        runnerId: this.playerRunner.id,
        displayName: this.playerRunner.displayName,
        finishTime: this.playerRunner.finishTime,
        finishPlace: playerPlace,
        staminaLeftRatio: this.playerRunner.stamina / this.playerRunner.staminaMax,
        courseName: this.course.displayName,
      });
    }
  }

  applyPlayerInput() {
    if (this.game.input.isPressed('tier-low')) this.playerRunner.desiredSpeedTierId = 'low';
    if (this.game.input.isPressed('tier-mid')) this.playerRunner.desiredSpeedTierId = 'mid';
    if (this.game.input.isPressed('tier-high')) this.playerRunner.desiredSpeedTierId = 'high';
    if (this.game.input.isPressed('tier-spurt')) this.playerRunner.desiredSpeedTierId = 'spurt';
  }

  updateCpuDecision(runner) {
    const profile = runner.aiProfile;
    const staminaRatio = runner.stamina / runner.staminaMax;
    const progressRatio = runner.progress / this.course.totalDistance;
    const remainingRatio = 1 - progressRatio;
    const placement = runner.lastPlacement;
    const nextTarget = this.findRunnerAhead(runner);
    const gapAhead = nextTarget ? nextTarget.progress - runner.progress : Infinity;

    let desiredTierId = profile.preferredMidTier;

    if (progressRatio < 0.2) {
      desiredTierId = profile.preferredStartTier;
    }

    if (remainingRatio <= profile.spurtTrigger && staminaRatio > 0.18) {
      desiredTierId = 'spurt';
    } else if (staminaRatio < 0.14) {
      desiredTierId = profile.desperationTier;
    } else if (staminaRatio > 0.62 && gapAhead < 90) {
      desiredTierId = 'high';
    } else if (placement > 3 && remainingRatio < 0.3 && staminaRatio > 0.3) {
      desiredTierId = profile.preferredEndTier;
    } else if (progressRatio < 0.32 && profile.openingBias > 0.1) {
      desiredTierId = 'high';
    } else if (progressRatio > 0.4 && progressRatio < 0.75 && profile.conserveBias > 0.12) {
      desiredTierId = 'mid';
    }

    if (staminaRatio < 0.08) {
      desiredTierId = 'low';
    }

    runner.desiredSpeedTierId = desiredTierId;
  }

  updateRunner(runner, deltaTime) {
    if (runner.isFinished) return;

    const segment = getSegmentForDistance(this.course, runner.progress);
    const terrainFactor = getTerrainAffinityForSegment(runner.terrainAffinity, segment.terrain);
    const tier = SPEED_TIERS[runner.desiredSpeedTierId] ?? SPEED_TIERS.mid;
    const staminaRatio = runner.stamina / runner.staminaMax;
    const exhaustionPenalty = staminaRatio <= 0
      ? GAME_CONFIG.race.zeroStaminaSpeedFactor
      : staminaRatio < GAME_CONFIG.race.lowStaminaThreshold
        ? 0.72 + staminaRatio * 0.56
        : 1;

    const baseSpeed = runner.baseSpeed * tier.speedMultiplier * terrainFactor;
    const targetSpeed = baseSpeed * exhaustionPenalty;
    runner.currentSpeed += (targetSpeed - runner.currentSpeed) * Math.min(1, deltaTime * 4.2);
    runner.progress = Math.min(this.course.totalDistance, runner.progress + runner.currentSpeed * deltaTime);
    runner.elapsedTime += deltaTime;
    runner.speedTierId = runner.desiredSpeedTierId;

    const drain = Math.max(0, runner.staminaDrain * (tier.staminaDrain / 10) * segment.drainMultiplier * deltaTime);
    const recovery = Math.max(0, (GAME_CONFIG.race.baseRecoveryRate + runner.recoveryRate + tier.recoveryBonus) * deltaTime);
    const netStamina = runner.speedTierId === 'low' ? recovery - drain * 0.55 : recovery * 0.25 - drain;
    runner.stamina = Math.max(0, Math.min(runner.staminaMax, runner.stamina + netStamina));
    runner.animationPhase += deltaTime;

    if (runner.progress >= this.course.totalDistance && !runner.isFinished) {
      runner.isFinished = true;
      runner.finishTime = runner.elapsedTime;
      this.finishOrder.push(runner.id);
      runner.finishPlace = this.finishOrder.length;
    }
  }

  updatePlacements() {
    const ranking = [...this.runners].sort((a, b) => {
      if (a.isFinished && b.isFinished) {
        return a.finishTime - b.finishTime;
      }
      if (a.isFinished) return -1;
      if (b.isFinished) return 1;
      return b.progress - a.progress;
    });

    ranking.forEach((runner, index) => {
      runner.lastPlacement = index + 1;
    });
  }

  updateCamera(deltaTime) {
    const worldWidth = this.course.totalDistance + 260;
    const targetCamera = Math.max(0, Math.min(worldWidth - GAME_CONFIG.canvas.width, this.playerRunner.progress - RACE_UI_CONFIG.cameraLead));
    this.cameraX += (targetCamera - this.cameraX) * Math.min(1, deltaTime / RACE_UI_CONFIG.cameraLag);
  }

  findRunnerAhead(runner) {
    return [...this.runners]
      .filter((candidate) => candidate.id !== runner.id)
      .sort((a, b) => b.progress - a.progress)
      .find((candidate) => candidate.progress > runner.progress);
  }

  render(renderer) {
    if (!this.course) return;
    renderer.drawBackgroundSky();
    this.drawScrollingCourse(renderer);
    this.drawRunners(renderer);
    this.drawTopHud(renderer);
    this.drawBottomHud(renderer);
  }

  drawScrollingCourse(renderer) {
    const { ctx, canvas } = renderer;
    const cameraX = this.cameraX;
    const groundTop = 142;
    const groundBottom = 452;

    ctx.fillStyle = '#d8f5ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 210) - cameraX * 0.22) % (canvas.width + 240) - 120;
      const y = 60 + (i % 2) * 20;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, 64, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 38, y + 6, 48, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 26, y + 6, 42, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    this.course.segments.forEach((segment) => {
      const screenX = segment.start - cameraX;
      const width = segment.end - segment.start;
      ctx.fillStyle = segment.color;
      ctx.fillRect(screenX, groundTop, width, groundBottom - groundTop);
    });

    ctx.fillStyle = '#84c75d';
    ctx.fillRect(-cameraX, 142, this.course.totalDistance + 220, 42);

    ctx.fillStyle = '#855f42';
    ctx.fillRect(-cameraX, 184, this.course.totalDistance + 220, 244);

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let x = -((cameraX % 48) + 48); x < canvas.width + 48; x += 48) {
      ctx.fillRect(x, 184, 18, 244);
    }

    ctx.fillStyle = '#f3e9bf';
    for (let x = -((cameraX % 32) + 32); x < canvas.width + 32; x += 32) {
      ctx.fillRect(x, 214, 12, 4);
      ctx.fillRect(x + 4, 270, 12, 4);
      ctx.fillRect(x + 2, 326, 12, 4);
      ctx.fillRect(x + 8, 382, 12, 4);
    }

    ctx.fillStyle = '#f6f3ef';
    for (let x = -((cameraX % 64) + 64); x < canvas.width + 64; x += 64) {
      ctx.fillRect(x, 176, 14, 12);
      ctx.fillRect(x + 24, 176, 8, 12);
    }

    const finishX = this.course.totalDistance - cameraX;
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(finishX, 150, 8, 278);
    for (let i = 0; i < 10; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? '#2d4154' : '#ffffff';
      ctx.fillRect(finishX + 8, 150 + i * 24, 28, 24);
    }

    ctx.fillStyle = '#1d3140';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('GOAL', finishX - 8, 140);
  }

  drawRunners(renderer) {
    const sortedByLane = [...this.runners].sort((a, b) => a.laneY - b.laneY);

    sortedByLane.forEach((runner) => {
      const screenX = runner.progress - this.cameraX;
      const staminaRatio = runner.stamina / runner.staminaMax;
      const bobAmplitude = runner.speedTierId === 'spurt'
        ? GAME_CONFIG.visuals.bob.fastAmplitude
        : staminaRatio < GAME_CONFIG.race.exhaustedThreshold
          ? GAME_CONFIG.visuals.bob.tiredAmplitude
          : GAME_CONFIG.visuals.bob.baseAmplitude;
      const bounceOffset = Math.sin(runner.animationPhase * GAME_CONFIG.visuals.bob.baseFrequency) * bobAmplitude;
      const isFastFrame = runner.speedTierId === 'high' || runner.speedTierId === 'spurt';
      const width = runner.controlType === 'player' ? 132 : 120;
      const height = runner.controlType === 'player' ? 92 : 84;

      if (runner.speedTierId === 'spurt') {
        this.drawSpurtAura(renderer, screenX + 44, runner.laneY - 8 + bounceOffset, SPEED_TIERS.spurt.auraColor);
      }

      renderer.drawSealSprite({
        runner,
        x: screenX - 32,
        y: runner.laneY - 58,
        width,
        height,
        isDashFrame: isFastFrame,
        bounceOffset,
      });

      const { ctx } = renderer;
      ctx.fillStyle = runner.controlType === 'player' ? '#17354a' : '#29485c';
      ctx.font = runner.controlType === 'player' ? 'bold 15px sans-serif' : '13px sans-serif';
      ctx.fillText(`${runner.lastPlacement}位 ${runner.displayName}`, screenX - 12, runner.laneY - 62 + bounceOffset);

      if (staminaRatio < GAME_CONFIG.race.exhaustedThreshold) {
        ctx.fillStyle = '#e85e67';
        ctx.fillText('バテ', screenX + 90, runner.laneY - 14);
      }
    });
  }

  drawSpurtAura(renderer, x, y, color) {
    const { ctx } = renderer;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 24 - i * 10, y - 22 + i * 6);
      ctx.lineTo(x - 64 - i * 14, y - 10 + i * 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTopHud(renderer) {
    const { ctx, canvas } = renderer;
    const leader = [...this.runners].sort((a, b) => b.progress - a.progress)[0];
    const playerGapToLeader = leader.id === this.playerRunner.id ? 0 : this.playerRunner.progress - leader.progress;
    const nearby = [...this.runners]
      .filter((runner) => runner.id !== this.playerRunner.id)
      .sort((a, b) => Math.abs(a.progress - this.playerRunner.progress) - Math.abs(b.progress - this.playerRunner.progress))
      .slice(0, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(22, 18, canvas.width - 44, 68);
    ctx.strokeStyle = '#8ec5ff';
    ctx.strokeRect(22, 18, canvas.width - 44, 68);

    ctx.fillStyle = '#214258';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(`${getPlacementLabel(this.playerRunner.lastPlacement)} / ${this.runners.length}`, 38, 46);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#4e6d7f';
    ctx.fillText(`進行度 ${formatPercent(this.playerRunner.progress / this.course.totalDistance, 0)}  ・ 残り ${formatDistance(this.course.totalDistance - this.playerRunner.progress)}`, 154, 46);
    ctx.fillText(`先頭との差 ${leader.id === this.playerRunner.id ? 'LEAD' : formatGap(playerGapToLeader)}`, 154, 68);

    let rivalTextX = 606;
    nearby.forEach((runner) => {
      const gap = runner.progress - this.playerRunner.progress;
      ctx.fillStyle = gap > 0 ? '#d95a5a' : '#3f8f67';
      ctx.fillText(`${runner.displayName} ${formatGap(gap)}`, rivalTextX, 46);
      rivalTextX += 146;
    });
  }

  drawBottomHud(renderer) {
    const { ctx, canvas } = renderer;
    const staminaRatio = this.playerRunner.stamina / this.playerRunner.staminaMax;
    const speedTier = SPEED_TIERS[this.playerRunner.speedTierId];
    const speedGaugeRatio = Math.min(this.playerRunner.currentSpeed / 92, 1);

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(20, canvas.height - 112, canvas.width - 40, 92);
    ctx.strokeStyle = '#8ec5ff';
    ctx.strokeRect(20, canvas.height - 112, canvas.width - 40, 92);

    ctx.fillStyle = '#26465c';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('STAMINA', 40, canvas.height - 78);
    ctx.fillText('SPEED', 40, canvas.height - 38);
    ctx.fillText('速度段階', 430, canvas.height - 78);
    ctx.fillText(speedTier.label, 430, canvas.height - 42);

    this.drawMeter(renderer, 136, canvas.height - 90, 236, 14, staminaRatio, staminaRatio < GAME_CONFIG.race.exhaustedThreshold ? '#f06d74' : staminaRatio < GAME_CONFIG.race.lowStaminaThreshold ? '#f0af47' : '#5ec26f');
    this.drawMeter(renderer, 136, canvas.height - 50, 236, 14, speedGaugeRatio, speedTier.auraColor);

    ctx.fillStyle = '#557487';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${this.playerRunner.stamina.toFixed(0)} / ${this.playerRunner.staminaMax}`, 382, canvas.height - 78);
    ctx.fillText(`${this.playerRunner.currentSpeed.toFixed(1)} m/s`, 382, canvas.height - 38);

    ctx.fillStyle = '#395f76';
    ctx.fillText(PLAYER_CONTROL_HINTS[0], 566, canvas.height - 78);
    ctx.fillText(PLAYER_CONTROL_HINTS[1], 566, canvas.height - 48);
  }

  drawMeter(renderer, x, y, width, height, ratio, color) {
    const { ctx } = renderer;
    ctx.fillStyle = '#dceefd';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), height);
    ctx.strokeStyle = '#7fb8e8';
    ctx.strokeRect(x, y, width, height);
  }

  renderUI() {
    const tierButtons = SPEED_TIER_ORDER.map((tierId, index) => {
      const tier = SPEED_TIERS[tierId];
      return `<button class="secondary-button" data-tier-id="${tierId}">${index + 1}. ${tier.label}</button>`;
    }).join('');

    this.uiRoot.innerHTML = `
      <span class="kicker">Race Control</span>
      <h2 class="panel-title">${this.course.displayName}</h2>
      <p class="inline-note">横スクロール 2D レースです。位置操作はなく、速度段階の切り替えでスタミナを配分します。</p>
      <div class="info-card meta-list">
        <div class="meta-row"><span>プレイヤー</span><strong>${this.game.state.selectedCharacterId}</strong></div>
        <div class="meta-row"><span>CPU数</span><strong>${this.runners.length - 1}</strong></div>
        <div class="meta-row"><span>距離</span><strong>${this.course.totalDistance}m</strong></div>
      </div>
      <div class="section-label">Speed Tier</div>
      <div class="control-stack">${tierButtons}</div>
      <div class="section-label">Live Ranking</div>
      <div class="info-card meta-list" id="live-ranking"></div>
      <div class="action-stack" style="margin-top: 16px;">
        <button class="secondary-button" id="quit-race-button">タイトルへ戻る</button>
      </div>
    `;

    this.boundTierButtons = [...this.uiRoot.querySelectorAll('[data-tier-id]')];
    this.boundTierButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.playerRunner.desiredSpeedTierId = button.dataset.tierId;
        this.updateUIValues();
      });
    });

    this.uiRoot.querySelector('#quit-race-button')?.addEventListener('click', () => {
      this.game.showTitle();
    });

    this.uiRefs = {
      liveRanking: this.uiRoot.querySelector('#live-ranking'),
    };

    this.updateUIValues();
  }

  updateUIValues() {
    if (!this.uiRefs?.liveRanking) return;

    const rankingRows = [...this.runners]
      .sort((a, b) => a.lastPlacement - b.lastPlacement)
      .map((runner) => `
        <div class="meta-row">
          <span>${runner.lastPlacement}位 ${runner.displayName}</span>
          <strong>${runner.isFinished ? formatSeconds(runner.finishTime, 2) : formatDistance(this.course.totalDistance - runner.progress)}</strong>
        </div>
      `)
      .join('');

    this.uiRefs.liveRanking.innerHTML = rankingRows;

    this.boundTierButtons.forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.tierId === this.playerRunner.desiredSpeedTierId);
    });
  }
}

export { RaceScene };
export default RaceScene;
