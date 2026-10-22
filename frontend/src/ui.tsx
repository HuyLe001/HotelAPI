import { ReactNode, useEffect } from 'react'

export type IconName =
  | 'grid' | 'calendar' | 'bed' | 'layers' | 'users' | 'plus' | 'search' | 'bell' | 'chevron' | 'arrow' | 'more'
  | 'eye' | 'edit' | 'check' | 'x' | 'logout' | 'filter' | 'home' | 'mail' | 'phone' | 'wifi' | 'snow' | 'tv' | 'bath'
  | 'menu' | 'close' | 'settings' | 'chart' | 'clock' | 'star' | 'pin' | 'download' | 'trash' | 'lock' | 'info'
  | 'user' | 'coffee' | 'ruler' | 'sparkle' | 'back' | 'alert' | 'heart' | 'help' | 'chevron-left' | 'chevron-down'

const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  bed: <><path d="M3 19v-8h18v8M3 15h18M6 11V7h5a3 3 0 0 1 3 3v1M3 19v2M21 19v2"/><path d="M6 11V8h2a2 2 0 0 1 2 2v1"/></>,
  layers: <><path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  'chevron-left': <path d="m15 18-6-6 6-6"/>,
  'chevron-down': <path d="m6 9 6 6 6-6"/>,
  arrow: <path d="m19 12-7-7M19 12l-7 7M19 12H5"/>,
  back: <path d="m5 12 7-7M5 12l7 7M5 12h14"/>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  x: <path d="m6 6 12 12M18 6 6 18"/>,
  logout: <path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>,
  filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"/>,
  wifi: <><path d="M5 12.55a11 11 0 0 1 14 0M8.5 16a6 6 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0"/><circle cx="12" cy="20" r="1"/></>,
  snow: <path d="M12 2v20M4.9 6l14.2 12M19.1 6 4.9 18M8 4l4 2 4-2M8 20l4-2 4 2"/>,
  tv: <><rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 2 4 4 4-4M8 22h8"/></>,
  bath: <><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2ZM7 12V5a2 2 0 0 1 4 0"/><path d="M7 19v2M17 19v2"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  close: <path d="M18 6 6 18M6 6l12 12"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  download: <path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>,
  trash: <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  coffee: <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM17 10h2a2 2 0 0 1 0 4h-2M7 2v3M11 2v3M15 2v3"/>,
  ruler: <path d="m3 17 14-14 4 4L7 21l-4-4Zm5-5 2 2m1-5 2 2m-7 1 2 2"/>,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>,
  alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 10v5M12 18h.01"/></>,
  heart: <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z"/>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></>,
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function Button({ children, variant = 'primary', icon, onClick, type = 'button', className = '', disabled, title }: { children?: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'gold'; icon?: IconName; onClick?: () => void; type?: 'button' | 'submit'; className?: string; disabled?: boolean; title?: string }) {
  return <button type={type} title={title} aria-label={title} disabled={disabled} className={`btn btn-${variant} ${className}`} onClick={onClick}>{icon && <Icon name={icon} size={18} />}{children}</button>
}

export function Field({ label, error, icon, hint, ...props }: { label: string; error?: string; icon?: IconName; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="field"><span>{label}</span><div className={`input-wrap ${error ? 'invalid' : ''}`}>{icon && <Icon name={icon} size={18} />}<input {...props} /></div>{hint && !error && <em className="hint">{hint}</em>}{error && <small>{error}</small>}</label>
}

export function SelectField({ label, children, value, onChange }: { label: string; children: ReactNode; value?: string; onChange?: React.ChangeEventHandler<HTMLSelectElement> }) {
  return <label className="field"><span>{label}</span><div className="select-wrap"><select value={value} onChange={onChange} aria-label={label || 'Chọn'}>{children}</select><Icon name="chevron" size={16} /></div></label>
}

export function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className="field"><span>{label}</span><div className="input-wrap area"><textarea {...props} /></div></label>
}

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return <section className={`card ${className}`} {...rest}>{children}</section>
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    'Đã xác nhận': ['success', 'Đã xác nhận'], Available: ['success', 'Sẵn sàng'], 'Đang chờ': ['warning', 'Đang chờ'],
    'Đã hủy': ['danger', 'Đã hủy'], Maintenance: ['warning', 'Bảo trì'], 'Đã hoàn thành': ['neutral', 'Đã hoàn thành'],
  }
  const [cls, label] = map[status] || ['neutral', status]
  return <span className={`badge ${cls}`}><i />{label}</span>
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={`brand ${dark ? 'dark' : ''}`}><div className="brand-mark"><span /><span /><span /></div><div><b>Havenly</b><small>HOTEL MANAGEMENT</small></div></div>
}

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(-2).map(x => x[0]).join('')
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials}</span>
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>
}

export function Tabs<T extends string>({ items, value, onChange }: { items: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return <div className="tabs" role="tablist">{items.map(t => <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>{t.label}{t.count !== undefined && <span>{t.count}</span>}</button>)}</div>
}

export function EmptyState({ icon = 'search', title, text, action }: { icon?: IconName; title: string; text: string; action?: ReactNode }) {
  return <div className="empty"><span><Icon name={icon} size={26} /></span><h3>{title}</h3><p>{text}</p>{action}</div>
}

export function Modal({ title, eyebrow, onClose, children, footer, width = 560 }: { title: string; eyebrow?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return <div className="overlay centered" onMouseDown={onClose}><section className="card modal" role="dialog" aria-modal="true" aria-label={title} style={{ width: `min(${width}px,100%)` }} onMouseDown={e => e.stopPropagation()}>
    <div className="drawer-head"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div><Button variant="icon" icon="close" title="Đóng" onClick={onClose} /></div>
    <div className="modal-body">{children}</div>
    {footer && <div className="modal-actions">{footer}</div>}
  </section></div>
}

export function ConfirmDialog({ title, text, confirmLabel, danger, onConfirm, onClose }: { title: string; text: ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return <Modal title={title} onClose={onClose} width={440} footer={<><Button variant="secondary" onClick={onClose}>Quay lại</Button><Button className={danger ? 'btn-danger-solid' : ''} onClick={onConfirm}>{confirmLabel}</Button></>}>
    <div className={`confirm-icon ${danger ? 'danger' : ''}`}><Icon name={danger ? 'alert' : 'info'} size={24} /></div><p className="confirm-text">{text}</p>
  </Modal>
}
