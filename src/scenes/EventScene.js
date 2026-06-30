// ============================================================
//  EventScene.js — Ventana emergente de eventos aleatorios
//
//  Se lanza encima de GameScene (que queda pausada).
//  Recibe el callback onComplete(result) como dato de init.
//  result = { coins, stress, difficulty } o null si se cierra.
// ============================================================

import { SCENES, GAME } from '../data/constants.js';

// Catálogo de eventos — amplía este array para agregar más
const EVENT_CATALOG = [
  {
    id: 'gavin_lawsuit',
    title: 'BREAKING NEWS',
    body: 'Gavin Belson te demanda por\n derechos de autor sobre el algoritmo.',
    options: [
      {
        label: 'A) Pagar abogados',
        desc: '-3.000 coins',
        result: { coins: -3000, stress: 5, difficulty: 0 },
      },
      {
        label: 'B) Gilfoyle hackea Hooli',
        desc: '+Dificultad pero x2 ingresos',
        result: { coins: 1000, stress: 20, difficulty: 0.3 },
      },
    ],
  },
  {
    id: 'techcrunch',
    title: 'TECHCRUNCH DISRUPT',
    body: '¡Pied Piper fue seleccionado\n para el demo day!',
    options: [
      {
        label: 'A) Presentar en vivo',
        desc: '+2.000 coins, +estrés',
        result: { coins: 2000, stress: 30, difficulty: 0 },
      },
      {
        label: 'B) Rechazar (enfocarse)',
        desc: '-estrés, -coins',
        result: { coins: -500, stress: -20, difficulty: 0 },
      },
    ],
  },
  {
    id: 'big_head_promotion',
    title: 'BIG HEAD SITUATION',
    body: 'Big Head fue ascendido por error\n en Hooli. Te ofrece consejos "útiles".',
    options: [
      {
        label: 'A) Escucharlo',
        desc: 'Resultado aleatorio (suerte)',
        result: null, // se resuelve en runtime
        randomCoins: true,
      },
      {
        label: 'B) Ignorarlo',
        desc: 'Sin cambios',
        result: { coins: 0, stress: 0, difficulty: 0 },
      },
    ],
  },
  {
    id: 'erlich_investment',
    title: 'OFERTA DE ERLICH',
    body: '"Necesito que me devuelvas el\n5% de equity o te saco de la incubadora."',
    options: [
      {
        label: 'A) Ceder el equity',
        desc: '-dificultad, -coins',
        result: { coins: -800, stress: -15, difficulty: -0.1 },
      },
      {
        label: 'B) Negarte',
        desc: '+estrés pero guardas equity',
        result: { coins: 0, stress: 25, difficulty: 0.1 },
      },
    ],
  },
];

export default class EventScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.EVENT });
  }

  // init() recibe los datos pasados por scene.launch(SCENES.EVENT, data)
  init(data) {
    this.onComplete = data?.onComplete ?? (() => {});
  }

  create() {
    const event = Phaser.Utils.Array.GetRandom(EVENT_CATALOG);
    this._buildPopup(event);
  }

  _buildPopup(event) {
    const cx  = GAME.WIDTH  / 2;
    const cy  = GAME.HEIGHT / 2;
    const w   = 500;
    const h   = 260;

    // Overlay semitransparente
    this.add.rectangle(cx, cy, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.7).setDepth(0);

    // Panel
    this.add.rectangle(cx, cy, w, h, 0x1a1a2e).setDepth(1);
    this.add.rectangle(cx, cy, w, h, 0x4fc3f7, 0).setDepth(1)
      .setStrokeStyle(2, 0x4fc3f7);

    // Título
    this.add.text(cx, cy - h / 2 + 20, `⚡ ${event.title}`, {
      fontSize: '14px', color: '#ffd600', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    // Cuerpo
    this.add.text(cx, cy - 30, event.body, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5).setDepth(2);

    // Botones de opciones
    event.options.forEach((opt, i) => {
      const btnY = cy + 50 + i * 50;
      const btn = this.add.text(cx, btnY, opt.label, {
        fontSize: '13px', color: '#4fc3f7', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

      this.add.text(cx, btnY + 16, opt.desc, {
        fontSize: '9px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(2);

      btn.on('pointerover',  () => btn.setColor('#ffffff'));
      btn.on('pointerout',   () => btn.setColor('#4fc3f7'));
      btn.on('pointerdown',  () => this._choose(opt.result));
    });
  }

  _choose(result) {
    // Resolver resultado aleatorio en runtime
    if (!result) {
      result = { coins: Phaser.Math.Between(-1000, 3000), stress: 0, difficulty: 0 };
    }
    this.scene.stop();
    this.onComplete(result);
  }
}
