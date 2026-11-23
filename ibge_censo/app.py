"""
Interface gráfica interativa com Streamlit para análise de dados do IBGE.

Execução:
    streamlit run ibge_censo/app.py

Requisitos: streamlit >= 1.35
"""

import io
import logging
import sys
from pathlib import Path

import pandas as pd
import streamlit as st

# Adicionar o diretório raiz ao path para importar os módulos do projeto
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.WARNING)

# ------------------------------------------------------------------
# Configuração da página
# ------------------------------------------------------------------
st.set_page_config(
    page_title="IBGE Censo — Análise Demográfica",
    page_icon="🇧🇷",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ------------------------------------------------------------------
# Imports tardios (não travam se as libs faltarem)
# ------------------------------------------------------------------
try:
    from src.coleta.api_ibge import IBGEApiClient
    from src.coleta.leitor_csv import LeitorCSV
    from src.analise.estatisticas import AnaliseDemografica
    from src.analise.filtros import FiltroDados
    from src.visualizacao.graficos import GraficoCenso
except ImportError as e:
    st.error(f"❌ Erro ao importar módulos: {e}")
    st.stop()

# ------------------------------------------------------------------
# Helpers de cache (TTL = 10 minutos para evitar re-consultas à API)
# ------------------------------------------------------------------

@st.cache_data(ttl=600, show_spinner="Consultando API IBGE…")
def carregar_estados(id_regiao=None):
    return IBGEApiClient().listar_estados(id_regiao=id_regiao)


@st.cache_data(ttl=600, show_spinner="Consultando dados de população…")
def carregar_populacao_sexo(nivel_geo="3"):
    return IBGEApiClient().obter_populacao_por_sexo(nivel_geo=nivel_geo)


@st.cache_data(ttl=600, show_spinner="Consultando dados etários…")
def carregar_populacao_idade(nivel_geo="3"):
    return IBGEApiClient().obter_populacao_por_idade(nivel_geo=nivel_geo)


@st.cache_data(ttl=600, show_spinner="Consultando municípios…")
def carregar_municipios(id_estado=None):
    return IBGEApiClient().listar_municipios(id_estado=id_estado)


# ------------------------------------------------------------------
# Sidebar
# ------------------------------------------------------------------

def _sidebar() -> dict:
    """Renderiza a barra lateral e retorna as configurações do usuário."""
    with st.sidebar:
        st.image(
            "https://www.ibge.gov.br/templates/ibge/assets/img/ibge-logo.svg",
            width=180,
        )
        st.title("⚙️ Configurações")
        st.markdown("---")

        fonte = st.radio(
            "Fonte de dados",
            options=["🌐 API IBGE (online)", "📁 Arquivo CSV (local)"],
            index=0,
        )

        nivel_geo = st.selectbox(
            "Nível geográfico",
            options=["Estado", "Região", "Brasil"],
            index=0,
            disabled=(fonte != "🌐 API IBGE (online)"),
        )

        filtro_regiao = None
        if nivel_geo == "Estado":
            filtro_regiao = st.multiselect(
                "Filtrar por região",
                options=["Norte", "Nordeste", "Sudeste", "Sul", "Centro-Oeste"],
                default=[],
            )

        top_n = st.slider("Top N localidades nos gráficos", 5, 27, 15)
        dpi = st.slider("Qualidade das imagens (DPI)", 72, 300, 150, step=30)

        st.markdown("---")
        st.caption("Dados: IBGE Censo 2022")

    return {
        "fonte": fonte,
        "nivel_geo": nivel_geo,
        "filtro_regiao": filtro_regiao or [],
        "top_n": top_n,
        "dpi": dpi,
    }


# ------------------------------------------------------------------
# Páginas da aplicação
# ------------------------------------------------------------------

def pagina_populacao(cfg: dict) -> None:
    """Página de análise de população total."""
    st.header("👥 População por Localidade")

    nivel_map = {"Estado": "3", "Região": "2", "Brasil": "1"}
    nivel_geo = nivel_map[cfg["nivel_geo"]]

    with st.spinner("Carregando dados de população…"):
        try:
            df_raw = carregar_populacao_sexo(nivel_geo=nivel_geo)
        except Exception as exc:
            st.error(f"Erro ao consultar API: {exc}")
            return

    if df_raw.empty:
        st.warning("Nenhum dado retornado pela API.")
        return

    # Detectar coluna de localidade
    col_local = next(
        (c for c in ["nome_estado", "nome_regiao", "brasil"] if c in df_raw.columns),
        df_raw.columns[0],
    )

    # Aplicar filtro de região, se selecionado
    df = df_raw.copy()
    if cfg["filtro_regiao"] and "nome_regiao" in df.columns:
        df = FiltroDados(df).por_regiao(cfg["filtro_regiao"])

    analise = AnaliseDemografica(df, coluna_local=col_local)
    totais = analise.totais_por_local()
    resumo = analise.resumo()

    # Layout em colunas
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader(f"Distribuição por {cfg['nivel_geo']}")
        grafico = GraficoCenso(diretorio_saida="outputs", dpi=cfg["dpi"])
        caminho = grafico.barras_populacao(
            totais,
            titulo=f"Populacao por {cfg['nivel_geo']}",
            top_n=cfg["top_n"],
        )
        st.image(str(caminho))

    with col2:
        st.subheader("📊 Estatísticas")
        st.dataframe(resumo.rename(columns={"estatísticas": "valor"}), use_container_width=True)

    st.subheader("📋 Dados tabulares")
    st.dataframe(totais, use_container_width=True)

    # Botão de download
    csv_bytes = totais.to_csv(index=False).encode("utf-8")
    st.download_button(
        "⬇️ Baixar CSV",
        data=csv_bytes,
        file_name="populacao_por_localidade.csv",
        mime="text/csv",
    )


def pagina_densidade(cfg: dict) -> None:
    """Página de densidade demográfica."""
    st.header("🗺️ Densidade Demográfica")

    with st.spinner("Calculando densidade…"):
        try:
            df_raw = carregar_populacao_sexo(nivel_geo="3")
        except Exception as exc:
            st.error(f"Erro ao consultar API: {exc}")
            return

    if df_raw.empty:
        st.warning("Nenhum dado retornado pela API.")
        return

    analise = AnaliseDemografica(df_raw, coluna_local="nome_estado")
    densidade = analise.densidade_demografica()

    col1, col2 = st.columns([1.3, 1])

    with col1:
        grafico = GraficoCenso(diretorio_saida="outputs", dpi=cfg["dpi"])
        caminho = grafico.mapa_calor_densidade(densidade)
        st.image(str(caminho))

    with col2:
        st.subheader("📋 Tabela de densidade")
        st.dataframe(
            densidade.style.format(
                {"populacao": "{:,.0f}", "area_km2": "{:,.1f}", "densidade": "{:.2f}"}
            ),
            use_container_width=True,
        )

    # Métricas resumidas
    st.markdown("---")
    m1, m2, m3 = st.columns(3)
    m1.metric("Estado mais denso", densidade.nlargest(1, "densidade")["estado"].iloc[0],
               f"{densidade.nlargest(1, 'densidade')['densidade'].iloc[0]:.1f} hab/km²")
    m2.metric("Estado menos denso", densidade.nsmallest(1, "densidade")["estado"].iloc[0],
               f"{densidade.nsmallest(1, 'densidade')['densidade'].iloc[0]:.2f} hab/km²")
    m3.metric("Média nacional", f"{densidade['densidade'].mean():.1f} hab/km²")


def pagina_piramide(cfg: dict) -> None:
    """Página de pirâmide etária."""
    st.header("🔺 Pirâmide Etária")

    nivel_map = {"Estado": "3", "Região": "2", "Brasil": "1"}
    nivel_geo = nivel_map[cfg["nivel_geo"]]

    with st.spinner("Carregando dados por grupo de idade…"):
        try:
            df_raw = carregar_populacao_idade(nivel_geo=nivel_geo)
        except Exception as exc:
            st.error(f"Erro ao consultar API: {exc}")
            return

    if df_raw.empty:
        st.warning("Nenhum dado etário retornado pela API.")
        return

    col_local = next(
        (c for c in ["nome_estado", "nome_regiao"] if c in df_raw.columns),
        df_raw.columns[0],
    )
    analise = AnaliseDemografica(df_raw, coluna_local=col_local)

    try:
        pir = analise.piramide_etaria()
        dist = analise.distribuicao_etaria_percentual()
    except KeyError as exc:
        st.warning(f"⚠️ {exc}")
        st.info("O nível geográfico selecionado pode não retornar colunas de sexo. Tente 'Brasil'.")
        return

    col1, col2 = st.columns([1.5, 1])

    with col1:
        grafico = GraficoCenso(diretorio_saida="outputs", dpi=cfg["dpi"])
        caminho = grafico.piramide_etaria(pir)
        st.image(str(caminho))

    with col2:
        st.subheader("Distribuição Etária (%)")
        caminho_pizza = grafico.pizza_distribuicao(
            dist,
            coluna_categoria="grupo_idade",
            coluna_valor="populacao",
            titulo="Grupos de Idade",
        )
        st.image(str(caminho_pizza))

    # Índice de envelhecimento
    ie = analise.indice_de_envelhecimento()
    if ie is not None:
        st.info(f"📈 **Índice de envelhecimento:** {ie:.1f} idosos (65+) para cada 100 jovens (0-14 anos)")


def pagina_csv(cfg: dict) -> None:
    """Página para upload e análise de CSV."""
    st.header("📁 Análise de Arquivo CSV")

    arquivo = st.file_uploader(
        "Carregue um arquivo CSV com dados do IBGE",
        type=["csv"],
        help="Arquivos exportados do SIDRA (sidra.ibge.gov.br) ou gerados por esta aplicação",
    )

    if arquivo is None:
        st.info("📂 Faça o upload de um arquivo CSV para começar.")
        st.markdown("""
        **Formatos aceitos:**
        - Exportações do portal SIDRA
        - CSVs gerados por esta aplicação
        - Qualquer CSV com dados demográficos

        **Dica:** Acesse [sidra.ibge.gov.br](https://sidra.ibge.gov.br) para exportar dados.
        """)
        return

    try:
        # Ler bytes e passar ao LeitorCSV via StringIO
        conteudo = arquivo.read().decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(conteudo), dtype=str)
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # Converter colunas numéricas
        for col in df.columns:
            df[col] = pd.to_numeric(df[col].str.replace(".", "", regex=False)
                                    .str.replace(",", ".", regex=False), errors="ignore")
    except Exception as exc:
        st.error(f"Erro ao ler arquivo: {exc}")
        return

    st.success(f"✅ Arquivo carregado: **{arquivo.name}** — {df.shape[0]} linhas × {df.shape[1]} colunas")

    # Seletor de colunas
    col1, col2 = st.columns(2)
    col_local = col1.selectbox("Coluna de localidade", options=df.columns, index=0)
    numericas = df.select_dtypes(include="number").columns.tolist()
    if not numericas:
        st.warning("Nenhuma coluna numérica encontrada no arquivo.")
        return
    col_valor = col2.selectbox("Coluna de valor", options=numericas, index=0)

    analise = AnaliseDemografica(df, coluna_valor=col_valor, coluna_local=col_local)
    totais = analise.totais_por_local()

    st.subheader("📊 Resumo Estatístico")
    st.dataframe(analise.resumo(), use_container_width=True)

    st.subheader("📋 Totais por Localidade")
    st.dataframe(totais, use_container_width=True)

    grafico = GraficoCenso(diretorio_saida="outputs", dpi=cfg["dpi"])
    caminho = grafico.barras_populacao(totais, titulo=f"{col_valor} por {col_local}", top_n=cfg["top_n"])
    st.image(str(caminho))


