# MandaStudio - Propositions d'améliorations

## Correction appliquée

### Shader : changement et paramètres

**Problème** : Quand on changeait de shader, l'ancien restait à l'écran. Et modifier les paramètres (speed, opacity, sin/cos) n'avait aucun effet visuel.

**Cause racine** : `MandaRenderer.updateConfig()` ne propageait pas les changements au shader. Le shader gardait une référence figée à la config initiale reçue lors de `init()`.

**Correctif appliqué** (3 fichiers) :

| Fichier | Modification |
|---------|-------------|
| `packages/mandafunk/shaders/ShaderAbstract.ts` | Ajout `updateConfig(config)` : met à jour `this.config` + uniform `iOpacity` + position Z (zoom) |
| `packages/mandafunk/core/MandaScene.ts` | Ajout `updateShaderConfig(config)` : propage la config au shader actif sans le recharger |
| `packages/mandafunk/core/MandaRenderer.ts` | `updateConfig()` appelle maintenant `scene.updateShaderConfig()` en plus de staticItems et composer |

**Résultat** : Le changement de shader fonctionne (Plasma → Ball → Tunnel vérifié visuellement). Les paramètres speed, opacity, sin/cos, zoom sont maintenant propagés en temps réel au shader.

---

## Amélioration 1 : Panneau Sparks dédié

### Contexte actuel

Le système de particules existe dans l'app Analogik (`src/Components/sparks.js`) mais n'est **pas intégré** dans MandaStudio/Mandafunk. Le code actuel crée 3 instances hardcodées :

```
Sparks(scene, 100, "#ff0000", 0.5, 0.15)   // 100 rouges
Sparks(scene, 200, "#FFFFFF", 0.25, 0.25)   // 200 blanches
Sparks(scene, 100, "#00BBFF", 0.5, 0.2)    // 100 cyan
```

Chaque instance utilise :
- `BufferGeometry` + `PointsMaterial` avec `AdditiveBlending`
- Texture sprite (`spark1.png`)
- Mouvement vertical (bas → haut) avec dérive sinusoïdale horizontale
- Reset quand y >= 50

### Proposition

Ajouter un onglet **"Sparks"** dans le panneau de gauche (à côté de Texts et Images) pour contrôler les particules à la demande.

#### 1. Config étendue (`ConfigType`)

```typescript
interface SparksConfig {
  enabled: boolean;
  emitters: SparkEmitter[];
}

interface SparkEmitter {
  id: string;
  name: string;
  count: number;           // Nombre de particules (10-500)
  color: string;           // Couleur hex (#ff0000)
  opacity: number;         // 0-1
  size: number;            // Taille des particules (0.5-5)
  acceleration: number;    // Vitesse (0.05-0.5)
  // Point d'émission
  emissionOrigin: {
    x: number;             // -50 à 50
    y: number;             // -50 à 50
    z: number;             // -50 à 50
  };
  // Direction d'émission
  emissionDirection: "up" | "down" | "left" | "right" | "radial";
  // Perturbation
  perturbation: {
    enabled: boolean;
    amplitude: number;     // Force de la perturbation sinusoïdale
    frequency: number;     // Vitesse de la perturbation
  };
  // Image/texture
  sprite: string;          // URL de l'image sprite (default: spark1.png)
  blending: "additive" | "normal";
  muted: boolean;          // Désactiver sans supprimer
}
```

#### 2. Panneau UI (`SparksPanel.tsx`)

- Liste des emitters avec bouton **"+ Add Emitter"**
- Chaque emitter est un bloc repliable :
  - Nom éditable
  - Toggle on/off (muted)
  - Contrôles : count, color, opacity, size, acceleration
  - Section "Emission" : origin XYZ (sliders), direction (select)
  - Section "Perturbation" : toggle + amplitude/frequency
  - Sprite : sélection d'image (depuis la library ou upload)
  - Bouton supprimer
- Preview en temps réel dans le canvas

