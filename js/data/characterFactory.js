/*
 * このファイルの責務:
 * - config のキャラ定義を、レースで使う runner オブジェクトへ変換する。
 * 依存している config / module:
 * - characterConfig.js, typeConfig.js, terrainUtils.js。
 * 将来どこを拡張する想定か:
 * - CPU runner、複数 runner 編成、交代用ベンチデータの生成。
 */
import { CHARACTER_ASSET_RULE, CHARACTER_CONFIG } from '../config/characterConfig.js';
import { TYPE_TEMPLATES } from '../config/typeConfig.js';
import { buildTerrainAffinity } from '../utils/terrainUtils.js';

export function getCharacterById(characterId) {
  return CHARACTER_CONFIG.find((character) => character.id === characterId) ?? CHARACTER_CONFIG[0];
}

export function createRunner(characterId) {
  const baseCharacter = getCharacterById(characterId);
  const typeTemplate = TYPE_TEMPLATES[baseCharacter.type] ?? TYPE_TEMPLATES.balanced;
  const terrainAffinity = buildTerrainAffinity(baseCharacter);

  return {
    id: baseCharacter.id,
    displayName: baseCharacter.displayName,
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
    isDashing: false,
    isFinished: false,
    finishTime: null,
    recoveryCooldown: 0,
    animationPhase: Math.random() * Math.PI * 2,
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
