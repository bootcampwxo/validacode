"""
Configuração do pytest para o projeto ibge_censo.
Adiciona a raiz do projeto ao sys.path automaticamente.
"""

import sys
from pathlib import Path

# Raiz do projeto (diretório pai de ibge_censo/)
ROOT = Path(__file__).parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
