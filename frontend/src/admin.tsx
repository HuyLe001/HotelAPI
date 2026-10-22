import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Avatar, Badge, Brand, Button, Card, ConfirmDialog, EmptyState, Field, Icon, IconName, Modal, SelectField, Tabs, TextArea, Toggle } from './ui'
import {
  Booking, BookingStatus, Customer, NavParams, Room, Store, TODAY, View, addDays, availableRooms, fmtDate, fmtTime, monthLabels,
  nightsBetween, overlaps, revenueByMonth, shortWeekday, totalOf, typeCount, typeOf, vnd, weekday,
} from './data'

export interface Ctx { store: Store; go: (v: View, p?: NavParams) => void; notify: (s: string) => void }

const fmtM = (n: number) => (n / 1e6).toFixed(1).replace('.', ',') + ' tr ₫'
const CODE_RE = /^\s*$/

/* ───────── Shell ───────── */

const NAV: { label: string; items: [View, IconName, string][] }[] = [
  { label: 'VẬN HÀNH', items: [['dashboard', 'grid', 'Tổng quan'], ['bookings', 'calendar', 'Đặt phòng'], ['calendar', 'clock', 'Lịch phòng']] },
  { label: 'DANH MỤC', items: [['rooms', 'bed', 'Phòng'], ['room-types', 'layers', 'Loại phòng'], ['customers', 'users', 'Khách hàng']] },
  { label: 'HỆ THỐNG', items: [['reports', 'chart', 'Báo cáo'], ['settings', 'settings', 'Cài đặt']] },
]

export function Sidebar({ view, go, open, close, pending }: { view: View; go: (v: View) => void; open: boolean; close: () => void; pending: number }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="side-head"><Brand /><Button variant="icon" icon="close" title="Đóng menu" onClick={close} className="mobile-close" /></div>
    <div className="side-scroll">{NAV.map(g => <div key={g.label}><div className="nav-label">{g.label}</div><nav>{g.items.map(([id, icon, label]) =>
      <button key={id} className={view === id || (id === 'bookings' && view === 'create-booking') ? 'active' : ''} onClick={() => { go(id); close() }}>
        <Icon name={icon} /><span>{label}</span>{id === 'bookings' && pending > 0 && <em>{pending}</em>}</button>)}</nav></div>)}</div>
    <div className="side-footer">
      <div className="help-card"><span>?</span><b>Cần hỗ trợ?</b><small>Trung tâm trợ giúp Havenly</small><button onClick={() => { go('settings'); close() }}>Xem hướng dẫn</button></div>
      <div className="profile-mini"><Avatar name="An Nguyễn" /><div><b>An Nguyễn</b><small>Quản trị viên</small></div></div>
    </div>
  </aside>
}

export function Header({ title, subtitle, onMenu, onLogout, onSearch, notifications, onNotifications }: { title: string; subtitle: string; onMenu: () => void; onLogout: () => void; onSearch: () => void; notifications: number; onNotifications: () => void }) {
  return <header className="topbar">
    <div className="topbar-title"><Button variant="icon" icon="menu" title="Mở menu" onClick={onMenu} className="menu-button" /><div><h1>{title}</h1><p>{subtitle}</p></div></div>
    <button className="top-search" onClick={onSearch}><Icon name="search" size={17} /><span>Tìm booking, khách hàng, phòng…</span><kbd>Ctrl K</kbd></button>
    <div className="header-actions">
      <button className="round-button search-mobile" aria-label="Tìm kiếm" onClick={onSearch}><Icon name="search" /></button>
      <button className="round-button notify" aria-label="Thông báo" onClick={onNotifications}><Icon name="bell" />{notifications > 0 && <i />}</button>
      <div className="header-user"><Avatar name="An Nguyễn" /><div><b>An Nguyễn</b><small>Quản trị viên</small></div><button onClick={onLogout} title="Đăng xuất" aria-label="Đăng xuất"><Icon name="logout" size={18} /></button></div>
    </div>
  </header>
}

export function NotificationPanel({ store, go, close }: { store: Store; go: (v: View, p?: NavParams) => void; close: () => void }) {
  const pending = store.bookings.filter(b => b.status === 'Đang chờ').slice(0, 4)
  const [read, setRead] = useState(false)
  return <div className="popover-layer" onMouseDown={close}><div className="popover" onMouseDown={e => e.stopPropagation()}>
    <div className="popover-head"><h3>Thông báo</h3><button onClick={() => setRead(true)}>Đánh dấu đã đọc</button></div>
    <div className="popover-list">{pending.map(b => {
      const c = store.customers.find(x => x.id === b.customerId)!
      return <button key={b.id} className={read ? '' : 'unread'} onClick={() => { go('bookings', { bookingId: b.id }); close() }}>
        <span className="pop-icon gold"><Icon name="calendar" size={16} /></span>
        <div><b>Booking mới chờ xác nhận</b><small>{c.name} · P. {b.roomNo} · {fmtDate(b.in)}</small></div><time>{fmtTime(b.createdAt)}</time></button>
    })}
      <button className={read ? '' : 'unread'} onClick={() => { go('rooms'); close() }}><span className="pop-icon red"><Icon name="alert" size={16} /></span><div><b>3 phòng đang bảo trì</b><small>P. 203, 306, 708 chưa sẵn sàng đón khách</small></div><time>08:00</time></button>
      <button onClick={() => { go('reports'); close() }}><span className="pop-icon teal"><Icon name="chart" size={16} /></span><div><b>Báo cáo tuần đã sẵn sàng</b><small>Tỷ lệ lấp đầy tăng 6,4% so với tuần trước</small></div><time>Hôm qua</time></button>
    </div>
  </div></div>
}

/* ───────── Command palette ───────── */

export function SearchPalette({ store, go, close }: { store: Store; go: (v: View, p?: NavParams) => void; close: () => void }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])
  const items = useMemo(() => {
    const k = q.trim().toLowerCase()
    const pages: { key: string; icon: IconName; title: string; sub: string; run: () => void }[] = ([['dashboard', 'Tổng quan', 'grid'], ['bookings', 'Quản lý booking', 'calendar'], ['create-booking', 'Tạo booking mới', 'plus'], ['calendar', 'Lịch phòng', 'clock'], ['rooms', 'Quản lý phòng', 'bed'], ['room-types', 'Loại phòng', 'layers'], ['customers', 'Khách hàng', 'users'], ['reports', 'Báo cáo', 'chart'], ['settings', 'Cài đặt', 'settings']] as [View, string, IconName][])
      .map(([v, t, i]) => ({ key: 'p' + v, icon: i, title: t, sub: 'Trang', run: () => go(v) }))
    const bks = store.bookings.map(b => { const c = store.customers.find(x => x.id === b.customerId)!; return { key: 'b' + b.id, icon: 'calendar' as IconName, title: `${b.id} · ${c.name}`, sub: `P. ${b.roomNo} · ${fmtDate(b.in)} – ${fmtDate(b.out)} · ${b.status}`, run: () => go('bookings', { bookingId: b.id }) } })
    const cus = store.customers.map(c => ({ key: 'c' + c.id, icon: 'user' as IconName, title: c.name, sub: `${c.email} · ${c.phone}`, run: () => go('customers', { customerId: c.id }) }))
    const rms = store.rooms.map(r => ({ key: 'r' + r.no, icon: 'bed' as IconName, title: `Phòng ${r.no}`, sub: `${store.types.find(t => t.id === r.type)?.name} · Tầng ${r.floor}`, run: () => go('rooms') }))
    if (!k) return pages.slice(0, 6)
    return [...pages, ...bks, ...cus, ...rms].filter(i => (i.title + ' ' + i.sub).toLowerCase().includes(k)).slice(0, 9)
  }, [q, store, go])
  const choose = (i: number) => { items[i]?.run(); close() }
  return <div className="overlay palette-layer" onMouseDown={close}><div className="palette" role="dialog" aria-label="Tìm kiếm nhanh" onMouseDown={e => e.stopPropagation()}>
    <div className="palette-input"><Icon name="search" /><input ref={ref} value={q} placeholder="Tìm booking, khách hàng, phòng hoặc trang…" onChange={e => { setQ(e.target.value); setIdx(0) }}
      onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, items.length - 1)) } else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) } else if (e.key === 'Enter') choose(idx); else if (e.key === 'Escape') close() }} /><kbd>Esc</kbd></div>
    <div className="palette-list">{items.length === 0 ? <div className="palette-empty">Không tìm thấy kết quả cho “{q}”.</div> :
      items.map((it, i) => <button key={it.key} className={i === idx ? 'active' : ''} onMouseEnter={() => setIdx(i)} onClick={() => choose(i)}><span><Icon name={it.icon} size={17} /></span><div><b>{it.title}</b><small>{it.sub}</small></div><Icon name="arrow" size={15} /></button>)}</div>
    <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> di chuyển</span><span><kbd>↵</kbd> mở</span></div>
  </div></div>
}

