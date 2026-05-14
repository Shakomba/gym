import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import { Menu, Dumbbell } from 'lucide-react'

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4"
        style={{ height: 52, background: 'var(--bg)', borderBottom: '1px solid var(--b1)' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
          style={{ color: 'var(--t2)', border: '1px solid var(--b1)' }}>
          <Menu size={16} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center"
            style={{ background: 'var(--t1)', color: 'var(--bg)' }}>
            <Dumbbell size={12} />
          </div>
          <span className="text-sm font-800 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            Halabja Gym
          </span>
        </div>
      </div>

      <main className="flex-1 md:ml-56 min-w-0">
        {/* Spacer for mobile top bar */}
        <div className="h-[52px] md:hidden" />
        <div className="p-4 md:p-8 max-w-7xl animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
