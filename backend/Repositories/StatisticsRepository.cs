using HotelBookingAPI.Data;
using HotelBookingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelBookingAPI.Repositories;

public class StatisticsRepository : IStatisticsRepository
{
    private readonly HotelDbContext _context;

    public StatisticsRepository(HotelDbContext context)
    {
        _context = context;
    }

    public async Task<SummaryData> GetSummaryAsync()
    {
        var totalRooms = await _context.Rooms.CountAsync();
        var totalCustomers = await _context.Customers.CountAsync();
        var totalBookings = await _context.Bookings.CountAsync();

        var totalRevenue = await _context.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed)
            .SumAsync(b => (decimal?)b.TotalPrice) ?? 0;

        return new SummaryData(totalRooms, totalCustomers, totalBookings, totalRevenue);
    }

    public async Task<List<MonthlyRevenueRow>> GetRevenueByMonthAsync(int year)
    {
        var data = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status == BookingStatus.Confirmed && b.CheckInDate.Year == year)
            .GroupBy(b => b.CheckInDate.Month)
            .Select(g => new
            {
                Month = g.Key,
                TotalBookings = g.Count(),
                Revenue = g.Sum(b => b.TotalPrice)
            })
            .ToListAsync();

        return data
            .Select(d => new MonthlyRevenueRow(d.Month, d.TotalBookings, d.Revenue))
            .ToList();
    }

    public async Task<List<BookingStatusRow>> GetBookingsByStatusAsync()
    {
        var data = await _context.Bookings
            .AsNoTracking()
            .GroupBy(b => b.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        return data
            .Select(d => new BookingStatusRow(d.Status.ToString(), d.Count))
            .ToList();
    }

    public async Task<List<TopRoomRow>> GetTopRoomsAsync(int top)
    {
        var data = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => new
            {
                b.RoomId,
                b.Room!.RoomNumber,
                RoomTypeName = b.Room.RoomType!.Name
            })
            .Select(g => new
            {
                g.Key.RoomId,
                g.Key.RoomNumber,
                g.Key.RoomTypeName,
                TotalBookings = g.Count(),
                Revenue = g.Sum(b => b.TotalPrice)
            })
            .OrderByDescending(x => x.TotalBookings)
            .ThenByDescending(x => x.Revenue)
            .Take(top)
            .ToListAsync();

        var topRoomIds = data.Select(d => d.RoomId).ToArray();
        var bookingDates = topRoomIds.Length == 0
            ? []
            : await _context.Bookings
                .AsNoTracking()
                .Where(b => b.Status != BookingStatus.Cancelled && topRoomIds.Contains(b.RoomId))
                .Select(b => new { b.RoomId, b.CheckInDate, b.CheckOutDate })
                .ToListAsync();

        var totalNightsByRoom = bookingDates
            .GroupBy(b => b.RoomId)
            .ToDictionary(
                group => group.Key,
                group => group.Sum(b => (b.CheckOutDate - b.CheckInDate).Days));

        return data
            .Select(d => new TopRoomRow(
                d.RoomId,
                d.RoomNumber,
                d.RoomTypeName,
                d.TotalBookings,
                totalNightsByRoom.GetValueOrDefault(d.RoomId),
                d.Revenue))
            .ToList();
    }

    public async Task<List<TopCustomerRow>> GetTopCustomersAsync(int top)
    {
        var data = await _context.Bookings
            .AsNoTracking()
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => new { b.CustomerId, b.Customer!.FullName })
            .Select(g => new
            {
                g.Key.CustomerId,
                g.Key.FullName,
                TotalBookings = g.Count(),
                TotalSpent = g.Sum(b => b.TotalPrice)
            })
            .OrderByDescending(x => x.TotalSpent)
            .ThenByDescending(x => x.TotalBookings)
            .Take(top)
            .ToListAsync();

        return data
            .Select(d => new TopCustomerRow(
                d.CustomerId,
                d.FullName,
                d.TotalBookings,
                d.TotalSpent))
            .ToList();
    }
}