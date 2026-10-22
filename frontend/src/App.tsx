import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Booking, CURRENT_CUSTOMER_ID, Customer, NavParams, Room, RoomType, Store, TODAY, View, fmtDate, initialBookings, initialCustomers,
  initialRooms, roomTypes, weekday, IMG,
} from './data'
import { Icon } from './ui'
import { Login } from './auth'
import { BookingDrawer, BookingsPage, CalendarPage, CreateBooking, CustomersPage, Dashboard, Header, NotificationPanel, ReportsPage, RoomTypesPage, RoomsPage, SearchPalette, SettingsPage, Sidebar, Ctx } from './admin'
import { Checkout, MyBookings, Portal, Profile, RoomDetail, Success, Support } from './customer'

const ADMIN_VIEWS: View[] = ['dashboard', 'bookings', 'create-booking', 'calendar', 'rooms', 'room-types', 'customers', 'reports', 'settings']

const TITLES: Partial<Record<View, [string, string]>> = {
  dashboard: ['Tổng quan', `${weekday(TODAY)}, ${fmtDate(TODAY)}`],
  bookings: ['Đặt phòng', 'Quản lý booking'],
  'create-booking': ['Đặt phòng', 'Tạo booking mới'],
  calendar: ['Lịch phòng', 'Tình trạng phòng theo ngày'],
  rooms: ['Phòng', 'Quản lý phòng'],
  'room-types': ['Loại phòng', 'Danh mục loại phòng'],
  customers: ['Khách hàng', 'Quản lý khách hàng'],
  reports: ['Báo cáo', 'Hiệu quả kinh doanh'],
  settings: ['Cài đặt', 'Khách sạn & tài khoản'],
}

function useStore(): Store {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [types, setTypes] = useState<RoomType[]>(roomTypes)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const seq = useRef(240700)
  return useMemo<Store>(() => ({
    bookings, rooms, types, customers,
    addBooking: x => {
      const b: Booking = { ...x, id: `BK-${++seq.current}`, createdAt: `${TODAY}T10:30` }
      setBookings(p => [b, ...p]); return b
    },
    updateBooking: (id, patch) => setBookings(p => p.map(b => (b.id === id ? { ...b, ...patch } : b))),
    addRoom: r => setRooms(p => [...p, r].sort((a, b) => a.no.localeCompare(b.no))),
    updateRoom: (no, patch) => setRooms(p => p.map(r => (r.no === no ? { ...r, ...patch } : r))),
    addCustomer: c => {
      const n: Customer = { ...c, id: `c${Date.now()}`, since: TODAY }
      setCustomers(p => [n, ...p]); return n
    },
    updateCustomer: (id, patch) => setCustomers(p => p.map(c => (c.id === id ? { ...c, ...patch } : c))),
    updateType: (id, patch) => setTypes(p => p.map(t => (t.id === id ? { ...t, ...patch } : t))),
    addType: t => setTypes(p => [...p, { ...t, id: `t${Date.now()}`, image: IMG.deluxe, gallery: [IMG.deluxe, IMG.bath, IMG.city] }]),
  }), [bookings, rooms, types, customers])
}

export default function App() {
  const store = useStore()
  const [view, setView] = useState<View>('login')
  const [params, setParams] = useState<NavParams>({})
  const [meId, setMeId] = useState(CURRENT_CUSTOMER_ID)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | undefined>()
  const [toast, setToast] = useState('')
  const [menu, setMenu] = useState(false)
  const [palette, setPalette] = useState(false)
  const [notif, setNotif] = useState(false)
  const timer = useRef<number>(0)

  const notify = useCallback((text: string) => {
    setToast(text); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(''), 3000)
  }, [])

  const go = useCallback((v: View, p: NavParams = {}) => {
    setView(v); setParams(p); setMenu(false)
    setDrawerId(v === 'bookings' ? p.bookingId ?? null : null)
    setProfileId(v === 'customers' ? p.customerId : undefined)
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && ADMIN_VIEWS.includes(view)) { e.preventDefault(); setPalette(p => !p) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [view])

  const me = store.customers.find(c => c.id === meId) ?? store.customers[0]
  const ctx: Ctx = { store, go, notify }
  const logout = () => { setView('login'); setParams({}); setDrawerId(null); setNotif(false) }
  const toastEl = toast && <div className="toast" role="status"><Icon name="check" />{toast}</div>

  if (view === 'login') return <><Login store={store} onLogin={(role, id) => { if (id) setMeId(id); go(role === 'admin' ? 'dashboard' : 'portal') }} />{toastEl}</>

  if (!ADMIN_VIEWS.includes(view)) {
    const cctx = { store, me, go, notify, logout }
    return <>
      {view === 'portal' && <Portal ctx={cctx} preset={params} key={JSON.stringify(params)} />}
      {view === 'room-detail' && <RoomDetail ctx={cctx} params={params} key={JSON.stringify(params)} />}
      {view === 'checkout' && <Checkout ctx={cctx} params={params} />}
      {view === 'success' && <Success ctx={cctx} bookingId={params.bookingId} />}
      {view === 'my-bookings' && <MyBookings ctx={cctx} focusId={params.bookingId} />}
      {view === 'profile' && <Profile ctx={cctx} />}
      {view === 'support' && <Support ctx={cctx} />}
      {toastEl}
    </>
  }

  const [title, subtitle] = TITLES[view] ?? ['Havenly', 'Quản lý khách sạn']
  const pending = store.bookings.filter(b => b.status === 'Đang chờ').length
  const openBooking = (id: string) => setDrawerId(id)
  return <div className="app-shell">
    <Sidebar view={view} go={go} open={menu} close={() => setMenu(false)} pending={pending} />
    {menu && <div className="menu-overlay" onClick={() => setMenu(false)} />}
    <div className="app-main">
      <Header title={title} subtitle={subtitle} onMenu={() => setMenu(true)} onLogout={logout} onSearch={() => setPalette(true)} notifications={pending} onNotifications={() => setNotif(true)} />
      <main className="content" key={view}>
        {view === 'dashboard' && <Dashboard ctx={ctx} open={openBooking} />}
        {view === 'bookings' && <BookingsPage ctx={ctx} open={openBooking} />}
        {view === 'create-booking' && <CreateBooking ctx={ctx} preset={params} />}
        {view === 'calendar' && <CalendarPage ctx={ctx} open={openBooking} />}
        {view === 'rooms' && <RoomsPage ctx={ctx} />}
        {view === 'room-types' && <RoomTypesPage ctx={ctx} />}
        {view === 'customers' && <CustomersPage ctx={ctx} open={id => setProfileId(id)} openId={profileId} closeProfile={() => setProfileId(undefined)} />}
        {view === 'reports' && <ReportsPage ctx={ctx} />}
        {view === 'settings' && <SettingsPage ctx={ctx} />}
      </main>
    </div>
    {drawerId && <BookingDrawer ctx={ctx} bookingId={drawerId} close={() => setDrawerId(null)} />}
    {palette && <SearchPalette store={store} go={go} close={() => setPalette(false)} />}
    {notif && <NotificationPanel store={store} go={go} close={() => setNotif(false)} />}
    {toastEl}
  </div>
}
