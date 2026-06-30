// ============================================================
//  UIScene.js — HUD completo estilo imagen de referencia
//
//  Layout:
//    TOP BAR:   STRESS METER (izq) | LIVES · COINS · DAY (centro) | TIMER (der)
//    BOTTOM:    Portrait Richard + stats (izq) | Task list (der)
//    OVERLAYS:  BUG ALERT parpadeante | Flash vómito
// ============================================================

import { SCENES, GAME, STRESS } from '../data/constants.js';

const PAD   = 10;
const HUD_H = 90;   // altura del panel inferior
const TOP_H = 36;   // altura del panel superior

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.UI });
  }

  create() {
    // Esperar a que GameScene publique el emisor (por si UIScene arranca primero)
    const tryBind = () => {
      const events = this.registry.get('GameEvents');
      if (!events) { this.time.delayedCall(50, tryBind); return; }
      this._bindEvents(events);
    };
    tryBind();

    this._tasks   = [];
    this._lives   = 3;
    this._day     = this.registry.get('day') ?? 1;
    this._coins   = 0;
    this._stress  = 0;

    this._buildTopBar();
    this._buildBottomPanel();
    this._buildBugAlert();
  }

  _bindEvents(events) {
    // Limpiar listeners anteriores del mismo emisor si existieran
    events.off('lives-update');
    events.off('stress-update');
    events.off('coins-update');
    events.off('timer-update');
    events.off('codelines-update');
    events.off('coffee-update');
    events.off('richard-vomit');
    events.off('server-alert');
    events.off('task-add');
    events.off('task-done');

    events.on('stress-update',    (v) => this._updateStress(v));
    events.on('coins-update',     (v) => this._updateCoins(v));
    events.on('timer-update',     (v) => this._updateTimer(v));
    events.on('codelines-update', (v) => this._updateCodeLines(v));
    events.on('coffee-update',    (v) => this._updateCoffeeIcon(v));
    events.on('richard-vomit',    ()  => this._showVomitOverlay());
    events.on('server-alert',     (d) => this._triggerBugAlert(d));
    events.on('task-add',         (t) => this._addTask(t));
    events.on('task-done',        (t) => this._completeTask(t));
    events.on('lives-update',     (v) => this._updateLives(v));
  }

  // ================================================================
  //  PANEL SUPERIOR — fondo oscuro translúcido
  // ================================================================
  _buildTopBar() {
    // Fondo
    this.add.rectangle(0, 0, GAME.WIDTH, TOP_H, 0x000000, 0.82)
      .setOrigin(0, 0).setDepth(40);

    // ---- STRESS METER (izquierda) ----
    this.add.text(PAD, 6, 'MEDIDOR DE ESTRÉS', {
      fontSize: '11px', color: '#ef5350', fontFamily: 'monospace',
    }).setDepth(41);

    this.stressBarBg = this.add.rectangle(PAD, 22, 180, 10, 0x333333)
      .setOrigin(0, 0.5).setDepth(41);
    this.stressBar = this.add.rectangle(PAD, 22, 0, 10, 0xef5350)
      .setOrigin(0, 0.5).setDepth(42);

    this.stressLabel = this.add.text(PAD, 29, "ESTRÉS DE RICHARD  0/100", {
      fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setDepth(41);

    // ---- CENTRO: LIVES · COINS · DAY ----
    const cx = GAME.WIDTH / 2;
    this.add.text(cx - 180, 12, 'VIDAS:', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(41);
    this.livesText = this.add.text(cx - 120, 12, '3', {
      fontSize: '12px', color: '#ef5350', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(41);

    this.add.text(cx - 60, 12, 'MONEDAS:', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(41);
    this.coinsText = this.add.text(cx, 12, '0', {
      fontSize: '12px', color: '#ffd600', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(41);

    this.add.text(cx + 80, 12, 'DÍA:', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(41);
    this.dayText = this.add.text(cx + 120, 12, String(this._day), {
      fontSize: '12px', color: '#69f0ae', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(41);

    // ---- TIMER (esquina derecha) ----
    this.timerText = this.add.text(GAME.WIDTH - PAD, 18, '2:00', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(1, 0.5).setDepth(41);
  }

  // ================================================================
  //  PANEL INFERIOR — portrait + stats + task list
  // ================================================================
  _buildBottomPanel() {
    const by = GAME.HEIGHT - HUD_H;

    // Fondo
    this.add.rectangle(0, by, GAME.WIDTH, HUD_H, 0x000000, 0.88)
      .setOrigin(0, 0).setDepth(40);
    // Línea separadora
    this.add.rectangle(0, by, GAME.WIDTH, 2, 0x4fc3f7, 0.5)
      .setOrigin(0, 0).setDepth(41);

    // ---- Portrait de Richard (placeholder coloreado) ----
    const portraitBg = this.add.rectangle(PAD + 32, by + 44, 64, 76, 0x1a2a4a)
      .setDepth(41);
    this.add.rectangle(PAD + 32, by + 44, 60, 72, 0x4fc3f7, 0.15)
      .setDepth(42);
    // Cara simple pixel-art en el portrait
    this._drawPortrait(PAD + 32, by + 44);

    // Etiqueta de ubicación
    this.add.rectangle(PAD + 32, by + 6, 130, 14, 0x1a1a2e)
      .setOrigin(0.5, 0).setDepth(41);
    this.add.text(PAD + 32, by + 7, "ERLICH'S PALO ALTO INCUBATOR", {
      fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(42);

    // Nombre
    this.add.text(PAD + 75, by + 10, 'RICHARD', {
      fontSize: '13px', color: '#4fc3f7', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setDepth(41);

    // Stats bajo el nombre
    this.hudLives = this.add.text(PAD + 75, by + 28, 'VIDAS: 3', {
      fontSize: '10px', color: '#ef5350', fontFamily: 'monospace',
    }).setDepth(41);
    this.hudCoins = this.add.text(PAD + 75, by + 42, 'MONEDAS: 0', {
      fontSize: '10px', color: '#ffd600', fontFamily: 'monospace',
    }).setDepth(41);
    this.hudDay = this.add.text(PAD + 75, by + 56, `DÍA: ${this._day}`, {
      fontSize: '10px', color: '#69f0ae', fontFamily: 'monospace',
    }).setDepth(41);

    // Barra de estrés mini en el panel inferior
    this.add.text(PAD + 75, by + 70, 'ESTRÉS:', {
      fontSize: '8px', color: '#ef5350', fontFamily: 'monospace',
    }).setDepth(41);
    this.hudStressBarBg = this.add.rectangle(PAD + 120, by + 75, 100, 8, 0x333333)
      .setOrigin(0, 0.5).setDepth(41);
    this.hudStressBar = this.add.rectangle(PAD + 120, by + 75, 0, 8, 0xef5350)
      .setOrigin(0, 0.5).setDepth(42);

    // ---- Coffee indicator ----
    this.coffeeIndicator = this.add.text(PAD + 240, by + 40, '☕ ---', {
      fontSize: '12px', color: '#555555', fontFamily: 'monospace',
    }).setDepth(41);

    // ---- TASK LIST (derecha) ----
    const tx = GAME.WIDTH - 280;
    this.add.text(tx, by + 8, '✔ TAREAS ACTIVAS', {
      fontSize: '11px', color: '#69f0ae', fontFamily: 'monospace',
    }).setDepth(41);

    this._taskTexts = [];
    for (let i = 0; i < 4; i++) {
      this._taskTexts.push(
        this.add.text(tx, by + 24 + i * 16, '', {
          fontSize: '10px', color: '#cccccc', fontFamily: 'monospace',
          stroke: '#000', strokeThickness: 2,
        }).setDepth(41)
      );
    }

    // Controles
    this.add.text(GAME.WIDTH / 2, by + HUD_H - 8, 'WASD: Mover  |  F: Interactuar  |  E: Café', {
      fontSize: '10px', color: '#444444', fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(41);
  }

  // Dibuja un portrait pixel-art simple de Richard en el HUD
  _drawPortrait(cx, cy) {
    const g = this.add.graphics().setDepth(43);
    // Fondo azul hoodie
    g.fillStyle(0x3a5fa0, 1); g.fillRect(cx - 24, cy + 6, 48, 28);
    // Piel
    g.fillStyle(0xf4c98a, 1); g.fillRect(cx - 14, cy - 22, 28, 22);
    // Pelo marrón
    g.fillStyle(0x5c3d1e, 1); g.fillRect(cx - 14, cy - 26, 28, 8);
    // Ojos
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 8, cy - 16, 4, 4);
    g.fillRect(cx + 4,  cy - 16, 4, 4);
    // Boca preocupada (Richard siempre está preocupado)
    g.fillStyle(0x000000, 1); g.fillRect(cx - 5, cy - 6, 10, 2);
    g.fillRect(cx - 7,  cy - 4, 3, 2);
    g.fillRect(cx + 4,  cy - 4, 3, 2);
  }

  // ================================================================
  //  BUG ALERT — panel rojo parpadeante tipo imagen
  // ================================================================
  _buildBugAlert() {
    const ax = GAME.WIDTH / 2 + 80;
    const ay = TOP_H + 14;

    this.bugAlertGroup = this.add.container(ax, ay).setDepth(45).setAlpha(0);

    const bg = this.add.rectangle(0, 0, 130, 50, 0x8b0000, 0.95);
    const border = this.add.rectangle(0, 0, 130, 50).setStrokeStyle(2, 0xff0000);
    const icon = this.add.text(-50, -10, '!', {
      fontSize: '22px', color: '#ff0000', fontFamily: 'monospace',
    }).setOrigin(0.5);
    const label = this.add.text(0, -14, '¡ALERTA DE BUG!', {
      fontSize: '11px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.bugAlertTimer = this.add.text(0, 4, '0:00', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.bugAlertServer = this.add.text(0, 20, '', {
      fontSize: '7px', color: '#ffaa00', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.bugAlertGroup.add([bg, border, icon, label, this.bugAlertTimer, this.bugAlertServer]);

    // Parpadeo continuo cuando está visible
    this.tweens.add({
      targets: this.bugAlertGroup,
      scaleX: 1.03, scaleY: 1.03,
      duration: 400, yoyo: true, repeat: -1,
    });
  }

  // ================================================================
  //  UPDATES DE ESTADO
  // ================================================================
  _updateStress(v) {
    this._stress = v;
    const pct = v / 100;
    this.stressBar.width = 180 * pct;
    this.hudStressBar.width = 100 * pct;
    const col = pct < 0.5 ? 0x69f0ae : pct < 0.8 ? 0xffb74d : 0xef5350;
    this.stressBar.setFillStyle(col);
    this.hudStressBar.setFillStyle(col);
    this.stressLabel.setText(`ESTRÉS DE RICHARD  ${Math.floor(v)}/100`);
  }

  _updateCoins(v) {
    this._coins = v;
    const fmt = v.toLocaleString();
    this.coinsText.setText(fmt);
    this.hudCoins.setText(`MONEDAS: ${fmt}`);
  }

  _updateLives(v) {
    this._lives = v;
    const hearts = '❤'.repeat(v) + '♡'.repeat(Math.max(0, 3 - v));
    this.livesText.setText(hearts);
    this.hudLives.setText(`VIDAS: ${hearts}`);
  }

  _updateCodeLines(v) {
    // Podría mostrarse en task list o en panel si quisieras
  }

  _updateTimer(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mins  = Math.floor(total / 60);
    const secs  = String(total % 60).padStart(2, '0');
    this.timerText.setText(`${mins}:${secs}`);
    this.timerText.setColor(total < 20 ? '#ef5350' : '#ffffff');
    // También actualiza el timer del BUG ALERT si está activo
    if (this._bugAlertActive) {
      this.bugAlertTimer.setText(`${mins}:${secs}`);
    }
  }

  _updateCoffeeIcon(stock) {
    const has = stock > 0;
    this.coffeeIndicator.setText(has ? `☕ x${stock}` : '☕ ---');
    this.coffeeIndicator.setColor(has ? '#ffb74d' : '#555555');
  }

  // ================================================================
  //  BUG ALERT — mostrar/ocultar
  // ================================================================
  _triggerBugAlert(data) {
    this._bugAlertActive = true;
    this.bugAlertServer.setText(data?.label ? `${data.label} FALLANDO` : 'SERVIDOR FALLANDO');
    this.bugAlertGroup.setAlpha(1);
    // Se oculta automáticamente si no hay más servidores fallando (simplificado: 15s)
    this.time.delayedCall(15_000, () => {
      this._bugAlertActive = false;
      this.tweens.add({ targets: this.bugAlertGroup, alpha: 0, duration: 500 });
    });
  }

  // ================================================================
  //  TASK LIST
  // ================================================================
  _addTask(taskName) {
    if (!this._tasks.includes(taskName)) {
      this._tasks.push(taskName);
    }
    this._renderTasks();
  }

  _completeTask(taskName) {
    // Marca la primera instancia del task como completada quitándola
    const idx = this._tasks.indexOf(taskName);
    if (idx !== -1) this._tasks.splice(idx, 1);
    this._renderTasks();
  }

  _renderTasks() {
    this._taskTexts.forEach((t, i) => {
      if (this._tasks[i]) {
        t.setText(`> ${this._tasks[i]}`).setColor('#cccccc');
      } else {
        t.setText('');
      }
    });
  }

  // ================================================================
  //  EFECTOS ESPECIALES
  // ================================================================
  _showVomitOverlay() {
    const overlay = this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, GAME.HEIGHT, 0x88ff00, 0.35,
    ).setDepth(50);
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, '¡SIEMPRE AZUL!\n¡RICHARD COLAPSA!', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 5, align: 'center',
    }).setOrigin(0.5).setDepth(51);
    this.time.delayedCall(2800, () => overlay.destroy());
    this.tweens.add({ targets: overlay, alpha: 0, duration: 2800 });
  }
}
