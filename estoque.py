from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import ColorScaleRule, DataBarRule
from openpyxl.worksheet.datavalidation import DataValidation

wb = Workbook()

# ── Paleta ──────────────────────────────────────────────────────────────────
COR_TITULO     = "1F4E79"   # Azul escuro
COR_HEADER     = "2E75B6"   # Azul médio
COR_SUBHEADER  = "BDD7EE"   # Azul claro
COR_ALERTA     = "FF0000"   # Vermelho
COR_OK         = "70AD47"   # Verde
COR_INPUT      = "FFFF00"   # Amarelo (células editáveis)
COR_CALC       = "FFFFFF"   # Branco (fórmulas)
COR_ZEBRA      = "DEEAF1"   # Azul muito claro (linhas alternadas)

borda_fina = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"),  bottom=Side(style="thin"),
)
borda_media = Border(
    left=Side(style="medium"), right=Side(style="medium"),
    top=Side(style="medium"),  bottom=Side(style="medium"),
)

def hdr(cell, texto, cor_fundo=COR_HEADER, cor_letra="FFFFFF", bold=True, tamanho=11, wrap=False):
    cell.value = texto
    cell.font = Font(bold=bold, color=cor_letra, size=tamanho)
    cell.fill = PatternFill("solid", start_color=cor_fundo)
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=wrap)
    cell.border = borda_fina

def inp(cell, valor=None, fmt=None):
    """Célula de entrada do usuário — texto azul."""
    if valor is not None:
        cell.value = valor
    cell.font = Font(color="0000FF")
    cell.fill = PatternFill("solid", start_color=COR_INPUT)
    cell.border = borda_fina
    cell.alignment = Alignment(horizontal="center")
    if fmt:
        cell.number_format = fmt

def calc(cell, formula, fmt=None):
    """Célula de cálculo — texto preto."""
    cell.value = formula
    cell.font = Font(color="000000")
    cell.fill = PatternFill("solid", start_color=COR_CALC)
    cell.border = borda_fina
    cell.alignment = Alignment(horizontal="center")
    if fmt:
        cell.number_format = fmt

def set_col_width(ws, col, w):
    ws.column_dimensions[get_column_letter(col)].width = w


# ════════════════════════════════════════════════════════════════════════════
# ABA 1 — CONTROLE DE ESTOQUE
# ════════════════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = "Estoque"
ws.sheet_view.showGridLines = False
ws.freeze_panes = "A5"

# --- Título principal ---
ws.merge_cells("A1:N1")
ws["A1"].value = "📦  CONTROLE DE ESTOQUE"
ws["A1"].font = Font(bold=True, size=16, color="FFFFFF")
ws["A1"].fill = PatternFill("solid", start_color=COR_TITULO)
ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 32

ws.merge_cells("A2:N2")
ws["A2"].value = "Atualizado em: (informe a data na célula T2)"
ws["A2"].font = Font(italic=True, size=10, color="595959")
ws["A2"].alignment = Alignment(horizontal="center")
ws.row_dimensions[2].height = 16

ws.row_dimensions[3].height = 8  # espaço

# --- Cabeçalhos das colunas ---
ws.row_dimensions[4].height = 36
cabecalhos = [
    ("A4", "Código"),
    ("B4", "Produto / Descrição"),
    ("C4", "Categoria"),
    ("D4", "Unidade"),
    ("E4", "Estoque\nInicial"),
    ("F4", "Entradas\n(+)"),
    ("G4", "Saídas\n(-)"),
    ("H4", "Estoque\nAtual"),
    ("I4", "Estoque\nMínimo"),
    ("J4", "Estoque\nMáximo"),
    ("K4", "Ponto de\nRepedido"),
    ("L4", "Custo\nUnitário (R$)"),
    ("M4", "Valor Total\nEstoque (R$)"),
    ("N4", "Status"),
]
for coord, texto in cabecalhos:
    hdr(ws[coord], texto, wrap=True)

