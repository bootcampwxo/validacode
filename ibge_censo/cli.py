"""
Interface de linha de comando (CLI) para a aplicação de análise do IBGE.

Uso básico:
    python -m ibge_censo.cli --help
    python -m ibge_censo.cli estados
    python -m ibge_censo.cli populacao --uf SP --top 10 --grafico
    python -m ibge_censo.cli densidade --grafico
    python -m ibge_censo.cli piramide --uf 35
    python -m ibge_censo.cli csv caminho/para/arquivo.csv --tipo populacao
"""

import argparse
import logging
import sys
from pathlib import Path

import pandas as pd

# Configurar logging antes de qualquer import do projeto
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ibge_censo.cli")


def _criar_parser() -> argparse.ArgumentParser:
    """Cria e configura o parser de argumentos da CLI."""
    parser = argparse.ArgumentParser(
        prog="ibge_censo",
        description="Análise de dados de censo do IBGE",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Listar todos os estados
  python -m ibge_censo.cli estados

  # População dos 10 maiores estados com gráfico
  python -m ibge_censo.cli populacao --top 10 --grafico

  # Pirâmide etária do Brasil
  python -m ibge_censo.cli piramide

  # Análise de CSV exportado do SIDRA
  python -m ibge_censo.cli csv dados.csv --tipo populacao --grafico

  # Densidade demográfica com mapa de calor
  python -m ibge_censo.cli densidade --grafico
        """,
    )
    parser.add_argument(
        "--saida",
        default="outputs",
        metavar="PASTA",
        help="Pasta para salvar gráficos e relatórios (padrão: outputs)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Ativa modo verboso (exibe DEBUG)",
    )

    subparsers = parser.add_subparsers(dest="comando", metavar="COMANDO", required=True)

    # ------------------------------------------------------------------
    # Subcomando: estados
    # ------------------------------------------------------------------
    p_estados = subparsers.add_parser("estados", help="Lista estados e regiões")
    p_estados.add_argument(
        "--regiao",
        type=int,
        choices=[1, 2, 3, 4, 5],
        metavar="ID",
        help="Filtrar por ID de região (1=N, 2=NE, 3=SE, 4=S, 5=CO)",
    )

    # ------------------------------------------------------------------
    # Subcomando: municipios
    # ------------------------------------------------------------------
    p_mun = subparsers.add_parser("municipios", help="Lista municípios de um estado")
    p_mun.add_argument(
        "--uf",
        type=int,
        required=True,
        metavar="CODIGO",
        help="Código IBGE do estado (ex: 35 para SP, 33 para RJ)",
    )

    # ------------------------------------------------------------------
    # Subcomando: populacao
    # ------------------------------------------------------------------
    p_pop = subparsers.add_parser(
        "populacao", help="Obtém e analisa dados de população por estado/município"
    )
    p_pop.add_argument(
        "--uf",
        type=int,
        metavar="CODIGO",
        help="Filtrar por código de estado (opcional)",
    )
    p_pop.add_argument(
        "--top",
        type=int,
        default=10,
        metavar="N",
        help="Exibir os N maiores registros (padrão: 10)",
    )
    p_pop.add_argument(
        "--grafico",
        action="store_true",
        help="Gerar gráfico de barras",
    )
    p_pop.add_argument(
        "--nivel",
        choices=["estado", "municipio"],
        default="estado",
        help="Nível geográfico (padrão: estado)",
    )

    # ------------------------------------------------------------------
    # Subcomando: densidade
    # ------------------------------------------------------------------
    p_dens = subparsers.add_parser(
        "densidade", help="Calcula e exibe a densidade demográfica por estado"
    )
    p_dens.add_argument("--grafico", action="store_true", help="Gerar mapa de calor")

    # ------------------------------------------------------------------
    # Subcomando: piramide
    # ------------------------------------------------------------------
    p_pir = subparsers.add_parser("piramide", help="Pirâmide etária por sexo e grupo de idade")
    p_pir.add_argument(
        "--nivel",
        choices=["brasil", "regiao", "estado"],
        default="estado",
        help="Nível geográfico da pirâmide (padrão: estado)",
    )
    p_pir.add_argument("--grafico", action="store_true", help="Gerar pirâmide etária")

    # ------------------------------------------------------------------
    # Subcomando: csv
    # ------------------------------------------------------------------
    p_csv = subparsers.add_parser(
        "csv", help="Carrega e analisa um arquivo CSV com dados do IBGE"
    )
    p_csv.add_argument("arquivo", metavar="ARQUIVO.csv", help="Caminho para o arquivo CSV")
    p_csv.add_argument(
        "--tipo",
        choices=["populacao", "populacao_sexo", "populacao_idade", "municipios", "auto"],
        default="auto",
        help="Tipo de dado no CSV (padrão: auto-detecção)",
    )
    p_csv.add_argument("--grafico", action="store_true", help="Gerar gráfico correspondente")
    p_csv.add_argument(
        "--coluna-local",
        default="nome_estado",
        metavar="COLUNA",
        help="Coluna usada como localidade (padrão: nome_estado)",
    )
    p_csv.add_argument(
        "--coluna-valor",
        default="valor",
        metavar="COLUNA",
        help="Coluna numérica principal (padrão: valor)",
    )

    return parser


# ------------------------------------------------------------------
# Handlers de cada subcomando
# ------------------------------------------------------------------

def cmd_estados(args: argparse.Namespace) -> None:
    """Lista estados e, opcionalmente, filtra por região."""
    from src.coleta.api_ibge import IBGEApiClient

    cliente = IBGEApiClient()
    df = cliente.listar_estados(id_regiao=args.regiao)
    _imprimir_tabela(df, "Estados do Brasil")


def cmd_municipios(args: argparse.Namespace) -> None:
    """Lista municípios de um estado."""
    from src.coleta.api_ibge import IBGEApiClient

    cliente = IBGEApiClient()
    df = cliente.listar_municipios(id_estado=args.uf)
    _imprimir_tabela(df, f"Municípios — UF {args.uf}")


def cmd_populacao(args: argparse.Namespace) -> None:
    """Obtém e analisa dados de população."""
    from src.coleta.api_ibge import IBGEApiClient
    from src.analise.estatisticas import AnaliseDemografica
    from src.analise.filtros import FiltroDados
    from src.visualizacao.graficos import GraficoCenso

    cliente = IBGEApiClient()
    nivel_geo = "6" if args.nivel == "municipio" else "3"
    print(f"⏳ Consultando API SIDRA (nível: {args.nivel})…")
    df = cliente.obter_populacao_por_sexo(nivel_geo=nivel_geo)

    if df.empty:
        print("❌ Nenhum dado retornado pela API.")
        sys.exit(1)

    # Filtro por estado, se solicitado
    if args.uf:
        from src.analise.filtros import FiltroDados
        filtro = FiltroDados(df)
        col_id = "id_estado" if "id_estado" in df.columns else "nivel_territorial"
        if col_id in df.columns:
            df = df[df[col_id].astype(str) == str(args.uf)]

    # Detectar coluna de localidade
    col_local = next(
        (c for c in ["nome_estado", "nome_municipio", "nome_regiao"] if c in df.columns),
        df.columns[0],
    )

    analise = AnaliseDemografica(df, coluna_local=col_local)
    totais = analise.totais_por_local()

    _imprimir_tabela(totais.head(args.top), f"Populacao — Top {args.top}")
    print(f"\n📊 Resumo estatístico:\n")
    print(analise.resumo().to_string())

    if args.grafico:
        grafico = GraficoCenso(diretorio_saida=args.saida)
        caminho = grafico.barras_populacao(
            totais,
            titulo=f"Populacao por {col_local.replace('nome_', '').title()}",
            top_n=args.top,
        )
        print(f"\n✅ Gráfico salvo em: {caminho}")


def cmd_densidade(args: argparse.Namespace) -> None:
    """Calcula e exibe a densidade demográfica por estado."""
    from src.coleta.api_ibge import IBGEApiClient
    from src.analise.estatisticas import AnaliseDemografica
    from src.visualizacao.graficos import GraficoCenso

    cliente = IBGEApiClient()
    print("⏳ Consultando população por estado…")
    df = cliente.obter_populacao_por_sexo(nivel_geo="3")

    if df.empty:
        print("❌ Nenhum dado retornado pela API.")
        sys.exit(1)

    analise = AnaliseDemografica(df, coluna_local="nome_estado")
    densidade = analise.densidade_demografica()
    _imprimir_tabela(densidade, "Densidade Demográfica por Estado")

    if args.grafico:
        grafico = GraficoCenso(diretorio_saida=args.saida)
        caminho = grafico.mapa_calor_densidade(densidade)
        print(f"\n✅ Mapa de calor salvo em: {caminho}")


def cmd_piramide(args: argparse.Namespace) -> None:
    """Gera a pirâmide etária."""
    from src.coleta.api_ibge import IBGEApiClient
    from src.analise.estatisticas import AnaliseDemografica
    from src.visualizacao.graficos import GraficoCenso

    nivel_map = {"brasil": "1", "regiao": "2", "estado": "3"}
    nivel_geo = nivel_map[args.nivel]

    cliente = IBGEApiClient()
    print(f"⏳ Consultando dados por sexo e idade (nível: {args.nivel})…")
    df = cliente.obter_populacao_por_idade(nivel_geo=nivel_geo)

    if df.empty:
        print("❌ Nenhum dado de distribuição etária retornado pela API.")
        sys.exit(1)

    col_local = next(
        (c for c in ["nome_estado", "nome_regiao", "brasil"] if c in df.columns),
        df.columns[0],
    )
    analise = AnaliseDemografica(df, coluna_local=col_local)

    try:
        pir = analise.piramide_etaria()
        _imprimir_tabela(pir, "Pirâmide Etária")

        if args.grafico:
            grafico = GraficoCenso(diretorio_saida=args.saida)
            caminho = grafico.piramide_etaria(pir)
            print(f"\n✅ Pirâmide salva em: {caminho}")
    except KeyError as exc:
        print(f"⚠️  {exc}")
        print("Dica: os dados da API podem não conter coluna 'sexo'. Verifique o nível geográfico.")


def cmd_csv(args: argparse.Namespace) -> None:
    """Carrega e analisa um arquivo CSV."""
    from src.coleta.leitor_csv import LeitorCSV
    from src.analise.estatisticas import AnaliseDemografica
    from src.visualizacao.graficos import GraficoCenso

    leitor = LeitorCSV()
    tipo = None if args.tipo == "auto" else args.tipo

    try:
        df = leitor.ler(args.arquivo, tipo=tipo)
    except (FileNotFoundError, ValueError) as exc:
        print(f"❌ Erro ao ler CSV: {exc}")
        sys.exit(1)

    print(f"✅ CSV carregado: {df.shape[0]} linhas × {df.shape[1]} colunas")
    print(f"Colunas: {list(df.columns)}\n")

    coluna_local = args.coluna_local if args.coluna_local in df.columns else df.columns[0]
    coluna_valor = args.coluna_valor if args.coluna_valor in df.columns else None

    if coluna_valor is None:
        # Auto-detecção da coluna de valor
        numericas = df.select_dtypes(include="number").columns.tolist()
        if not numericas:
            print("❌ Nenhuma coluna numérica detectada no CSV.")
            sys.exit(1)
        coluna_valor = numericas[0]
        print(f"ℹ️  Coluna de valor detectada automaticamente: '{coluna_valor}'")

    analise = AnaliseDemografica(df, coluna_valor=coluna_valor, coluna_local=coluna_local)
    totais = analise.totais_por_local()
    _imprimir_tabela(totais.head(15), "Totais por localidade")

    print("\n📊 Resumo estatístico:\n")
    print(analise.resumo().to_string())

    if args.grafico:
        grafico = GraficoCenso(diretorio_saida=args.saida)
        caminho = grafico.barras_populacao(totais, titulo="Análise do CSV")
        print(f"\n✅ Gráfico salvo em: {caminho}")


# ------------------------------------------------------------------
# Ponto de entrada
# ------------------------------------------------------------------

def main() -> None:
    """Ponto de entrada principal da CLI."""
    parser = _criar_parser()
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Despachar para o handler correto
    handlers = {
        "estados": cmd_estados,
        "municipios": cmd_municipios,
        "populacao": cmd_populacao,
        "densidade": cmd_densidade,
        "piramide": cmd_piramide,
        "csv": cmd_csv,
    }

    handler = handlers.get(args.comando)
    if handler:
        try:
            handler(args)
        except KeyboardInterrupt:
            print("\n⚠️  Operação cancelada pelo usuário.")
            sys.exit(130)
        except Exception as exc:
            logger.error("Erro inesperado: %s", exc, exc_info=args.verbose)
            print(f"\n❌ Erro: {exc}")
            print("Use --verbose para mais detalhes.")
            sys.exit(1)
    else:
        parser.print_help()


def _imprimir_tabela(df: pd.DataFrame, titulo: str) -> None:
    """Imprime um DataFrame formatado no terminal."""
    separador = "─" * min(80, max(40, len(titulo) + 10))
    print(f"\n{separador}")
    print(f"  {titulo}")
    print(f"{separador}")
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 120)
    pd.set_option("display.float_format", "{:,.0f}".format)
    print(df.to_string(index=False))
    print(f"{separador}\n")


if __name__ == "__main__":
    main()
