# Proposal : MandaStudio - Editeur de Scenes Visuel

## Contexte

Analogik dispose d'un systeme de configuration de scenes puissant mais difficile a maintenir :
- **16 variations** definies manuellement en JS (`src/Components/variations/config*.js`)
- **56 shaders** disponibles, testes un par un
- **GUI dat.GUI** fonctionnel mais rudimentaire (pas de sauvegarde persistante, UX limitee)
- **Assignation cyclique** des configs aux tracks (rotation 1-16)

L'objectif est de creer un outil **standalone et reutilisable** pour designer, previsualiser et exporter des scenes.

---

## Vision Produit

**MandaStudio** est une application web independante qui permet de :

1. **Designer** des scenes visuellement (shader + effets + vumeters + textes + images)
2. **Previsualiser** en temps reel avec audio
3. **Sauvegarder** dans une bibliotheque de presets
4. **Exporter** des configurations JSON compatibles avec n'importe quel projet utilisant le moteur mandafunk
5. **Assigner** des scenes aux tracks via drag & drop

---

## Architecture Technique

### Principe : Separation moteur / editeur

```
mandafunk/              (npm package - moteur de rendu)
  ├── core/
  │   ├── Scene
  │   ├── Composer
  │   ├── StaticItems
  │   └── ShaderLoader
  ├── config/
  │   ├── ConfigType       (schema TypeScript)
  │   ├── configDefault    (valeurs par defaut)
  │   └── configValidator  (validation runtime)
  └── index.ts             (exports publics)

manda-studio/           (application editeur - standalone)
  ├── src/
  │   ├── editor/          (panneaux de configuration)
  │   ├── preview/         (canvas de preview temps reel)
  │   ├── library/         (gestion des presets)
  │   ├── timeline/        (assignation tracks)
  │   └── export/          (export JSON / JS)
  └── package.json

analogik/               (projet existant - consommateur)
  └── utilise mandafunk + configs exportes par manda-studio
```

### Phase 1 : Extraction du moteur mandafunk en package

Extraire `src/Components/mandafunk/` en package npm independant :

```
@mandarine/mandafunk
├── core/
│   ├── MandaScene.ts          (scene.ts actuel)
│   ├── Composer.ts            (fx/composer.ts actuel)
│   ├── StaticItems.ts         (fx/static.ts actuel)
│   └── MandaRenderer.ts      (nouveau: facade unifiee)
├── shaders/
│   ├── ShaderAbstract.ts
│   ├── shaderLoader.ts
│   └── [56 shaders]
├── fx/
│   ├── oscilloscope.ts
│   ├── spectrum.ts
│   ├── progressbar.ts
│   └── progresstimer.ts
├── config/
│   ├── types.ts               (ConfigType, ImageType, TextType, ComposerType)
│   ├── defaults.ts            (configDefault)
│   ├── validator.ts           (nouveau: validation JSON Schema)
│   └── merge.ts               (deepMerge utils)
└── index.ts
```

**API publique du package :**

```typescript
import {
  MandaRenderer,
  ConfigType,
  configDefault,
  validateConfig,
  mergeConfig,
  availableShaders,
  loadShader
} from '@mandarine/mandafunk';

// Initialiser le renderer
const renderer = new MandaRenderer(canvas, audioContext, analyser);

// Charger une config
await renderer.loadConfig(myConfig);

// Boucle de rendu
renderer.render(time);

// Mettre a jour en temps reel (pour l'editeur)
renderer.updateConfig(partialConfig);
```

### Phase 2 : Application MandaStudio

Interface React avec panneau lateral + preview canvas :

```
┌─────────────────────────────────────────────────────┐
│  MandaStudio                            [Library] ▼ │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  SCENE       │                                      │
│  ┌─────────┐ │                                      │
│  │ Shader  │ │         PREVIEW CANVAS               │
│  │ BG      │ │         (Three.js temps reel)        │
│  │ Colors  │ │                                      │
│  └─────────┘ │                                      │
│              │                                      │
│  VUMETERS    │                                      │
│  ┌─────────┐ │                                      │
│  │ Oscillo │ │                                      │
│  │ Spectrum│ │                                      │
│  └─────────┘ │                                      │
│              │                                      │
│  COMPOSER    │                                      │
│  ┌─────────┐ │                                      │
│  │ Bloom   │ │                                      │
│  │ Film    │ │                                      │
│  │ RGB     │ │                                      │
│  └─────────┘ │                                      │
│              ├──────────────────────────────────────┤
│  TEXTS       │  TRACK TIMELINE                      │
│  IMAGES      │  [Track1][Track2][Track3][Track4]... │
│              │   ▲scene3  ▲scene1  ▲scene7          │
│  [+ Text]    │                                      │
│  [+ Image]   │  Drop scenes onto tracks             │
│              │                                      │
├──────────────┴──────────────────────────────────────┤
│  [Save] [Export JSON] [Export JS] [Import]   ♪ ▶ ◼  │
└─────────────────────────────────────────────────────┘
```

