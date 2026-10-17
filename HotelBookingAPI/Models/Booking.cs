namespace HotelBookingAPI.Models
{
    public class Booking
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int RoomId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = "Pending"; // Pending / Confirmed / Cancelled

        public Customer? Customer { get; set; }
        public Room? Room { get; set; }
    }
}
