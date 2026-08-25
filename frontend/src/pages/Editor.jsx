import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { cpp } from '@codemirror/lang-cpp'
import { basicSetup } from 'codemirror'
import { useProjects } from '../context/ProjectContext'
import { useAuth } from '../context/AuthContext'

const LANG_EXTENSIONS = {
  python: python(),
  javascript: javascript(),
  csharp: cpp(),
}

const TEMPLATES = {
  python: {
    'crear funcion': 'def {{name}}():\n    pass',
    'crear variable': '{{name}} = {{value}}',
    'crear bucle for': 'for {{var}} in range({{n}}):\n    pass',
    'crear condicional if': 'if {{condition}}:\n    pass\nelse:\n    pass',
    'comentar linea': '# {{code}}',
    'borrar linea': '',
  },
  javascript: {
    'crear funcion': 'function {{name}}() {\n\n}',
    'crear variable': 'const {{name}} = {{value}};',
    'crear bucle for': 'for (let {{var}} = 0; {{var}} < {{n}}; {{var}}++) {\n\n}',
    'crear condicional if': 'if ({{condition}}) {\n\n} else {\n\n}',
    'comentar linea': '// {{code}}',
    'borrar linea': '',
  },
  csharp: {
    'crear funcion': 'void {{name}}() {\n\n}',
    'crear variable': 'var {{name}} = {{value}};',
    'crear bucle for': 'for (int {{var}} = 0; {{var}} < {{n}}; {{var}}++) {\n\n}',
    'crear condicional if': 'if ({{condition}}) {\n\n} else {\n\n}',
    'comentar linea': '// {{code}}',
    'borrar linea': '',
  },
}

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { api } = useAuth()
  const { currentProject, setCurrentProject, updateProject } = useProjects()
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const editorRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    if (currentProject?.id !== id) {
      api.get(`/projects/${id}/`).then(res => {
        setCurrentProject(res.data)
        setCode(res.data.code)
        setLanguage(res.data.language)
      }).catch(() => navigate('/'))
    }
  }, [id])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('Web Speech API no soportada')
      return
    }
    const rec = new SpeechRecognition()
    rec.lang = 'es-ES'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
      }
      if (final) {
        setTranscript(prev => prev + ' ' + final)
        processCommand(final.trim().toLowerCase())
      }
    }
    rec.onerror = (e) => console.error('Speech error:', e.error)
    setRecognition(rec)
    return () => rec.abort()
  }, [])

  const processCommand = (text) => {
    const normalized = text.replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim()
    const langTemplates = TEMPLATES[language]
    for (const [trigger, template] of Object.entries(langTemplates)) {
      if (normalized.includes(trigger)) {
        let finalTemplate = template
        finalTemplate = finalTemplate.replace('{{name}}', 'mi_funcion')
        finalTemplate = finalTemplate.replace('{{var}}', 'i')
        finalTemplate = finalTemplate.replace('{{n}}', '10')
        finalTemplate = finalTemplate.replace('{{value}}', '0')
        finalTemplate = finalTemplate.replace('{{condition}}', 'true')
        finalTemplate = finalTemplate.replace('{{code}}', 'comentario')
        insertAtCursor(finalTemplate)
        return
      }
    }
    if (normalized === 'guardar archivo') saveCode()
    if (normalized === 'ejecutar codigo') executeCode()
    if (normalized === 'ayuda') setShowCommands(!showCommands)
    if (normalized.startsWith('subir') || normalized.startsWith('bajar')) moveCursor(normalized)
    if (normalized.startsWith('ir a linea') || normalized.startsWith('ir a línea')) gotoLine(normalized)
    if (normalized === 'indentar' || normalized === 'tab') indentLine(1)
    if (normalized === 'desindentar' || normalized === 'destab') indentLine(-1)
    if (normalized === 'inicio linea' || normalized === 'inicio línea') moveToLineStart()
    if (normalized === 'fin linea' || normalized === 'fin línea') moveToLineEnd()
  }

  const insertAtCursor = (text) => {
    if (!editorRef.current) return
    const view = editorRef.current.view
    const { state } = view
    const pos = state.selection.main.head
    view.dispatch({ changes: { from: pos, insert: text } })
    view.focus()
  }

  const moveCursor = (cmd) => {
    const view = editorRef.current?.view
    if (!view) return
    const lines = parseInt(cmd.match(/\d+/) || ['1'])[0] * (cmd.startsWith('subir') ? -1 : 1)
    const { state } = view
    const currentLine = state.doc.lineAt(state.selection.main.head).number
    const target = Math.max(1, Math.min(state.doc.lines, currentLine + lines))
    view.dispatch({ selection: { anchor: state.doc.line(target).from } })
    view.focus()
  }

  const gotoLine = (cmd) => {
    const view = editorRef.current?.view
    if (!view) return
    const n = parseInt(cmd.match(/\d+/) || ['1'])[0]
    const { state } = view
    const target = Math.max(1, Math.min(state.doc.lines, n))
    view.dispatch({ selection: { anchor: state.doc.line(target).from } })
    view.focus()
  }

  const indentLine = (dir) => {
    const view = editorRef.current?.view
    if (!view) return
    const { state } = view
    const line = state.doc.lineAt(state.selection.main.head)
    const indent = dir > 0 ? '    ' : ''
    const unindent = line.text.slice(0, 4) === '    ' ? 4 : 0
    view.dispatch({ changes: { from: line.from, to: line.from + unindent, insert: indent } })
    view.focus()
  }

  const moveToLineStart = () => {
    const view = editorRef.current?.view
    if (!view) return
    const { state } = view
    view.dispatch({ selection: { anchor: state.doc.lineAt(state.selection.main.head).from } })
    view.focus()
  }

  const moveToLineEnd = () => {
    const view = editorRef.current?.view
    if (!view) return
    const { state } = view
    view.dispatch({ selection: { anchor: state.doc.lineAt(state.selection.main.head).to } })
    view.focus()
  }

  const saveCode = async () => {
    if (!currentProject) return
    try {
      await updateProject(api, currentProject.id, { code })
      console.log('Guardado')
    } catch (e) { console.error(e) }
  }

  const executeCode = async () => {
    if (!currentProject) return
    try {
      const res = await api.post('/execute/', { project_id: currentProject.id, code, language })
      console.log('Ejecutando:', res.data)
    } catch (e) { console.error(e) }
  }

  const handleChange = useCallback((value, viewUpdate) => {
    setCode(value)
  }, [])

  const extensions = [basicSetup, LANG_EXTENSIONS[language]]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        padding: '1rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <h2 style={{ flex: 1 }}>{currentProject?.name}</h2>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="csharp">C#</option>
        </select>
        <button
          onClick={() => { listening ? recognition?.stop() : recognition?.start(); setListening(l => !l) }}
          style={{
            padding: '0.5rem 1rem',
            background: listening ? 'var(--danger)' : 'var(--accent)',
            color: listening ? 'white' : 'var(--bg-primary)',
            fontWeight: 'bold',
            borderRadius: '4px',
          }}
        >
          {listening ? '🔴 Escuchando' : '🎤 Micrófono'}
        </button>
        <button onClick={() => setShowCommands(!showCommands)} style={{
          padding: '0.5rem 1rem',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
        }}>⌘ Comandos</button>
        <button onClick={saveCode} style={{
          padding: '0.5rem 1rem',
          background: 'var(--accent)',
          color: 'var(--bg-primary)',
          fontWeight: 'bold',
          borderRadius: '4px',
        }}>💾 Guardar</button>
        <button onClick={executeCode} style={{
          padding: '0.5rem 1rem',
          background: 'var(--warning)',
          color: 'var(--bg-primary)',
          fontWeight: 'bold',
          borderRadius: '4px',
        }}>▶ Ejecutar</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CodeMirror
          ref={editorRef}
          value={code}
          onChange={handleChange}
          extensions={extensions}
          height="100%"
          style={{ flex: 1, border: 'none', fontSize: '14px', lineHeight: '1.6' }}
          basicSetup={{ lineNumbers: true, foldGutter: true }}
        />

        {showCommands && (
          <div style={{
            position: 'absolute', right: '2rem', top: '5rem',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '1rem', maxWidth: '300px', zIndex: 50,
            boxShadow: '0 4px 12px var(--shadow)',
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Comandos ({language})</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {Object.keys(TEMPLATES[language]).map(cmd => (
                <li key={cmd} style={{ marginBottom: '0.25rem' }}>• {cmd}</li>
              ))}
              <li style={{ marginBottom: '0.25rem' }}>• guardar archivo</li>
              <li style={{ marginBottom: '0.25rem' }}>• ejecutar codigo</li>
              <li style={{ marginBottom: '0.25rem' }}>• ayuda</li>
              <li style={{ marginBottom: '0.25rem' }}>• subir / bajar [n]</li>
              <li style={{ marginBottom: '0.25rem' }}>• ir a linea [n]</li>
              <li style={{ marginBottom: '0.25rem' }}>• indentar / desindentar</li>
              <li style={{ marginBottom: '0.25rem' }}>• inicio linea / fin linea</li>
            </ul>
          </div>
        )}

        {transcript && (
          <div style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}>
            🎙 {transcript.slice(-200)}
          </div>
        )}
      </div>
    </div>
  )
}