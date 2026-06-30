// ============================================================
//  BootScene.js — Primera escena que corre Phaser
//  Genera texturas de placeholder (rectángulos de color) para
//  poder desarrollar y testear sin tener sprites finales.
//  Cuando tengas los assets reales, elimina los generateTexture()
//  y carga los archivos en PreloadScene.
// ============================================================

import { SCENES } from '../data/constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  create() {
    this._generatePlaceholders();
    this.scene.start(SCENES.PRELOAD);
  }

  // ------------------------------------------------------------------
  //  Genera texturas básicas de color sólido para todos los sprites
  //  del juego. Nombradas igual que los keys que usará PreloadScene.
  // ------------------------------------------------------------------
  _generatePlaceholders() {
    this._makeFloor();
    this._makeWall();
    this._makeServer(false);
    this._makeServer(true);
    this._makeCoffee();
    this._makeCoin();
    this._makeBugIcon();
    this._makeRichardWalkSheet();
    this._makeCharacter('richard',   0x5b8dd9, 0xf4c98a, 0x3a5fa0); // hoodie azul
    this._makeCharacter('gilfoyle',  0x222222, 0xd4a574, 0x111111); // todo negro
    this._makeCharacter('dinesh',    0x2d7a3a, 0xc8956b, 0x1a4f24); // verde
    this._makeCharacter('erlich',    0xc0623a, 0xf4c98a, 0x8b3a1e); // bata rosa/rojo
    this._makeCharacter('jared',     0x6fa8d6, 0xfce4ca, 0x4a7da8); // camisa azul claro
    this._makeCharacter('jian_yang', 0xf7c948, 0xd4956b, 0xc9982a); // amarillo
    this._makeTypingSheet('gilfoyle',  0x222222, 0xd4a574, 0x111111);
    this._makeTypingSheet('dinesh',    0x2d7a3a, 0xc8956b, 0x1a4f24);
    this._makeTypingSheet('jared',     0x6fa8d6, 0xfce4ca, 0x4a7da8);
    this._makeTypingSheet('erlich',    0xc0623a, 0xf4c98a, 0x8b3a1e);
    this._makeTypingSheet('jian_yang', 0xf7c948, 0xd4956b, 0xc9982a);
  }

  // Spritesheet de caminata de Richard: 4 cols × 4 filas, cada frame 32×48
  // Fila 0: walk_down  Fila 1: walk_up  Fila 2: walk_side  Fila 3: idle
  _makeRichardWalkSheet() {
    if (this.textures.exists('richard_walk')) return;
    const FW = 32, FH = 48, COLS = 4, ROWS = 4;
    const g = this.make.graphics({ add: false });

    const drawFrame = (col, row, legPhase, facingUp, side, flip) => {
      const ox = col * FW, oy = row * FH;
      const skin = 0xf4c98a, body = 0x5b8dd9, leg = 0x3a5fa0, shoe = 0x1a1008;

      // sombra
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(ox + 16, oy + 46, 18, 5);

      // piernas animadas
      const legOff = legPhase === 0 ? [-3, 3] : legPhase === 1 ? [-1, 1] : legPhase === 2 ? [3, -3] : [1, -1];
      g.fillStyle(leg, 1);
      g.fillRect(ox + 8,  oy + 30 + legOff[0], 6, 12);
      g.fillRect(ox + 18, oy + 30 + legOff[1], 6, 12);
      g.fillStyle(shoe, 1);
      g.fillRect(ox + 7,  oy + 40 + legOff[0], 8, 5);
      g.fillRect(ox + 17, oy + 40 + legOff[1], 8, 5);

      // torso
      g.fillStyle(body, 1);
      g.fillRect(ox + 7, oy + 18, 18, 14);
      g.fillStyle(0x3a5fa0, 1);
      g.fillRect(ox + 7, oy + 18, 18, 3);

      // brazos
      const armSwing = legPhase === 0 || legPhase === 2 ? 2 : -2;
      g.fillStyle(body, 1);
      if (side) {
        // de costado: un brazo visible
        g.fillRect(flip ? ox + 20 : ox + 6, oy + 19 + armSwing, 5, 10);
      } else {
        g.fillRect(ox + 2,  oy + 19 + armSwing,  5, 10);
        g.fillRect(ox + 25, oy + 19 - armSwing, 5, 10);
      }

      // cabeza
      g.fillStyle(skin, 1);
      g.fillRect(ox + 9, oy + 4, 14, 15);
      // pelo
      g.fillStyle(0x5c3d1e, 1);
      g.fillRect(ox + 9, oy + 2, 14, 5);
      g.fillRect(ox + 7, oy + 4, 3, 7);
      g.fillRect(ox + 22, oy + 4, 3, 7);

      if (!facingUp && !side) {
        // cara frontal: ojos + boca
        g.fillStyle(0xffffff, 1);
        g.fillRect(ox + 11, oy + 9, 3, 3);
        g.fillRect(ox + 18, oy + 9, 3, 3);
        g.fillStyle(0x1a1a1a, 1);
        g.fillRect(ox + 12, oy + 10, 2, 2);
        g.fillRect(ox + 19, oy + 10, 2, 2);
        g.fillRect(ox + 11, oy + 15, 10, 2);
        g.fillRect(ox + 10, oy + 14, 2, 2);
        g.fillRect(ox + 20, oy + 14, 2, 2);
      } else if (facingUp) {
        // espalda: nuca
        g.fillStyle(0x5c3d1e, 1);
        g.fillRect(ox + 9, oy + 4, 14, 8);
      } else {
        // perfil: un ojo, nariz
        const ex = flip ? ox + 11 : ox + 18;
        g.fillStyle(0xffffff, 1); g.fillRect(ex, oy + 9, 3, 3);
        g.fillStyle(0x1a1a1a, 1); g.fillRect(ex + 1, oy + 10, 2, 2);
        g.fillStyle(skin, 1); g.fillRect(flip ? ox + 9 : ox + 22, oy + 11, 2, 3);
      }
    };

    // Fila 0: walk_down  (frontal, 4 pasos)
    [0,1,2,3].forEach(c => drawFrame(c, 0, c, false, false, false));
    // Fila 1: walk_up    (espalda, 4 pasos)
    [0,1,2,3].forEach(c => drawFrame(c, 1, c, true, false, false));
    // Fila 2: walk_side  (perfil derecha, 4 pasos)
    [0,1,2,3].forEach(c => drawFrame(c, 2, c, false, true, false));
    // Fila 3: idle       (frontal estático)
    [0,1,2,3].forEach(c => drawFrame(c, 3, 1, false, false, false));

    g.generateTexture('richard_walk', FW * COLS, FH * ROWS);
    g.destroy();

    // Registrar como spritesheet con frames numerados
    this.textures.get('richard_walk').add(
      '__BASE', 0, 0, 0, FW * COLS, FH * ROWS
    );
    const tex = this.textures.get('richard_walk');
    let idx = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        tex.add(idx, 0, col * FW, row * FH, FW, FH);
        idx++;
      }
    }
  }

  // Suelo: tablones de madera oscura tipo oficina
  _makeFloor() {
    if (this.textures.exists('floor_tile')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x4a5568, 1);  g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x3d4a5c, 1);  g.fillRect(0, 0, 32, 16);
    g.lineStyle(1, 0x2d3748, 0.8);
    g.strokeRect(0, 0, 32, 32);
    g.lineStyle(1, 0x5a6a7a, 0.3);
    g.lineBetween(0, 16, 32, 16);
    g.generateTexture('floor_tile', 32, 32);
    g.destroy();
  }

  // Pared: beige/crema tipo casa californiana
  _makeWall() {
    if (this.textures.exists('wall_tile')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xc8a96e, 1);  g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0xa8894e, 0.6);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture('wall_tile', 32, 32);
    g.destroy();
  }

  // ---------------------------------------------------------------
  //  SERVIDORES — 3 niveles x 2 estados (ok / fire)
  //  Lvl1: 28x44  pequeño, azul claro, 3 LEDs
  //  Lvl2: 40x64  actual  , azul oscuro, 6 LEDs  (el clásico)
  //  Lvl3: 72x64  doble ancho, 2 columnas de LEDs, borde dorado
  // ---------------------------------------------------------------
  _makeServer(onFire) {
    // Llama a los 3 niveles para no romper referencias viejas
    this._makeServerLvl(1, onFire);
    this._makeServerLvl(2, onFire);
    this._makeServerLvl(3, onFire);
  }

  _makeServerLvl(lvl, onFire) {
    const suffix = onFire ? '_fire' : '_ok';
    const key    = `server_l${lvl}${suffix}`;
    // alias sin nivel para compatibilidad con código existente (lvl2 = default)
    const alias  = lvl === 2 ? (onFire ? 'server_fire' : 'server_ok') : null;
    if (this.textures.exists(key)) return;

    const g = this.make.graphics({ add: false });
    const ledOk   = 0x00e676;
    const ledFire = 0xef5350;
    const led     = onFire ? ledFire : ledOk;

    if (lvl === 1) {
      // --- LVL 1: pequeño, bisel cyan claro ---
      const W = 28, H = 44;
      // cuerpo
      g.fillStyle(0x0d2137, 1);  g.fillRect(0, 0, W, H);
      // degradado lateral izq (reflejo)
      g.fillStyle(0x1a4a6e, 0.5); g.fillRect(0, 0, 4, H);
      // borde
      g.lineStyle(2, 0x29b6f6, 1); g.strokeRect(0, 0, W, H);
      // franja superior de marca
      g.fillStyle(0x29b6f6, 0.9); g.fillRect(2, 2, W - 4, 4);
      // 3 filas de LED + barra
      for (let i = 0; i < 3; i++) {
        g.fillStyle(led, 1);        g.fillRect(3,  12 + i * 10, 5, 4);
        g.fillStyle(led, 0.3);      g.fillRect(3,  12 + i * 10, 5, 4); // glow
        g.fillStyle(0x29b6f6, 0.5); g.fillRect(11, 13 + i * 10, 14, 2);
      }
      if (onFire) {
        g.fillStyle(0xff6b00, 0.9); g.fillTriangle(5, 0, 14, -10, 23, 0);
        g.fillStyle(0xffcc00, 0.9); g.fillTriangle(9, 0, 14, -7,  19, 0);
      }
      g.generateTexture(key, W, H + (onFire ? 10 : 0));

    } else if (lvl === 2) {
      // --- LVL 2: clásico (igual que antes) ---
      const W = 40, H = 64;
      g.fillStyle(0x1a1a2e, 1);    g.fillRect(0, 0, W, H);
      g.fillStyle(0x252550, 0.5);  g.fillRect(0, 0, 5, H);
      g.lineStyle(2, 0x4fc3f7, 1); g.strokeRect(0, 0, W, H);
      g.fillStyle(0x4fc3f7, 0.8);  g.fillRect(2, 2, W - 4, 4);
      for (let i = 0; i < 6; i++) {
        g.fillStyle(led, 1);        g.fillRect(4,  10 + i * 9, 6, 4);
        g.fillStyle(0x4fc3f7, 0.5); g.fillRect(14, 11 + i * 9, 22, 2);
      }
      if (onFire) {
        g.fillStyle(0xff6b00, 0.9); g.fillTriangle(8,  0, 20, -12, 32, 0);
        g.fillStyle(0xffcc00, 0.9); g.fillTriangle(12, 0, 20, -8,  28, 0);
      }
      g.generateTexture(key, W, H + (onFire ? 12 : 0));

    } else {
      // --- LVL 3: doble ancho, borde dorado, 2 columnas de LEDs ---
      const W = 76, H = 64;
      // cuerpo base oscuro
      g.fillStyle(0x0a0a1a, 1);    g.fillRect(0, 0, W, H);
      // panel izquierdo y derecho (dos módulos)
      g.fillStyle(0x1a1a2e, 1);    g.fillRect(2,  2, 34, H - 4);
      g.fillStyle(0x1a1a2e, 1);    g.fillRect(40, 2, 34, H - 4);
      // divisor central
      g.fillStyle(0xffd600, 0.6);  g.fillRect(37, 0, 2, H);
      // borde dorado premium
      g.lineStyle(2, 0xffd600, 1); g.strokeRect(0, 0, W, H);
      // franja superior dorada
      g.fillStyle(0xffd600, 0.9);  g.fillRect(2, 2, W - 4, 4);
      // columna izq: 6 LEDs
      for (let i = 0; i < 6; i++) {
        g.fillStyle(led, 1);        g.fillRect(5,  10 + i * 9, 6, 4);
        g.fillStyle(0x4fc3f7, 0.5); g.fillRect(14, 11 + i * 9, 20, 2);
      }
      // columna der: 6 LEDs
      for (let i = 0; i < 6; i++) {
        g.fillStyle(led, 1);        g.fillRect(43, 10 + i * 9, 6, 4);
        g.fillStyle(0x4fc3f7, 0.5); g.fillRect(52, 11 + i * 9, 20, 2);
      }
      // logo estrella dorada en centro inferior
      g.fillStyle(0xffd600, 0.9);
      g.fillRect(35, H - 12, 6, 2);
      g.fillRect(37, H - 14, 2, 6);
      if (onFire) {
        g.fillStyle(0xff6b00, 0.9); g.fillTriangle(10, 0, 38, -14, 66, 0);
        g.fillStyle(0xffcc00, 0.9); g.fillTriangle(18, 0, 38, -9,  58, 0);
        g.fillStyle(0xff4400, 0.7); g.fillTriangle(28, 0, 38, -6,  48, 0);
      }
      g.generateTexture(key, W, H + (onFire ? 14 : 0));
    }

    g.destroy();

    // Alias lvl2 para compatibilidad
    if (alias && !this.textures.exists(alias)) {
      const src  = this.textures.get(key);
      const img  = src.getSourceImage();
      this.textures.addImage(alias, img);
    }
  }

  _makeCoffee() {
    if (this.textures.exists('coffee')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x5d4037, 1); g.fillRect(3, 4, 10, 12);
    g.fillStyle(0x795548, 1); g.fillRect(4, 5, 8, 10);
    g.fillStyle(0x3e2723, 1); g.fillRect(4, 5, 8, 4);
    g.lineStyle(1, 0x000, 0.8); g.strokeRect(3, 4, 10, 12);
    g.generateTexture('coffee', 16, 20);
    g.destroy();
  }

  _makeCoin() {
    if (this.textures.exists('coin_icon')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffd600, 1); g.fillCircle(8, 8, 7);
    g.fillStyle(0xffea00, 1); g.fillCircle(8, 8, 5);
    g.fillStyle(0xffa000, 1);
    g.fillRect(7, 4, 2, 8);
    g.generateTexture('coin_icon', 16, 16);
    g.destroy();
  }

  _makeBugIcon() {
    if (this.textures.exists('bug_icon')) return;
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xff1744, 1); g.fillCircle(10, 10, 8);
    g.fillStyle(0xffffff, 1);
    g.fillRect(7, 6, 2, 6);   // cuerpo del bug
    g.fillRect(11, 6, 2, 6);
    g.fillRect(6, 13, 8, 2);
    g.generateTexture('bug_icon', 20, 20);
    g.destroy();
  }

  // Personaje pixel-art detallado 32x56px
  _makeCharacter(key, bodyColor, skinColor, legColor) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ add: false });
    const W = 32, H = 56;

    // --- Sombra elíptica ---
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(16, 54, 22, 6);

    // --- Piernas ---
    g.fillStyle(legColor, 1);
    g.fillRect(9,  36, 6, 14);
    g.fillRect(17, 36, 6, 14);
    // Pliegue rodilla (versión oscura del color de pierna)
    g.fillStyle(this._colorDarker(legColor, 30), 1);
    g.fillRect(9,  42, 6, 2);
    g.fillRect(17, 42, 6, 2);

    // --- Zapatos ---
    g.fillStyle(0x1a1008, 1);
    g.fillRect(8,  48, 8, 6);
    g.fillRect(16, 48, 8, 6);
    // Suela
    g.fillStyle(0x333333, 1);
    g.fillRect(8,  52, 9, 2);
    g.fillRect(16, 52, 9, 2);

    // --- Torso ---
    g.fillStyle(bodyColor, 1);
    g.fillRect(8, 22, 16, 16);
    // Detalle ropa (bolsillo/cremallera/cuello)
    g.fillStyle(this._colorDarker(bodyColor, 40), 1);
    g.fillRect(8, 22, 16, 3);   // hombros
    g.fillRect(14, 24, 4, 10);  // cierre/cremallera central

    // --- Brazos ---
    g.fillStyle(bodyColor, 1);
    g.fillRect(2,  22, 6, 12);   // brazo izq
    g.fillRect(24, 22, 6, 12);   // brazo der
    // Codo
    g.fillStyle(this._colorDarker(bodyColor, 30), 1);
    g.fillRect(2,  29, 6, 2);
    g.fillRect(24, 29, 6, 2);

    // --- Manos ---
    g.fillStyle(skinColor, 1);
    g.fillRect(2,  33, 6, 5);
    g.fillRect(24, 33, 6, 5);

    // --- Cuello ---
    g.fillStyle(skinColor, 1);
    g.fillRect(13, 18, 6, 5);

    // --- Cabeza ---
    g.fillStyle(skinColor, 1);
    g.fillRect(8, 6, 16, 14);
    // Mejillas
    g.fillStyle(this._colorDarker(skinColor, -20), 1);
    g.fillRect(8,  14, 3, 4);
    g.fillRect(21, 14, 3, 4);

    // --- Ojos ---
    g.fillStyle(0xffffff, 1);
    g.fillRect(10, 10, 4, 4);
    g.fillRect(18, 10, 4, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(11, 11, 2, 2);
    g.fillRect(19, 11, 2, 2);
    // Brillo del ojo
    g.fillStyle(0xffffff, 1);
    g.fillRect(12, 11, 1, 1);
    g.fillRect(20, 11, 1, 1);

    // --- Cejas ---
    g.fillStyle(this._hairColor(key), 1);
    g.fillRect(10, 8, 4, 2);
    g.fillRect(18, 8, 4, 2);

    // --- Pelo (personalizado por personaje) ---
    g.fillStyle(this._hairColor(key), 1);
    // Base del pelo
    g.fillRect(8, 2, 16, 6);
    g.fillRect(6, 4, 2, 8);    // sien izq
    g.fillRect(24, 4, 2, 8);   // sien der

    if (key === 'erlich') {
      // Erlich: bata + pelo largo castaño + barba
      g.fillStyle(0xb8860b, 1); // bata dorada/naranja
      g.fillRect(5, 22, 4, 20);
      g.fillRect(23, 22, 4, 20);
      g.fillStyle(0x8B4513, 1);
      g.fillRect(4, 4, 3, 16);  // pelo largo izq
      g.fillRect(25, 4, 3, 16); // pelo largo der
      g.fillRect(8, 18, 16, 5); // barba
    }
    if (key === 'gilfoyle') {
      // Gilfoyle: todo negro, pelo largo oscuro, cara seria
      g.fillStyle(0x111111, 1);
      g.fillRect(5, 4, 3, 16);  // pelo largo izq
      g.fillRect(24, 4, 3, 16); // pelo largo der
      // Expresión seria: boca plana
      g.fillStyle(0x8b4513, 1);
      g.fillRect(12, 16, 8, 1); // boca plana
    }
    if (key === 'dinesh') {
      // Dinesh: pelo corto oscuro, camisa verde
      g.fillStyle(0x111111, 1);
      g.fillRect(8, 2, 16, 4);
      // Sonrisa
      g.fillStyle(0x8b2020, 1);
      g.fillRect(12, 16, 8, 2);
      g.fillRect(11, 15, 2, 2);
      g.fillRect(19, 15, 2, 2);
    }
    if (key === 'jared') {
      // Jared: pelo rubio/claro, corbata
      g.fillStyle(0xffe4b5, 1);
      g.fillRect(8, 2, 16, 4);
      g.fillStyle(0x4169e1, 1);
      g.fillRect(14, 25, 4, 12); // corbata
    }
    if (key === 'jian_yang') {
      // Jian-Yang: pelo negro muy corto
      g.fillStyle(0x0a0a0a, 1);
      g.fillRect(8, 2, 16, 4);
    }

    // Contorno general
    g.lineStyle(1, 0x00000088, 1);
    g.strokeRect(8, 6, 16, 14);  // cabeza
    g.strokeRect(8, 22, 16, 16); // torso

    g.generateTexture(key, W, H);
    g.destroy();
  }

  // Spritesheet typing: 4 frames, brazos alternando sobre teclado
  _makeTypingSheet(key, bodyColor, skinColor, legColor) {
    const sheetKey = `${key}_type`;
    if (this.textures.exists(sheetKey)) return;
    const FW = 32, FH = 56, COLS = 4;
    const g = this.make.graphics({ add: false });

    const drawFrame = (col, phase) => {
      const ox = col * FW;
      // sombra
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(ox + 16, 53, 18, 5);
      // piernas quietas
      g.fillStyle(legColor, 1);
      g.fillRect(ox + 9,  38, 6, 12);
      g.fillRect(ox + 17, 38, 6, 12);
      g.fillStyle(this._colorDarker(legColor, 30), 1);
      g.fillRect(ox + 9,  44, 6, 2);
      g.fillRect(ox + 17, 44, 6, 2);
      g.fillStyle(0x1a1008, 1);
      g.fillRect(ox + 8,  48, 8, 6);
      g.fillRect(ox + 16, 48, 8, 6);
      g.fillStyle(0x333333, 1);
      g.fillRect(ox + 8,  52, 9, 2);
      g.fillRect(ox + 16, 52, 9, 2);
      // torso
      g.fillStyle(bodyColor, 1);
      g.fillRect(ox + 8, 22, 16, 16);
      g.fillStyle(this._colorDarker(bodyColor, 40), 1);
      g.fillRect(ox + 8, 22, 16, 3);
      g.fillRect(ox + 14, 24, 4, 10);
      // brazos: izq y der se alternan 3px arriba/abajo
      const lOff = (phase < 2) ? 3 : 0;
      const rOff = (phase < 2) ? 0 : 3;
      g.fillStyle(bodyColor, 1);
      g.fillRect(ox + 2,  22 + lOff, 6, 10);
      g.fillRect(ox + 24, 22 + rOff, 6, 10);
      g.fillStyle(this._colorDarker(bodyColor, 30), 1);
      g.fillRect(ox + 2,  28 + lOff, 6, 2);
      g.fillRect(ox + 24, 28 + rOff, 6, 2);
      // manos sobre teclado
      g.fillStyle(skinColor, 1);
      g.fillRect(ox + 2,  31 + lOff, 6, 4);
      g.fillRect(ox + 24, 31 + rOff, 6, 4);
      // cuello + cabeza
      g.fillStyle(skinColor, 1);
      g.fillRect(ox + 13, 18, 6, 5);
      g.fillRect(ox + 8,  6,  16, 14);
      g.fillStyle(this._colorDarker(skinColor, -20), 1);
      g.fillRect(ox + 8,  14, 3, 4);
      g.fillRect(ox + 21, 14, 3, 4);
      // pelo
      g.fillStyle(this._hairColor(key), 1);
      g.fillRect(ox + 8, 2, 16, 6);
      g.fillRect(ox + 6, 4, 2, 8);
      g.fillRect(ox + 24, 4, 2, 8);
      // pelo largo gilfoyle
      if (key === 'gilfoyle') {
        g.fillStyle(0x111111, 1);
        g.fillRect(ox + 5, 4, 3, 16);
        g.fillRect(ox + 24, 4, 3, 16);
      }
      // ojos mirando monitor (un píxel más abajo)
      g.fillStyle(0xffffff, 1);
      g.fillRect(ox + 10, 10, 4, 3);
      g.fillRect(ox + 18, 10, 4, 3);
      g.fillStyle(0x1a1a1a, 1);
      g.fillRect(ox + 11, 11, 2, 2);
      g.fillRect(ox + 19, 11, 2, 2);
      g.fillStyle(0xffffff, 1);
      g.fillRect(ox + 12, 11, 1, 1);
      g.fillRect(ox + 20, 11, 1, 1);
      // cejas
      g.fillStyle(this._hairColor(key), 1);
      g.fillRect(ox + 10, 8, 4, 2);
      g.fillRect(ox + 18, 8, 4, 2);
      // contorno
      g.lineStyle(1, 0x00000088, 1);
      g.strokeRect(ox + 8, 6, 16, 14);
      g.strokeRect(ox + 8, 22, 16, 16);
    };

    [0, 1, 2, 3].forEach(c => drawFrame(c, c));

    g.generateTexture(sheetKey, FW * COLS, FH);
    g.destroy();

    const tex = this.textures.get(sheetKey);
    tex.add('__BASE', 0, 0, 0, FW * COLS, FH);
    for (let i = 0; i < COLS; i++) tex.add(i, 0, i * FW, 0, FW, FH);
  }

  // Helpers de color
  _darken(hex) {
    const r = Math.max(0, (hex >> 16 & 0xff) - 40);
    const g = Math.max(0, (hex >> 8  & 0xff) - 40);
    const b = Math.max(0, (hex       & 0xff) - 40);
    return [r, g, b, 255];
  }
  _colorDarker(hex, amount = 40) {
    const r = Math.max(0, Math.min(255, (hex >> 16 & 0xff) - amount));
    const g = Math.max(0, Math.min(255, (hex >> 8  & 0xff) - amount));
    const b = Math.max(0, Math.min(255, (hex       & 0xff) - amount));
    return (r << 16) | (g << 8) | b;
  }
  _hairColor(key) {
    return { richard: 0x5c3d1e, gilfoyle: 0x111111, dinesh: 0x1a1a1a,
             erlich: 0x8B4513, jared: 0xf0e0c0, jian_yang: 0x0a0a0a }[key] ?? 0x333333;
  }
}
