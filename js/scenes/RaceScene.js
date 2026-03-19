/*
 * このファイルの責務:
 * - レース中の進行、runner 更新、コース描画、ダッシュ入力を処理する。
 * 依存している config / module:
 * - gameConfig.js, courseConfig.js, characterFactory.js, terrainUtils.js, formatters.js。
 * 将来どこを拡張する想定か:
 * - CPU runner、複数 runner 表示、activeRunner 切り替え、障害物イベントの追加。
 */
import { GAME_CONFIG } from '../config/gameConfig.js';
import { COURSE_CONFIG } from '../config/courseConfig.js';
import { createRunner } from '../data/characterFactory.js';
import { formatPercent, formatSeconds } from '../utils/formatters.js';
import { getSegmentForDistance, getTerrainAffinityForSegment } from '../utils/terrainUtils.js';

export class RaceScene {
  constructor(game) {
    this.game = game;
    this.uiRoot = game.uiRoot;
    this.course = COURSE_CONFIG;
    this.runners = [];
    this.activeRunner = null;
    this.isRaceFinished = false;
    this.boundDashStart = null;
    this.boundDashEnd = null;
    this.uiRefs = null;
  }

  enter() {
    this.course = {
      ...COURSE_CONFIG,
      totalDistance: COURSE_CONFIG.totalDistance ?? GAME_CONFIG.race.distance,
    };

    // TODO: CPUランナー追加時はここを runner 配列ループに置き換える。
    this.runners = [createRunner(this.game.state.selectedCharacterId)];

    // TODO: 交代要素追加時は activeRunner の切り替え処理を入れる。
    this.activeRunner = this.runners[0];
    this.game.state.activeRunnerId = this.activeRunner.id;
    this.isRaceFinished = false;
    this.renderUI();
  }

  exit() {
    this.unbindDashEvents();
    this.uiRoot.innerHTML = '';
    this.game.input.clear();
    this.uiRefs = null;
  }

  update(deltaTime) {
    if (!this.activeRunner || this.isRaceFinished) {
      return;
    }

    this.updateRunner(this.activeRunner, deltaTime);
    this.updateUIValues();

    if (this.activeRunner.progress >= this.course.totalDistance && !this.activeRunner.isFinished) {
      this.activeRunner.progress = this.course.totalDistance;
      this.activeRunner.isFinished = true;
      this.activeRunner.finishTime = this.activeRunner.elapsedTime;
      this.isRaceFinished = true;

      window.setTimeout(() => {
        this.game.showResult({
          runnerId: this.activeRunner.id,
          displayName: this.activeRunner.displayName,
          finishTime: this.activeRunner.finishTime,
        });
      }, 420);
    }
  }

  updateRunner(runner, deltaTime) {
    runner.elapsedTime += deltaTime;
    const segment = getSegmentForDistance(this.course, runner.progress);
    const terrainFactor = getTerrainAffinityForSegment(runner.terrainAffinity, segment.terrain);
    const dashRequested = this.game.input.isPressed('dash') && runner.stamina > 0;
    const lowStaminaRatio = runner.stamina / runner.staminaMax;
    const staminaPenalty = Math.max(
      GAME_CONFIG.race.minSpeedFactorAtZeroStamina,
      1 - (1 - lowStaminaRatio) * 0.25,
    );
    const dashPulse = dashRequested ? 1 + Math.sin(runner.elapsedTime * 16) * GAME_CONFIG.race.dashSpeedPulse : 1;
    const dashMultiplier = dashRequested ? runner.dashMultiplier * dashPulse : 1;

    runner.isDashing = dashRequested;
    runner.recoveryCooldown = Math.max(0, runner.recoveryCooldown - deltaTime);

    const targetSpeed = runner.baseSpeed * terrainFactor * staminaPenalty * dashMultiplier;
    runner.currentSpeed += (targetSpeed - runner.currentSpeed) * Math.min(1, deltaTime * 6.5);
    runner.progress += runner.currentSpeed * deltaTime;

    const terrainDrainMultiplier = 1 + (segment.drainMultiplier - 1) * GAME_CONFIG.race.terrainDrainImpact;
    const dashDrain = dashRequested ? GAME_CONFIG.race.dashDrainMultiplier : 1;
    const staminaDrain = runner.staminaDrain * terrainDrainMultiplier * dashDrain * deltaTime;

    if (dashRequested) {
      runner.stamina = Math.max(0, runner.stamina - staminaDrain);
      runner.recoveryCooldown = GAME_CONFIG.race.recoveryDelaySeconds;
    } else if (runner.recoveryCooldown <= 0) {
      runner.stamina = Math.min(runner.staminaMax, runner.stamina + runner.recoveryRate * terrainFactor * deltaTime);
    } else {
      runner.stamina = Math.max(0, runner.stamina - staminaDrain * 0.12);
    }

    if (runner.stamina <= 0) {
      runner.isDashing = false;
    }

    runner.animationPhase += deltaTime;
  }

