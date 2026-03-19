/*
 * このファイルの責務:
 * - ゲーム全体で共有する描画サイズ・レース時間感・UI 文言などの基本設定を管理する。
 * 依存している config / module:
 * - なし。各 scene や renderer から参照される。
 * 将来どこを拡張する想定か:
 * - 難易度別設定、音量、複数コース、複数 runner 用の共通係数追加。
 */
export const GAME_CONFIG = {
  canvas: {
    width: 960,
    height: 540,
  },
  race: {
    distance: 1380,
    timeLimitSeconds: 35,
    dashDrainMultiplier: 2.45,
    lowStaminaThreshold: 0.22,
    exhaustedThreshold: 0.08,
    minSpeedFactorAtZeroStamina: 0.72,
    recoveryDelaySeconds: 0.3,
    terrainDrainImpact: 0.22,
    dashSpeedPulse: 0.05,
    laneY: 356,
  },
  ui: {
    raceTitle: 'ゆるっとシーサイドレース',
    progressDecimals: 0,
    timeDecimals: 2,
  },
  visuals: {
    bob: {
      baseAmplitude: 5,
      dashAmplitude: 9,
      tiredAmplitude: 2,
      baseFrequency: 4.8,
    },
    speedLines: {
      count: 10,
      length: 28,
      dashBoost: 1.8,
    },
    parallax: {
      cloudSpeed: 20,
      hillSpeed: 55,
    },
  },
};
