/*
 * このファイルの責務:
 * - キャラクター type ごとの標準傾向を定義し、個別キャラ設定のベースにする。
 * 依存している config / module:
 * - characterConfig.js が type の既定値参照に使用する。
 * 将来どこを拡張する想定か:
 * - 新タイプ追加、タイプ固有スキル、UI 表示色や演出補正の追加。
 */
export const TYPE_TEMPLATES = {
  balanced: {
    typeLabel: 'バランス',
    terrainAffinity: {
      grass: 1.0,
      sand: 0.98,
      water: 0.97,
    },
  },
  sprinter: {
    typeLabel: 'スプリント',
    terrainAffinity: {
      grass: 1.04,
      sand: 0.9,
      water: 0.88,
    },
  },
  coastal: {
    typeLabel: 'コースタル',
    terrainAffinity: {
      grass: 0.98,
      sand: 0.96,
      water: 1.08,
    },
  },
};
