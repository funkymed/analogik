# Project Export Format: Analysis and Recommendations

**Date**: 2026-02-12
**Source file analyzed**: `manda-projects-1.json` (106 KB, 3514 lines, 6 projects)
**Relevant source files**:
- `/packages/manda-studio/src/timeline/ganttTypes.ts` -- TypeScript type definitions
- `/packages/manda-studio/src/store/useGanttStore.ts` -- Zustand store (runtime state)
- `/packages/manda-studio/src/db/projectService.ts` -- Export/import logic
- `/packages/manda-studio/src/db/projectTypes.ts` -- Project/ProjectExport interfaces
- `/packages/manda-studio/src/services/assetRegistry.ts` -- Asset registry and `stripRuntimeData`

---

## 1. Current Format Analysis

### 1.1 Top-Level Structure (v1.0)

```
ProjectExport {
  version: "1.0"
  exportedAt: ISO string
  projects: Project[] {
    name, id, timeline, sceneTrackCount, audioTrackCount,
    thumbnail, createdAt, updatedAt
  }
}
```

Each `Project.timeline` is a `Timeline`:
```
Timeline {
  assets: Record<string, AssetEntry>   // flat map, top-level
  scenes: TimelineScene[]              // each scene embeds full ConfigType + sequences
  transitions: SceneTransition[]
  audioClips: AudioClip[]
}
```

### 1.2 Quantified Problems

The following statistics were computed from the 6 projects in the analyzed export file.

#### Problem 1: Massive Asset Duplication

| Project   | Total Assets | Duplicates (same libraryId) | Unused Assets |
|-----------|-------------|----------------------------|---------------|
| "caca"    | 12          | 8                          | 10            |
| "testtest"| 10          | 6                          | 8             |
| "131231"  | 5           | 2                          | 3             |
| "azeaze"  | 2           | 0                          | 0             |
| "toto"    | 0           | 0                          | 0             |
| "test123" | 0           | 0                          | 0             |

**Root cause**: `createAssetEntry()` in `assetRegistry.ts` generates a new `AssetEntry` with a fresh `generateId("asset")` every time an asset is dragged onto a scene or an audio clip is created. There is no deduplication check against `libraryId` before registration. The `migrateToAssetRegistry()` function does have a `getOrCreate` pattern that deduplicates, but `registerAsset()` in the store does not.

Concrete example from the export -- all seven of these entries reference the same `libraryId: 5` (the same screenshot image):
```
asset_mli85hm5_2, asset_mli8krsc_1, asset_mli8oekk_4,
asset_mli8vf5w_1, asset_mli8wrui_1, asset_mli9a0xf_1, asset_mlia8rtu_1
```

Only `asset_mlia8rtu_1` is actually referenced by scenes. The other 6 are orphaned.

Similarly, `libraryId: 1` (audio file "med-merci-monsieur.wav") has 3 duplicate asset entries; only 1 is referenced by the audio clip.

#### Problem 2: Extreme Config Verbosity

Each scene's `baseConfig` is a **complete** `ConfigType` snapshot -- every field, whether modified or not.

| Metric | Value |
|--------|-------|
| Total config fields across all 16 scenes | 1,521 |
| Fields different from `configDefault` | 355 (23.3%) |
| Fields at default value | 1,166 (76.7%) |
| Total `baseConfig` size (pretty-printed) | 28,505 bytes (56.8% of the entire file) |
| Diff-only config size (only non-default values) | 9,226 bytes |
| **Potential savings from diff-only** | **19,279 bytes (67.6% reduction in config data)** |

Most scenes have `timer.show: false`, `progressbar.show: false`, `vumeters.oscilloscop.show: false`, etc., but still serialize every single timer/progressbar/vumeter field (position, font, color, rotation) that will never be used because the section is disabled.

#### Problem 3: Empty and Redundant Sequences

- **1 empty sequence per project** on average (sequences with `keyframes: []` that carry no animation data)
- Sequences with `baseConfig: {}` still serialize the empty object
- Default sequence fields like `startOffset: 0`, `order: 0`, `duration: 30` are repeated even when they match defaults

#### Problem 4: Redundant Keyframe Easing

Every single keyframe includes `"easing": { "type": "linear" }`. Since `linear` is the most common easing type, this adds 35+ bytes per keyframe with no information gain. Across the export file, this accounts for hundreds of bytes of noise.

#### Problem 5: UI State Leaking into Persistence

The following fields are purely UI concerns and should not be in the export:
- `collapsed: true/false` -- whether the scene is expanded in the timeline UI
- `sidebarItems` -- which accordion sections are open in the property panel
- `color` -- the display color of the scene block (could be auto-derived)
- `hidden` -- scene visibility toggle (runtime state, not project data)

#### Problem 6: Flat Asset Map Not Scoped to Projects

