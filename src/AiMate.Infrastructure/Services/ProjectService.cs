using AiMate.Core.Entities;
using AiMate.Core.Services;
using AiMate.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AiMate.Infrastructure.Services;

/// <summary>
/// Project service implementation
/// </summary>
public class ProjectService : IProjectService
{
    private readonly AiMateDbContext _context;
    private readonly ILogger<ProjectService> _logger;

    public ProjectService(
        AiMateDbContext context,
        ILogger<ProjectService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Project>> GetUserProjectsAsync(
        Guid userId,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Projects.Where(p => p.UserId == userId);

            if (!includeArchived)
            {
                query = query.Where(p => !p.IsArchived);
            }

            return await query
                .OrderByDescending(p => p.UpdatedAt)
                .ToListAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Get user projects operation was cancelled for user {UserId}", userId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving projects for user {UserId}", userId);
            throw;
        }
    }

    public async Task<Project?> GetProjectByIdAsync(
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.Projects
                .Include(p => p.Workspaces)
                .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Get project by ID operation was cancelled for project {ProjectId}", projectId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<Project> CreateProjectAsync(
        Project project,
        CancellationToken cancellationToken = default)
    {
        try
        {
            _context.Projects.Add(project);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created project {ProjectId} for user {UserId}",
                project.Id, project.UserId);

            return project;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error creating project {ProjectId}", project.Id);
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Create project operation was cancelled for project {ProjectId}", project.Id);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating project {ProjectId}", project.Id);
            throw;
        }
    }

    public async Task<Project> UpdateProjectAsync(
        Project project,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var existing = await _context.Projects.FindAsync(
                new object[] { project.Id }, cancellationToken);

            if (existing == null)
            {
                throw new InvalidOperationException($"Project {project.Id} not found");
            }

            existing.Key = project.Key;
            existing.Name = project.Name;
            existing.Description = project.Description;
            existing.Owner = project.Owner;
            existing.OwnerEmail = project.OwnerEmail;
            existing.Status = project.Status;
            existing.Priority = project.Priority;
            existing.Budget = project.Budget;
            existing.StartDate = project.StartDate;
            existing.DueDate = project.DueDate;
            existing.ProgressPercent = project.ProgressPercent;
            existing.Tags = project.Tags;
            existing.TeamMembers = project.TeamMembers;
            existing.Notes = project.Notes;
            existing.IsArchived = project.IsArchived;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated project {ProjectId}", project.Id);

            return existing;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency error updating project {ProjectId}", project.Id);
            throw;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating project {ProjectId}", project.Id);
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Update project operation was cancelled for project {ProjectId}", project.Id);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating project {ProjectId}", project.Id);
            throw;
        }
    }

    public async Task DeleteProjectAsync(
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var project = await _context.Projects.FindAsync(
                new object[] { projectId }, cancellationToken);

            if (project != null)
            {
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Deleted project {ProjectId}", projectId);
            }
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error deleting project {ProjectId}", projectId);
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Delete project operation was cancelled for project {ProjectId}", projectId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting project {ProjectId}", projectId);
            throw;
        }
    }

    public async Task<Project> ArchiveProjectAsync(
        Guid projectId,
        bool isArchived,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var project = await _context.Projects.FindAsync(
                new object[] { projectId }, cancellationToken);

            if (project == null)
            {
                throw new InvalidOperationException($"Project {projectId} not found");
            }

            project.IsArchived = isArchived;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("{Action} project {ProjectId}",
                isArchived ? "Archived" : "Unarchived", projectId);

            return project;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency error archiving project {ProjectId}", projectId);
            throw;
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error archiving project {ProjectId}", projectId);
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Archive project operation was cancelled for project {ProjectId}", projectId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error archiving project {ProjectId}", projectId);
            throw;
        }
    }
}
