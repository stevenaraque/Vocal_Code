import { createContext, useContext, useState, useCallback } from 'react'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchProjects = useCallback(async (api) => {
    setLoading(true)
    try {
      const res = await api.get('/projects/')
      setProjects(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = async (api, data) => {
    const res = await api.post('/projects/', data)
    setProjects(prev => [res.data, ...prev])
    return res.data
  }

  const updateProject = async (api, id, data) => {
    const res = await api.patch(`/projects/${id}/`, data)
    setProjects(prev => prev.map(p => p.id === id ? res.data : p))
    if (currentProject?.id === id) setCurrentProject(res.data)
    return res.data
  }

  const deleteProject = async (api, id) => {
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