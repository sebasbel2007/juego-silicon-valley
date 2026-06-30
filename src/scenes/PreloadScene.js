// ============================================================
//  PreloadScene.js — Carga todos los assets del juego
//  Muestra una barra de progreso mientras carga.
//  Los load.image/atlas comentados son los que debes agregar
//  cuando tengas los sprites finales en /assets/
// ============================================================

import { SCENES, GAME } from '../data/constants.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload() {
    this._buildProgressBar();

    // ----------------------------------------------------------
    //  Assets reales — descomenta cuando estén en /assets/
    // ----------------------------------------------------------

    // this.load.image('richard',      'assets/sprites/richard.png');
    // this.load.spritesheet('richard_walk', 'assets/sprites/richard_walk.png', { frameWidth: 32, frameHeight: 48 });
    // this.load.image('erlich',       'assets/sprites/erlich.png');
    // this.load.image('gilfoyle',     'assets/sprites/gilfoyle.png');
    // this.load.image('dinesh',       'assets/sprites/dinesh.png');
    // this.load.image('jared',        'assets/sprites/jared.png');
    // this.load.image('jian_yang',    'assets/sprites/jian_yang.png');
    // this.load.image('server_ok',    'assets/sprites/server_ok.png');
    // this.load.image('server_fire',  'assets/sprites/server_fire.png');
    // this.load.image('coffee',       'assets/sprites/coffee.png');
    // this.load.image('energy_drink', 'assets/sprites/energy_drink.png');
    // this.load.image('bug_icon',     'assets/sprites/bug_icon.png');
    // this.load.tilemapTiledJSON('incubator_map', 'assets/tilemaps/incubator.json');
    // this.load.audio('bgm_day',      'assets/audio/bgm_day.ogg');
    // this.load.audio('sfx_vomit',    'assets/audio/vomit.ogg');
    // this.load.audio('sfx_fix',      'assets/audio/fix_server.ogg');
    // this.load.audio('sfx_coffee',   'assets/audio/coffee.ogg');
  }

  create() {
    this.scene.start(SCENES.MENU);
  }

  // ------------------------------------------------------------------
  //  Dibuja una barra de progreso centrada en pantalla
  // ------------------------------------------------------------------
  _buildProgressBar() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;
    const barW = 320;
    const barH = 20;

    const bg = this.add.rectangle(cx, cy, barW + 4, barH + 4, 0x333333);
    const bar = this.add.rectangle(cx - barW / 2, cy, 0, barH, 0x4fc3f7)
      .setOrigin(0, 0.5);

    this.add.text(cx, cy - 30, 'Loading Incubator Chaos...', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = barW * value;
    });
  }
}
