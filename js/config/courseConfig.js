/*
 * このファイルの責務:
 * - コース全体の距離プリセットと横スクロール区間構成を定義する。
 * 依存している config / module:
 * - RaceScene.js と TitleScene.js から参照される。
 * 将来どこを拡張する想定か:
 * - 分岐、イベント地形、長距離専用ギミック、周回制コースの追加。
 */
export const COURSE_PRESETS = [
  {
    id: 'short',
    displayName: '短距離 / はやかぜ平原',
    summary: '短くて展開が早い。短距離型や早めの仕掛けが活きる。',
    totalDistance: 2200,
    par: 26,
    segments: [
      { id: 's1', terrain: 'grass', start: 0, end: 800, label: '草原', color: '#88d66c', drainMultiplier: 0.98 },
      { id: 's2', terrain: 'dirt', start: 800, end: 1480, label: '土道', color: '#d2a66f', drainMultiplier: 1.05 },
      { id: 's3', terrain: 'flat', start: 1480, end: 2200, label: '平地', color: '#a6d1ff', drainMultiplier: 1.02 },
    ],
  },
  {
    id: 'middle',
    displayName: '中距離 / ひだまりロード',
    summary: '中盤の消耗と終盤の仕掛けが勝負。バランス重視。',
    totalDistance: 3000,
    par: 34,
    segments: [
      { id: 'm1', terrain: 'grass', start: 0, end: 1100, label: '草原', color: '#88d66c', drainMultiplier: 1.0 },
      { id: 'm2', terrain: 'dirt', start: 1100, end: 2050, label: '土道', color: '#d2a66f', drainMultiplier: 1.08 },
      { id: 'm3', terrain: 'flat', start: 2050, end: 3000, label: '平地', color: '#9fd8ff', drainMultiplier: 1.04 },
    ],
  },
  {
    id: 'long',
    displayName: '長距離 / ゆうばえロング',
    summary: '長く厳しい。持久型とスパート型が終盤で伸びやすい。',
    totalDistance: 3900,
    par: 43,
    segments: [
      { id: 'l1', terrain: 'grass', start: 0, end: 1500, label: '草原', color: '#88d66c', drainMultiplier: 1.0 },
      { id: 'l2', terrain: 'dirt', start: 1500, end: 2780, label: '土道', color: '#d2a66f', drainMultiplier: 1.12 },
      { id: 'l3', terrain: 'flat', start: 2780, end: 3900, label: '平地', color: '#9fd8ff', drainMultiplier: 1.05 },
    ],
  },
];

export const DEFAULT_COURSE_ID = 'middle';

export function getCourseById(courseId) {
  return COURSE_PRESETS.find((course) => course.id === courseId) ?? COURSE_PRESETS[1];
}
