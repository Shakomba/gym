import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${sizes[size]} animate-fade-in`}
        style={{ background: 'var(--s1)', border: '2px solid var(--b2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--b1)' }}>
          <h2 className="text-base font-700 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>
            {title}
          </h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: 'var(--t3)', border: '1px solid var(--b1)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--b3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
