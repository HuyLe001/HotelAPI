import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Avatar, Badge, Brand, Button, Card, ConfirmDialog, EmptyState, Field, Icon, SelectField, Tabs, TextArea } from './ui'
import { Booking, Customer, IMG, NavParams, RoomType, Store, TODAY, View, addDays, availableRooms, fmtDate, nightsBetween, totalOf, typeOf, vnd, weekday } from './data'
import { ChangeDatesModal } from './admin'

interface CCtx { store: Store; me: Customer; go: (v: View, p?: NavParams) => void; notify: (s: string) => void; logout: () => void }

const AMEN_LABEL: Record<string, string> = { wifi: 'WiFi tốc độ cao', snow: 'Máy lạnh', tv: 'Smart TV 55"', bath: 'Bồn tắm riêng' }

/* ───────── Shell ───────── */

export function PortalShell({ ctx, view, children, wide }: { ctx: CCtx; view: View; children: ReactNode; wide?: boolean }) {
  const { go, me, logout } = ctx
  const [menu, setMenu] = useState(false)
  const tabs: [View, string, string][] = [['portal', 'Tìm phòng', 'search'], ['my-bookings', 'Booking của tôi', 'calendar'], ['support', 'Hỗ trợ', 'help'], ['profile', 'Hồ sơ', 'user']]
  const active = (v: View) => view === v || (v === 'portal' && ['room-detail', 'checkout', 'success'].includes(view))
  return <div className="portal">
    <header className="portal-header"><button className="brand-btn" onClick={() => go('portal')} aria-label="Havenly - trang chủ"><Brand /></button>
      <nav aria-label="Điều hướng chính">{tabs.map(([v, l]) => <button key={v} className={active(v) ? 'active' : ''} onClick={() => go(v)}>{l}</button>)}</nav>
      <div className="portal-user"><button className="portal-user-btn" onClick={() => setMenu(!menu)} aria-expanded={menu}><Avatar name={me.name} size={34} /><span>{me.name.split(' ').slice(-1)[0]}</span><Icon name="chevron-down" size={15} /></button>
        {menu && <><div className="menu-dismiss" onClick={() => setMenu(false)} /><div className="user-menu"><div className="user-menu-head"><b>{me.name}</b><small>{me.email}</small></div><button onClick={() => { setMenu(false); go('profile') }}><Icon name="user" size={16} />Hồ sơ của tôi</button><button onClick={() => { setMenu(false); go('my-bookings') }}><Icon name="calendar" size={16} />Booking của tôi</button><button onClick={logout}><Icon name="logout" size={16} />Đăng xuất</button></div></>}</div>
    </header>
    <nav className="portal-tabbar" aria-label="Điều hướng di động">{tabs.map(([v, l, i]) => <button key={v} className={active(v) ? 'active' : ''} onClick={() => go(v)}><Icon name={i as 'search'} size={20} /><span>{l.replace(' của tôi', '')}</span></button>)}</nav>
    <main className={wide ? 'portal-main wide' : 'portal-main'}>{children}</main>
    <footer className="portal-footer"><div><Brand /><p>27 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh<br />028 3822 1188 · xinchao@havenly.vn</p></div><small>© 2025 Havenly Hotel. Thanh toán trực tiếp tại quầy khi nhận phòng.</small></footer>
  </div>
}

/* ───────── Search home ───────── */

function TypeCard({ t, left, nights, onOpen }: { t: RoomType; left: number; nights: number; onOpen: () => void }) {
  return <article className={`type-result ${left === 0 ? 'soldout' : ''}`}>
    <button className="type-result-img" onClick={onOpen} aria-label={`Xem phòng ${t.name}`}><img src={t.image} alt={`Phòng ${t.name} tại Havenly`} loading="lazy" /><span className={`stock ${left <= 1 ? 'low' : ''}`}>{left === 0 ? 'Hết phòng' : left <= 2 ? `Chỉ còn ${left} phòng` : `Còn ${left} phòng`}</span></button>
    <div className="type-result-body"><small>{t.view.toUpperCase()}</small><h3>{t.name}</h3><p>{t.tagline}</p>
      <div className="amenity-text"><span><Icon name="users" size={15} />{t.capacity} khách</span><span><Icon name="ruler" size={15} />{t.size} m²</span><span><Icon name="bed" size={15} />{t.bed}</span></div>
      <div className="portal-price"><div><strong>{vnd(t.price)}</strong><span> / đêm</span>{nights > 0 && <em>{nights} đêm · {vnd(t.price * nights)}</em>}</div><Button variant={left === 0 ? 'secondary' : 'primary'} disabled={left === 0} onClick={onOpen}>Chọn phòng</Button></div></div>
  </article>
}