Assets sit in a flat `Record<string, AssetEntry>` at the timeline level. When multiple projects reference the same library items, the asset entries are duplicated across projects with identical `libraryId` values but different `id` keys. The 10 shared asset IDs between project 0 and project 1 are evidence of this.

#### Problem 7: Redundant ID as Both Key and Value

Every asset entry has its `id` stored both as the map key **and** as a field inside the entry:
```json
"asset_mli85hm5_2": {
  "id": "asset_mli85hm5_2",  // redundant
  ...
}
```

#### Problem 8: Audio Clip Carries Empty URL

After `stripRuntimeData()`, audio clips have `"url": ""` which is noise -- the URL is always resolved from the asset at load time.

---

## 2. Proposed Format: v2.0

### 2.1 Design Principles

1. **Format ZIP (`.manda`)** : un fichier ZIP contenant un `manifest.json` leger + les binaires des assets dans un dossier `assets/`. Pas de base64, pas de surcharge memoire.
2. **Diff-only configs** : seules les valeurs differentes de `configDefault` sont serialisees. Deep-merge avec les defaults a l'import.
3. **Assets dedupliques** : un seul entry par asset reel, reference par chemin relatif dans le ZIP.
4. **Pas d'assets orphelins** : seuls les assets references par au moins une scene ou audio clip sont exportes.
5. **Pas d'etat UI** : `collapsed`, `sidebarItems`, `hidden` sont omis. `color` derive de l'index.
6. **Keyframes compacts** : noms courts (`t`, `p`, `v`). L'easing `linear` (defaut) est omis.
7. **Pas de sequences vides** : les sequences sans keyframes sont supprimees a l'export.
8. **Noms de champs courts** : `startTime` -> `start`, `duration` -> `dur`, `trackIndex` -> `track`.

### 2.2 Structure du fichier `.manda` (ZIP)

```
mon-projet.manda
├── manifest.json                    ← JSON v2.0 leger (~5-40 KB)
└── assets/                          ← binaires bruts (images, audio, video)
    ├── screenshot.png
    ├── robot2.jpg
    ├── robot3.jpg
    └── med-merci-monsieur.wav
```

