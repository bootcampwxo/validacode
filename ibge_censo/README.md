# 🇧🇷 IBGE Censo — Análise Demográfica

Aplicação Python completa para análise interativa de dados do **Censo Demográfico do IBGE**, com suporte à API SIDRA, leitura de CSV, análises estatísticas, visualizações e duas interfaces (CLI e Streamlit).

---

## 📦 Estrutura do Projeto

```
ibge_censo/
├── src/
│   ├── coleta/
│   │   ├── api_ibge.py       # Cliente para a API SIDRA e ServiceData (IBGE)
│   │   └── leitor_csv.py     # Leitura e validação de arquivos CSV
│   ├── analise/
│   │   ├── estatisticas.py   # Análises demográficas e métricas
│   │   └── filtros.py        # Filtros geográficos e temáticos
│   └── visualizacao/
│       └── graficos.py       # Gráficos com matplotlib e seaborn
├── tests/
│   ├── test_estatisticas.py  # Testes de AnaliseDemografica
│   ├── test_filtros.py       # Testes de FiltroDados
│   └── test_leitor_csv.py    # Testes de LeitorCSV
├── data/                     # Pasta para CSVs locais (não versionada)
├── outputs/                  # Gráficos gerados (criada automaticamente)
├── app.py                    # Interface Streamlit
├── cli.py                    # Interface de linha de comando
└── requirements.txt
```

---

## 🚀 Instalação

### Pré-requisitos
- Python 3.11 ou superior
- pip

### Passos

```bash
# 1. Clone o repositório (ou acesse a pasta do projeto)
cd ibge_censo

# 2. Crie e ative um ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
.venv\Scripts\activate           # Windows

# 3. Instale as dependências
pip install -r requirements.txt
```

---

## 💻 Uso — Interface de Linha de Comando (CLI)

A CLI oferece 6 subcomandos. Execute com `python cli.py SUBCOMANDO --help` para detalhes de cada um.

### Listar estados
```bash
python cli.py estados
python cli.py estados --regiao 3   # 1=N  2=NE  3=SE  4=S  5=CO
```

### Analisar população
```bash
# Top 10 estados mais populosos com gráfico
python cli.py populacao --top 10 --grafico

# Municípios de São Paulo (código 35)
python cli.py populacao --uf 35 --nivel municipio --grafico
```

### Densidade demográfica
```bash
python cli.py densidade --grafico
```

### Pirâmide etária
```bash
python cli.py piramide --nivel brasil --grafico
python cli.py piramide --nivel estado --grafico
```

### Analisar CSV local
```bash
# Análise automática
python cli.py csv data/meu_arquivo.csv --grafico

# Com tipo explícito e colunas personalizadas
python cli.py csv data/populacao.csv --tipo populacao --coluna-local nome_municipio --coluna-valor valor
```

### Opções globais
```bash
python cli.py --saida resultados/ --verbose populacao --top 5
```

---

## 🌐 Uso — Interface Streamlit

```bash
# Na pasta ibge_censo/
streamlit run app.py
```

Abre no navegador em `http://localhost:8501` com as seguintes abas:

| Aba | Conteúdo |
|-----|----------|
| 👥 Populacao | Barras de população total + tabela + download CSV |
| 🗺️ Densidade | Mapa de calor de densidade + métricas em destaque |
| 🔺 Pirâmide Etária | Pirâmide etária interativa + distribuição percentual |
| 📁 CSV | Upload de arquivo CSV + análise + gráfico automático |
| ℹ️ Sobre | Documentação da aplicação |

### Configurações na barra lateral
- **Fonte de dados**: API IBGE (online) ou CSV local
- **Nível geográfico**: Estado, Região ou Brasil
- **Filtros de região**: Norte, Nordeste, Sudeste, Sul, Centro-Oeste
- **Top N**: quantas localidades exibir nos gráficos
- **Qualidade**: DPI das imagens exportadas

---

## 🧪 Testes

```bash
# Rodar todos os testes
pytest tests/ -v

# Com cobertura de código (instale pytest-cov)
pip install pytest-cov
pytest tests/ -v --cov=src --cov-report=term-missing

# Rodar um módulo específico
pytest tests/test_estatisticas.py -v
pytest tests/test_filtros.py -v
pytest tests/test_leitor_csv.py -v
```

