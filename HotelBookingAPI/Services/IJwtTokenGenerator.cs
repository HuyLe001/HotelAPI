using HotelBookingAPI.Models;

namespace HotelBookingAPI.Services;

public interface IJwtTokenGenerator
{
    (string Token, DateTime Expires) Generate(User user);
}