#### 3. Intégration Mandafunk

- Nouvelle classe `SparksManager` dans `packages/mandafunk/fx/` :
  - Gère N emitters dynamiquement
  - Méthode `update(config)` pour ajouter/supprimer/modifier des emitters
  - Méthode `rendering(time)` appelée par le RAF loop
- `StaticItems` instancie `SparksManager` et l'inclut dans le cycle de rendu
- Le sprite peut être changé dynamiquement (chargement async de la texture)

#### 4. Timeline

Les sparks sont liés à une scène. Chaque emitter peut avoir des keyframes dans les séquences (type `"sparks"`) pour animer count, opacity, position dans le temps.

---

## Amélioration 2 : Background couleur OU image

### Contexte actuel

Le code de `MandaScene.updateSceneBackground()` gère déjà :
- **Couleur** : `config.scene.bgColor` → `scene.background = new Color(...)`
- **Image** : `config.scene.background` → chargement + canvas texture avec blur/brightness
- **Shader** : `config.scene.shader` → mesh GLSL en overlay

Le panneau Background actuel (`ScenePanel.tsx`) affiche seulement : color picker + brightness + blur.

### Proposition

Remplacer la section Background par un sélecteur à 2 modes :

```
[Couleur] [Image]     ← Toggle / SegmentedControl
```

#### Mode Couleur
- Color picker (existant)
- Brightness slider (existant)

#### Mode Image
- Aperçu miniature de l'image sélectionnée
- Bouton "Choisir" → ouvre la Library onglet Images (voir amélioration 3)
- Ou drag-and-drop depuis la library
- Blur slider (existant, s'applique à l'image via canvas filter)
- Brightness slider (existant)
- Bouton "Supprimer" pour revenir à couleur

#### Changements config

Pas de changement structurel. `scene.bgColor` et `scene.background` existent déjà. Le mode est déduit :
- Si `scene.background` est non-vide → mode Image
- Sinon → mode Couleur

