# Use Python 3.11
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Create documents directory
RUN mkdir -p data/documents

# Expose port
EXPOSE 8000

# Run the app
CMD ["uvicorn", "app.api:app", "--host", "0.0.0.0", "--port", "8000"]
