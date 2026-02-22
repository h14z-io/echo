import type { MermaidConfig } from 'mermaid'

// Pastel color palette for dark backgrounds
// Each color has a fill (bg), stroke (border), and text variant
const PASTEL = {
  violet: { fill: 'rgba(196,181,253,0.18)', stroke: 'rgba(167,139,250,0.5)', text: '#c4b5fd' },
  blue: { fill: 'rgba(147,197,253,0.18)', stroke: 'rgba(96,165,250,0.5)', text: '#93c5fd' },
  teal: { fill: 'rgba(94,234,212,0.18)', stroke: 'rgba(45,212,191,0.5)', text: '#5eead4' },
  green: { fill: 'rgba(134,239,172,0.18)', stroke: 'rgba(74,222,128,0.5)', text: '#86efac' },
  amber: { fill: 'rgba(253,230,138,0.18)', stroke: 'rgba(251,191,36,0.5)', text: '#fde68a' },
  pink: { fill: 'rgba(249,168,212,0.18)', stroke: 'rgba(244,114,182,0.5)', text: '#f9a8d4' },
  cyan: { fill: 'rgba(103,232,249,0.18)', stroke: 'rgba(34,211,238,0.5)', text: '#67e8f9' },
  orange: { fill: 'rgba(253,186,116,0.18)', stroke: 'rgba(251,146,60,0.5)', text: '#fdba74' },
}

export const MERMAID_CONFIG: MermaidConfig = {
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '13px',

    // Primary palette - violet
    primaryColor: PASTEL.violet.fill,
    primaryTextColor: '#fafafa',
    primaryBorderColor: PASTEL.violet.stroke,

    // Secondary - blue
    secondaryColor: PASTEL.blue.fill,
    secondaryTextColor: '#fafafa',
    secondaryBorderColor: PASTEL.blue.stroke,

    // Tertiary - teal
    tertiaryColor: PASTEL.teal.fill,
    tertiaryTextColor: '#fafafa',
    tertiaryBorderColor: PASTEL.teal.stroke,

    // Lines & edges
    lineColor: '#71717a',
    textColor: '#e4e4e7',

    // Nodes
    nodeTextColor: '#fafafa',
    nodeBorder: PASTEL.violet.stroke,
    mainBkg: PASTEL.violet.fill,

    // Labels
    labelColor: '#fafafa',
    labelBackground: '#27272a',

    // Flowchart
    clusterBkg: 'rgba(63,63,70,0.4)',
    clusterBorder: 'rgba(113,113,122,0.5)',
    edgeLabelBackground: '#27272a',

    // Sequence diagram
    actorBkg: PASTEL.violet.fill,
    actorBorder: PASTEL.violet.stroke,
    actorTextColor: '#fafafa',
    actorLineColor: '#52525b',
    signalColor: '#a1a1aa',
    signalTextColor: '#fafafa',
    activationBkgColor: PASTEL.blue.fill,
    activationBorderColor: PASTEL.blue.stroke,
    sequenceNumberColor: '#fafafa',
    loopTextColor: PASTEL.amber.text,

    // Notes
    noteBkgColor: PASTEL.amber.fill,
    noteTextColor: PASTEL.amber.text,
    noteBorderColor: PASTEL.amber.stroke,

    // Pie chart
    pie1: PASTEL.violet.text,
    pie2: PASTEL.blue.text,
    pie3: PASTEL.teal.text,
    pie4: PASTEL.amber.text,
    pie5: PASTEL.pink.text,
    pie6: PASTEL.orange.text,
    pie7: PASTEL.cyan.text,
    pie8: PASTEL.green.text,
    pieStrokeColor: '#27272a',
    pieTitleTextColor: '#fafafa',
    pieSectionTextColor: '#18181b',
    pieLegendTextColor: '#e4e4e7',
    pieStrokeWidth: '1px',
    pieOuterStrokeColor: '#27272a',
    pieOuterStrokeWidth: '0px',

    // Gantt
    taskBkgColor: PASTEL.violet.fill,
    taskBorderColor: PASTEL.violet.stroke,
    taskTextColor: '#fafafa',
    taskTextDarkColor: '#fafafa',
    taskTextOutsideColor: '#e4e4e7',
    activeTaskBkgColor: PASTEL.blue.fill,
    activeTaskBorderColor: PASTEL.blue.stroke,
    doneTaskBkgColor: PASTEL.green.fill,
    doneTaskBorderColor: PASTEL.green.stroke,
    critBkgColor: PASTEL.pink.fill,
    critBorderColor: PASTEL.pink.stroke,
    sectionBkgColor: 'rgba(63,63,70,0.3)',
    sectionBkgColor2: 'rgba(63,63,70,0.15)',
    gridColor: '#3f3f46',
    todayLineColor: PASTEL.amber.text,

    // Git graph
    git0: PASTEL.violet.text,
    git1: PASTEL.blue.text,
    git2: PASTEL.teal.text,
    git3: PASTEL.pink.text,
    git4: PASTEL.amber.text,
    git5: PASTEL.orange.text,
    git6: PASTEL.cyan.text,
    git7: PASTEL.green.text,
    gitBranchLabel0: '#fafafa',
    gitBranchLabel1: '#fafafa',
    gitBranchLabel2: '#fafafa',
    gitBranchLabel3: '#fafafa',
    commitLabelColor: '#e4e4e7',

    // Class diagram
    classText: '#fafafa',

    // State diagram
    labelBackgroundColor: '#27272a',
    compositeBackground: 'rgba(63,63,70,0.3)',
    compositeBorder: 'rgba(113,113,122,0.5)',
    innerEndBackground: PASTEL.violet.text,
    specialStateColor: PASTEL.amber.text,
    errorBkgColor: PASTEL.pink.fill,
    errorTextColor: PASTEL.pink.text,

    // Mindmap
    cScale0: PASTEL.violet.fill,
    cScale1: PASTEL.blue.fill,
    cScale2: PASTEL.teal.fill,
    cScale3: PASTEL.amber.fill,
    cScale4: PASTEL.pink.fill,
    cScale5: PASTEL.orange.fill,
    cScale6: PASTEL.cyan.fill,
    cScale7: PASTEL.green.fill,
  },
  flowchart: {
    curve: 'basis',
    padding: 16,
    htmlLabels: false,
  },
  sequence: {
    mirrorActors: false,
    messageAlign: 'center',
    useMaxWidth: true,
  },
  mindmap: {
    padding: 16,
    useMaxWidth: true,
  },
}

