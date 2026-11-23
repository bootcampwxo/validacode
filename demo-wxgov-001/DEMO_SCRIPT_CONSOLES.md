# Demo Script — AI Governance + AgentOps
## Formato: Consoles Nativas IBM (OpenPages + Orchestrate)
### Versão detalhada com falas e explicações de cada dashboard

**Duração:** 35–45 min  
**Público:** Misto — C-suite (valor/risco) + técnico (arquitetura)  
**Abas necessárias:** 2 (OpenPages + Orchestrate)  
**Pré-requisito:** Login feito nas duas consoles antes de começar

---

## ⚙️ SETUP — Antes de qualquer coisa (10 min antes)

**Abrir dois browsers lado a lado ou em tela cheia alternando:**

| Aba | URL | Deixar em |
|-----|-----|-----------|
| **1 — OpenPages** | `https://9db7b90d-3499-487e-9b94-7d72663b27e5.au-syd.openpages.cloud.ibm.com` | Tab **Home** |
| **2 — Orchestrate** | `https://us-south.watson-orchestrate.cloud.ibm.com` | Agente **governance_agent** aberto |

**Verificações rápidas:**
- [ ] OpenPages carrega o dashboard Home com os gráficos visíveis
- [ ] Orchestrate mostra o chat do `governance_agent` pronto para digitar
- [ ] Zoom do browser: 90% em ambos
- [ ] Silenciar notificações do sistema operacional

---

## 🎬 ABERTURA — "Por que isso importa agora?" (3 min)

**[Tela: OpenPages — Tab Home — deixar visível enquanto fala]**

> *"Obrigado pela oportunidade. Vou começar com uma pergunta:*
> *quantos modelos de IA a sua organização tem rodando em produção hoje?*"*

*(pausa — deixe responderem)*

> *"A maioria das empresas que converso não sabe responder com precisão.*
> *Sabe que tem modelos — no crédito, no atendimento, na detecção de fraude —*
> *mas não tem um inventário unificado, auditável, com dono definido.*
> *E é exatamente aí que mora o risco: regulatório, operacional e reputacional."*

> *"O que vou mostrar hoje é como a IBM resolve isso de ponta a ponta.*
> *Começando por onde tudo começa: o inventário."*

---

## 🗂️ ATO 1 — Home Dashboard: "O inventário vivo da sua IA" (8 min)

**[Tela: OpenPages — Tab Home]**

> *"Esta é a tela Home do IBM watsonx Governance.*
> *É o painel de controle do gestor de risco de IA.*
> *Vou explicar cada bloco."*

---

### Bloco 1 — Inventory (canto superior esquerdo)

**O que está na tela:**
- **Use Cases by Risk Level: 33 total** → High: 11 · Medium: 13 · Low: 9
- **Models by Risk Tier: 36** → Tier 1: 16 · Tier 2: 12 · Tier 3: 5
- **Foundation Models by Hosting Location: 21** → todos External

**O que falar:**

> *"O bloco de Inventário mostra tudo que está catalogado.*
> *33 casos de uso de IA — 11 deles classificados como alto risco.*
> *Isso não é uma lista técnica: é uma lista de responsabilidades regulatórias.*
> *Cada um desses 11 casos de alto risco representa uma exposição que precisa*
> *de controle, aprovação e monitoramento contínuo."*

> *"Abaixo: 36 modelos organizados por Tier de risco.*
> *Tier 1 são os modelos que tomam decisões que afetam diretamente pessoas —*
> *crédito, saúde, seguros. São os que o regulador vai perguntar primeiro."*

> *"E 21 Foundation Models — todos hospedados externamente.*
> *Hugging Face, OpenAI. O sistema rastreia de onde cada modelo vem,*
> *quem o mantém, e qual é o ciclo de vida dele dentro da empresa."*

---

### Bloco 2 — Use Cases by Lifecycle Phase (canto superior direito)

**O que está na tela:**
- Gráfico donut: 33 Use Cases
- Quase tudo em **"Approved for Development": 32**
- **"Proposed": 1**

**O que falar:**

> *"Este gráfico mostra em que fase do ciclo de vida cada caso de uso está.*
> *32 dos 33 estão aprovados para desenvolvimento — isso é uma pipeline ativa.*
> *1 está em Proposed — esperando aprovação.*
> *Cada transição entre fases exige uma aprovação humana documentada.*
> *Ninguém coloca um modelo em produção aqui sem passar pelo processo."*

