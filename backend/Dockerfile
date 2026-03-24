# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile for VeloTradeFi Backend (ASP.NET Core 10)
# Multi-stage build for optimized image size
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy solution and project files first (for better Docker layer caching)
COPY FinAI.sln ./
COPY src/FinAI.Api/FinAI.Api.csproj ./src/FinAI.Api/
COPY src/FinAI.Core/FinAI.Core.csproj ./src/FinAI.Core/
COPY src/FinAI.Infrastructure/FinAI.Infrastructure.csproj ./src/FinAI.Infrastructure/

# Restore dependencies
RUN dotnet restore ./src/FinAI.Api/FinAI.Api.csproj

# Copy all source code
COPY . .

# Build and publish
WORKDIR /src/src/FinAI.Api
RUN dotnet publish -c Release -o /app/publish

# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN (getent group 1000 || groupadd --gid 1000 appgroup) && \
    (id -u 1000 >/dev/null 2>&1 || useradd --uid 1000 --gid 1000 --shell /bin/bash --create-home appuser 2>/dev/null || true)

WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Set ownership
RUN chown -R 1000:1000 /app

# Switch to non-root user
USER 1000

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_EnableDiagnostics=0

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Entry point
ENTRYPOINT ["dotnet", "FinAI.Api.dll"]