  render(renderer) {
    renderer.drawBackgroundSky();
    this.drawBackdrop(renderer);
    this.drawCourse(renderer);
    this.drawRunner(renderer, this.activeRunner);
    this.drawHud(renderer, this.activeRunner);
  }

  drawBackdrop(renderer) {
    const { ctx, canvas } = renderer;
    const time = performance.now() / 1000;
    const cloudShift = (time * GAME_CONFIG.visuals.parallax.cloudSpeed) % (canvas.width + 180);

    [0, 260, 560, 820].forEach((offset, index) => {
      const x = ((offset - cloudShift) % (canvas.width + 180)) + 100;
      const y = 88 + (index % 2) * 30;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y, 74, 25, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 52, y + 4, 62, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 42, y + 8, 56, 21, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const hillShift = (time * GAME_CONFIG.visuals.parallax.hillSpeed) % canvas.width;
    ctx.fillStyle = '#bfe7a2';
    ctx.beginPath();
    ctx.moveTo(-40, 314);
    ctx.quadraticCurveTo(120 - hillShift * 0.08, 238, 320, 320);
    ctx.quadraticCurveTo(540, 390, 760, 302);
    ctx.quadraticCurveTo(860, 260, 1000, 316);
    ctx.lineTo(1000, canvas.height);
    ctx.lineTo(-40, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  drawCourse(renderer) {
    const { ctx, canvas } = renderer;
    const laneY = GAME_CONFIG.race.laneY;
    const startX = 84;
    const trackWidth = canvas.width - 168;

    this.course.segments.forEach((segment) => {
      const segmentStartRatio = segment.start / this.course.totalDistance;
      const segmentEndRatio = segment.end / this.course.totalDistance;
      const x = startX + trackWidth * segmentStartRatio;
      const width = trackWidth * (segmentEndRatio - segmentStartRatio);
      renderer.drawRoundedRect(x, laneY - 28, width, 74, 18, segment.color);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(startX, laneY + 4, trackWidth, 6);

    ctx.fillStyle = '#6e808c';
    ctx.fillRect(startX - 8, laneY - 44, 10, 118);
    ctx.fillRect(startX + trackWidth - 2, laneY - 44, 10, 118);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(startX + i * 16, laneY - 14, 8, 32);
      ctx.fillRect(startX + trackWidth - 24 + i * 4, laneY - 14, 8, 32);
    }
  }

  drawRunner(renderer, runner) {
    if (!runner) return;

    const { ctx } = renderer;
    const laneY = GAME_CONFIG.race.laneY;
    const progressRatio = runner.progress / this.course.totalDistance;
    const runnerX = 104 + progressRatio * 720;
    const staminaRatio = runner.stamina / runner.staminaMax;
    const bobConfig = GAME_CONFIG.visuals.bob;
    const bobAmplitude = runner.isDashing
      ? bobConfig.dashAmplitude
      : staminaRatio < GAME_CONFIG.race.exhaustedThreshold
        ? bobConfig.tiredAmplitude
        : bobConfig.baseAmplitude;
    const bounceOffset = Math.sin(runner.animationPhase * bobConfig.baseFrequency) * bobAmplitude;

    renderer.drawSpeedLines({
      intensity: runner.isDashing ? 1 : 1 - staminaRatio * 0.45,
      laneY,
    });

    ctx.fillStyle = 'rgba(53, 87, 103, 0.18)';
    ctx.beginPath();
    ctx.ellipse(runnerX + 40, laneY + 32, 64, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    renderer.drawSealSprite({
      runner,
      x: runnerX - 18,
      y: laneY - 72,
      width: 164,
      height: 112,
      isDashFrame: runner.isDashing,
      bounceOffset,
    });

    if (staminaRatio < GAME_CONFIG.race.exhaustedThreshold) {
      ctx.fillStyle = '#3f6171';
      ctx.font = '16px sans-serif';
      ctx.fillText('…つかれぎみ', runnerX + 18, laneY - 82 + bounceOffset);
    } else if (runner.isDashing) {
      ctx.fillStyle = '#f97332';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DASH!', runnerX + 28, laneY - 82 + bounceOffset);
    }
  }

  drawHud(renderer, runner) {
    if (!runner) return;

    const { ctx, canvas } = renderer;
    const segment = getSegmentForDistance(this.course, runner.progress);
    const staminaRatio = runner.stamina / runner.staminaMax;
    const progressRatio = runner.progress / this.course.totalDistance;

    renderer.drawRoundedRect(24, 20, 284, 112, 20, 'rgba(255,255,255,0.82)');
    renderer.drawRoundedRect(canvas.width - 280, 20, 236, 112, 20, 'rgba(255,255,255,0.82)');

    ctx.fillStyle = '#264b61';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(GAME_CONFIG.ui.raceTitle, 40, 54);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#5b7382';
    ctx.fillText(`Runner: ${runner.displayName}`, 40, 82);
    ctx.fillText(`Terrain: ${segment.label}`, 40, 106);

    ctx.fillStyle = '#264b61';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('GOAL', canvas.width - 232, 52);
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(formatPercent(progressRatio, 0), canvas.width - 232, 90);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#5b7382';
    ctx.fillText(`Time ${formatSeconds(runner.elapsedTime, 2)}`, canvas.width - 232, 116);

    renderer.drawRoundedRect(24, 452, canvas.width - 48, 56, 18, 'rgba(255,255,255,0.86)');

    ctx.fillStyle = '#264b61';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Stamina', 42, 485);
    ctx.fillText('Speed', 352, 485);
    ctx.fillText('State', 612, 485);

    this.drawInlineMeter(renderer, 114, 469, 180, 18, staminaRatio, this.getMeterColor(staminaRatio));
    this.drawInlineMeter(renderer, 420, 469, 140, 18, Math.min(runner.currentSpeed / 95, 1), '#49a6ff');

    ctx.fillStyle = '#5b7382';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${runner.currentSpeed.toFixed(1)} m/s`, 420, 502);
    ctx.fillText(`${segment.terrain.toUpperCase()}`, 612, 485);
    ctx.fillText(runner.isDashing ? 'Dash 中' : staminaRatio < GAME_CONFIG.race.lowStaminaThreshold ? '温存中' : '巡航中', 612, 504);
  }

  drawInlineMeter(renderer, x, y, width, height, ratio, fillStyle) {
    const { ctx } = renderer;
    renderer.drawRoundedRect(x, y, width, height, 999, 'rgba(73,166,255,0.15)');
    renderer.drawRoundedRect(x, y, width * Math.max(0, Math.min(1, ratio)), height, 999, fillStyle);
    ctx.strokeStyle = 'rgba(38, 75, 97, 0.08)';
    ctx.strokeRect(x, y, width, height);
  }

  getMeterColor(staminaRatio) {
    if (staminaRatio < GAME_CONFIG.race.exhaustedThreshold) return '#ee6f75';
    if (staminaRatio < GAME_CONFIG.race.lowStaminaThreshold) return '#f0a341';
    return '#46b86d';
  }

  renderUI() {
    if (!this.activeRunner) {
      return;
    }

    this.uiRoot.innerHTML = `
      <span class="kicker">Race</span>
      <h2 class="panel-title" data-role="runner-name"></h2>
      <p class="inline-note">右へ自動で進みます。ダッシュを押して伸ばしつつ、スタミナ切れを避けましょう。</p>

      <div class="section-label">Race Status</div>
      <div class="control-card meter-list">
        <div class="meter-row"><span>進行度</span><strong data-role="progress-text"></strong></div>
        <div class="meter"><span data-role="progress-bar"></span></div>

        <div class="meter-row"><span>スタミナ</span><strong data-role="stamina-text"></strong></div>
        <div class="meter stamina" data-role="stamina-meter">
          <span data-role="stamina-bar"></span>
        </div>
      </div>

      <div class="section-label">Live Data</div>
      <div class="info-card meta-list">
        <div class="meta-row"><span>地形</span><span class="state-pill" data-role="terrain-text"></span></div>
        <div class="meta-row"><span>速度</span><strong data-role="speed-text"></strong></div>
        <div class="meta-row"><span>状態</span><strong data-role="state-text"></strong></div>
        <div class="meta-row"><span>経過時間</span><strong data-role="time-text"></strong></div>
      </div>

      <div class="section-label">Control</div>
      <div class="control-stack">
        <button class="dash-button" id="dash-button">ダッシュ</button>
        <p class="small-note">押している間だけ加速。スタミナ 0 では使用できません。</p>
        <button class="secondary-button" id="quit-race-button">タイトルへ戻る</button>
      </div>
    `;

    this.uiRefs = {
      runnerName: this.uiRoot.querySelector('[data-role="runner-name"]'),
      progressText: this.uiRoot.querySelector('[data-role="progress-text"]'),
      progressBar: this.uiRoot.querySelector('[data-role="progress-bar"]'),
      staminaText: this.uiRoot.querySelector('[data-role="stamina-text"]'),
      staminaMeter: this.uiRoot.querySelector('[data-role="stamina-meter"]'),
      staminaBar: this.uiRoot.querySelector('[data-role="stamina-bar"]'),
      terrainText: this.uiRoot.querySelector('[data-role="terrain-text"]'),
      speedText: this.uiRoot.querySelector('[data-role="speed-text"]'),
      stateText: this.uiRoot.querySelector('[data-role="state-text"]'),
      timeText: this.uiRoot.querySelector('[data-role="time-text"]'),
    };

    this.updateUIValues();
    this.bindDashEvents();
  }

  updateUIValues() {
    if (!this.activeRunner || !this.uiRefs) {
      return;
    }

    const runner = this.activeRunner;
    const segment = getSegmentForDistance(this.course, runner.progress);
    const staminaRatio = runner.stamina / runner.staminaMax;
    const dashDisabled = staminaRatio <= 0.001;

    this.uiRefs.runnerName.textContent = runner.displayName;
    this.uiRefs.progressText.textContent = formatPercent(runner.progress / this.course.totalDistance, 0);
    this.uiRefs.progressBar.style.width = `${Math.min(100, (runner.progress / this.course.totalDistance) * 100)}%`;
    this.uiRefs.staminaText.textContent = `${runner.stamina.toFixed(0)} / ${runner.staminaMax}`;
    this.uiRefs.staminaBar.style.width = `${Math.min(100, staminaRatio * 100)}%`;
    this.uiRefs.terrainText.textContent = segment.label;
    this.uiRefs.speedText.textContent = `${runner.currentSpeed.toFixed(1)} m/s`;
    this.uiRefs.stateText.textContent = runner.isDashing ? 'Dash' : staminaRatio < GAME_CONFIG.race.lowStaminaThreshold ? 'Tired' : 'Cruise';
    this.uiRefs.timeText.textContent = formatSeconds(runner.elapsedTime, 2);

    this.uiRefs.staminaMeter.classList.toggle('warning', staminaRatio < GAME_CONFIG.race.lowStaminaThreshold && staminaRatio >= GAME_CONFIG.race.exhaustedThreshold);
    this.uiRefs.staminaMeter.classList.toggle('danger', staminaRatio < GAME_CONFIG.race.exhaustedThreshold);

    const dashButton = this.uiRoot.querySelector('#dash-button');
    if (dashButton) {
      dashButton.disabled = dashDisabled;
      dashButton.classList.toggle('is-active', runner.isDashing);
    }
  }

  bindDashEvents() {
    this.unbindDashEvents();

    const dashButton = this.uiRoot.querySelector('#dash-button');
    const quitButton = this.uiRoot.querySelector('#quit-race-button');

    if (dashButton) {
      this.boundDashStart = () => this.game.input.setActionState('dash', true);
      this.boundDashEnd = () => this.game.input.setActionState('dash', false);

      dashButton.addEventListener('pointerdown', this.boundDashStart);
      dashButton.addEventListener('pointerup', this.boundDashEnd);
      dashButton.addEventListener('pointerleave', this.boundDashEnd);
      dashButton.addEventListener('pointercancel', this.boundDashEnd);
      dashButton.addEventListener('touchstart', this.boundDashStart, { passive: true });
      dashButton.addEventListener('touchend', this.boundDashEnd);
    }

    quitButton?.addEventListener('click', () => {
      this.game.showTitle();
    });
  }

  unbindDashEvents() {
    const dashButton = this.uiRoot.querySelector('#dash-button');
    if (dashButton && this.boundDashStart && this.boundDashEnd) {
      dashButton.removeEventListener('pointerdown', this.boundDashStart);
      dashButton.removeEventListener('pointerup', this.boundDashEnd);
      dashButton.removeEventListener('pointerleave', this.boundDashEnd);
      dashButton.removeEventListener('pointercancel', this.boundDashEnd);
      dashButton.removeEventListener('touchstart', this.boundDashStart);
      dashButton.removeEventListener('touchend', this.boundDashEnd);
    }

    this.boundDashStart = null;
    this.boundDashEnd = null;
    this.game.input.setActionState('dash', false);
  }
}
