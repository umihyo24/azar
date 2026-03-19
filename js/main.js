/*
 * このファイルの責務:
 * - HTML 上の要素を取得し、Game を起動するエントリポイント。
 * 依存している config / module:
 * - game.js。
 * 将来どこを拡張する想定か:
 * - ローディング画面、デバッグフラグ、URL パラメータによる起動設定。
 */
import { Game } from './game.js';

const canvas = document.querySelector('#game-canvas');
const uiRoot = document.querySelector('#ui-root');

if (!canvas || !uiRoot) {
  throw new Error('Game root elements are missing.');
}

const game = new Game({ canvas, uiRoot });
game.start();
