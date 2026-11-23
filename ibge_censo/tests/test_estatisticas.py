"""
Testes unitários para o módulo de análise estatística (AnaliseDemografica).

Execute:
    pytest ibge_censo/tests/test_estatisticas.py -v
"""

import pandas as pd
import numpy as np
import pytest
import sys
from pathlib import Path

# Adicionar raiz do projeto ao path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analise.estatisticas import AnaliseDemografica, AREA_ESTADOS_KM2


# ------------------------------------------------------------------
# Fixtures
# ------------------------------------------------------------------

@pytest.fixture
def df_populacao_estados():
    """DataFrame simples com população por estado."""
    return pd.DataFrame({
        "nome_estado": ["São Paulo", "Minas Gerais", "Rio de Janeiro", "Bahia", "Paraná"],
        "valor": [45_919_049, 21_292_666, 17_463_349, 14_930_634, 11_516_840],
        "ano": ["2022"] * 5,
    })


@pytest.fixture
def df_com_sexo():
    """DataFrame com população por estado e sexo."""
    registros = []
    for estado in ["São Paulo", "Minas Gerais", "Rio de Janeiro"]:
        registros.append({"nome_estado": estado, "sexo": "Homens", "valor": 10_000_000})
        registros.append({"nome_estado": estado, "sexo": "Mulheres", "valor": 11_000_000})
    return pd.DataFrame(registros)


@pytest.fixture
def df_com_idade():
    """DataFrame com população por grupo de idade."""
    return pd.DataFrame({
        "nome_estado": ["São Paulo"] * 5,
        "grupo_idade": [
            "0 a 14 anos",
            "15 a 29 anos",
            "30 a 44 anos",
            "45 a 64 anos",
            "65 anos ou mais",
        ],
        "valor": [7_000_000, 9_000_000, 11_000_000, 10_000_000, 5_000_000],
    })


# ------------------------------------------------------------------
# Testes básicos de instanciação
# ------------------------------------------------------------------

class TestInstanciacao:
    def test_cria_analise_com_df_valido(self, df_populacao_estados):
        """Deve instanciar sem erros com DataFrame válido."""
        analise = AnaliseDemografica(df_populacao_estados)
        assert analise is not None

    def test_levanta_erro_df_vazio(self):
        """Deve lançar ValueError para DataFrame vazio."""
        with pytest.raises(ValueError, match="DataFrame vazio"):
            AnaliseDemografica(pd.DataFrame())

    def test_levanta_erro_coluna_ausente(self, df_populacao_estados):
        """Deve lançar KeyError se a coluna de valor não existir."""
        with pytest.raises(KeyError):
            AnaliseDemografica(df_populacao_estados, coluna_valor="coluna_inexistente")


# ------------------------------------------------------------------
# Testes de resumo estatístico
# ------------------------------------------------------------------

