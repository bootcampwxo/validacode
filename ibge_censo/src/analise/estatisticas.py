"""
Análises estatísticas e métricas demográficas sobre os dados do IBGE.
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Área dos estados brasileiros em km² (fonte: IBGE 2022)
AREA_ESTADOS_KM2 = {
    "Rondônia": 237576.167,
    "Acre": 164123.737,
    "Amazonas": 1559159.148,
    "Roraima": 224300.506,
    "Pará": 1247954.666,
    "Amapá": 142814.585,
    "Tocantins": 277620.914,
    "Maranhão": 331936.948,
    "Piauí": 251611.929,
    "Ceará": 148920.472,
    "Rio Grande do Norte": 52811.047,
    "Paraíba": 56467.239,
    "Pernambuco": 98076.186,
    "Alagoas": 27848.161,
    "Sergipe": 21915.116,
    "Bahia": 564733.177,
    "Minas Gerais": 586528.293,
    "Espírito Santo": 46086.630,
    "Rio de Janeiro": 43750.425,
    "São Paulo": 248219.481,
    "Paraná": 199307.939,
    "Santa Catarina": 95730.884,
    "Rio Grande do Sul": 281748.538,
    "Mato Grosso do Sul": 357125.536,
    "Mato Grosso": 903357.908,
    "Goiás": 340111.783,
    "Distrito Federal": 5760.783,
}


class AnaliseDemografica:
    """
    Realiza análises estatísticas e cálculo de métricas demográficas.

    Parâmetros
    ----------
    df : pd.DataFrame
        DataFrame com dados do IBGE já carregados e normalizados.
    coluna_valor : str
        Nome da coluna numérica principal (padrão: 'valor').
    coluna_local : str
        Nome da coluna com o rótulo geográfico (padrão: 'nome_estado').
    """

    def __init__(
        self,
        df: pd.DataFrame,
        coluna_valor: str = "valor",
        coluna_local: str = "nome_estado",
    ) -> None:
        if df is None or df.empty:
            raise ValueError("DataFrame vazio fornecido à AnaliseDemografica.")
        self.df = df.copy()
        self.coluna_valor = coluna_valor
        self.coluna_local = coluna_local
        self._validar_colunas()

    # ------------------------------------------------------------------
    # Estatísticas descritivas
    # ------------------------------------------------------------------

    def resumo(self) -> pd.DataFrame:
        """
        Retorna estatísticas descritivas completas da coluna de valor.

        Retorna
        -------
        pd.DataFrame
            Tabela com contagem, média, desvio padrão, mín, quartis e máx.
        """
        desc = self.df[self.coluna_valor].describe()
        extra = pd.Series(
            {
                "variância": self.df[self.coluna_valor].var(),
                "assimetria": self.df[self.coluna_valor].skew(),
                "curtose": self.df[self.coluna_valor].kurt(),
                "total": self.df[self.coluna_valor].sum(),
            }
        )
        return pd.concat([desc, extra]).rename("estatísticas").to_frame()

    def totais_por_local(self) -> pd.DataFrame:
        """
        Calcula o total da coluna de valor agrupado por localidade.

        Retorna
        -------
        pd.DataFrame
            DataFrame com colunas [local, total, percentual] ordenado decrescente.
        """
        agg = (
            self.df.groupby(self.coluna_local)[self.coluna_valor]
            .sum()
            .reset_index()
            .rename(columns={self.coluna_local: "local", self.coluna_valor: "total"})
        )
        agg["percentual"] = (agg["total"] / agg["total"].sum() * 100).round(2)
        return agg.sort_values("total", ascending=False).reset_index(drop=True)

    def media_por_local(self) -> pd.DataFrame:
        """
        Calcula a média da coluna de valor por localidade.

        Retorna
        -------
        pd.DataFrame
            DataFrame com colunas [local, media, mediana] ordenado decrescente.
        """
        agg = self.df.groupby(self.coluna_local)[self.coluna_valor].agg(
            media="mean", mediana="median"
        ).reset_index()
        agg.columns = ["local", "media", "mediana"]
        return agg.sort_values("media", ascending=False).reset_index(drop=True)

    # ------------------------------------------------------------------
    # Densidade demográfica
    # ------------------------------------------------------------------

    def densidade_demografica(self) -> pd.DataFrame:
        """
        Calcula a densidade demográfica (hab/km²) para cada estado.

        Usa as áreas oficiais do IBGE 2022 armazenadas em AREA_ESTADOS_KM2.
        Requer que a coluna de localidade contenha nomes de estados.

        Retorna
        -------
        pd.DataFrame
            DataFrame com colunas [estado, populacao, area_km2, densidade].
        """
        totais = self.totais_por_local()
        totais = totais.rename(columns={"local": "estado", "total": "populacao"})
        totais["area_km2"] = totais["estado"].map(AREA_ESTADOS_KM2)

        sem_area = totais[totais["area_km2"].isna()]["estado"].tolist()
        if sem_area:
            logger.warning(
                "Área não encontrada para: %s. Considere usar nomes exatos do IBGE.",
                sem_area,
            )

        totais["densidade"] = (totais["populacao"] / totais["area_km2"]).round(2)
        return totais[["estado", "populacao", "area_km2", "densidade"]].dropna(subset=["area_km2"])

    # ------------------------------------------------------------------
    # Distribuição etária
    # ------------------------------------------------------------------

    def piramide_etaria(self) -> pd.DataFrame:
        """
        Constrói os dados para pirâmide etária por sexo e grupo de idade.

        Requer que o DataFrame contenha colunas 'sexo' e 'grupo_idade'.

        Retorna
        -------
        pd.DataFrame
            DataFrame pivotado com grupos de idade nas linhas e sexo nas colunas.
        """
        self._checar_colunas_extras(["sexo", "grupo_idade"])
        pivot = (
            self.df.groupby(["grupo_idade", "sexo"])[self.coluna_valor]
            .sum()
            .unstack(fill_value=0)
            .reset_index()
        )
        pivot.columns.name = None
        return pivot

    def distribuicao_etaria_percentual(self) -> pd.DataFrame:
        """
        Calcula a participação percentual de cada grupo de idade.

        Retorna
        -------
        pd.DataFrame
            DataFrame com colunas [grupo_idade, populacao, percentual].
        """
        self._checar_colunas_extras(["grupo_idade"])
        agg = (
            self.df.groupby("grupo_idade")[self.coluna_valor]
            .sum()
            .reset_index()
            .rename(columns={"grupo_idade": "grupo_idade", self.coluna_valor: "populacao"})
        )
        agg["percentual"] = (agg["populacao"] / agg["populacao"].sum() * 100).round(2)
        return agg.sort_values("populacao", ascending=False).reset_index(drop=True)

    # ------------------------------------------------------------------
    # Índices demográficos
    # ------------------------------------------------------------------

    def razao_de_sexo(self) -> pd.DataFrame:
        """
        Calcula a razão de sexo (homens por 100 mulheres) por localidade.

        Requer coluna 'sexo' no DataFrame.

        Retorna
        -------
        pd.DataFrame
            DataFrame com colunas [local, masculino, feminino, razao_sexo].
        """
        self._checar_colunas_extras(["sexo"])
        pivot = (
            self.df.groupby([self.coluna_local, "sexo"])[self.coluna_valor]
            .sum()
            .unstack(fill_value=0)
            .reset_index()
        )
        pivot.columns.name = None
        pivot.columns = [c.lower().replace(" ", "_") for c in pivot.columns]

        col_local = pivot.columns[0]
        # Tentar identificar as colunas de sexo por conteúdo parcial
        col_masc = next((c for c in pivot.columns if "masc" in c or "homem" in c or "home" in c), None)
        col_fem = next((c for c in pivot.columns if "fem" in c or "mulher" in c), None)

        if col_masc and col_fem:
            pivot["razao_sexo"] = (pivot[col_masc] / pivot[col_fem].replace(0, np.nan) * 100).round(1)
            return pivot[[col_local, col_masc, col_fem, "razao_sexo"]].rename(
                columns={col_local: "local", col_masc: "masculino", col_fem: "feminino"}
            )
        logger.warning("Não foi possível identificar as colunas de sexo para calcular razão.")
        return pivot

    def indice_de_envelhecimento(self) -> Optional[float]:
        """
        Calcula o índice de envelhecimento: razão entre idosos (65+) e
        jovens (0-14 anos) × 100.

        Requer coluna 'grupo_idade' no DataFrame.

        Retorna
        -------
        float | None
            Índice de envelhecimento ou None se os grupos não forem encontrados.
        """
        self._checar_colunas_extras(["grupo_idade"])
        jovens = self.df[self.df["grupo_idade"].str.contains(r"0\s*a\s*14|0\s*[-–]\s*14", case=False, na=False)][self.coluna_valor].sum()
        idosos = self.df[self.df["grupo_idade"].str.contains(r"65|70|75|80", na=False)][self.coluna_valor].sum()
        if jovens == 0:
            logger.warning("Grupo '0 a 14 anos' não encontrado para índice de envelhecimento.")
            return None
        return round(idosos / jovens * 100, 1)

    # ------------------------------------------------------------------
    # Escolaridade e renda
    # ------------------------------------------------------------------

    def resumo_escolaridade(self) -> pd.DataFrame:
        """
        Agrega dados de escolaridade por nível e localidade.

        Requer coluna 'nivel_instrucao' (ou similar) no DataFrame.

        Retorna
        -------
        pd.DataFrame
            DataFrame com distribuição percentual por nível de instrução.
        """
        col_instrucao = self._detectar_coluna(
            ["nivel_instrucao", "instrucao", "nivel_de_instrucao"]
        )
        if not col_instrucao:
            raise KeyError("Coluna de nível de instrução não encontrada no DataFrame.")
        agg = (
            self.df.groupby(col_instrucao)[self.coluna_valor]
            .sum()
            .reset_index()
            .rename(columns={col_instrucao: "nivel_instrucao", self.coluna_valor: "pessoas"})
        )
        agg["percentual"] = (agg["pessoas"] / agg["pessoas"].sum() * 100).round(2)
        return agg.sort_values("pessoas", ascending=False).reset_index(drop=True)

    def media_renda_por_estado(self) -> pd.DataFrame:
        """
        Calcula a renda domiciliar per capita média por estado.

        Retorna
        -------
        pd.DataFrame
            DataFrame com colunas [estado, renda_media, renda_mediana].
        """
        agg = self.df.groupby(self.coluna_local)[self.coluna_valor].agg(
            renda_media="mean", renda_mediana="median"
        ).reset_index()
        agg.columns = ["estado", "renda_media", "renda_mediana"]
        agg["renda_media"] = agg["renda_media"].round(2)
        agg["renda_mediana"] = agg["renda_mediana"].round(2)
        return agg.sort_values("renda_media", ascending=False).reset_index(drop=True)

    # ------------------------------------------------------------------
    # Auxiliares internos
    # ------------------------------------------------------------------

    def _validar_colunas(self) -> None:
        """Verifica se as colunas obrigatórias estão no DataFrame."""
        ausentes = [
            c
            for c in [self.coluna_valor, self.coluna_local]
            if c not in self.df.columns
        ]
        if ausentes:
            raise KeyError(
                f"Colunas ausentes: {ausentes}. "
                f"Disponíveis: {list(self.df.columns)}"
            )

    def _checar_colunas_extras(self, colunas: list[str]) -> None:
        """Levanta KeyError se alguma coluna extra necessária não existir."""
        ausentes = [c for c in colunas if c not in self.df.columns]
        if ausentes:
            raise KeyError(
                f"Colunas necessárias ausentes: {ausentes}. "
                f"Disponíveis: {list(self.df.columns)}"
            )

    def _detectar_coluna(self, candidatas: list[str]) -> Optional[str]:
        """Retorna a primeira coluna candidata que existir no DataFrame."""
        for col in candidatas:
            if col in self.df.columns:
                return col
        return None
