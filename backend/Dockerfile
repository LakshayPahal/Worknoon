FROM python:3.11-slim

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy pyproject.toml
COPY pyproject.toml ./

# Use uv to resolve and install dependencies into a virtual environment
# Since we don't have a uv.lock yet, this will resolve versions automatically
RUN uv sync --no-install-project

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start script: run seed first, then uvicorn using the uv environment
CMD ["sh", "-c", "uv run python -m app.seed && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
