export default function StatCard({ label, value, sublabel, wide }) {
  return (
    <div className={`card p-0 flex flex-col overflow-hidden ${wide ? 'col-span-2' : ''}`}>
      <div className="rule-heavy" />
      <div className="p-5 flex flex-col gap-1 flex-1">
        <span className="section-label">{label}</span>
        <div className="text-[2.8rem] leading-none font-800 tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
          {value}
        </div>
        {sublabel && (
          <span className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
