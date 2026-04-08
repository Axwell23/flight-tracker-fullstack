import os
from fastapi import Header, HTTPException, status

# Leemos la clave del entorno — nunca hardcodeada en el código
API_KEY = os.getenv("API_KEY")

async def verificar_api_key(x_api_key: str = Header(...)):
    # FastAPI automáticamente busca el header "X-Api-Key" en el request.
    # Si no está presente, devuelve 422 antes de llegar a esta función.
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key inválida",
        )