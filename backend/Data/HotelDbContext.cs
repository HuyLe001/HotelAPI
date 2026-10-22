using HotelBookingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelBookingAPI.Data;

public class HotelDbContext : DbContext
{
    public HotelDbContext(DbContextOptions<HotelDbContext> options) : base(options)
    {
    }

    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Amenity> Amenities => Set<Amenity>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<RoomType>()
            .Property(x => x.PricePerNight).HasPrecision(18, 2);

        modelBuilder.Entity<Booking>()
            .Property(x => x.TotalPrice).HasPrecision(18, 2);

        modelBuilder.Entity<Booking>()
            .Property(b => b.Status)
            .HasConversion(
                v => v.ToString(),
                v => (BookingStatus)Enum.Parse(typeof(BookingStatus), v));

        modelBuilder.Entity<Room>()
            .HasIndex(x => x.RoomNumber).IsUnique();

        modelBuilder.Entity<Customer>()
            .HasIndex(x => x.Email).IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(x => x.Username).IsUnique();

        // Quan hệ n-n: Room <-> Amenity
        modelBuilder.Entity<Room>()
            .HasMany(r => r.Amenities)
            .WithMany(a => a.Rooms)
            .UsingEntity(j => j.HasData(
                new { RoomsId = 1, AmenitiesId = 1 },
                new { RoomsId = 1, AmenitiesId = 2 },
                new { RoomsId = 2, AmenitiesId = 1 },
                new { RoomsId = 2, AmenitiesId = 2 },
                new { RoomsId = 2, AmenitiesId = 3 },
                new { RoomsId = 3, AmenitiesId = 1 },
                new { RoomsId = 3, AmenitiesId = 2 },
                new { RoomsId = 3, AmenitiesId = 3 },
                new { RoomsId = 3, AmenitiesId = 4 }
            ));

        modelBuilder.Entity<RoomType>().HasData(
            new RoomType { Id = 1, Name = "Standard", Description = "Phòng tiêu chuẩn", PricePerNight = 500000, Capacity = 2 },
            new RoomType { Id = 2, Name = "Deluxe", Description = "Phòng cao cấp", PricePerNight = 900000, Capacity = 3 },
            new RoomType { Id = 3, Name = "Suite", Description = "Phòng suite", PricePerNight = 1500000, Capacity = 4 }
        );

        modelBuilder.Entity<Amenity>().HasData(
            new Amenity { Id = 1, Name = "WiFi" },
            new Amenity { Id = 2, Name = "Máy lạnh" },
            new Amenity { Id = 3, Name = "TV" },
            new Amenity { Id = 4, Name = "Bồn tắm" }
        );

        modelBuilder.Entity<Room>().HasData(
            new Room { Id = 1, RoomNumber = "101", Status = "Available", RoomTypeId = 1 },
            new Room { Id = 2, RoomNumber = "201", Status = "Available", RoomTypeId = 2 },
            new Room { Id = 3, RoomNumber = "301", Status = "Available", RoomTypeId = 3 }
        );

        modelBuilder.Entity<Customer>().HasData(
            new Customer { Id = 1, FullName = "Nguyen Van A", Email = "a@gmail.com", Phone = "0900000001" },
            new Customer { Id = 2, FullName = "Tran Thi B", Email = "b@gmail.com", Phone = "0900000002" }
        );
    }
}