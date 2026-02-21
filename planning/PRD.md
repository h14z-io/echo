# PRD: Echo v2 - Voice Notes with AI

## Overview

Echo es una app web mobile-first para capturar notas de voz con transcripcion automatica via Gemini 2.5 Flash. La v2 evoluciona de un modelo de "Conversations" a notas individuales con tags, folders e **Insights** - workspaces transversales que consolidan multiples notas en analisis inteligentes.

**Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, IndexedDB, Gemini 2.5 Flash

---

## Data Model

### VoiceNote (entidad principal)

```typescript
interface VoiceNote {
  id: string
  title: string              // Auto-generado por Gemini del contexto del transcript
  defaultTitle: string       // Timestamp original (fallback si transcript falla)
  audioBlob: Blob            // Audio raw en IndexedDB (no base64)
  audioFormat: string        // "webm"
  duration: number           // Segundos
  transcription: string | null
  summary: string | null     // Resumen corto (2-3 lineas) generado por Gemini
  tags: string[]             // AI auto-suggest + manual
  folderId: string | null    // Folder opcional
  insightIds: string[]       // Insights a los que pertenece
  status: "recording" | "transcribing" | "ready" | "error"
  createdAt: number
  updatedAt: number
}
```

### Folder

```typescript
interface Folder {
  id: string
  name: string
  color: string              // Color del borde/acento
  createdAt: number
}
```

### Insight (workspace transversal)

```typescript
interface Insight {
  id: string
  name: string
  noteIds: string[]          // Notas asociadas (de cualquier tag/folder)
  generatedContent: {
    summary: string          // Resumen consolidado
    keyPoints: string[]      // Puntos clave
    actionItems: string[]    // Acciones concretas / CTAs
    timeline: TimelineEntry[] // Evolucion temporal
    customSections: CustomSection[] // Secciones generadas por prompt custom
  } | null
  lastGeneratedAt: number | null
  createdAt: number
  updatedAt: number
}

interface TimelineEntry {
  date: number
  noteId: string
  event: string              // Descripcion corta del evento/tema
}

interface CustomSection {
  prompt: string             // Prompt del usuario
  content: string            // Respuesta de Gemini
  generatedAt: number
}
```

---

## Flujos Principales

### F1: Grabar Nota de Voz

```
[Home] -> Tap REC -> [Recording Screen]
  -> Grabando (timer + waveform en tiempo real)
  -> Tap STOP
  -> Se crea VoiceNote con:
     - title: timestamp formateado ("Feb 20, 16:30")
     - status: "transcribing"
     - Audio guardado en IndexedDB
  -> Gemini procesa en background:
     1. Transcripcion completa
     2. Resumen corto (2-3 lineas)
     3. Titulo contextual (3-6 palabras)
     4. Tags sugeridos (2-3)
  -> VoiceNote se actualiza:
     - title: titulo generado por Gemini
     - transcription: texto completo
     - summary: resumen corto
     - tags: tags sugeridos
     - status: "ready"
  -> Si falla Gemini:
     - status: "error"
     - title: mantiene timestamp
     - Boton "Retry" visible en Note Detail
```

### F2: Ver Detalle de Nota

```
[Home o Search] -> Tap nota -> [Note Detail]
  - Header: <- Note
  - Titulo (editable al tap)
  - Fecha y duracion
  - Audio player (play/pause, progress bar, tiempo)
  - AI Summary (resumen corto, colapsable)
  - Transcript completo (scrollable)
  - Tags (chips editables: quitar, agregar manual)
  - Acciones: mover a folder, agregar a insight, eliminar
```

### F3: Buscar y Filtrar

```
[Bottom Nav] -> Notes -> [Search Screen]
  - Search bar: busqueda full-text en transcripts y titulos
  - Filter chips: tags clickeables (toggle on/off)
  - Resultado: lista de notas ordenadas por fecha
  - Cada card muestra: titulo, duracion, tags, fecha
```

### F4: Gestionar Folders

```
[Bottom Nav] -> Folders -> [Folders Screen]
  - Lista de folders con color y contador
  - Tap folder -> [Notes filtradas por folder]
  - "+ Create new folder" -> Modal con nombre y color
  - Desde Note Detail: "Move to folder" -> Selector de folders
```