---

### Bloco 3 — Change Management

**O que está na tela:**
- **Change Requests by Status: 41** → todos em "Proposed"
- **Change Requests in Process: 41**

**O que falar:**

> *"41 change requests em aberto.*
> *Cada vez que alguém quer mudar um modelo em produção —*
> *retreinar, ajustar parâmetros, trocar versão —*
> *precisa abrir um Change Request aqui.*
> *Isso garante que nenhuma mudança passa despercebida.*
> *O regulador pode perguntar: 'o modelo mudou depois da aprovação?'*
> *A resposta está aqui, com data, autor e justificativa."*

---

### Bloco 4 — Model Validation

**O que está na tela:**
- **Model Reviews by Status: 37 total**
  - Awaiting Assignment: 1
  - Fieldwork Commenced: 6
  - Draft Completed: 7
  - Review Underway: 1
  - **Review Complete: 22**
- **Reviews in Progress: 13**
- **Reviews Awaiting Assignment: 1**

**O que falar:**

> *"Model Validation é o coração da governança técnica.*
> *37 revisões de modelos em curso ou concluídas.*
> *22 completas — isso significa 22 modelos que passaram por validação independente.*
> *13 em andamento agora.*
> *E 1 esperando ser atribuída a um validador.*
> *Este painel permite que o Chief Risk Officer veja, em tempo real,*
> *se a fila de validação está fluindo ou represando."*

---

### Bloco 5 — Model Performance

**O que está na tela:**
- **135 métricas registradas**
- Todas em **"Not Determined"**

**O que falar:**

> *"135 métricas de performance registradas para os modelos.*
> *O status 'Not Determined' indica que ainda não foi configurado o monitoramento*
> *automático para este ambiente de demo.*
> *Em produção, cada métrica teria um valor Red/Yellow/Green atualizado automaticamente —*
> *accuracy, fairness, drift, robustness —*
> *e qualquer desvio geraria um alerta para o responsável.*
> *Mas o framework já está aqui: 135 pontos de observação, prontos para ligar."*

---

### Bloco 6 — Deployments

**O que está na tela:**
- **45 deployments total**
  - Awaiting Deployment: 14
  - Deployed: 31
- **Production Deployments: 25**
- **Non-prod Deployments: 15** (dev/staging)

**O que falar:**

> *"25 modelos em produção. 15 em não-produção.*
> *14 aguardando deployment — estão aprovados mas ainda não foram para produção.*
> *Este painel evita o problema clássico: um modelo em staging que*
> *'acidentalmente' foi para produção sem aprovação.*
> *Aqui cada deployment é rastreado por ambiente, status e data."*

---

### Bloco 7 — Models by Provider

**O que está na tela:**
- Foundation Models: Hugging Face: 19 · OpenAI: 2
- Developed Models: IBM: 13 · Amazon: 11 · Microsoft: 4 · Databricks: 5 · Google: 2

**O que falar:**

> *"Finalmente: de onde vêm os modelos?*
> *Foundation models: 19 do Hugging Face, 2 da OpenAI.*
> *Modelos desenvolvidos internamente: usando infra da IBM, Amazon, Microsoft, Google, Databricks.*
> *Por que isso importa? Porque quando sai uma vulnerabilidade num modelo do Hugging Face,*
> *você precisa saber em 5 minutos quais dos seus 57 modelos usam aquele foundation model.*
> *Esta view dá exatamente isso."*

---

## 📊 ATO 2 — Executive Overview: "O que o board precisa ver" (6 min)

**[Clique na tab Executive Overview]**

> *"Agora vou mudar para a visão executiva.*
> *Esta tab foi desenhada para o board, o Chief Risk Officer,*
> *e o Chief AI Officer."*

---

### Painel 1 — Compliance Posture

**O que está na tela:**
- **33 Use Cases — todos "Not Determined"**
- Compliant: 0 · Non Compliant: 0

**O que falar:**

