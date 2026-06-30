// ============================================================
//  ManagementScene.js — Fin de Jornada
// ============================================================

import { SCENES, GAME, DIFFICULTY, SERVER_LEVELS, COFFEE_LEVELS, SHOP } from '../data/constants.js';

const CARD_W   = 150;
const CARD_H   = 130;
const CARD_GAP = 12;
const CARDS_Y  = 300;

const SERVER_NAMES  = ['PIED PIPER', 'NUCLEUS', 'NUCLEUS 2'];
const SERVER_COLORS = [0x1565c0, 0x1a237e, 0x0d1b6e];
const SERVER_BORDER = [0x4fc3f7, 0x64b5f6, 0x90caf9];

export default class ManagementScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.MANAGEMENT }); }

  create() {
    this.coins        = this.registry.get('coins')         ?? 0;
    this.codeLines    = this.registry.get('codeLines')     ?? 0;
    this.difficulty   = this.registry.get('difficulty')    ?? 1;
    this.serverLevels = (this.registry.get('serverLevels') ?? [1, 1, 1]).slice();
    this.coffeeLvl    = this.registry.get('coffeeLvl')     ?? 1;
    this.serverCount  = this.registry.get('serverCount')   ?? 1;
    this.coffeeCount  = this.registry.get('coffeeCount')   ?? 1;
    this._selected    = null;
    this._upgrades    = this._buildUpgradeList();

    this._buildBackground();
    this._buildDaySummary();
  }

  _buildUpgradeList() {
    const list = [];

    // Mejorar nivel de cada servidor (si no es max)
    for (let i = 0; i < 3; i++) {
      const lvl   = this.serverLevels[i];
      const stats = SERVER_LEVELS[lvl];
      if (!stats.upgradeCost) continue;
      const next = SERVER_LEVELS[lvl + 1];
      list.push({
        key: `server_upgrade_${i}`, icon: 'SRV',
        title: `Mejorar ${SERVER_NAMES[i]}`,
        desc: `LVL${lvl} a LVL${lvl+1}\nFalla menos\n+${next.coinsReward} coins`,
        cost: stats.upgradeCost, color: SERVER_COLORS[i], border: SERVER_BORDER[i],
        serverId: i, newLvl: lvl + 1,
      });
    }

    // Mejorar nivel cafetera
    const coffeeStats = COFFEE_LEVELS[this.coffeeLvl];
    if (coffeeStats.upgradeCost) {
      const nextC = COFFEE_LEVELS[this.coffeeLvl + 1];
      list.push({
        key: 'coffee_upgrade', icon: 'CFE',
        title: 'Mejorar Cafetera',
        desc: `LVL${this.coffeeLvl} a LVL${this.coffeeLvl+1}\nCooldown: ${nextC.cooldown/1000}s\nMas rapido`,
        cost: coffeeStats.upgradeCost, color: 0x4a2800, border: 0xffb74d,
        newCoffeeLvl: this.coffeeLvl + 1,
      });
    }

    // Comprar cafetera nueva (max 3)
    if (this.coffeeCount < 3) {
      list.push({
        key: 'buy_coffee', icon: '+CF',
        title: 'Nueva Cafetera',
        desc: `Agrega cafetera\nal mostrador\n(${this.coffeeCount}/3 actual)`,
        cost: SHOP.BUY_COFFEE_COST, color: 0x3a1800, border: 0xff9800,
        buyCoffee: true,
      });
    }

    // Marketing
    list.push({
      key: 'marketing', icon: 'MKT',
      title: 'Marketing',
      desc: `+${DIFFICULTY.HYPE_COIN_MULTIPLIER}x monedas\nBUGS x${DIFFICULTY.MARKETING_BUG_MULTIPLIER}`,
      cost: 400, color: 0x7f1a00, border: 0xff7043,
    });

    return list;
  }

  _buildBackground() {
    const G = this.add.graphics();
    G.fillStyle(0x050510, 1);
    G.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    G.lineStyle(1, 0x0d2240, 0.6);
    for (let y = 0; y < GAME.HEIGHT; y += 18) G.lineBetween(0, y, GAME.WIDTH, y);
    G.fillStyle(0x4fc3f7, 1); G.fillRect(0, 0, GAME.WIDTH, 3);
    G.fillStyle(0xffd600, 1); G.fillRect(0, GAME.HEIGHT - 3, GAME.WIDTH, 3);
  }

  _buildDaySummary() {
    const cx    = GAME.WIDTH / 2;
    const cy    = GAME.HEIGHT / 2;
    const day   = this.registry.get('day') ?? 1;
    const lives = this.registry.get('lives') ?? 3;

    const G = this.add.graphics().setDepth(10);
    G.fillStyle(0x000000, 0.7);
    G.fillRoundedRect(cx - 240, cy - 130, 480, 260, 12);
    G.lineStyle(3, 0x4fc3f7, 1);
    G.strokeRoundedRect(cx - 240, cy - 130, 480, 260, 12);

    this.add.text(cx, cy - 100, `DIA ${day} COMPLETADO`, {
      fontSize: '26px', color: '#4fc3f7', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(11);

    const stats = [
      { label: 'Monedas ganadas',  value: this.coins.toLocaleString(),      color: '#ffd600' },
      { label: 'Lineas de codigo', value: this.codeLines.toLocaleString(),  color: '#69f0ae' },
      { label: 'Vidas restantes',  value: '❤'.repeat(lives) + '♡'.repeat(Math.max(0, 3-lives)), color: '#ef5350' },
      { label: 'Dificultad',       value: `x${this.difficulty.toFixed(1)}`, color: '#ffb74d' },
    ];

    stats.forEach(({ label, value, color }, i) => {
      this.add.text(cx - 160, cy - 44 + i * 36, label + ':', {
        fontSize: '13px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setDepth(11);
      this.add.text(cx + 160, cy - 44 + i * 36, value, {
        fontSize: '14px', color, fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
      }).setOrigin(1, 0.5).setDepth(11);
    });

    const hint = this.add.text(cx, cy + 108, 'Cargando mejoras...', {
      fontSize: '11px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets: hint, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [G, hint], alpha: 0, duration: 400,
        onComplete: () => {
          this.children.list
            .filter(c => c.depth === 11 || c.depth === 10)
            .forEach(c => c.destroy());
          this._buildHeader();
          this._buildCards();
          this._buildConfirmButton();
        },
      });
    });
  }

  _buildHeader() {
    const cx = GAME.WIDTH / 2;

    this.add.text(cx, 30, 'FIN DE JORNADA', {
      fontSize: '26px', color: '#4fc3f7', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5);

    // Estado servidores
    const lvlColors = { 1: '#aaaaaa', 2: '#4fc3f7', 3: '#ffd600' };
    const srvLabel = Array.from({ length: this.serverCount }, (_, i) =>
      `${SERVER_NAMES[i]}: LVL${this.serverLevels[i]}`).join('  |  ');
    this.add.text(cx, 62, srvLabel, {
      fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(cx, 78, `Cafeteras: ${this.coffeeCount}/3  |  Cafetera LVL${this.coffeeLvl}  |  Servidores: ${this.serverCount}/3`, {
      fontSize: '9px', color: '#ffb74d', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Panel recursos
    this.add.rectangle(cx, 104, 380, 32, 0x0a1a2a, 0.9).setStrokeStyle(1, 0x4fc3f7);
    this.add.text(cx - 80, 104, 'MONEDAS:', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(cx - 10, 104, `${this.coins}`, {
      fontSize: '13px', color: '#ffd600', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);
    this.add.text(cx + 80, 104, 'LINEAS:', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(cx + 130, 104, `${this.codeLines}`, {
      fontSize: '13px', color: '#69f0ae', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(cx, 130, 'Clic en una carta para seleccionar  |  ESPACIO para saltar', {
      fontSize: '9px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  _buildCards() {
    const count  = this._upgrades.length;
    const totalW = count * CARD_W + (count - 1) * CARD_GAP;
    const startX = (GAME.WIDTH - totalW) / 2;
    this._cardObjects = {};

    this._upgrades.forEach((upg, i) => {
      const cx = startX + i * (CARD_W + CARD_GAP) + CARD_W / 2;
      const cy = CARDS_Y;
      const canAfford = this.coins >= upg.cost;

      const container = this.add.container(cx, cy);
      const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, upg.color, canAfford ? 0.85 : 0.25)
        .setStrokeStyle(2, upg.border);
      const iconTxt = this.add.text(0, -44, upg.icon, { fontSize: '22px' })
        .setOrigin(0.5).setAlpha(canAfford ? 1 : 0.35);
      const titleTxt = this.add.text(0, -16, upg.title, {
        fontSize: '10px', color: canAfford ? '#ffffff' : '#555555',
        fontFamily: 'monospace', align: 'center', wordWrap: { width: CARD_W - 14 },
      }).setOrigin(0.5);
      const descTxt = this.add.text(0, 14, upg.desc, {
        fontSize: '8px', color: canAfford ? '#aaaaaa' : '#444444',
        fontFamily: 'monospace', align: 'center', wordWrap: { width: CARD_W - 18 },
      }).setOrigin(0.5);
      const costTxt = this.add.text(0, 54, `- ${upg.cost} monedas`, {
        fontSize: '9px', color: canAfford ? '#ffd600' : '#ef5350', fontFamily: 'monospace',
      }).setOrigin(0.5);
      const selOverlay = this.add.rectangle(0, 0, CARD_W, CARD_H, 0xffffff, 0)
        .setStrokeStyle(3, 0xffd600);
      const selCheck = this.add.text(CARD_W / 2 - 12, -CARD_H / 2 + 8, '✓', {
        fontSize: '14px', color: '#ffd600', fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0);

      container.add([bg, iconTxt, titleTxt, descTxt, costTxt, selOverlay, selCheck]);
      this._cardObjects[upg.key] = { container, bg, selOverlay, selCheck, upg, canAfford };

      if (!canAfford) return;
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => {
        if (this._selected !== upg.key)
          this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 120 });
      });
      bg.on('pointerout', () => {
        if (this._selected !== upg.key)
          this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120 });
      });
      bg.on('pointerdown', () => this._selectCard(upg.key));
    });
  }

  _selectCard(key) {
    if (this._selected) {
      const prev = this._cardObjects[this._selected];
      prev.selOverlay.setFillStyle(0xffffff, 0);
      prev.selCheck.setAlpha(0);
      this.tweens.add({ targets: prev.container, scaleX: 1, scaleY: 1, duration: 100 });
    }
    this._selected = key;
    const card = this._cardObjects[key];
    card.selOverlay.setFillStyle(0xffd600, 0.08);
    card.selCheck.setAlpha(1);
    this.tweens.add({ targets: card.container, scaleX: 1.06, scaleY: 1.06, duration: 150 });
    this.cameras.main.flash(150, 100, 180, 50, false);
    this._updateConfirmBtn();
  }

  _buildConfirmButton() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT - 52;
    this._confirmBg = this.add.rectangle(cx, cy, 320, 44, 0x1a3a1a).setStrokeStyle(2, 0x555555);
    this._confirmTxt = this.add.text(cx, cy, 'Selecciona una mejora', {
      fontSize: '14px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(cx, GAME.HEIGHT - 16, 'o  [ ESPACIO ]  para pasar sin mejora', {
      fontSize: '9px', color: '#444444', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.input.keyboard.once('keydown-SPACE', () => this._nextDay(null));
  }

  _updateConfirmBtn() {
    if (!this._selected) return;
    const upg = this._upgrades.find(u => u.key === this._selected);
    this._confirmBg.setFillStyle(0x0a2a0a).setStrokeStyle(2, 0x69f0ae);
    this._confirmTxt.setText(`[ Confirmar: ${upg.title} ]`).setColor('#69f0ae')
      .setInteractive({ useHandCursor: true });
    this._confirmTxt.on('pointerdown', () => this._nextDay(this._selected));
    this._confirmTxt.on('pointerover', () => this._confirmTxt.setColor('#ffffff'));
    this._confirmTxt.on('pointerout',  () => this._confirmTxt.setColor('#69f0ae'));
  }

  _nextDay(selectedKey) {
    if (selectedKey) {
      const upg = this._upgrades.find(u => u.key === selectedKey);
      if (this.coins < upg.cost) {
        this._confirmTxt.setText('¡Sin fondos!').setColor('#ef5350');
        return;
      }
      this.coins -= upg.cost;

      if (upg.serverId !== undefined) {
        this.serverLevels[upg.serverId] = upg.newLvl;
        this.registry.set('serverLevels', this.serverLevels.slice());
      }
      if (upg.newCoffeeLvl) {
        this.registry.set('coffeeLvl', upg.newCoffeeLvl);
      }
      if (upg.buyCoffee) {
        this.registry.set('coffeeCount', this.coffeeCount + 1);
      }
      if (upg.key === 'marketing') this.difficulty += 0.25;
    }

    if (this.coins < 0) this.coins = 0;
    this.difficulty += 0.1;

    const currentDay = this.registry.get('day') ?? 1;

    if (currentDay >= 5) {
      this.registry.set('coins', this.coins);
      this.registry.set('day',   currentDay);
      this.cameras.main.fadeOut(500, 255, 215, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('VictoryScene'));
      return;
    }

    const day = currentDay + 1;
    this.registry.set('coins',      this.coins);
    this.registry.set('difficulty', this.difficulty);
    this.registry.set('day',        day);
    this.registry.set('upgrade',    selectedKey);

    if (this.coins <= 0 && day > 2) {
      this.registry.set('bankruptcy', true);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(SCENES.GAME_OVER));
      return;
    }

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME);
      this.scene.launch(SCENES.UI);
    });
  }
}
