/*
 * このファイルの責務:
 * - レース結果を表示し、再挑戦またはタイトル遷移を提供する。
 * 依存している config / module:
 * - formatters.js と game.js の state。
 * 将来どこを拡張する想定か:
 * - ランキング、リプレイ、獲得報酬、複数 runner の順位表示追加。
 */
import { formatSeconds, getResultEvaluation } from '../utils/formatters.js';

export class ResultScene {
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

    ctx.fillStyle = '#f0fbff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(73, 166, 255, 0.12)';
    ctx.fillRect(96, 86, canvas.width - 192, canvas.height - 172);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(124, 112, canvas.width - 248, canvas.height - 224);

    ctx.fillStyle = '#2c536b';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('Race Result', 324, 170);

    const result = this.game.state.lastResult;
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#4f6e80';
    ctx.fillText(`Runner: ${result?.displayName ?? '-'}`, 280, 244);
    ctx.fillText(`Time: ${result ? formatSeconds(result.finishTime, 2) : '-'}`, 280, 290);

    ctx.fillStyle = '#67b77b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(result ? getResultEvaluation(result.finishTime) : '', 174, 356);

    renderer.drawSealPlaceholder(360, 360, 240, 140, '#7cc8ff', result?.displayName ?? 'seal', true);
  }

  renderUI() {
    const result = this.game.state.lastResult;
    const evaluation = result ? getResultEvaluation(result.finishTime) : '---';

    this.uiRoot.innerHTML = `
      <span class="kicker">Result</span>
      <h2 class="panel-title">レース結果</h2>
      <div class="result-box">
        <h3>${result?.displayName ?? 'No Runner'}</h3>
        <p>クリアタイム: <strong>${result ? formatSeconds(result.finishTime, 2) : '--'}</strong></p>
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
