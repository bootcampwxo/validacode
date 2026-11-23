"""
Geração de visualizações e gráficos com matplotlib e seaborn.

Todos os métodos aceitam um parâmetro opcional `caminho_saida` para salvar
o gráfico em disco além de exibi-lo.
"""

import logging
from pathlib import Path
from typing import Optional

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd
import seaborn as sns

logger = logging.getLogger(__name__)

# Paleta de cores padrão (acessível para daltônicos)
PALETTE_REGIOES = {
    "Norte": "#1f77b4",
    "Nordeste": "#ff7f0e",
    "Sudeste": "#2ca02c",
    "Sul": "#d62728",
    "Centro-Oeste": "#9467bd",
}

# Estilo global do seaborn
sns.set_theme(style="whitegrid", context="notebook", font_scale=1.1)


class GraficoCenso:
    """
    Gera visualizações para dados demográficos do IBGE.

    Parâmetros
    ----------
    diretorio_saida : str | Path
        Pasta onde os gráficos serão salvos. Criada automaticamente se
        não existir.
    dpi : int
        Resolução das imagens exportadas (padrão: 150).
    """

    def __init__(
        self,
        diretorio_saida: str | Path = "outputs",
        dpi: int = 150,
    ) -> None:
        self.diretorio_saida = Path(diretorio_saida)
        self.diretorio_saida.mkdir(parents=True, exist_ok=True)
        self.dpi = dpi

    # ------------------------------------------------------------------
    # Gráficos de população
    # ------------------------------------------------------------------

    def barras_populacao(
        self,
        df: pd.DataFrame,
        coluna_local: str = "local",
        coluna_valor: str = "total",
        titulo: str = "População por Localidade",
        top_n: int = 20,
        caminho_saida: Optional[str] = None,
        horizontal: bool = True,
    ) -> Path:
        """
        Gráfico de barras com a população por localidade.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame com colunas de localidade e valor.
        coluna_local : str
            Nome da coluna com os rótulos geográficos.
        coluna_valor : str
            Nome da coluna numérica.
        titulo : str
            Título do gráfico.
        top_n : int
            Quantas localidades exibir (as N maiores).
        caminho_saida : str, opcional
            Nome do arquivo de saída (sem extensão). Padrão: deriva do título.
        horizontal : bool
            Se True, barras na horizontal (melhor para muitos rótulos).
        """
        df_plot = df.nlargest(top_n, coluna_valor) if len(df) > top_n else df.copy()

        fig, ax = plt.subplots(figsize=(12, max(6, top_n * 0.45)))

        if horizontal:
            df_plot_sorted = df_plot.sort_values(coluna_valor, ascending=True)
            ax.barh(df_plot_sorted[coluna_local], df_plot_sorted[coluna_valor] / 1_000_000, color="#1f77b4")
            ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x:.1f}M"))
            ax.set_xlabel("População (milhões)", labelpad=10)
        else:
            df_plot_sorted = df_plot.sort_values(coluna_valor, ascending=False)
            ax.bar(df_plot_sorted[coluna_local], df_plot_sorted[coluna_valor] / 1_000_000, color="#1f77b4")
            ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x:.1f}M"))
            ax.set_ylabel("População (milhões)", labelpad=10)
            plt.xticks(rotation=45, ha="right")

        ax.set_title(titulo, pad=15, fontweight="bold")
        plt.tight_layout()

        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    def mapa_calor_densidade(
        self,
        df: pd.DataFrame,
        coluna_regiao: str = "estado",
        coluna_valor: str = "densidade",
        titulo: str = "Densidade Demográfica (hab/km²)",
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Mapa de calor (heatmap) da densidade demográfica por estado/região.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame com coluna de localidade e valores numéricos.
        coluna_regiao : str
            Coluna com os rótulos geográficos.
        coluna_valor : str
            Coluna com os valores a representar no calor.
        titulo : str
            Título do gráfico.
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        pivot = df[[coluna_regiao, coluna_valor]].set_index(coluna_regiao)
        fig, ax = plt.subplots(figsize=(8, max(6, len(pivot) * 0.35)))
        sns.heatmap(
            pivot,
            annot=True,
            fmt=".1f",
            cmap="YlOrRd",
            linewidths=0.5,
            ax=ax,
            cbar_kws={"label": "hab/km²"},
        )
        ax.set_title(titulo, pad=15, fontweight="bold")
        ax.set_ylabel("")
        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    # ------------------------------------------------------------------
    # Pirâmide etária
    # ------------------------------------------------------------------

    def piramide_etaria(
        self,
        df: pd.DataFrame,
        coluna_grupo: str = "grupo_idade",
        col_masc: str = "Homens",
        col_fem: str = "Mulheres",
        titulo: str = "Pirâmide Etária",
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Pirâmide etária com homens à esquerda e mulheres à direita.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame pivotado com grupos de idade nas linhas e
            sexo nas colunas (saída de AnaliseDemografica.piramide_etaria).
        coluna_grupo : str
            Coluna com os grupos de idade.
        col_masc : str
            Coluna com a contagem de homens.
        col_fem : str
            Coluna com a contagem de mulheres.
        titulo : str
            Título do gráfico.
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        # Validar que as colunas existem (tenta match parcial)
        col_masc = self._encontrar_coluna(df, [col_masc, "masc", "homem", "home"])
        col_fem = self._encontrar_coluna(df, [col_fem, "fem", "mulher"])
        if not col_masc or not col_fem:
            raise KeyError(f"Colunas de sexo não encontradas. Disponíveis: {list(df.columns)}")

        df_ord = df.sort_values(coluna_grupo).reset_index(drop=True)
        grupos = df_ord[coluna_grupo]
        masc = df_ord[col_masc] / 1000
        fem = df_ord[col_fem] / 1000

        fig, ax = plt.subplots(figsize=(12, max(8, len(grupos) * 0.45)))
        ax.barh(grupos, -masc, color="#4472C4", label="Homens")
        ax.barh(grupos, fem, color="#ED7D31", label="Mulheres")

        # Eixo X com valores absolutos
        max_val = max(masc.max(), fem.max())
        ax.set_xlim(-max_val * 1.15, max_val * 1.15)
        ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{abs(x):.0f}k"))
        ax.axvline(0, color="black", linewidth=0.8)

        ax.set_title(titulo, pad=15, fontweight="bold")
        ax.legend(loc="lower right")
        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    # ------------------------------------------------------------------
    # Distribuição e composição
    # ------------------------------------------------------------------

    def pizza_distribuicao(
        self,
        df: pd.DataFrame,
        coluna_categoria: str,
        coluna_valor: str = "populacao",
        titulo: str = "Distribuição da População",
        top_n: int = 8,
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Gráfico de pizza com distribuição por categoria.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame com categorias e valores.
        coluna_categoria : str
            Coluna com os rótulos das fatias.
        coluna_valor : str
            Coluna com os valores numéricos.
        titulo : str
            Título do gráfico.
        top_n : int
            Quantidade de categorias exibidas individualmente;
            as demais são agrupadas em "Outros".
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        df_ord = df.sort_values(coluna_valor, ascending=False).reset_index(drop=True)
        if len(df_ord) > top_n:
            outros = pd.DataFrame(
                [{coluna_categoria: "Outros", coluna_valor: df_ord.iloc[top_n:][coluna_valor].sum()}]
            )
            df_ord = pd.concat([df_ord.iloc[:top_n], outros], ignore_index=True)

        fig, ax = plt.subplots(figsize=(10, 7))
        wedges, texts, autotexts = ax.pie(
            df_ord[coluna_valor],
            labels=df_ord[coluna_categoria],
            autopct="%1.1f%%",
            pctdistance=0.82,
            startangle=140,
            colors=sns.color_palette("tab10", len(df_ord)),
        )
        for autotext in autotexts:
            autotext.set_fontsize(9)
        ax.set_title(titulo, pad=15, fontweight="bold")
        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    def barras_agrupadas_sexo(
        self,
        df: pd.DataFrame,
        coluna_local: str = "local",
        col_masc: str = "masculino",
        col_fem: str = "feminino",
        titulo: str = "Distribuição por Sexo",
        top_n: int = 15,
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Gráfico de barras agrupadas comparando masculino × feminino por estado.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame com colunas de localidade, masculino e feminino.
        coluna_local : str
            Coluna com os rótulos geográficos.
        col_masc : str
            Coluna com valores masculinos.
        col_fem : str
            Coluna com valores femininos.
        titulo : str
            Título do gráfico.
        top_n : int
            Quantidade de estados exibidos.
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        df_plot = df.head(top_n).copy()
        x = np.arange(len(df_plot))
        largura = 0.38

        fig, ax = plt.subplots(figsize=(14, 6))
        ax.bar(x - largura / 2, df_plot[col_masc] / 1_000_000, largura, label="Masculino", color="#4472C4")
        ax.bar(x + largura / 2, df_plot[col_fem] / 1_000_000, largura, label="Feminino", color="#ED7D31")

        ax.set_xticks(x)
        ax.set_xticklabels(df_plot[coluna_local], rotation=45, ha="right")
        ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: f"{v:.1f}M"))
        ax.set_ylabel("População (milhões)", labelpad=10)
        ax.set_title(titulo, pad=15, fontweight="bold")
        ax.legend()
        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    # ------------------------------------------------------------------
    # Escolaridade e renda
    # ------------------------------------------------------------------

    def barras_horizontais_escolaridade(
        self,
        df: pd.DataFrame,
        coluna_nivel: str = "nivel_instrucao",
        coluna_percentual: str = "percentual",
        titulo: str = "Distribuição por Nível de Instrução",
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Barras horizontais com percentual por nível de instrução.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame com nível de instrução e percentual.
        coluna_nivel : str
            Coluna com os rótulos de instrução.
        coluna_percentual : str
            Coluna com os percentuais.
        titulo : str
            Título do gráfico.
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        df_ord = df.sort_values(coluna_percentual, ascending=True)
        cores = sns.color_palette("Blues_d", len(df_ord))
        fig, ax = plt.subplots(figsize=(11, max(5, len(df_ord) * 0.5)))
        bars = ax.barh(df_ord[coluna_nivel], df_ord[coluna_percentual], color=cores)
        ax.bar_label(bars, fmt="%.1f%%", padding=4)
        ax.set_xlabel("Percentual (%)", labelpad=10)
        ax.set_title(titulo, pad=15, fontweight="bold")
        ax.set_xlim(0, df_ord[coluna_percentual].max() * 1.15)
        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    def boxplot_renda(
        self,
        df: pd.DataFrame,
        coluna_regiao: str = "nome_regiao",
        coluna_renda: str = "valor",
        titulo: str = "Distribuição de Renda per Capita por Região",
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Boxplot da distribuição de renda por região.

        Parâmetros
        ----------
        df : pd.DataFrame
            DataFrame com colunas de região e renda.
        coluna_regiao : str
            Coluna com os rótulos das regiões.
        coluna_renda : str
            Coluna com os valores de renda.
        titulo : str
            Título do gráfico.
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        fig, ax = plt.subplots(figsize=(12, 6))
        ordem = (
            df.groupby(coluna_regiao)[coluna_renda]
            .median()
            .sort_values(ascending=False)
            .index
        )
        sns.boxplot(
            data=df,
            x=coluna_regiao,
            y=coluna_renda,
            order=ordem,
            palette=list(PALETTE_REGIOES.values()),
            ax=ax,
        )
        ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: f"R$ {v:,.0f}"))
        ax.set_xlabel("", labelpad=5)
        ax.set_ylabel("Renda domiciliar per capita (R$)", labelpad=10)
        ax.set_title(titulo, pad=15, fontweight="bold")
        plt.xticks(rotation=15)
        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    # ------------------------------------------------------------------
    # Dashboard resumido
    # ------------------------------------------------------------------

    def dashboard_resumo(
        self,
        df_totais: pd.DataFrame,
        df_sexo: Optional[pd.DataFrame] = None,
        df_idade: Optional[pd.DataFrame] = None,
        titulo: str = "Resumo Demográfico — IBGE",
        caminho_saida: Optional[str] = None,
    ) -> Path:
        """
        Painel com até 3 gráficos em subplots: totais por estado,
        distribuição por sexo e distribuição etária.

        Parâmetros
        ----------
        df_totais : pd.DataFrame
            DataFrame com totais por localidade (colunas local + total).
        df_sexo : pd.DataFrame, opcional
            DataFrame com distribuição por sexo.
        df_idade : pd.DataFrame, opcional
            DataFrame com distribuição etária percentual.
        titulo : str
            Título geral do painel.
        caminho_saida : str, opcional
            Nome do arquivo de saída.
        """
        n_graficos = 1 + (df_sexo is not None) + (df_idade is not None)
        fig, axes = plt.subplots(1, n_graficos, figsize=(6 * n_graficos, 8))
        if n_graficos == 1:
            axes = [axes]

        fig.suptitle(titulo, fontsize=16, fontweight="bold", y=1.02)

        # Subplot 1: barras de população
        ax = axes[0]
        top = df_totais.nlargest(15, "total")
        top_sorted = top.sort_values("total", ascending=True)
        ax.barh(top_sorted["local"], top_sorted["total"] / 1_000_000, color="#1f77b4")
        ax.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x:.0f}M"))
        ax.set_title("Top 15 — População", fontweight="bold")

        # Subplot 2: pizza por sexo (opcional)
        idx = 1
        if df_sexo is not None:
            ax2 = axes[idx]
            col_masc = self._encontrar_coluna(df_sexo, ["masculino", "masc", "homem"])
            col_fem = self._encontrar_coluna(df_sexo, ["feminino", "fem", "mulher"])
            if col_masc and col_fem:
                total_masc = df_sexo[col_masc].sum()
                total_fem = df_sexo[col_fem].sum()
                ax2.pie(
                    [total_masc, total_fem],
                    labels=["Masculino", "Feminino"],
                    autopct="%1.1f%%",
                    colors=["#4472C4", "#ED7D31"],
                    startangle=90,
                )
                ax2.set_title("Distribuição por Sexo", fontweight="bold")
            idx += 1

        # Subplot 3: barras grupos de idade (opcional)
        if df_idade is not None:
            ax3 = axes[idx]
            col_grupo = "grupo_idade" if "grupo_idade" in df_idade.columns else df_idade.columns[0]
            col_perc = "percentual" if "percentual" in df_idade.columns else df_idade.columns[-1]
            df_sort = df_idade.sort_values(col_perc, ascending=True)
            ax3.barh(df_sort[col_grupo], df_sort[col_perc], color="#2ca02c")
            ax3.xaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{x:.0f}%"))
            ax3.set_title("Distribuição Etária (%)", fontweight="bold")

        plt.tight_layout()
        caminho = self._salvar(fig, caminho_saida or self._nome_arquivo(titulo))
        plt.close(fig)
        return caminho

    # ------------------------------------------------------------------
    # Auxiliares internos
    # ------------------------------------------------------------------

    def _salvar(self, fig: plt.Figure, nome: str) -> Path:
        """Salva a figura no diretório de saída e loga o caminho."""
        if not nome.endswith(".png"):
            nome += ".png"
        caminho = self.diretorio_saida / nome
        fig.savefig(caminho, dpi=self.dpi, bbox_inches="tight")
        logger.info("Gráfico salvo: %s", caminho)
        return caminho

    @staticmethod
    def _nome_arquivo(titulo: str) -> str:
        """Converte o título do gráfico em nome de arquivo seguro."""
        return (
            titulo.lower()
            .replace(" ", "_")
            .replace("—", "")
            .replace("/", "_")
            .replace("(", "")
            .replace(")", "")
            .replace("²", "2")
            .strip("_")
        )

    @staticmethod
    def _encontrar_coluna(df: pd.DataFrame, candidatas: list[str]) -> Optional[str]:
        """Retorna a primeira coluna que corresponder (busca parcial) ao DataFrame."""
        for cand in candidatas:
            # Correspondência exata primeiro
            if cand in df.columns:
                return cand
            # Busca por substring no nome das colunas
            match = [c for c in df.columns if cand.lower() in c.lower()]
            if match:
                return match[0]
        return None
