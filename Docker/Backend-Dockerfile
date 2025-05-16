# Use the official Python 3.9 image as the base image
# This provides a stable and lightweight environment with Python 3.9 pre-installed
FROM python:3.9

# Set the working directory inside the container to /app
# All subsequent commands will be executed in this directory
WORKDIR /app

# Copy the requirements.txt file from the host to the working directory
# This file lists all Python dependencies required by the Django application
COPY requirements.txt .

# Install the Python dependencies listed in requirements.txt
# The pip install command ensures all necessary packages (e.g., Django, psycopg2) are installed
RUN pip install -r requirements.txt

# Copy the entire Django project directory from the host to the working directory
# This includes all application code, configuration files, and static assets
COPY . .

# Expose port 8000 to allow external access to the Django development server
# This is the default port used by Django's runserver command
EXPOSE 8000

# Define the command to run when the container starts
# This starts the Django development server, binding to all interfaces (0.0.0.0) on port 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]