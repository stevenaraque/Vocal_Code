import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../context/ProjectContext'

export default function Dashboard() {
  const { projects, loading, fetchProjects, createProject } = useProjects()
  const [showModal, setShowModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', language: 'python' })

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const project = await createProject(newProject)
      setShowModal(false)
      setNewProject({ name: '', language: 'python' })
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al crear')
    }
  }

  if (loading && projects.length === 0) return <div style={{ textAlign: 'center', padding: '3rem' }}>Cargando proyectos...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Mis Proyectos</h1>
        <button onClick={() => setShowModal(true)} style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--accent)',
          color: 'var(--bg-primary)',
          fontWeight: 'bold',
          borderRadius: '4px',
        }}>Nuevo Proyecto</button>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <p>No tienes proyectos aún</p>
          <button onClick={() => setShowModal(true)} style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            fontWeight: 'bold',
            borderRadius: '4px',
          }}>Crear mi primer proyecto</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {projects.map(project => (
            <Link key={project.id} to={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.5rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    color: 'var(--accent)',
                  }}>{project.language}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Última actualización: {new Date(project.updated_at).toLocaleString('es-CO')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }} onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} style={{
            background: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid var(--border)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Nuevo Proyecto</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
              <input
                type="text"
                value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Lenguaje</label>
              <select
                value={newProject.language}
                onChange={e => setNewProject({ ...newProject, language: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="csharp">C#</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '0.75rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: '4px',
              }}>Cancelar</button>
              <button type="submit" style={{
                flex: 1, padding: '0.75rem', background: 'var(--accent)', color: 'var(--bg-primary)',
                fontWeight: 'bold', borderRadius: '4px',
              }}>Crear</button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}