# Use a Python base image, not Node.js
FROM python:3.9-slim-buster

# Set the working directory inside the container
WORKDIR /app

# If you have a requirements.txt, copy and install it
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script and any other necessary files
COPY . .

# Command to run your Python script directly
CMD ["python", "embed_rag_data.py"]