const STYLES = {
  Pending:  'text-[#999] border border-dashed border-[#505050]',
  Active:   'text-[#f0f0f0] border border-[#6a6a6a] bg-white/5',
  Inactive: 'text-[#5a5a5a] border border-[#383838]',
  Rejected: 'text-[#5a5a5a] border border-[#383838] line-through',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] tracking-widest uppercase font-mono ${STYLES[status] || STYLES.Inactive}`}
      style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.14em' }}>
      {status}
    </span>
  )
}
