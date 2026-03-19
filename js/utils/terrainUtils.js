/*
 * このファイルの責務:
 * - 地形適性の合成、ランク変換、距離から現在区間を引く処理をまとめる。
 * 依存している config / module:
 * - typeConfig.js, courseConfig.js, characterFactory.js, scene modules。
 * 将来どこを拡張する想定か:
 * - 天候補正、状態異常補正、複数 runner 比較ロジックの追加。
 */
import { TYPE_TEMPLATES } from '../config/typeConfig.js';

export function buildTerrainAffinity(character) {
  const typeTemplate = TYPE_TEMPLATES[character.type] ?? TYPE_TEMPLATES.balanced;

  return {
    ...typeTemplate.terrainAffinity,
    ...character.terrainAffinity,
  };
}

export function getTerrainRank(value) {
  if (value >= 1.15) return 'S';
  if (value >= 1.05) return 'A';
  if (value >= 0.95) return 'B';
  if (value >= 0.85) return 'C';
  return 'D';
}

export function getSegmentForDistance(course, distance) {
  return (
    course.segments.find((segment) => distance >= segment.start && distance < segment.end) ??
    course.segments[course.segments.length - 1]
  );
}

export function getTerrainAffinityForSegment(terrainAffinity, terrain) {
  return terrainAffinity[terrain] ?? 1;
}
