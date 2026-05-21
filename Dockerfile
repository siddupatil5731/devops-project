# Use an official lightweight Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the requirements file first to leverage Docker's caching mechanism
COPY requirements.txt .

# Install dependencies specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the remaining project files into the container's working directory
COPY . .

# Inform Docker that the container listens on port 5000 at runtime
EXPOSE 5000

# Define the command to execute the Flask application
CMD ["python", "app.py"]