export function Portal({ ctx, preset }: { ctx: CCtx; preset?: NavParams }) {
  const { store, go } = ctx
  const [i, setI] = useState(preset?.in ?? addDays(TODAY, 2))
  const [o, setO] = useState(preset?.out ?? addDays(TODAY, 5))
  const [guests, setGuests] = useState(preset?.guests ?? 2)
  const [type, setType] = useState('all')
  const [sort, setSort] = useState<'price-asc' | 'price-desc'>('price-asc')
  const [searched, setSearched] = useState(!!preset?.searched)
  const [err, setErr] = useState('')
  const nights = nightsBetween(i, o)
  const search = () => {
    if (!i || !o) return setErr('Vui lòng chọn ngày nhận và trả phòng.')
    if (i < TODAY) return setErr('Ngày nhận phòng không được ở quá khứ.')
    if (o <= i) return setErr('Ngày trả phòng phải sau ngày nhận phòng.')
    setErr(''); setSearched(true)
    setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
  const list = useMemo(() => store.types.filter(t => type === 'all' || t.id === type).map(t => ({ t, left: searched ? availableRooms(store, i, o, t.id).length : store.rooms.filter(r => r.type === t.id && r.status === 'Available').length }))
    .filter(x => !searched || x.t.capacity >= guests).sort((a, b) => sort === 'price-asc' ? a.t.price - b.t.price : b.t.price - a.t.price), [store, type, sort, searched, i, o, guests])
  const open = (t: RoomType) => go('room-detail', { typeId: t.id, in: i, out: o, guests, searched })
  return <PortalShell ctx={ctx} view="portal" wide>
    <section className="hero"><img src={IMG.hero} alt="" /><div className="hero-shade" />
      <div className="hero-copy"><span className="eyebrow light">XIN CHÀO, {ctx.me.name.split(' ').slice(-1)[0].toUpperCase()}</span><h1>Tìm không gian nghỉ dưỡng <em>hoàn hảo cho bạn.</em></h1><p>Phòng ấm, dịch vụ tận tâm, ngay giữa trung tâm thành phố. Đặt phòng chỉ với vài bước, thanh toán khi nhận phòng.</p></div></section>
    <Card className="search-panel"><Field label="Ngày nhận phòng" type="date" min={TODAY} value={i} onChange={e => setI(e.target.value)} hint={i ? `${weekday(i)}, ${fmtDate(i)}` : ''} /><Field label="Ngày trả phòng" type="date" min={i} value={o} onChange={e => setO(e.target.value)} hint={o ? `${weekday(o)}, ${fmtDate(o)}` : ''} />
      <SelectField label="Số khách" value={String(guests)} onChange={e => setGuests(+e.target.value)}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} khách</option>)}</SelectField><Button icon="search" onClick={search}>Tìm phòng</Button>
      {err && <p className="search-error" role="alert"><Icon name="alert" size={15} />{err}</p>}</Card>
    <section className="results" id="results"><div className="section-heading"><div><span className="eyebrow">{searched ? `${nights} ĐÊM · ${fmtDate(i)} – ${fmtDate(o)}` : 'PHÒNG NỔI BẬT'}</span><h2>{searched ? (list.some(x => x.left > 0) ? 'Phòng trống dành cho bạn' : 'Rất tiếc, đã hết phòng') : 'Lựa chọn được yêu thích'}</h2></div>
      <div className="results-tools"><div className="chips">{[['all', 'Tất cả'], ...store.types.map(t => [t.id, t.name])].map(([id, l]) => <button key={id} className={type === id ? 'on' : ''} onClick={() => setType(id)}>{l}</button>)}</div>
        <SelectField label="Sắp xếp" value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="price-asc">Giá thấp đến cao</option><option value="price-desc">Giá cao đến thấp</option></SelectField></div></div>
      {list.length === 0 ? <EmptyState icon="users" title="Không có loại phòng phù hợp" text={`Không loại phòng nào chứa được ${guests} khách. Hãy thử giảm số khách.`} /> :
        <div className="portal-rooms">{list.map(({ t, left }) => <TypeCard key={t.id} t={t} left={left} nights={searched ? nights : 0} onOpen={() => open(t)} />)}</div>}</section>
    <section className="why"><div className="section-heading"><div><span className="eyebrow">TẠI SAO CHỌN HAVENLY</span><h2>Chi tiết nhỏ, trải nghiệm lớn</h2></div></div>
      <div className="why-grid">{([['sparkle', 'Dọn phòng mỗi ngày', 'Ga giường cotton, khăn tắm và đồ vệ sinh được thay mới mỗi ngày.'], ['clock', 'Hủy linh hoạt', 'Hủy miễn phí trước ngày nhận phòng 2 ngày, không cần giải thích.'], ['coffee', 'Bữa sáng tại phòng', 'Gọi bữa sáng kiểu Việt hoặc Âu, phục vụ ngay tại phòng từ 6:30.']] as const).map(([ic, t, d]) => <div key={t}><span><Icon name={ic} size={22} /></span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
  </PortalShell>
}

/* ───────── Room detail ───────── */

export function RoomDetail({ ctx, params }: { ctx: CCtx; params: NavParams }) {
  const { store, go } = ctx
  const t = store.types.find(x => x.id === params.typeId) ?? store.types[0]
  const [i, setI] = useState(params.in ?? addDays(TODAY, 2))
  const [o, setO] = useState(params.out ?? addDays(TODAY, 5))
  const [guests, setGuests] = useState(params.guests ?? 2)
  const [img, setImg] = useState(0)
  const nights = nightsBetween(i, o)
  const err = o <= i ? 'Ngày trả phòng phải sau ngày nhận phòng.' : i < TODAY ? 'Ngày nhận phòng không được ở quá khứ.' : guests > t.capacity ? `Loại phòng này tối đa ${t.capacity} khách.` : ''
  const free = err ? [] : availableRooms(store, i, o, t.id)
  const room = store.rooms.find(r => r.type === t.id)
  const others = store.types.filter(x => x.id !== t.id).slice(0, 3)
  return <PortalShell ctx={ctx} view="room-detail">
    <button className="crumb" onClick={() => go('portal', { in: i, out: o, guests, searched: params.searched })}><Icon name="back" size={16} />Quay lại kết quả</button>
    <div className="detail-layout"><div>
      <div className="gallery"><div className="gallery-main"><img src={t.gallery[img]} alt={`Phòng ${t.name} - ảnh ${img + 1}`} /></div>
        <div className="gallery-thumbs">{t.gallery.map((g, k) => <button key={g + k} className={k === img ? 'on' : ''} onClick={() => setImg(k)} aria-label={`Xem ảnh ${k + 1}`}><img src={g} alt="" /></button>)}</div></div>
      <div className="detail-head"><div><span className="eyebrow">{t.view.toUpperCase()}</span><h1>Phòng {t.name}</h1><p>{t.tagline}</p></div><div className="rating"><Icon name="star" size={16} /><b>4,8</b><small>(126 đánh giá)</small></div></div>
      <div className="spec-row"><div><Icon name="users" size={20} /><b>{t.capacity} khách</b><small>Sức chứa tối đa</small></div><div><Icon name="ruler" size={20} /><b>{t.size} m²</b><small>Diện tích</small></div><div><Icon name="bed" size={20} /><b>{t.bed}</b><small>Loại giường</small></div></div>
      <section className="detail-block"><h2>Giới thiệu</h2><p>{t.desc} Mỗi phòng đều được trang bị ga giường cotton, rèm cản sáng và cách âm tốt để bạn nghỉ ngơi trọn vẹn sau một ngày dài.</p></section>
      <section className="detail-block"><h2>Tiện nghi</h2><ul className="amenity-list">{(room?.amenities ?? []).map(a => <li key={a}><Icon name={a} size={18} />{AMEN_LABEL[a]}</li>)}<li><Icon name="coffee" size={18} />Ấm đun nước & trà</li><li><Icon name="lock" size={18} />Két an toàn</li></ul></section>
      <section className="detail-block"><h2>Chính sách</h2><div className="policy-grid"><div><Icon name="clock" size={18} /><b>Nhận phòng</b><span>Từ 14:00</span></div><div><Icon name="clock" size={18} /><b>Trả phòng</b><span>Trước 12:00</span></div><div><Icon name="check" size={18} /><b>Hủy miễn phí</b><span>Trước 2 ngày</span></div></div></section>
      <section className="detail-block"><h2>Có thể bạn cũng thích</h2><div className="mini-types">{others.map(x => <button key={x.id} onClick={() => { setImg(0); go('room-detail', { typeId: x.id, in: i, out: o, guests }) }}><img src={x.image} alt="" /><div><b>{x.name}</b><small>{vnd(x.price)} / đêm</small></div></button>)}</div></section>
    </div>
      <aside className="book-card"><div className="book-price"><strong>{vnd(t.price)}</strong><span>/ đêm</span></div>
        <div className="form-grid"><Field label="Nhận phòng" type="date" min={TODAY} value={i} onChange={e => setI(e.target.value)} /><Field label="Trả phòng" type="date" min={i} value={o} onChange={e => setO(e.target.value)} /></div>
        <SelectField label="Số khách" value={String(guests)} onChange={e => setGuests(+e.target.value)}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} khách</option>)}</SelectField>
        {err ? <div className="info-note danger"><Icon name="alert" size={16} />{err}</div> : free.length === 0 ? <div className="info-note danger"><Icon name="alert" size={16} />Hết phòng trong khoảng ngày này. Hãy thử ngày khác.</div> : <div className="info-note ok"><Icon name="check" size={16} />Còn {free.length} phòng trống</div>}
        <div className="summary-line"><span>{vnd(t.price)} × {nights} đêm</span><b>{vnd(t.price * nights)}</b></div><div className="summary-line"><span>Thuế & phí dịch vụ</span><b>Đã bao gồm</b></div>
        <div className="summary-total"><span>Tổng cộng</span><strong>{vnd(t.price * nights)}</strong><small>Thanh toán tại quầy khi nhận phòng</small></div>
        <Button className="full" disabled={!!err || free.length === 0} onClick={() => go('checkout', { typeId: t.id, roomNo: free[0].no, in: i, out: o, guests })}>Đặt phòng<Icon name="arrow" size={17} /></Button></aside></div>
  </PortalShell>
}