### F5: Insights (workspace transversal)

```
Crear Insight:
  Opcion A: Desde filtro de notas -> "Create Insight from selection"
  Opcion B: Menu principal -> "New Insight" -> Nombrar -> Agregar notas manualmente

Agregar notas a Insight:
  - Desde Note Detail: "Add to Insight" -> Selector de insights existentes
  - Desde Insight view: "Add Notes" -> Selector con search/filter

Generar analisis:
  [Insight View] -> "Generate Insights" button
  -> Gemini recibe TODOS los transcripts de las notas asociadas
  -> Genera:
     1. Summary general (parrafo)
     2. Key Points (bullet list)
     3. Action Items / CTAs (checklist)
     4. Timeline (cronologia de temas)
  -> Se guarda en el Insight

Prompt personalizado:
  [Insight View] -> "Ask anything" input
  -> Usuario escribe: "Dame un reporte ejecutivo", "Extrae decisiones", etc.
  -> Gemini responde usando el contexto de todas las notas
  -> Se guarda como CustomSection en el insight

Exportar:
  [Insight View] -> "Copy as Markdown"
  -> Copia todo el insight (summary, key points, actions, timeline) formateado en Markdown
```

---

## Pantallas

### 1. Home (Record-first)

- Header: "Echo" + icono settings
- **REC button** prominente (centro, grande, purple)
- "Tap to record" label
- Seccion "Recent": ultimas 3-5 notas (card con titulo + duracion + fecha)
- Bottom nav: Home | Notes | Folders

### 2. Recording

- Header: "Recording..."
- Timer grande (MM:SS)
- Waveform en tiempo real
- **STOP button** (rojo, centro)
- Pause | Cancel links
- Bottom nav

### 3. Note Detail

- Header: "<- Note" con menu (...)
- **Titulo** (editable, auto-generado)
- Fecha + duracion
- **Audio player**: play/pause, progress bar, tiempo
- **AI Summary**: label purple, card con resumen corto
- **Transcript**: label purple, card con texto completo (scroll)
- **Tags**: label purple, chips con tag names + boton "+"
- Estado de transcripcion (loading spinner o "Retry" si error)

### 4. Search / Notes

- Header: "Notes"
- Search bar con placeholder
- Filter chips: tags como toggle buttons
- Lista de notas: cards con titulo, metadata (duracion, tags, fecha)
- Bottom nav

### 5. Folders

- Header: "Folders" + boton "+"
- Lista de folders: cards con color-coded border, nombre, contador
- "+ Create new folder" (dashed border)
- Bottom nav

### 6. Insight View (nueva pantalla)

- Header: "<- [Insight name]" + menu (...)
- Seccion "Notes" (X): lista compacta de notas asociadas + "Add Notes"
- Boton "Generate Insights" (si no se ha generado) o contenido generado:
  - **Summary**: parrafo resumen
  - **Key Points**: bullet list
  - **Action Items**: checklist
  - **Timeline**: linea temporal de eventos
- Input "Ask anything..." para prompt custom
- Secciones custom generadas por prompts anteriores
- Boton "Copy as Markdown"
- Boton "Re-generate" para actualizar con notas nuevas

---

## Gemini 2.5 Flash Integration

### Modelo

- **Model**: `gemini-2.5-flash`
- **API Key**: almacenada en IndexedDB (client-side only)

### Prompts

**Post-recording (single note)**:

```
Analiza este audio de voz y genera:
1. TITULO: Un titulo descriptivo de 3-6 palabras que capture el tema principal
2. RESUMEN: Un resumen de 2-3 lineas del contenido
3. TRANSCRIPCION: Transcripcion completa y literal del audio
4. TAGS: 2-3 tags relevantes en formato #tag (lowercase, sin espacios)

Responde en formato JSON:
{
  "title": "...",
  "summary": "...",
  "transcription": "...",
  "tags": ["tag1", "tag2"]
}
```

**Insight generation**:

