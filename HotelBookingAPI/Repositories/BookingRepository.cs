using HotelBookingAPI.Common;
using HotelBookingAPI.Data;
using HotelBookingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelBookingAPI.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly HotelDbContext _context;

    public BookingRepository(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<List<Booking>> GetAllAsync(BookingFilter filter)
    {
        var query = _context.Bookings.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Status))
            query = query.Where(x => x.Status == filter.Status);

        if (filter.CustomerId.HasValue)
            query = query.Where(x => x.CustomerId == filter.CustomerId.Value);

        if (filter.RoomId.HasValue)
            query = query.Where(x => x.RoomId == filter.RoomId.Value);

        if (filter.From.HasValue)
            query = query.Where(x => x.CheckInDate >= filter.From.Value.Date);

        if (filter.To.HasValue)
            query = query.Where(x => x.CheckInDate <= filter.To.Value.Date);

        return await query
            .OrderByDescending(x => x.CheckInDate)
            .Include(x => x.Customer)
            .Include(x => x.Room)
                .ThenInclude(r => r!.RoomType)
            .ToListAsync();
    }

    public async Task<Booking?> GetByIdAsync(int id) =>
        await _context.Bookings
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Room)
                .ThenInclude(r => r!.RoomType)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<Booking?> GetForUpdateAsync(int id) =>
        await _context.Bookings.FindAsync(id);

    public async Task<Booking?> GetForUpdateWithRoomAsync(int id) =>
        await _context.Bookings
            .Include(x => x.Room)
                .ThenInclude(r => r!.RoomType)
            .FirstOrDefaultAsync(x => x.Id == id);

    public async Task<List<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? roomTypeId)
    {
        var query = _context.Rooms
            .AsNoTracking()
            .Where(r => r.Status == "Available")
            // Loại các phòng đã có booking trùng khoảng ngày (bỏ qua booking đã hủy)
            .Where(r => !r.Bookings.Any(b =>
                b.Status != "Cancelled" &&
                b.CheckInDate < checkOut &&
                b.CheckOutDate > checkIn));

        if (roomTypeId.HasValue)
            query = query.Where(r => r.RoomTypeId == roomTypeId.Value);

        return await query
            .OrderBy(r => r.RoomNumber)
            .Include(r => r.RoomType)
            .Include(r => r.Amenities)
            .ToListAsync();
    }

    public async Task<bool> CustomerExistsAsync(int customerId) =>
        await _context.Customers.AnyAsync(x => x.Id == customerId);

    public async Task<Room?> GetRoomWithTypeAsync(int roomId) =>
        await _context.Rooms
            .AsNoTracking()
            .Include(x => x.RoomType)
            .FirstOrDefaultAsync(x => x.Id == roomId);

    // Công thức trùng lịch: existing.CheckIn < new.CheckOut && existing.CheckOut > new.CheckIn
    public async Task<bool> HasOverlapAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId = null) =>
        await _context.Bookings.AnyAsync(b =>
            b.RoomId == roomId &&
            b.Status != "Cancelled" &&
            (excludeBookingId == null || b.Id != excludeBookingId) &&
            b.CheckInDate < checkOut &&
            b.CheckOutDate > checkIn);

    public async Task AddAsync(Booking entity) =>
        await _context.Bookings.AddAsync(entity);

    public void Remove(Booking entity) =>
        _context.Bookings.Remove(entity);

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}