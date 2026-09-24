FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Set default port
ENV PORT=10000
EXPOSE 10000

# Start production server
CMD ["sh", "-c", "gunicorn backend.server:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 120"]
