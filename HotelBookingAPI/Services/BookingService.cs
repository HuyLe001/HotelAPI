using HotelBookingAPI.Common;
using HotelBookingAPI.DTOs;
using HotelBookingAPI.Models;
using HotelBookingAPI.Repositories;

namespace HotelBookingAPI.Services;

public class BookingService : IBookingService
{
    private readonly IBookingRepository _repo;

    public BookingService(IBookingRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<BookingDto>> GetAllAsync(BookingFilter filter, CurrentUser user)
    {
        // Customer luôn bị ép lọc theo chính mình, bỏ qua customerId client gửi lên
        if (!user.IsAdmin)
        {
            if (user.CustomerId == null)
                throw new UnauthorizedAccessException(NoPermission);

            filter.CustomerId = user.CustomerId;
        }

        var items = await _repo.GetAllAsync(filter);
        return items.Select(ToDto).ToList();
    }

    public async Task<BookingDto> GetByIdAsync(int id, CurrentUser user)
    {
        var booking = await _repo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy booking có Id = {id}");

        EnsureCanAccess(booking.CustomerId, user);
        return ToDto(booking);
    }

    public async Task<List<RoomDto>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut, int? roomTypeId)
    {
        if (checkOut.Date <= checkIn.Date)
            throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");

        var rooms = await _repo.GetAvailableRoomsAsync(checkIn.Date, checkOut.Date, roomTypeId);
        return rooms.Select(ToRoomDto).ToList();
    }

    public async Task<BookingDto> CreateAsync(CreateBookingDto dto, CurrentUser user)
    {
        // Admin đặt giúp khách (dùng dto.CustomerId), Customer chỉ đặt cho chính mình (lấy từ token)
        var customerId = user.IsAdmin ? dto.CustomerId : user.CustomerId;
        if (customerId == null)
            throw new UnauthorizedAccessException(NoPermission);

        var checkIn = dto.CheckInDate.Date;
        var checkOut = dto.CheckOutDate.Date;

        // 1. Kiểm tra ngày
        ValidateDates(checkIn, checkOut);

        // 2. Kiểm tra khách hàng
        if (!await _repo.CustomerExistsAsync(customerId.Value))
            throw new ArgumentException("Khách hàng không tồn tại");

        // 3. Kiểm tra phòng
        var room = await _repo.GetRoomWithTypeAsync(dto.RoomId)
            ?? throw new ArgumentException("Phòng không tồn tại");

        if (room.Status != "Available")
            throw new ArgumentException("Phòng đang bảo trì, không thể đặt");

        // 4. Chống trùng lịch
        if (await _repo.HasOverlapAsync(dto.RoomId, checkIn, checkOut))
            throw new ArgumentException("Phòng đã có người đặt trong khoảng thời gian này");

        // 5. Tính tiền (luôn tính ở server)
        var booking = new Booking
        {
            CustomerId = customerId.Value,
            RoomId = dto.RoomId,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            TotalPrice = CalculatePrice(checkIn, checkOut, room.RoomType!.PricePerNight),
            Status = BookingStatus.Pending
        };

        await _repo.AddAsync(booking);
        await _repo.SaveChangesAsync();

        // Đọc lại để có đủ tên khách, số phòng, tên loại phòng
        var saved = await _repo.GetByIdAsync(booking.Id);
        return ToDto(saved!);
    }

    public async Task UpdateDatesAsync(int id, UpdateBookingDatesDto dto, CurrentUser user)
    {
        var booking = await _repo.GetForUpdateWithRoomAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy booking có Id = {id}");

        EnsureCanAccess(booking.CustomerId, user);

        if (booking.Status != BookingStatus.Pending)
            throw new ArgumentException("Chỉ được đổi ngày khi booking đang ở trạng thái Pending");

        var checkIn = dto.CheckInDate.Date;
        var checkOut = dto.CheckOutDate.Date;

        ValidateDates(checkIn, checkOut);

        // Chống trùng lịch, loại trừ chính booking đang sửa
        if (await _repo.HasOverlapAsync(booking.RoomId, checkIn, checkOut, excludeBookingId: id))
            throw new ArgumentException("Phòng đã có người đặt trong khoảng thời gian này");

        booking.CheckInDate = checkIn;
        booking.CheckOutDate = checkOut;
        booking.TotalPrice = CalculatePrice(checkIn, checkOut, booking.Room!.RoomType!.PricePerNight);

        await _repo.SaveChangesAsync();
    }

    public async Task ConfirmAsync(int id)
    {
        var booking = await _repo.GetForUpdateAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy booking có Id = {id}");

        if (booking.Status != BookingStatus.Pending)
            throw new ArgumentException("Chỉ xác nhận được booking đang ở trạng thái Pending");

        booking.Status = BookingStatus.Confirmed;
        await _repo.SaveChangesAsync();
    }

    public async Task CancelAsync(int id, CurrentUser user)
    {
        var booking = await _repo.GetForUpdateAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy booking có Id = {id}");

        EnsureCanAccess(booking.CustomerId, user);

        if (booking.Status == BookingStatus.Cancelled)
            throw new ArgumentException("Booking đã được hủy trước đó");

        if (booking.CheckInDate.Date <= DateTime.Today && booking.Status == BookingStatus.Confirmed)
            throw new ArgumentException("Không thể hủy booking đã đến ngày nhận phòng");

        booking.Status = BookingStatus.Cancelled;
        await _repo.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var booking = await _repo.GetForUpdateAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy booking có Id = {id}");

        if (booking.Status != BookingStatus.Cancelled)
            throw new ArgumentException("Chỉ được xóa booking đã hủy");

        _repo.Remove(booking);
        await _repo.SaveChangesAsync();
    }

    // ===== Hàm hỗ trợ =====
    private const string NoPermission = "Bạn không có quyền thực hiện thao tác này";

    // Admin được truy cập mọi booking, Customer chỉ booking của chính mình
    private static void EnsureCanAccess(int bookingCustomerId, CurrentUser user)
    {
        if (!user.IsAdmin && user.CustomerId != bookingCustomerId)
            throw new UnauthorizedAccessException(NoPermission);
    }

    private static void ValidateDates(DateTime checkIn, DateTime checkOut)
    {
        if (checkIn < DateTime.Today)
            throw new ArgumentException("Ngày nhận phòng không được nằm trong quá khứ");

        if (checkOut <= checkIn)
            throw new ArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
    }

    private static decimal CalculatePrice(DateTime checkIn, DateTime checkOut, decimal pricePerNight) =>
        (checkOut - checkIn).Days * pricePerNight;

    private static BookingDto ToDto(Booking x) => new()
    {
        Id = x.Id,
        CustomerId = x.CustomerId,
        CustomerName = x.Customer?.FullName ?? string.Empty,
        RoomId = x.RoomId,
        RoomNumber = x.Room?.RoomNumber ?? string.Empty,
        RoomTypeName = x.Room?.RoomType?.Name ?? string.Empty,
        CheckInDate = x.CheckInDate,
        CheckOutDate = x.CheckOutDate,
        TotalPrice = x.TotalPrice,
        Status = x.Status.ToString()
    };

    private static RoomDto ToRoomDto(Room x) => new()
    {
        Id = x.Id,
        RoomNumber = x.RoomNumber,
        Status = x.Status,
        RoomTypeId = x.RoomTypeId,
        RoomTypeName = x.RoomType?.Name ?? string.Empty,
        PricePerNight = x.RoomType?.PricePerNight ?? 0,
        Amenities = x.Amenities.Select(a => a.Name).ToList()
    };
}