/* ───────── Checkout ───────── */

function Stepper({ step }: { step: number }) {
  return <div className="steps portal-steps">{['Chọn phòng', 'Thông tin', 'Hoàn tất'].map((s, k) => <div key={s} className={`${step >= k ? 'active' : ''} ${step > k ? 'done' : ''}`}>{k > 0 && <i />}<span>{step > k ? <Icon name="check" size={14} /> : k + 1}</span><b>{s}</b></div>)}</div>
}

export function Checkout({ ctx, params }: { ctx: CCtx; params: NavParams }) {
  const { store, me, go, notify } = ctx
  const room = store.rooms.find(r => r.no === params.roomNo)
  const t = room ? store.types.find(x => x.id === room.type) : undefined
  const [f, setF] = useState({ name: me.name, phone: me.phone, email: me.email, note: '' })
  const [agree, setAgree] = useState(false)
  const [tried, setTried] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!room || !t || !params.in || !params.out) return <PortalShell ctx={ctx} view="checkout"><EmptyState icon="calendar" title="Chưa chọn phòng" text="Hãy chọn phòng trước khi đặt." action={<Button onClick={() => go('portal')}>Tìm phòng</Button>} /></PortalShell>
  const nights = nightsBetween(params.in, params.out)
  const e = { name: !f.name.trim() ? 'Vui lòng nhập họ tên.' : '', phone: f.phone.replace(/\D/g, '').length < 9 ? 'Số điện thoại chưa hợp lệ.' : '', email: !/^\S+@\S+\.\S+$/.test(f.email) ? 'Email chưa hợp lệ.' : '' }
  const submit = () => {
    setTried(true); if (e.name || e.phone || e.email || !agree) return
    if (!availableRooms(store, params.in!, params.out!, t.id).some(r => r.no === room.no)) { notify('Phòng vừa được đặt. Vui lòng chọn lại.'); return go('room-detail', { typeId: t.id, in: params.in, out: params.out, guests: params.guests }) }
    setBusy(true)
    setTimeout(() => { const bk = store.addBooking({ customerId: me.id, roomNo: room.no, in: params.in!, out: params.out!, status: 'Đang chờ', guests: params.guests ?? 2, note: f.note || undefined }); go('success', { bookingId: bk.id }) }, 700)
  }
  return <PortalShell ctx={ctx} view="checkout">
    <Stepper step={1} />
    <div className="checkout-layout"><div className="form-stack">
      <Card><div className="section-title"><span><Icon name="user" /></span><div><h3>Thông tin người đặt</h3><p>Chúng tôi sẽ dùng thông tin này để liên hệ xác nhận.</p></div></div>
        <div className="form-grid"><div className="span-2"><Field label="Họ và tên" value={f.name} onChange={x => setF({ ...f, name: x.target.value })} error={tried ? e.name : ''} /></div><Field label="Số điện thoại" icon="phone" value={f.phone} onChange={x => setF({ ...f, phone: x.target.value })} error={tried ? e.phone : ''} /><Field label="Email" icon="mail" value={f.email} onChange={x => setF({ ...f, email: x.target.value })} error={tried ? e.email : ''} /></div></Card>
      <Card><div className="section-title"><span><Icon name="heart" /></span><div><h3>Yêu cầu đặc biệt</h3><p>Không bắt buộc. Chúng tôi sẽ cố gắng đáp ứng tốt nhất.</p></div></div><TextArea label="Ghi chú" rows={3} placeholder="Ví dụ: tầng cao, nhận phòng sớm, giường phụ…" value={f.note} onChange={x => setF({ ...f, note: x.target.value })} /></Card>
      <Card className="agree-card"><label className="check"><input type="checkbox" checked={agree} onChange={x => setAgree(x.target.checked)} /><span>Tôi đồng ý với chính sách đặt phòng: hủy miễn phí trước 2 ngày, thanh toán trực tiếp tại quầy.</span></label>{tried && !agree && <p className="form-error">Bạn cần đồng ý với chính sách để tiếp tục.</p>}</Card>
      <div className="form-actions"><Button variant="secondary" icon="back" onClick={() => go('room-detail', { typeId: t.id, in: params.in, out: params.out, guests: params.guests })}>Quay lại</Button><Button disabled={busy} onClick={submit}>{busy ? 'Đang gửi yêu cầu…' : 'Xác nhận đặt phòng'}{!busy && <Icon name="arrow" size={17} />}</Button></div>
    </div>
      <Card className="summary-card checkout-summary"><div className="sum-photo"><img src={t.image} alt="" /><div><b>Phòng {t.name}</b><small>P. {room.no} · Tầng {room.floor}</small></div></div>
        <div className="stay-dates"><div><span>NHẬN PHÒNG</span><b>{fmtDate(params.in)}</b><small>{weekday(params.in)}, 14:00</small></div><i><Icon name="arrow" size={17} /></i><div><span>TRẢ PHÒNG</span><b>{fmtDate(params.out)}</b><small>{weekday(params.out)}, 12:00</small></div></div>
        <div className="summary-line"><span>Số khách</span><b>{params.guests ?? 2} khách</b></div><div className="summary-line"><span>{vnd(t.price)} × {nights} đêm</span><b>{vnd(t.price * nights)}</b></div>
        <div className="summary-total"><span>Tổng cộng</span><strong>{vnd(t.price * nights)}</strong><small>Thanh toán tại quầy khi nhận phòng</small></div></Card></div>
  </PortalShell>
}

