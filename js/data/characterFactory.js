/*
 * このファイルの責務:
 * - config のキャラ定義を、レースで使う runner オブジェクトへ変換する。
 * 依存している config / module:
 * - characterConfig.js, typeConfig.js, terrainUtils.js, raceConfig.js。
 * 将来どこを拡張する想定か:
 * - CPU runner、複数 runner 編成、交代用ベンチデータの生成。
 */
import { CHARACTER_ASSET_RULE, CHARACTER_CONFIG } from '../config/characterConfig.js';
import { TYPE_TEMPLATES } from '../config/typeConfig.js';
import { AI_PROFILES } from '../config/raceConfig.js';
import { buildTerrainAffinity } from '../utils/terrainUtils.js';

export function getCharacterById(characterId) {
  return CHARACTER_CONFIG.find((character) => character.id === characterId) ?? CHARACTER_CONFIG[0];
}

export function createRunner(characterId, options = {}) {
  const baseCharacter = getCharacterById(characterId);
  const typeTemplate = TYPE_TEMPLATES[baseCharacter.type] ?? TYPE_TEMPLATES.balanced;
  const terrainAffinity = buildTerrainAffinity(baseCharacter);
  const aiProfile = options.aiProfile ? AI_PROFILES[options.aiProfile] : null;

  return {
    id: options.runnerId ?? baseCharacter.id,
    baseId: baseCharacter.id,
    displayName: options.displayName ?? baseCharacter.displayName,
    description: baseCharacter.description,
    type: baseCharacter.type,
    typeLabel: typeTemplate.typeLabel,
    colorType: baseCharacter.colorType,
    baseSpeed: baseCharacter.baseSpeed,
    staminaMax: baseCharacter.staminaMax,
    stamina: baseCharacter.staminaMax,
    staminaDrain: baseCharacter.staminaDrain,
    recoveryRate: baseCharacter.recoveryRate,
    dashMultiplier: baseCharacter.dashMultiplier,
    terrainAffinity,
    progress: 0,
    currentSpeed: 0,
    elapsedTime: 0,
    isFinished: false,
    finishTime: null,
    finishPlace: null,
    laneIndex: options.laneIndex ?? 0,
    controlType: options.controlType ?? 'cpu',
    aiProfile,
    speedTierId: options.speedTierId ?? 'mid',
    desiredSpeedTierId: options.speedTierId ?? 'mid',
    animationPhase: Math.random() * Math.PI * 2,
    lastPlacement: 1,
    spriteKeys: {
      normal: `${baseCharacter.id}_${CHARACTER_ASSET_RULE.states.normal}`,
      dash: `${baseCharacter.id}_${CHARACTER_ASSET_RULE.states.dash}`,
    },
    spritePaths: {
      normal: `${CHARACTER_ASSET_RULE.basePath}/${baseCharacter.id}_${CHARACTER_ASSET_RULE.states.normal}.png`,
      dash: `${CHARACTER_ASSET_RULE.basePath}/${baseCharacter.id}_${CHARACTER_ASSET_RULE.states.dash}.png`,
    },
  };
}