/* ───────── Charts ───────── */

export function BarChart({ data, labels, highlight, format = (n: number) => `${n} tr ₫` }: { data: number[]; labels: string[]; highlight?: number; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.ceil(Math.max(...data) / 30) * 30
  const ticks = [1, 0.75, 0.5, 0.25, 0].map(f => Math.round(max * f))
  return <div className="bars">
    <div className="bars-y">{ticks.map(t => <span key={t}>{t}</span>)}</div>
    <div className="bars-plot">{ticks.map((t, i) => <i key={i} style={{ top: `${i * 25}%` }} />)}
      <div className="bars-cols">{data.map((v, i) => <div key={i} className={`bar-col ${hover === i ? 'hover' : ''} ${highlight === i ? 'current' : ''}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${labels[i]}: ${format(v)}`}>
        {hover === i && <div className="bar-tip"><b>{format(v)}</b><small>{labels[i]}</small></div>}
        <div className="bar" style={{ height: `${(v / max) * 100}%` }} /></div>)}</div>
    </div>
    <div className="bars-x">{labels.map(l => <span key={l}>{l}</span>)}</div>
  </div>
}

/* ───────── Booking table & drawer ───────── */

function CustomerCell({ c }: { c: Customer }) { return <div className="customer-cell"><Avatar name={c.name} size={30} /><div><b>{c.name}</b></div></div> }

export function BookingTable({ ctx, data, compact = false, onOpen }: { ctx: Ctx; data: Booking[]; compact?: boolean; onOpen: (b: Booking) => void }) {
  const { store, notify } = ctx
  return <div className="table-scroll"><table><thead><tr><th>MÃ BOOKING</th><th>KHÁCH HÀNG</th><th>PHÒNG</th>{!compact && <><th>NHẬN / TRẢ</th><th>ĐÊM</th></>}<th>TỔNG TIỀN</th><th>TRẠNG THÁI</th><th /></tr></thead>
    <tbody>{data.map(b => {
      const c = store.customers.find(x => x.id === b.customerId)!
      return <tr key={b.id} className="clickable" onClick={() => onOpen(b)}>
        <td><b className="booking-code">{b.id}</b></td><td><CustomerCell c={c} /></td>
        <td>P. {b.roomNo} <span className="muted">· {typeOf(store, b.roomNo).name}</span></td>
        {!compact && <><td><b className="date-main">{fmtDate(b.in)}</b><small className="date-sub">đến {fmtDate(b.out)}</small></td><td>{nightsBetween(b.in, b.out)}</td></>}
        <td><b>{vnd(totalOf(store, b))}</b></td><td><Badge status={b.status} /></td>
        <td onClick={e => e.stopPropagation()}><div className="row-actions">{b.status === 'Đang chờ' && <Button variant="icon" icon="check" title="Xác nhận booking" onClick={() => { store.updateBooking(b.id, { status: 'Đã xác nhận' }); notify(`Đã xác nhận ${b.id}`) }} />}<Button variant="icon" icon="eye" title="Xem chi tiết" onClick={() => onOpen(b)} /></div></td>
      </tr>
    })}</tbody></table></div>
}

export function Pagination({ page, setPage, total, size, unit }: { page: number; setPage: (n: number) => void; total: number; size: number; unit: string }) {
  const pages = Math.max(1, Math.ceil(total / size))
  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(total, page * size)
  return <div className="pagination"><span>Hiển thị {from}–{to} trong {total} {unit}</span><div>
    <button aria-label="Trang trước" disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon name="chevron-left" size={14} /></button>
    {Array.from({ length: pages }, (_, i) => i + 1).map(n => <button key={n} className={n === page ? 'current' : ''} onClick={() => setPage(n)}>{n}</button>)}
    <button aria-label="Trang sau" disabled={page >= pages} onClick={() => setPage(page + 1)}><Icon name="chevron" size={14} /></button></div></div>
}

export function ChangeDatesModal({ store, booking, onSave, onClose }: { store: Store; booking: Booking; onSave: (i: string, o: string) => void; onClose: () => void }) {
  const [i, setI] = useState(booking.in)
  const [o, setO] = useState(booking.out)
  const type = typeOf(store, booking.roomNo)
  const n = nightsBetween(i, o)
  const free = availableRooms(store, i, o, undefined, booking.id).some(r => r.no === booking.roomNo)
  const error = !i || !o ? 'Vui lòng chọn đủ ngày.' : o <= i ? 'Ngày trả phòng phải sau ngày nhận phòng.' : i < TODAY ? 'Ngày nhận phòng không được ở quá khứ.' : !free ? `Phòng ${booking.roomNo} đã có booking khác trong khoảng ngày này.` : ''
  return <Modal title="Đổi ngày lưu trú" eyebrow={booking.id} onClose={onClose} width={500}
    footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button disabled={!!error} onClick={() => onSave(i, o)}>Lưu thay đổi</Button></>}>
    <div className="form-grid"><Field label="Ngày nhận phòng" type="date" value={i} min={TODAY} onChange={e => setI(e.target.value)} hint={i && fmtDate(i)} /><Field label="Ngày trả phòng" type="date" value={o} min={i} onChange={e => setO(e.target.value)} hint={o && fmtDate(o)} /></div>
    {error ? <div className="info-note danger"><Icon name="alert" size={16} />{error}</div> : <div className="info-note ok"><Icon name="check" size={16} />Phòng còn trống. {n} đêm × {vnd(type.price)} = <b>{vnd(n * type.price)}</b></div>}
  </Modal>
}

export function BookingDrawer({ ctx, bookingId, close }: { ctx: Ctx; bookingId: string; close: () => void }) {
  const { store, notify } = ctx
  const b = store.bookings.find(x => x.id === bookingId)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [editDates, setEditDates] = useState(false)
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && close(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [close])
  if (!b) return null
  const c = store.customers.find(x => x.id === b.customerId)!
  const t = typeOf(store, b.roomNo)
  const n = nightsBetween(b.in, b.out)
  const open = b.status === 'Đang chờ'
  const live = open || b.status === 'Đã xác nhận'
  return <div className="overlay" onMouseDown={close}><aside className="drawer" role="dialog" aria-label={`Chi tiết ${b.id}`} onMouseDown={e => e.stopPropagation()}>
    <div className="drawer-head"><div><span className="eyebrow">CHI TIẾT BOOKING</span><h2>{b.id}</h2></div><Button variant="icon" icon="close" title="Đóng" onClick={close} /></div>
    <div className="drawer-status"><Badge status={b.status} /><small>Tạo lúc {fmtTime(b.createdAt)} · {fmtDate(b.createdAt)}</small></div>
    <div className="drawer-room"><img src={t.image} alt={`Phòng ${t.name}`} /><div><b>P. {b.roomNo} · {t.name}</b><small>{t.bed} · {t.size} m² · {b.guests} khách</small></div></div>
    <div className="drawer-section"><h3>Thông tin lưu trú</h3>
      <div className="stay-dates"><div><span>NHẬN PHÒNG</span><b>{fmtDate(b.in)}</b><small>{weekday(b.in)}, 14:00</small></div><i><Icon name="arrow" size={17} /></i><div><span>TRẢ PHÒNG</span><b>{fmtDate(b.out)}</b><small>{weekday(b.out)}, 12:00</small></div></div>
      <div className="detail-row"><span>Số đêm</span><b>{n} đêm</b></div>{b.note && <div className="note-box"><Icon name="info" size={15} />{b.note}</div>}</div>
    <div className="drawer-section"><h3>Khách hàng</h3><div className="profile-line"><Avatar name={c.name} size={40} /><div><b>{c.name}</b><span><Icon name="mail" size={14} /> {c.email}</span><span><Icon name="phone" size={14} /> {c.phone}</span></div></div></div>
    <div className="drawer-section"><h3>Thanh toán dự kiến</h3><div className="detail-row"><span>{vnd(t.price)} × {n} đêm</span><b>{vnd(totalOf(store, b))}</b></div><div className="summary-total"><span>Tổng tiền</span><strong>{vnd(totalOf(store, b))}</strong><small>Thanh toán trực tiếp tại quầy khi nhận phòng</small></div></div>
    <div className="drawer-section"><h3>Lịch sử</h3><ol className="timeline"><li className="done"><b>Booking được tạo</b><small>{fmtDate(b.createdAt)} · {fmtTime(b.createdAt)}</small></li>
      <li className={b.status === 'Đã xác nhận' || b.status === 'Đã hoàn thành' ? 'done' : b.status === 'Đã hủy' ? 'cancel' : ''}><b>{b.status === 'Đã hủy' ? 'Đã hủy' : 'Khách sạn xác nhận'}</b><small>{open ? 'Đang chờ xử lý' : 'Hoàn tất'}</small></li>
      <li className={b.status === 'Đã hoàn thành' ? 'done' : ''}><b>Lưu trú</b><small>{fmtDate(b.in)} – {fmtDate(b.out)}</small></li></ol></div>
    {live && <div className="drawer-actions">
      {open && <Button variant="secondary" icon="edit" onClick={() => setEditDates(true)}>Sửa ngày</Button>}
      <Button variant="danger" onClick={() => setConfirmCancel(true)}>Hủy</Button>
      {open && <Button icon="check" onClick={() => { store.updateBooking(b.id, { status: 'Đã xác nhận' }); notify(`Đã xác nhận booking ${b.id}`) }}>Xác nhận</Button>}
    </div>}
    {confirmCancel && <ConfirmDialog danger title="Hủy booking này?" confirmLabel="Hủy booking" text={<>Booking <b>{b.id}</b> của {c.name} sẽ bị hủy và phòng {b.roomNo} được mở lại cho khách khác. Hành động này không thể hoàn tác.</>} onClose={() => setConfirmCancel(false)} onConfirm={() => { store.updateBooking(b.id, { status: 'Đã hủy' }); setConfirmCancel(false); notify(`Đã hủy booking ${b.id}`) }} />}
    {editDates && <ChangeDatesModal store={store} booking={b} onClose={() => setEditDates(false)} onSave={(i, o) => { store.updateBooking(b.id, { in: i, out: o }); setEditDates(false); notify('Đã cập nhật ngày lưu trú') }} />}
  </aside></div>
}

