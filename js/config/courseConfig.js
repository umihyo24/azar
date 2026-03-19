/*
 * このファイルの責務:
 * - レースコース全体の区間構成と地形情報を定義する。
 * 依存している config / module:
 * - RaceScene.js と terrainUtils.js から参照される。
 * 将来どこを拡張する想定か:
 * - 複数コース、天候、障害物、分岐区間、周回制への対応。
 */
export const COURSE_CONFIG = {
  id: 'coastal-breeze',
  displayName: 'しおかぜショート',
  totalDistance: 1380,
  segments: [
    {
      id: 'meadow-start',
      terrain: 'grass',
      start: 0,
      end: 520,
      label: '草地ストレート',
      color: '#85d46d',
      drainMultiplier: 0.98,
    },
    {
      id: 'warm-sand',
      terrain: 'sand',
      start: 520,
      end: 980,
      label: 'さらさら砂地',
      color: '#e7c87f',
      drainMultiplier: 1.12,
    },
    {
      id: 'tidal-splash',
      terrain: 'water',
      start: 980,
      end: 1380,
      label: 'ちゃぷちゃぷ浅瀬',
      color: '#73bff2',
      drainMultiplier: 1.05,
    },
  ],
};