# --- Dados de exemplo (10 produtos) ---
produtos = [
    ("P001", "Notebook Dell Inspiron 15",  "Informática",    "un",  10,  5,  3,  200.0, 220.0, 3499.90),
    ("P002", "Mouse sem fio Logitech",      "Periférico",     "un",  50, 20, 15,  150.0, 200.0,   89.90),
    ("P003", "Teclado mecânico Redragon",   "Periférico",     "un",  30, 10, 12,   80.0, 120.0,  199.90),
    ("P004", "Monitor LG 24\" Full HD",     "Informática",    "un",   8,  4,  6,   20.0,  30.0, 1199.90),
    ("P005", "Cadeira Ergonômica Premium",  "Mobiliário",     "un",  15,  2,  5,   10.0,  25.0, 1899.00),
    ("P006", "Papel A4 (resma 500fls)",     "Papelaria",      "rs", 200, 50, 80,  500.0, 800.0,   24.90),
    ("P007", "Caneta esferográfica azul",   "Papelaria",      "cx", 100, 30, 40,  300.0, 500.0,   12.50),
    ("P008", "Cartucho HP 664 Preto",       "Consumível",     "un",  25, 10,  8,   50.0, 100.0,   49.90),
    ("P009", "Cabo HDMI 2m",               "Acessório",      "un",  40, 15, 20,  100.0, 150.0,   29.90),
    ("P010", "Hub USB 4 portas",            "Periférico",     "un",  20,  8, 12,   30.0,  60.0,   79.90),
]

LINHA_INI = 5
for i, (cod, nome, cat, un, ini, ent, sai, emin, emax, custo) in enumerate(produtos):
    r = LINHA_INI + i
    # Zebra
    zebra = COR_ZEBRA if i % 2 == 0 else "FFFFFF"

    def zc(cell):
        cell.fill = PatternFill("solid", start_color=zebra)
        cell.border = borda_fina
        cell.alignment = Alignment(horizontal="center", vertical="center")

    inp(ws.cell(r, 1), cod)
    # Coluna B: texto alinhado à esquerda
    ws.cell(r, 2).value = nome
    ws.cell(r, 2).font = Font(color="0000FF")
    ws.cell(r, 2).fill = PatternFill("solid", start_color=COR_INPUT)
    ws.cell(r, 2).border = borda_fina
    ws.cell(r, 2).alignment = Alignment(horizontal="left", vertical="center", indent=1)

    inp(ws.cell(r, 3), cat)
    inp(ws.cell(r, 4), un)
    inp(ws.cell(r, 5), ini)
    inp(ws.cell(r, 6), ent)
    inp(ws.cell(r, 7), sai)

    # H = Estoque Atual (fórmula)
    calc(ws.cell(r, 8),  f"=E{r}+F{r}-G{r}",           "#,##0")
    inp(ws.cell(r, 9),   emin,                            "#,##0")
    inp(ws.cell(r, 10),  emax,                            "#,##0")
    # K = Ponto de Reposição = estoque mínimo * 1,2
    calc(ws.cell(r, 11), f"=ROUND(I{r}*1.2,0)",          "#,##0")
    inp(ws.cell(r, 12),  custo,                           'R$ #,##0.00')
    # M = Valor Total = Estoque Atual × Custo
    calc(ws.cell(r, 13), f"=H{r}*L{r}",                  'R$ #,##0.00')
    # N = Status (SE/E aninhado)
    calc(ws.cell(r, 14),
         f'=IF(H{r}<=0,"❌ SEM ESTOQUE",IF(H{r}<=I{r},"⚠️ ABAIXO DO MÍNIMO",IF(H{r}>=J{r},"🔵 ESTOQUE CHEIO","✅ NORMAL")))')

# --- Linha de totais ---
r_tot = LINHA_INI + len(produtos)
ws.row_dimensions[r_tot].height = 24
ws.merge_cells(f"A{r_tot}:G{r_tot}")
ws[f"A{r_tot}"].value = "TOTAIS"
ws[f"A{r_tot}"].font = Font(bold=True, color="FFFFFF")
ws[f"A{r_tot}"].fill = PatternFill("solid", start_color=COR_HEADER)
ws[f"A{r_tot}"].alignment = Alignment(horizontal="center")
ws[f"A{r_tot}"].border = borda_fina

calc(ws[f"H{r_tot}"], f"=SUM(H{LINHA_INI}:H{r_tot-1})", "#,##0")
calc(ws[f"M{r_tot}"], f"=SUM(M{LINHA_INI}:M{r_tot-1})", 'R$ #,##0.00')
ws[f"H{r_tot}"].font = Font(bold=True)
ws[f"M{r_tot}"].font = Font(bold=True)
ws[f"H{r_tot}"].fill = PatternFill("solid", start_color=COR_SUBHEADER)
ws[f"M{r_tot}"].fill = PatternFill("solid", start_color=COR_SUBHEADER)

