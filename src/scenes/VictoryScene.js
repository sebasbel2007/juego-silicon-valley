import { SCENES, GAME } from '../data/constants.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  create() {
    const cx    = GAME.WIDTH / 2;
    const cy    = GAME.HEIGHT / 2;
    const coins = this.registry.get('coins') ?? 0;

    // Fondo degradado dorado
    const G = this.add.graphics();
    G.fillGradientStyle(0x1a1000, 0x1a1000, 0x3a2800, 0x3a2800, 1);
    G.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    G.lineStyle(1, 0xffd600, 0.3);
    for (let y = 0; y < GAME.HEIGHT; y += 20) G.lineBetween(0, y, GAME.WIDTH, y);
    G.fillStyle(0xffd600, 1); G.fillRect(0, 0, GAME.WIDTH, 4);
    G.fillStyle(0xffd600, 1); G.fillRect(0, GAME.HEIGHT - 4, GAME.WIDTH, 4);

    // Confetti particles (simple rects de colores)
    const colors = [0xff1744, 0x00e676, 0x4fc3f7, 0xffd600, 0xf06292];
    for (let i = 0; i < 60; i++) {
      G.fillStyle(Phaser.Utils.Array.GetRandom(colors), 0.8);
      G.fillRect(
        Phaser.Math.Between(0, GAME.WIDTH),
        Phaser.Math.Between(0, GAME.HEIGHT),
        Phaser.Math.Between(4, 10),
        Phaser.Math.Between(4, 10),
      );
    }

    // Panel central
    G.fillStyle(0x000000, 0.6);
    G.fillRoundedRect(cx - 300, cy - 140, 600, 280, 12);
    G.lineStyle(3, 0xffd600, 1);
    G.strokeRoundedRect(cx - 300, cy - 140, 600, 280, 12);

    // Título
    this.add.text(cx, cy - 100, '¡VICTORIA!', {
      fontSize: '56px', color: '#ffd600', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 44, '¡Pied Piper sobrevivió 5 días!', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, cy, `Monedas finales: ${coins.toLocaleString()}`, {
      fontSize: '18px', color: '#ffd600', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 40, '"Always blue." — Richard Hendricks', {
      fontSize: '12px', color: '#90a4ae', fontFamily: 'monospace',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Botón volver
    const btn = this.add.text(cx, cy + 100, '[ VOLVER AL MENÚ ]', {
      fontSize: '18px', color: '#69f0ae', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout',  () => btn.setColor('#69f0ae'));
    btn.on('pointerdown', () => {
      this.registry.set('day',        1);
      this.registry.set('coins',      0);
      this.registry.set('difficulty', 1);
      this.registry.set('lives',      3);
      this.registry.set('bankruptcy', false);
      this.registry.set('serverLevels', [1, 1, 1]);
      this.registry.set('coffeeLvl',    1);
      this.scene.start(SCENES.MENU);
    });

    this.tweens.add({ targets: btn, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // Animación de pulso en el título
    const title = this.children.list.find(c => c.text === '¡VICTORIA!');
    if (title) this.tweens.add({ targets: title, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });
  }
}
