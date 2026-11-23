# DEMO_SCRIPT.md — AI Governance + AgentOps (Hybrid)
# DEMO-WXGOV-001 · Audiência: Mixed (C-suite + Técnico) · Duração: 45–60 min
# Formato: **Híbrido** — Carbon React como narrativa principal + OpenPages aberto em 2 momentos

---

## Legenda de formato

| Símbolo | Significado |
|---------|-------------|
| 🖥️ **Carbon Demo** | Manter no app `localhost:5173` |
| 🌐 **→ OpenPages** | Abrir console real (au-syd) em nova aba |
| 💬 **Fala** | Texto exato para o apresentador |
| 🎯 **Clique** | Ação específica na tela |
| ⏱️ **[Xm]** | Tempo alocado para o passo |

---

## Checklist Pré-Demo (10 min antes)

- [ ] `cd demo-wxgov-001/backend && source .venv/bin/activate && DEMO_MODE=mock uvicorn main:app --port 8000`
- [ ] `cd demo-wxgov-001/frontend && npm run dev`
- [ ] Chrome aberto em `http://localhost:5173` — tab na página **Dashboard**
- [ ] Segunda aba pré-carregada: `https://9db7b90d-3499-487e-9b94-7d72663b27e5.au-syd.openpages.cloud.ibm.com/app/jspview/react/grc/dashboard/Home` (OpenPages **Home**)
- [ ] Terceira aba pré-carregada: OpenPages **Executive Overview** tab (clique na aba no painel após abrir)
- [ ] Zoom do browser: 100%, resolução 1920×1080
- [ ] `orchestrate agents list` executado — confirmar `governance_agent` aparece ✅
- [ ] Silenciar notificações do sistema operacional
- [ ] Deck de backup aberto (caso de falha de rede)

---

## ATO 1 — O Risco ⏱️ [5 min] · Foco: Executivos

> *Antes de mostrar qualquer tela*

### Abertura verbal (sem slides)

💬 **Fala (pausada, impacto máximo):**

> "Deixa eu fazer uma pergunta direta. Quantos modelos de IA a empresa de vocês tem em produção hoje?"
>
> *(pausa para o cliente responder)*
>
> "E se um regulador chegasse amanhã e pedisse o log completo de todas as decisões desses modelos nos últimos 6 meses — incluindo a justificativa de cada decisão, as métricas de viés, e uma prova de que o sistema não discriminou por nenhum critério protegido...
>
> *(pausa de 3 segundos)*
>
> ...em quanto tempo vocês conseguiriam entregar isso?"

**Por que funciona:** Cria urgência sem vender. O cliente sente a dor antes de ver a solução.

**Dados de impacto (mencionar um, máximo dois):**
- EU AI Act: multas de até €30M ou 6% do faturamento global
- LGPD Art. 20: direito do cidadão a explicação de decisões automáticas
- Custo médio de um incidente de viés em produção: US$4.2M (IBM IBV 2024)

---

## ATO 2 — A Solução ⏱️ [30 min]

### Passo 1 — Dashboard Executivo ⏱️ [3 min]

🖥️ **Carbon Demo** · `http://localhost:5173/`

💬 **Fala:**
> "Este é o painel de governança de IA em tempo real. Veja: 72% das reclamações estão sendo tratadas diretamente pelo agente — sem intervenção humana. E 100% dessas decisões estão auditadas."

🎯 **Destaques obrigatórios:**
- **KPI "Governance Flags: 42"** → "Esses são os casos que o sistema identificou como possível risco regulatório — automaticamente"
- **KPI "AI-Handled Rate: 72%"** → "ROI direto — 362 interações humanas evitadas esta semana"
- **Banda de conformidade** → "Drift: 0.12 de um limite de 0.20. Se passar, alerta automático — sem surpresas"

---

### Passo 2 — Model Lifecycle ⏱️ [5 min] · 🌟 Novo slide!

🖥️ **Carbon Demo** · Navegar para `/lifecycle`

💬 **Fala:**
> "Antes de mergulhar nos detalhes técnicos, preciso mostrar o processo completo. Um modelo de IA não pode simplesmente 'aparecer' em produção — ele passa por 5 estágios obrigatórios."

🎯 **Interagir com os estágios:**

1. **Clicar em "Risk Assessment" (Stage 2 — amarelo)**
   > "Olha aqui — 33 use cases cadastrados. Mas o campo 'EU AI Risk Level'? Está como 'Not Determined' em 100% deles. Isso não é um problema hipotético — é o estado real do nosso ambiente hoje."

2. **Clicar em "Monitor" (Stage 5 — teal)**
   > "135 métricas de qualidade, drift e fairness registradas. Todas 'Not Determined'. Isso significa que os modelos estão em produção, mas sem monitoramento ativo de viés. É exatamente o tipo de lacuna que o EU AI Act vai penalizar."

3. **Clicar no botão "Ver no console"** *(em qualquer estágio)*
   > "E este botão aqui? Vai abrir o ambiente real do OpenPages — não é mock, não é simulação."

---

