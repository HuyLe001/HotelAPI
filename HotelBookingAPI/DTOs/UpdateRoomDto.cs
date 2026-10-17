using System.ComponentModel.DataAnnotations;

namespace HotelBookingAPI.DTOs;

public class UpdateRoomDto
{
    [Required(ErrorMessage = "Số phòng là bắt buộc")]
    [StringLength(10, ErrorMessage = "Số phòng tối đa 10 ký tự")]
    public string RoomNumber { get; set; } = string.Empty;

    [RegularExpression("^(Available|Maintenance)$", ErrorMessage = "Status chỉ nhận Available hoặc Maintenance")]
    public string Status { get; set; } = "Available";

    [Range(1, int.MaxValue, ErrorMessage = "RoomTypeId không hợp lệ")]
    public int RoomTypeId { get; set; }

    public List<int> AmenityIds { get; set; } = new();
}