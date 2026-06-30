# 🖥 Incubator Chaos
> A Silicon Valley pixel-art game · Phaser 3 + JavaScript

---

## 🚀 Cómo correr el juego

### Opción A — Live Server (recomendado para VS Code)
1. Instala la extensión **Live Server** en VS Code.
2. Click derecho en `index.html` → **Open with Live Server**.

### Opción B — Terminal
```bash
npm install
npm run dev
```
Abre `http://localhost:3000` en el navegador.

> ⚠️ El juego usa ES Modules (`type="module"`), por lo que **necesita** un servidor HTTP local.  
> No funciona abriendo `index.html` directamente con doble click.

---

## 🗂 Estructura del Proyecto

```
matias juego/
│
├── index.html                  # Punto de entrada HTML
├── package.json
│
├── assets/
│   ├── sprites/                # PNGs de personajes y objetos
│   ├── tilemaps/               # JSON de Tiled para el mapa
│   ├── audio/                  # OGG/MP3 para música y SFX
│   └── fonts/                  # Fuentes bitmap (opcional)
│
└── src/
    ├── main.js                 # Config de Phaser + registro de escenas
    │
    ├── data/
    │   └── constants.js        # ← Todos los valores del juego aquí
    │
    ├── scenes/
    │   ├── BootScene.js        # Genera placeholders, arranca primero
    │   ├── PreloadScene.js     # Carga assets reales + barra de progreso
    │   ├── MenuScene.js        # Pantalla de título
    │   ├── GameScene.js        # ← ESCENA PRINCIPAL (acción)
    │   ├── UIScene.js          # HUD superpuesto (corre en paralelo)
    │   ├── ManagementScene.js  # Fin de jornada (Tycoon)
    │   └── EventScene.js       # Pop-ups de eventos aleatorios
    │
    └── systems/
        └── StressSystem.js     # Lógica de estrés desacoplada
```

---

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| WASD / Flechas | Mover a Richard |
| F | Interactuar (reparar servidor / entregar café) |
| E | Recoger café de la estación |

---

## 🧩 Flujo de Escenas

```
BootScene → PreloadScene → MenuScene
                                ↓
                          GameScene ←──────────────┐
                          UIScene (paralela)        │
                                ↓                  │
                       EventScene (pop-up)          │
                                ↓                  │
                       ManagementScene ────────────┘
```

---

## 🛠 Próximos Pasos

- [ ] Diseñar sprites pixel-art en Aseprite y colocarlos en `assets/sprites/`
- [ ] Crear el mapa de la incubadora en **Tiled** y exportarlo a `assets/tilemaps/`
- [ ] Agregar animaciones (spritesheets) en `PreloadScene`
- [ ] Implementar animación de vómito de Richard con spritesheet
- [ ] Música 8-bit + SFX en `assets/audio/`
- [ ] Sistema de guardado con `localStorage`
- [ ] Pantalla de Game Over

---

## 📦 Dependencias

- [Phaser 3](https://phaser.io/) (CDN en index.html)
- Node.js + live-server (solo para desarrollo local)