/* ───────── Success ───────── */

export function Success({ ctx, bookingId }: { ctx: CCtx; bookingId?: string }) {
  const { store, go } = ctx
  const b = store.bookings.find(x => x.id === bookingId)
  if (!b) return <PortalShell ctx={ctx} view="success"><EmptyState title="Không tìm thấy booking" text="Hãy kiểm tra trong danh sách booking của bạn." action={<Button onClick={() => go('my-bookings')}>Booking của tôi</Button>} /></PortalShell>
  const t = typeOf(store, b.roomNo)
  return <PortalShell ctx={ctx} view="success">
    <Stepper step={3} />
    <div className="success"><div className="success-badge"><Icon name="check" size={34} /></div><h1>Đã gửi yêu cầu đặt phòng!</h1><p>Chúng tôi sẽ xác nhận trong vòng 2 giờ làm việc. Bạn có thể theo dõi trạng thái trong mục “Booking của tôi”.</p>
      <div className="ticket"><div className="ticket-top"><img src={t.image} alt="" /><div><small>MÃ BOOKING</small><b>{b.id}</b><Badge status={b.status} /></div></div>
        <div className="ticket-cut"><i /><i /></div>
        <div className="ticket-grid"><div><span>NHẬN PHÒNG</span><b>{fmtDate(b.in)}</b></div><div><span>TRẢ PHÒNG</span><b>{fmtDate(b.out)}</b></div><div><span>PHÒNG</span><b>P. {b.roomNo} · {t.name}</b></div><div><span>TỔNG CỘNG</span><b className="teal-text">{vnd(totalOf(store, b))}</b></div></div></div>
      <div className="success-actions"><Button onClick={() => go('my-bookings')}>Xem booking của tôi</Button><Button variant="secondary" onClick={() => go('portal')}>Về trang chủ</Button></div></div>
  </PortalShell>
}

