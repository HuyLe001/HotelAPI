using HotelBookingAPI.Models;

namespace HotelBookingAPI.Repositories;

public interface ICustomerRepository
{
    Task<List<CustomerWithBookingCount>> GetAllAsync(string? keyword);
    Task<CustomerWithBookingCount?> GetByIdWithCountAsync(int id);  // chỉ đọc
    Task<Customer?> GetForUpdateAsync(int id);                       // có tracking
    Task<bool> EmailExistsAsync(string email, int? excludeId = null);
    Task<bool> HasBookingsAsync(int customerId);
    Task AddAsync(Customer entity);
    void Remove(Customer entity);
    Task SaveChangesAsync();
}