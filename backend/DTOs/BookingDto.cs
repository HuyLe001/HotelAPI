namespace HotelBookingAPI.DTOs;

public class BookingDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string RoomTypeName { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int Nights => (CheckOutDate.Date - CheckInDate.Date).Days;
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
}