/*
 * このファイルの責務:
 * - タイトル表示とキャラクター選択 UI を構築し、レース開始へ遷移する。
 * 依存している config / module:
 * - characterConfig.js, typeConfig.js, terrainUtils.js, characterFactory.js。
 * 将来どこを拡張する想定か:
 * - 複数 runner 選択、コース選択、育成画面導線の追加。
 */
import { CHARACTER_CONFIG } from '../config/characterConfig.js';
import { getCharacterById } from '../data/characterFactory.js';
import { buildTerrainAffinity, getTerrainRank } from '../utils/terrainUtils.js';

export class TitleScene {
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
    renderer.drawBackgroundSky();
    this.drawTitleBackdrop(renderer);
  }

  drawTitleBackdrop(renderer) {
    const { ctx, canvas } = renderer;
    const baseY = 360;

    ctx.fillStyle = '#d9f7ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#bdefff';
    ctx.beginPath();
    ctx.arc(170, 110, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    [
      [170, 120, 120],
      [260, 140, 110],
      [720, 110, 130],
      [820, 138, 112],
    ].forEach(([x, y, w]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w, 34, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#a2d58e';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.quadraticCurveTo(180, 310, 360, 360);
    ctx.quadraticCurveTo(520, 405, 690, 348);
    ctx.quadraticCurveTo(780, 320, canvas.width, 362);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8cc97a';
    ctx.fillRect(0, baseY, canvas.width, canvas.height - baseY);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('Seal Sprint', 74, 122);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#2e617e';
    ctx.fillText('もんすたぁレース風・1体プレイ試作', 78, 160);

    ctx.fillStyle = 'rgba(46, 97, 126, 0.12)';
    ctx.fillRect(70, 220, 820, 140);

    const previewRunner = getCharacterById(this.game.state.selectedCharacterId);
    const color = previewRunner.colorType;
    renderer.drawSealPlaceholder(110, 245, 200, 130, color, previewRunner.displayName, false);
    renderer.drawSealPlaceholder(360, 235, 220, 140, '#ffaf80', 'れーす', true);
    renderer.drawSealPlaceholder(640, 255, 190, 120, '#8fd3c8', 'ごーる', false);
  }

  renderUI() {
    const selectedCharacter = getCharacterById(this.game.state.selectedCharacterId);
    const terrainAffinity = buildTerrainAffinity(selectedCharacter);

    const cards = CHARACTER_CONFIG.map((character) => {
      const isSelected = character.id === selectedCharacter.id;
      return `
        <button class="character-card ${isSelected ? 'is-selected' : ''}" data-character-id="${character.id}">
          <h3>${character.displayName}</h3>
          <p>${character.description}</p>
          <div class="tag-row">
            <span class="tag-pill">${character.type}</span>
            <span class="tag-pill">Base ${character.baseSpeed}</span>
          </div>
        </button>
      `;
    }).join('');

    const rankRows = ['grass', 'sand', 'water'].map((terrain) => `
      <div class="rank-row">
        <span>${this.getTerrainLabel(terrain)}</span>
        <span class="rank-pill">${getTerrainRank(terrainAffinity[terrain])}</span>
      </div>
    `).join('');

    this.uiRoot.innerHTML = `
      <span class="kicker">Title / Select</span>
      <h2 class="panel-title">走るあざらしを選ぶ</h2>
      <p class="inline-note">今回は 1 体だけで出走します。違いが分かりやすい 3 体から選んでください。</p>

      <div class="section-label">Character</div>
      <div class="card-list">${cards}</div>

      <div class="section-label">Selected Info</div>
      <div class="info-card">
        <h3>${selectedCharacter.displayName}</h3>
        <p>${selectedCharacter.description}</p>
        <div class="tag-row">
          <span class="tag-pill">タイプ: ${selectedCharacter.type}</span>
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

    this.uiRoot.querySelector('#start-race-button')?.addEventListener('click', () => {
      this.game.startRace();
    });
  }

  getTerrainLabel(terrain) {
    return {
      grass: 'Grass',
      sand: 'Sand',
      water: 'Water',
    }[terrain] ?? terrain;
  }
}
