"""
Cliente para a API pública do IBGE (SIDRA e ServiceData).

Documentação oficial:
  - SIDRA: https://apisidra.ibge.gov.br/
  - Localidades: https://servicodados.ibge.gov.br/api/docs/localidades
"""

import logging
import time
from typing import Optional

import pandas as pd
import requests

logger = logging.getLogger(__name__)

# Endpoints base das APIs do IBGE
BASE_SIDRA = "https://apisidra.ibge.gov.br/values"
BASE_LOCALIDADES = "https://servicodados.ibge.gov.br/api/v1/localidades"

# Tabelas SIDRA usadas neste projeto
TABELAS_SIDRA = {
    "populacao_municipios": {
        "tabela": "200",
        "variavel": "93",         # população residente
        "descricao": "População residente por município (Censo 2022)",
    },
    "populacao_por_sexo": {
        "tabela": "9514",
        "variavel": "93",
        "classificacao": "2",     # sexo
        "descricao": "População residente por sexo (Censo 2022)",
    },
    "populacao_por_idade": {
        "tabela": "9515",
        "variavel": "93",
        "classificacao": "287",   # grupos de idade
        "descricao": "População residente por grupos de idade (Censo 2022)",
    },
    "escolaridade": {
        "tabela": "9543",
        "variavel": "687",        # pessoas de 25 anos ou mais
        "descricao": "Escolaridade da população (Censo 2022)",
    },
    "renda_domiciliar": {
        "tabela": "9544",
        "variavel": "693",
        "descricao": "Renda domiciliar per capita (Censo 2022)",
    },
}