> *"Compliance Posture: a postura de conformidade geral.*
> *33 casos de uso — todos em 'Not Determined'.*
> *Isso é o estado natural de uma organização que acabou de catalogar sua IA.*
> *'Não Determinado' não é problema — é honestidade.*
> *O problema é não saber. Agora sabemos o que temos.*
> *O próximo passo é preencher essa avaliação e mover para Compliant.*
> *A IBM tem aceleradores para isso."*

---

### Painel 2 — Use Case Risk Rating

**O que está na tela:**
- 33 Use Cases: **High: 11 · Medium: 13 · Low: 9**

**O que falar:**

> *"Use Case Risk Rating — distribuição de risco por caso de uso.*
> *11 High risk. Estes são os que precisam de mais controles.*
> *O gráfico mostra a distribuição: vermelho, amarelo, verde.*
> *Uma boa governança é quando o verde cresce não porque os riscos sumiram,*
> *mas porque os controles foram implementados.*"*

---

### Painel 3 — EU AI Act Risk Level

**O que está na tela:**
- 33 Use Cases: **todos "Not Determined"**
- Prohibited: 0 · High: 0 · Limited: 0 · Minimal: 0

**O que falar:**

> *"EU AI Act Risk Level — conformidade com a regulação europeia.*
> *Todos ainda 'Not Determined' — o processo de classificação ainda não foi executado.*
> *O sistema já tem os 4 níveis do EU AI Act pré-configurados:*
> *Prohibited, High, Limited, Minimal.*
> *Para empresas que operam na Europa ou têm clientes europeus,*
> *este painel é exatamente o que o regulador vai pedir.*
> *E a IBM tem frameworks prontos para acelerar essa classificação."*

---

### Painel 4 — Foundation Model Onboarding

**O que está na tela:**
- 21 Foundation Models:
  - **Approved for Deployment: 9**
  - **Under Development: 8**
  - **Awaiting Approval: 3**
  - Pre Implementation Review: 1

**O que falar:**

> *"Foundation Model Onboarding — o ciclo de vida dos LLMs e foundation models.*
> *9 aprovados para deployment — estão liberados para usar em produção.*
> *8 em desenvolvimento.*
> *3 aguardando aprovação — alguém está revisando antes de liberar.*
> *Este painel é crucial para empresas que usam múltiplos LLMs:*
> *GPT-4, Llama, Granite. Cada um tem um processo de aprovação antes de entrar*
> *em qualquer produto."*

---

### Painel 5 — Metrics by Category

**O que está na tela:**
- 135 métricas: Quality: 81 · Fairness: 18 · Drift: 27 · Others: 9
- Todas "Not Determined"

**O que falar:**

> *"135 métricas de qualidade de IA organizadas por categoria.*
> *81 de Quality — precisão, F1, AUC.*
> *18 de Fairness — viés por grupo demográfico.*
> *27 de Drift — detecção de mudança de comportamento do modelo.*
> *Quando estas métricas tiverem valores reais, o board vê em segundos*
> *se algum modelo está começando a falhar.*
> *Sem isso, você descobre o problema quando o cliente já reclamou."*

---

## 🕸️ ATO 3 — Governance Graph: "A teia da sua IA" (7 min)

**[Clique na tab Governance Graph]**

> *"Agora chegamos ao visual mais impactante.*
> *O Governance Graph é o mapa de relacionamentos de toda a sua IA."*

**O que está na tela — números do grafo:**

| Nó | Número | Significado |
|----|--------|-------------|
| Business Entity | **177** | Áreas/processos de negócio que usam IA |
| Use Case | **33** | Iniciativas de IA catalogadas |
| Model | **57** | Modelos em todos os estágios |
| Risk | **100** | Riscos identificados e rastreados |
| Model Scorecard | **28** | Avaliações formais de modelo |
| Review | **37** | Revisões independentes |
| Deployment | **45** | Instâncias em produção e staging |
| Change Request | **41** | Mudanças em processo |
| Metric | **135** | KPIs de performance de modelo |
| Metric Value | **243** | Leituras históricas de métricas |

**O que falar:**

> *"Cada nó azul é um tipo de objeto. Os números mostram quantos existem.*
> *As linhas entre eles são os relacionamentos.*
> *Uma Business Entity tem Use Cases.*
> *Um Use Case usa modelos.*
> *Um modelo tem riscos associados, scorecards de avaliação,*
> *deployments ativos, e 243 leituras de métricas históricas.*"*

