import { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'

const ToastContext = createContext(null)

const TYPE_BORDER = { success: '#6a6a6a', error: '#505050', info: '#383838' }
const TYPE_LABEL  = { success: 'OK', error: 'ERR', info: 'INFO' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = id => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ zIndex: 10000 }}>
        {toasts.map(t => (
          <div key={t.id} className="animate-fade-in flex items-center gap-3 px-4 py-3 min-w-72"
            style={{ background: 'var(--s2)', border: `1px solid ${TYPE_BORDER[t.type]}`, fontFamily: 'var(--font-mono)' }}>
            <span className="text-[10px] font-700 tracking-widest uppercase"
              style={{ color: 'var(--t3)', minWidth: 28 }}>
              {TYPE_LABEL[t.type]}
            </span>
            <span className="flex-1 text-xs" style={{ color: 'var(--t1)' }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="cursor-pointer" style={{ color: 'var(--t3)' }}>
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