/* ───────── My bookings ───────── */

export function MyBookings({ ctx, focusId }: { ctx: CCtx; focusId?: string }) {
  const { store, me, go, notify } = ctx
  const mine = store.bookings.filter(b => b.customerId === me.id)
  const groups = { up: mine.filter(b => (b.status === 'Đang chờ' || b.status === 'Đã xác nhận') && b.out >= TODAY).sort((a, b) => a.in.localeCompare(b.in)), done: mine.filter(b => b.status === 'Đã hoàn thành' || ((b.status === 'Đã xác nhận') && b.out < TODAY)).sort((a, b) => b.in.localeCompare(a.in)), cancelled: mine.filter(b => b.status === 'Đã hủy') }
  const [tab, setTab] = useState<'up' | 'done' | 'cancelled'>('up')
  const [edit, setEdit] = useState<Booking | null>(null)
  const [cancel, setCancel] = useState<Booking | null>(null)
  const [openId, setOpenId] = useState<string | null>(focusId ?? null)
  useEffect(() => { if (focusId) { const g = (['up', 'done', 'cancelled'] as const).find(k => groups[k].some(b => b.id === focusId)); if (g) setTab(g) } }, [focusId])
  const rows = groups[tab]
  return <PortalShell ctx={ctx} view="my-bookings">
    <div className="page-heading"><div><div><span className="eyebrow">TÀI KHOẢN CỦA TÔI</span><h2>Booking của tôi</h2><p>Theo dõi và quản lý các kỳ nghỉ của bạn.</p></div></div><Button icon="plus" onClick={() => go('portal')}>Đặt phòng mới</Button></div>
    <Tabs value={tab} onChange={setTab} items={[{ id: 'up', label: 'Sắp tới', count: groups.up.length }, { id: 'done', label: 'Đã hoàn thành', count: groups.done.length }, { id: 'cancelled', label: 'Đã hủy', count: groups.cancelled.length }]} />
    <div className="ticket-list">{rows.length === 0 ? <EmptyState icon="calendar" title={tab === 'up' ? 'Chưa có kỳ nghỉ sắp tới' : tab === 'done' ? 'Chưa có lịch sử lưu trú' : 'Không có booking nào bị hủy'} text={tab === 'up' ? 'Hãy tìm một căn phòng ưng ý cho chuyến đi tiếp theo.' : 'Các booking phù hợp sẽ xuất hiện ở đây.'} action={tab === 'up' ? <Button onClick={() => go('portal')}>Tìm phòng</Button> : undefined} /> :
      rows.map(b => { const t = typeOf(store, b.roomNo); const n = nightsBetween(b.in, b.out); const pending = b.status === 'Đang chờ'; const open = openId === b.id
        return <Card className={`booking-ticket ${open ? 'open' : ''}`} key={b.id}>
          <div className="ticket-visual"><img src={t.image} alt={`Phòng ${t.name}`} /></div>
          <div className="ticket-info"><div className="ticket-top-row"><Badge status={b.status} /><small>{b.id}</small></div><h3>Phòng {t.name}</h3><p>P. {b.roomNo} · {t.bed} · {b.guests} khách</p>
            <div className="ticket-dates"><div><span>NHẬN PHÒNG</span><b>{fmtDate(b.in)}</b><small>{weekday(b.in)}, 14:00</small></div><Icon name="arrow" /><div><span>TRẢ PHÒNG</span><b>{fmtDate(b.out)}</b><small>{weekday(b.out)}, 12:00</small></div><div><span>TỔNG CỘNG</span><strong>{vnd(totalOf(store, b))}</strong><small>{n} đêm</small></div></div>
            {open && <div className="ticket-more"><div className="detail-row"><span>{vnd(t.price)} × {n} đêm</span><b>{vnd(totalOf(store, b))}</b></div><div className="detail-row"><span>Đặt lúc</span><b>{fmtDate(b.createdAt)}</b></div>{b.note && <div className="note-box"><Icon name="info" size={15} />{b.note}</div>}</div>}</div>
          <div className="ticket-actions"><Button variant="ghost" icon={open ? 'chevron-down' : 'eye'} onClick={() => setOpenId(open ? null : b.id)}>{open ? 'Thu gọn' : 'Chi tiết'}</Button>
            {tab === 'up' && <><Button variant="secondary" icon="edit" disabled={!pending} title={pending ? undefined : 'Booking đã xác nhận, vui lòng liên hệ khách sạn để đổi ngày'} onClick={() => setEdit(b)}>Đổi ngày</Button><Button variant="danger" onClick={() => setCancel(b)}>Hủy booking</Button></>}
            {tab === 'done' && <Button variant="secondary" onClick={() => go('room-detail', { typeId: t.id })}>Đặt lại</Button>}
            {tab === 'up' && !pending && <small className="hint-small">Cần đổi ngày? Gọi 028 3822 1188</small>}</div></Card> })}</div>
    {edit && <ChangeDatesModal store={store} booking={edit} onClose={() => setEdit(null)} onSave={(i, o) => { store.updateBooking(edit.id, { in: i, out: o }); setEdit(null); notify('Đã cập nhật ngày lưu trú') }} />}
    {cancel && <ConfirmDialog danger title="Hủy booking này?" confirmLabel="Hủy booking" text={<>Bạn sắp hủy booking <b>{cancel.id}</b> ({fmtDate(cancel.in)} – {fmtDate(cancel.out)}). Phòng sẽ được trả lại cho khách khác.</>} onClose={() => setCancel(null)} onConfirm={() => { store.updateBooking(cancel.id, { status: 'Đã hủy' }); setCancel(null); notify(`Đã hủy booking ${cancel.id}`) }} />}
  </PortalShell>
}

