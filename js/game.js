/*
 * このファイルの責務:
 * - ゲーム全体の共有状態、Scene 構築、メインループを管理する。
 * 依存している config / module:
 * - gameConfig.js, renderer.js, input.js, sceneManager.js, scenes/*。
 * 将来どこを拡張する想定か:
 * - サウンド、永続セーブ、ローディング、グローバル難易度設定の追加。
 */
import { GAME_CONFIG } from './config/gameConfig.js';
import { Renderer } from './renderer.js';
import { InputController } from './input.js';
import { SceneManager } from './sceneManager.js';
import { TitleScene } from './scenes/TitleScene.js';
import { RaceScene } from './scenes/RaceScene.js';
import { ResultScene } from './scenes/ResultScene.js';

export class Game {
  constructor({ canvas, uiRoot }) {
    this.canvas = canvas;
    this.uiRoot = uiRoot;
    this.renderer = new Renderer(canvas);
    this.input = new InputController();
    this.sceneManager = new SceneManager(this);
    this.state = {
      selectedCharacterId: 'normal',
      lastResult: null,
      activeRunnerId: 'normal',
    };

    this.lastFrameTime = performance.now();
    this.boundLoop = this.loop.bind(this);

    this.titleScene = new TitleScene(this);
    this.raceScene = new RaceScene(this);
    this.resultScene = new ResultScene(this);
  }

  start() {
    this.canvas.width = GAME_CONFIG.canvas.width;
    this.canvas.height = GAME_CONFIG.canvas.height;
    this.sceneManager.changeScene(this.titleScene);
    requestAnimationFrame(this.boundLoop);
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = timestamp;

    this.sceneManager.update(deltaTime);
    this.renderer.clear();
    this.sceneManager.render(this.renderer);

    requestAnimationFrame(this.boundLoop);
  }

  showTitle() {
    this.sceneManager.changeScene(this.titleScene);
  }

  startRace() {
    this.sceneManager.changeScene(this.raceScene);
  }

  showResult(result) {
    this.state.lastResult = result;
    this.sceneManager.changeScene(this.resultScene);
  }
}