# --- Formatação condicional: coluna Status ---
# Apenas visual (barra de dados no estoque atual)
last_row = r_tot - 1
ws.conditional_formatting.add(
    f"H{LINHA_INI}:H{last_row}",
    DataBarRule(start_type="min", end_type="max",
                color="2E75B6", showValue=True)
)

# --- Larguras das colunas ---
larguras = [10, 35, 16, 8, 10, 10, 10, 10, 10, 10, 10, 16, 18, 22]
for col, w in enumerate(larguras, 1):
    ws.column_dimensions[get_column_letter(col)].width = w

# --- Legenda de cores ---
r_leg = r_tot + 2
ws.merge_cells(f"A{r_leg}:N{r_leg}")
hdr(ws[f"A{r_leg}"], "LEGENDA DE CORES", COR_TITULO, tamanho=10)

legenda = [
    ("A", COR_INPUT,   "0000FF", "Célula de entrada (edite os valores em azul)"),
    ("C", COR_CALC,    "000000", "Célula calculada automaticamente (não edite)"),
    ("E", "FFE0E0",    COR_ALERTA, "Estoque abaixo do mínimo"),
    ("G", "E2EFDA",    "375623", "Estoque normal"),
]
r_leg2 = r_leg + 1
for col, fundo, letra, desc in legenda:
    ws[f"{col}{r_leg2}"].fill = PatternFill("solid", start_color=fundo)
    ws[f"{col}{r_leg2}"].font = Font(color=letra, size=9)
    ws[f"{col}{r_leg2}"].border = borda_fina
    ws[f"{col}{r_leg2}"].alignment = Alignment(horizontal="center")
    ws[f"{col}{r_leg2}"].value = "Amostra"
    c_desc = chr(ord(col) + 1)
    ws[f"{c_desc}{r_leg2}"].value = desc
    ws[f"{c_desc}{r_leg2}"].font = Font(size=9)
    ws[f"{c_desc}{r_leg2}"].border = borda_fina


# ════════════════════════════════════════════════════════════════════════════
# ABA 2 — MOVIMENTAÇÕES (Entradas e Saídas)
# ════════════════════════════════════════════════════════════════════════════
wm = wb.create_sheet("Movimentações")
wm.sheet_view.showGridLines = False
wm.freeze_panes = "A4"

wm.merge_cells("A1:I1")
wm["A1"].value = "📋  REGISTRO DE MOVIMENTAÇÕES"
wm["A1"].font = Font(bold=True, size=14, color="FFFFFF")
wm["A1"].fill = PatternFill("solid", start_color=COR_TITULO)
wm["A1"].alignment = Alignment(horizontal="center", vertical="center")
wm.row_dimensions[1].height = 30
wm.row_dimensions[2].height = 8
wm.row_dimensions[3].height = 32

cabecalhos_mov = [
    ("A3", "Data"),
    ("B3", "Código\nProduto"),
    ("C3", "Produto"),
    ("D3", "Tipo\n(E/S)"),
    ("E3", "Quantidade"),
    ("F3", "Custo\nUnitário (R$)"),
    ("G3", "Valor\nTotal (R$)"),
    ("H3", "Responsável"),
    ("I3", "Observação"),
]
for coord, texto in cabecalhos_mov:
    hdr(wm[coord], texto, wrap=True)

movimentacoes = [
    ("2024-11-01", "P001", "Notebook Dell Inspiron 15",  "E",  5, 3499.90, "João Silva",   "Compra NF 1234"),
    ("2024-11-02", "P002", "Mouse sem fio Logitech",      "E", 20,   89.90, "Maria Lima",   "Reposição"),
    ("2024-11-03", "P001", "Notebook Dell Inspiron 15",  "S",  3, 3499.90, "Carlos Pinto", "Entrega TI"),
    ("2024-11-04", "P006", "Papel A4",                   "E", 50,   24.90, "Ana Souza",    "Compra NF 5678"),
    ("2024-11-05", "P003", "Teclado mecânico Redragon",  "S", 12,  199.90, "João Silva",   "Saída almoxarifado"),
    ("2024-11-06", "P008", "Cartucho HP 664 Preto",       "E", 10,   49.90, "Maria Lima",   "Reposição"),
    ("2024-11-07", "P005", "Cadeira Ergonômica Premium",  "S",  5, 1899.00, "Pedro Neto",   "Reforma sala"),
    ("2024-11-08", "P007", "Caneta esferográfica azul",   "E", 30,   12.50, "Ana Souza",    "Compra NF 9012"),
    ("2024-11-09", "P009", "Cabo HDMI 2m",               "S", 20,   29.90, "Carlos Pinto", "Estoque mínimo atingido"),
    ("2024-11-10", "P010", "Hub USB 4 portas",            "S", 12,   79.90, "João Silva",   "Distribuição"),
]

