import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const { api } = useAuth()
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/projects/')
      const data = Array.isArray(res.data) ? res.data : res.data.results || []
      setProjects(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [api])

  const createProject = async (data) => {
    const res = await api.post('/projects/', data)
    const project = res.data
    setProjects(prev => [project, ...prev])
    return project
  }

  const updateProject = async (id, data) => {
    const res = await api.patch(`/projects/${id}/`, data)
    setProjects(prev => prev.map(p => p.id === id ? res.data : p))
    if (currentProject?.id === id) setCurrentProject(res.data)
    return res.data
  }

  const deleteProject = async (id) => {
    await api.delete(`/projects/${id}/`)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return (
    <ProjectContext.Provider value={{
      projects, currentProject, setCurrentProject, loading,
      fetchProjects, createProject, updateProject, deleteProject,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider')
  return ctx
}