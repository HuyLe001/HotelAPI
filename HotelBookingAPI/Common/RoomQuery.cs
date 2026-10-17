namespace HotelBookingAPI.Common;

public class RoomQuery : PagingQuery
{
    public string? Status { get; set; }
    public int? RoomTypeId { get; set; }
    public string? Keyword { get; set; }
}