for i, (data, cod, nome, tipo, qtd, custo_un, resp, obs) in enumerate(movimentacoes):
    r = 4 + i
    zebra = COR_ZEBRA if i % 2 == 0 else "FFFFFF"
    for col in range(1, 10):
        wm.cell(r, col).fill = PatternFill("solid", start_color=zebra)
        wm.cell(r, col).border = borda_fina
        wm.cell(r, col).alignment = Alignment(horizontal="center", vertical="center")

    inp(wm.cell(r, 1), data);          wm.cell(r, 1).number_format = "DD/MM/YYYY"
    inp(wm.cell(r, 2), cod)
    wm.cell(r, 3).value = nome;        wm.cell(r, 3).font = Font(color="0000FF"); wm.cell(r, 3).fill = PatternFill("solid", start_color=COR_INPUT)
    inp(wm.cell(r, 4), tipo)
    inp(wm.cell(r, 5), qtd,            "#,##0")
    inp(wm.cell(r, 6), custo_un,       'R$ #,##0.00')
    calc(wm.cell(r, 7), f"=E{r}*F{r}", 'R$ #,##0.00')
    inp(wm.cell(r, 8), resp)
    wm.cell(r, 9).value = obs;  wm.cell(r, 9).font = Font(color="0000FF"); wm.cell(r, 9).fill = PatternFill("solid", start_color=COR_INPUT); wm.cell(r, 9).alignment = Alignment(horizontal="left", indent=1)

# Total movimentações
r_tm = 4 + len(movimentacoes)
wm.merge_cells(f"A{r_tm}:F{r_tm}")
wm[f"A{r_tm}"].value = "TOTAL MOVIMENTADO (R$)"
wm[f"A{r_tm}"].font = Font(bold=True, color="FFFFFF")
wm[f"A{r_tm}"].fill = PatternFill("solid", start_color=COR_HEADER)
wm[f"A{r_tm}"].alignment = Alignment(horizontal="center")
wm[f"A{r_tm}"].border = borda_fina
calc(wm[f"G{r_tm}"], f"=SUM(G4:G{r_tm-1})", 'R$ #,##0.00')
wm[f"G{r_tm}"].font = Font(bold=True)
wm[f"G{r_tm}"].fill = PatternFill("solid", start_color=COR_SUBHEADER)

# Larguras
for col, w in zip(range(1, 10), [14, 12, 30, 8, 12, 18, 18, 18, 30]):
    wm.column_dimensions[get_column_letter(col)].width = w


# ════════════════════════════════════════════════════════════════════════════
# ABA 3 — RESUMO / DASHBOARD
# ════════════════════════════════════════════════════════════════════════════
wd = wb.create_sheet("Dashboard")
wd.sheet_view.showGridLines = False

wd.merge_cells("A1:H1")
wd["A1"].value = "📊  DASHBOARD — RESUMO DE ESTOQUE"
wd["A1"].font = Font(bold=True, size=14, color="FFFFFF")
wd["A1"].fill = PatternFill("solid", start_color=COR_TITULO)
wd["A1"].alignment = Alignment(horizontal="center", vertical="center")
wd.row_dimensions[1].height = 30

# --- KPIs ---
wd.merge_cells("A3:H3")
hdr(wd["A3"], "INDICADORES PRINCIPAIS", COR_HEADER, tamanho=11)
wd.row_dimensions[3].height = 26