### Composants principaux

#### 1. Preview Engine

Le canvas de preview utilise directement `MandaRenderer` :

```typescript
// PreviewCanvas.tsx
const PreviewCanvas = ({ config, audioFile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MandaRenderer | null>(null);

  useEffect(() => {
    rendererRef.current = new MandaRenderer(canvasRef.current, audioCtx, analyser);
  }, []);

  useEffect(() => {
    // Mise a jour temps reel quand config change
    rendererRef.current?.updateConfig(config);
  }, [config]);

  return <canvas ref={canvasRef} />;
};
```

#### 2. Panneau Shader

Galerie visuelle de shaders avec thumbnails :

```
┌──────────────────────────┐
│ Shader Browser           │
├──────────────────────────┤
│ [🔍 Search...]           │
│                          │
│ ┌──────┐ ┌──────┐       │
│ │Plasma│ │Tunnel│       │
│ │ 🖼️   │ │ 🖼️   │       │
│ └──────┘ └──────┘       │
│ ┌──────┐ ┌──────┐       │
│ │Galaxy│ │Fracta│       │
│ │ 🖼️   │ │ 🖼️   │       │
│ └──────┘ └──────┘       │
│                          │
│ Speed: ═══●══════ 0.8   │
│ Opacity: ══════●═ 0.9   │
│ Zoom: ════●════── 1.0   │
│ □ Sin/Cos X  □ Sin/Cos Y│
└──────────────────────────┘
```

Chaque shader genere une thumbnail animee (canvas offscreen, capture a t=2s).

#### 3. Panneau Composer (Effets)

Interface toggle + sliders pour chaque effet :

```
┌──────────────────────────┐
│ Post-Processing          │
├──────────────────────────┤
│ ● Bloom                  │
│   Strength: ══●═══ 0.85  │
│   Threshold: ═══●═ 0.73  │
│   Radius: ●══════ 0.3    │
│                          │
│ ○ Film Grain             │
│   (desactive - grise)    │
│                          │
│ ○ RGB Shift              │
│ ● Hue/Saturation         │
│   Hue: ●════════ 0.0     │
│   Sat: ●════════ 0.0     │
│                          │
│ ○ Static                 │
│ ○ Kaleidoscope           │
│ ○ Lens Distortion        │
└──────────────────────────┘
```

#### 4. Scene Library

Stockage des presets dans IndexedDB + export JSON :

```typescript
interface ScenePreset {
  id: string;
  name: string;
  description: string;
  tags: string[];           // ["dark", "energetic", "minimal"]
  config: ConfigType;
  thumbnail: string;        // Base64 screenshot
  createdAt: Date;
  updatedAt: Date;
}
```

Fonctionnalites :
- **Recherche** par nom / tags
- **Filtrage** par shader, style, couleur dominante
- **Duplication** d'un preset comme base
- **Historique** (undo/redo sur les modifications)
- **Import/Export** JSON individuel ou batch

#### 5. Track Timeline

Vue d'assignation scene -> track :

```typescript
interface TrackAssignment {
  trackId: number;
  trackName: string;
  audioFile: string;
  scenePresetId: string;    // Reference vers la library
}
```

- **Drag & drop** des presets depuis la library vers les tracks
- **Preview au survol** : joue 3s de la track avec la scene
- **Batch assign** : appliquer un preset a une selection de tracks
- **Auto-assign** : algorithme qui assigne en evitant les repetitions consecutives

#### 6. Export System

Plusieurs formats de sortie :

```typescript
// Export JSON (generique, reutilisable)
{
  "version": "1.0",
  "presets": [
    { "id": "scene-1", "name": "Neon Plasma", "config": { ... } }
  ],
  "assignments": [
    { "track": 0, "preset": "scene-1" },
    { "track": 1, "preset": "scene-3" }
  ]
}

// Export JS (compatible Analogik actuel)
// Genere ConfigVariations.js + mise a jour tracks.js
export const ConfigVariations = [ ... ];

// Export TypeScript (type-safe)
export const scenes: Record<string, ConfigType> = { ... };
```

---

## Stack Technique

### Package mandafunk
| Composant | Technologie |
|-----------|-------------|
| Langage | TypeScript |
| 3D | Three.js |
| Shaders | GLSL (existants) |
| Build | Vite (library mode) |
| Distribution | npm package |

### Application MandaStudio
| Composant | Technologie |
|-----------|-------------|
| Framework | React 18+ |
| UI | Radix UI + Tailwind CSS |
| State | Zustand (leger, adapte aux updates frequents) |
| Storage | IndexedDB (Dexie.js) |
| Build | Vite |
| Drag & Drop | dnd-kit |
| Color Picker | react-colorful |
| Sliders | Radix UI Slider |
| Undo/Redo | zustand/middleware (temporal) |

