"""
Leitura e validação de arquivos CSV com dados do IBGE.

Suporta arquivos exportados do SIDRA ou gerados pela própria aplicação.
"""

import logging
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Colunas esperadas nos diferentes tipos de arquivo CSV
ESQUEMAS_CSV = {
    "municipios": [
        "id_municipio",
        "nome_municipio",
        "id_estado",
        "sigla_estado",
        "nome_estado",
        "nome_regiao",
    ],
    "populacao": [
        "id_municipio",
        "nome_municipio",
        "valor",
        "ano",
    ],
    "populacao_sexo": [
        "nome_estado",
        "sexo",
        "valor",
        "ano",
    ],
    "populacao_idade": [
        "nome_estado",
        "grupo_idade",
        "valor",
        "ano",
    ],
}


class LeitorCSV:
    """
    Lê, valida e normaliza arquivos CSV com dados do IBGE.

    Parâmetros
    ----------
    encoding : str
        Codificação do arquivo. 'utf-8' para exportações modernas;
        'latin-1' para arquivos antigos do SIDRA.
    separador : str
        Separador de colunas do CSV (padrão: vírgula).
    """

    def __init__(self, encoding: str = "utf-8", separador: str = ",") -> None:
        self.encoding = encoding
        self.separador = separador

    def ler(
        self,
        caminho: str | Path,
        tipo: Optional[str] = None,
        colunas_obrigatorias: Optional[list[str]] = None,
    ) -> pd.DataFrame:
        """
        Lê um arquivo CSV e retorna um DataFrame validado.

        Parâmetros
        ----------
        caminho : str | Path
            Caminho para o arquivo CSV.
        tipo : str, opcional
            Tipo de dado esperado. Quando fornecido, valida as colunas
            obrigatórias conforme ESQUEMAS_CSV.
        colunas_obrigatorias : list[str], opcional
            Lista explícita de colunas que devem estar presentes.

        Retorna
        -------
        pd.DataFrame
            DataFrame com os dados lidos e normalizados.

        Levanta
        -------
        FileNotFoundError
            Se o arquivo não existir.
        ValueError
            Se o arquivo estiver vazio ou faltar colunas obrigatórias.
        """
        caminho = Path(caminho)
        if not caminho.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {caminho}")

        logger.info("Lendo arquivo CSV: %s", caminho)

        # Tentativa com encoding fornecido; fallback para latin-1
        df = self._ler_csv_com_fallback(caminho)

        if df.empty:
            raise ValueError(f"Arquivo CSV está vazio: {caminho}")

        # Normalizar nomes de colunas (remover espaços, lowercase)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # Validar colunas obrigatórias
        obrigatorias = colunas_obrigatorias or ESQUEMAS_CSV.get(tipo or "", [])
        self._validar_colunas(df, obrigatorias, caminho)

        # Limpar e normalizar os dados
        df = self._normalizar(df)

        logger.info("CSV carregado: %d linhas × %d colunas", *df.shape)
        return df

    def ler_varios(self, caminhos: list[str | Path], tipo: Optional[str] = None) -> pd.DataFrame:
        """
        Lê e concatena múltiplos arquivos CSV do mesmo tipo.

        Parâmetros
        ----------
        caminhos : list[str | Path]
            Lista de caminhos para os arquivos CSV.
        tipo : str, opcional
            Tipo de dado esperado (mesma convenção de `ler`).

        Retorna
        -------
        pd.DataFrame
            DataFrame com todos os arquivos concatenados.
        """
        frames = [self.ler(c, tipo=tipo) for c in caminhos]
        if not frames:
            return pd.DataFrame()
        df = pd.concat(frames, ignore_index=True)
        logger.info("Total após concatenação: %d linhas", len(df))
        return df

    def salvar(self, df: pd.DataFrame, caminho: str | Path) -> None:
        """
        Salva um DataFrame como CSV.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame a ser salvo.
        caminho : str | Path
            Caminho de destino do arquivo CSV.
        """
        caminho = Path(caminho)
        caminho.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(caminho, index=False, encoding=self.encoding)
        logger.info("DataFrame salvo em: %s", caminho)

    # ------------------------------------------------------------------
    # Métodos auxiliares internos
    # ------------------------------------------------------------------

    def _ler_csv_com_fallback(self, caminho: Path) -> pd.DataFrame:
        """Tenta ler com o encoding configurado; usa latin-1 como fallback."""
        try:
            return pd.read_csv(caminho, encoding=self.encoding, sep=self.separador, dtype=str)
        except UnicodeDecodeError:
            logger.warning(
                "Encoding '%s' falhou para %s — tentando 'latin-1'",
                self.encoding,
                caminho,
            )
            return pd.read_csv(caminho, encoding="latin-1", sep=self.separador, dtype=str)

    @staticmethod
    def _validar_colunas(
        df: pd.DataFrame, obrigatorias: list[str], caminho: Path
    ) -> None:
        """Verifica se as colunas obrigatórias estão presentes."""
        ausentes = [c for c in obrigatorias if c not in df.columns]
        if ausentes:
            raise ValueError(
                f"Colunas ausentes em {caminho.name}: {ausentes}\n"
                f"Colunas presentes: {list(df.columns)}"
            )

    @staticmethod
    def _normalizar(df: pd.DataFrame) -> pd.DataFrame:
        """
        Aplica normalizações básicas ao DataFrame:
        - Remove linhas completamente vazias
        - Converte colunas de valor para numérico
        - Preenche NaN em colunas de texto com string vazia
        - Remove espaços extras em strings
        """
        # Remover linhas completamente vazias
        df = df.dropna(how="all")

        # Colunas de valor numérico
        colunas_valor = [c for c in df.columns if "valor" in c or "populacao" in c]
        for col in colunas_valor:
            # Remover separadores de milhar (ponto) e converter vírgula decimal
            df[col] = (
                df[col]
                .astype(str)
                .str.replace(".", "", regex=False)
                .str.replace(",", ".", regex=False)
            )
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Limpar strings (compatível com pandas 2.x e 3.x)
        colunas_str = df.select_dtypes(include=["object", "str"]).columns
        for col in colunas_str:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace({"nan": np.nan, "None": np.nan, "": np.nan})

        return df
