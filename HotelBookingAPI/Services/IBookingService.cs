using HotelBookingAPI.Common;
using HotelBookingAPI.DTOs;

namespace HotelBookingAPI.Services;

public interface IBookingService
{
    Task<List<BookingDto>> GetAllAsync(BookingFilter filter, CurrentUser user);
    Task<BookingDto> GetByIdAsync(int id, CurrentUser user);
    Task<List<RoomDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? roomTypeId);
    Task<BookingDto> CreateAsync(CreateBookingDto dto, CurrentUser user);
    Task UpdateDatesAsync(int id, UpdateBookingDatesDto dto, CurrentUser user);
    Task ConfirmAsync(int id);
    Task CancelAsync(int id, CurrentUser user);
    Task DeleteAsync(int id);
}