def pagina_sobre() -> None:
    """Página de documentação e sobre."""
    st.header("ℹ️ Sobre a Aplicação")
    st.markdown("""
    ## IBGE Censo — Análise Demográfica

    Aplicação Python para análise interativa de dados do **Censo Demográfico do IBGE**.

    ### Funcionalidades
    | Aba | Descrição |
    |-----|-----------|
    | 👥 Populacao | Análise de população total por estado/região |
    | 🗺️ Densidade | Mapa de calor de densidade demográfica (hab/km²) |
    | 🔺 Pirâmide Etária | Pirâmide etária por sexo e grupo de idade |
    | 📁 CSV | Upload e análise de arquivos CSV do SIDRA |

    ### APIs utilizadas
    - **SIDRA** — Sistema IBGE de Recuperação Automática (`apisidra.ibge.gov.br`)
    - **ServiceData** — API de localidades do IBGE (`servicodados.ibge.gov.br`)

    ### Tecnologias
    `Python 3.11+` · `pandas` · `numpy` · `matplotlib` · `seaborn` · `streamlit` · `requests`

    ### Estrutura do projeto
    ```
    ibge_censo/
    ├── src/
    │   ├── coleta/          # API IBGE e leitura de CSV
    │   ├── analise/         # Estatísticas e filtros
    │   └── visualizacao/    # Gráficos com matplotlib/seaborn
    ├── tests/               # Testes unitários
    ├── cli.py               # Interface de linha de comando
    └── app.py               # Esta interface Streamlit
    ```

    ### Licença
    Dados do IBGE disponíveis sob Licença de Dados Abertos — [ibge.gov.br](https://www.ibge.gov.br).
    """)


# ------------------------------------------------------------------
# App principal
# ------------------------------------------------------------------

def main() -> None:
    """Ponto de entrada da interface Streamlit."""
    cfg = _sidebar()

    st.title("🇧🇷 Análise de Dados — Censo IBGE")
    st.caption("Fonte: IBGE · Censo Demográfico 2022 · API SIDRA")
    st.markdown("---")

    aba_pop, aba_dens, aba_pir, aba_csv, aba_sobre = st.tabs([
        "👥 Populacao",
        "🗺️ Densidade",
        "🔺 Pirâmide Etária",
        "📁 CSV",
        "ℹ️ Sobre",
    ])

    if cfg["fonte"] == "🌐 API IBGE (online)":
        with aba_pop:
            pagina_populacao(cfg)
        with aba_dens:
            pagina_densidade(cfg)
        with aba_pir:
            pagina_piramide(cfg)
    else:
        with aba_pop, aba_dens, aba_pir:
            st.info("Selecione '📁 Arquivo CSV' na barra lateral e vá para a aba CSV.")

    with aba_csv:
        pagina_csv(cfg)

    with aba_sobre:
        pagina_sobre()


if __name__ == "__main__":
    main()