/* ───────── Dashboard ───────── */

function Kpi({ icon, label, value, trend, tone, sub }: { icon: IconName; label: string; value: string; trend: string; tone: string; sub: string }) {
  return <Card className="kpi"><div className={`kpi-icon ${tone}`}><Icon name={icon} /></div><div className="kpi-main"><span>{label}</span><strong>{value}</strong><small><b>↗ {trend}</b> {sub}</small></div></Card>
}

export function Dashboard({ ctx, open }: { ctx: Ctx; open: (id: string) => void }) {
  const { store, go, notify } = ctx
  const live = store.bookings.filter(b => b.status === 'Đã xác nhận' || b.status === 'Đã hoàn thành')
  const revenue = live.reduce((s, b) => s + totalOf(store, b), 0)
  const pending = store.bookings.filter(b => b.status === 'Đang chờ')
  const arrivals = store.bookings.filter(b => b.in === TODAY && b.status !== 'Đã hủy')
  const departures = store.bookings.filter(b => b.out === TODAY && b.status !== 'Đã hủy')
  const inHouse = store.bookings.filter(b => b.in <= TODAY && b.out > TODAY && b.status === 'Đã xác nhận')
  const sellable = store.rooms.filter(r => r.status === 'Available').length
  const occ = Math.round((inHouse.length / Math.max(1, sellable)) * 100)
  const count = (s: BookingStatus) => store.bookings.filter(b => b.status === s).length
  const total = store.bookings.length
  const cOK = (count('Đã xác nhận') + count('Đã hoàn thành')) / total * 100, cWait = count('Đang chờ') / total * 100
  const topRooms = Object.entries(store.bookings.filter(b => b.status !== 'Đã hủy').reduce<Record<string, number>>((m, b) => (m[b.roomNo] = (m[b.roomNo] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const rev = [...revenueByMonth]; rev[5] = Math.round(revenue / 1e6 * 10) / 10 + 60
  return <>
    <div className="page-heading"><div><div><h2>Chào buổi sáng, An!</h2><p>{weekday(TODAY)}, {fmtDate(TODAY)} · Đây là tình hình khách sạn hôm nay.</p></div></div><Button icon="plus" onClick={() => go('create-booking')}>Tạo booking</Button></div>
    <div className="kpi-grid">
      <Kpi icon="bed" label="Tổng số phòng" value={String(store.rooms.length)} trend={`${sellable} sẵn sàng`} tone="blue" sub="đang kinh doanh" />
      <Kpi icon="users" label="Khách hàng" value={String(store.customers.length)} trend="8,1%" tone="teal" sub="so với tháng trước" />
      <Kpi icon="calendar" label="Booking" value={String(total)} trend="12,5%" tone="gold" sub="so với tháng trước" />
      <Kpi icon="chart" label="Doanh thu" value={fmtM(revenue)} trend="10,4%" tone="purple" sub="so với tháng trước" />
    </div>
    <div className="today-grid">
      <Card className="today-card"><div className="card-header"><div><h2>Hôm nay</h2><p>{fmtDate(TODAY)}</p></div><div className="occ"><b>{occ}%</b><small>lấp đầy</small></div></div>
        <div className="today-stats"><div><b>{arrivals.length}</b><span>Nhận phòng</span></div><div><b>{departures.length}</b><span>Trả phòng</span></div><div><b>{inHouse.length}</b><span>Đang ở</span></div></div>
        <div className="today-list">{[...arrivals.map(b => [b, 'Nhận phòng'] as const), ...departures.map(b => [b, 'Trả phòng'] as const)].map(([b, kind]) => { const c = store.customers.find(x => x.id === b.customerId)!
          return <button key={b.id + kind} onClick={() => open(b.id)}><Avatar name={c.name} size={32} /><div><b>{c.name}</b><small>P. {b.roomNo} · {kind}</small></div><span className={`pill ${kind === 'Nhận phòng' ? 'in' : 'out'}`}>{kind === 'Nhận phòng' ? '14:00' : '12:00'}</span></button> })}</div></Card>
      <Card className="chart-card"><div className="card-header"><div><h2>Doanh thu 2025</h2><p>Triệu đồng, từ booking đã xác nhận</p></div><span className="chip">Năm 2025</span></div><BarChart data={rev} labels={monthLabels} highlight={5} /></Card>
    </div>
    <div className="bottom-grid">
      <Card className="queue-card"><div className="card-header"><div><h2>Cần xử lý</h2><p>{pending.length} booking đang chờ xác nhận</p></div><button className="text-button" onClick={() => go('bookings')}>Xem tất cả <Icon name="arrow" size={16} /></button></div>
        {pending.length === 0 ? <EmptyState icon="check" title="Đã xử lý hết" text="Không còn booking nào đang chờ xác nhận." /> :
          <div className="queue">{pending.slice(0, 4).map(b => { const c = store.customers.find(x => x.id === b.customerId)!
            return <div key={b.id} className="queue-item"><Avatar name={c.name} size={38} /><button className="queue-main" onClick={() => open(b.id)}><b>{c.name}</b><small>{b.id} · P. {b.roomNo} · {fmtDate(b.in)} – {fmtDate(b.out)}</small></button><strong>{vnd(totalOf(store, b))}</strong>
              <div className="row-actions"><Button variant="secondary" onClick={() => { store.updateBooking(b.id, { status: 'Đã hủy' }); notify(`Đã từ chối ${b.id}`) }}>Từ chối</Button><Button icon="check" onClick={() => { store.updateBooking(b.id, { status: 'Đã xác nhận' }); notify(`Đã xác nhận ${b.id}`) }}>Xác nhận</Button></div></div> })}</div>}</Card>
      <div className="side-stack">
        <Card className="status-card"><div className="card-header"><div><h2>Trạng thái booking</h2><p>Tất cả booking</p></div></div>
          <div className="donut-row"><div className="donut" style={{ background: `conic-gradient(var(--teal) 0 ${cOK}%,var(--gold) ${cOK}% ${cOK + cWait}%,#e06a64 ${cOK + cWait}%)` }}><div><strong>{total}</strong><span>Booking</span></div></div>
            <div className="legend"><span><i className="dot teal" />Xác nhận / hoàn thành <b>{count('Đã xác nhận') + count('Đã hoàn thành')}</b></span><span><i className="dot gold" />Đang chờ <b>{count('Đang chờ')}</b></span><span><i className="dot red" />Đã hủy <b>{count('Đã hủy')}</b></span></div></div></Card>
        <Card className="top-rooms"><div className="card-header"><div><h2>Phòng được đặt nhiều</h2><p>Theo số lượt booking</p></div></div>
          {topRooms.map(([no, n], i) => <div className="room-rank" key={no}><span>{i + 1}</span><div><b>P. {no}</b><small>{typeOf(store, no).name}</small></div><div className="rank-progress"><i style={{ width: `${(n / topRooms[0][1]) * 100}%` }} /></div><em>{n} lượt</em></div>)}</Card>
      </div>
    </div>
  </>
}

/* ───────── Bookings ───────── */

export function Toolbar({ search, onSearch, placeholder, children }: { search: string; onSearch: (s: string) => void; placeholder: string; children?: ReactNode }) {
  return <div className="toolbar"><div className="search-box"><Icon name="search" size={18} /><input value={search} onChange={e => onSearch(e.target.value)} placeholder={placeholder} aria-label={placeholder} />{search && <button className="clear" aria-label="Xóa tìm kiếm" onClick={() => onSearch('')}><Icon name="x" size={14} /></button>}</div>{children}</div>
}

export function BookingsPage({ ctx, open }: { ctx: Ctx; open: (id: string) => void }) {
  const { store, go, notify } = ctx
  const [tab, setTab] = useState<'all' | BookingStatus>('all')
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const size = 8
  const rows = useMemo(() => store.bookings.filter(b => (tab === 'all' || b.status === tab) && (type === 'all' || typeOf(store, b.roomNo).id === type) && (() => {
    const k = q.trim().toLowerCase(); if (!k) return true
    const c = store.customers.find(x => x.id === b.customerId)!
    return (b.id + c.name + c.phone + b.roomNo).toLowerCase().includes(k)
  })()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [store, tab, q, type])
  useEffect(() => setPage(1), [tab, q, type])
  const cnt = (s: BookingStatus) => store.bookings.filter(b => b.status === s).length
  const exportCsv = () => { downloadCsv('bookings.csv', [['Mã', 'Khách hàng', 'Phòng', 'Nhận phòng', 'Trả phòng', 'Số đêm', 'Tổng tiền', 'Trạng thái'], ...rows.map(b => [b.id, store.customers.find(c => c.id === b.customerId)!.name, b.roomNo, fmtDate(b.in), fmtDate(b.out), String(nightsBetween(b.in, b.out)), String(totalOf(store, b)), b.status])]); notify(`Đã xuất ${rows.length} booking ra CSV`) }
  return <>
    <div className="page-heading"><div><div><h2>Quản lý booking</h2><p>Theo dõi và xử lý tất cả booking tại khách sạn.</p></div></div><div className="heading-actions"><Button variant="secondary" icon="download" onClick={exportCsv}>Xuất CSV</Button><Button icon="plus" onClick={() => go('create-booking')}>Tạo booking</Button></div></div>
    <Card>
      <div className="tabs-bar"><Tabs value={tab} onChange={setTab} items={[{ id: 'all', label: 'Tất cả', count: store.bookings.length }, { id: 'Đang chờ', label: 'Đang chờ', count: cnt('Đang chờ') }, { id: 'Đã xác nhận', label: 'Đã xác nhận', count: cnt('Đã xác nhận') }, { id: 'Đã hoàn thành', label: 'Hoàn thành', count: cnt('Đã hoàn thành') }, { id: 'Đã hủy', label: 'Đã hủy', count: cnt('Đã hủy') }]} /></div>
      <Toolbar search={q} onSearch={setQ} placeholder="Tìm theo mã, khách hàng, số phòng…"><SelectField label="Loại phòng" value={type} onChange={e => setType(e.target.value)}><option value="all">Tất cả loại phòng</option>{store.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</SelectField></Toolbar>
      {rows.length === 0 ? <EmptyState title="Không tìm thấy booking" text="Thử đổi từ khóa hoặc bộ lọc trạng thái." action={<Button variant="secondary" onClick={() => { setQ(''); setTab('all'); setType('all') }}>Xóa bộ lọc</Button>} /> :
        <><BookingTable ctx={ctx} data={rows.slice((page - 1) * size, page * size)} onOpen={b => open(b.id)} /><Pagination page={page} setPage={setPage} total={rows.length} size={size} unit="booking" /></>}
    </Card>
  </>
}

export function downloadCsv(name: string, rows: string[][]) {
  const csv = '﻿' + rows.map(r => r.map(x => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = name; a.click(); URL.revokeObjectURL(a.href)
}

/* ───────── Create booking ───────── */

export function CreateBooking({ ctx, preset }: { ctx: Ctx; preset?: NavParams }) {
  const { store, go, notify } = ctx
  const [step, setStep] = useState(1)
  const [customerId, setCustomerId] = useState(preset?.customerId ?? store.customers[0].id)
  const [typeId, setTypeId] = useState('all')
  const [i, setI] = useState(preset?.in ?? '2025-06-26')
  const [o, setO] = useState(preset?.out ?? '2025-06-29')
  const [guests, setGuests] = useState(2)
  const [roomNo, setRoomNo] = useState('')
  const [note, setNote] = useState('')
  const [newCust, setNewCust] = useState(false)
  const [nc, setNc] = useState({ name: '', email: '', phone: '' })
  const [tried, setTried] = useState(false)
  const nights = nightsBetween(i, o)
  const dateErr = !i || !o ? 'Vui lòng chọn ngày.' : o <= i ? 'Ngày trả phòng phải sau ngày nhận phòng.' : i < TODAY ? 'Ngày nhận phòng không được ở quá khứ.' : ''
  const avail = useMemo(() => dateErr ? [] : availableRooms(store, i, o, typeId).filter(r => (store.types.find(t => t.id === r.type)?.capacity ?? 2) >= guests), [store, i, o, typeId, dateErr, guests])
  const room = store.rooms.find(r => r.no === roomNo)
  const rType = room && store.types.find(t => t.id === room.type)
  const customer = store.customers.find(c => c.id === customerId)
  const custErr = newCust && tried && (!nc.name.trim() || !/^\S+@\S+\.\S+$/.test(nc.email) || nc.phone.replace(/\D/g, '').length < 9)
  const next = () => {
    setTried(true)
    if (step === 1) { if (dateErr || custErr || (newCust && (!nc.name.trim() || !/^\S+@\S+\.\S+$/.test(nc.email) || nc.phone.replace(/\D/g, '').length < 9))) return; setTried(false); setRoomNo(''); return setStep(2) }
    if (step === 2) { if (!roomNo) return; return setStep(3) }
    let cid = customerId
    if (newCust) cid = store.addCustomer(nc).id
    const bk = store.addBooking({ customerId: cid, roomNo, in: i, out: o, status: 'Đã xác nhận', guests, note: note || undefined })
    notify(`Đã tạo booking ${bk.id} cho khách hàng`); go('bookings', { bookingId: bk.id })
  }
  const steps = ['Thông tin lưu trú', 'Chọn phòng', 'Xác nhận']
  return <>
    <div className="page-heading"><div><button className="back" aria-label="Quay lại" onClick={() => go('bookings')}><Icon name="back" size={18} /></button><div><h2>Tạo booking mới</h2><p>Tạo booking giúp khách hàng tại quầy.</p></div></div></div>
    <div className="steps">{steps.map((s, k) => <div key={s} className={`${step >= k + 1 ? 'active' : ''} ${step > k + 1 ? 'done' : ''}`}>{k > 0 && <i />}<span>{step > k + 1 ? <Icon name="check" size={14} /> : k + 1}</span><b>{s}</b></div>)}</div>
    <div className="create-layout"><div className="form-stack">
      {step === 1 && <Card><div className="section-title"><span><Icon name="users" /></span><div><h3>Khách hàng & thời gian</h3><p>Chọn khách hàng và ngày lưu trú.</p></div></div>
        <div className="seg"><button className={!newCust ? 'on' : ''} onClick={() => setNewCust(false)}>Khách hiện có</button><button className={newCust ? 'on' : ''} onClick={() => setNewCust(true)}>Khách mới</button></div>
        {!newCust ? <div className="form-grid one"><SelectField label="Khách hàng" value={customerId} onChange={e => setCustomerId(e.target.value)}>{store.customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</SelectField></div> :
          <div className="form-grid"><Field label="Họ và tên" placeholder="Nguyễn Văn A" value={nc.name} onChange={e => setNc({ ...nc, name: e.target.value })} error={tried && !nc.name.trim() ? 'Vui lòng nhập họ tên.' : ''} /><Field label="Số điện thoại" placeholder="090 000 0000" value={nc.phone} onChange={e => setNc({ ...nc, phone: e.target.value })} error={tried && nc.phone.replace(/\D/g, '').length < 9 ? 'Số điện thoại chưa hợp lệ.' : ''} /><div className="span-2"><Field label="Email" type="email" placeholder="khach@email.com" value={nc.email} onChange={e => setNc({ ...nc, email: e.target.value })} error={tried && !/^\S+@\S+\.\S+$/.test(nc.email) ? 'Email chưa hợp lệ.' : ''} /></div></div>}
        <div className="form-grid trio"><Field label="Ngày nhận phòng" type="date" min={TODAY} value={i} onChange={e => setI(e.target.value)} hint={i && fmtDate(i)} /><Field label="Ngày trả phòng" type="date" min={i} value={o} onChange={e => setO(e.target.value)} hint={o && fmtDate(o)} error={tried ? dateErr : ''} />
          <SelectField label="Số khách" value={String(guests)} onChange={e => setGuests(+e.target.value)}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} khách</option>)}</SelectField></div>
        <SelectField label="Loại phòng" value={typeId} onChange={e => setTypeId(e.target.value)}><option value="all">Tất cả loại phòng</option>{store.types.map(t => <option key={t.id} value={t.id}>{t.name} · {vnd(t.price)}</option>)}</SelectField>
        <div className="info-note">Hệ thống tự động kiểm tra lịch trống và chỉ hiển thị phòng không trùng booking khác.</div></Card>}
      {step === 2 && <Card><div className="section-title"><span><Icon name="bed" /></span><div><h3>Chọn phòng trống</h3><p>{avail.length} phòng phù hợp · {fmtDate(i)} – {fmtDate(o)} · {nights} đêm</p></div></div>
        {avail.length === 0 ? <EmptyState icon="calendar" title="Không còn phòng trống" text="Không có phòng nào phù hợp. Hãy thử đổi ngày hoặc loại phòng." action={<Button variant="secondary" onClick={() => setStep(1)}>Đổi tiêu chí</Button>} /> :
          <div className="room-options">{avail.map(r => { const t = store.types.find(x => x.id === r.type)!
            return <button key={r.no} className={roomNo === r.no ? 'selected' : ''} onClick={() => setRoomNo(r.no)} aria-pressed={roomNo === r.no}><div className="room-visual"><img src={t.image} alt="" loading="lazy" />{roomNo === r.no && <span className="tick"><Icon name="check" size={14} /></span>}</div>
              <div className="room-option-body"><div><b>P. {r.no}</b><span>{t.name} · Tầng {r.floor}</span></div><strong>{vnd(t.price)}<small> / đêm</small></strong><div className="amenities">{r.amenities.map(a => <span key={a}><Icon name={a} size={15} /></span>)}</div></div></button> })}</div>}
        {tried && !roomNo && avail.length > 0 && <p className="form-error">Vui lòng chọn một phòng để tiếp tục.</p>}</Card>}
      {step === 3 && <Card><div className="section-title"><span><Icon name="check" /></span><div><h3>Xác nhận booking</h3><p>Kiểm tra lại thông tin trước khi tạo.</p></div></div>
        <div className="review-grid"><div><span>Khách hàng</span><b>{newCust ? nc.name : customer?.name}</b></div><div><span>Phòng</span><b>P. {roomNo} · {rType?.name}</b></div><div><span>Thời gian</span><b>{fmtDate(i)} → {fmtDate(o)}</b></div><div><span>Số khách</span><b>{guests} khách</b></div></div>
        <TextArea label="Ghi chú (tuỳ chọn)" rows={3} placeholder="Yêu cầu đặc biệt của khách…" value={note} onChange={e => setNote(e.target.value)} />
        <div className="info-note ok"><Icon name="check" size={16} />Booking tạo bởi quản trị viên sẽ được xác nhận ngay.</div></Card>}
      <div className="form-actions"><Button variant="secondary" onClick={() => step > 1 ? setStep(step - 1) : go('bookings')}>{step > 1 ? 'Quay lại' : 'Hủy'}</Button><Button onClick={next}>{step === 1 ? 'Tìm phòng trống' : step === 2 ? 'Tiếp tục' : 'Xác nhận booking'}<Icon name="arrow" size={17} /></Button></div>
    </div>
      <Card className="summary-card"><h3>Tóm tắt booking</h3>
        <div className="stay-dates"><div><span>NHẬN PHÒNG</span><b>{i ? fmtDate(i) : '—'}</b><small>{i ? `${weekday(i)}, 14:00` : ''}</small></div><i><Icon name="arrow" size={17} /></i><div><span>TRẢ PHÒNG</span><b>{o ? fmtDate(o) : '—'}</b><small>{o ? `${weekday(o)}, 12:00` : ''}</small></div></div>
        <div className="summary-line"><span>Khách hàng</span><b>{newCust ? nc.name || 'Khách mới' : customer?.name}</b></div>
        <div className="summary-line"><span>Phòng</span><b>{room ? `P. ${room.no} · ${rType?.name}` : 'Chưa chọn'}</b></div>
        <div className="summary-line"><span>Giá mỗi đêm</span><b>{rType ? vnd(rType.price) : '—'}</b></div>
        <div className="summary-line"><span>Số đêm</span><b>{nights} đêm</b></div>
        <div className="summary-total"><span>Tổng tiền</span><strong>{rType ? vnd(rType.price * nights) : '—'}</strong><small>Đã bao gồm thuế và phí dịch vụ</small></div></Card></div>
  </>
}

/* ───────── Calendar ───────── */

export function CalendarPage({ ctx, open }: { ctx: Ctx; open: (id: string) => void }) {
  const { store, go } = ctx
  const N = 14
  const [start, setStart] = useState(addDays(TODAY, -2))
  const [typeId, setTypeId] = useState('all')
  const days = Array.from({ length: N }, (_, k) => addDays(start, k))
  const end = addDays(start, N)
  const rooms = store.rooms.filter(r => typeId === 'all' || r.type === typeId)
  const todayIdx = days.indexOf(TODAY)
  const colour = (s: BookingStatus) => s === 'Đã xác nhận' ? 'ok' : s === 'Đang chờ' ? 'wait' : 'done'
  return <>
    <div className="page-heading"><div><div><h2>Lịch phòng</h2><p>Xem tình trạng lấp đầy của từng phòng theo ngày.</p></div></div><Button icon="plus" onClick={() => go('create-booking')}>Tạo booking</Button></div>
    <Card className="cal-card">
      <div className="cal-toolbar">
        <div className="cal-nav"><Button variant="secondary" icon="chevron-left" title="Tuần trước" onClick={() => setStart(addDays(start, -7))} /><Button variant="secondary" onClick={() => setStart(addDays(TODAY, -2))}>Hôm nay</Button><Button variant="secondary" icon="chevron" title="Tuần sau" onClick={() => setStart(addDays(start, 7))} /><b>{fmtDate(days[0])} – {fmtDate(days[N - 1])}</b></div>
        <div className="cal-legend"><span><i className="ok" />Đã xác nhận</span><span><i className="wait" />Đang chờ</span><span><i className="done" />Hoàn thành</span><span><i className="maint" />Bảo trì</span></div>
        <SelectField label="Loại phòng" value={typeId} onChange={e => setTypeId(e.target.value)}><option value="all">Tất cả loại phòng</option>{store.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</SelectField>
      </div>
      <div className="cal-scroll"><div className="cal" style={{ ['--n' as string]: N }}>
        <div className="cal-row cal-head"><div className="cal-label">PHÒNG</div><div className="cal-track">{days.map(d => <div key={d} className={`cal-day ${d === TODAY ? 'today' : ''} ${['T7', 'CN'].includes(shortWeekday(d)) ? 'weekend' : ''}`}><small>{shortWeekday(d)}</small><b>{d.slice(8)}</b></div>)}</div></div>
        {rooms.map(r => { const t = store.types.find(x => x.id === r.type)!
          const bks = store.bookings.filter(b => b.roomNo === r.no && b.status !== 'Đã hủy' && overlaps(b.in, b.out, start, end))
          return <div className="cal-row" key={r.no}><div className="cal-label"><b>P. {r.no}</b><small>{t.name}</small></div>
            <div className={`cal-track ${r.status === 'Maintenance' ? 'maint' : ''}`}>{todayIdx >= 0 && <i className="today-line" style={{ left: `${((todayIdx + 0.5) / N) * 100}%` }} />}
              {r.status === 'Maintenance' && <span className="maint-label"><Icon name="settings" size={14} />Đang bảo trì</span>}
              {bks.map(b => { const s = Math.max(nightsBetween(start, b.in) + 0.5, 0), e = Math.min(nightsBetween(start, b.out) + 0.5, N)
                const c = store.customers.find(x => x.id === b.customerId)!
                return <button key={b.id} className={`cal-bar ${colour(b.status)}`} style={{ left: `${(s / N) * 100}%`, width: `${((e - s) / N) * 100}%` }} onClick={() => open(b.id)} title={`${b.id} · ${c.name}\n${fmtDate(b.in)} – ${fmtDate(b.out)}`}><b>{c.name}</b><small>{b.id}</small></button> })}
            </div></div> })}
      </div></div>
    </Card>
  </>
}

/* ───────── Rooms ───────── */

const AMEN: [IconName, string][] = [['wifi', 'WiFi'], ['snow', 'Máy lạnh'], ['tv', 'TV'], ['bath', 'Bồn tắm']]

function RoomModal({ store, room, onClose, notify }: { store: Store; room?: Room; onClose: () => void; notify: (s: string) => void }) {
  const [no, setNo] = useState(room?.no ?? '')
  const [type, setType] = useState(room?.type ?? store.types[0].id)
  const [status, setStatus] = useState<Room['status']>(room?.status ?? 'Available')
  const [am, setAm] = useState<IconName[]>(room?.amenities ?? ['wifi', 'snow', 'tv'])
  const [tried, setTried] = useState(false)
  const dup = !room && store.rooms.some(r => r.no === no.trim())
  const err = !no.trim() ? 'Vui lòng nhập số phòng.' : dup ? 'Số phòng này đã tồn tại.' : ''
  const save = () => {
    setTried(true); if (err) return
    if (room) { store.updateRoom(room.no, { type, status, amenities: am }); notify(`Đã cập nhật phòng ${room.no}`) }
    else { store.addRoom({ no: no.trim(), type, status, floor: Number(no.trim()[0]) || 1, amenities: am }); notify(`Đã thêm phòng ${no.trim()}`) }
    onClose()
  }
  return <Modal title={room ? `Chỉnh sửa phòng ${room.no}` : 'Thêm phòng mới'} eyebrow="THÔNG TIN PHÒNG" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu phòng</Button></>}>
    <div className="form-grid"><Field label="Số phòng" placeholder="Ví dụ: 506" value={no} disabled={!!room} onChange={e => setNo(e.target.value)} error={tried ? err : ''} />
      <SelectField label="Loại phòng" value={type} onChange={e => setType(e.target.value)}>{store.types.map(t => <option key={t.id} value={t.id}>{t.name} · {vnd(t.price)}</option>)}</SelectField>
      <SelectField label="Trạng thái" value={status} onChange={e => setStatus(e.target.value as Room['status'])}><option value="Available">Sẵn sàng</option><option value="Maintenance">Bảo trì</option></SelectField></div>
    <div className="amenity-checks"><span>Tiện nghi</span>{AMEN.map(([k, l]) => <label key={k}><input type="checkbox" checked={am.includes(k)} onChange={e => setAm(e.target.checked ? [...am, k] : am.filter(x => x !== k))} />{l}</label>)}</div>
  </Modal>
}

export function RoomsPage({ ctx }: { ctx: Ctx }) {
  const { store, notify } = ctx
  const [q, setQ] = useState(''); const [type, setType] = useState('all'); const [status, setStatus] = useState('all'); const [page, setPage] = useState(1)
  const [modal, setModal] = useState<Room | 'new' | null>(null)
  const rows = store.rooms.filter(r => (type === 'all' || r.type === type) && (status === 'all' || r.status === status) && r.no.includes(q.trim()))
  useEffect(() => setPage(1), [q, type, status])
  const size = 8
  const ready = store.rooms.filter(r => r.status === 'Available').length
  return <>
    <div className="page-heading"><div><div><h2>Quản lý phòng</h2><p>Quản lý thông tin, giá và tình trạng phòng.</p></div></div><Button icon="plus" onClick={() => setModal('new')}>Thêm phòng</Button></div>
    <div className="mini-stats"><Card><span>Tổng số phòng</span><b>{store.rooms.length}</b><small>{store.types.length} loại phòng</small></Card><Card><span>Đang sẵn sàng</span><b className="teal-text">{ready}</b><small>{Math.round(ready / store.rooms.length * 100)}% tổng phòng</small></Card><Card><span>Đang bảo trì</span><b className="gold-text">{store.rooms.length - ready}</b><small>Cần kiểm tra</small></Card></div>
    <Card><Toolbar search={q} onSearch={setQ} placeholder="Tìm số phòng…"><SelectField label="Loại phòng" value={type} onChange={e => setType(e.target.value)}><option value="all">Tất cả loại phòng</option>{store.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</SelectField><SelectField label="Trạng thái" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="Available">Sẵn sàng</option><option value="Maintenance">Bảo trì</option></SelectField></Toolbar>
      {rows.length === 0 ? <EmptyState icon="bed" title="Không có phòng phù hợp" text="Thử bỏ bớt bộ lọc để xem thêm phòng." /> : <>
        <div className="table-scroll"><table><thead><tr><th>SỐ PHÒNG</th><th>LOẠI PHÒNG</th><th>TẦNG</th><th>GIÁ / ĐÊM</th><th>TIỆN NGHI</th><th>TRẠNG THÁI</th><th /></tr></thead>
          <tbody>{rows.slice((page - 1) * size, page * size).map(r => { const t = store.types.find(x => x.id === r.type)!
            return <tr key={r.no}><td><b className="room-number"><img src={t.image} alt="" />P. {r.no}</b></td><td>{t.name}</td><td>Tầng {r.floor}</td><td><b>{vnd(t.price)}</b></td><td><div className="amenities">{r.amenities.map(a => <span key={a}><Icon name={a} size={15} /></span>)}</div></td><td><Badge status={r.status} /></td>
              <td><div className="row-actions"><Button variant="icon" icon={r.status === 'Available' ? 'settings' : 'check'} title={r.status === 'Available' ? 'Chuyển sang bảo trì' : 'Đánh dấu sẵn sàng'} onClick={() => { store.updateRoom(r.no, { status: r.status === 'Available' ? 'Maintenance' : 'Available' }); notify(r.status === 'Available' ? `Phòng ${r.no} chuyển sang bảo trì` : `Phòng ${r.no} đã sẵn sàng`) }} /><Button variant="icon" icon="edit" title="Chỉnh sửa" onClick={() => setModal(r)} /></div></td></tr> })}</tbody></table></div>
        <Pagination page={page} setPage={setPage} total={rows.length} size={size} unit="phòng" /></>}</Card>
    {modal && <RoomModal store={store} room={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} notify={notify} />}
  </>
}

/* ───────── Room types ───────── */

function TypeModal({ store, type, onClose, notify }: { store: Store; type?: Store['types'][number]; onClose: () => void; notify: (s: string) => void }) {
  const t = type
  const [f, setF] = useState({ name: t?.name ?? '', price: String(t?.price ?? 900000), capacity: String(t?.capacity ?? 2), size: String(t?.size ?? 28), desc: t?.desc ?? '' })
  const [tried, setTried] = useState(false)
  const bad = !f.name.trim() || +f.price < 100000 || +f.capacity < 1
  const save = () => {
    setTried(true); if (bad) return
    const patch = { name: f.name.trim(), price: +f.price, capacity: +f.capacity, size: +f.size, desc: f.desc }
    if (t) { store.updateType(t.id, patch); notify(`Đã cập nhật loại phòng ${patch.name}`) }
    else { store.addType({ ...patch, view: 'Hướng thành phố', bed: '1 giường đôi', tagline: 'Loại phòng mới' }); notify(`Đã thêm loại phòng ${patch.name}`) }
    onClose()
  }
  return <Modal title={t ? `Chỉnh sửa ${t.name}` : 'Thêm loại phòng'} eyebrow="LOẠI PHÒNG" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu</Button></>}>
    <div className="form-grid"><div className="span-2"><Field label="Tên loại phòng" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} error={tried && !f.name.trim() ? 'Vui lòng nhập tên.' : ''} /></div>
      <Field label="Giá mỗi đêm (VND)" type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} hint={vnd(+f.price || 0)} error={tried && +f.price < 100000 ? 'Giá tối thiểu 100.000 ₫.' : ''} />
      <Field label="Sức chứa (khách)" type="number" min={1} value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} />
      <Field label="Diện tích (m²)" type="number" value={f.size} onChange={e => setF({ ...f, size: e.target.value })} /></div>
    <TextArea label="Mô tả" rows={3} value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} />
  </Modal>
}

export function RoomTypesPage({ ctx }: { ctx: Ctx }) {
  const { store, notify } = ctx
  const [modal, setModal] = useState<Store['types'][number] | 'new' | null>(null)
  return <>
    <div className="page-heading"><div><div><h2>Loại phòng</h2><p>Thiết lập hạng phòng, sức chứa và giá cơ bản.</p></div></div><Button icon="plus" onClick={() => setModal('new')}>Thêm loại phòng</Button></div>
    <div className="type-grid">{store.types.map(t => <Card className="type-card" key={t.id}><div className="type-photo"><img src={t.image} alt={`Phòng ${t.name}`} loading="lazy" /><span>{typeCount(store, t.id)} phòng</span></div>
      <div className="type-body"><h3>{t.name}</h3><p>{t.desc}</p><div className="type-price"><strong>{vnd(t.price)}</strong><span>/ đêm</span></div>
        <div className="type-meta"><span><Icon name="users" size={16} />{t.capacity} khách</span><span><Icon name="ruler" size={16} />{t.size} m²</span></div>
        <Button variant="secondary" icon="edit" onClick={() => setModal(t)}>Chỉnh sửa</Button></div></Card>)}</div>
    {modal && <TypeModal store={store} type={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} notify={notify} />}
  </>
}

/* ───────── Customers ───────── */

function CustomerModal({ store, customer, onClose, notify }: { store: Store; customer?: Customer; onClose: () => void; notify: (s: string) => void }) {
  const [f, setF] = useState({ name: customer?.name ?? '', email: customer?.email ?? '', phone: customer?.phone ?? '' })
  const [tried, setTried] = useState(false)
  const e = { name: !f.name.trim() ? 'Vui lòng nhập họ tên.' : '', email: !/^\S+@\S+\.\S+$/.test(f.email) ? 'Email chưa hợp lệ.' : store.customers.some(c => c.email === f.email && c.id !== customer?.id) ? 'Email đã được sử dụng.' : '', phone: f.phone.replace(/\D/g, '').length < 9 ? 'Số điện thoại chưa hợp lệ.' : '' }
  const save = () => { setTried(true); if (e.name || e.email || e.phone) return; if (customer) { store.updateCustomer(customer.id, f); notify('Đã cập nhật hồ sơ khách hàng') } else { store.addCustomer(f); notify(`Đã thêm khách hàng ${f.name}`) } onClose() }
  return <Modal title={customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'} eyebrow="HỒ SƠ KHÁCH HÀNG" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button onClick={save}>Lưu khách hàng</Button></>}>
    <div className="form-grid"><div className="span-2"><Field label="Họ và tên" value={f.name} onChange={x => setF({ ...f, name: x.target.value })} error={tried ? e.name : ''} /></div><Field label="Email" type="email" icon="mail" value={f.email} onChange={x => setF({ ...f, email: x.target.value })} error={tried ? e.email : ''} /><Field label="Số điện thoại" icon="phone" value={f.phone} onChange={x => setF({ ...f, phone: x.target.value })} error={tried ? e.phone : ''} /></div>
  </Modal>
}

export function CustomersPage({ ctx, open, openId, closeProfile }: { ctx: Ctx; open: (id: string) => void; openId?: string; closeProfile: () => void }) {
  const { store, go, notify } = ctx
  const [q, setQ] = useState(''); const [page, setPage] = useState(1); const [modal, setModal] = useState<Customer | 'new' | null>(null)
  const stats = (id: string) => { const bs = store.bookings.filter(b => b.customerId === id); return { n: bs.length, spend: bs.filter(b => b.status === 'Đã xác nhận' || b.status === 'Đã hoàn thành').reduce((s, b) => s + totalOf(store, b), 0) } }
  const rows = store.customers.filter(c => (c.name + c.email + c.phone).toLowerCase().includes(q.trim().toLowerCase()))
  useEffect(() => setPage(1), [q])
  const size = 8
  const sel = store.customers.find(c => c.id === openId)
  return <>
    <div className="page-heading"><div><div><h2>Khách hàng</h2><p>Quản lý hồ sơ và lịch sử lưu trú của khách hàng.</p></div></div><Button icon="plus" onClick={() => setModal('new')}>Thêm khách hàng</Button></div>
    <Card><Toolbar search={q} onSearch={setQ} placeholder="Tìm tên, email, số điện thoại…" />
      {rows.length === 0 ? <EmptyState icon="users" title="Không tìm thấy khách hàng" text="Kiểm tra lại từ khóa hoặc thêm khách hàng mới." action={<Button icon="plus" onClick={() => setModal('new')}>Thêm khách hàng</Button>} /> : <>
        <div className="table-scroll"><table><thead><tr><th>KHÁCH HÀNG</th><th>EMAIL</th><th>ĐIỆN THOẠI</th><th>THÀNH VIÊN TỪ</th><th>BOOKING</th><th>TỔNG CHI TIÊU</th><th /></tr></thead>
          <tbody>{rows.slice((page - 1) * size, page * size).map(c => { const s = stats(c.id)
            return <tr key={c.id} onClick={() => open(c.id)} className="clickable"><td><CustomerCell c={c} /></td><td>{c.email}</td><td>{c.phone}</td><td>{fmtDate(c.since)}</td><td><b>{s.n} booking</b></td><td><b>{vnd(s.spend)}</b></td><td><Icon name="chevron" size={18} /></td></tr> })}</tbody></table></div>
        <Pagination page={page} setPage={setPage} total={rows.length} size={size} unit="khách hàng" /></>}</Card>
    {sel && <div className="overlay" onMouseDown={closeProfile}><aside className="drawer" role="dialog" aria-label="Hồ sơ khách hàng" onMouseDown={e => e.stopPropagation()}>
      <div className="drawer-head"><div><span className="eyebrow">HỒ SƠ KHÁCH HÀNG</span><h2>{sel.name}</h2></div><Button variant="icon" icon="close" title="Đóng" onClick={closeProfile} /></div>
      <div className="customer-hero"><Avatar name={sel.name} size={72} /><p>Khách hàng từ {fmtDate(sel.since)}</p></div>
      <div className="mini-kpis"><div><b>{stats(sel.id).n}</b><span>Booking</span></div><div><b>{fmtM(stats(sel.id).spend)}</b><span>Chi tiêu</span></div></div>
      <div className="drawer-section"><div className="detail-row"><span>Email</span><b>{sel.email}</b></div><div className="detail-row"><span>Điện thoại</span><b>{sel.phone}</b></div></div>
      <div className="drawer-section"><h3>Booking gần đây</h3>{store.bookings.filter(b => b.customerId === sel.id).sort((a, b) => b.in.localeCompare(a.in)).slice(0, 4).map(b => <button className="history-item" key={b.id} onClick={() => { closeProfile(); go('bookings', { bookingId: b.id }) }}><span><Icon name="bed" /></span><div><b>{b.id} · P. {b.roomNo}</b><small>{fmtDate(b.in)} — {fmtDate(b.out)}</small></div><Badge status={b.status} /></button>)}</div>
      <div className="drawer-actions"><Button variant="secondary" icon="edit" onClick={() => setModal(sel)}>Chỉnh sửa</Button><Button icon="plus" onClick={() => { closeProfile(); go('create-booking', { customerId: sel.id }) }}>Tạo booking</Button></div>
    </aside></div>}
    {modal && <CustomerModal store={store} customer={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} notify={notify} />}
  </>
}

/* ───────── Reports ───────── */

export function ReportsPage({ ctx }: { ctx: Ctx }) {
  const { store, notify } = ctx
  const [range, setRange] = useState<'year' | 'half'>('year')
  const paid = store.bookings.filter(b => b.status === 'Đã xác nhận' || b.status === 'Đã hoàn thành')
  const revenue = paid.reduce((s, b) => s + totalOf(store, b), 0)
  const nightsSold = paid.reduce((s, b) => s + nightsBetween(b.in, b.out), 0)
  const cancelRate = Math.round(store.bookings.filter(b => b.status === 'Đã hủy').length / store.bookings.length * 100)
  const data = range === 'year' ? revenueByMonth : revenueByMonth.slice(0, 6)
  const labels = range === 'year' ? monthLabels : monthLabels.slice(0, 6)
  const byType = store.types.map(t => { const bs = paid.filter(b => typeOf(store, b.roomNo).id === t.id); return { t, n: bs.length, rev: bs.reduce((s, b) => s + totalOf(store, b), 0) } })
  const maxRev = Math.max(...byType.map(x => x.rev), 1)
  const top = store.customers.map(c => ({ c, spend: paid.filter(b => b.customerId === c.id).reduce((s, b) => s + totalOf(store, b), 0), n: store.bookings.filter(b => b.customerId === c.id).length })).sort((a, b) => b.spend - a.spend).slice(0, 5)
  return <>
    <div className="page-heading"><div><div><h2>Báo cáo</h2><p>Hiệu quả kinh doanh và xu hướng đặt phòng.</p></div></div>
      <div className="heading-actions"><div className="seg"><button className={range === 'half' ? 'on' : ''} onClick={() => setRange('half')}>6 tháng</button><button className={range === 'year' ? 'on' : ''} onClick={() => setRange('year')}>12 tháng</button></div>
        <Button variant="secondary" icon="download" onClick={() => { downloadCsv('bao-cao-doanh-thu.csv', [['Tháng', 'Doanh thu (triệu ₫)'], ...labels.map((l, i) => [l, String(data[i])])]); notify('Đã xuất báo cáo doanh thu') }}>Xuất báo cáo</Button></div></div>
    <div className="kpi-grid"><Kpi icon="chart" label="Doanh thu ghi nhận" value={fmtM(revenue)} trend="10,4%" tone="purple" sub="so với kỳ trước" /><Kpi icon="bed" label="Đêm phòng đã bán" value={String(nightsSold)} trend="7,8%" tone="teal" sub="so với kỳ trước" />
      <Kpi icon="sparkle" label="Giá trung bình / đêm" value={vnd(nightsSold ? Math.round(revenue / nightsSold) : 0)} trend="3,2%" tone="gold" sub="so với kỳ trước" /><Kpi icon="x" label="Tỷ lệ hủy" value={`${cancelRate}%`} trend="1,1%" tone="blue" sub="giảm so với kỳ trước" /></div>
    <div className="today-grid wide"><Card className="chart-card"><div className="card-header"><div><h2>Doanh thu theo tháng</h2><p>Đơn vị: triệu đồng</p></div></div><BarChart data={data} labels={labels} highlight={5} /></Card>
      <Card><div className="card-header"><div><h2>Doanh thu theo loại phòng</h2><p>Từ các booking đã xác nhận</p></div></div>
        <div className="hbars">{byType.map(({ t, n, rev }) => <div key={t.id}><div className="hbar-top"><b>{t.name}</b><span>{vnd(rev)}</span></div><div className="hbar"><i style={{ width: `${(rev / maxRev) * 100}%` }} /></div><small>{n} booking</small></div>)}</div></Card></div>
    <Card className="report-table"><div className="card-header"><div><h2>Khách hàng chi tiêu nhiều nhất</h2><p>Xếp hạng theo doanh thu</p></div></div>
      <div className="table-scroll"><table><thead><tr><th>#</th><th>KHÁCH HÀNG</th><th>BOOKING</th><th>TỔNG CHI TIÊU</th></tr></thead><tbody>{top.map((x, i) => <tr key={x.c.id}><td><span className="rank-n">{i + 1}</span></td><td><CustomerCell c={x.c} /></td><td>{x.n}</td><td><b>{vnd(x.spend)}</b></td></tr>)}</tbody></table></div></Card>
  </>
}

/* ───────── Settings ───────── */

export function SettingsPage({ ctx }: { ctx: Ctx }) {
  const { notify } = ctx
  const [tab, setTab] = useState<'hotel' | 'policy' | 'notify' | 'account'>('hotel')
  const [hotel, setHotel] = useState({ name: 'Havenly Hotel & Residences', phone: '028 3822 1188', email: 'xinchao@havenly.vn', address: '27 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh' })
  const [policy, setPolicy] = useState({ checkIn: '14:00', checkOut: '12:00', cancelDays: '2', autoConfirm: false, allowChange: true })
  const [notif, setNotif] = useState({ newBooking: true, cancel: true, daily: false, marketing: false })
  const [pw, setPw] = useState({ cur: '', next: '', again: '' }); const [pwErr, setPwErr] = useState('')
  const save = (m: string) => notify(m)
  const row = (title: string, text: string, on: boolean, fn: (v: boolean) => void) => <div className="setting-row"><div><b>{title}</b><p>{text}</p></div><Toggle on={on} onChange={fn} label={title} /></div>
  return <>
    <div className="page-heading"><div><div><h2>Cài đặt</h2><p>Quản lý thông tin khách sạn, chính sách và tài khoản.</p></div></div></div>
    <div className="settings-layout"><Card className="settings-nav"><Tabs value={tab} onChange={setTab} items={[{ id: 'hotel', label: 'Thông tin khách sạn' }, { id: 'policy', label: 'Chính sách đặt phòng' }, { id: 'notify', label: 'Thông báo' }, { id: 'account', label: 'Tài khoản' }]} /></Card>
      <Card className="settings-body">
        {tab === 'hotel' && <><div className="section-title"><span><Icon name="home" /></span><div><h3>Thông tin khách sạn</h3><p>Hiển thị trên cổng khách hàng và email xác nhận.</p></div></div>
          <div className="form-grid"><div className="span-2"><Field label="Tên khách sạn" value={hotel.name} onChange={e => setHotel({ ...hotel, name: e.target.value })} /></div><Field label="Điện thoại" icon="phone" value={hotel.phone} onChange={e => setHotel({ ...hotel, phone: e.target.value })} /><Field label="Email liên hệ" icon="mail" value={hotel.email} onChange={e => setHotel({ ...hotel, email: e.target.value })} /><div className="span-2"><Field label="Địa chỉ" icon="pin" value={hotel.address} onChange={e => setHotel({ ...hotel, address: e.target.value })} /></div></div>
          <div className="form-actions end"><Button onClick={() => save('Đã lưu thông tin khách sạn')}>Lưu thay đổi</Button></div></>}
        {tab === 'policy' && <><div className="section-title"><span><Icon name="clock" /></span><div><h3>Chính sách đặt phòng</h3><p>Quy tắc áp dụng cho mọi booking.</p></div></div>
          <div className="form-grid"><Field label="Giờ nhận phòng" type="time" value={policy.checkIn} onChange={e => setPolicy({ ...policy, checkIn: e.target.value })} /><Field label="Giờ trả phòng" type="time" value={policy.checkOut} onChange={e => setPolicy({ ...policy, checkOut: e.target.value })} /><Field label="Hủy miễn phí trước (ngày)" type="number" min={0} value={policy.cancelDays} onChange={e => setPolicy({ ...policy, cancelDays: e.target.value })} /></div>
          {row('Tự động xác nhận booking', 'Booking từ khách hàng được xác nhận ngay khi còn phòng.', policy.autoConfirm, v => setPolicy({ ...policy, autoConfirm: v }))}{row('Cho phép khách đổi ngày', 'Khách có thể tự đổi ngày khi booking đang chờ.', policy.allowChange, v => setPolicy({ ...policy, allowChange: v }))}
          <div className="form-actions end"><Button onClick={() => save('Đã lưu chính sách đặt phòng')}>Lưu thay đổi</Button></div></>}
        {tab === 'notify' && <><div className="section-title"><span><Icon name="bell" /></span><div><h3>Thông báo</h3><p>Chọn thông báo bạn muốn nhận qua email.</p></div></div>
          {row('Booking mới', 'Gửi email mỗi khi có booking cần xác nhận.', notif.newBooking, v => setNotif({ ...notif, newBooking: v }))}{row('Booking bị hủy', 'Báo ngay khi khách hủy booking.', notif.cancel, v => setNotif({ ...notif, cancel: v }))}{row('Tổng kết hằng ngày', 'Tóm tắt nhận phòng, trả phòng lúc 07:00.', notif.daily, v => setNotif({ ...notif, daily: v }))}{row('Tin tức & cập nhật', 'Tính năng mới của Havenly.', notif.marketing, v => setNotif({ ...notif, marketing: v }))}</>}
        {tab === 'account' && <><div className="section-title"><span><Icon name="lock" /></span><div><h3>Tài khoản</h3><p>An Nguyễn · admin@havenly.vn</p></div></div>
          <div className="form-grid one"><Field label="Mật khẩu hiện tại" type="password" value={pw.cur} onChange={e => setPw({ ...pw, cur: e.target.value })} /><Field label="Mật khẩu mới" type="password" hint="Tối thiểu 8 ký tự" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} /><Field label="Nhập lại mật khẩu mới" type="password" value={pw.again} onChange={e => setPw({ ...pw, again: e.target.value })} error={pwErr} /></div>
          <div className="form-actions end"><Button onClick={() => { if (CODE_RE.test(pw.cur) || pw.next.length < 8) return setPwErr('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới tối thiểu 8 ký tự.'); if (pw.next !== pw.again) return setPwErr('Mật khẩu nhập lại không khớp.'); setPwErr(''); setPw({ cur: '', next: '', again: '' }); save('Đã đổi mật khẩu') }}>Đổi mật khẩu</Button></div></>}
      </Card></div>
  </>
}