kpis = [
    ("A5",  "Total de Itens Cadastrados",        f"=COUNTA(Estoque!A{LINHA_INI}:A{r_tot-1})"),
    ("A6",  "Valor Total em Estoque (R$)",        f"=Estoque!M{r_tot}"),
    ("A7",  "Itens sem Estoque",                  f'=COUNTIF(Estoque!H{LINHA_INI}:H{r_tot-1},"<=0")'),
    ("A8",  "Itens Abaixo do Mínimo",             f'=COUNTIFS(Estoque!H{LINHA_INI}:H{r_tot-1},">"&0,Estoque!H{LINHA_INI}:H{r_tot-1},"<="&Estoque!I{LINHA_INI}:I{r_tot-1})'),
    ("A9",  "Itens com Estoque Normal",            f'=COUNTIF(Estoque!N{LINHA_INI}:N{r_tot-1},"✅ NORMAL")'),
    ("A10", "Itens com Estoque Cheio",             f'=COUNTIF(Estoque!N{LINHA_INI}:N{r_tot-1},"🔵 ESTOQUE CHEIO")'),
    ("A11", "Total de Movimentações Registradas",  f"=COUNTA(Movimentações!A4:A{r_tm-1})"),
    ("A12", "Total Movimentado (R$)",              f"=Movimentações!G{r_tm}"),
]

for coord, label, formula in kpis:
    row = int(coord[1:])
    wd[f"A{row}"].value = label
    wd[f"A{row}"].font = Font(bold=True, size=10)
    wd[f"A{row}"].fill = PatternFill("solid", start_color=COR_SUBHEADER)
    wd[f"A{row}"].border = borda_fina
    wd[f"A{row}"].alignment = Alignment(horizontal="left", indent=1, vertical="center")
    wd.row_dimensions[row].height = 22

    wd[f"C{row}"].value = formula
    wd[f"C{row}"].font = Font(bold=True, color="000000", size=11)
    wd[f"C{row}"].fill = PatternFill("solid", start_color=COR_CALC)
    wd[f"C{row}"].border = borda_fina
    wd[f"C{row}"].alignment = Alignment(horizontal="center", vertical="center")
    if "R$" in label or "Valor" in label or "Movimentado" in label:
        wd[f"C{row}"].number_format = 'R$ #,##0.00'

# --- Tabela: itens críticos ---
wd.row_dimensions[14].height = 8
wd.merge_cells("A15:H15")
hdr(wd["A15"], "⚠️  ITENS CRÍTICOS (Abaixo do Mínimo ou Sem Estoque)", "C00000", tamanho=11)
wd.row_dimensions[15].height = 26

wd.row_dimensions[16].height = 28
for col, txt in zip(range(1, 6), ["Código", "Produto", "Estoque Atual", "Estoque Mínimo", "Status"]):
    hdr(wd.cell(16, col), txt)

for i in range(10):
    r = 17 + i
    src_r = LINHA_INI + i
    wd.row_dimensions[r].height = 20
    zebra = COR_ZEBRA if i % 2 == 0 else "FFFFFF"
    # Só mostra se Status NÃO for Normal nem Cheio
    for col in range(1, 6):
        wd.cell(r, col).fill = PatternFill("solid", start_color=zebra)
        wd.cell(r, col).border = borda_fina
        wd.cell(r, col).alignment = Alignment(horizontal="center", vertical="center")
    calc(wd.cell(r, 1), f'=IF(OR(Estoque!N{src_r}="⚠️ ABAIXO DO MÍNIMO",Estoque!N{src_r}="❌ SEM ESTOQUE"),Estoque!A{src_r},"")')
    calc(wd.cell(r, 2), f'=IF(OR(Estoque!N{src_r}="⚠️ ABAIXO DO MÍNIMO",Estoque!N{src_r}="❌ SEM ESTOQUE"),Estoque!B{src_r},"")')
    calc(wd.cell(r, 3), f'=IF(OR(Estoque!N{src_r}="⚠️ ABAIXO DO MÍNIMO",Estoque!N{src_r}="❌ SEM ESTOQUE"),Estoque!H{src_r},"")'); wd.cell(r, 3).number_format = "#,##0"
    calc(wd.cell(r, 4), f'=IF(OR(Estoque!N{src_r}="⚠️ ABAIXO DO MÍNIMO",Estoque!N{src_r}="❌ SEM ESTOQUE"),Estoque!I{src_r},"")'); wd.cell(r, 4).number_format = "#,##0"
    calc(wd.cell(r, 5), f'=IF(OR(Estoque!N{src_r}="⚠️ ABAIXO DO MÍNIMO",Estoque!N{src_r}="❌ SEM ESTOQUE"),Estoque!N{src_r},"")')

# Larguras dashboard
for col, w in zip(range(1, 9), [30, 5, 20, 5, 18, 18, 16, 10]):
    wd.column_dimensions[get_column_letter(col)].width = w


# ════════════════════════════════════════════════════════════════════════════
# ABA 4 — INSTRUÇÕES
# ════════════════════════════════════════════════════════════════════════════
wi = wb.create_sheet("Instruções")
wi.sheet_view.showGridLines = False