### Pourquoi ces choix ?

- **Radix UI** : headless, accessible, composable (vs rsuite trop opinionate pour un editeur)
- **Zustand** : updates granulaires rapides pour le temps reel (pas de re-render React inutiles)
- **IndexedDB** : stockage local large (thumbnails, configs, historique)
- **Vite** : dev rapide, tree-shaking optimal pour le package mandafunk

---

## Plan de Realisation

### Phase 1 - Extraction du moteur (2-3 jours)
1. Creer le package `@mandarine/mandafunk`
2. Extraire MandaScene, Composer, StaticItems, shaders
3. Creer `MandaRenderer` (facade)
4. Creer `validateConfig()` (validation runtime)
5. Adapter Analogik pour importer depuis le package
6. Tests : le projet existant fonctionne identiquement

### Phase 2 - Preview standalone (2-3 jours)
1. Setup projet MandaStudio (Vite + React)
2. Composant PreviewCanvas avec MandaRenderer
3. Chargement audio pour la preview
4. Controles play/pause/seek basiques
5. Responsive canvas

### Phase 3 - Panneau editeur (3-4 jours)
1. Panneau Scene (shader browser avec thumbnails)
2. Panneau Vumeters (oscilloscope + spectrum)
3. Panneau Composer (effets post-processing)
4. Panneau Texts / Images
5. Updates temps reel vers le preview
6. Undo/redo global

### Phase 4 - Library & Persistence (2-3 jours)
1. Modele ScenePreset dans IndexedDB
2. CRUD presets (create, rename, duplicate, delete)
3. Capture thumbnail automatique
4. Recherche et filtrage
5. Import / export JSON

### Phase 5 - Track Timeline (2-3 jours)
1. Liste des tracks (import depuis tracks.js ou JSON)
2. Drag & drop scene -> track
3. Preview au survol
4. Auto-assignment
5. Export ConfigVariations.js + tracks.js

### Phase 6 - Polish & Documentation (1-2 jours)
1. Raccourcis clavier (Ctrl+Z, Ctrl+S, Space pour play/pause)
2. Theme sombre (coherent avec l'app)
3. README + documentation API du package
4. Examples d'integration

---

## Reutilisabilite

### Pour d'autres projets

Le package `@mandarine/mandafunk` est utilisable independamment :

```typescript
// Projet B - Visualiseur audio generique
import { MandaRenderer, configDefault } from '@mandarine/mandafunk';

const renderer = new MandaRenderer(canvas, audioCtx, analyser);
await renderer.loadConfig({
  ...configDefault,
  scene: { shader: 'Plasma', shader_speed: 0.5 }
});
```

### MandaStudio comme editeur generique

L'editeur peut etre configure pour differents projets :

```typescript
// manda-studio.config.ts
export default {
  projectName: 'Mon Projet',
  tracksSource: './tracks.json',    // ou API endpoint
  assetsPath: './public/assets/',
  exportFormat: 'json',             // 'json' | 'js' | 'ts'
  features: {
    timeline: true,
    library: true,
    audioPreview: true,
    shaderBrowser: true,
  }
};
```

---

## Schema de Donnees Etendu

### Config enrichi pour MandaStudio

```typescript
interface StudioConfig extends ConfigType {
  // Metadonnees studio (non exportees vers le runtime)
  _studio?: {
    name: string;
    description: string;
    tags: string[];
    author: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    thumbnail: string;
    parentId?: string;      // Fork d'un autre preset
    locked?: boolean;       // Lecture seule
  };
}
```

Les champs `_studio` sont stripes a l'export pour ne garder que le `ConfigType` pur.

---

## Alternatives Considerees

| Approche | Pour | Contre |
|----------|------|--------|
| Ameliorer dat.GUI existant | Rapide, pas de nouveau projet | UX limitee, pas de persistence, pas reutilisable |
| Electron standalone | App native, acces filesystem | Lourd, complexite packaging |
| Plugin VS Code | Integre au workflow dev | Trop niche, complexe |
| **App web React (choix)** | Leger, reutilisable, moderne UX | Necessite extraction du moteur |

---

## Resume

MandaStudio transforme le workflow actuel :

**Avant :**
```
Editer config*.js a la main → Recharger le navigateur → Tester → Recommencer
```

**Apres :**
```
Ouvrir MandaStudio → Choisir un shader → Ajuster en temps reel → Sauvegarder → Exporter
```

L'investissement principal est l'extraction du moteur mandafunk en package reutilisable. Une fois fait, l'editeur se construit naturellement par-dessus, et le moteur devient utilisable dans n'importe quel futur projet.
