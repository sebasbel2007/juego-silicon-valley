import { SCENES, GAME } from '../data/constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.GAME_OVER }); }

  create() {
    const cx       = GAME.WIDTH / 2;
    const cy       = GAME.HEIGHT / 2;
    const bankrupt = this.registry.get('bankruptcy') ?? false;
    const coins    = this.registry.get('coins') ?? 0;
    const day      = this.registry.get('day')   ?? 1;

    this.add.rectangle(cx, cy, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.92);

    this.add.text(cx, cy - 80, bankrupt ? 'BANCARROTA' : 'GAME OVER', {
      fontSize: '52px',
      color: bankrupt ? '#ffd600' : '#ef5350',
      fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20,
      bankrupt ? '¡Pied Piper se quedó sin fondos!' : '¡Richard colapsó de estrés!', {
      fontSize: '16px', color: '#ffb74d', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 30, `Día: ${day}   |   Monedas: ${coins.toLocaleString()}`, {
      fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const btn = this.add.text(cx, cy + 100, '[ VOLVER AL MENÚ ]', {
      fontSize: '16px', color: '#69f0ae', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover',  () => btn.setColor('#ffffff'));
    btn.on('pointerout',   () => btn.setColor('#69f0ae'));
    btn.on('pointerdown',  () => {
      this.registry.set('day',        1);
      this.registry.set('coins',      0);
      this.registry.set('difficulty', 1);
      this.registry.set('lives',      3);
      this.registry.set('bankruptcy', false);
      this.scene.start(SCENES.MENU);
    });

    this.tweens.add({ targets: btn, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
  }
}
