import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectContext'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const { fetchProjects, createProject } = useProjects()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', language: 'python' })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const project = await createProject(navigate, newProject)
      setShowCreate(false)
      setNewProject({ name: '', language: 'python' })
      navigate(`/project/${project.id}`)
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al crear proyecto')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '1rem 2rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
          VocalCode
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
          <button onClick={logout} style={{
            padding: '0.5rem 1rem',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: '4px',
          }}>Salir</button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}