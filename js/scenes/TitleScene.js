/*
 * このファイルの責務:
 * - タイトル表示とキャラクター / コース選択 UI を構築し、レース開始へ遷移する。
 * 依存している config / module:
 * - characterConfig.js, courseConfig.js, terrainUtils.js, characterFactory.js。
 * 将来どこを拡張する想定か:
 * - 複数 runner 選択、育成導線、詳細ステータス画面の追加。
 */
import { CHARACTER_CONFIG } from '../config/characterConfig.js';
import { COURSE_PRESETS, getCourseById } from '../config/courseConfig.js';
import { getCharacterById } from '../data/characterFactory.js';
import { buildTerrainAffinity, getTerrainLabel, getTerrainRank } from '../utils/terrainUtils.js';

class TitleScene {
  constructor(game) {
    this.game = game;
    this.uiRoot = game.uiRoot;
  }

  enter() {
    this.renderUI();
  }

  exit() {
    this.uiRoot.innerHTML = '';
  }

  update() {}

  render(renderer) {
    const { ctx, canvas } = renderer;
    renderer.drawBackgroundSky();

    ctx.fillStyle = '#d2f5ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    [110, 320, 620, 820].forEach((x, index) => {
      const y = 90 + (index % 2) * 28;
      ctx.beginPath();
      ctx.ellipse(x, y, 64, 22, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 36, y + 6, 46, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(x - 28, y + 6, 40, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#9ed772';
    ctx.fillRect(0, 292, canvas.width, 88);
    ctx.fillStyle = '#cfab76';
    ctx.fillRect(0, 380, canvas.width, 70);
    ctx.fillStyle = '#f7e9b8';
    for (let x = 0; x < canvas.width; x += 18) {
      ctx.fillRect(x, 404, 8, 4);
    }

    ctx.fillStyle = '#28455a';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('Seal Sprint 2D', 62, 116);
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#3d6783';
    ctx.fillText('横スクロール・スタミナ配分型レース試作', 64, 154);

    const previewRunner = getCharacterById(this.game.state.selectedCharacterId);
    renderer.drawSealPlaceholder(126, 286, 220, 132, previewRunner.colorType, previewRunner.displayName, false);
    renderer.drawSealPlaceholder(398, 300, 188, 116, '#ffad72', 'CPU', true);
    renderer.drawSealPlaceholder(648, 290, 210, 128, '#72d0bc', 'GOAL', false);
  }

  renderUI() {
    const selectedCharacter = getCharacterById(this.game.state.selectedCharacterId);
    const selectedCourse = getCourseById(this.game.state.selectedCourseId);
    const terrainAffinity = buildTerrainAffinity(selectedCharacter);

    const characterCards = CHARACTER_CONFIG.map((character) => {
      const isSelected = character.id === selectedCharacter.id;
      return `
        <button class="character-card ${isSelected ? 'is-selected' : ''}" data-character-id="${character.id}">
          <h3>${character.displayName}</h3>
          <p>${character.description}</p>
          <div class="tag-row">
            <span class="tag-pill">Base ${character.baseSpeed}</span>
            <span class="tag-pill">Stamina ${character.staminaMax}</span>
          </div>
        </button>
      `;
    }).join('');

    const courseCards = COURSE_PRESETS.map((course) => {
      const isSelected = course.id === selectedCourse.id;
      return `
        <button class="character-card ${isSelected ? 'is-selected' : ''}" data-course-id="${course.id}">
          <h3>${course.displayName}</h3>
          <p>${course.summary}</p>
          <div class="tag-row">
            <span class="tag-pill">距離 ${course.totalDistance}m</span>
            <span class="tag-pill">目安 ${course.par}s</span>
          </div>
        </button>
      `;
    }).join('');

    const rankRows = ['grass', 'dirt', 'flat'].map((terrain) => `
      <div class="rank-row">
        <span>${getTerrainLabel(terrain)}</span>
        <span class="rank-pill">${getTerrainRank(terrainAffinity[terrain] ?? 1)}</span>
      </div>
    `).join('');

    this.uiRoot.innerHTML = `
      <span class="kicker">Title / Setup</span>
      <h2 class="panel-title">出走設定</h2>
      <p class="inline-note">1体を操作し、CPU 4 体と横スクロールのレースを走ります。勝負の中心はスタミナ配分です。</p>

      <div class="section-label">Character</div>
      <div class="card-list">${characterCards}</div>

      <div class="section-label">Course</div>
      <div class="card-list">${courseCards}</div>

      <div class="section-label">Selected Info</div>
      <div class="info-card">
        <h3>${selectedCharacter.displayName}</h3>
        <p>${selectedCharacter.description}</p>
        <div class="tag-row">
          <span class="tag-pill">${selectedCourse.displayName}</span>
          <span class="tag-pill">ダッシュ x${selectedCharacter.dashMultiplier.toFixed(2)}</span>
        </div>
        <div class="section-label">Terrain Rank</div>
        <div class="rank-grid">${rankRows}</div>
      </div>

      <div class="action-stack" style="margin-top: 18px;">
        <button class="primary-button" id="start-race-button">Start Race</button>
      </div>
    `;

    this.bindUI();
  }

  bindUI() {
    this.uiRoot.querySelectorAll('[data-character-id]').forEach((button) => {
      button.addEventListener('click', () => {
        this.game.state.selectedCharacterId = button.dataset.characterId;
        this.game.state.activeRunnerId = button.dataset.characterId;
        this.renderUI();
      });
    });

    this.uiRoot.querySelectorAll('[data-course-id]').forEach((button) => {
      button.addEventListener('click', () => {
        this.game.state.selectedCourseId = button.dataset.courseId;
        this.renderUI();
      });
    });

    this.uiRoot.querySelector('#start-race-button')?.addEventListener('click', () => {
      this.game.startRace();
    });
  }
}

export { TitleScene };
export default TitleScene;