> *"Por que isso importa?*
> *Imagine que amanhã sai uma notícia: 'modelo de crédito X tem viés racial'.*
> *Você abre este grafo, clica no modelo, e em 30 segundos sabe:*
> *qual Business Entity é dona, quem aprovou o deployment,*
> *qual Use Case ele serve, quais controles estão ativos,*
> *e quais métricas de fairness estão monitorando."*

**[Clique no nó Model — 57]:**

> *"Veja: ao clicar no nó Model, o grafo mostra os relacionamentos deste tipo.*
> *Modelos conectados a Use Cases, a Risks, a Deployments.*
> *Esta é a visão que o auditor quer ver.*
> *Não um relatório estático — um grafo navegável, em tempo real."*

---

## 🤖 ATO 4 — Orchestrate: "O agente que trabalha com você" (10 min)

**[Mude para Aba 2 — watsonx Orchestrate — governance_agent]**

> *"Agora o pulo do gato.*
> *Tudo que vimos até agora — esse inventário, esses riscos —*
> *pode ser consultado, classificado e escalado por um agente de IA.*
> *O governance_agent é um agente nativo do IBM watsonx Orchestrate,*
> *com 4 capacidades específicas para governance."*

**[Aponte as 4 tools no painel do agente, se visíveis:]**
- `classify_complaint` — classifica reclamações de IA por tipo de risco
- `lookup_customer` — busca contexto de clientes afetados
- `draft_response` — redige resposta formal
- `escalate_to_human` — aciona revisão humana quando necessário

---

### Cenário 1 — Reclamação de viés algorítmico (3 min)

**[Digite no chat do Orchestrate — copie e cole:]**

```
Um cliente do segmento de crédito pessoal reclamou que teve o empréstimo 
negado sem nenhuma explicação. Ele suspeita que houve discriminação por 
renda. Classifique essa reclamação e indique o risco regulatório associado.
```

> *"Enquanto o agente processa, notem o que está acontecendo:*
> *ele está chamando a tool `classify_complaint`,*
> *que analisa o texto, identifica o tipo de risco —*
> *viés, falta de explicabilidade, violação de direito do consumidor —*
> *e retorna a classificação com o framework regulatório aplicável."*

**[Aguarde a resposta e leia em voz alta os pontos principais:]**

> *"O agente classificou como [categoria que aparecer].*
> *Ele já identificou: o tipo de risco, o artigo regulatório relevante,*
> *e sugeriu a próxima ação.*
> *Isso substituiu o que antes levaria horas de triagem manual."*

---

### Cenário 2 — Encadeamento de tools (3 min)

**[Digite no chat:]**

```
Busque informações do cliente CUST-2847 e redija uma resposta formal 
para a reclamação, explicando os critérios de decisão do modelo 
e os direitos do cliente de solicitar revisão humana.
```

> *"Agora o agente encadeia duas tools:*
> *primeiro `lookup_customer` para buscar o contexto do cliente,*
> *depois `draft_response` para redigir a resposta.*
> *Notem que ele não inventa informação — ele usa os dados do sistema*
> *e compõe uma resposta estruturada, em linguagem adequada.*
> *O analista de compliance só precisa revisar e assinar."*

**[Aguarde e mostre a resposta estruturada:]**

> *"Uma resposta formal, com base nos dados reais do sistema.*
> *Tempo: segundos. Antes, isso levava horas.*
> *E cada resposta gerada fica registrada como evidência de que a empresa*
> *respondeu à reclamação de forma adequada."*

---

### Cenário 3 — Human-in-the-loop: o momento de impacto (2 min)

**[Digite no chat:]**

```
Esse caso tem indícios de discriminação sistemática por grupo étnico. 
Escale para o comitê de ética de IA com prioridade alta.
```

> *"E aqui está o diferencial mais importante.*
> *Quando o agente identifica que um caso está além do seu nível de autoridade —*
> *discriminação sistemática, risco regulatório crítico —*
> *ele aciona a tool `escalate_to_human`.*
> *Não decide sozinho. Escala.*"*

> *"Isso é o que separa IA responsável de IA irresponsável.*
> *Human-in-the-loop não é uma limitação técnica.*
> *É uma escolha arquitetural deliberada.*
> *A IBM buildou isso no coração do Orchestrate."*

