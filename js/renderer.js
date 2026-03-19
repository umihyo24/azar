/*
 * このファイルの責務:
 * - Canvas 2D の共通描画処理と画像読み込みフォールバックをまとめる。
 * 依存している config / module:
 * - gameConfig.js と各 scene から利用される。
 * 将来どこを拡張する想定か:
 * - アニメーションスプライト、エフェクトレイヤー、オフスクリーン描画最適化。
 */
import { GAME_CONFIG } from './config/gameConfig.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.imageCache = new Map();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  loadImage(key, src) {
    if (this.imageCache.has(key)) {
      return this.imageCache.get(key);
    }

    const record = {
      key,
      src,
      image: new Image(),
      loaded: false,
      failed: false,
    };

    record.image.onload = () => {
      record.loaded = true;
    };

    record.image.onerror = () => {
      record.failed = true;
    };

    record.image.src = src;
    this.imageCache.set(key, record);
    return record;
  }

  drawBackgroundSky() {
    const { ctx, canvas } = this;
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#aee7ff');
    gradient.addColorStop(0.55, '#d7f4ff');
    gradient.addColorStop(1, '#f8fdff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawRoundedRect(x, y, width, height, radius, fillStyle) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  drawSealSprite({ runner, x, y, width, height, isDashFrame, bounceOffset, facing = 1 }) {
    const spriteKey = isDashFrame ? runner.spriteKeys.dash : runner.spriteKeys.normal;
    const spritePath = isDashFrame ? runner.spritePaths.dash : runner.spritePaths.normal;
    const record = this.loadImage(spriteKey, spritePath);
    const { ctx } = this;

    ctx.save();
    ctx.translate(x, y + bounceOffset);
    ctx.scale(facing, 1);
    const drawX = facing === 1 ? 0 : -width;

    if (record.loaded && !record.failed) {
      ctx.drawImage(record.image, drawX, 0, width, height);
    } else {
      this.drawSealPlaceholder(drawX, 0, width, height, runner.colorType, runner.displayName, isDashFrame);
    }
    ctx.restore();
  }

  drawSealPlaceholder(x, y, width, height, color, label, isDashFrame) {
    const { ctx } = this;
    const bodyColor = color;
    const bellyColor = '#f8fbff';
    const accentColor = isDashFrame ? '#ffb15f' : '#3f5f74';

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(41, 74, 97, 0.12)';
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.9, width * 0.34, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(width * 0.52, height * 0.5, width * 0.34, height * 0.3, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(width * 0.56, height * 0.56, width * 0.18, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(width * 0.24, height * 0.46, width * 0.13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#233747';
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.44, width * 0.02, 0, Math.PI * 2);
    ctx.arc(width * 0.26, height * 0.44, width * 0.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#233747';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.19, height * 0.49);
    ctx.quadraticCurveTo(width * 0.23, height * 0.53, width * 0.27, height * 0.49);
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(width * 0.78, height * 0.48);
    ctx.lineTo(width * 0.92, height * 0.38);
    ctx.lineTo(width * 0.89, height * 0.58);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2f5163';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(label.replace('あざらし', ''), width * 0.34, height * 0.18);
    ctx.restore();
  }

  drawSpeedLines({ intensity, laneY }) {
    const { ctx, canvas } = this;
    const count = GAME_CONFIG.visuals.speedLines.count;
    const baseLength = GAME_CONFIG.visuals.speedLines.length;
    const dashBoost = GAME_CONFIG.visuals.speedLines.dashBoost;
    const speedScale = 0.45 + intensity * dashBoost;

    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + intensity * 0.16})`;
    ctx.lineWidth = 2;

    for (let i = 0; i < count; i += 1) {
      const offset = ((i * 91) + performance.now() * 0.12 * speedScale) % (canvas.width + 120);
      const x = canvas.width - offset;
      const y = laneY - 110 + (i % 5) * 42;
      const length = baseLength + intensity * 18 + (i % 3) * 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - length, y + 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
