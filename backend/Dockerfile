# 1. Basis-Image
FROM python:3.11-slim-bullseye

# Update system packages to reduce vulnerabilities
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Arbeitsverzeichnis
WORKDIR /app

# 3. Abhängigkeiten kopieren & installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Restlichen Code kopieren
COPY . .

# 5. Standard-Kommando
CMD ["python", "server.py"]
