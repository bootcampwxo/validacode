"""
Filtros e seleções sobre DataFrames de dados do IBGE.
"""

import logging
from typing import Optional, Union

import pandas as pd

logger = logging.getLogger(__name__)


class FiltroDados:
    """
    Aplica filtros temáticos e geográficos sobre DataFrames do IBGE.

    Parâmetros
    ----------
    df : pd.DataFrame
        DataFrame com dados do IBGE a ser filtrado.
    """

    def __init__(self, df: pd.DataFrame) -> None:
        if df is None or df.empty:
            raise ValueError("DataFrame vazio fornecido ao FiltroDados.")
        self.df = df.copy()

    # ------------------------------------------------------------------
    # Filtros geográficos
    # ------------------------------------------------------------------

    def por_regiao(self, regioes: Union[str, list[str]]) -> pd.DataFrame:
        """
        Filtra por grande região (Norte, Nordeste, Sudeste, Sul, Centro-Oeste).

        Parâmetros
        ----------
        regioes : str | list[str]
            Nome(s) da(s) região(ões). Aceita substrings (não diferencia
            maiúsculas/minúsculas).
        """
        if isinstance(regioes, str):
            regioes = [regioes]
        col = self._coluna_ou_erro(["nome_regiao", "regiao"])
        mascara = self.df[col].str.contains("|".join(regioes), case=False, na=False)
        return self._filtrar(mascara, f"região(ões)={regioes}")

    def por_estado(
        self,
        estados: Union[str, list[str]],
        usar_sigla: bool = False,
    ) -> pd.DataFrame:
        """
        Filtra por estado (UF).

        Parâmetros
        ----------
        estados : str | list[str]
            Nome(s) ou sigla(s) do(s) estado(s).
        usar_sigla : bool
            Se True, filtra pela sigla (ex: 'SP'); caso contrário,
            usa o nome completo.
        """
        if isinstance(estados, str):
            estados = [estados]
        col = self._coluna_ou_erro(
            ["sigla"] if usar_sigla else ["nome_estado", "unidade_da_federacao"]
        )
        if usar_sigla:
            mascara = self.df[col].str.upper().isin([e.upper() for e in estados])
        else:
            mascara = self.df[col].str.contains("|".join(estados), case=False, na=False)
        return self._filtrar(mascara, f"estado(s)={estados}")

    def por_municipio(self, municipios: Union[str, list[str]]) -> pd.DataFrame:
        """
        Filtra por nome de município (busca parcial, sem distinção de caso).

        Parâmetros
        ----------
        municipios : str | list[str]
            Nome(s) do(s) município(s).
        """
        if isinstance(municipios, str):
            municipios = [municipios]
        col = self._coluna_ou_erro(["nome_municipio", "municipio"])
        mascara = self.df[col].str.contains("|".join(municipios), case=False, na=False)
        return self._filtrar(mascara, f"município(s)={municipios}")

    def por_id_municipio(self, ids: Union[int, list[int]]) -> pd.DataFrame:
        """
        Filtra por código IBGE do município.

        Parâmetros
        ----------
        ids : int | list[int]
            Código(s) IBGE do(s) município(s).
        """
        if isinstance(ids, int):
            ids = [ids]
        col = self._coluna_ou_erro(["id_municipio", "municipio_(código)"])
        df_tmp = self.df.copy()
        df_tmp[col] = pd.to_numeric(df_tmp[col], errors="coerce")
        mascara = df_tmp[col].isin(ids)
        return self._filtrar(mascara, f"id_municipio={ids}")

    # ------------------------------------------------------------------
    # Filtros temáticos
    # ------------------------------------------------------------------

    def por_sexo(self, sexo: str) -> pd.DataFrame:
        """
        Filtra por sexo.

        Parâmetros
        ----------
        sexo : str
            'masculino', 'feminino' ou 'total'.
        """
        col = self._coluna_ou_erro(["sexo"])
        mascara = self.df[col].str.contains(sexo, case=False, na=False)
        return self._filtrar(mascara, f"sexo={sexo}")

    def por_grupo_idade(self, grupos: Union[str, list[str]]) -> pd.DataFrame:
        """
        Filtra por grupo de idade.

        Parâmetros
        ----------
        grupos : str | list[str]
            Nome(s) do(s) grupo(s) de idade conforme categorização do IBGE.
        """
        if isinstance(grupos, str):
            grupos = [grupos]
        col = self._coluna_ou_erro(["grupo_idade", "grupo_de_idade"])
        mascara = self.df[col].str.contains("|".join(grupos), case=False, na=False)
        return self._filtrar(mascara, f"grupo_idade={grupos}")

    def top_n(
        self,
        n: int = 10,
        coluna_valor: str = "valor",
        ascendente: bool = False,
    ) -> pd.DataFrame:
        """
        Retorna os N registros com maior (ou menor) valor.

        Parâmetros
        ----------
        n : int
            Quantidade de registros a retornar.
        coluna_valor : str
            Coluna numérica usada para ordenação.
        ascendente : bool
            Se True, retorna os N menores valores.
        """
        if coluna_valor not in self.df.columns:
            raise KeyError(f"Coluna '{coluna_valor}' não encontrada.")
        return self.df.nsmallest(n, coluna_valor) if ascendente else self.df.nlargest(n, coluna_valor)

    # ------------------------------------------------------------------
    # Auxiliares internos
    # ------------------------------------------------------------------

    def _coluna_ou_erro(self, candidatas: list[str]) -> str:
        """Retorna a primeira coluna da lista que existir no DataFrame."""
        for col in candidatas:
            if col in self.df.columns:
                return col
        raise KeyError(
            f"Nenhuma das colunas {candidatas} encontrada. "
            f"Colunas disponíveis: {list(self.df.columns)}"
        )

    def _filtrar(self, mascara: pd.Series, descricao: str) -> pd.DataFrame:
        """Aplica máscara e loga o resultado."""
        resultado = self.df[mascara].reset_index(drop=True)
        logger.info(
            "Filtro '%s': %d/%d registros selecionados",
            descricao,
            len(resultado),
            len(self.df),
        )
        if resultado.empty:
            logger.warning("Filtro '%s' não retornou resultados.", descricao)
        return resultado
