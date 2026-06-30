// ============================================================
//  main.js — Punto de entrada de Phaser 3
//  Configura el motor, físicas y registra todas las escenas.
// ============================================================

import { GAME, SCENES } from './data/constants.js';

// Escenas — se importan de forma lazy para mantener main.js limpio
import BootScene       from './scenes/BootScene.js';
import PreloadScene    from './scenes/PreloadScene.js';
import MenuScene       from './scenes/MenuScene.js';
import GameScene       from './scenes/GameScene.js';
import UIScene         from './scenes/UIScene.js';
import ManagementScene from './scenes/ManagementScene.js';
import EventScene      from './scenes/EventScene.js';
import GameOverScene   from './scenes/GameOverScene.js';
import VictoryScene    from './scenes/VictoryScene.js';

// ------------------------------------------------------------------
//  Configuración del juego
//  Arcade Physics: liviana y perfecta para colisiones 2D top-down.
//  pixelArt: true → Phaser desactiva el suavizado para sprites pixelados.
// ------------------------------------------------------------------
const config = {
  type: Phaser.AUTO,            // WebGL si disponible, Canvas como fallback
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#1a1a2e',
  pixelArt: true,               // crítico para estética pixel art
  roundPixels: true,            // evita el "shimmer" en movimiento

  // El canvas se inserta dentro del <body> automáticamente
  parent: document.body,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },        // vista aérea → sin gravedad
      debug: false,             // cambiar a true para ver hitboxes en desarrollo
    },
  },

  // El orden importa: Boot y Preload corren secuencialmente al inicio.
  // GameScene y UIScene corren en paralelo (UI superpuesto al juego).
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    UIScene,          // HUD — corre simultáneamente sobre GameScene
    ManagementScene,
    EventScene,
    GameOverScene,
    VictoryScene,       // Pop-ups — se lanza encima de cualquier escena activa
  ],
};

// ------------------------------------------------------------------
//  Inicializar el juego
//  La instancia se guarda en window para debug desde la consola del browser.
// ------------------------------------------------------------------
const game = new Phaser.Game(config);

if (typeof process === 'undefined' || process?.env?.NODE_ENV !== 'production') {
  window.__INCUBATOR_CHAOS__ = game;
}

export default game;