/* ───────── Profile ───────── */

export function Profile({ ctx }: { ctx: CCtx }) {
  const { store, me, notify } = ctx
  const [f, setF] = useState({ name: me.name, email: me.email, phone: me.phone })
  const [tried, setTried] = useState(false)
  const [pw, setPw] = useState({ cur: '', next: '' }); const [pwErr, setPwErr] = useState('')
  const mine = store.bookings.filter(b => b.customerId === me.id)
  const stays = mine.filter(b => b.status === 'Đã hoàn thành')
  const e = { name: !f.name.trim() ? 'Vui lòng nhập họ tên.' : '', email: !/^\S+@\S+\.\S+$/.test(f.email) ? 'Email chưa hợp lệ.' : '', phone: f.phone.replace(/\D/g, '').length < 9 ? 'Số điện thoại chưa hợp lệ.' : '' }
  return <PortalShell ctx={ctx} view="profile">
    <div className="page-heading"><div><div><span className="eyebrow">TÀI KHOẢN CỦA TÔI</span><h2>Hồ sơ cá nhân</h2><p>Cập nhật thông tin liên hệ và mật khẩu.</p></div></div></div>
    <div className="profile-layout"><Card className="profile-card"><Avatar name={me.name} size={84} /><h3>{me.name}</h3><p>Thành viên từ {fmtDate(me.since)}</p>
      <div className="mini-kpis"><div><b>{mine.length}</b><span>Booking</span></div><div><b>{stays.reduce((s, b) => s + nightsBetween(b.in, b.out), 0)}</b><span>Đêm đã ở</span></div></div></Card>
      <div className="form-stack"><Card><div className="section-title"><span><Icon name="user" /></span><div><h3>Thông tin cá nhân</h3><p>Dùng để liên hệ khi xác nhận booking.</p></div></div>
        <div className="form-grid"><div className="span-2"><Field label="Họ và tên" value={f.name} onChange={x => setF({ ...f, name: x.target.value })} error={tried ? e.name : ''} /></div><Field label="Email" icon="mail" value={f.email} onChange={x => setF({ ...f, email: x.target.value })} error={tried ? e.email : ''} /><Field label="Số điện thoại" icon="phone" value={f.phone} onChange={x => setF({ ...f, phone: x.target.value })} error={tried ? e.phone : ''} /></div>
        <div className="form-actions end"><Button onClick={() => { setTried(true); if (e.name || e.email || e.phone) return; store.updateCustomer(me.id, f); notify('Đã lưu hồ sơ') }}>Lưu thay đổi</Button></div></Card>
        <Card><div className="section-title"><span><Icon name="lock" /></span><div><h3>Đổi mật khẩu</h3><p>Nên dùng mật khẩu khác với các dịch vụ khác.</p></div></div>
          <div className="form-grid"><Field label="Mật khẩu hiện tại" type="password" value={pw.cur} onChange={x => setPw({ ...pw, cur: x.target.value })} /><Field label="Mật khẩu mới" type="password" hint="Tối thiểu 8 ký tự" value={pw.next} onChange={x => setPw({ ...pw, next: x.target.value })} error={pwErr} /></div>
          <div className="form-actions end"><Button variant="secondary" onClick={() => { if (!pw.cur || pw.next.length < 8) return setPwErr('Nhập mật khẩu hiện tại và mật khẩu mới từ 8 ký tự.'); setPwErr(''); setPw({ cur: '', next: '' }); notify('Đã đổi mật khẩu') }}>Cập nhật mật khẩu</Button></div></Card></div></div>
  </PortalShell>
}