### 🌐 DRILL-DOWN 1 — OpenPages Executive Overview ⏱️ [6 min]
> *Este é o primeiro momento de virada da demo. Troque para a aba do OpenPages.*

🌐 **→ OpenPages** · `Executive Overview` tab

💬 **Fala (ao trocar de aba):**
> "Vou mostrar o estado **real** do nosso ambiente de governança. Isso não é dado sintético — é produção."

🎯 **Percurso obrigatório no Executive Overview:**

1. **"Compliance Posture"** (canto superior)
   > "Esta é a postura de conformidade consolidada — todos os modelos, todos os use cases."

2. **"EU AI Risk Level" — 100% Not Determined**
   > "Olha aqui — 33 use cases, 100% sem classificação de risco EU AI Act. Esta é a lacuna que nossa ferramenta preenche. Vamos resolver isso hoje."
   > *(pausa dramática)*
   > "Sem isso, qualquer multa do EU AI Act seria aplicada como 'risco máximo por omissão'."

3. **"Foundation Model Onboarding"** (donut chart)
   > "21 foundation models onboarded. 9 já aprovados para deploy, 8 em desenvolvimento, 3 aguardando aprovação. Isso é o estado real dos modelos que sua organização está gerenciando."

4. **"Risk Ratings"** *(se visível)*
   > "E o gráfico de risco mostra a distribuição: Tier 1 alto: 16 modelos, Tier 2 médio: 12, Tier 3 baixo: 5."

💬 **Fala de transição (voltando ao Carbon Demo):**
> "Agora que vocês viram o estado real — vamos ver como chegamos aqui e o que fazemos com isso."

🖥️ **Voltar para** `localhost:5173`

---

### Passo 3 — AI FactSheet ⏱️ [5 min] · Wow moment para executivos

🖥️ **Carbon Demo** · Navegar para `/governance`

💬 **Fala:**
> "Este é o FactSheet do modelo — o passaporte dele. Tudo que um auditor precisaria saber está aqui."

🎯 **Pontos obrigatórios:**
1. **Model Identity:** "Versão 2.1.0, aprovado pelo AI Review Board, risco EU AI Act: Limited"
2. **Training Data:** "Treinado com dados balanceados demograficamente — cobertura de idade, região, gênero"
3. **Live Monitoring:** Mostrar barras de Drift (verde) e Bias (verde)
4. **Policy Constraints:** "Aprovado APENAS para triagem. Não para decisões financeiras."

💬 **Fala final:**
> "Se um auditor chegar amanhã, você entrega este documento em 2 cliques. Sem isso, você estaria respondendo ao regulador com 'não sei'."

🎯 **Wow moment:** Rolar para o gráfico de tendência → "Semana passada o drift começou a subir. O sistema detectou automaticamente e agendou uma reavaliação."

---

### Passo 4 — AgentOps: Raio-X do Agente ⏱️ [6 min] · Foco técnico

🖥️ **Carbon Demo** · Navegar para `/agentops`

💬 **Fala:**
> "Aqui está onde a governança encontra a engenharia. Cada execução do agente é rastreada em tempo real via OpenTelemetry."

🎯 **Destaques das métricas:**
- **P50: 1.2s, P95: 3.1s** → "Para 95% das interações, resposta em menos de 3 segundos"
- **Error Rate: 4%** → "4% de falhas — todas capturadas, nenhuma silenciosa"
- **Tool Latency** → `classify_complaint: avg 180ms` → "Essa é a tool mais crítica"

🎯 **Interação demo:**
1. Clicar em qualquer linha da tabela de traces
2. Expandir o trace detail JSON
3. Apontar: `"governance_flagged": true`

💬 **Fala:**
> "Olha esse trace. O agente recebeu uma reclamação, chamou classify_complaint em 180ms, detectou risco regulatório — a palavra 'discriminação' estava no texto — e automaticamente ativou o governance flag. Tudo registrado, auditável, rastreável."

---

### Passo 5 — Reclamação Governance-Flagged ⏱️ [3 min]

🖥️ **Carbon Demo** · Navegar para `/complaints`

💬 **Fala:**
> "Essa é a visão operacional. 500 reclamações. As linhas marcadas em vermelho são os casos com governance flag ativo."

🎯 **Interação:**
1. Buscar: `CUST-00291`
2. Mostrar `governance_flagged: true`
3. "Este cliente mencionou discriminação. O agente identificou, escalou para humano, e registrou no audit trail."

---

### 🌐 DRILL-DOWN 2 — OpenPages Governance Graph ⏱️ [5 min]
> *Este é o segundo momento de virada. O gráfico é o slide mais visualmente impactante.*

🌐 **→ OpenPages** · `Governance Graph` tab

💬 **Fala (ao trocar de aba):**
> "Agora vou mostrar algo que nenhum dashboard de BI consegue mostrar."

🎯 **Percurso no Governance Graph:**

1. **Deixar o gráfico carregar** *(3-5 segundos de silêncio proposital)*
   > *(depois da pausa)* "Isso é o grafo de governança. Cada nó é uma entidade real: 177 Business Entities, 57 Modelos, 100 Riscos — todos conectados entre si."