wi.merge_cells("A1:E1")
wi["A1"].value = "📖  INSTRUÇÕES DE USO — CONTROLE DE ESTOQUE"
wi["A1"].font = Font(bold=True, size=14, color="FFFFFF")
wi["A1"].fill = PatternFill("solid", start_color=COR_TITULO)
wi["A1"].alignment = Alignment(horizontal="center", vertical="center")
wi.row_dimensions[1].height = 30

instrucoes = [
    (3,  "ABA: Estoque",          COR_HEADER,    "FFFFFF", True,  13),
    (4,  "• Preencha as colunas em AMARELO (código, nome, categoria, unidade, estoque inicial, entradas, saídas, custo, estoques mínimo e máximo).", None, "000000", False, 10),
    (5,  "• As colunas em BRANCO são calculadas automaticamente — não edite.", None, "000000", False, 10),
    (6,  "• O campo 'Status' atualiza automaticamente conforme os níveis de estoque.", None, "000000", False, 10),
    (7,  "• Adicione novas linhas copiando uma linha existente para manter as fórmulas.", None, "000000", False, 10),
    (9,  "ABA: Movimentações",    COR_HEADER,    "FFFFFF", True,  13),
    (10, "• Registre cada entrada (E) ou saída (S) de produto individualmente.", None, "000000", False, 10),
    (11, "• Preencha: Data, Código, Produto, Tipo (E ou S), Quantidade, Custo e Responsável.", None, "000000", False, 10),
    (12, "• O campo 'Valor Total' é calculado automaticamente.", None, "000000", False, 10),
    (13, "• IMPORTANTE: as entradas/saídas aqui NÃO atualizam a aba Estoque automaticamente —", None, "595959", False, 10),
    (14, "  some manualmente o total de entradas e saídas na aba Estoque.", None, "595959", False, 10),
    (16, "ABA: Dashboard",         COR_HEADER,    "FFFFFF", True,  13),
    (17, "• Exibe os principais indicadores calculados automaticamente a partir da aba Estoque.", None, "000000", False, 10),
    (18, "• Lista os itens críticos (abaixo do mínimo ou sem estoque) para ação imediata.", None, "000000", False, 10),
    (20, "LEGENDA DE CORES",        COR_TITULO,    "FFFFFF", True,  12),
    (21, "🟡 Amarelo  →  Célula de entrada (valores que você deve preencher)", None, "0000FF", False, 10),
    (22, "⬜ Branco   →  Célula calculada (não edite)", None, "000000", False, 10),
    (23, "🟦 Azul     →  Cor padrão para células de entrada (texto)", None, "0000FF", False, 10),
    (25, "FÓRMULAS UTILIZADAS",     COR_TITULO,    "FFFFFF", True,  12),
    (26, "• Estoque Atual       = Estoque Inicial + Entradas − Saídas", None, "000000", False, 10),
    (27, "• Ponto de Reposição  = Estoque Mínimo × 1,2", None, "000000", False, 10),
    (28, "• Valor Total         = Estoque Atual × Custo Unitário", None, "000000", False, 10),
    (29, "• Status              = Avaliação automática baseada em mínimo, máximo e estoque atual", None, "000000", False, 10),
]

for row, texto, cor_fundo, cor_letra, bold, size in instrucoes:
    wi.row_dimensions[row].height = 20
    if cor_fundo:
        wi.merge_cells(f"A{row}:E{row}")
        wi[f"A{row}"].value = texto
        wi[f"A{row}"].font = Font(bold=bold, color=cor_letra, size=size)
        wi[f"A{row}"].fill = PatternFill("solid", start_color=cor_fundo)
        wi[f"A{row}"].alignment = Alignment(horizontal="left", indent=1, vertical="center")
    else:
        wi.merge_cells(f"A{row}:E{row}")
        wi[f"A{row}"].value = texto
        wi[f"A{row}"].font = Font(bold=bold, color=cor_letra, size=size)
        wi[f"A{row}"].alignment = Alignment(horizontal="left", indent=2, vertical="center", wrap_text=True)

wi.column_dimensions["A"].width = 80

# ── Salvar ───────────────────────────────────────────────────────────────────
saida = "/Users/rsaragio/bob-otel-lab/canario/controle_estoque.xlsx"
wb.save(saida)
print(f"OK:{saida}")