/* ───────── Support ───────── */

const FAQ: [string, string][] = [
  ['Tôi có thể hủy hoặc đổi ngày booking không?', 'Bạn có thể tự đổi ngày khi booking đang chờ xác nhận. Booking đã xác nhận cần liên hệ khách sạn. Hủy miễn phí trước ngày nhận phòng 2 ngày.'],
  ['Khi nào tôi cần thanh toán?', 'Havenly không thu tiền trực tuyến. Bạn thanh toán trực tiếp tại quầy lễ tân khi nhận phòng.'],
  ['Giờ nhận và trả phòng là khi nào?', 'Nhận phòng từ 14:00 và trả phòng trước 12:00. Nếu cần nhận sớm hoặc trả muộn, hãy ghi chú khi đặt phòng.'],
  ['Bao lâu thì booking được xác nhận?', 'Thường trong 2 giờ làm việc (08:00 – 21:00). Bạn sẽ thấy trạng thái cập nhật trong mục Booking của tôi.'],
  ['Khách sạn có chỗ đậu xe không?', 'Có, bãi xe trong hầm miễn phí cho khách lưu trú, vui lòng báo lễ tân khi đến.'],
]

export function Support({ ctx }: { ctx: CCtx }) {
  const { notify, me } = ctx
  const [open, setOpen] = useState(0)
  const [msg, setMsg] = useState({ subject: '', body: '' }); const [tried, setTried] = useState(false)
  return <PortalShell ctx={ctx} view="support">
    <div className="page-heading"><div><div><span className="eyebrow">TRUNG TÂM TRỢ GIÚP</span><h2>Chúng tôi có thể giúp gì?</h2><p>Câu trả lời nhanh cho các thắc mắc thường gặp, hoặc liên hệ trực tiếp.</p></div></div></div>
    <div className="support-layout"><div><div className="contact-row"><div><span><Icon name="phone" size={20} /></span><b>Hotline 24/7</b><small>028 3822 1188</small></div><div><span><Icon name="mail" size={20} /></span><b>Email</b><small>xinchao@havenly.vn</small></div><div><span><Icon name="pin" size={20} /></span><b>Địa chỉ</b><small>27 Nguyễn Huệ, Q.1</small></div></div>
      <h3 className="faq-title">Câu hỏi thường gặp</h3><div className="faq">{FAQ.map(([q, a], k) => <div key={q} className={open === k ? 'open' : ''}><button aria-expanded={open === k} onClick={() => setOpen(open === k ? -1 : k)}>{q}<Icon name="chevron-down" size={18} /></button>{open === k && <p>{a}</p>}</div>)}</div></div>
      <Card className="msg-card"><h3>Gửi tin nhắn cho chúng tôi</h3><p>Phản hồi trong vòng 2 giờ làm việc.</p>
        <Field label="Chủ đề" value={msg.subject} onChange={e => setMsg({ ...msg, subject: e.target.value })} error={tried && !msg.subject.trim() ? 'Vui lòng nhập chủ đề.' : ''} /><TextArea label="Nội dung" rows={5} value={msg.body} onChange={e => setMsg({ ...msg, body: e.target.value })} />{tried && !msg.body.trim() && <p className="form-error">Vui lòng nhập nội dung.</p>}
        <Button className="full" onClick={() => { setTried(true); if (!msg.subject.trim() || !msg.body.trim()) return; setMsg({ subject: '', body: '' }); setTried(false); notify(`Cảm ơn ${me.name.split(' ').slice(-1)[0]}, chúng tôi đã nhận tin nhắn`) }}>Gửi tin nhắn</Button></Card></div>
  </PortalShell>
}
