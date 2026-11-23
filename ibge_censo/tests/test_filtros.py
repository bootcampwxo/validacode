"""
Testes unitários para o módulo de filtros (FiltroDados).

Execute:
    pytest ibge_censo/tests/test_filtros.py -v
"""

import pandas as pd
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analise.filtros import FiltroDados


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

@pytest.fixture
def df_estados():
    """DataFrame com dados por estado incluindo região e sexo."""
    return pd.DataFrame({
        "id_estado": [35, 31, 33, 29, 41, 43, 42, 52, 50, 13],
        "sigla": ["SP", "MG", "RJ", "BA", "PR", "RS", "SC", "GO", "MS", "AM"],
        "nome_estado": [
            "São Paulo", "Minas Gerais", "Rio de Janeiro", "Bahia",
            "Paraná", "Rio Grande do Sul", "Santa Catarina",
            "Goiás", "Mato Grosso do Sul", "Amazonas",
        ],
        "nome_regiao": [
            "Sudeste", "Sudeste", "Sudeste", "Nordeste",
            "Sul", "Sul", "Sul",
            "Centro-Oeste", "Centro-Oeste", "Norte",
        ],
        "sexo": ["Total"] * 10,
        "valor": [
            45_919_049, 21_292_666, 17_463_349, 14_930_634,
            11_516_840, 11_088_065, 7_609_601,
            7_206_589, 2_756_700, 3_941_613,
        ],
    })


@pytest.fixture
def df_municipios():
    """DataFrame com municípios."""
    return pd.DataFrame({
        "id_municipio": [3550308, 3304557, 2927408, 1302603, 5300108],
        "nome_municipio": [
            "São Paulo", "Rio de Janeiro", "Salvador", "Manaus", "Brasília"
        ],
        "nome_estado": ["São Paulo", "Rio de Janeiro", "Bahia", "Amazonas", "Distrito Federal"],
        "valor": [12_325_232, 6_775_561, 2_900_319, 2_255_903, 3_094_325],
    })


# ------------------------------------------------------------------
# Testes de instanciação
# ------------------------------------------------------------------

class TestInstanciacao:
    def test_cria_filtro_com_df_valido(self, df_estados):
        filtro = FiltroDados(df_estados)
        assert filtro is not None

    def test_levanta_erro_df_vazio(self):
        with pytest.raises(ValueError, match="DataFrame vazio"):
            FiltroDados(pd.DataFrame())

    def test_levanta_erro_df_none(self):
        with pytest.raises((ValueError, AttributeError)):
            FiltroDados(None)


# ------------------------------------------------------------------
# Testes de filtro por região
# ------------------------------------------------------------------

class TestFiltroRegiao:
    def test_filtra_sudeste(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_regiao("Sudeste")
        assert len(resultado) == 3
        assert all(resultado["nome_regiao"] == "Sudeste")

    def test_filtra_sul(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_regiao("Sul")
        assert len(resultado) == 3

    def test_filtra_multiplas_regioes(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_regiao(["Sul", "Norte"])
        assert len(resultado) == 4

    def test_regiao_inexistente_retorna_vazio(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_regiao("RegionInexistente")
        assert len(resultado) == 0

    def test_filtro_case_insensitive(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_regiao("sudeste")  # minúsculo
        assert len(resultado) == 3


# ------------------------------------------------------------------
# Testes de filtro por estado
# ------------------------------------------------------------------

class TestFiltroEstado:
    def test_filtra_por_nome(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_estado("São Paulo")
        assert len(resultado) == 1
        assert resultado["nome_estado"].iloc[0] == "São Paulo"

    def test_filtra_por_sigla(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_estado("SP", usar_sigla=True)
        assert len(resultado) == 1

    def test_filtra_multiplos_estados_por_sigla(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_estado(["SP", "MG", "RJ"], usar_sigla=True)
        assert len(resultado) == 3

    def test_sigla_case_insensitive(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_estado("sp", usar_sigla=True)
        assert len(resultado) == 1

    def test_estado_inexistente_retorna_vazio(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.por_estado("Narnia")
        assert len(resultado) == 0


# ------------------------------------------------------------------
# Testes de filtro por município
# ------------------------------------------------------------------

class TestFiltroMunicipio:
    def test_filtra_por_nome(self, df_municipios):
        filtro = FiltroDados(df_municipios)
        resultado = filtro.por_municipio("São Paulo")
        assert len(resultado) == 1

    def test_filtra_parcial(self, df_municipios):
        filtro = FiltroDados(df_municipios)
        resultado = filtro.por_municipio("rio")
        # Deve encontrar "Rio de Janeiro" (case-insensitive)
        assert len(resultado) >= 1

    def test_municipio_inexistente(self, df_municipios):
        filtro = FiltroDados(df_municipios)
        resultado = filtro.por_municipio("Aldeia Inexistente")
        assert len(resultado) == 0


# ------------------------------------------------------------------
# Testes de filtro por ID de município
# ------------------------------------------------------------------

class TestFiltroIdMunicipio:
    def test_filtra_por_id(self, df_municipios):
        filtro = FiltroDados(df_municipios)
        resultado = filtro.por_id_municipio(3550308)
        assert len(resultado) == 1
        assert resultado["nome_municipio"].iloc[0] == "São Paulo"

    def test_filtra_multiplos_ids(self, df_municipios):
        filtro = FiltroDados(df_municipios)
        resultado = filtro.por_id_municipio([3550308, 3304557])
        assert len(resultado) == 2

    def test_id_inexistente(self, df_municipios):
        filtro = FiltroDados(df_municipios)
        resultado = filtro.por_id_municipio(9999999)
        assert len(resultado) == 0


# ------------------------------------------------------------------
# Testes de filtro por sexo
# ------------------------------------------------------------------

class TestFiltroSexo:
    def test_filtra_masculino(self):
        df = pd.DataFrame({
            "nome_estado": ["SP", "SP", "MG", "MG"],
            "sexo": ["Homens", "Mulheres", "Homens", "Mulheres"],
            "valor": [22_000_000, 23_000_000, 10_500_000, 10_800_000],
        })
        filtro = FiltroDados(df)
        resultado = filtro.por_sexo("Homens")
        assert len(resultado) == 2
        assert all(resultado["sexo"] == "Homens")

    def test_filtro_parcial_masc(self):
        df = pd.DataFrame({
            "nome_estado": ["SP"],
            "sexo": ["Masculino"],
            "valor": [22_000_000],
        })
        filtro = FiltroDados(df)
        resultado = filtro.por_sexo("masc")
        assert len(resultado) == 1


# ------------------------------------------------------------------
# Testes de top N
# ------------------------------------------------------------------

class TestTopN:
    def test_top_3(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.top_n(n=3)
        assert len(resultado) == 3
        # Verificar que os 3 maiores estão em ordem decrescente
        assert resultado["valor"].iloc[0] >= resultado["valor"].iloc[1]

    def test_top_3_ascendente(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.top_n(n=3, ascendente=True)
        assert len(resultado) == 3
        # Os 3 menores
        assert resultado["valor"].max() <= df_estados["valor"].nlargest(4).min()

    def test_coluna_inexistente_levanta_erro(self, df_estados):
        filtro = FiltroDados(df_estados)
        with pytest.raises(KeyError):
            filtro.top_n(n=3, coluna_valor="coluna_inexistente")

    def test_top_maior_que_linhas_retorna_tudo(self, df_estados):
        filtro = FiltroDados(df_estados)
        resultado = filtro.top_n(n=100)
        assert len(resultado) == len(df_estados)
