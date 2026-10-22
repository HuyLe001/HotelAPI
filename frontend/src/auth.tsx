import { FormEvent, useState } from 'react'
import { Brand, Button, Field, Icon } from './ui'
import { IMG, Store } from './data'

export function Login({ store, onLogin }: { store: Store; onLogin: (role: 'admin' | 'customer', customerId?: string) => void }) {
  const [role, setRole] = useState<'admin' | 'customer'>('admin')
  const [register, setRegister] = useState(false)
  const [show, setShow] = useState(false)
  const [f, setF] = useState({ name: '', email: 'admin@havenly.vn', phone: '', password: '123456', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: '', form: '' }) }

  const pick = (r: 'admin' | 'customer') => { setRole(r); setErrors({}); setRegister(false); setF({ ...f, email: r === 'admin' ? 'admin@havenly.vn' : 'minhanh@gmail.com', password: '123456' }) }

  const submit = (ev: FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    if (register && !f.name.trim()) e.name = 'Vui lòng nhập họ và tên.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Vui lòng nhập email hợp lệ.'
    if (register && f.phone.replace(/\D/g, '').length < 9) e.phone = 'Số điện thoại chưa hợp lệ.'
    if (!f.password) e.password = 'Mật khẩu không được để trống.'
    else if (f.password.length < (register ? 8 : 6)) e.password = `Mật khẩu tối thiểu ${register ? 8 : 6} ký tự.`
    if (register && f.confirm !== f.password) e.confirm = 'Mật khẩu nhập lại không khớp.'
    if (!Object.keys(e).length) {
      if (register && store.customers.some(c => c.email === f.email)) e.email = 'Email này đã được đăng ký.'
      else if (!register && role === 'admin' && f.email !== 'admin@havenly.vn') e.form = 'Tài khoản quản trị không tồn tại. Dùng admin@havenly.vn.'
      else if (!register && role === 'customer' && !store.customers.some(c => c.email === f.email)) e.form = 'Không tìm thấy tài khoản khách hàng. Hãy đăng ký hoặc dùng minhanh@gmail.com.'
    }
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setTimeout(() => {
      if (register) { const c = store.addCustomer({ name: f.name.trim(), email: f.email, phone: f.phone }); onLogin('customer', c.id) }
      else onLogin(role, store.customers.find(c => c.email === f.email)?.id)
    }, 650)
  }

  return <div className="login-page">
    <section className="login-visual"><img src={IMG.city} alt="" /><div className="login-shade" /><Brand />
      <div className="login-copy"><span className="eyebrow">HOTEL MANAGEMENT, SIMPLIFIED</span><h1>Vận hành tinh gọn.<br /><em>Trải nghiệm trọn vẹn.</em></h1><p>Một nền tảng duy nhất để quản lý phòng, booking và chăm sóc khách hàng tốt hơn mỗi ngày.</p>
        <div className="login-stats"><div><b>98%</b><span>Tỷ lệ hài lòng</span></div><div><b>2 giờ</b><span>Xác nhận trung bình</span></div><div><b>14</b><span>Phòng quản lý</span></div></div></div>
      <div className="quote"><p>“Havenly giúp đội ngũ của chúng tôi tiết kiệm hàng giờ vận hành mỗi ngày.”</p><div><span className="avatar">LT</span><b>Linh Trần <small>Quản lý khách sạn</small></b></div></div></section>
    <section className="login-form-wrap"><div className="mobile-brand"><Brand dark /></div>
      <form onSubmit={submit} noValidate><span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span><h2>{register ? 'Tạo tài khoản khách hàng' : 'Đăng nhập vào Havenly'}</h2><p>{register ? 'Đặt phòng nhanh hơn và quản lý các kỳ nghỉ của bạn.' : 'Chọn vai trò và nhập thông tin để tiếp tục.'}</p>
        {!register && <div className="seg role-seg" role="tablist"><button type="button" role="tab" aria-selected={role === 'admin'} className={role === 'admin' ? 'on' : ''} onClick={() => pick('admin')}><Icon name="settings" size={16} />Quản trị viên</button><button type="button" role="tab" aria-selected={role === 'customer'} className={role === 'customer' ? 'on' : ''} onClick={() => pick('customer')}><Icon name="user" size={16} />Khách hàng</button></div>}
        {errors.form && <div className="info-note danger" role="alert"><Icon name="alert" size={16} />{errors.form}</div>}
        {register && <Field label="Họ và tên" placeholder="Nguyễn Minh Anh" icon="user" value={f.name} onChange={set('name')} error={errors.name} />}
        <Field label="Email" type="email" placeholder="ban@email.com" icon="mail" value={f.email} onChange={set('email')} error={errors.email} />
        {register && <Field label="Số điện thoại" placeholder="090 123 4567" icon="phone" value={f.phone} onChange={set('phone')} error={errors.phone} />}
        <label className="field"><span>Mật khẩu</span><div className={`input-wrap ${errors.password ? 'invalid' : ''}`}><Icon name="lock" size={18} /><input type={show ? 'text' : 'password'} placeholder={register ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'} value={f.password} onChange={set('password')} /><button type="button" className="eye" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(!show)}><Icon name="eye" size={18} /></button></div>{errors.password && <small>{errors.password}</small>}</label>
        {register && <Field label="Nhập lại mật khẩu" type="password" icon="lock" value={f.confirm} onChange={set('confirm')} error={errors.confirm} />}
        {!register && <div className="form-options"><label><input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập</label><button type="button">Quên mật khẩu?</button></div>}
        <Button type="submit" className="full" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Đăng ký' : 'Đăng nhập'}{!busy && <Icon name="arrow" size={17} />}</Button>
        {role === 'customer' && <p className="switch-auth">{register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" onClick={() => { setRegister(!register); setErrors({}); setF({ ...f, email: register ? 'minhanh@gmail.com' : '', password: register ? '123456' : '', name: '', phone: '', confirm: '' }) }}>{register ? 'Đăng nhập' : 'Đăng ký ngay'}</button></p>}
        <div className="demo-box"><b>Tài khoản demo</b><span>{role === 'admin' ? 'admin@havenly.vn · mật khẩu bất kỳ từ 6 ký tự' : 'minhanh@gmail.com · mật khẩu bất kỳ từ 6 ký tự'}</span></div>
      </form></section>
  </div>
}