Le blur ne s'affiche qu'en mode Image (il ne s'applique pas à une couleur).

---

## Amélioration 3 : Library avec onglets et drag-and-drop

### Contexte actuel

La Library (`LibraryDrawer.tsx`) :
- Ne contient que des **presets de scènes** (ConfigType complet)
- S'ouvre en drawer fixe à droite avec un backdrop semi-transparent
- Le backdrop **bloque l'interaction** avec le reste de l'interface

### Proposition

#### 1. Onglets

```
[Scenes] [Images] [Audio] [Videos]
```

| Onglet | Contenu | Stockage |
|--------|---------|----------|
| **Scenes** | Presets existants (ConfigType) | IndexedDB (existant) |
| **Images** | Fichiers image (PNG, JPG, WebP, SVG) | IndexedDB + blob URLs |
| **Audio** | Fichiers audio (MP3, WAV, OGG, FLAC) | IndexedDB + blob URLs |
| **Videos** | Fichiers vidéo (MP4, WebM) | IndexedDB + blob URLs |

Chaque onglet a :
- Recherche par nom/tags
- Import (upload fichier ou drag depuis l'OS)
- Export / suppression
- Grille de miniatures (existante pour scenes, à ajouter pour les autres)

#### 2. Suppression du backdrop (pas de mask)

Actuellement le drawer a un overlay noir semi-transparent (`z-40`) qui bloque les clics.

**Changement** : Supprimer le backdrop. La library s'ouvre en panneau latéral **sans masquer** le reste de l'interface. L'utilisateur peut interagir avec le canvas, la timeline et le panneau de gauche pendant que la library est ouverte.

Options de layout :
- **Panneau flottant** : La library se superpose à droite, sans backdrop, avec une ombre portée. Le contenu en dessous reste cliquable.
- **Panneau poussé** : La library réduit l'espace du canvas (flex layout). Plus propre mais réduit la zone de preview.

**Recommandation** : Panneau flottant sans backdrop (plus rapide à implémenter, ne modifie pas le layout principal).

#### 3. Drag-and-drop depuis la Library

L'utilisateur peut **glisser** un élément de la library vers :

| Source (Library) | Cible | Action |
|-----------------|-------|--------|
| **Scene preset** | Timeline (zone scènes) | Crée un nouveau bloc scène avec cette config |
| **Image** | Panneau Images (gauche) | Ajoute l'image comme overlay |
| **Image** | Panneau Background | Définit comme image de fond |
| **Image** | Panneau Sparks | Définit comme sprite pour un emitter |
| **Audio** | Timeline (zone audio) | Crée un nouveau clip audio |
| **Video** | Timeline (zone scènes) | Crée une scène avec la vidéo en background |

**Implémentation technique** :
- Utiliser l'API native HTML5 Drag and Drop (`draggable`, `onDragStart`, `onDrop`)
- Pas besoin de `@dnd-kit` pour le drag inter-composants (dnd-kit est mieux pour le reorder intra-liste)
- `dataTransfer.setData()` avec le type + id de l'élément
- Les zones de drop affichent un highlight visuel quand un élément compatible survole

#### 4. Types de données

```typescript
interface LibraryImage {
  id: number;
  name: string;
  tags: string[];
  mimeType: string;
  blob: Blob;           // Stocké en IndexedDB
  thumbnailUrl: string;  // Base64 miniature
  width: number;
  height: number;
  createdAt: string;
}

interface LibraryAudio {
  id: number;
  name: string;
  tags: string[];
  mimeType: string;
  blob: Blob;
  duration: number;      // Secondes
  waveformData?: number[];  // Pour affichage miniature
  createdAt: string;
}

interface LibraryVideo {
  id: number;
  name: string;
  tags: string[];
  mimeType: string;
  blob: Blob;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  createdAt: string;
}
```

#### 5. IndexedDB stores

Ajouter 3 nouveaux object stores dans la base existante :
- `libraryImages`
- `libraryAudio`
- `libraryVideos`

Avec des services CRUD similaires à `presetService.ts`.

---

## Ordre de priorité suggéré

1. **Library sans backdrop** — Quick win, améliore l'UX immédiatement
2. **Background couleur/image** — UI simple, code backend déjà existant
3. **Library onglets Images + Audio** — Nécessaire pour le drag-and-drop
4. **Drag-and-drop Library → Timeline/Panels** — Dépend des onglets
5. **Panneau Sparks** — Le plus complexe, nécessite une nouvelle classe dans Mandafunk

---

## Fichiers impactés (estimation)

### Sparks
- `packages/mandafunk/config/types.ts` — Ajout `SparksConfig`, `SparkEmitter`
- `packages/mandafunk/config/defaults.ts` — Defaults sparks
- `packages/mandafunk/fx/SparksManager.ts` — **Nouveau** : gestionnaire de particules
- `packages/mandafunk/core/StaticItems.ts` — Intégration SparksManager
- `packages/manda-studio/src/components/panels/SparksPanel.tsx` — **Nouveau** : panneau UI
- `packages/manda-studio/src/App.tsx` — Ajout onglet Sparks

### Background
- `packages/manda-studio/src/components/panels/ScenePanel.tsx` — Refonte section Background

### Library
- `packages/manda-studio/src/components/library/LibraryDrawer.tsx` — Onglets + suppression backdrop
- `packages/manda-studio/src/components/library/ImageLibrary.tsx` — **Nouveau**
- `packages/manda-studio/src/components/library/AudioLibrary.tsx` — **Nouveau**
- `packages/manda-studio/src/components/library/VideoLibrary.tsx` — **Nouveau**
- `packages/manda-studio/src/db/libraryService.ts` — **Nouveau** : CRUD images/audio/videos
- `packages/manda-studio/src/db/types.ts` — Types LibraryImage, LibraryAudio, LibraryVideo
- `packages/manda-studio/src/hooks/useLibrary.ts` — **Nouveau** : hook CRUD
