// ============================================================
//  constants.js — Valores globales del juego
//  Edita aquí para balancear sin tocar la lógica de escenas
// ============================================================

export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
  TILE_SIZE: 32,
  FPS: 60,
};

// Duraciones en milisegundos
export const TIME = {
  ROUND_DURATION: 120_000,   // 2 minutos por ronda
  SERVER_FAIL_MIN: 8_000,    // tiempo mínimo entre fallos de servidor
  SERVER_FAIL_MAX: 20_000,   // tiempo máximo entre fallos de servidor
  BUG_SPAWN_INTERVAL: 10_000,// cada cuánto aparece un bug sobre un personaje
  VOMIT_DURATION: 3_000,     // tiempo que dura la animación de vómito
  COFFEE_COOLDOWN: 5_000,    // cooldown para llevar café
};

// Valores de estrés (0-100)
export const STRESS = {
  MAX: 100,
  REGEN_RATE: 4,             // puntos por segundo que sube el estrés
  FIX_SERVER_REDUCE: 25,     // estrés que baja al reparar un servidor
  DELIVER_COFFEE_REDUCE: 15, // estrés que baja al entregar café
  VOMIT_THRESHOLD: 100,      // estrés al que colapsa Richard
};

// Compras de objetos nuevos
export const SHOP = {
  BUY_SERVER_COST:  600,   // comprar servidor adicional (max 3 total)
  BUY_COFFEE_COST:  350,   // comprar cafetera adicional (max 3 total)
};

// Niveles de cafetera — cada cafetera individual tiene este cooldown
export const COFFEE_LEVELS = {
  1: { cooldown: 5_000, upgradeCost: 300 },
  2: { cooldown: 3_000, upgradeCost: 600 },
  3: { cooldown: 1_500, upgradeCost: null },
};

// Niveles de servidor — stats por nivel
export const SERVER_LEVELS = {
  1: {
    failMin:      8_000,   // ms mínimo entre fallos
    failMax:     20_000,
    coinsReward:     50,   // monedas al reparar
    stressReduce:    25,   // estrés que baja
    codeBonus:        1,   // multiplicador de líneas de código
    upgradeCost:    400,   // costo para subir al siguiente nivel
  },
  2: {
    failMin:     14_000,
    failMax:     28_000,
    coinsReward:    100,
    stressReduce:    30,
    codeBonus:        1,
    upgradeCost:    800,
  },
  3: {
    failMin:     22_000,
    failMax:     42_000,
    coinsReward:    180,
    stressReduce:    35,
    codeBonus:        2,   // cuenta como 2 servidores en líneas
    upgradeCost:   null,   // máximo nivel
  },
};

// Economía
export const ECONOMY = {
  COINS_PER_LINE: 2,
  COINS_PER_SERVER_FIXED: 50,
  SERVER_UPGRADE_COST: 500,
  HIRE_JARED_COST: 800,
  HIRE_BIGHEAD_COST: 600,
  MARKETING_COST: 400,
  LAWYER_FEE: 3000,          // evento Gavin Belson
};

// Niveles de dificultad acumulada
export const DIFFICULTY = {
  BASE_BUG_SPEED: 1,
  MARKETING_BUG_MULTIPLIER: 2,
  HYPE_COIN_MULTIPLIER: 1.5,
};

// Teclas de acción
export const KEYS = {
  INTERACT: 'F',
  PICK_COFFEE: 'E',
  PAUSE: 'ESC',
};

// Nombres de escenas (evita typos)
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
  MANAGEMENT: 'ManagementScene',
  EVENT: 'EventScene',
  GAME_OVER: 'GameOverScene',
};

// Frases icónicas en ESPAÑOL
export const QUOTES = {
  FAIL: [
    '¡Siempre azul! ¡Siempre azul!',
    'Error del sistema.',
    'Los tabs... eran espacios todo el tiempo.',
    '¡Richard se derrumbó!',
  ],
  GILFOYLE: [
    'Me burlo de tu tecnología.',
    'Tu servidor es una vergüenza.',
    'Eso no es un bug, eso es tu código.',
    'Predije este fallo hace tres días.',
  ],
  JARED: [
    '¡Yo establezco el dominio!',
    'Negocié una situación de rehenes con tablas dinámicas.',
    'Puedo optimizar eso... y tu vida.',
    '¡Richard, confío en ti completamente!',
  ],
  ERLICH: [
    'Soy un visionario. Punto.',
    'Esto no es una startup, es un movimiento.',
    '¡Esta es MI incubadora!',
    'Mi discurso de seda motiva a todos.',
  ],
  DINESH: [
    '¿Sabes cuánto gano? Más que tú.',
    'Mi código es poesía.',
    'Gilfoyle no sabe nada de moda.',
    '¡Finalmente, modo dios activado!',
  ],
  JIAN_YANG: [
    'Esto no es una app de comida.',
    '...SeeFood.',
    '*tira comida al suelo*',
  ],
};