---

## 🔗 ATO 5 — O loop fechado: Governance + Agent (3 min)

**[Volte para Aba 1 — OpenPages]**

> *"Vou fechar com a visão mais importante.*
> *Tudo que o agente fez — a classificação, a resposta, a escalada —*
> *deveria ser registrado aqui no OpenPages como evento de governança.*"*

> *"O regulador vai perguntar:*
> *'Quando vocês receberam essa reclamação, o que fizeram?'*
> *'Como o modelo foi avaliado depois?'*
> *'Quem aprovou a resposta?'*"*

> *"Com o loop fechado — Orchestrate gerando as ações,*
> *OpenPages registrando a trilha de auditoria —*
> *essas perguntas têm resposta em segundos, não em semanas."*

---

## 🎯 FECHAMENTO — "Próximos passos" (2 min)

**[Fique na tela do Governance Graph — visual mais impactante]**

> *"Resumindo o que vocês viram hoje:"*
>
> *"1. Um inventário completo — 57 modelos, 33 casos de uso,*
> *100 riscos, todos catalogados e rastreados."*
>
> *"2. Uma visão executiva — Compliance Posture, EU AI Act,*
> *Foundation Model Onboarding, tudo em um painel."*
>
> *"3. Um agente operacional — que classifica, responde e escala*
> *reclamações de IA com human-in-the-loop embutido."*
>
> *"A IBM pode ter exatamente isso rodando no ambiente de vocês*
> *em 3 a 4 semanas com o time de Client Engineering.*
> *Começamos com um piloto focado nos modelos de maior risco regulatório.*"*

**[Pergunta de fechamento — escolha uma:]**
- *"Qual das suas áreas tem mais modelos em produção sem inventário formal hoje?"*
- *"Qual regulação é a maior preocupação para vocês agora — EU AI Act, BACEN, LGPD?"*
- *"Vocês já têm um processo de change management para modelos de IA?"*

---

## 🚨 PLANO B — Se o Orchestrate não conectar

Execute diretamente no terminal enquanto compartilha a tela:

```bash
cd ~/bob-otel-lab/canario/demo-wxgov-001
source .venv/bin/activate

orchestrate chat ask \
  --agent-name governance_agent \
  --message "Cliente com crédito negado suspeita de discriminação. Classifique o risco." \
  --raw
```

> *"Estou rodando o agente diretamente pelo terminal.*
> *Mesmo resultado — a resposta do agente ao vivo.*
> *Para audiência técnica, isso é ainda mais impactante.*"*

---

## ❓ FAQ — Respostas prontas para perguntas difíceis

| Pergunta | Resposta direta |
|----------|-----------------|
| "Funciona com nossos modelos que já estão no Azure/AWS?" | Sim — conectores nativos para Azure ML, AWS SageMaker, Google Vertex. O inventário captura modelos de qualquer plataforma. |
| "Quanto tempo para implantar?" | Piloto de 3–4 semanas com Client Engineering. Escopo focado nos modelos de maior risco. |
| "Precisa do watsonx.ai para usar o Governance?" | Não — o Governance funciona com modelos de qualquer fornecedor. O watsonx.ai é opcional. |
| "O que é 'Not Determined' no dashboard?" | É o estado inicial antes da avaliação. Significa que o sistema já registrou o objeto mas o assessment ainda não foi executado. É melhor que não saber que o objeto existe. |
| "O agente tem acesso a dados reais dos clientes?" | Nesta demo, dados sintéticos. Em produção, conecta ao CRM/core banking via API com autenticação e controle de acesso por perfil. |
| "É compatível com EU AI Act?" | Sim — tem os 4 níveis de risco pré-configurados (Prohibited, High, Limited, Minimal) e gera o relatório de conformidade. |
| "Funciona on-premise?" | Sim — via Cloud Pak for Data (CPD) on-premise. Mesma funcionalidade, sem dados saindo do datacenter. |
| "O agente aprende com o tempo?" | Sim — via RAG com histórico de casos e fine-tuning com dados da organização. |

---

*Demo preparada por IBM Client Engineering | Dados sintéticos | Ambiente de demonstração*  
*Versão: 2.0 — Consoles Nativas | Atualizado: 2026-11-18*