2. **Passar o mouse sobre um nó de Model**
   > "Esse modelo aqui está conectado a: use cases, risk assessments, deployments, e change requests. É uma visão 360° que nenhuma planilha consegue capturar."

3. **Mencionar o nó "MCP Server" / "Agent"**
   > "E olha aqui — MCP Servers e Agents já são entidades de primeira classe no grafo de governança. O nosso agente — que acabamos de ver em ação — pode ser registrado aqui e entrar nesse grafo."

4. **Apontar para o nó de Risk (100 nós)**
   > "100 riscos mapeados, todos com rastreabilidade até o modelo que os gerou. Isso é o que o EU AI Act exige."

💬 **Fala de transição:**
> "Agora que vocês viram a profundidade do ambiente — vamos falar sobre como chegamos aqui em 3-4 semanas."

🖥️ **Voltar para** `localhost:5173/architecture`

---

## ATO 3 — A Prova ⏱️ [10 min]

### Passo 6 — Arquitetura ⏱️ [4 min]

🖥️ **Carbon Demo** · Navegar para `/architecture`

💬 **Fala (técnicos):**
> "A stack completa. watsonx Orchestrate roda o agente — 4 tools Python + governança nativa. Cada execução emite traces OpenTelemetry. watsonx.governance consome esses traces para monitoramento de bias e drift. E o OpenPages é o sistema de registro para todo o lifecycle."

🎯 **Pontos-chave:**
- "Sem backend proprietário — o agente roda nativamente no Orchestrate"
- "O Carbon UI é uma casca de apresentação — a inteligência é toda do watsonx"
- "O OpenPages que vocês acabaram de ver **já está integrado** — não é roadmap"

---

### Passo 7 — Próximos Passos com Client Engineering ⏱️ [4 min]

💬 **Fala:**
> "O que vocês acabaram de ver é uma prova de conceito funcional. Em 3-4 semanas com nosso time de Client Engineering, conseguimos ter isso rodando com seus dados reais."

```
Semana 1: Dados reais + modelo treinado com histórico do cliente
Semana 2: Integração com GRC corporativo (OpenPages)
Semana 3: EU AI Act compliance automatizado + relatórios regulatórios
Semana 4: Live monitoring ativo + alertas para o time de conformidade
```

---

### Fechamento ⏱️ [2 min]

💬 **Fala:**
> "Duas perguntas antes de encerrar.
>
> Primeira: qual é o modelo de maior risco que vocês têm em produção hoje — e vocês sabem exatamente como ele toma decisões?
>
> Segunda: se o regulador chegasse amanhã, em quanto tempo vocês conseguiriam entregar a documentação?
>
> *(pausa)*
>
> Essas duas perguntas são a agenda das próximas 4 semanas."

---

## FAQ Rápido

| Pergunta | Resposta |
|----------|---------|
| "Funciona com nosso LLM atual?" | "Sim — Orchestrate suporta watsonx.ai, Groq, OpenAI, e modelos externos" |
| "E a LGPD?" | "O FactSheet documenta os dados de treino; o audit trail cobre o Art. 20" |
| "Quanto custa?" | "Depende do volume. Posso modelar na semana seguinte com seu time de procurement" |
| "E o on-premise?" | "Disponível via Cloud Pak for Data — mesmos artefatos, deploy diferente" |
| "O modelo pode errar?" | "Sim — por isso o drift monitor existe. E para casos críticos, sempre há escalada humana" |
| "O OpenPages substitui nosso GRC atual?" | "Não necessariamente — ele pode se integrar com o GRC existente via API Connect" |
| "O agente pode ser auditado?" | "Sim — cada trace está no AgentOps. E pode ser registrado no Governance Graph do OpenPages" |

---

## Notas de Apresentação

### Gestão de tempo (versão 45 min)
| Ato | Passo | Tempo |
|-----|-------|-------|
| Abertura | Abertura verbal | 5 min |
| Solução | Dashboard | 3 min |
| Solução | Model Lifecycle | 5 min |
| **Console** | **OpenPages Executive Overview** | **6 min** |
| Solução | AI FactSheet | 5 min |
| Solução | AgentOps | 6 min |
| Solução | Reclamações | 3 min |
| **Console** | **OpenPages Governance Graph** | **5 min** |
| Prova | Arquitetura | 4 min |
| Prova | Próximos passos + Fechamento | 3 min |
| **Total** | | **~45 min** |

### Se a demo for 60 min
- Adicionar demo ao vivo do chat no `/agent-chat` (+8 min)
- Explorar o Governance Graph com mais detalhe (+5 min)
- Perguntas e respostas antecipadas (+7 min)

### Plano B (sem internet ou OpenPages offline)
- Pular os 2 drill-downs → demo fica 100% Carbon React, ~33 min
- Mencionar: "O console real está disponível — agendaremos uma visita guiada"
- Os contadores reais no `/lifecycle` ainda são mostrados no Carbon Demo
