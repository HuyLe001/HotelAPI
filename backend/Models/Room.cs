namespace HotelBookingAPI.Models
{
    public class Room
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "Available"; // Available / Maintenance
        public int RoomTypeId { get; set; }

        public RoomType? RoomType { get; set; }
        public ICollection<Amenity> Amenities { get; set; } = new List<Amenity>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
