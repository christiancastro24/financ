/**
 * FinControl AI - Assistente Virtual ROBUSTO & DINÂMICO
 * Com Sugestões de Conversa e Ganchos de Retenção
 */

const FinControlAI = {
  activeProfile: "personal",
  annualRate: 0.12,

  init() {
    this.activeProfile = localStorage.getItem("activeProfile") || "personal";
    this.injectStyles();
    this.injectHTML();
    this.setupEvents();

    // Mensagem inicial de boas-vindas com sugestões
    setTimeout(() => {
      this.addMessage(
        "Olá! Sou o **FinControl AI** 🧠.\n\nEstou aqui para analisar seus números ou te dar dicas sobre educação financeira. Por onde quer começar?",
        "ai",
        [
          "📊 Meu Resumo do Mês",
          "💸 Qual meu maior gasto?",
          "📚 O que é a regra 50/30/20?",
        ],
      );
    }, 500);
  },

  getData() {
    return {
      expenses:
        JSON.parse(localStorage.getItem(`expenses_${this.activeProfile}`)) ||
        [],
      investments:
        JSON.parse(localStorage.getItem(`investments_${this.activeProfile}`)) ||
        [],
      todos:
        JSON.parse(localStorage.getItem(`todos_${this.activeProfile}`)) || [],
      goals:
        JSON.parse(localStorage.getItem(`goals_${this.activeProfile}`)) || [],
      budgets:
        JSON.parse(localStorage.getItem(`budgets_${this.activeProfile}`)) || {},
      daily:
        JSON.parse(localStorage.getItem(`daily_${this.activeProfile}`)) || {},
    };
  },

  formatMoney(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  },

  removeAccents(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  },

  // ==========================================
  // INTENÇÕES COM GANCHOS E SUGESTÕES
  // ==========================================
  getIntents() {
    const data = this.getData();
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const gastosMensais = data.expenses.filter((e) =>
      e.date.startsWith(monthStr),
    );

    return [
      {
        patterns: ["resumo", "situacao", "como estou", "meu saldo"],
        handler: () => {
          const entradas = gastosMensais
            .filter((e) => e.type === "entrada")
            .reduce((s, e) => s + e.value, 0);
          const saidas = gastosMensais
            .filter((e) => e.type === "saida" || !e.type)
            .reduce((s, e) => s + e.value, 0);
          const invTotal = data.investments.reduce(
            (sum, inv) => sum + inv.value,
            0,
          );

          return {
            text: `📊 **Resumo de ${now.toLocaleDateString("pt-BR", { month: "long" })}:**\n\n**Caixa do Mês:** ${this.formatMoney(entradas - saidas)}\n(Entrou: ${this.formatMoney(entradas)} | Saiu: ${this.formatMoney(saidas)})\n\n**Patrimônio:** ${this.formatMoney(invTotal)}\n**Metas Ativas:** ${data.goals.length}\n**Tarefas:** ${data.todos.filter((t) => !t.done).length} pendentes.\n\nQuer dar uma olhada em onde você está gastando mais ou prefere projetar seus investimentos?`,
            suggestions: ["Qual meu maior gasto?", "Simular um investimento"],
          };
        },
      },
      {
        patterns: [
          "maior gasto",
          "gastei mais",
          "pior gasto",
          "onde gastei muito",
        ],
        handler: () => {
          const saidas = data.expenses.filter(
            (e) => e.type === "saida" || !e.type,
          );
          if (saidas.length === 0)
            return {
              text: "Você ainda não registrou nenhum gasto!",
              suggestions: ["Meu Resumo", "O que é Reserva de Emergência?"],
            };

          const max = saidas.reduce((prev, current) =>
            prev.value > current.value ? prev : current,
          );
          return {
            text: `🚨 O seu maior tomador de dinheiro foi **${max.name}**, custando **${this.formatMoney(max.value)}** (na categoria ${max.category}).\n\nFicar de olho nesses super-gastos é vital. Que tal aprender uma regra simples para dividir melhor seu orçamento?`,
            suggestions: ["Regra 50/30/20", "Quanto gastei em Lazer?"],
          };
        },
      },
      {
        patterns: ["gasto em ", "gastei em ", "gasto com "],
        handler: (input) => {
          const categoriasMap = {
            alimentacao: "Alimentação",
            educacao: "Educação",
            saude: "Saúde",
            moradia: "Moradia",
            transporte: "Transporte",
            lazer: "Lazer",
            outros: "Outros",
            freelance: "Freelance",
          };
          let found = Object.keys(categoriasMap).find((c) => input.includes(c));

          if (!found)
            return {
              text: "Não achei essa categoria. Tente perguntar sobre Lazer, Alimentação ou Moradia.",
              suggestions: [
                "Quanto gastei em Alimentação?",
                "Qual meu maior gasto?",
              ],
            };

          const catReal = categoriasMap[found];
          const total = data.expenses
            .filter(
              (e) => e.category === catReal && (e.type === "saida" || !e.type),
            )
            .reduce((sum, e) => sum + e.value, 0);

          return {
            text: `💸 Você gastou **${this.formatMoney(total)}** com **${catReal}**.\n\nSe esse valor estiver muito alto, lembre-se de sempre garantir que sua Reserva de Emergência está em dia. Sabe o que é isso?`,
            suggestions: ["O que é reserva de emergência?", "Resumo do Mês"],
          };
        },
      },
      {
        patterns: ["tarefa", "pendente", "para fazer", "to do", "todo"],
        handler: () => {
          const pendentes = data.todos.filter((t) => !t.done);
          if (pendentes.length === 0)
            return {
              text: "Tudo limpo! Nenhuma tarefa pendente no momento. ✨",
              suggestions: ["Como estão minhas metas?", "Meu Resumo"],
            };

          let msg = `Você tem **${pendentes.length} tarefas pendentes**:\n`;
          pendentes.slice(0, 3).forEach((t) => (msg += `\n• ${t.text}`));
          if (pendentes.length > 3)
            msg += `\n\n...e mais ${pendentes.length - 3} outras.\n\nUm passo de cada vez. Quer dar uma olhada nas suas metas de longo prazo para se motivar?`;

          return {
            text: msg,
            suggestions: [
              "Como estão minhas metas?",
              "Simular um investimento",
            ],
          };
        },
      },
      {
        patterns: ["meta", "objetivo", "sonho", "progresso"],
        handler: () => {
          if (data.goals.length === 0)
            return {
              text: "Você não possui metas ativas! Crie uma na aba de Investimentos. 🎯",
              suggestions: ["Simular um investimento", "Regra 50/30/20"],
            };

          const mainGoal = data.goals[0];
          const invTotal = data.investments.reduce(
            (sum, inv) => sum + inv.value,
            0,
          );
          const progress = Math.min((invTotal / mainGoal.target) * 100, 100);

          return {
            text: `Sua meta principal é **${mainGoal.name}** (${this.formatMoney(mainGoal.target)}).\n\nVocê já alcançou **${progress.toFixed(1)}%**! Patrimônio atual: ${this.formatMoney(invTotal)}.\n\nQuer simular como aportes mensais podem acelerar isso com a ajuda dos juros compostos?`,
            suggestions: [
              "Se eu investir 500 até 2030",
              "Magia dos Juros Compostos",
            ],
          };
        },
      },
      {
        patterns: [
          "investir",
          "juntar",
          "simular",
          "projecao",
          "projetar",
          "terei",
        ],
        handler: (input, rawInput) => {
          const valMatch = rawInput.match(
            /(?:R\$)?\s*(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)/,
          );
          const yearMatch = rawInput.match(/(20\d{2})/);
          if (!valMatch || !yearMatch)
            return {
              text: "Para projetar, eu preciso do valor e do ano. Exemplo: 'Quanto terei se investir 500 até 2030?'",
              suggestions: [
                "Se eu investir R$ 800 até 2032",
                "O que são juros compostos?",
              ],
            };

          const aporte = parseFloat(
            valMatch[1].replace(/\./g, "").replace(",", "."),
          );
          const anoAlvo = parseInt(yearMatch[1]);
          const anoAtual = new Date().getFullYear();
          if (anoAlvo <= anoAtual)
            return {
              text: "O ano precisa estar no futuro! ⏳",
              suggestions: ["Se eu investir 1000 até 2035"],
            };

          const meses = (anoAlvo - anoAtual) * 12;
          const taxaMensal = Math.pow(1 + this.annualRate, 1 / 12) - 1;
          const totalAtual = data.investments.reduce(
            (sum, inv) => sum + inv.value,
            0,
          );

          const vfTotal =
            totalAtual * Math.pow(1 + taxaMensal, meses) +
            aporte * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal);

          return {
            text: `📈 **Projeção para ${anoAlvo}:**\n\nConsiderando aportes de ${this.formatMoney(aporte)}/mês e rentabilidade de 12% a.a.\n\n🎯 **Valor Estimado:** **${this.formatMoney(vfTotal)}**!\n\nIsso acontece graças aos Juros Compostos. Vale lembrar que a Inflação também afeta o poder de compra no futuro. Quer entender mais sobre algum desses dois?`,
            suggestions: ["Magia dos Juros Compostos", "O que é inflação?"],
          };
        },
      },
      {
        patterns: ["reserva de emergencia", "reserva de emergência", "reserva"],
        handler: () => {
          return {
            text: "🛡️ **Reserva de Emergência:**\nÉ seu 'colete salva-vidas'. O ideal é guardar de **6 a 12 meses** do seu custo de vida mensal.\n\nDeve ser investida em opções ultra seguras que você possa sacar no mesmo dia, como o **CDB com Liquidez Diária** ou o **Tesouro Selic**. Quer saber o que são essas coisas?",
            suggestions: [
              "O que é CDB?",
              "O que é a Taxa Selic?",
              "Como sair das dívidas?",
            ],
          };
        },
      },
      {
        patterns: [
          "regra 50 30 20",
          "regra 50/30/20",
          "503020",
          "dividir salario",
          "dividir dinheiro",
        ],
        handler: () => {
          return {
            text: "📊 **A Regra 50/30/20:**\nDivide seu dinheiro líquido assim:\n\n• **50% Essenciais:** Moradia, mercado, saúde.\n• **30% Estilo de Vida:** Lazer, ifood, compras.\n• **20% Futuro:** Investimentos e quitação de dívidas.\n\nFalando em dívidas, você tem alguma que está incomodando, ou seu foco agora é só diversificar os investimentos?",
            suggestions: ["Como sair das dívidas?", "Por que diversificar?"],
          };
        },
      },
      {
        patterns: ["o que e selic", "taxa selic", "selic"],
        handler: () => {
          return {
            text: "🏦 **Taxa Selic:**\nÉ a taxa 'mãe' da economia brasileira. Se ela sobe, a Renda Fixa fica mais atraente e pegar empréstimos fica mais caro. Se ela cai, a Bolsa de Valores (Ações e FIIs) costuma subir.\n\nVocê já investe em Ações ou quer entender como funcionam os CDBs (que são atrelados à Selic)?",
            suggestions: ["O que é CDB?", "O que são Ações?"],
          };
        },
      },
      {
        patterns: ["o que e cdb", "cdb"],
        handler: () => {
          return {
            text: "📄 **CDB (Certificado de Depósito Bancário):**\nÉ quando VOCÊ empresta dinheiro pro banco. Em troca, ele te devolve com juros.\n\nSe ele pagar '100% do CDI', ele acompanha a Taxa Selic de perto. É perfeito para a sua Reserva de Emergência! Mas atenção para a inflação, para não perder poder de compra. Sabe como a inflação age?",
            suggestions: [
              "O que é inflação?",
              "O que é reserva de emergência?",
            ],
          };
        },
      },
      {
        patterns: ["inflacao", "ipca", "inflação"],
        handler: () => {
          return {
            text: "💸 **Inflação (IPCA):**\nÉ o dragão que come o seu poder de compra. Se a inflação é 5% no ano, seu dinheiro precisa render MAIS que 5% só para você continuar comprando as mesmas coisas.\n\nÉ exatamente por isso que a gente investe buscando os 'Juros Compostos'!",
            suggestions: ["Magia dos juros compostos", "Por que diversificar?"],
          };
        },
      },
      {
        patterns: ["juros compostos", "magia dos juros"],
        handler: () => {
          return {
            text: "❄️ **Juros Compostos (Bola de Neve):**\nSão juros rendendo sobre juros! No começo é lento, mas ao longo dos anos, o rendimento passa a ser maior que o seu próprio aporte mensal. O **Tempo** é o principal ingrediente aqui.\n\nQuer fazer uma simulação pra ver essa bola de neve girando até 2035?",
            suggestions: ["Se eu investir 1000 até 2035", "O que são Ações?"],
          };
        },
      },
      {
        patterns: ["acoes", "bolsa de valores", "renda variavel", "ações"],
        handler: () => {
          return {
            text: "🏢 **Ações (Renda Variável):**\nSignifica virar sócio de grandes empresas (Itaú, Petrobras, Weg, etc). Você ganha com a valorização da empresa e recebendo os lucros que eles distribuem (Dividendos).\n\nMas o risco é maior, o preço sobe e desce todo dia. Por isso a regra de ouro é **Diversificar**. Já ouviu falar em FIIs?",
            suggestions: [
              "O que são Fundos Imobiliários?",
              "Por que diversificar?",
            ],
          };
        },
      },
      {
        patterns: [
          "fii",
          "fundos imobiliarios",
          "fundo imobiliario",
          "aluguel",
        ],
        handler: () => {
          return {
            text: "🏢 **FIIs (Fundos Imobiliários):**\nVocê junta seu dinheiro com outros investidores para comprar shoppings, galpões e prédios comerciais.\n\nA mágica? Você recebe os 'aluguéis' desses imóveis todo mês direto na sua conta, isentos de Imposto de Renda. É ótimo para gerar renda passiva!",
            suggestions: ["O que são ações?", "Por que diversificar?"],
          };
        },
      },
      {
        patterns: [
          "divida",
          "dividas",
          "endividado",
          "nome sujo",
          "dívida",
          "sair das",
        ],
        handler: () => {
          return {
            text: "🚨 **Plano anti-dívidas:**\n1. Mapeie todas e veja o CET (Custo Efetivo Total).\n2. Estanque a sangria (esconda o cartão de crédito).\n3. Foque em pagar as mais caras primeiro (Cartão e Cheque Especial).\n4. Renegocie (use feirões do Serasa).\n\nSe as contas fecharem, use a regra 50/30/20 para não voltar a se endividar.",
            suggestions: ["Regra 50/30/20", "Meu Resumo do Mês"],
          };
        },
      },
      {
        patterns: ["diversificar", "diversificacao", "risco"],
        handler: () => {
          return {
            text: "🥚 **Diversificação:**\n'Não coloque todos os ovos na mesma cesta'.\nSe você tiver Renda Fixa, Ações, FIIs e Investimento no Exterior, quando uma coisa cair, a outra sobe e protege o seu patrimônio. Simples e essencial!",
            suggestions: ["O que é CDB?", "O que são Fundos Imobiliários?"],
          };
        },
      },
      {
        patterns: [
          "ola",
          "oi",
          "bom dia",
          "boa tarde",
          "boa noite",
          "fala ai",
          "tudo bem",
        ],
        handler: () => {
          return {
            text: "Olá de novo! 👋 Por onde quer que eu comece a te ajudar agora?",
            suggestions: [
              "Meu Resumo do Mês",
              "Regra 50/30/20",
              "Tarefas Pendentes",
            ],
          };
        },
      },
    ];
  },

  processInput(rawInput) {
    const inputClean = this.removeAccents(rawInput);
    const intents = this.getIntents();

    for (const intent of intents) {
      if (intent.patterns.some((pattern) => inputClean.includes(pattern))) {
        return intent.handler(inputClean, rawInput);
      }
    }

    return {
      text: "Hum, acho que não peguei essa. 🤔 Tente fazer perguntas como as sugestões abaixo:",
      suggestions: [
        "Qual meu maior gasto?",
        "O que é CDB?",
        "Se eu investir R$ 800 até 2040",
      ],
    };
  },

  // ==========================================
  // INTERFACE DO CHAT COM CHIPS DE SUGESTÃO
  // ==========================================
  injectHTML() {
    if (document.getElementById("ai-chat-btn")) return;

    const html = `
      <div id="ai-chat-btn" title="Falar com Assistente IA">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path></svg>
      </div>
      <div id="ai-chat-window">
        <div class="ai-chat-header">
          <div class="header-title">
            <span class="pulse-dot"></span>
            <strong>FinControl AI</strong>
          </div>
          <button id="ai-chat-close">✕</button>
        </div>
        <div class="ai-chat-body" id="ai-chat-body"></div>
        <div class="ai-chat-input-area">
          <input type="text" id="ai-chat-input" placeholder="Pergunte sobre finanças..." autocomplete="off"/>
          <button id="ai-chat-send">➤</button>
        </div>
      </div>
    `;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  },

  injectStyles() {
    if (document.getElementById("fincontrol-ai-styles")) return;

    const style = document.createElement("style");
    style.id = "fincontrol-ai-styles";
    style.innerHTML = `
      #ai-chat-btn { position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); z-index: 9999; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 2px solid rgba(255,255,255,0.1); }
      #ai-chat-btn svg { width: 26px; height: 26px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      #ai-chat-btn:hover { transform: scale(1.1) translateY(-5px); box-shadow: 0 15px 35px rgba(99, 102, 241, 0.6); }
      
      #ai-chat-window { position: fixed; bottom: 100px; right: 30px; width: 380px; height: 550px; background: rgba(19, 23, 34, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.6); z-index: 9998; transform: translateY(40px) scale(0.95); opacity: 0; pointer-events: none; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); overflow: hidden; }
      #ai-chat-window.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }
      
      .ai-chat-header { padding: 18px 24px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
      .header-title { display: flex; align-items: center; gap: 10px; color: #fff; font-size: 16px; font-weight: 600; }
      .pulse-dot { width: 10px; height: 10px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
      
      #ai-chat-close { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 14px; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      #ai-chat-close:hover { background: #ef4444; color: white; border-color: #ef4444; }
      
      .ai-chat-body { flex: 1; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; scroll-behavior: smooth; }
      .ai-chat-body::-webkit-scrollbar { width: 6px; }
      .ai-chat-body::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.5); border-radius: 10px; }
      
      .msg-container { display: flex; flex-direction: column; max-width: 88%; animation: fadeInMsg 0.3s ease; }
      .msg-container.user { align-self: flex-end; }
      .msg-container.ai { align-self: flex-start; }
      @keyframes fadeInMsg { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .msg-bubble { padding: 14px 18px; border-radius: 18px; font-size: 14px; line-height: 1.6; color: #f8fafc; white-space: pre-wrap; word-wrap: break-word;}
      .msg-container.user .msg-bubble { background: linear-gradient(135deg, #6366f1, #4f46e5); border-bottom-right-radius: 4px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2); }
      .msg-container.ai .msg-bubble { background: #1a1d2d; border: 1px solid rgba(255,255,255,0.06); border-bottom-left-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
      
      /* Botões de Sugestão */
      .ai-suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .ai-suggestion-btn { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #a855f7; border-radius: 16px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left; line-height: 1.3; }
      .ai-suggestion-btn:hover { background: rgba(99, 102, 241, 0.25); transform: translateY(-2px); color: #fff; border-color: #a855f7; }

      .ai-chat-input-area { padding: 16px 20px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; }
      #ai-chat-input { flex: 1; background: #0f111a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 12px 18px; color: #fff; font-size: 14px; outline: none; transition: all 0.3s; }
      #ai-chat-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
      #ai-chat-send { background: linear-gradient(135deg, #6366f1, #a855f7); border: none; width: 44px; height: 44px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
      #ai-chat-send:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5); }
      
      .msg-bubble strong { color: #a855f7; font-weight: 700; }
      .msg-container.user .msg-bubble strong { color: #fff; }
      
      .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; }
      .typing-indicator span { width: 6px; height: 6px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
      .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
      .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      
      @media (max-width: 480px) {
        #ai-chat-window { width: 90%; right: 5%; bottom: 100px; height: 65vh; }
      }
    `;
    document.head.appendChild(style);
  },

  // ==========================================
  // EVENTOS E ENVIO DE MENSAGENS
  // ==========================================
  setupEvents() {
    const btn = document.getElementById("ai-chat-btn");
    const windowEl = document.getElementById("ai-chat-window");
    const closeBtn = document.getElementById("ai-chat-close");
    const sendBtn = document.getElementById("ai-chat-send");
    const input = document.getElementById("ai-chat-input");

    btn.addEventListener("click", () => {
      windowEl.classList.toggle("open");
      if (windowEl.classList.contains("open")) input.focus();
    });

    closeBtn.addEventListener("click", () => windowEl.classList.remove("open"));

    const handleSend = () => {
      const text = input.value.trim();
      if (!text) return;

      // Remove botões de sugestão antigos da tela quando o usuário digita
      document.querySelectorAll(".ai-suggestions").forEach((el) => el.remove());

      this.addMessage(text, "user");
      input.value = "";

      const body = document.getElementById("ai-chat-body");
      const typingDiv = document.createElement("div");
      typingDiv.className = `msg-container ai typing-box`;
      typingDiv.innerHTML = `<div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
      body.appendChild(typingDiv);
      body.scrollTop = body.scrollHeight;

      setTimeout(
        () => {
          typingDiv.remove();
          const responseObj = this.processInput(text);
          this.addMessage(
            this.formatMarkdown(responseObj.text),
            "ai",
            responseObj.suggestions,
          );
        },
        800 + Math.random() * 500,
      );
    };

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  },

  formatMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  },

  // Recebe text, sender, e um array de suggestions [opcional]
  addMessage(text, sender, suggestions = []) {
    const body = document.getElementById("ai-chat-body");
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg-container ${sender}`;
    msgDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;

    // Se a mensagem for da IA e houver sugestões, insere os Chips
    if (sender === "ai" && suggestions && suggestions.length > 0) {
      const suggWrapper = document.createElement("div");
      suggWrapper.className = "ai-suggestions";

      suggestions.forEach((sugText) => {
        const btn = document.createElement("button");
        btn.className = "ai-suggestion-btn";
        btn.innerText = sugText;
        btn.onclick = () => {
          // Quando clicar no chip, ele age como se o usuário digitasse e enviasse
          suggWrapper.remove(); // Some com os chips
          document.getElementById("ai-chat-input").value = sugText;
          document.getElementById("ai-chat-send").click();
        };
        suggWrapper.appendChild(btn);
      });
      msgDiv.appendChild(suggWrapper);
    }

    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  FinControlAI.init();
});
