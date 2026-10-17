using HotelBookingAPI.Models;

namespace HotelBookingAPI.Repositories;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<bool> UsernameExistsAsync(string username);
    Task<bool> CustomerEmailExistsAsync(string email);
    Task AddAsync(User user);
    Task SaveChangesAsync();
}