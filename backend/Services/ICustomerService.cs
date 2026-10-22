using HotelBookingAPI.DTOs;

namespace HotelBookingAPI.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync(string? keyword);
    Task<CustomerDto> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto);
    Task UpdateAsync(int id, UpdateCustomerDto dto);
    Task DeleteAsync(int id);
}