using HotelBookingAPI.Common;
using HotelBookingAPI.DTOs;
using HotelBookingAPI.Models;
using HotelBookingAPI.Repositories;

namespace HotelBookingAPI.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IJwtTokenGenerator _jwt;

    public AuthService(IUserRepository users, IJwtTokenGenerator jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    // Tạo Customer và User trong cùng một lần lưu
    public async Task<int> RegisterAsync(RegisterDto dto)
    {
        var username = dto.Username.Trim();
        var email = dto.Email.Trim();

        if (await _users.UsernameExistsAsync(username))
            throw new ArgumentException("Tên đăng nhập đã tồn tại");

        if (await _users.CustomerEmailExistsAsync(email))
            throw new ArgumentException("Email đã được sử dụng");

        var user = new User
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Customer",
            Customer = new Customer
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                Phone = dto.Phone
            }
        };

        await _users.AddAsync(user);
        await _users.SaveChangesAsync();

        return user.CustomerId!.Value;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _users.GetByUsernameAsync(dto.Username.Trim());

        // Không tiết lộ là sai tên đăng nhập hay sai mật khẩu
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new InvalidCredentialsException("Sai tên đăng nhập hoặc mật khẩu");

        var (token, expires) = _jwt.Generate(user);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expires,
            Username = user.Username,
            Role = user.Role
        };
    }
}