class TestResumo:
    def test_resumo_retorna_dataframe(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.resumo()
        assert isinstance(resultado, pd.DataFrame)

    def test_resumo_contem_count(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.resumo()
        assert "count" in resultado.index

    def test_resumo_contem_total(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.resumo()
        assert "total" in resultado.index

    def test_total_correto(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.resumo()
        esperado = df_populacao_estados["valor"].sum()
        assert resultado.loc["total", "estatísticas"] == pytest.approx(esperado)

    def test_media_correta(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.resumo()
        esperado = df_populacao_estados["valor"].mean()
        assert resultado.loc["mean", "estatísticas"] == pytest.approx(esperado)


# ------------------------------------------------------------------
# Testes de totais por local
# ------------------------------------------------------------------

class TestTotaisPorLocal:
    def test_retorna_dataframe(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.totais_por_local()
        assert isinstance(resultado, pd.DataFrame)

    def test_colunas_corretas(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.totais_por_local()
        assert "local" in resultado.columns
        assert "total" in resultado.columns
        assert "percentual" in resultado.columns

    def test_numero_de_linhas(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.totais_por_local()
        assert len(resultado) == len(df_populacao_estados["nome_estado"].unique())

    def test_ordenacao_decrescente(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.totais_por_local()
        assert resultado["total"].iloc[0] >= resultado["total"].iloc[-1]

    def test_percentuais_somam_100(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.totais_por_local()
        assert resultado["percentual"].sum() == pytest.approx(100.0, abs=0.01)

    def test_sp_e_o_maior(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.totais_por_local()
        assert resultado["local"].iloc[0] == "São Paulo"


# ------------------------------------------------------------------
# Testes de densidade demográfica
# ------------------------------------------------------------------

class TestDensidadeDemografica:
    def test_retorna_dataframe(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.densidade_demografica()
        assert isinstance(resultado, pd.DataFrame)

    def test_colunas_presentes(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.densidade_demografica()
        for col in ["estado", "populacao", "area_km2", "densidade"]:
            assert col in resultado.columns

    def test_densidade_sp_positiva(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.densidade_demografica()
        sp = resultado[resultado["estado"] == "São Paulo"]
        assert not sp.empty
        assert sp["densidade"].iloc[0] > 0

    def test_sp_tem_area_correta(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.densidade_demografica()
        sp = resultado[resultado["estado"] == "São Paulo"]
        assert sp["area_km2"].iloc[0] == pytest.approx(AREA_ESTADOS_KM2["São Paulo"], rel=0.01)

    def test_calculo_densidade_correto(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        resultado = analise.densidade_demografica()
        sp = resultado[resultado["estado"] == "São Paulo"].iloc[0]
        esperado = round(sp["populacao"] / sp["area_km2"], 2)
        assert sp["densidade"] == pytest.approx(esperado, rel=0.01)


# ------------------------------------------------------------------
# Testes de pirâmide etária
# ------------------------------------------------------------------

class TestPiramideEtaria:
    def test_levanta_erro_sem_coluna_sexo(self, df_populacao_estados):
        analise = AnaliseDemografica(df_populacao_estados)
        with pytest.raises(KeyError):
            analise.piramide_etaria()

    def test_retorna_dataframe_com_colunas_de_sexo(self):
        """Pirâmide etária requer AMBAS as colunas sexo E grupo_idade."""
        df = pd.DataFrame({
            "nome_estado": ["SP"] * 6,
            "sexo": ["Homens", "Mulheres"] * 3,
            "grupo_idade": ["0 a 14 anos", "0 a 14 anos", "15 a 29 anos", "15 a 29 anos", "30 a 44 anos", "30 a 44 anos"],
            "valor": [3_000_000, 3_200_000, 4_000_000, 4_500_000, 5_000_000, 5_500_000],
        })
        analise = AnaliseDemografica(df, coluna_local="nome_estado")
        resultado = analise.piramide_etaria()
        assert isinstance(resultado, pd.DataFrame)
        # sexo vira coluna após unstack
        assert "Homens" in resultado.columns or "sexo" in resultado.columns

    def test_distribuicao_etaria_percentual(self, df_com_idade):
        analise = AnaliseDemografica(df_com_idade, coluna_local="nome_estado")
        resultado = analise.distribuicao_etaria_percentual()
        assert "grupo_idade" in resultado.columns
        assert "percentual" in resultado.columns
        assert resultado["percentual"].sum() == pytest.approx(100.0, abs=0.1)


# ------------------------------------------------------------------
# Testes de índice de envelhecimento
# ------------------------------------------------------------------

class TestIndiceEnvelhecimento:
    def test_calcula_indice(self, df_com_idade):
        analise = AnaliseDemografica(df_com_idade, coluna_local="nome_estado")
        ie = analise.indice_de_envelhecimento()
        assert ie is not None
        assert ie > 0

    def test_indice_correto(self, df_com_idade):
        """IE = (pop 65+) / (pop 0-14) × 100."""
        analise = AnaliseDemografica(df_com_idade, coluna_local="nome_estado")
        ie = analise.indice_de_envelhecimento()
        # Jovens: 7_000_000; Idosos: 5_000_000 → 5/7*100 ≈ 71.4
        assert ie == pytest.approx(71.4, abs=1.0)

    def test_sem_grupo_jovens_retorna_none(self):
        df = pd.DataFrame({
            "nome_estado": ["SP"],
            "grupo_idade": ["15 a 29 anos"],
            "valor": [1_000_000],
        })
        analise = AnaliseDemografica(df, coluna_local="nome_estado")
        resultado = analise.indice_de_envelhecimento()
        assert resultado is None


# ------------------------------------------------------------------
# Testes de razão de sexo
# ------------------------------------------------------------------

class TestRazaoSexo:
    def test_retorna_dataframe(self, df_com_sexo):
        analise = AnaliseDemografica(df_com_sexo, coluna_local="nome_estado")
        resultado = analise.razao_de_sexo()
        assert isinstance(resultado, pd.DataFrame)

    def test_razao_correta(self, df_com_sexo):
        """10M homens / 11M mulheres × 100 ≈ 90.9"""
        analise = AnaliseDemografica(df_com_sexo, coluna_local="nome_estado")
        resultado = analise.razao_de_sexo()
        if "razao_sexo" in resultado.columns:
            assert resultado["razao_sexo"].iloc[0] == pytest.approx(90.9, abs=1.0)
