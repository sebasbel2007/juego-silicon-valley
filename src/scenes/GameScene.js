// ============================================================
//  GameScene.js — Escena principal de juego "El Día a Día"
//
//  Responsabilidades:
//    · Mapa de la incubadora (tiles)
//    · Richard (jugador) con movimiento top-down y barra de estrés
//    · Servidores: fallan aleatoriamente, Richard debe repararlos
//    · Personajes NPC: Gilfoyle, Dinesh (bugs), Erlich (bloqueo),
//      Jian-Yang (obstáculos de comida)
//    · Sistema de café/bebidas energéticas
//    · Comunicación con UIScene vía EventEmitter
//    · Al terminar el tiempo → ManagementScene
//    · Eventos aleatorios → EventScene
// ============================================================

import {
  SCENES, GAME, TIME, STRESS, KEYS, QUOTES, ECONOMY, SERVER_LEVELS, COFFEE_LEVELS, SHOP,
} from '../data/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME });
  }

  // ================================================================
  //  PRELOAD — Assets específicos que no se cargaron en PreloadScene
  // ================================================================
  preload() {
    // Si necesitas cargar algo exclusivo de esta escena hazlo aquí.
    // Por ahora todos los placeholders vienen de BootScene.
  }

  // ================================================================
  //  CREATE — Inicializa todos los sistemas al comenzar la escena
  // ================================================================
  create() {
    // Crear emisor fresco en cada create() para evitar listeners duplicados
    const GameEvents = new Phaser.Events.EventEmitter();
    this.registry.set('GameEvents', GameEvents);
    this._emitter = GameEvents;

    // --- Estado del juego ---
    this.stress        = 0;
    this.coins         = 0;
    this.codeLines     = 0;
    this.roundTime     = TIME.ROUND_DURATION;
    this.isVomiting    = false;
    this.hasCoffee     = false;
    this.roundEnded    = false;
    this.lives         = this.registry.get('lives') ?? 3;

    // Dificultad acumulada entre rondas (ManagementScene la sube)
    this.difficulty    = this.registry.get('difficulty') ?? 1;
    this.coffeeStock    = 0;  // cuántos cafés carga Richard ahora
    this._coffeeCooldown = false;

    // --- Construir mundo ---
    this._buildMap();
    this._spawnRichard();
    this._spawnNPCs();
    this._spawnServers();
    this._spawnCoffeeStation();

    // --- Input ---
    this._setupInput();

    // --- Timers de gameplay ---
    this._startStressTimer();
    this._scheduleServerFailures();
    this._scheduleBugSpawns();
    this._scheduleErlichSpeech();
    this._scheduleRandomEvent();

    // --- Comunicar estado inicial a UIScene ---
    GameEvents.emit('stress-update', this.stress);
    GameEvents.emit('coins-update', this.coins);
    GameEvents.emit('timer-update', this.roundTime);
  }

  // ================================================================
  //  UPDATE — Loop principal (llamado ~60 veces por segundo)
  // ================================================================
  update(time, delta) {
    if (this.roundEnded || this.isVomiting || this._paused) return;

    this._handleMovement(delta);
    this._updateRoundTimer(delta);
    this._checkInteractions();
    this._checkProximityHints();
  }

  // ================================================================
  //  MOVIMIENTO — WASD / Cursores con físicas Arcade
  // ================================================================
  _handleMovement(delta) {
    const speed = this._speedBoost ? 320 : 160;
    const body  = this.richard.body;

    body.setVelocity(0);

    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up    = this.cursors.up.isDown    || this.wasd.up.isDown;
    const down  = this.cursors.down.isDown  || this.wasd.down.isDown;

    if (left)  body.setVelocityX(-speed);
    if (right) body.setVelocityX(speed);
    if (up)    body.setVelocityY(-speed);
    if (down)  body.setVelocityY(speed);

    body.velocity.normalize().scale(speed);

    // Animaciones
    if (down) {
      this.richard.anims.play('walk_down', true);
      this.richard.setFlipX(false);
    } else if (up) {
      this.richard.anims.play('walk_up', true);
      this.richard.setFlipX(false);
    } else if (left) {
      this.richard.anims.play('walk_side', true);
      this.richard.setFlipX(true);
    } else if (right) {
      this.richard.anims.play('walk_side', true);
      this.richard.setFlipX(false);
    } else {
      this.richard.anims.play('idle', true);
      this.richard.setFlipX(false);
    }
  }

  // ================================================================
  //  TIMER DE RONDA — cuenta regresiva, llama a endRound() al llegar a 0
  // ================================================================
  _updateRoundTimer(delta) {
    this.roundTime -= delta;
    this._emitter.emit('timer-update', Math.max(0, this.roundTime));

    if (this.roundTime <= 0) this._endRound();
  }

  // ================================================================
  //  FIX SERVER — Richard repara un servidor en llamas
  //
  //  Llama a esta función desde _checkInteractions() cuando:
  //    · Richard está adyacente a un servidor en llamas
  //    · El jugador presiona la tecla INTERACT (F)
  //
  //  @param {Phaser.GameObjects.Sprite} server - servidor a reparar
  // ================================================================
  fixServer(server) {
    if (!server || !server.active || server.getData('isFixed')) return;

    const lvl   = server.getData('lvl') ?? 1;
    const stats = SERVER_LEVELS[lvl];

    server.setData('isFixed', true);
    server.setData('isFailing', false);
    server.setTexture(server.getData('texOk') ?? 'server_ok');
    server.clearTint();
    server.setAlpha(1);
    this.tweens.killTweensOf(server);

    const tag = server.getData('stateTag');
    if (tag) tag.setText('STABLE').setColor('#69f0ae');

    this.coins    += stats.coinsReward;
    this.stress   -= stats.stressReduce;
    this.stress    = Phaser.Math.Clamp(this.stress, 0, STRESS.MAX);
    const bonusLines = Phaser.Math.Between(5, 12) * stats.codeBonus;
    this.codeLines  += bonusLines;

    this._emitter.emit('stress-update',    this.stress);
    this._emitter.emit('coins-update',     this.coins);
    this._emitter.emit('codelines-update', this.codeLines);
    this._showFloatingText(server.x, server.y - 20, `+${stats.coinsReward} monedas`, '#4fc3f7');

    // Programar próximo fallo desde aquí (fuente única del ciclo)
    this._scheduleOneFail(server);
  }

  // ================================================================
  //  DELIVER COFFEE — Richard entrega café a Gilfoyle o Dinesh
  //
  //  Desactiva el bug flotante sobre el NPC y genera líneas de código.
  //
  //  @param {Phaser.GameObjects.Sprite} npc - Gilfoyle o Dinesh
  // ================================================================
  deliverCoffee(npc) {
    if (!npc || !npc.active || !npc.getData('hasBug')) return;
    if (!this.hasCoffee) return;

    // Resolver bug del NPC
    npc.setData('hasBug', false);
    npc.getData('bugIcon')?.destroy();
    this.tweens.killTweensOf(npc.getData('bugIcon'));

    // Actualizar etiqueta de estado a MODE: GOD!
    const stTag = npc.getData('statusTag');
    if (stTag) {
      stTag.setText('MODE: GOD!').setColor('#ffd600');
      this.time.delayedCall(5000, () => stTag?.setText('CODING').setColor('#69f0ae'));
    }

    // Recompensas
    const lines     = Phaser.Math.Between(10, 30);
    this.codeLines += lines;
    this.coins     += lines * ECONOMY.COINS_PER_LINE;
    this.stress    -= STRESS.DELIVER_COFFEE_REDUCE;
    this.stress     = Phaser.Math.Clamp(this.stress, 0, STRESS.MAX);
    this.coffeeStock = Math.max(0, this.coffeeStock - 1);
    this.hasCoffee   = this.coffeeStock > 0;

    // Notificar UI
    this._emitter.emit('stress-update', this.stress);
    this._emitter.emit('coins-update', this.coins);
    this._emitter.emit('codelines-update', this.codeLines);
    this._emitter.emit('task-done', `Llevar café a ${npc.getData('name')}`);

    // Speech bubble con frase icónica del NPC
    const npcName = npc.getData('name');
    const quotePool = npcName === 'Gilfoyle' ? QUOTES.GILFOYLE : QUOTES.DINESH;
    const quote = Phaser.Utils.Array.GetRandom(quotePool);
    this._showSpeechBubble(npc.x, npc.y, quote, npcName === 'Gilfoyle' ? '#90a4ae' : '#ffb74d');
  }

  // ================================================================
  //  RICHARD VOMITS — Richard colapsa por estrés máximo
  //
  //  · Bloquea el input del jugador durante VOMIT_DURATION ms
  //  · Muestra la animación / efecto visual de vómito
  //  · Emite el evento "vomit" a UIScene para mostrar el mensaje
  // ================================================================
  richardVomits() {
    if (this.isVomiting) return;

    this.isVomiting = true;
    this.lives--;
    this.registry.set('lives', this.lives);
    this._emitter.emit('lives-update', this.lives);
    this.richard.body.setVelocity(0);
    this.richard.setTint(0x88ff00);

    const failQuote = Phaser.Utils.Array.GetRandom(QUOTES.FAIL);
    this._showSpeechBubble(this.richard.x, this.richard.y, failQuote, '#ef5350');
    this._emitter.emit('richard-vomit');
    this.cameras.main.shake(300, 0.01);

    if (this.lives <= 0) {
      // Sin vidas → Game Over
      this.time.delayedCall(1200, () => {
        this.registry.set('coins', this.coins);
        this._emitter.removeAllListeners();
        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.GAME_OVER);
      });
      return;
    }

    // Aún tiene vidas → recuperación parcial
    this.time.delayedCall(TIME.VOMIT_DURATION, () => {
      this.isVomiting = false;
      this.stress     = 60;
      this.richard.clearTint();
      this._emitter.emit('stress-update', this.stress);
    });
  }

  // ================================================================
  //  RECOGER CAFÉ — busca la cafetera más cercana sin cooldown
  // ================================================================
  _pickUpCoffee() {
    const coffeeLvl = this.registry.get('coffeeLvl') ?? 1;
    const maxStock  = this._coffeeStations.length; // 1 café por cafetera máximo al mismo tiempo

    if (this.coffeeStock >= maxStock) {
      this._showFloatingText(this.richard.x, this.richard.y - 20, '¡Cargás el máximo!', '#795548');
      return;
    }

    // Buscar cafetera lista más cercana (sin cooldown y en rango)
    let best = null;
    let bestDist = Infinity;

    this._coffeeStations.forEach(station => {
      if (station.onCooldown) return;
      const dist = Phaser.Math.Distance.Between(
        this.richard.x, this.richard.y,
        station.img.x, station.img.y,
      );
      if (dist < 80 && dist < bestDist) {
        best = station;
        bestDist = dist;
      }
    });

    if (!best) {
      // Ver si hay alguna cerca pero en cooldown
      const anyCooldown = this._coffeeStations.some(s => {
        const d = Phaser.Math.Distance.Between(
          this.richard.x, this.richard.y, s.img.x, s.img.y,
        );
        return d < 80 && s.onCooldown;
      });
      if (anyCooldown)
        this._showFloatingText(this.richard.x, this.richard.y - 20, 'Preparando…', '#795548');
      return;
    }

    // Recoger de esa cafetera
    best.onCooldown = true;
    best.light.setFillStyle(0xef5350);
    best.border.setStrokeStyle(2, 0x7f0000);

    this.coffeeStock++;
    this.hasCoffee = true;
    this._emitter.emit('coffee-update', this.coffeeStock);

    const stats = COFFEE_LEVELS[coffeeLvl];
    this._showFloatingText(
      this.richard.x, this.richard.y - 20,
      `¡Café (${this.coffeeStock}/${maxStock})! ☕`,
      '#795548',
    );

    // Cooldown individual de esta cafetera
    this.time.delayedCall(stats.cooldown, () => {
      best.onCooldown = false;
      best.light.setFillStyle(0x00e676);
      best.border.setStrokeStyle(2, 0x005c28);
    });
  }

  // ================================================================
  //  CONSTRUCCIÓN DEL MAPA — Oficina Pied Piper rediseñada
  //
  //  LAYOUT (960x540):
  //  Y=0-36    : HUD top bar
  //  Y=36-140  : Pared del fondo + ventanas + rack de servidores
  //  Y=140-450 : Zona de trabajo (suelo) — 5 escritorios en grid
  //  Y=450-540 : HUD bottom bar
  //
  //  Escritorios (mesa+PC+personaje):
  //   Fila 1 (y≈280): Gilfoyle(x=200)  Dinesh(x=460)  Jared(x=720)
  //   Fila 2 (y≈390): Erlich(x=290)    Jian-Yang(x=580)
  //  Cafetera: esquina superior izq (x=60, y=100)
  //  Servidores: banda central superior (y≈155)
  // ================================================================
  _buildMap() {
    const G  = this.add.graphics().setDepth(0);
    const G2 = this.add.graphics().setDepth(2);  // muebles encima del suelo
    const W  = GAME.WIDTH;   // 960
    const H  = GAME.HEIGHT;  // 540
    const TOP_HUD = 36;
    const BOT_HUD = 90;
    const FLOOR_Y = 140;
    const FLOOR_H = H - FLOOR_Y - BOT_HUD; // zona jugable

    // ── 1. CIELO exterior (detrás de la pared) ──
    G.fillGradientStyle(0x1a2a4a, 0x1a2a4a, 0x0d1520, 0x0d1520, 1);
    G.fillRect(0, 0, W, FLOOR_Y + 10);

    // Estrellas pequeñas
    for (let i = 0; i < 40; i++) {
      G.fillStyle(0xffffff, Math.random() * 0.5 + 0.2);
      G.fillRect(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(TOP_HUD, FLOOR_Y - 10),
        1, 1,
      );
    }

    // ── 2. PARED del fondo ──
    G.fillStyle(0xd6c8b0, 1);
    G.fillRect(0, TOP_HUD, W, FLOOR_Y - TOP_HUD + 4);
    // Zócalo inferior de la pared
    G.fillStyle(0xb8a888, 1);
    G.fillRect(0, FLOOR_Y - 6, W, 10);
    // Franja de techo
    G.fillStyle(0xe8dcc8, 1);
    G.fillRect(0, TOP_HUD, W, 8);

    // ── 3. VENTANAS en la pared (3 ventanas decorativas) ──
    const winDefs = [
      { x: 60,  w: 110 },
      { x: 390, w: 180 },
      { x: 720, w: 110 },
    ];
    winDefs.forEach(({ x, w }) => {
      const wy = TOP_HUD + 10, wh = FLOOR_Y - TOP_HUD - 18;
      // cielo nocturno dentro
      G.fillStyle(0x0a1628, 1);    G.fillRect(x, wy, w, wh);
      // luna
      G.fillStyle(0xfffde7, 0.9); G.fillCircle(x + w - 14, wy + 10, 8);
      G.fillStyle(0x0a1628, 1);   G.fillCircle(x + w - 10, wy + 8,  7); // crescent
      // edificios silueta
      G.fillStyle(0x0d1f35, 1);
      G.fillRect(x + 4,      wy + wh - 22, 18, 22);
      G.fillRect(x + 26,     wy + wh - 32, 14, 32);
      G.fillRect(x + 44,     wy + wh - 18, 20, 18);
      G.fillRect(x + w - 40, wy + wh - 28, 16, 28);
      G.fillRect(x + w - 22, wy + wh - 16, 18, 16);
      // ventanitas amarillas
      G.fillStyle(0xffd600, 0.7);
      [[x+8,wy+wh-18],[x+30,wy+wh-26],[x+30,wy+wh-16],[x+48,wy+wh-14],
       [x+w-36,wy+wh-22],[x+w-18,wy+wh-12]].forEach(([wx,wy2]) => {
        if (wx > x && wx < x + w - 4) G.fillRect(wx, wy2, 4, 4);
      });
      // marco madera
      G.lineStyle(3, 0x8b6914, 1); G.strokeRect(x, wy, w, wh);
      // travesaño central
      G.lineStyle(2, 0x8b6914, 0.8);
      G.lineBetween(x + w / 2, wy, x + w / 2, wy + wh);
      G.lineBetween(x, wy + wh / 2, x + w, wy + wh / 2);
    });

    // ── 4. SUELO de la oficina ──
    // Base
    G.fillStyle(0x3a4a5a, 1);
    G.fillRect(0, FLOOR_Y, W, FLOOR_H + BOT_HUD);
    // Baldosas 48x48 con dos tonos alternos
    for (let row = 0; row * 48 < FLOOR_H + BOT_HUD; row++) {
      for (let col = 0; col * 48 < W; col++) {
        const shade = (row + col) % 2 === 0 ? 0x3e5060 : 0x364858;
        G.fillStyle(shade, 1);
        G.fillRect(col * 48, FLOOR_Y + row * 48, 47, 47);
      }
    }
    // Líneas de grilla sutiles
    G.lineStyle(1, 0x2a3a4a, 0.8);
    for (let x = 0; x <= W; x += 48) G.lineBetween(x, FLOOR_Y, x, H);
    for (let y = FLOOR_Y; y <= H; y += 48) G.lineBetween(0, y, W, y);

    // ── 5. PAREDES con colisión (invisibles) ──
    this.walls = this.physics.add.staticGroup();
    const WT = GAME.TILE_SIZE;
    for (let x = 0; x < W; x += WT) {
      const w = this.walls.create(x + WT / 2, TOP_HUD + WT / 2, 'wall_tile').setAlpha(0);
      w.refreshBody();
    }
    for (let y = TOP_HUD + WT; y < H - BOT_HUD; y += WT) {
      const wl = this.walls.create(WT / 2,       y, 'wall_tile').setAlpha(0);
      const wr = this.walls.create(W - WT / 2,   y, 'wall_tile').setAlpha(0);
      wl.refreshBody(); wr.refreshBody();
    }

    // ── 6. ESCRITORIOS — helper: mesa + monitor + silla ──
    // deskDefs: [cx, cy] — centro del personaje sentado
    // La mesa está DETRÁS del personaje (arriba), el personaje delante
    const drawDesk = (cx, cy, deskColor = 0x6b4c1e) => {
      const DW = 90, DH = 38;
      const mx = cx - DW / 2, my = cy - 50;
      // Sombra mesa
      G2.fillStyle(0x000000, 0.18); G2.fillRect(mx + 4, my + 4, DW, DH);
      // Superficie mesa
      G2.fillStyle(deskColor, 1);   G2.fillRect(mx, my, DW, DH);
      // Borde superior más claro
      G2.fillStyle(0xffffff, 0.1);  G2.fillRect(mx, my, DW, 4);
      // Bordes
      G2.lineStyle(1, 0x3a2800, 0.8); G2.strokeRect(mx, my, DW, DH);
      // Patas
      G2.fillStyle(this._darkerHex(deskColor, 30), 1);
      G2.fillRect(mx + 4,      my + DH - 2, 6, 8);
      G2.fillRect(mx + DW - 10, my + DH - 2, 6, 8);

      // Monitor
      const monW = 36, monH = 26, monX = cx - monW / 2, monY = my - monH - 4;
      // Soporte
      G2.fillStyle(0x222222, 1);
      G2.fillRect(cx - 3, monY + monH, 6, 6);
      G2.fillRect(cx - 8, monY + monH + 4, 16, 3);
      // Pantalla
      G2.fillStyle(0x111122, 1);  G2.fillRect(monX, monY, monW, monH);
      G2.fillStyle(0x0a2040, 1);  G2.fillRect(monX + 2, monY + 2, monW - 4, monH - 4);
      // Glow pantalla (código verde)
      G2.fillStyle(0x00e676, 0.15); G2.fillRect(monX + 2, monY + 2, monW - 4, monH - 4);
      // Líneas de código simuladas
      G2.fillStyle(0x00e676, 0.6);
      [4, 8, 12, 16].forEach(dy => G2.fillRect(monX + 4, monY + dy, Phaser.Math.Between(10, 28), 1));
      // Marco monitor
      G2.lineStyle(2, 0x444444, 1); G2.strokeRect(monX, monY, monW, monH);

      // Teclado sobre la mesa
      G2.fillStyle(0x333333, 1);  G2.fillRect(cx - 18, my + 8, 36, 14);
      G2.fillStyle(0x444444, 1);  G2.fillRect(cx - 17, my + 9, 34, 12);
      G2.lineStyle(1, 0x222222, 1); G2.strokeRect(cx - 18, my + 8, 36, 14);
      // Teclas
      G2.fillStyle(0x555555, 1);
      for (let ki = 0; ki < 5; ki++) G2.fillRect(cx - 15 + ki * 7, my + 11, 5, 4);
      for (let ki = 0; ki < 4; ki++) G2.fillRect(cx - 12 + ki * 7, my + 17, 5, 3);

      // Silla (detrás visualmente = más abajo)
      G2.fillStyle(0x1a1a2e, 1);  G2.fillRect(cx - 14, cy + 20, 28, 18);
      G2.fillStyle(0x252540, 1);  G2.fillRect(cx - 12, cy + 22, 24, 14);
      G2.fillStyle(0x111122, 1);
      G2.fillRect(cx - 3, cy + 36, 6, 10);  // pata central
      G2.fillRect(cx - 14, cy + 44, 8, 3);  // rueda izq
      G2.fillRect(cx + 6,  cy + 44, 8, 3);  // rueda der
    };

    // Fila 1 — 3 escritorios
    drawDesk(200, 290, 0x6b4c1e);
    drawDesk(480, 290, 0x5a3f18);
    drawDesk(760, 290, 0x6b4c1e);
    // Fila 2 — 2 escritorios centrados
    drawDesk(340, 400, 0x7a5520);
    drawDesk(620, 400, 0x7a5520);

    // ── 7. ZONA CAFETERA (esquina sup-izq) ──
    // Mostrador
    G2.fillStyle(0x8b6914, 1);   G2.fillRect(18, FLOOR_Y + 4, 100, 40);
    G2.fillStyle(0xa07820, 1);   G2.fillRect(18, FLOOR_Y + 4, 100, 6);
    G2.lineStyle(1, 0x5a4008, 1); G2.strokeRect(18, FLOOR_Y + 4, 100, 40);
    // Etiqueta
    this.add.text(68, FLOOR_Y + 10, 'COFFEE ZONE', {
      fontSize: '8px', color: '#ffb74d', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);

    // ── 8. PUERTA (centro-derecha pared) ──
    G2.fillStyle(0x5c3a1e, 1);  G2.fillRect(860, TOP_HUD + 4, 50, FLOOR_Y - TOP_HUD - 4);
    G2.fillStyle(0xd4a96e, 1);  G2.fillRect(863, TOP_HUD + 6, 44, FLOOR_Y - TOP_HUD - 8);
    G2.lineStyle(2, 0x3a2008, 1); G2.strokeRect(860, TOP_HUD + 4, 50, FLOOR_Y - TOP_HUD - 4);
    G2.fillStyle(0xffcc44, 1);  G2.fillCircle(876, 95, 4);
    this.add.text(885, 95, 'SALIDA', {
      fontSize: '7px', color: '#ffcc44', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(3);

    // ── 9. LOGO PIED PIPER en el suelo (centro) ──
    const lx = W / 2, ly = 340;
    G2.fillStyle(0x2a3a4a, 1);
    G2.fillCircle(lx, ly, 32);
    G2.lineStyle(2, 0x4fc3f7, 0.4);
    G2.strokeCircle(lx, ly, 32);
    // Triángulo estilo Pied Piper
    G2.fillStyle(0x4fc3f7, 0.5);
    G2.fillTriangle(lx, ly - 18, lx - 16, ly + 14, lx + 16, ly + 14);
    G2.fillStyle(0x1a2a3a, 1);
    G2.fillTriangle(lx, ly - 8, lx - 8, ly + 10, lx + 8, ly + 10);
    // Cables ordenados desde escritorios hasta la pared
    G2.lineStyle(1, 0x1a2a3a, 0.5);
    [[200,310,200,175],[480,310,480,175],[760,310,760,175]].forEach(([x1,y1,x2,y2]) => {
      G2.beginPath(); G2.moveTo(x1,y1); G2.lineTo(x2,y2); G2.strokePath();
    });

    // ── 10. PLANTAS decorativas (esquinas) ──
    [[30, H - BOT_HUD - 30], [W - 50, H - BOT_HUD - 30]].forEach(([px, py]) => {
      G2.fillStyle(0x2d4a1e, 1); G2.fillRect(px - 10, py, 20, 22);
      G2.fillStyle(0x1a3010, 1); G2.fillRect(px - 10, py + 10, 20, 12);
      G2.fillStyle(0x3a6b28, 1); G2.fillEllipse(px,      py - 10, 26, 22);
      G2.fillStyle(0x4a8a34, 1); G2.fillEllipse(px - 10, py - 6,  18, 16);
      G2.fillStyle(0x4a8a34, 1); G2.fillEllipse(px + 10, py - 6,  18, 16);
      G2.lineStyle(1, 0x1a2e10, 1); G2.strokeEllipse(px, py - 10, 26, 22);
    });
  }

  // Helper: oscurece un color hex
  _darkerHex(hex, amount = 40) {
    const r = Math.max(0, (hex >> 16 & 0xff) - amount);
    const g = Math.max(0, (hex >> 8  & 0xff) - amount);
    const b = Math.max(0, (hex       & 0xff) - amount);
    return (r << 16) | (g << 8) | b;
  }

  // ================================================================
  //  SPAWN DE RICHARD — jugador principal
  // ================================================================
  _spawnRichard() {
    this.richard = this.physics.add.sprite(480, 360, 'richard_walk', 0)
      .setScale(1.3)
      .setCollideWorldBounds(true)
      .setDepth(10);

    // Animaciones de caminata
    const anims = this.anims;
    if (!anims.exists('walk_down')) {
      anims.create({ key: 'walk_down', frames: anims.generateFrameNumbers('richard_walk', { start: 0,  end: 3  }), frameRate: 8, repeat: -1 });
      anims.create({ key: 'walk_up',   frames: anims.generateFrameNumbers('richard_walk', { start: 4,  end: 7  }), frameRate: 8, repeat: -1 });
      anims.create({ key: 'walk_side', frames: anims.generateFrameNumbers('richard_walk', { start: 8,  end: 11 }), frameRate: 8, repeat: -1 });
      anims.create({ key: 'idle',      frames: anims.generateFrameNumbers('richard_walk', { start: 12, end: 12 }), frameRate: 1, repeat: 0  });
    }

    this.physics.add.collider(this.richard, this.walls);
    this.cameras.main.setBounds(0, 0, GAME.WIDTH, GAME.HEIGHT);
  }

  // ================================================================
  //  SPAWN DE NPCs — con etiquetas de estado estilo imagen referencia
  // ================================================================
  _spawnNPCs() {
    this.npcs = this.physics.add.staticGroup();

    const npcDefs = [
      { key: 'gilfoyle',  name: 'Gilfoyle',  x: 200, y: 290, status: 'CODING',            typing: true  },
      { key: 'dinesh',    name: 'Dinesh',    x: 480, y: 290, status: 'CODING',            typing: true  },
      { key: 'jared',     name: 'Jared',     x: 760, y: 290, status: 'OPTIMIZING COSTS', typing: true  },
      { key: 'erlich',    name: 'Erlich',    x: 340, y: 400, status: 'PITCHING',          typing: true  },
      { key: 'jian_yang', name: 'Jian-Yang', x: 620, y: 400, status: 'COOKING??',         typing: true  },
    ];

    npcDefs.forEach(({ key, name, x, y, status, typing }) => {
      const sheetKey = `${key}_type`;
      const animKey  = `${key}_typing`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: 3 }),
          frameRate: 6,
          repeat: -1,
        });
      }
      const npc = this.npcs.create(x, y, sheetKey, 0).setDepth(8).setScale(1.2);
      npc.anims.play(animKey);
      npc.setData('name', name);
      npc.setData('hasBug', false);
      npc.setData('status', status);

      // Etiqueta con nombre + estado debajo del sprite
      this._buildNpcLabel(npc, x, y, name, status);
    });

    // Necesidades periódicas para TODOS los NPCs (incluye Jared/Erlich/Jian-Yang)
    this._scheduleNpcNeeds();
  }

  // Etiqueta flotante bajo el NPC (nombre + estado en color)
  _buildNpcLabel(npc, x, y, name, status) {
    const nameTag = this.add.text(x, y + 32, name.toUpperCase(), {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15);
    npc.setData('nameTag', nameTag);

    if (status) {
      const statusTag = this.add.text(x, y + 46, status, {
        fontSize: '10px', color: '#69f0ae', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(15);
      npc.setData('statusTag', statusTag);
    }
  }

  // ================================================================
  //  SPAWN DE SERVIDORES — siempre 3, nivel persistido
  // ================================================================
  _spawnServers() {
    this.servers = this.physics.add.staticGroup();

    const savedLevels = this.registry.get('serverLevels') ?? [1, 1, 1];

    const defs = [
      { x: 200, y: 158, label: 'PIED PIPER' },
      { x: 480, y: 158, label: 'NUCLEUS'    },
      { x: 760, y: 158, label: 'NUCLEUS 2'  },
    ];

    defs.forEach(({ x, y, label }, i) => {
      const lvl     = savedLevels[i] ?? 1;
      const texOk   = `server_l${lvl}_ok`;
      const texFire = `server_l${lvl}_fire`;
      const server  = this.servers.create(x, y, texOk).setDepth(7).setScale(1.1);
      server.setData('isFixed',   true);
      server.setData('isFailing', false);
      server.setData('label',     label);
      server.setData('id',        i);
      server.setData('lvl',       lvl);
      server.setData('texOk',     texOk);
      server.setData('texFire',   texFire);

      const lvlColors = { 1: '#aaaaaa', 2: '#4fc3f7', 3: '#ffd600' };
      this.add.text(x, y - 57, `LVL ${lvl}`, {
        fontSize: '9px', color: lvlColors[lvl] ?? '#aaaaaa', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(16);
      this.add.text(x, y - 46, label, {
        fontSize: '11px', color: '#4fc3f7', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(16);
      const stateTag = this.add.text(x, y - 33, 'STABLE', {
        fontSize: '10px', color: '#69f0ae', fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(16);
      server.setData('stateTag', stateTag);
    });
  }

  // ================================================================
  //  ESTACIÓN DE CAFÉ — cada cafetera es independiente
  // ================================================================
  _spawnCoffeeStation() {
    const coffeeLvl   = this.registry.get('coffeeLvl')   ?? 1;
    const coffeeCount = this.registry.get('coffeeCount') ?? 1;
    const stats       = COFFEE_LEVELS[coffeeLvl];

    // Array de objetos { img, onCooldown, light, lightBorder }
    this._coffeeStations = [];

    const positions = [55, 100, 145]; // x de cada cafetera en el mostrador

    for (let i = 0; i < coffeeCount; i++) {
      const cx = positions[i];

      const img = this.add.image(cx, 155, 'coffee').setScale(2.0).setDepth(7);

      // Luz indicadora encima de cada cafetera
      const light  = this.add.circle(cx, 141, 5, 0x00e676, 1).setDepth(16);
      const border = this.add.circle(cx, 141, 5).setDepth(16);
      border.setStrokeStyle(2, 0x005c28);
      this.tweens.add({ targets: light, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

      // Número de cafetera
      this.add.text(cx, 163, `#${i + 1}`, {
        fontSize: '8px', color: '#ffb74d', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(16);

      this._coffeeStations.push({ img, onCooldown: false, light, border, cooldown: stats.cooldown });
    }

    // Label general
    const labelX = positions[0] + (coffeeCount - 1) * 22.5;
    this.add.rectangle(labelX, 172, coffeeCount * 48, 14, 0x000000, 0.75).setDepth(14);
    this.add.text(labelX, 172, '[E] COFFEE', {
      fontSize: '9px', color: '#ffb74d', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(15);

    // Compat con código viejo que usa this.coffeeStation
    this.coffeeStation  = this._coffeeStations[0].img;
    this.coffeeStations = this._coffeeStations.map(s => s.img);
  }

  _updateCoffeeLight() {
    // Ya no se usa globalmente — cada cafetera actualiza su propia luz
  }

  // ================================================================
  //  INPUT — Cursores, WASD, teclas de acción
  // ================================================================
  _setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // F → interactuar (reparar servidor / entregar café)
    this.input.keyboard.on(`keydown-${KEYS.INTERACT}`, () => this._checkInteractions());
    // E → recoger café
    this.input.keyboard.on(`keydown-${KEYS.PICK_COFFEE}`, () => this._pickUpCoffee());
    // ESC → pausa
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());
  }

  _togglePause() {
    if (this.roundEnded) return;
    this._paused = !this._paused;

    if (this._paused) {
      this.physics.pause();
      this.time.timeScale = 0;
      this._showPauseOverlay();
    } else {
      this.physics.resume();
      this.time.timeScale = 1;
      this._pauseOverlay?.destroy();
      this._pauseOverlay = null;
    }
  }

  _showPauseOverlay() {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;
    const G  = this.add.graphics().setDepth(60);

    G.fillStyle(0x000000, 0.72);
    G.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    G.fillStyle(0x1a1a2e, 1);
    G.fillRoundedRect(cx - 160, cy - 80, 320, 160, 10);
    G.lineStyle(2, 0x4fc3f7, 1);
    G.strokeRoundedRect(cx - 160, cy - 80, 320, 160, 10);

    const title = this.add.text(cx, cy - 40, 'PAUSA', {
      fontSize: '32px', color: '#4fc3f7', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(61);

    const sub = this.add.text(cx, cy + 10, '[ ESC ] para continuar', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(61);

    this.tweens.add({ targets: sub, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    this._pauseOverlay = this.add.container(0, 0, [G, title, sub]).setDepth(60);
  }

  // ================================================================
  //  DETECCIÓN DE INTERACCIONES — proximidad con objetos
  // ================================================================
  _checkInteractions() {
    const REACH = 60; // píxeles de alcance

    // Servidores en llamas
    this.servers.getChildren().forEach((server) => {
      if (server.getData('isFailing')) {
        const dist = Phaser.Math.Distance.Between(
          this.richard.x, this.richard.y, server.x, server.y,
        );
        if (dist < REACH) this.fixServer(server);
      }
    });

    // Entregar café a NPCs con bug (Gilfoyle/Dinesh)
    this.npcs.getChildren().forEach((npc) => {
      if (npc.getData('hasBug')) {
        const dist = Phaser.Math.Distance.Between(
          this.richard.x, this.richard.y, npc.x, npc.y,
        );
        if (dist < REACH) this.deliverCoffee(npc);
      }
    });

    // Interacción con NPCs pasivos (Erlich, Jared, Jian-Yang)
    const PASSIVE = ['Erlich', 'Jared', 'Jian-Yang'];
    this.npcs.getChildren().forEach((npc) => {
      if (PASSIVE.includes(npc.getData('name'))) {
        const dist = Phaser.Math.Distance.Between(
          this.richard.x, this.richard.y, npc.x, npc.y,
        );
        if (dist < REACH) this._interactPassiveNPC(npc);
      }
    });
  }

  // ================================================================
  //  PROXIMITY HINT — una sola vez por NPC hasta que se aleje
  // ================================================================
  _checkProximityHints() {
    const REACH = 60;
    this.npcs.getChildren().forEach((npc) => {
      if (!npc.getData('hasBug')) {
        npc.setData('hintShown', false);
        return;
      }
      const dist = Phaser.Math.Distance.Between(
        this.richard.x, this.richard.y, npc.x, npc.y,
      );
      const near = dist < REACH;
      if (near && !npc.getData('hintShown') && !this.hasCoffee) {
        npc.setData('hintShown', true);
        this._showFloatingText(this.richard.x, this.richard.y - 20, '¡Necesito café! ☕', '#ffb74d');
      }
      if (!near) npc.setData('hintShown', false);
    });
  }

  // ================================================================
  //  INTERACCIONES ERLICH / JARED / JIAN-YANG
  //  · Erlich:    café → -20 estrés + frase
  //  · Jared:     café → +bonus monedas + frase
  //  · Jian-Yang: café → speed boost 5s + frase
  // ================================================================
  _interactPassiveNPC(npc) {
    if (!npc || !npc.active) return;
    if (npc.getData('interactCooldown')) return;
    const name = npc.getData('name');

    npc.setData('interactCooldown', true);
    this.time.delayedCall(8000, () => npc.setData('interactCooldown', false));

    if (!this.hasCoffee) {
      this._showFloatingText(this.richard.x, this.richard.y - 20, '¡Necesita café! ☕', '#ffb74d');
      return;
    }

    this.coffeeStock = Math.max(0, this.coffeeStock - 1);
    this.hasCoffee   = this.coffeeStock > 0;
    this._emitter.emit('coffee-update', this.coffeeStock);

    // Resolver necesidad activa si la tenía
    if (npc.getData('hasNeed')) {
      npc.setData('hasNeed', false);
      npc.getData('needTimer')?.remove(false);
      npc.getData('needIcon')?.destroy();
      const stTag = npc.getData('statusTag');
      if (stTag) stTag.setText(npc.getData('status') ?? 'IDLE').setColor('#69f0ae');
    }

    if (name === 'Erlich') {
      this.stress = Phaser.Math.Clamp(this.stress - 20, 0, 100);
      this._emitter.emit('stress-update', this.stress);
      this._showFloatingText(npc.x, npc.y - 20, '-20 estrés', '#f06292');
      this._showBuffBanner('🍾 ERLICH BUFF', '-20 ESTRÉS', '#f06292');
      this._showSpeechBubble(npc.x, npc.y, Phaser.Utils.Array.GetRandom(QUOTES.ERLICH), '#f06292');
    } else if (name === 'Jared') {
      const bonus = Phaser.Math.Between(80, 150);
      this.coins += bonus;
      this._emitter.emit('coins-update', this.coins);
      this._showFloatingText(npc.x, npc.y - 20, `+${bonus} monedas`, '#6fa8d6');
      this._showBuffBanner('💼 JARED BUFF', `+${bonus} MONEDAS`, '#6fa8d6');
      this._showSpeechBubble(npc.x, npc.y, Phaser.Utils.Array.GetRandom(QUOTES.JARED), '#6fa8d6');
    } else if (name === 'Jian-Yang') {
      this._speedBoost = true;
      this.time.delayedCall(5000, () => { this._speedBoost = false; });
      this._showFloatingText(npc.x, npc.y - 20, '¡SPEED BOOST x2! 5s', '#f7c948');
      this._showBuffBanner('🍜 JIAN-YANG BUFF', 'VELOCIDAD x2 POR 5s', '#f7c948');
      this._showSpeechBubble(npc.x, npc.y, Phaser.Utils.Array.GetRandom(QUOTES.JIAN_YANG), '#f7c948');
    }
  }

  // Banner central de buff (aparece 2s en pantalla)
  _showBuffBanner(title, subtitle, color = '#ffffff') {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2 - 60;
    const hexCol = Phaser.Display.Color.HexStringToColor(color.replace('#', '')).color;

    const G = this.add.graphics().setDepth(55);
    G.fillStyle(0x000000, 0.82);
    G.fillRoundedRect(cx - 150, cy - 30, 300, 60, 10);
    G.lineStyle(3, hexCol, 1);
    G.strokeRoundedRect(cx - 150, cy - 30, 300, 60, 10);

    const t1 = this.add.text(cx, cy - 10, title, {
      fontSize: '18px', color, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(56);

    const t2 = this.add.text(cx, cy + 14, subtitle, {
      fontSize: '13px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(56);

    this.tweens.add({
      targets: [G, t1, t2], alpha: 0, delay: 1800, duration: 400,
      onComplete: () => { G.destroy(); t1.destroy(); t2.destroy(); },
    });
  }

  // ================================================================
  //  TIMER DE ESTRÉS — sube continuamente, dispara richardVomits()
  // ================================================================
  _startStressTimer() {
    // Cada segundo sube el estrés según la tasa base
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.roundEnded || this.isVomiting) return;
        this.stress = Phaser.Math.Clamp(
          this.stress + STRESS.REGEN_RATE,
          0,
          STRESS.MAX,
        );
        this._emitter.emit('stress-update', this.stress);
        if (this.stress >= STRESS.VOMIT_THRESHOLD) this.richardVomits();
      },
    });
  }

  // ================================================================
  //  FALLOS DE SERVIDOR — aleatorizados
  // ================================================================
  _scheduleServerFailures() {
    this.servers.getChildren().forEach(server => this._scheduleOneFail(server));
  }

  _scheduleOneFail(server) {
    if (this.roundEnded || !server.active) return;
    const lvl   = server.getData('lvl') ?? 1;
    const stats = SERVER_LEVELS[lvl];
    const delay = Phaser.Math.Between(
      Math.floor(stats.failMin / this.difficulty),
      Math.floor(stats.failMax / this.difficulty),
    );
    this.time.delayedCall(delay, () => {
      if (this.roundEnded || !server.active) return;
      // Solo falla si estaba estable
      if (server.getData('isFixed')) this._failServer(server);
    });
  }

  _failRandomServer() {}

  _failServer(server) {
    if (!server.active || server.getData('isFailing')) return;
    server.setData('isFixed', false);
    server.setData('isFailing', true);
    server.setTexture(server.getData('texFire') ?? 'server_fire');
    server.clearTint();

    const tag = server.getData('stateTag');
    if (tag) tag.setText('FAILING').setColor('#ef5350');

    this.tweens.add({
      targets: server, alpha: 0.4, duration: 350, yoyo: true, repeat: -1,
    });

    this._emitter.emit('server-alert', { x: server.x, y: server.y, label: server.getData('label') });

    // Si nadie lo repara en failMax*2 ms, se auto-repara con penalización
    const lvl   = server.getData('lvl') ?? 1;
    const stats = SERVER_LEVELS[lvl];
    const timeout = stats.failMax * 2;
    this.time.delayedCall(timeout, () => {
      if (!server.getData('isFailing') || this.roundEnded) return;
      // Penalización: +estrés, sin recompensa
      this.stress = Phaser.Math.Clamp(this.stress + 20, 0, STRESS.MAX);
      this._emitter.emit('stress-update', this.stress);
      this._showFloatingText(server.x, server.y - 20, '¡Servidor quemado! +20 estrés', '#ef5350', 1500);
      // Forzar reparación sin recompensa
      server.setData('isFixed', true);
      server.setData('isFailing', false);
      server.setTexture(server.getData('texOk') ?? 'server_ok');
      server.setAlpha(1);
      this.tweens.killTweensOf(server);
      const t = server.getData('stateTag');
      if (t) t.setText('OVERHEATED').setColor('#ffb74d');
      this.time.delayedCall(3000, () => {
        if (t) t.setText('STABLE').setColor('#69f0ae');
      });
      if (this.stress >= STRESS.VOMIT_THRESHOLD) this.richardVomits();
      // Reprogramar ciclo
      this._scheduleOneFail(server);
    });
  }

  // ================================================================
  //  NECESIDADES de NPCs pasivos — piden café obligatoriamente
  //  Si Richard no les lleva café en tiempo, sube el estrés
  // ================================================================
  _scheduleNpcNeeds() {
    const PASSIVE = ['Jared', 'Erlich', 'Jian-Yang'];
    const NEED_INTERVAL = 25_000; // cada 25s alguno pide café
    const NEED_TIMEOUT  = 15_000; // 15s para atenderlo antes de penalizar

    this.time.addEvent({
      delay: NEED_INTERVAL,
      loop: true,
      callback: () => {
        if (this.roundEnded) return;
        // Elige un pasivo que no tenga necesidad activa
        const candidates = this.npcs.getChildren().filter(
          n => PASSIVE.includes(n.getData('name')) && !n.getData('hasNeed'),
        );
        if (!candidates.length) return;

        const npc  = Phaser.Utils.Array.GetRandom(candidates);
        const name = npc.getData('name');
        npc.setData('hasNeed', true);

        // Icono de necesidad: misma cafetera sprite q los bugs
        const needIcon = this.add.text(npc.x, npc.y - 36, '☕', {
          fontSize: '22px', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(14);
        npc.setData('needIcon', needIcon);
        this.tweens.add({ targets: needIcon, y: npc.y - 44, duration: 500, yoyo: true, repeat: -1 });

        // Actualizar status tag
        const stTag = npc.getData('statusTag');
        if (stTag) stTag.setText('NEEDS COFFEE!').setColor('#ff9800');

        // Task en UI
        this._emitter.emit('task-add', `Llevar café a ${name}`);

        // Timeout: si no lo atienden, penalizar estrés
        const timer = this.time.delayedCall(NEED_TIMEOUT, () => {
          if (!npc.getData('hasNeed')) return; // ya fue atendido
          npc.setData('hasNeed', false);
          needIcon.destroy();
          if (stTag) stTag.setText(npc.getData('status') ?? 'IDLE').setColor('#69f0ae');
          // Penalización: +15 estrés
          this.stress = Phaser.Math.Clamp(this.stress + 15, 0, STRESS.MAX);
          this._emitter.emit('stress-update', this.stress);
          this._showFloatingText(npc.x, npc.y - 20, `${name} frustrado +15 estrés`, '#ef5350');
          if (this.stress >= STRESS.VOMIT_THRESHOLD) this.richardVomits();
        });
        npc.setData('needTimer', timer);
      },
    });
  }

  // ================================================================
  //  BUGS EN NPCs — con alerta visual tipo "BUG ALERT!"
  // ================================================================
  _scheduleBugSpawns() {
    this.time.addEvent({
      delay: TIME.BUG_SPAWN_INTERVAL / this.difficulty,
      loop: true,
      callback: () => {
        if (this.roundEnded) return;
        const targets = this.npcs.getChildren().filter(
          n => ['Gilfoyle', 'Dinesh'].includes(n.getData('name')) && !n.getData('hasBug'),
        );
        if (!targets.length) return;

        const npc = Phaser.Utils.Array.GetRandom(targets);
        npc.setData('hasBug', true);

        // Actualizar etiqueta de estado
        const stTag = npc.getData('statusTag');
        if (stTag) stTag.setText('BLOCKED!').setColor('#ef5350');

        // Icono bug: mismo sprite coffee q los pasivos
        const bugIcon = this.add.text(npc.x, npc.y - 32, '☕', {
          fontSize: '22px', fontFamily: 'Arial',
        }).setOrigin(0.5).setDepth(14);
        npc.setData('bugIcon', bugIcon);

        this.tweens.add({
          targets: bugIcon,
          y: npc.y - 42,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });

        // Notificar task list
        this._emitter.emit('task-add', `Llevar café a ${npc.getData('name')}`);
      },
    });
  }

  // ================================================================
  //  ERLICH DISCURSO — bloquea una ruta aleatoriamente
  //  TODO: mover a Erlich hacia el centro del pasillo y hacerlo colisionar
  // ================================================================
  _scheduleErlichSpeech() {
    this.time.addEvent({
      delay: 18_000,
      loop: true,
      callback: () => {
        if (this.roundEnded) return;
        const quote = Phaser.Utils.Array.GetRandom(QUOTES.ERLICH);
        const erlich = this.npcs.getChildren().find(n => n.getData('name') === 'Erlich');
        if (!erlich) return;
        // Speech bubble real de Erlich
        this._showSpeechBubble(erlich.x, erlich.y, quote, '#f06292', 4000);

        // Etiqueta especial
        const stTag = erlich.getData('statusTag');
        if (!stTag) {
          const t = this.add.text(erlich.x, erlich.y + 50, 'OBSTRUCTIVE SPEECH', {
            fontSize: '10px', color: '#f06292', fontFamily: 'monospace',
            stroke: '#000', strokeThickness: 2,
          }).setOrigin(0.5).setDepth(15);
          erlich.setData('statusTag', t);
          this.time.delayedCall(4000, () => t?.destroy());
        }
      },
    });
  }

  // ================================================================
  //  EVENTOS ALEATORIOS — lanza EventScene con decisiones
  // ================================================================
  _scheduleRandomEvent() {
    // Primer evento a los 30s, luego cada 45s
    this.time.delayedCall(30_000, () => {
      this._triggerRandomEvent();
      this.time.addEvent({
        delay: 45_000,
        loop: true,
        callback: () => {
          if (!this.roundEnded) this._triggerRandomEvent();
        },
      });
    });
  }

  _triggerRandomEvent() {
    // Pausa GameScene mientras EventScene está activa
    this.scene.pause();
    this.scene.launch(SCENES.EVENT, {
      onComplete: (result) => {
        this._applyEventResult(result);
        this.scene.resume();
      },
    });
  }

  // Aplica las consecuencias del evento elegido por el jugador
  _applyEventResult(result) {
    if (!result) return;
    if (result.coins)      this.coins      += result.coins;
    if (result.stress)     this.stress      = Phaser.Math.Clamp(this.stress + result.stress, 0, 100);
    if (result.difficulty) this.difficulty += result.difficulty;

    // Bancarrota: monedas en negativo = game over
    if (this.coins < 0) {
      this.coins = 0;
      this._emitter.emit('coins-update', this.coins);
      this._emitter.emit('stress-update', this.stress);
      this._showSpeechBubble(
        this.richard.x, this.richard.y,
        '¡BANCARROTA! Pied Piper cayó...', '#ef5350', 2500,
      );
      this.time.delayedCall(2600, () => {
        this.registry.set('coins', 0);
        this.registry.set('bankruptcy', true);
        this._emitter.removeAllListeners();
        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.GAME_OVER);
      });
      return;
    }

    this._emitter.emit('coins-update', this.coins);
    this._emitter.emit('stress-update', this.stress);
  }

  // ================================================================
  //  FIN DE RONDA — guarda datos y pasa a ManagementScene
  // ================================================================
  _endRound() {
    if (this.roundEnded) return;
    this.roundEnded = true;

    // Guardar datos en registry para que ManagementScene los lea
    this.registry.set('coins',      this.coins);
    this.registry.set('codeLines',  this.codeLines);
    this.registry.set('difficulty', this.difficulty);

    // Destruir emisor antes de salir para evitar leaks
    this._emitter.removeAllListeners();

    // Detener UIScene y pasar a gestión
    this.scene.stop(SCENES.UI);
    this.scene.start(SCENES.MANAGEMENT);
  }

  // ================================================================
  //  SPEECH BUBBLE — globo de diálogo estilo cómic
  //  @param x, y      posición del personaje
  //  @param msg       texto dentro del globo
  //  @param color     color del borde del globo
  //  @param duration  ms que dura (default 3000)
  // ================================================================
  _showSpeechBubble(x, y, msg, color = '#ffffff', duration = 3000) {
    const DEPTH  = 30;
    const PAD    = 8;
    const maxW   = 140;

    // Texto primero para medir su tamaño
    const txt = this.add.text(x, y, msg, {
      fontSize: '12px',
      color: '#000000',
      fontFamily: 'monospace',
      wordWrap: { width: maxW - PAD * 2 },
    }).setDepth(DEPTH + 1).setOrigin(0.5, 1);

    const bw = Math.min(txt.width  + PAD * 2, maxW + PAD * 2);
    const bh = txt.height + PAD * 2;
    const bx = x - bw / 2;
    const by = y - bh - 14;  // 14 = espacio para la punta

    // Fondo blanco del globo
    const bg = this.add.graphics().setDepth(DEPTH);
    const hexBorder = Phaser.Display.Color.HexStringToColor(color.replace('#', '')).color;
    bg.fillStyle(0xffffff, 0.96);
    bg.fillRoundedRect(bx, by, bw, bh, 6);
    bg.lineStyle(2, hexBorder, 1);
    bg.strokeRoundedRect(bx, by, bw, bh, 6);
    // Punta del globo (triángulo hacia abajo apuntando al personaje)
    bg.fillStyle(0xffffff, 0.96);
    bg.fillTriangle(x - 6, by + bh, x + 6, by + bh, x, by + bh + 10);
    bg.lineStyle(2, hexBorder, 1);
    bg.lineBetween(x - 6, by + bh, x, by + bh + 10);
    bg.lineBetween(x + 6, by + bh, x, by + bh + 10);

    // Reposicionar el texto dentro del globo
    txt.setPosition(bx + bw / 2, by + bh / 2 + 2).setOrigin(0.5, 0.5);

    // Destruir después de duration
    this.time.delayedCall(duration, () => { bg.destroy(); txt.destroy(); });
  }

  // Texto flotante simple (para recompensas rápidas)
  _showFloatingText(x, y, msg, color = '#ffffff', duration = 1000) {
    const txt = this.add.text(x, y, msg, {
      fontSize: '13px', color, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: txt, y: y - 35, alpha: 0, duration,
      ease: 'Power2', onComplete: () => txt.destroy(),
    });
  }
}
