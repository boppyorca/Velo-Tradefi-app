namespace FinAI.Core.Interfaces;

using FinAI.Core.Entities;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task<bool> ExistsAsync(string email);
}
