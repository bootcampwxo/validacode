"""
Módulo de coleta de dados do IBGE.
"""
from .api_ibge import IBGEApiClient
from .leitor_csv import LeitorCSV

__all__ = ["IBGEApiClient", "LeitorCSV"]
