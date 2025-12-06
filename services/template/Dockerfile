
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry

# Copy project files
COPY pyproject.toml poetry.lock ./

# Install python dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --without dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run commands
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
