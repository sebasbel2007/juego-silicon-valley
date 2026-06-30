// ============================================================
//  StressSystem.js — Lógica de estrés desacoplada de GameScene
//
//  Uso:
//    import StressSystem from '../systems/StressSystem.js';
//    this.stressSystem = new StressSystem(scene, GameEvents);
//    // En update: this.stressSystem.tick(delta);
// ============================================================

import { STRESS } from '../data/constants.js';

export default class StressSystem {
  constructor(scene, emitter) {
    this.scene   = scene;
    this.emitter = emitter;
    this.value   = 0;
    this._accum  = 0;    // acumulador de delta para el tick por segundo
  }

  get current() { return this.value; }

  // Llamar cada frame desde update()
  tick(delta) {
    this._accum += delta;
    if (this._accum >= 1000) {
      this._accum -= 1000;
      this.value = Phaser.Math.Clamp(
        this.value + STRESS.REGEN_RATE, 0, STRESS.MAX,
      );
      this.emitter.emit('stress-update', this.value);
    }
    return this.value;
  }

  reduce(amount) {
    this.value = Phaser.Math.Clamp(this.value - amount, 0, STRESS.MAX);
    this.emitter.emit('stress-update', this.value);
  }

  isMaxed() {
    return this.value >= STRESS.VOMIT_THRESHOLD;
  }

  reset(to = 0) {
    this.value = to;
    this.emitter.emit('stress-update', this.value);
  }
}
