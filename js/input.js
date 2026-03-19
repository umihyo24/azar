/*
 * このファイルの責務:
 * - UI ボタンやキャンバス補助入力で使う押下状態を単純な API で扱えるようにする。
 * 依存している config / module:
 * - game.js と RaceScene.js。
 * 将来どこを拡張する想定か:
 * - キーボード操作、ゲームパッド、複数ボタンのアクション入力追加。
 */
export class InputController {
  constructor() {
    this.actions = new Map();
  }

  setActionState(actionName, isPressed) {
    this.actions.set(actionName, Boolean(isPressed));
  }

  isPressed(actionName) {
    return this.actions.get(actionName) ?? false;
  }

  clear() {
    this.actions.clear();
  }
}
