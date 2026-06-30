// ============================================================
//  MenuScene.js — Pantalla de título "Incubator Chaos"
// ============================================================

import { SCENES, GAME } from '../data/constants.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  create() {
    const W  = GAME.WIDTH;
    const H  = GAME.HEIGHT;
    const cx = W / 2;
    const G  = this.add.graphics();

    // ── Fondo: cielo nocturno Silicon Valley ──
    G.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3e, 0x1a1a3e, 1);
    G.fillRect(0, 0, W, H);

    // Estrellas
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H * 0.6);
      const br = Math.random() > 0.8 ? 0xffffff : 0x8888aa;
      G.fillStyle(br, Math.random() * 0.8 + 0.2);
      G.fillRect(sx, sy, 1, 1);
    }

    // Skyline de San Francisco (silueta)
    G.fillStyle(0x0d0d22, 1);
    const buildings = [
      [0,   H, 60,  120], [55,  H, 40, 100], [90,  H, 30,  80],
      [115, H, 50,  140], [160, H, 35,  90], [190, H, 60, 160],
      [245, H, 25,  70],  [265, H, 45, 110], [305, H, 30,  85],
      [330, H, 55, 130],  [380, H, 40,  95], [415, H, 70, 170],
      [480, H, 30,  80],  [505, H, 50, 120], [550, H, 35,  90],
      [580, H, 65, 150],  [640, H, 28,  75], [663, H, 48, 115],
      [706, H, 38,  95],  [739, H, 55, 135], [789, H, 42, 100],
      [826, H, 70, 180],  [890, H, 35,  85], [920, H, 40, 105],
    ];
    buildings.forEach(([x, y, w, h]) => G.fillRect(x, y - h, w, h));

    // Ventanitas iluminadas en los edificios
    G.fillStyle(0xffd600, 0.6);
    buildings.forEach(([x, y, w, h]) => {
      for (let wy = y - h + 8; wy < y - 10; wy += 14) {
        for (let wx = x + 4; wx < x + w - 4; wx += 10) {
          if (Math.random() > 0.5) G.fillRect(wx, wy, 4, 5);
        }
      }
    });

    // Suelo / carretera
    G.fillStyle(0x111122, 1);
    G.fillRect(0, H - 60, W, 60);
    G.fillStyle(0x222244, 1);
    G.fillRect(0, H - 62, W, 4);
    // Líneas de carretera
    G.fillStyle(0xffd600, 0.4);
    for (let x = 0; x < W; x += 60) G.fillRect(x, H - 32, 35, 3);

    // ── Panel central ──
    G.fillStyle(0x000000, 0.55);
    G.fillRoundedRect(cx - 280, 60, 560, 360, 12);
    G.lineStyle(2, 0x4fc3f7, 0.4);
    G.strokeRoundedRect(cx - 280, 60, 560, 360, 12);

    // Línea decorativa superior del panel
    G.fillStyle(0x4fc3f7, 1);
    G.fillRect(cx - 280, 60, 560, 3);

    // Badge "PIED PIPER" arriba del título
    G.fillStyle(0x4fc3f7, 0.15);
    G.fillRoundedRect(cx - 90, 80, 180, 22, 4);
    G.lineStyle(1, 0x4fc3f7, 0.6);
    G.strokeRoundedRect(cx - 90, 80, 180, 22, 4);
    this.add.text(cx, 91, 'PIED PIPER PRESENTS', {
      fontSize: '9px', color: '#4fc3f7', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

    // ── Título principal ──
    this.add.text(cx, 140, 'INCUBATOR', {
      fontSize: '54px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#4fc3f7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);
    this.add.text(cx, 195, 'CHAOS', {
      fontSize: '54px', color: '#4fc3f7', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(1);

    this.add.text(cx, 245, 'A Silicon Valley Story', {
      fontSize: '14px', color: '#90a4ae', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

    // Separador
    G.lineStyle(1, 0x4fc3f7, 0.3);
    G.lineBetween(cx - 200, 262, cx + 200, 262);

    // Controles rápidos
    const controls = [
      ['WASD', 'Mover a Richard'],
      ['F',    'Reparar / Entregar'],
      ['E',    'Recoger café'],
    ];
    controls.forEach(([key, desc], i) => {
      G.fillStyle(0x4fc3f7, 0.2);
      G.fillRoundedRect(cx - 190, 274 + i * 22, 36, 16, 3);
      this.add.text(cx - 172, 282 + i * 22, key, {
        fontSize: '8px', color: '#4fc3f7', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(1);
      this.add.text(cx - 140, 282 + i * 22, desc, {
        fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setDepth(1);
    });

    // ── Press any key ──
    const startText = this.add.text(cx, 360, '[ PRESIONÁ CUALQUIER TECLA ]', {
      fontSize: '16px', color: '#69f0ae', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);
    this.tweens.add({ targets: startText, alpha: 0.1, duration: 600, yoyo: true, repeat: -1 });

    // ── Logo Hooli (esquina superior derecha) ──
    G.fillStyle(0xffffff, 0.9);
    G.fillRoundedRect(W - 100, 12, 88, 24, 4);
    this.add.text(W - 56, 24, 'hooli', {
      fontSize: '14px', color: '#4fc3f7', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1);

    // Créditos
    this.add.text(cx, H - 12, 'Made with Phaser 3 & ❤  for Pied Piper', {
      fontSize: '9px', color: '#333355', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1);

    // Input — escucha en window para no depender del foco del canvas
    this.time.delayedCall(300, () => {
      const IGNORED = ['Shift','Control','Alt','Meta','Tab','CapsLock'];
      const onKeyNative = (e) => {
        if (IGNORED.includes(e.key)) return;
        window.removeEventListener('keydown', onKeyNative);
        this._startGame();
      };
      window.addEventListener('keydown', onKeyNative);
      this.input.once('pointerdown', () => {
        window.removeEventListener('keydown', onKeyNative);
        this._startGame();
      });
      this.events.once('shutdown', () => window.removeEventListener('keydown', onKeyNative));
    });
  }

  _startGame() {
    // Reset completo del estado pa empezar fresh
    this.registry.set('day',          1);
    this.registry.set('coins',        0);
    this.registry.set('codeLines',    0);
    this.registry.set('difficulty',   1);
    this.registry.set('lives',        3);
    this.registry.set('bankruptcy',   false);
    this.registry.set('serverLevels', [1, 1, 1]);
    this.registry.set('coffeeLvl',    1);
    this.scene.start(SCENES.GAME);
    this.scene.launch(SCENES.UI);
  }
}
