/*
 * このファイルの責務:
 * - 2D 横スクロールレースの速度段階、AI 性格、フィールド人数、カメラ挙動などを管理する。
 * 依存している config / module:
 * - RaceScene.js, TitleScene.js, characterFactory.js。
 * 将来どこを拡張する想定か:
 * - コース固有ルール、天候、イベント、スキル、難易度別 AI 調整の追加。
 */
export const SPEED_TIERS = {
  low: {
    id: 'low',
    label: '低速',
    shortLabel: 'LOW',
    speedMultiplier: 0.8,
    staminaDrain: 1.4,
    recoveryBonus: 3.8,
    auraColor: '#84d7ff',
  },
  mid: {
    id: 'mid',
    label: '中速',
    shortLabel: 'MID',
    speedMultiplier: 1.0,
    staminaDrain: 3.8,
    recoveryBonus: 0.8,
    auraColor: '#6ecb8b',
  },
  high: {
    id: 'high',
    label: '高速',
    shortLabel: 'HIGH',
    speedMultiplier: 1.16,
    staminaDrain: 7.8,
    recoveryBonus: -1.8,
    auraColor: '#ffd26d',
  },
  spurt: {
    id: 'spurt',
    label: 'スパート',
    shortLabel: 'SPURT',
    speedMultiplier: 1.34,
    staminaDrain: 13.6,
    recoveryBonus: -4.8,
    auraColor: '#ff8a5b',
  },
};

export const SPEED_TIER_ORDER = ['low', 'mid', 'high', 'spurt'];

export const AI_PROFILES = {
  short: {
    id: 'short',
    displayName: '短距離型',
    openingBias: 0.22,
    conserveBias: -0.18,
    spurtTrigger: 0.2,
    preferredStartTier: 'high',
    preferredMidTier: 'mid',
    preferredEndTier: 'high',
    desperationTier: 'low',
  },
  endurance: {
    id: 'endurance',
    displayName: '持久型',
    openingBias: -0.14,
    conserveBias: 0.24,
    spurtTrigger: 0.28,
    preferredStartTier: 'mid',
    preferredMidTier: 'mid',
    preferredEndTier: 'spurt',
    desperationTier: 'mid',
  },
  balanced: {
    id: 'balanced',
    displayName: 'バランス型',
    openingBias: 0.04,
    conserveBias: 0,
    spurtTrigger: 0.22,
    preferredStartTier: 'mid',
    preferredMidTier: 'high',
    preferredEndTier: 'high',
    desperationTier: 'low',
  },
  closer: {
    id: 'closer',
    displayName: 'スパート型',
    openingBias: -0.22,
    conserveBias: 0.18,
    spurtTrigger: 0.16,
    preferredStartTier: 'mid',
    preferredMidTier: 'mid',
    preferredEndTier: 'spurt',
    desperationTier: 'mid',
  },
};

export const CPU_RUNNER_TEMPLATES = [
  { slotId: 'cpu-1', nickname: 'ブレイズ', characterId: 'speed', aiProfile: 'short' },
  { slotId: 'cpu-2', nickname: 'マラソ', characterId: 'normal', aiProfile: 'endurance' },
  { slotId: 'cpu-3', nickname: 'ミズモ', characterId: 'sanma', aiProfile: 'balanced' },
  { slotId: 'cpu-4', nickname: 'ラストン', characterId: 'speed', aiProfile: 'closer' },
];

export const RACE_UI_CONFIG = {
  fieldSize: 5,
  laneYs: [188, 244, 300, 356, 412],
  cameraLead: 160,
  cameraLag: 0.12,
  viewportPadding: 96,
  finishFlashDistance: 260,
};

export const PLAYER_CONTROL_HINTS = [
  '1:低速  2:中速  3:高速  4:スパート',
  '中盤までは温存、終盤に踏むと逆転しやすい',
];
