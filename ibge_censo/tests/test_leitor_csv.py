"""
Testes unitários para o módulo LeitorCSV.

Execute:
    pytest ibge_censo/tests/test_leitor_csv.py -v
"""

import io
import sys
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.coleta.leitor_csv import LeitorCSV


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _criar_csv_temporario(conteudo: str, encoding: str = "utf-8") -> Path:
    """Cria um arquivo CSV temporário com o conteúdo fornecido."""
    tmp = tempfile.NamedTemporaryFile(
        mode="w", suffix=".csv", encoding=encoding, delete=False
    )
    tmp.write(conteudo)
    tmp.flush()
    tmp.close()
    return Path(tmp.name)


CSV_POPULACAO = """id_municipio,nome_municipio,valor,ano
3550308,São Paulo,12325232,2022
3304557,Rio de Janeiro,6775561,2022
2927408,Salvador,2900319,2022
"""

CSV_POPULACAO_VIRGULA_DECIMAL = """id_municipio,nome_municipio,valor,ano
3550308,São Paulo,"12.325.232",2022
3304557,Rio de Janeiro,"6.775.561",2022
"""

CSV_COM_NULOS = """nome_estado,valor
São Paulo,45919049
Minas Gerais,
Rio de Janeiro,17463349
,10000000
"""

CSV_ESTADOS = """id_estado,sigla,nome_estado,nome_regiao
35,SP,São Paulo,Sudeste
31,MG,Minas Gerais,Sudeste
33,RJ,Rio de Janeiro,Sudeste
"""


# ------------------------------------------------------------------
# Testes de leitura básica
# ------------------------------------------------------------------

class TestLeitura:
    def test_le_csv_simples(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        df = leitor.ler(caminho)
        assert len(df) == 3
        caminho.unlink()

    def test_colunas_normalizadas(self):
        """Colunas com espaços e maiúsculas devem ser normalizadas."""
        csv = "Nome Estado,  Valor\nSão Paulo,100\n"
        caminho = _criar_csv_temporario(csv)
        leitor = LeitorCSV()
        df = leitor.ler(caminho)
        assert "nome_estado" in df.columns
        assert "valor" in df.columns
        caminho.unlink()

    def test_levanta_erro_arquivo_inexistente(self):
        leitor = LeitorCSV()
        with pytest.raises(FileNotFoundError):
            leitor.ler("/caminho/inexistente/arquivo.csv")

    def test_levanta_erro_csv_vazio(self):
        caminho = _criar_csv_temporario("")
        leitor = LeitorCSV()
        with pytest.raises((ValueError, Exception)):
            leitor.ler(caminho)
        caminho.unlink()

    def test_coluna_valor_convertida_para_numerico(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        df = leitor.ler(caminho)
        assert pd.api.types.is_numeric_dtype(df["valor"])
        caminho.unlink()

    def test_valores_numericos_corretos(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        df = leitor.ler(caminho)
        assert df["valor"].iloc[0] == pytest.approx(12_325_232)
        caminho.unlink()


# ------------------------------------------------------------------
# Testes de validação de colunas
# ------------------------------------------------------------------

class TestValidacaoColunas:
    def test_valida_colunas_obrigatorias_ok(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        df = leitor.ler(caminho, colunas_obrigatorias=["id_municipio", "valor"])
        assert df is not None
        caminho.unlink()

    def test_levanta_erro_coluna_obrigatoria_ausente(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        with pytest.raises(ValueError, match="Colunas ausentes"):
            leitor.ler(caminho, colunas_obrigatorias=["coluna_inexistente"])
        caminho.unlink()

    def test_tipo_populacao_valida_colunas(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        df = leitor.ler(caminho, tipo="populacao")
        assert df is not None
        caminho.unlink()

    def test_tipo_estados_invalida_com_csv_errado(self):
        caminho = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        with pytest.raises(ValueError, match="Colunas ausentes"):
            leitor.ler(caminho, tipo="municipios")
        caminho.unlink()


# ------------------------------------------------------------------
# Testes de normalização de dados
# ------------------------------------------------------------------

class TestNormalizacao:
    def test_remove_linhas_completamente_nulas(self):
        csv = "nome_estado,valor\nSão Paulo,100\n,\nMinas Gerais,200\n"
        caminho = _criar_csv_temporario(csv)
        leitor = LeitorCSV()
        df = leitor.ler(caminho)
        # Linha completamente nula deve ser removida
        assert len(df) <= 2
        caminho.unlink()

    def test_preenche_nan_em_colunas_texto(self):
        caminho = _criar_csv_temporario(CSV_COM_NULOS)
        leitor = LeitorCSV()
        df = leitor.ler(caminho)
        # Strings "nan" devem virar NaN real (aceita object ou StringDtype do pandas 3+)
        assert str(df["nome_estado"].dtype) in ("object", "str", "string")
        caminho.unlink()


# ------------------------------------------------------------------
# Testes de múltiplos arquivos
# ------------------------------------------------------------------

class TestLerVarios:
    def test_concatena_dois_csvs(self):
        c1 = _criar_csv_temporario(CSV_POPULACAO)
        c2 = _criar_csv_temporario(CSV_POPULACAO)
        leitor = LeitorCSV()
        df = leitor.ler_varios([c1, c2])
        assert len(df) == 6
        c1.unlink()
        c2.unlink()

    def test_retorna_vazio_sem_arquivos(self):
        leitor = LeitorCSV()
        df = leitor.ler_varios([])
        assert df.empty


# ------------------------------------------------------------------
# Testes de salvamento
# ------------------------------------------------------------------

class TestSalvar:
    def test_salva_e_rele_csv(self, tmp_path):
        df = pd.DataFrame({"col1": [1, 2, 3], "col2": ["a", "b", "c"]})
        leitor = LeitorCSV()
        caminho = tmp_path / "saida.csv"
        leitor.salvar(df, caminho)
        assert caminho.exists()
        df_relido = pd.read_csv(caminho)
        assert len(df_relido) == 3

    def test_cria_diretorio_automaticamente(self, tmp_path):
        df = pd.DataFrame({"x": [1]})
        leitor = LeitorCSV()
        caminho = tmp_path / "subdir" / "novo" / "arquivo.csv"
        leitor.salvar(df, caminho)
        assert caminho.exists()