// Render mermaid code to SVG string
export async function renderMermaid(code: string): Promise<{ svg: string; error?: undefined } | { svg?: undefined; error: string }> {
  try {
    const mermaid = (await import('mermaid')).default
    mermaid.initialize(MERMAID_CONFIG)
    const { svg } = await mermaid.render('diagram-' + Date.now(), code)
    return { svg }
  } catch (err) {
    console.error('Mermaid render error:', err)
    return { error: (err as Error).message || 'Render failed' }
  }
}

// Convert SVG string to PNG blob with timeout fallback
export async function svgToBlob(svgString: string, containerEl?: HTMLElement): Promise<Blob> {
  const TIMEOUT_MS = 5000

  // Strip foreignObject elements that break canvas rendering
  const cleanSvg = svgString.replace(/<foreignObject[\s\S]*?<\/foreignObject>/g, '')

  return new Promise((resolve, reject) => {
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(cleanSvg, 'image/svg+xml')
    const svgEl = svgDoc.documentElement

    let width = parseInt(svgEl.getAttribute('width') || '800')
    let height = parseInt(svgEl.getAttribute('height') || '600')

    if (containerEl) {
      const rendered = containerEl.querySelector('svg')
      if (rendered) {
        const bbox = rendered.getBoundingClientRect()
        width = Math.ceil(bbox.width) || width
        height = Math.ceil(bbox.height) || height
      }
    }

    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    ctx.scale(scale, scale)
    ctx.fillStyle = '#18181b'
    ctx.fillRect(0, 0, width, height)

    let settled = false
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true
        // Return canvas with just the background as fallback
        canvas.toBlob((blob) => {
          resolve(blob || new Blob([], { type: 'image/png' }))
        }, 'image/png')
      }
    }, TIMEOUT_MS)

    const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const img = new Image()
    img.onload = () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      try {
        ctx.drawImage(img, 0, 0, width, height)
      } catch {
        // Canvas tainted - ignore
      }
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        resolve(blob || new Blob([], { type: 'image/png' }))
      }, 'image/png')
    }
    img.onerror = () => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      // Return dark placeholder
      canvas.toBlob((blob) => {
        resolve(blob || new Blob([], { type: 'image/png' }))
      }, 'image/png')
    }
    img.src = url
  })
}