```
Tienes {N} notas de voz con sus transcripciones. Analiza todo el contenido y genera:

1. SUMMARY: Resumen general de todos los temas discutidos (1 parrafo)
2. KEY_POINTS: Los puntos mas importantes mencionados (bullet list)
3. ACTION_ITEMS: Acciones concretas, decisiones o proximos pasos mencionados
4. TIMELINE: Cronologia de eventos/temas ordenados por fecha

Notas:
{notas con fecha y transcripcion}

Responde en JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."],
  "timeline": [{"date": "...", "event": "..."}, ...]
}
```

**Custom prompt**:

```
Contexto: Tienes {N} notas de voz de un workspace llamado "{insight_name}".

Transcripciones:
{notas con fecha y transcripcion}

Instruccion del usuario: {user_prompt}
```

---

## Storage: IndexedDB

### Motivacion

localStorage tiene limite de ~10MB. Audio en base64 consume ~1.3x el tamano original. Con IndexedDB:
- Capacidad de ~500MB+ (depende del browser)
- Audio como Blob nativo (sin base64 overhead)
- Indices para busqueda rapida

### Stores

| Store | Key | Indices |
|-------|-----|---------|
| `notes` | `id` | `createdAt`, `folderId`, `status` |
| `folders` | `id` | `name` |
| `insights` | `id` | `updatedAt` |
| `settings` | `key` | - |

### Migracion desde v1

Si el usuario tiene datos en localStorage (v1 con Conversations):
1. Detectar datos existentes en localStorage
2. Convertir Conversations -> notas planas (cada note se vuelve independiente)
3. Crear un folder por cada Conversation (titulo = nombre de conversation)
4. Migrar audio de base64 a Blob
5. Eliminar datos de localStorage despues de migracion exitosa

---

## Ciclo de Vida de una Nota

```
CREATED (timestamp title)
    |
    v
TRANSCRIBING (Gemini processing)
    |
    +---> ERROR (retry available)
    |
    v
READY (title, summary, transcript, tags auto-populated)
    |
    v
ENRICHED (user edits title, adds/removes tags, moves to folder, adds to insight)
```

---

## Prioridades de Implementacion

### P0 - Core (MVP)

1. **Recording**: Captura de audio con waveform
2. **IndexedDB storage**: Notas + audio como Blob
3. **Gemini transcription**: Transcript + titulo + summary + tags auto
4. **Note Detail**: Playback + transcript + summary + tags display
5. **Notes list**: Lista cronologica de todas las notas
6. **Search**: Full-text en transcripts y titulos

### P1 - Organization

7. **Tags**: Visualizacion, filtrado, edicion manual
8. **Folders**: CRUD, asignar notas, filtrar
9. **Title editing**: Editar titulo manualmente

### P2 - Insights

10. **Insight CRUD**: Crear, nombrar, agregar/quitar notas
11. **Generate analysis**: Summary, key points, action items, timeline
12. **Custom prompts**: "Ask anything" sobre el contexto
13. **Export Markdown**: Copiar insight como markdown

### P3 - Polish

14. **Migration v1->v2**: localStorage a IndexedDB
15. **Offline queue**: Encolar transcripcion si no hay internet
16. **Settings**: API key management, theme
17. **Onboarding**: First-time user flow

---

## Wireframes

Ver wireframes interactivos en Excalidraw:
https://excalidraw.com/#json=uuH7WVN1X1ofnM5ejuddm,QkdtXe5t_NyVG1dleipGyA

Screens 1-5 estan disenadas. Screen 6 (Insight View) pendiente de diseno.

---

## Metricas de Exito

- **Adopcion**: Notas creadas por semana
- **Engagement**: % de notas con tags editados manualmente
- **Insights**: Insights creados, prompts custom usados
- **Retention**: Frecuencia de uso semanal
- **Quality**: % de transcripciones exitosas (vs errores)

---

## Consideraciones Tecnicas

- **Audio format**: WebM (nativo del browser, mejor compresion)
- **Max recording**: Sin limite hard, pero warning a los 10 minutos (costo API)
- **Gemini rate limits**: Implementar retry con exponential backoff
- **IndexedDB quotas**: Monitorear uso, alertar al 80% de capacidad
- **Offline**: La app funciona para playback sin internet. Transcripcion se encola.
- **Browser support**: Chrome/Edge (primary), Firefox (secondary), Safari (best effort)
