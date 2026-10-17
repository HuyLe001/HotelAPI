using HotelBookingAPI.Common;
using HotelBookingAPI.Models;

namespace HotelBookingAPI.Repositories;

public interface IBookingRepository
{
    Task<List<Booking>> GetAllAsync(BookingFilter filter);
    Task<Booking?> GetByIdAsync(int id);                   // chỉ đọc, kèm Customer, Room, RoomType
    Task<Booking?> GetForUpdateAsync(int id);              // có tracking
    Task<Booking?> GetForUpdateWithRoomAsync(int id);      // có tracking, kèm Room và RoomType (để tính lại tiền)
    Task<List<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? roomTypeId);
    Task<bool> CustomerExistsAsync(int customerId);
    Task<Room?> GetRoomWithTypeAsync(int roomId);
    Task<bool> HasOverlapAsync(int roomId, DateTime checkIn, DateTime checkOut, int? excludeBookingId = null);
    Task AddAsync(Booking entity);
    void Remove(Booking entity);
    Task SaveChangesAsync();
}