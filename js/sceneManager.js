/*
 * このファイルの責務:
 * - 現在の scene を保持し、切り替えと update / render の呼び出しを仲介する。
 * 依存している config / module:
 * - game.js から注入される scene インスタンス群。
 * 将来どこを拡張する想定か:
 * - トランジション演出、非同期ロード画面、履歴管理の追加。
 */
export class SceneManager {
  constructor(game) {
    this.game = game;
    this.currentScene = null;
  }

  changeScene(scene) {
    if (this.currentScene?.exit) {
      this.currentScene.exit();
    }

    this.currentScene = scene;
    if (this.currentScene?.enter) {
      this.currentScene.enter();
    }
  }

  update(deltaTime) {
    this.currentScene?.update?.(deltaTime);
  }

  render(renderer) {
    this.currentScene?.render?.(renderer);
  }
}
