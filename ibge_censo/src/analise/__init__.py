"""
Módulo de análise estatística dos dados do IBGE.
"""
from .estatisticas import AnaliseDemografica
from .filtros import FiltroDados

__all__ = ["AnaliseDemografica", "FiltroDados"]
