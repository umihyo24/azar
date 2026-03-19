/*
 * このファイルの責務:
 * - ゲーム全体で共有する描画サイズ・UI 基本値・レース係数を管理する。
 * 依存している config / module:
 * - なし。各 scene や renderer から参照される。
 * 将来どこを拡張する想定か:
 * - 難易度、サウンド、画面サイズ切り替え、演出係数の調整。
 */
export const GAME_CONFIG = {
  canvas: {
    width: 960,
    height: 540,
  },
  race: {
    maxFinishers: 5,
    lowStaminaThreshold: 0.28,
    exhaustedThreshold: 0.1,
    zeroStaminaSpeedFactor: 0.46,
    baseRecoveryRate: 1.4,
    catchupDistance: 120,
    finishBurstDistance: 260,
    cameraShakeAtFinish: 0.85,
  },
  ui: {
    raceTitle: '2D ペース配分レース',
    timeDecimals: 2,
    gapDecimals: 1,
  },
  visuals: {
    bob: {
      baseAmplitude: 4,
      fastAmplitude: 7,
      tiredAmplitude: 2,
      baseFrequency: 7.2,
    },
    pixel: {
      laneStripeWidth: 18,
      tileWidth: 48,
      fenceSpan: 32,
    },
  },
};
