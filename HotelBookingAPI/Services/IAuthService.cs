using HotelBookingAPI.DTOs;

namespace HotelBookingAPI.Services;

public interface IAuthService
{
    Task<int> RegisterAsync(RegisterDto dto);     // trả về customerId vừa tạo
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
}