import type { IconName } from './ui'

export type BookingStatus = 'Đang chờ' | 'Đã xác nhận' | 'Đã hủy' | 'Đã hoàn thành'
export type TypeId = string
export type View = 'login' | 'dashboard' | 'bookings' | 'create-booking' | 'calendar' | 'rooms' | 'room-types' | 'customers' | 'reports' | 'settings' | 'portal' | 'room-detail' | 'checkout' | 'success' | 'my-bookings' | 'profile' | 'support'
export interface NavParams { roomNo?: string; typeId?: TypeId; in?: string; out?: string; guests?: number; bookingId?: string; customerId?: string; searched?: boolean }

export interface RoomType { id: TypeId; name: string; desc: string; price: number; capacity: number; size: number; view: string; bed: string; image: string; gallery: string[]; tagline: string }
export interface Room { no: string; type: TypeId; floor: number; status: 'Available' | 'Maintenance'; amenities: IconName[] }
export interface Customer { id: string; name: string; email: string; phone: string; since: string }
export interface Booking { id: string; customerId: string; roomNo: string; in: string; out: string; status: BookingStatus; createdAt: string; guests: number; note?: string }

export const TODAY = '2025-06-24'
export const CURRENT_CUSTOMER_ID = 'c1'

const u = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=80`
export const IMG = {
  standard: u('1512918728675-ed5a9ecdebfd'),
  superior: u('1631049552057-403cdb8f0658'),
  deluxe: u('1731336478850-6bce7235e320'),
  suite: u('1631049307290-bb947b114627'),
  city: u('1777169794972-12095816073b', 1400),
  bath: u('1704731529088-19083feb5b43'),
  window: u('1578898886225-c7c894047899'),
  hero: u('1631049552057-403cdb8f0658', 1800),
}

export const roomTypes: RoomType[] = [
  { id: 'standard', name: 'Standard', desc: 'Phòng tiện nghi cơ bản, gọn gàng và yên tĩnh, phù hợp chuyến đi ngắn.', tagline: 'Gọn gàng, yên tĩnh', price: 700000, capacity: 2, size: 24, view: 'Hướng nội khu', bed: '1 giường đôi', image: IMG.standard, gallery: [IMG.standard, IMG.bath, IMG.window] },
  { id: 'superior', name: 'Superior', desc: 'Không gian rộng rãi hơn với cửa sổ lớn và tầm nhìn ra thành phố.', tagline: 'Thoáng sáng, nhìn ra phố', price: 950000, capacity: 2, size: 30, view: 'Hướng thành phố', bed: '1 giường đôi lớn', image: IMG.superior, gallery: [IMG.superior, IMG.window, IMG.bath] },
  { id: 'deluxe', name: 'Deluxe', desc: 'Nội thất gỗ ấm, bồn tắm riêng và góc làm việc yên tĩnh.', tagline: 'Gỗ ấm, bồn tắm riêng', price: 1250000, capacity: 3, size: 38, view: 'Hướng thành phố', bed: '1 giường king', image: IMG.deluxe, gallery: [IMG.deluxe, IMG.bath, IMG.city] },
  { id: 'suite', name: 'Suite', desc: 'Phòng khách riêng biệt, phòng ngủ tách rời, tầm nhìn toàn cảnh.', tagline: 'Phòng khách riêng, toàn cảnh', price: 1800000, capacity: 4, size: 62, view: 'Toàn cảnh thành phố', bed: '1 giường king + sofa bed', image: IMG.suite, gallery: [IMG.suite, IMG.city, IMG.bath] },
]

const A: Record<TypeId, IconName[]> = {
  standard: ['wifi', 'snow'],
  superior: ['wifi', 'snow', 'tv'],
  deluxe: ['wifi', 'snow', 'tv', 'bath'],
  suite: ['wifi', 'snow', 'tv', 'bath'],
}
const mk = (no: string, type: TypeId, status: Room['status'] = 'Available'): Room => ({ no, type, floor: Number(no[0]), status, amenities: A[type] })

export const initialRooms: Room[] = [
  mk('201', 'standard'), mk('202', 'standard'), mk('203', 'standard', 'Maintenance'), mk('204', 'standard'),
  mk('301', 'superior'), mk('302', 'superior'), mk('305', 'superior'), mk('306', 'superior', 'Maintenance'),
  mk('401', 'deluxe'), mk('402', 'deluxe'), mk('501', 'deluxe'), mk('502', 'deluxe'),
  mk('701', 'suite'), mk('708', 'suite', 'Maintenance'),
]

export const initialCustomers: Customer[] = [
  { id: 'c1', name: 'Nguyễn Minh Anh', email: 'minhanh@gmail.com', phone: '090 123 4567', since: '2023-12-04' },
  { id: 'c2', name: 'Trần Quốc Huy', email: 'quochuy@gmail.com', phone: '091 888 2233', since: '2024-02-18' },
  { id: 'c3', name: 'Lê Thảo Vy', email: 'thaovy@gmail.com', phone: '093 552 6611', since: '2023-08-22' },
  { id: 'c4', name: 'Phạm Hoàng Nam', email: 'hoangnam@gmail.com', phone: '098 441 9900', since: '2024-05-09' },
  { id: 'c5', name: 'Đỗ Ngọc Linh', email: 'ngoclinh@gmail.com', phone: '097 220 3141', since: '2024-01-30' },
  { id: 'c6', name: 'Võ Đức Khang', email: 'duckhang@gmail.com', phone: '090 667 1288', since: '2024-09-12' },
  { id: 'c7', name: 'Bùi Mai Phương', email: 'maiphuong@gmail.com', phone: '092 390 7745', since: '2025-03-02' },
  { id: 'c8', name: 'Hoàng Gia Bảo', email: 'giabao@gmail.com', phone: '096 118 5520', since: '2025-04-15' },
]

const b = (id: string, customerId: string, roomNo: string, i: string, o: string, status: BookingStatus, createdAt: string, guests = 2, note?: string): Booking => ({ id, customerId, roomNo, in: i, out: o, status, createdAt, guests, note })

export const initialBookings: Booking[] = [
  b('BK-240625', 'c1', '502', '2025-06-26', '2025-06-29', 'Đang chờ', '2025-06-24T09:24', 2, 'Tầng cao, yên tĩnh. Đến khoảng 15:00.'),
  b('BK-240624', 'c2', '305', '2025-06-25', '2025-06-27', 'Đã xác nhận', '2025-06-23T16:10'),
  b('BK-240623', 'c3', '708', '2025-06-24', '2025-06-28', 'Đã xác nhận', '2025-06-20T11:02', 3),
  b('BK-240622', 'c4', '204', '2025-06-23', '2025-06-25', 'Đã hủy', '2025-06-19T08:40'),
  b('BK-240621', 'c5', '401', '2025-06-22', '2025-06-24', 'Đã xác nhận', '2025-06-18T14:25'),
  b('BK-240620', 'c6', '302', '2025-06-20', '2025-06-23', 'Đã hoàn thành', '2025-06-14T10:00'),
  b('BK-240619', 'c7', '201', '2025-06-28', '2025-06-30', 'Đang chờ', '2025-06-24T07:55', 1),
  b('BK-240618', 'c8', '701', '2025-06-27', '2025-07-02', 'Đã xác nhận', '2025-06-21T19:30', 4),
  b('BK-240616', 'c2', '402', '2025-06-29', '2025-07-01', 'Đang chờ', '2025-06-24T08:12'),
  b('BK-240615', 'c3', '501', '2025-06-15', '2025-06-17', 'Đã hoàn thành', '2025-06-08T13:00'),
  b('BK-240614', 'c5', '202', '2025-06-24', '2025-06-26', 'Đã xác nhận', '2025-06-22T17:45', 2),
  b('BK-240613', 'c1', '401', '2025-07-10', '2025-07-13', 'Đã xác nhận', '2025-06-12T21:05', 2),
  b('BK-240610', 'c1', '301', '2025-06-05', '2025-06-07', 'Đã hủy', '2025-05-30T09:15'),
  b('BK-250412', 'c1', '305', '2025-04-12', '2025-04-14', 'Đã hoàn thành', '2025-04-02T10:30'),
]

export interface Store {
  bookings: Booking[]; rooms: Room[]; types: RoomType[]; customers: Customer[]
  addBooking: (x: Omit<Booking, 'id' | 'createdAt'>) => Booking
  updateBooking: (id: string, patch: Partial<Booking>) => void
  addRoom: (r: Room) => void
  updateRoom: (no: string, patch: Partial<Room>) => void
  addCustomer: (c: Omit<Customer, 'id' | 'since'>) => Customer
  updateType: (id: TypeId, patch: Partial<RoomType>) => void
  addType: (t: Omit<RoomType, 'id' | 'gallery' | 'image'>) => void
  updateCustomer: (id: string, patch: Partial<Customer>) => void
}

export const vnd = (n: number) => n.toLocaleString('vi-VN') + ' ₫'
export const fmtDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}` }
export const fmtTime = (iso: string) => iso.slice(11, 16)
export const nightsBetween = (a: string, b: string) => Math.max(0, Math.round((Date.parse(b) - Date.parse(a)) / 86400000))
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const weekday = (iso: string) => WD[new Date(iso + 'T00:00:00Z').getUTCDay()]
export const shortWeekday = (iso: string) => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(iso + 'T00:00:00Z').getUTCDay()]

export const typeOf = (s: Pick<Store, 'rooms' | 'types'>, roomNo: string) => {
  const room = s.rooms.find(r => r.no === roomNo)
  return s.types.find(t => t.id === room?.type) ?? s.types[0]
}
export const totalOf = (s: Pick<Store, 'rooms' | 'types'>, bk: Booking) => nightsBetween(bk.in, bk.out) * typeOf(s, bk.roomNo).price
export const typeCount = (s: Pick<Store, 'rooms'>, id: TypeId) => s.rooms.filter(r => r.type === id).length

export const overlaps = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2
export function availableRooms(s: Pick<Store, 'rooms' | 'bookings'>, i: string, o: string, type?: TypeId | 'all', ignoreBookingId?: string) {
  return s.rooms.filter(r => r.status === 'Available' && (!type || type === 'all' || r.type === type) &&
    !s.bookings.some(k => k.roomNo === r.no && k.id !== ignoreBookingId && (k.status === 'Đang chờ' || k.status === 'Đã xác nhận') && overlaps(i, o, k.in, k.out)))
}

export const revenueByMonth = [38, 46, 52, 61, 58, 74, 82, 91, 77, 88, 102, 118]
export const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
