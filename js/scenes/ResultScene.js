/*
 * このファイルの責務:
 * - レース結果を表示し、再挑戦またはタイトル遷移を提供する。
 * 依存している config / module:
 * - formatters.js と game.js の state。
 * 将来どこを拡張する想定か:
 * - 詳細ラップ、ライバル履歴、リプレイ、報酬表示の追加。
 */
import { formatSeconds, getPlacementLabel, getResultEvaluation } from '../utils/formatters.js';

class ResultScene {
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
    const { ctx, canvas } = renderer;
    const result = this.game.state.lastResult;

    ctx.fillStyle = '#e6f7ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#9cd873';
    ctx.fillRect(0, 320, canvas.width, 90);
    ctx.fillStyle = '#d3af79';
    ctx.fillRect(0, 410, canvas.width, 130);

    ctx.fillStyle = '#21445a';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Race Result', 308, 118);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#416b84';
    ctx.fillText(`${result.courseName} / ${getPlacementLabel(result.finishPlace)}`, 316, 162);

    renderer.drawSealPlaceholder(338, 240, 260, 148, '#78c8ff', result.displayName, result.finishPlace <= 2);
  }

  renderUI() {
    const result = this.game.state.lastResult;
    const evaluation = getResultEvaluation(result.finishPlace, result.finishTime, result.staminaLeftRatio);

    this.uiRoot.innerHTML = `
      <span class="kicker">Result</span>
      <h2 class="panel-title">レース結果</h2>
      <div class="result-box">
        <h3>${result.displayName}</h3>
        <p>順位: <strong>${getPlacementLabel(result.finishPlace)}</strong></p>
        <p>タイム: <strong>${formatSeconds(result.finishTime, 2)}</strong></p>
        <p>コース: <strong>${result.courseName}</strong></p>
        <p>評価: ${evaluation}</p>
      </div>
      <div class="result-actions">
        <button class="primary-button" id="retry-button">もう一回</button>
        <button class="secondary-button" id="back-title-button">タイトルへ戻る</button>
      </div>
    `;

    this.uiRoot.querySelector('#retry-button')?.addEventListener('click', () => {
      this.game.startRace();
    });

    this.uiRoot.querySelector('#back-title-button')?.addEventListener('click', () => {
      this.game.showTitle();
    });
  }
}

export { ResultScene };
export default ResultScene;
