using HotelBookingAPI.Data;
using HotelBookingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelBookingAPI.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly HotelDbContext _context;

    public CustomerRepository(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<List<CustomerWithBookingCount>> GetAllAsync(string? keyword)
    {
        var query = _context.Customers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(x =>
                x.FullName.Contains(keyword) ||
                x.Email.Contains(keyword) ||
                (x.Phone != null && x.Phone.Contains(keyword)));
        }

        // Bookings.Count được EF dịch thành COUNT trong SQL, không tải booking lên
        var data = await query
            .OrderBy(x => x.FullName)
            .Select(x => new { Customer = x, TotalBookings = x.Bookings.Count })
            .ToListAsync();

        return data
            .Select(d => new CustomerWithBookingCount(d.Customer, d.TotalBookings))
            .ToList();
    }

    public async Task<CustomerWithBookingCount?> GetByIdWithCountAsync(int id)
    {
        var data = await _context.Customers
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new { Customer = x, TotalBookings = x.Bookings.Count })
            .FirstOrDefaultAsync();

        return data == null
            ? null
            : new CustomerWithBookingCount(data.Customer, data.TotalBookings);
    }

    public async Task<Customer?> GetForUpdateAsync(int id) =>
        await _context.Customers.FindAsync(id);

    // excludeId dùng khi cập nhật: bỏ qua chính khách hàng đang sửa
    public async Task<bool> EmailExistsAsync(string email, int? excludeId = null) =>
        await _context.Customers.AnyAsync(x =>
            x.Email == email && (excludeId == null || x.Id != excludeId));

    public async Task<bool> HasBookingsAsync(int customerId) =>
        await _context.Bookings.AnyAsync(x => x.CustomerId == customerId);

    public async Task AddAsync(Customer entity) =>
        await _context.Customers.AddAsync(entity);

    public void Remove(Customer entity) =>
        _context.Customers.Remove(entity);

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}