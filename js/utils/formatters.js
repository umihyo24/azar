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

export function getResultEvaluation(timeSeconds) {
  if (timeSeconds <= 21.5) {
    return 'Excellent! 波に乗った快走でした。';
  }
  if (timeSeconds <= 24.5) {
    return 'Great! 安定して気持ちよく走れました。';
  }
  if (timeSeconds <= 28) {
    return 'Good! ダッシュの入れどころが見えてきました。';
  }
  return 'Nice Try! コースに合わせて温存するともっと伸びます。';
}

export function toSignedDelta(value) {
  const rounded = value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  return rounded;
}