- **`manifest.json`** : contient toute la structure du projet (scenes, sequences, keyframes, config diff-only). Les assets sont references par chemin relatif via le champ `file`.
- **`assets/`** : les fichiers binaires tels quels, sans encodage. Lus un par un depuis le ZIP en streaming a l'import (pas de chargement complet en memoire).
- **Extension** : `.manda` (un ZIP renomme, ouvrable avec n'importe quel outil ZIP pour debug).

**Pourquoi pas du base64 inline dans le JSON ?**
Un WAV de 150s = ~25 MB brut = ~33 MB en base64. `JSON.parse()` doit charger tout ca en memoire d'un coup. Avec le ZIP, chaque asset est lu en streaming et insere individuellement dans IndexedDB.

### 2.3 Schema TypeScript (manifest.json)

```typescript
// ---- Top Level ----
interface ProjectExportV2 {
  version: "2.0";
  exportedAt: string;
  /** configDefault hash -- import validates the reader has the same defaults */
  defaultsHash?: string;
  projects: ProjectV2[];
}

// ---- Project ----
interface ProjectV2 {
  name: string;
  id?: number;
  createdAt: string;
  updatedAt: string;
  tracks: { scene: number; audio: number };
  /** Deduplicated asset registry. Key = assetId. */
  assets: Record<string, AssetEntryV2>;
  scenes: SceneV2[];
  audioClips: AudioClipV2[];
  transitions?: TransitionV2[];
}

// ---- Asset ----
interface AssetEntryV2 {
  type: "image" | "audio" | "video" | "font";
  name: string;
  mime: string;           // shortened from mimeType
  /** Chemin relatif du fichier dans le ZIP (ex: "assets/robot2.jpg") */
  file: string;
  meta?: { w?: number; h?: number; dur?: number };
}

// ---- Scene ----
interface SceneV2 {
  id: string;
  name: string;
  start: number;         // absolute start (seconds)
  dur: number;           // duration (seconds)
  track?: number;        // default 0
  color?: string;        // optional override (auto-derived if omitted)
  /** Only non-default config values. Deep-merged with configDefault on import. */
  config?: Partial<ConfigType>;
  sequences?: SequenceV2[];
}

// ---- Sequence ----
interface SequenceV2 {
  id: string;
  type: SequenceType;
  label?: string;        // omit if same as type
  startOffset?: number;  // default 0
  dur?: number;          // default: parent scene duration
  order?: number;        // default 0
  keyframes: KeyframeV2[];
}

// ---- Keyframe ----
interface KeyframeV2 {
  t: number;             // time (seconds, relative to sequence)
  p: string;             // path (dot-notation into config)
  v: number | string | boolean;  // value
  e?: EasingConfig;      // omitted when linear
}

// ---- Audio Clip ----
interface AudioClipV2 {
  id: string;
  assetId: string;
  start: number;
  dur: number;
  trimStart?: number;    // default 0
  volume?: number;       // default 1
  muted?: boolean;       // default false
  track?: number;        // default 0
}
```

### 2.3 Before/After Example: Full Project Overview

**BEFORE (v1.0)** -- projet "caca" (4 scenes, 1 audio, 12 assets):
```json
{
  "version": "1.0",
  "exportedAt": "2026-02-11T17:10:57.938Z",
  "projects": [
    {
      "name": "caca",
      "id": 6,
      "createdAt": "2026-02-11T17:09:08.127Z",
      "updatedAt": "2026-02-11T17:09:08.127Z",
      "sceneTrackCount": 2,
      "audioTrackCount": 1,
      "thumbnail": "",
      "timeline": {
        "assets": {
          "asset_mli85hm5_2": { "id": "asset_mli85hm5_2", "type": "image", "name": "screenshot.png", "mimeType": "image/png", "libraryId": 5, "meta": { "width": 774, "height": 734 } },
          "asset_mli8ag98_2": { "id": "asset_mli8ag98_2", "type": "image", "name": "robot2.jpg", "mimeType": "image/jpeg", "libraryId": 4, "meta": { "width": 774, "height": 734 } },
          "asset_mli8krsc_1": { "id": "asset_mli8krsc_1", "type": "image", "name": "screenshot.png", "mimeType": "image/png", "libraryId": 5, "meta": { "width": 774, "height": 734 } },
          "...": "7 more assets, mostly duplicates of libraryId 5 and 1",
          "asset_mlia9nq4_2": { "id": "asset_mlia9nq4_2", "type": "audio", "name": "med-merci-monsieur.wav", "mimeType": "audio/wav", "libraryId": 1, "meta": { "duration": 152.1 } }
        },
        "scenes": [
          { "id": "scene_1", "name": "Scene 1", "startTime": 0, "duration": 6.51, "color": "#6366f1", "collapsed": true, "hidden": false, "trackIndex": 0, "baseConfig": { "/* ~80 lines of FULL config with all defaults */" }, "sequences": ["..."], "sidebarItems": ["..."] },
          { "id": "scene_2", "name": "Scene 2", "startTime": 6.29, "duration": 7.78, "color": "#8b5cf6", "collapsed": true, "hidden": false, "trackIndex": 1, "baseConfig": { "/* ~80 lines */" }, "sequences": ["..."], "sidebarItems": ["..."] },
          { "id": "scene_3", "name": "Scene 3", "startTime": 13.81, "duration": 6.48, "color": "#ec4899", "collapsed": true, "hidden": false, "trackIndex": 0, "baseConfig": { "/* ~80 lines */" }, "sequences": ["..."], "sidebarItems": ["..."] },
          { "id": "scene_4", "name": "Scene 4", "startTime": 20.27, "duration": 30, "color": "#f59e0b", "collapsed": true, "hidden": false, "trackIndex": 1, "baseConfig": { "/* ~80 lines */" }, "sequences": [], "sidebarItems": ["..."] }
        ],
        "transitions": [],
        "audioClips": [
          { "id": "audio_mlia9nq5_3", "name": "med-merci-monsieur.wav", "url": "", "startTime": 0, "duration": 152.1, "trimStart": 0, "volume": 1, "muted": false, "trackIndex": 0, "libraryId": 1, "assetId": "asset_mlia9nq4_2" }
        ]
      }
    }
  ]
}
```
**Problemes visibles** : 12 assets (8 doublons, 10 orphelins), `url: ""` inutile, `collapsed`/`hidden`/`sidebarItems` = etat UI, chaque `baseConfig` repete ~80 lignes de valeurs par defaut, `id` en cle ET en valeur.

---

**AFTER (v2.0)** -- meme projet, fichier `mon-projet.manda` (ZIP) :

Contenu du ZIP :
```
mon-projet.manda
├── manifest.json
└── assets/
    ├── screenshot.png        (ex: 45 KB)
    ├── robot2.jpg            (ex: 120 KB)
    ├── robot3.jpg            (ex: 95 KB)
    └── med-merci-monsieur.wav (ex: 25 MB)
```

Contenu de `manifest.json` :
```json
{
  "version": "2.0",
  "exportedAt": "2026-02-11T17:10:57.938Z",
  "projects": [
    {
      "name": "caca",
      "id": 6,
      "createdAt": "2026-02-11T17:09:08.127Z",
      "updatedAt": "2026-02-11T17:09:08.127Z",
      "tracks": { "scene": 2, "audio": 1 },
      "assets": {
        "asset_mlia8rtu_1": { "type": "image", "name": "screenshot.png", "mime": "image/png", "meta": { "w": 774, "h": 734 }, "file": "assets/screenshot.png" },
        "asset_mli8ag98_2": { "type": "image", "name": "robot2.jpg", "mime": "image/jpeg", "meta": { "w": 774, "h": 734 }, "file": "assets/robot2.jpg" },
        "asset_mli8sul3_1": { "type": "image", "name": "robot3.jpg", "mime": "image/jpeg", "meta": { "w": 774, "h": 734 }, "file": "assets/robot3.jpg" },
        "asset_mlia9nq4_2": { "type": "audio", "name": "med-merci-monsieur.wav", "mime": "audio/wav", "meta": { "dur": 152.1 }, "file": "assets/med-merci-monsieur.wav" }
      },
      "scenes": [
        {
          "id": "scene_mli8aw09_3",
          "name": "Scene 1",
          "start": 0,
          "dur": 6.51,
          "track": 0,
          "config": {
            "scene": { "bgAssetId": "asset_mlia8rtu_1", "shader": "Plasma", "shader_speed": 0.8, "bgFit": "contain" },
            "composer": { "bloom": { "show": true, "strength": 0.85, "threshold": 0.73, "radius": 0.3 }, "film": { "show": true, "count": 1000, "sIntensity": 0.22, "nIntensity": 0.59 }, "hue": { "show": true } }
          },
          "sequences": [
            { "id": "seq_mli8b1vm_4", "type": "shader", "keyframes": [
              { "t": 0, "p": "scene.brightness", "v": 1 },
              { "t": 1.77, "p": "scene.brightness", "v": 92 },
              { "t": 4.08, "p": "scene.brightness", "v": 100 },
              { "t": 6.01, "p": "scene.brightness", "v": 1 }
            ]}
          ]
        },
        {
          "id": "scene_mli8cfge_b",
          "name": "Scene 2",
          "start": 6.29,
          "dur": 7.78,
          "track": 1,
          "config": {
            "scene": { "bgColor": "#ef4747" },
            "texts": { "text_1770827242100": { "show": true, "text": "Saucisse", "size": 24, "y": -119.67 } }
          },
          "sequences": [
            { "id": "seq_mli8dhqg_c", "type": "shader", "keyframes": [
              { "t": 0, "p": "scene.bgColor", "v": "#000000" },
              { "t": 3.19, "p": "scene.bgColor", "v": "#fd4b4b" },
              { "t": 5.49, "p": "scene.bgColor", "v": "#ff5757" },
              { "t": 7.73, "p": "scene.bgColor", "v": "#000000" }
            ]},
            { "id": "seq_mli8ts33_3", "type": "texts", "dur": 7.78, "order": 1, "keyframes": [
              { "t": 1.27, "p": "texts.text_1770827242100.opacity", "v": 0.04 },
              { "t": 2.75, "p": "texts.text_1770827242100.opacity", "v": 1 },
              { "t": 5.96, "p": "texts.text_1770827242100.opacity", "v": 1 },
              { "t": 7.1, "p": "texts.text_1770827242100.opacity", "v": 0.01 }
            ]}
          ]
        },
        {
          "id": "scene_mli8oycr_5",
          "name": "Scene 3",
          "start": 13.81,
          "dur": 6.48,
          "track": 0,
          "config": {
            "scene": { "bgColor": "#000000", "shader": "Med2", "shader_show": true },
            "vumeters": { "oscilloscop": { "show": true, "color": "#ffffff", "opacity": 1 }, "spectrum": { "show": true, "opacity": 0.69, "bars": 128 } },
            "composer": { "bloom": { "show": true, "strength": 0.85, "threshold": 0.73, "radius": 0.3 }, "film": { "show": true, "count": 1000, "sIntensity": 0.22, "nIntensity": 0.59 }, "hue": { "show": true } }
          },
          "sequences": [
            { "id": "seq_mli8q0mu_7", "type": "shader", "keyframes": [
              { "t": 0.15, "p": "scene.shader_opacity", "v": 0 },
              { "t": 1.55, "p": "scene.shader_opacity", "v": 1 }
            ]}
          ]
        },
        {
          "id": "scene_mliaal8g_4",
          "name": "Scene 4",
          "start": 20.27,
          "dur": 30,
          "track": 1,
          "config": {
            "scene": { "bgAssetId": "asset_mlia8rtu_1", "shader": "Plasma", "shader_speed": 0.8, "bgFit": "contain" }
          }
        }
      ],
      "audioClips": [
        { "id": "audio_mlia9nq5_3", "assetId": "asset_mlia9nq4_2", "start": 0, "dur": 152.1 }
      ]
    }
  ]
}
```

**Gains visibles** :
- **4 assets** au lieu de 12 (dedupliques, pas d'orphelins)
- **Chaque asset reference un fichier binaire** dans le ZIP via `file` -- portable sans surcharge memoire
- **Chaque scene montre clairement ses elements actifs** : Scene 1 a un shader+composer, Scene 2 a un bgColor+texte, Scene 3 a un shader+vumeters+composer, Scene 4 n'a qu'un background
- **Les sequences sont imbriquees dans leur scene** avec des keyframes compacts
- **Pas de bruit** : ni `collapsed`, `hidden`, `sidebarItems`, `url: ""`, ni 80 lignes de defaults

### 2.5 Resolution des assets : 3 contextes d'utilisation

Le meme `manifest.json` fonctionne dans 3 contextes. Seule la facon de resoudre `file` change :

| Contexte | Resolution de `file: "assets/robot2.jpg"` | Stockage |
|---|---|---|
| **Sauvegarde auto (studio)** | `libraryId` en IndexedDB, `file` absent | IndexedDB locale |
| **Import `.manda` (studio)** | Extraire du ZIP -> blob -> IndexedDB | ZIP -> IndexedDB |
| **Player sur serveur (sans editeur)** | URL relative -> `fetch()` direct | Fichiers statiques sur serveur |

#### Import dans le studio

Le fichier `.manda` est autonome : chaque asset reference un fichier binaire dans le ZIP via `file`.

**Flux d'import** :
1. Ouvrir le ZIP avec **fflate** (leger, ~8 KB gzip) ou **JSZip**
2. Parser `manifest.json` (quelques KB, instantane)
3. Pour chaque asset dans `manifest.json` :
   - Extraire le fichier binaire du ZIP en streaming (ex: `zip["assets/robot2.jpg"]`)
   - Creer un `Blob` avec le bon `mime`
   - L'inserer dans la library IndexedDB locale -> obtenir un nouveau `libraryId`
   - Mettre a jour l'entry asset en memoire avec le `libraryId` local
4. Appeler `resolveAllAssets()` pour creer les blob URLs

**Flux d'export** :
1. Garbage-collect les assets orphelins
2. Serialiser le `manifest.json` (diff-only configs, keyframes compacts)
3. Pour chaque asset reference : lire le blob depuis IndexedDB, l'ajouter au ZIP sous `assets/{name}`
4. Gerer les doublons de noms : si deux assets ont le meme `name`, suffixer avec l'id (ex: `assets/screenshot_mlia8rtu.png`)
5. Telecharger le ZIP comme `{project-name}.manda`

**Avantages memoire du ZIP vs base64** :
- Les binaires ne passent jamais par `JSON.parse()` -- ils sont extraits un par un depuis le ZIP
- Un WAV de 25 MB reste ~25 MB dans le ZIP (pas 33 MB en base64 dans un JSON)
- Le `manifest.json` fait ~5-40 KB meme pour un gros projet
- **fflate** (8 KB gzip) supporte l'extraction fichier par fichier, limitant le pic memoire a la taille du plus gros asset

**UX a l'import** :
- Afficher une barre de progression ("Import des assets : 3/4...")
- Extraire et inserer les assets un par un dans IndexedDB (pas tout en memoire)
- Le projet apparait dans la liste des qu'il est pret

#### Player sur serveur (sans editeur)

Le `.manda` peut etre dezippe et deploye comme fichiers statiques sur un serveur web. Le player mandafunk charge le projet directement par HTTP, sans IndexedDB ni editeur.

**Structure sur le serveur** :
```
https://monsite.com/projects/mon-projet/
├── manifest.json
└── assets/
    ├── screenshot.png
    ├── robot2.jpg
    ├── robot3.jpg
    └── med-merci-monsieur.wav
```

**Flux de chargement cote player** :
1. `fetch("manifest.json")` -> parser le JSON (~5-40 KB, instantane)
2. Reconstruire les configs completes avec `mergeWithDefaults(scene.config, configDefault)`
3. Les `file` des assets deviennent des URLs relatives resolues par le navigateur :
   - `"assets/robot2.jpg"` -> `https://monsite.com/projects/mon-projet/assets/robot2.jpg`
4. Les images sont chargees via `<img>` ou `TextureLoader` (Three.js) -- chargement natif HTTP
5. L'audio est charge via `fetch()` ou `<audio>` avec support du streaming natif du navigateur (pas besoin de tout telecharger avant de jouer)

**Avantages** :
- **Zero IndexedDB** : pas de base locale, tout est en HTTP
- **Streaming audio natif** : le navigateur gere le buffering, l'audio commence a jouer avant la fin du telechargement
- **CDN-friendly** : les assets sont des fichiers statiques classiques, cacheables
- **Pas de JavaScript specifique** : pas besoin de fflate/JSZip, le navigateur fait tout
- **Meme manifest.json** : aucune transformation du fichier entre le studio et le player

**Note** : le player n'a besoin que de mandafunk (moteur de rendu), pas de manda-studio (editeur). C'est une application separee et legere.

#### Sauvegarde auto (studio, IndexedDB)

En mode edition, le studio continue d'utiliser `libraryId` pour pointer vers les blobs deja stockes en IndexedDB. Le format ZIP n'intervient pas -- la sauvegarde auto serialise le timeline avec les `libraryId` locaux, sans dupliquer les fichiers binaires.

---

### 2.5 Before/After Example: A Single Scene (Detail)

**BEFORE (v1.0)** -- 127 lines, ~2,400 characters:
```json
{
  "id": "scene_mli8cfge_b",
  "name": "Scene 2",
  "startTime": 6.29,
  "duration": 7.78,
  "color": "#8b5cf6",
  "collapsed": true,
  "hidden": false,
  "trackIndex": 1,
  "baseConfig": {
    "scene": {
      "bgColor": "#ef4747",
      "background": "",
      "blur": 0,
      "brightness": 1,
      "shader": "Plasma",
      "shader_speed": 0.8,
      "shader_opacity": 1,
      "shader_blending": "additive",
      "shader_show": false,
      "bgFit": "contain"
    },
    "music": "",
    "timer": {
      "show": false, "color": "#ffffff", "bgColor": false,
      "opacity": 0.7, "order": 1, "width": 512, "height": 64,
      "size": 20, "font": "Kdam Thmor Pro", "align": "center",
      "x": 0, "y": -227.4, "z": -500,
      "rotationX": 0, "rotationY": 0, "rotationZ": 0
    },
    "progressbar": {
      "show": false, "color": "#ffffff", "cursorColor": "#ffffff",
      "bgColor": false, "opacity": 0.32, "order": 1,
      "width": 512, "height": 64, "x": 0, "y": -185.4, "z": -500,
      "rotationX": 0, "rotationY": 0, "rotationZ": 0
    },
    "vumeters": {
      "oscilloscop": { "show": false, "...14 more fields..." },
      "spectrum": { "show": false, "...16 more fields..." }
    },
    "composer": {
      "bloom": { "show": false, "strength": 0.9, "threshold": 0.6, "radius": 0.5 },
      "rgb": { "show": false, "amount": 0.003, "angle": 0.5 },
      "film": { "show": false, "count": 800, "sIntensity": 0.15, "nIntensity": 0.4, "grayscale": false },
      "static": { "show": false, "amount": 0.2, "size": 2 },
      "hue": { "show": false, "hue": 0, "saturation": 0 }
    },
    "images": {},
    "texts": { "text_1770827242100": { "show": true, "text": "Saucisse", "...12 more fields..." } },
    "sparks": { "enabled": false, "emitters": "" }
  },
  "sequences": [
    {
      "type": "shader", "label": "shader",
      "startOffset": 0, "duration": 30, "order": 0,
      "baseConfig": {},
      "keyframes": [
        { "time": 3.19, "path": "scene.bgColor", "value": "#fd4b4b", "easing": { "type": "linear" }, "id": "kf_..." },
        { "time": 0, "path": "scene.bgColor", "value": "#000000", "easing": { "type": "linear" }, "id": "kf_..." },
        "... 2 more keyframes ..."
      ],
      "id": "seq_..."
    },
    {
      "type": "texts", "label": "texts",
      "startOffset": 0, "duration": 7.78, "order": 1,
      "baseConfig": {},
      "keyframes": [ "... 4 keyframes ..." ],
      "id": "seq_..."
    }
  ],
  "sidebarItems": [
    { "id": "bg-0", "type": "background" },
    { "id": "si_mli8tgtw_2", "type": "text", "configKey": "text_1770827242100" }
  ]
}
```

**AFTER (v2.0)** -- 40 lines, ~850 characters:
```json
{
  "id": "scene_mli8cfge_b",
  "name": "Scene 2",
  "start": 6.29,
  "dur": 7.78,
  "track": 1,
  "config": {
    "scene": {
      "bgColor": "#ef4747",
      "shader": "Plasma",
      "shader_speed": 0.8,
      "brightness": 1,
      "bgFit": "contain"
    },
    "timer": { "show": false },
    "progressbar": { "show": false },
    "vumeters": {
      "oscilloscop": { "show": false },
      "spectrum": { "show": false }
    },
    "composer": {
      "bloom": { "show": false, "strength": 0.9, "threshold": 0.6, "radius": 0.5 },
      "rgb": { "amount": 0.003, "angle": 0.5 },
      "film": { "show": false, "count": 800, "sIntensity": 0.15, "nIntensity": 0.4 },
      "hue": { "show": false }
    },
    "texts": {
      "text_1770827242100": { "show": true, "text": "Saucisse", "size": 24, "y": -119.67 }
    }
  },
  "sequences": [
    {
      "id": "seq_mli8dhqg_c",
      "type": "shader",
      "keyframes": [
        { "t": 0, "p": "scene.bgColor", "v": "#000000" },
        { "t": 3.19, "p": "scene.bgColor", "v": "#fd4b4b" },
        { "t": 5.49, "p": "scene.bgColor", "v": "#ff5757" },
        { "t": 7.73, "p": "scene.bgColor", "v": "#000000" }
      ]
    },
    {
      "id": "seq_mli8ts33_3",
      "type": "texts",
      "dur": 7.78,
      "order": 1,
      "keyframes": [
        { "t": 1.271, "p": "texts.text_1770827242100.opacity", "v": 0.04 },
        { "t": 2.75, "p": "texts.text_1770827242100.opacity", "v": 1 },
        { "t": 5.962, "p": "texts.text_1770827242100.opacity", "v": 1 },
        { "t": 7.099, "p": "texts.text_1770827242100.opacity", "v": 0.01 }
      ]
    }
  ]
}
```

### 2.4 Size Comparison Estimates

| Metric | v1.0 (current) | v2.0 (proposed) | Reduction |
|--------|----------------|-----------------|-----------|
| Pretty-printed (indent=2) | 106,708 bytes | ~38,620 bytes | **63.8%** |
| Compact (no indent) | 50,226 bytes | ~18,068 bytes | **64.0%** |
| `baseConfig` portion only | 28,505 bytes | ~9,226 bytes | **67.6%** |
| Asset entries (project "caca") | 12 entries | 4 entries | **66.7%** |

---

## 3. Implementation Recommendations

### 3.1 Fix Asset Deduplication at Registration Time (High Priority)

**File**: `/packages/manda-studio/src/store/useGanttStore.ts`

The `registerAsset` action blindly inserts. It should check for existing entries with the same `libraryId` and `type`:

```typescript
registerAsset: (entry) => {
  const { timeline } = get();
  // Deduplicate: reuse existing entry with same libraryId + type
  const existing = Object.values(timeline.assets).find(
    (a) => a.libraryId === entry.libraryId && a.type === entry.type
  );
  if (existing) {
    // Update runtimeUrl if needed, but don't create a new entry
    if (entry.runtimeUrl && !existing.runtimeUrl) {
      set({
        timeline: {
          ...timeline,
          assets: {
            ...timeline.assets,
            [existing.id]: { ...existing, runtimeUrl: entry.runtimeUrl },
          },
        },
      });
    }
    return; // or return existing.id if callers need it
  }
  set({
    timeline: {
      ...timeline,
      assets: { ...timeline.assets, [entry.id]: entry },
    },
  });
},
```

### 3.2 Add Garbage Collection for Orphaned Assets (High Priority)

**File**: `/packages/manda-studio/src/services/assetRegistry.ts`

Add a function to prune unreferenced assets, called before export and periodically during editing:

```typescript
export function collectGarbage(timeline: Timeline): Timeline {
  const usedIds = new Set<string>();

  for (const scene of timeline.scenes) {
    const cfg = scene.baseConfig;
    if (cfg?.scene?.bgAssetId) usedIds.add(cfg.scene.bgAssetId);
    if (cfg?.images && typeof cfg.images === "object") {
      for (const img of Object.values(cfg.images)) {
        if (img.assetId) usedIds.add(img.assetId);
      }
    }
  }
  for (const clip of timeline.audioClips) {
    if (clip.assetId) usedIds.add(clip.assetId);
  }

  const prunedAssets: Record<string, AssetEntry> = {};
  for (const [id, entry] of Object.entries(timeline.assets)) {
    if (usedIds.has(id)) prunedAssets[id] = entry;
  }

  return { ...timeline, assets: prunedAssets };
}
```

### 3.3 Implement Diff-Only Config Export (Medium Priority)

**File**: `/packages/manda-studio/src/db/projectService.ts`

Create utility functions for config diffing:

```typescript
import { configDefault } from "@mandafunk/config";

/** Deep-diff: returns only the keys in `actual` that differ from `defaults`. */
export function diffConfig(
  actual: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    const av = actual[key];
    const dv = defaults[key];
    if (typeof av === "object" && av !== null && typeof dv === "object" && dv !== null
        && !Array.isArray(av)) {
      const inner = diffConfig(
        av as Record<string, unknown>,
        dv as Record<string, unknown>,
      );
      if (Object.keys(inner).length > 0) result[key] = inner;
    } else if (av !== dv) {
      result[key] = av;
    }
  }
  return result;
}

/** Deep-merge: apply a partial config on top of configDefault. */
export function mergeWithDefaults(
  partial: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const result = structuredClone(defaults);
  for (const key of Object.keys(partial)) {
    const pv = partial[key];
    const dv = result[key];
    if (typeof pv === "object" && pv !== null && typeof dv === "object" && dv !== null
        && !Array.isArray(pv)) {
      result[key] = mergeWithDefaults(
        pv as Record<string, unknown>,
        dv as Record<string, unknown>,
      );
    } else {
      result[key] = pv;
    }
  }
  return result;
}
```

### 3.4 Strip UI-Only State on Export (Medium Priority)

**File**: `/packages/manda-studio/src/db/projectService.ts`

Modify `exportProjects()` to remove `collapsed`, `hidden`, and `sidebarItems` from scenes before serialization. These can be reconstructed on import:

- `collapsed`: default to `true`
- `hidden`: default to `false`
- `sidebarItems`: derive from which config sections have `show: true`

### 3.5 Compact Keyframe Serialization (Low Priority)

Rename fields in the export layer only (no internal model changes):

| v1.0 field | v2.0 field | Notes |
|------------|------------|-------|
| `time` | `t` | 3 characters saved per keyframe |
| `path` | `p` | |
| `value` | `v` | |
| `easing` | `e` | omitted entirely when `linear` |

### 3.6 Remove Empty Sequences on Export (Low Priority)

Sequences with `keyframes: []` carry no useful data. Strip them during `exportProjects()`. On import, if a scene's `sidebarItems` reference a sequence type that is absent, the UI can auto-create an empty sequence.

---

## 4. Migration Strategy

Passage direct au format v2.0. Les exports v1.0 existants ne seront pas supportes a l'import.

### Etapes de migration

1. **Mettre a jour les types** : creer les interfaces `ProjectExportV2`, `SceneV2`, `KeyframeV2`, etc. (Section 2.2)
2. **Implementer `diffConfig` / `mergeWithDefaults`** (Section 3.3)
3. **Implementer le garbage collection des assets** (Section 3.2)
4. **Fixer la deduplication dans `registerAsset`** (Section 3.1)
5. **Reecrire `exportProjects()`** : v2.0 uniquement, avec diff-only config, keyframes compacts, pas d'etat UI
6. **Reecrire `importProjects()`** : v2.0 uniquement, avec `mergeWithDefaults` pour reconstruire les configs completes

```typescript
export async function importProjects(file: File): Promise<number> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (data.version !== "2.0") {
    throw new Error(`Unsupported format version: ${data.version}. Only v2.0 is supported.`);
  }

  for (const project of data.projects) {
    for (const scene of project.scenes) {
      scene.baseConfig = mergeWithDefaults(scene.config ?? {}, configDefault);
      scene.sidebarItems = deriveSidebarItems(scene.baseConfig);
      scene.collapsed = true;
      scene.hidden = false;
    }
    // Expand compact keyframes: t->time, p->path, v->value, e->easing (default linear)
  }
}
```

### Ameliorations futures

- **Format ZIP** : pour les gros projets, un ZIP contenant le JSON manifest + les blobs des assets (le champ `filePath` dans `AssetEntryV2` est prevu pour ca)
- **Validation par schema** : ajouter un schema Zod pour v2.0 afin de valider les imports
- **Hash des defaults** : inclure un hash de `configDefault` dans l'export pour detecter les drifts de config entre versions

---

## 5. Architectural Observations

### 5.1 Asset Registry Lacks Referential Integrity

The store's `removeAsset()` does not check whether any scene or audio clip references the asset. Removing a referenced asset silently creates dangling `bgAssetId` / `assetId` pointers. Add a guard:

```typescript
removeAsset: (assetId) => {
  const { timeline } = get();
  // Check references before removing
  const isReferenced = timeline.scenes.some((s) =>
    s.baseConfig?.scene?.bgAssetId === assetId
  ) || timeline.audioClips.some((c) => c.assetId === assetId);
  if (isReferenced) return; // or throw, or cascade-remove references
  const { [assetId]: _removed, ...rest } = timeline.assets;
  set({ timeline: { ...timeline, assets: rest } });
},
```

### 5.2 `stripRuntimeData` Does a Full `structuredClone`

Every auto-save (debounced at 2s) triggers `structuredClone(timeline)` inside `stripRuntimeData`. For large projects with many scenes and assets, this is expensive. Consider:
- Tracking a dirty flag per-scene and only cloning dirty subtrees.
- Using `JSON.parse(JSON.stringify(...))` which is faster for pure-data objects (no `Date`, `Set`, etc.).

### 5.3 Two Export Systems Exist in Parallel

There are two separate export/import systems:
1. **Project export** (`projectService.ts`): Exports the full Gantt timeline (what we analyzed here).
2. **Timeline export** (`useTimelineExport.ts` / `timelineService.ts`): Exports a different `Track[]`-based format for the older Analogik player.

These should be clearly documented as serving different purposes, or unified if the older format is being phased out.

---

## 6. Summary of Priorities

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| **HIGH** | Deduplicate assets on registration | Prevents problem at source | Small (store change) |
| **HIGH** | Garbage-collect orphaned assets on export | ~30% fewer asset entries | Small (new utility) |
| **HIGH** | Add referential integrity checks to `removeAsset` | Prevents dangling references | Small |
| **MEDIUM** | Diff-only config export/import | ~68% reduction in config data | Medium (new utility + format bump) |
| **MEDIUM** | Strip UI state from export | Cleaner separation of concerns | Small |
| **LOW** | Compact keyframe format | ~15% reduction in keyframe data | Small (rename layer) |
| **LOW** | Remove empty sequences on export | Minor size reduction | Trivial |
| **LOW** | Defaults hash in export envelope | Forward compatibility | Trivial |

**Total estimated size reduction**: 60-65% for typical projects, bringing the analyzed 106 KB file down to approximately 38 KB.
