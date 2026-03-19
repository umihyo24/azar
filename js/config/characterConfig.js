/*
 * このファイルの責務:
 * - プレイアブルキャラの基本性能と表示情報を定義する。
 * 依存している config / module:
 * - typeConfig.js の TYPE_TEMPLATES と characterFactory.js で合成される。
 * 将来どこを拡張する想定か:
 * - キャラ追加、スキル、レア度、成長パラメータ、交代向けタグの追加。
 */
export const CHARACTER_CONFIG = [
  {
    id: 'normal',
    displayName: 'のーまるあざらし',
    description: 'あつかいやすい標準型。草地で安定し、最後まで走り切りやすい。',
    type: 'balanced',
    colorType: '#6ab7ff',
    baseSpeed: 58,
    staminaMax: 112,
    staminaDrain: 8.8,
    recoveryRate: 13.4,
    dashMultiplier: 1.42,
    terrainAffinity: {
      grass: 1.02,
      water: 0.95,
    },
  },
  {
    id: 'speed',
    displayName: 'すぴーどあざらし',
    description: '最速候補。ダッシュは強烈だが、勢い任せだとスタミナ管理が難しい。',
    type: 'sprinter',
    colorType: '#ff8f70',
    baseSpeed: 64,
    staminaMax: 96,
    staminaDrain: 11.8,
    recoveryRate: 11.1,
    dashMultiplier: 1.58,
    terrainAffinity: {
      grass: 1.08,
      sand: 0.88,
      water: 0.84,
    },
  },
  {
    id: 'sanma',
    displayName: 'さんまあざらし',
    description: '潮の流れが好きなテクニカル型。水場に少し強く、軽快に伸びる。',
    type: 'coastal',
    colorType: '#73c6b9',
    baseSpeed: 61,
    staminaMax: 102,
    staminaDrain: 10.2,
    recoveryRate: 12.2,
    dashMultiplier: 1.5,
    terrainAffinity: {
      grass: 1.01,
      sand: 0.93,
      water: 1.14,
    },
  },
];

export const CHARACTER_ASSET_RULE = {
  basePath: './assets/characters',
  states: {
    normal: 'normal',
    dash: 'charge',
  },
  namingExample: 'seal_[type]_[state].png',
};
