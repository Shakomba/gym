import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Dumbbell, LayoutDashboard, Users,
  Wrench, ClipboardList, LogOut, Activity
} from 'lucide-react'

const NAV = {
  admin: [
    { to: '/admin',             icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/members',     icon: Users,           label: 'Members' },
    { to: '/machines',          icon: Wrench,          label: 'Machines' },
    { to: '/admin/attendance',  icon: Activity,        label: 'Attendance' },
  ],
  trainer: [
    { to: '/trainer',           icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/trainer/members',   icon: Users,           label: 'Members' },
    { to: '/trainer/courses',   icon: ClipboardList,   label: 'Courses' },
    { to: '/machines',          icon: Wrench,          label: 'Machines' },
  ],
  member: [
    { to: '/member',            icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/member/courses',    icon: ClipboardList,   label: 'Courses' },
    { to: '/member/attendance', icon: Activity,        label: 'Attendance' },
  ],
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'member'
  const items = NAV[role] || NAV.member

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-56 flex flex-col z-50 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'var(--bg)', borderRight: '1px solid var(--b1)' }}>

        {/* Brand */}
        <div className="px-5 py-6" style={{ borderBottom: '1px solid var(--b1)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center"
              style={{ background: 'var(--t1)', color: 'var(--bg)' }}>
              <Dumbbell size={14} />
            </div>
            <div>
              <div className="text-sm font-800 tracking-wider uppercase leading-none"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
                Halabja
              </div>
              <div className="text-[9px] tracking-widest uppercase mt-0.5"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                Gym
              </div>
            </div>
          </div>
        </div>

        {/* Role tag */}
        <div className="px-5 py-3">
          <span className="text-[9px] tracking-widest uppercase px-2 py-1 border"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)', borderColor: 'var(--b1)' }}>
            {role}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto py-1">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to.split('/').length <= 2}
              className="block w-full"
              onClick={onClose}>
              {({ isActive }) => (
                <div className="flex items-center gap-3 px-3 py-2.5 mb-0.5 transition-all cursor-pointer"
                  style={{
                    background: isActive ? 'var(--t1)' : 'transparent',
                    color: isActive ? 'var(--bg)' : 'var(--t3)',
                    borderLeft: isActive ? '2px solid var(--t1)' : '2px solid transparent',
                  }}>
                  <Icon size={15} />
                  <span className="text-xs font-700 uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--b1)' }}>
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <div className="w-6 h-6 flex items-center justify-center text-[10px] font-800 shrink-0"
              style={{ background: 'var(--s3)', color: 'var(--t1)', fontFamily: 'var(--font-display)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-600 truncate" style={{ color: 'var(--t1)' }}>{user?.name}</div>
              <div className="text-[10px] truncate" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider cursor-pointer transition-colors"
            style={{ color: 'var(--t3)', fontFamily: 'var(--font-display)', border: '1px solid var(--b1)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--t1)'; e.currentTarget.style.color = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)' }}>
            <LogOut size={12} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
