# Usamos la imagen oficial de Playwright que ya tiene todas las librerías del OS necesarias
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy

# Seteamos el directorio de trabajo adentro del contenedor
WORKDIR /app

# Copiamos solo los requirements primero (para aprovechar el caché de Docker)
# Usamos un requirements en UTF-8 para evitar problemas de encoding en Windows.
COPY requirements.docker.txt requirements.txt

#  las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Instalo el navegador Chromium para Playwright
RUN playwright install chromium

# Copiamos el resto del código del proyecto
COPY . .

# Agregamos la ruta principal al PYTHONPATH para que Python encuentre los módulos locales
ENV PYTHONPATH="."

# Exponemos el puerto de FastAPI
EXPOSE 8000

# El comando por defecto arranca la API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]