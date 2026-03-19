/*
 * このファイルの責務:
 * - UI 表示向けの数値やラベル整形を担当する。
 * 依存している config / module:
 * - gameConfig.js や scene modules から使用される。
 * 将来どこを拡張する想定か:
 * - 多言語化、評価文言テーブル、細かい数値表記切り替えの追加。
 */
export function formatSeconds(seconds, decimals = 2) {
  return `${seconds.toFixed(decimals)}s`;
}

export function formatPercent(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDistance(value) {
  return `${Math.max(0, value).toFixed(0)}m`;
}

export function formatGap(value) {
  if (Math.abs(value) < 10) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}m`;
  }
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}m`;
}

export function getPlacementLabel(place) {
  return `${place}位`;
}

export function getResultEvaluation(place, finishTime, staminaLeftRatio) {
  if (place === 1 && staminaLeftRatio > 0.16) {
    return `Excellent! 配分勝ちです。${finishTime.toFixed(2)} 秒で押し切りました。`;
  }
  if (place <= 2) {
    return 'Great! 終盤の踏みどころが良く、しっかり勝負できました。';
  }
  if (place <= 3) {
    return 'Good! 温存と仕掛けのバランスは悪くありません。';
  }
  return 'Nice Try! 終盤まで少しスタミナを残すと順位が伸びやすいです。';
}