---

## 📡 APIs Utilizadas

### SIDRA — Sistema IBGE de Recuperação Automática
- URL base: `https://apisidra.ibge.gov.br/values`
- Documentação: [apisidra.ibge.gov.br](https://apisidra.ibge.gov.br/)
- Uso: dados de população, distribuição etária, escolaridade e renda

### ServiceData — API de Localidades
- URL base: `https://servicodados.ibge.gov.br/api/v1/localidades`
- Documentação: [servicodados.ibge.gov.br](https://servicodados.ibge.gov.br/api/docs/localidades)
- Uso: lista de regiões, estados e municípios

### Tabelas SIDRA utilizadas
| Tabela | Descrição |
|--------|-----------|
| 200 | População residente por município |
| 9514 | População por sexo (Censo 2022) |
| 9515 | Distribuição etária (Censo 2022) |
| 9543 | Nível de instrução (Censo 2022) |
| 9544 | Renda domiciliar per capita (Censo 2022) |

---

## 📊 Funcionalidades de Análise

| Módulo | Funcionalidade |
|--------|---------------|
| `AnaliseDemografica` | Estatísticas descritivas (média, desvio, curtose, assimetria) |
| `AnaliseDemografica` | Totais e percentuais por localidade |
| `AnaliseDemografica` | Densidade demográfica (hab/km²) por estado |
| `AnaliseDemografica` | Pirâmide etária (dados para gráfico) |
| `AnaliseDemografica` | Distribuição etária percentual |
| `AnaliseDemografica` | Razão de sexo por localidade |
| `AnaliseDemografica` | Índice de envelhecimento |
| `AnaliseDemografica` | Renda domiciliar média e mediana por estado |
| `FiltroDados` | Filtrar por região, estado (nome ou sigla), município |
| `FiltroDados` | Filtrar por ID de município, sexo, grupo de idade |
| `FiltroDados` | Top N registros (maior ou menor valor) |

---

## 📈 Gráficos Disponíveis

| Método `GraficoCenso` | Tipo |
|-----------------------|------|
| `barras_populacao` | Barras horizontais/verticais |
| `mapa_calor_densidade` | Heatmap seaborn |
| `piramide_etaria` | Pirâmide etária (barras espelhadas) |
| `pizza_distribuicao` | Pizza com agrupamento "Outros" |
| `barras_agrupadas_sexo` | Barras agrupadas masculino × feminino |
| `barras_horizontais_escolaridade` | Barras horizontais com rótulos |
| `boxplot_renda` | Boxplot por região |
| `dashboard_resumo` | Painel com 3 subplots combinados |

---

## 📂 Trabalhando com CSV Local

Para usar arquivos do portal SIDRA:

1. Acesse [sidra.ibge.gov.br](https://sidra.ibge.gov.br/tabela/200)
2. Selecione as variáveis e período desejados
3. Clique em **Download** → **CSV**
4. Salve em `data/` e execute:

```bash
python cli.py csv data/Tabela200.csv --grafico
```

> **Dica:** Arquivos antigos do SIDRA usam encoding `latin-1`. O `LeitorCSV` detecta e faz o fallback automaticamente.

---

## ⚙️ Configurações Avançadas

### Variáveis de ambiente (opcional)
```bash
# Timeout e retentativas da API
export IBGE_API_TIMEOUT=60
export IBGE_API_RETRIES=5
```

### Personalização de gráficos
```python
from src.visualizacao.graficos import GraficoCenso

grafico = GraficoCenso(diretorio_saida="meus_graficos", dpi=300)
```

---

## 📋 Requisitos de Sistema

- Python 3.11+
- Conexão com internet (para API IBGE)
- ~150 MB de RAM para análises em nível municipal

---

## 🤝 Contribuição

1. Faça fork do repositório
2. Crie uma branch: `git checkout -b feature/nova-analise`
3. Commit: `git commit -m 'feat: adiciona análise de migração'`
4. Push: `git push origin feature/nova-analise`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de uso livre para fins educacionais e de pesquisa.
Os dados do IBGE estão disponíveis sob [Licença de Dados Abertos](https://www.ibge.gov.br/acesso-informacao/institucional/direitos-autorais.html).