class IBGEApiClient:
    """
    Cliente para consulta das APIs públicas do IBGE.

    Parâmetros
    ----------
    timeout : int
        Tempo máximo (em segundos) para aguardar resposta da API.
    max_retries : int
        Número máximo de tentativas em caso de falha de rede.
    """

    def __init__(self, timeout: int = 30, max_retries: int = 3) -> None:
        self.timeout = timeout
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({"Accept": "application/json"})

    # ------------------------------------------------------------------
    # Métodos de localidades
    # ------------------------------------------------------------------

    def listar_regioes(self) -> pd.DataFrame:
        """Retorna todas as regiões do Brasil."""
        dados = self._get(f"{BASE_LOCALIDADES}/regioes")
        df = pd.DataFrame(dados)[["id", "sigla", "nome"]]
        df.columns = ["id_regiao", "sigla", "nome_regiao"]
        return df

    def listar_estados(self, id_regiao: Optional[int] = None) -> pd.DataFrame:
        """
        Retorna os estados (UFs), opcionalmente filtrados por região.

        Parâmetros
        ----------
        id_regiao : int, opcional
            ID da região (1=N, 2=NE, 3=SE, 4=S, 5=CO).
        """
        if id_regiao:
            url = f"{BASE_LOCALIDADES}/regioes/{id_regiao}/estados"
        else:
            url = f"{BASE_LOCALIDADES}/estados"
        dados = self._get(url)
        df = pd.DataFrame(dados)
        df = df[["id", "sigla", "nome"]].copy()
        df.columns = ["id_estado", "sigla", "nome_estado"]
        return df

    def listar_municipios(self, id_estado: Optional[int] = None) -> pd.DataFrame:
        """
        Retorna os municípios, opcionalmente filtrados por estado.

        Parâmetros
        ----------
        id_estado : int, opcional
            ID do estado (código IBGE de 2 dígitos, ex: 35 para SP).
        """
        if id_estado:
            url = f"{BASE_LOCALIDADES}/estados/{id_estado}/municipios"
        else:
            url = f"{BASE_LOCALIDADES}/municipios"
        dados = self._get(url)
        linhas = []
        for item in dados:
            linhas.append(
                {
                    "id_municipio": item["id"],
                    "nome_municipio": item["nome"],
                    "id_estado": item["microrregiao"]["mesorregiao"]["UF"]["id"],
                    "sigla_estado": item["microrregiao"]["mesorregiao"]["UF"]["sigla"],
                    "nome_estado": item["microrregiao"]["mesorregiao"]["UF"]["nome"],
                    "nome_regiao": item["microrregiao"]["mesorregiao"]["UF"]["regiao"][
                        "nome"
                    ],
                }
            )
        return pd.DataFrame(linhas)

    # ------------------------------------------------------------------
    # Métodos SIDRA
    # ------------------------------------------------------------------

    def obter_populacao_municipios(self, id_estado: Optional[int] = None) -> pd.DataFrame:
        """
        Obtém dados de população por município via SIDRA (tabela 200).

        Parâmetros
        ----------
        id_estado : int, opcional
            Código IBGE do estado para filtrar os municípios.
        """
        nivel = "6"  # municípios
        if id_estado:
            localidade = f"in%20N6[N3[{id_estado}]]"
        else:
            localidade = "all"

        url = (
            f"{BASE_SIDRA}/t/200/n{nivel}/{localidade}"
            "/v/93/p/last%201/c2/6794,6800/d/v93%200"
        )
        return self._sidra_para_dataframe(url, "populacao")

    def obter_populacao_por_sexo(self, nivel_geo: str = "3") -> pd.DataFrame:
        """
        Obtém distribuição da população por sexo (tabela 9514).

        Parâmetros
        ----------
        nivel_geo : str
            Nível geográfico: '1'=Brasil, '2'=Região, '3'=Estado, '6'=Município.
        """
        url = (
            f"{BASE_SIDRA}/t/9514/n{nivel_geo}/all"
            "/v/93/p/last%201/c2/6794,6800/d/v93%200"
        )
        return self._sidra_para_dataframe(url, "populacao_sexo")

    def obter_populacao_por_idade(self, nivel_geo: str = "3") -> pd.DataFrame:
        """
        Obtém distribuição da população por grupos de idade (tabela 9515).

        Parâmetros
        ----------
        nivel_geo : str
            Nível geográfico: '1'=Brasil, '2'=Região, '3'=Estado.
        """
        url = (
            f"{BASE_SIDRA}/t/9515/n{nivel_geo}/all"
            "/v/93/p/last%201/c287/allxt/d/v93%200"
        )
        return self._sidra_para_dataframe(url, "populacao_idade")

    # ------------------------------------------------------------------
    # Métodos auxiliares internos
    # ------------------------------------------------------------------

    def _get(self, url: str) -> list:
        """Faz requisição GET com retentativas automáticas."""
        for tentativa in range(1, self.max_retries + 1):
            try:
                logger.debug("GET %s (tentativa %d)", url, tentativa)
                resp = self.session.get(url, timeout=self.timeout)
                resp.raise_for_status()
                return resp.json()
            except requests.exceptions.Timeout:
                logger.warning("Timeout na tentativa %d: %s", tentativa, url)
            except requests.exceptions.ConnectionError as exc:
                logger.warning("Erro de conexão (tentativa %d): %s", tentativa, exc)
            except requests.exceptions.HTTPError as exc:
                logger.error("Erro HTTP %s: %s", exc.response.status_code, url)
                raise
            if tentativa < self.max_retries:
                time.sleep(2 ** tentativa)
        raise ConnectionError(
            f"Falha ao conectar à API após {self.max_retries} tentativas: {url}"
        )

    def _sidra_para_dataframe(self, url: str, prefixo: str) -> pd.DataFrame:
        """
        Converte a resposta JSON do SIDRA em DataFrame normalizado.

        A primeira linha do JSON do SIDRA contém os metadados (nomes das colunas),
        e as demais linhas contêm os dados.
        """
        dados = self._get(url)
        if not dados or len(dados) < 2:
            logger.warning("Resposta vazia do SIDRA para %s", url)
            return pd.DataFrame()

        # Primeira linha = cabeçalho com nomes das colunas
        colunas = list(dados[0].values())
        registros = dados[1:]
        df = pd.DataFrame(registros, columns=colunas)

        # Renomear colunas comuns do SIDRA
        renomear = {
            "Nível Territorial (Código)": "nivel_territorial",
            "Unidade de Medida": "unidade_medida",
            "Valor": "valor",
            "Ano": "ano",
            "Município (Código)": "id_municipio",
            "Município": "nome_municipio",
            "Grande Região (Código)": "id_regiao",
            "Grande Região": "nome_regiao",
            "Unidade da Federação (Código)": "id_estado",
            "Unidade da Federação": "nome_estado",
            "Sexo (Código)": "codigo_sexo",
            "Sexo": "sexo",
            "Grupo de idade (Código)": "codigo_grupo_idade",
            "Grupo de idade": "grupo_idade",
        }
        df = df.rename(columns={k: v for k, v in renomear.items() if k in df.columns})

        # Converter coluna de valor para numérico
        if "valor" in df.columns:
            df["valor"] = pd.to_numeric(df["valor"], errors="coerce")

        logger.info("SIDRA retornou %d registros para '%s'", len(df), prefixo)
        return df
