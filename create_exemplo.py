from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

wb = Workbook()
ws = wb.active
ws.title = "Vendas"

# Estilos
header_font = Font(bold=True, color="FFFFFF", size=11)
header_fill = PatternFill("solid", start_color="1F4E79")
total_font = Font(bold=True, color="000000")
total_fill = PatternFill("solid", start_color="BDD7EE")
center = Alignment(horizontal="center", vertical="center")
thin = Side(style="thin", color="AAAAAA")
border = Border(left=thin, right=thin, top=thin, bottom=thin)

# Título
ws.merge_cells("A1:F1")
ws["A1"] = "Relatório de Vendas — 2º Semestre 2024"
ws["A1"].font = Font(bold=True, size=14, color="1F4E79")
ws["A1"].alignment = center

# Cabeçalhos
headers = ["Mês", "Produto A ($)", "Produto B ($)", "Produto C ($)", "Total ($)", "Meta ($)"]
for col, h in enumerate(headers, 1):
    cell = ws.cell(row=3, column=col, value=h)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center
    cell.border = border

# Dados mensais (valores hardcoded = inputs em azul)
dados = [
    ("Jul", 12500, 8300, 5100, 14000),
    ("Ago", 13800, 9100, 4900, 14500),
    ("Set", 11200, 7600, 6200, 14000),
    ("Out", 15400, 10200, 7100, 15000),
    ("Nov", 16800, 11500, 8300, 16000),
    ("Dez", 19200, 13700, 9800, 18000),
]

input_font = Font(color="0000FF")  # Azul = inputs

for i, (mes, pa, pb, pc, meta) in enumerate(dados, start=4):
    row = i
    ws.cell(row=row, column=1, value=mes).alignment = center
    for col, val in enumerate([pa, pb, pc], start=2):
        c = ws.cell(row=row, column=col, value=val)
        c.font = input_font
        c.number_format = '#,##0'
        c.border = border
    # Coluna Total = fórmula
    total_cell = ws.cell(row=row, column=5)
    total_cell.value = f"=SUM(B{row}:D{row})"
    total_cell.number_format = '#,##0'
    total_cell.border = border
    # Meta
    meta_cell = ws.cell(row=row, column=6, value=meta)
    meta_cell.font = input_font
    meta_cell.number_format = '#,##0'
    meta_cell.border = border
    # Borda na coluna Mês
    ws.cell(row=row, column=1).border = border

# Linha de totais
total_row = 10
ws.cell(row=total_row, column=1, value="TOTAL").font = Font(bold=True)
ws.cell(row=total_row, column=1).alignment = center
ws.cell(row=total_row, column=1).border = border

for col in range(2, 7):
    start = 4
    end = 9
    col_letter = get_column_letter(col)
    c = ws.cell(row=total_row, column=col)
    c.value = f"=SUM({col_letter}{start}:{col_letter}{end})"
    c.font = total_font
    c.fill = total_fill
    c.number_format = '#,##0'
    c.border = border

# Atingimento de meta (%)
ws.cell(row=12, column=1, value="Atingimento de Meta").font = Font(bold=True)
ws.cell(row=12, column=2, value="=E10/F10").number_format = "0.0%"
ws.cell(row=12, column=2).border = border

# Largura das colunas
ws.column_dimensions["A"].width = 8
for col in "BCDEF":
    ws.column_dimensions[col].width = 16

# Altura das linhas
ws.row_dimensions[1].height = 30
ws.row_dimensions[3].height = 20

wb.save("planilha_exemplo.xlsx")
print("Arquivo salvo: planilha_exemplo.xlsx")
