/*
 * このファイルの責務:
 * - UI ボタンやキーボード入力の押下状態を単純な API で扱えるようにする。
 * 依存している config / module:
 * - game.js と RaceScene.js。
 * 将来どこを拡張する想定か:
 * - ゲームパッド、複数アクション、キーコンフィグの追加。
 */
export class InputController {
  constructor() {
    this.actions = new Map();
    this.boundKeyDown = null;
    this.boundKeyUp = null;
  }

  setActionState(actionName, isPressed) {
    this.actions.set(actionName, Boolean(isPressed));
  }

  isPressed(actionName) {
    return this.actions.get(actionName) ?? false;
  }

  bindKeyboard(keyMap) {
    this.unbindKeyboard();

    this.boundKeyDown = (event) => {
      const actionName = keyMap[event.key];
      if (!actionName) return;
      this.setActionState(actionName, true);
    };

    this.boundKeyUp = (event) => {
      const actionName = keyMap[event.key];
      if (!actionName) return;
      this.setActionState(actionName, false);
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  unbindKeyboard() {
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown);
    }
    if (this.boundKeyUp) {
      window.removeEventListener('keyup', this.boundKeyUp);
    }
    this.boundKeyDown = null;
    this.boundKeyUp = null;
  }

  clear() {
    this.actions.clear();
  }
}
