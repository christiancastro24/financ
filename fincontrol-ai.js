/**
 * FinControl AI - Assistente Virtual ROBUSTO
 * Motor NLP Local baseado em Padrões e Regex
 */

const FinControlAI = {
  activeProfile: "personal",
  annualRate: 0.12, // 12% ao ano para projeções padrão

  init() {
    this.activeProfile = localStorage.getItem("activeProfile") || "personal";
    this.injectStyles();
    this.injectHTML();
    this.setupEvents();
    this.addMessage(
      "Olá! Sou o **FinControl AI** 🧠.\n\nPosso analisar seus dados ou te ensinar sobre finanças. Experimente perguntar:\n\n• *Qual meu maior gasto?*\n• *O que é a regra 50/30/20?*\n• *Como funciona a Selic?*\n• *Me dê um resumo do mês.*",
      "ai",
    );
  },

  // ==========================================
  // ACESSO AOS DADOS LOCAIS
  // ==========================================
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
  // BIBLIOTECA DE INTENÇÕES (KNOWLEDGE BASE)
  // ==========================================
  getIntents() {
    const data = this.getData();
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const gastosMensais = data.expenses.filter((e) =>
      e.date.startsWith(monthStr),
    );

    return [
      // ----------------------------------------
      // 1. ANÁLISE DE DADOS DO USUÁRIO
      // ----------------------------------------
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
          return `📊 **Resumo de ${now.toLocaleDateString("pt-BR", { month: "long" })}:**\n\n**Caixa do Mês:** ${this.formatMoney(entradas - saidas)}\n(Entrou: ${this.formatMoney(entradas)} | Saiu: ${this.formatMoney(saidas)})\n\n**Patrimônio Investido:** ${this.formatMoney(invTotal)}\n**Metas Ativas:** ${data.goals.length}\n**Tarefas Pendentes:** ${data.todos.filter((t) => !t.done).length}`;
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
            return "Você ainda não registrou nenhum gasto!";
          const max = saidas.reduce((prev, current) =>
            prev.value > current.value ? prev : current,
          );
          return `🚨 O seu maior gasto registrado foi **${max.name}**, no valor de **${this.formatMoney(max.value)}** (Categoria: ${max.category}). Pegue leve!`;
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
            return "Não consegui identificar a categoria. Tente perguntar: 'Quanto gastei em alimentação?'";

          const catReal = categoriasMap[found];
          const total = data.expenses
            .filter(
              (e) => e.category === catReal && (e.type === "saida" || !e.type),
            )
            .reduce((sum, e) => sum + e.value, 0);
          return `💸 Você gastou um total de **${this.formatMoney(total)}** com **${catReal}**.`;
        },
      },
      {
        patterns: ["tarefa", "pendente", "para fazer", "to do", "todo"],
        handler: () => {
          const pendentes = data.todos.filter((t) => !t.done);
          if (pendentes.length === 0)
            return "Tudo limpo! Nenhuma tarefa pendente no momento. ✨";
          let msg = `Você tem **${pendentes.length} tarefas pendentes**:\n`;
          pendentes.slice(0, 4).forEach((t) => (msg += `\n• ${t.text}`));
          if (pendentes.length > 4)
            msg += `\n\n...e mais ${pendentes.length - 4} outras.`;
          return msg;
        },
      },
      {
        patterns: ["meta", "objetivo", "sonho", "progresso"],
        handler: () => {
          if (data.goals.length === 0)
            return "Você não possui metas ativas. Crie uma na aba de Investimentos! 🎯";
          const mainGoal = data.goals[0];
          const invTotal = data.investments.reduce(
            (sum, inv) => sum + inv.value,
            0,
          );
          const progress = Math.min((invTotal / mainGoal.target) * 100, 100);
          return `Sua meta principal é **${mainGoal.name}** (${this.formatMoney(mainGoal.target)}).\n\nVocê já alcançou **${progress.toFixed(1)}%**! O valor acumulado da sua carteira é de ${this.formatMoney(invTotal)}.`;
        },
      },
      {
        // Simulador Complexo: "Se eu investir 500 ate 2030"
        patterns: ["investir", "juntar", "simular", "projecao", "projetar"],
        handler: (input, rawInput) => {
          const valMatch = rawInput.match(
            /(?:R\$)?\s*(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)/,
          );
          const yearMatch = rawInput.match(/(20\d{2})/);
          if (!valMatch || !yearMatch)
            return "Para projetar, eu preciso do valor e do ano. Exemplo: 'Quanto terei se investir 500 até 2030?'";

          const aporte = parseFloat(
            valMatch[1].replace(/\./g, "").replace(",", "."),
          );
          const anoAlvo = parseInt(yearMatch[1]);
          const anoAtual = new Date().getFullYear();
          if (anoAlvo <= anoAtual) return "O ano precisa estar no futuro! ⏳";

          const meses = (anoAlvo - anoAtual) * 12;
          const taxaMensal = Math.pow(1 + this.annualRate, 1 / 12) - 1;
          const totalAtual = data.investments.reduce(
            (sum, inv) => sum + inv.value,
            0,
          );

          const vfTotal =
            totalAtual * Math.pow(1 + taxaMensal, meses) +
            aporte * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal);

          return `📈 **Projeção para ${anoAlvo}:**\n\nPatrimônio atual: ${this.formatMoney(totalAtual)}\nAporte mensal: ${this.formatMoney(aporte)}\nRentabilidade projetada: 12% a.a.\n\n🎯 **Valor Final Estimado:** **${this.formatMoney(vfTotal)}**!`;
        },
      },

      // ----------------------------------------
      // 2. EDUCAÇÃO FINANCEIRA (A ROBUSTEZ)
      // ----------------------------------------
      {
        patterns: ["reserva de emergencia", "reserva de emergência"],
        handler: () =>
          "🛡️ **Reserva de Emergência:**\nÉ um dinheiro guardado para imprevistos (desemprego, saúde). O ideal é que seja de **6 a 12 meses** do seu custo de vida mensal.\n\n*Exemplo:* Se você gasta R$ 2.000/mês, sua reserva deve ser entre R$ 12.000 e R$ 24.000. Deve ser investida em locais seguros e com liquidez diária (CDB de liquidez diária, Tesouro Selic).",
      },
      {
        patterns: [
          "regra 50 30 20",
          "regra 50/30/20",
          "503020",
          "dividir salario",
          "dividir dinheiro",
        ],
        handler: () =>
          "📊 **A Regra 50/30/20:**\nÉ um método excelente de orçamento. Consiste em dividir sua renda líquida em três blocos:\n\n• **50% Gastos Essenciais:** Aluguel, contas de luz, mercado, saúde.\n• **30% Estilo de Vida:** Lazer, restaurantes, hobbies, compras não essenciais.\n• **20% Futuro:** Investimentos, quitação de dívidas e Reserva de Emergência.",
      },
      {
        patterns: ["o que e selic", "taxa selic", "selic"],
        handler: () =>
          "🏦 **Taxa Selic:**\nÉ a taxa básica de juros da economia brasileira. Ela serve de referência para todas as outras taxas (empréstimos, financiamentos e investimentos de Renda Fixa).\n\nQuando a Selic sobe, a Renda Fixa rende mais, mas pegar dinheiro emprestado fica mais caro. Quando cai, o crédito fica barato e a Bolsa de Valores (Renda Variável) costuma se beneficiar.",
      },
      {
        patterns: ["o que e cdb", "cdb"],
        handler: () =>
          "📄 **CDB (Certificado de Depósito Bancário):**\nVocê empresta dinheiro para um banco e ele te devolve com juros.\n\nEles geralmente rendem uma porcentagem do CDI (que acompanha a Selic). Um CDB de '100% do CDI com Liquidez Diária' é um dos investimentos mais populares e seguros para montar sua Reserva de Emergência.",
      },
      {
        patterns: ["inflacao", "ipca", "inflação"],
        handler: () =>
          "💸 **Inflação (IPCA):**\nÉ o aumento generalizado dos preços ao longo do tempo. Sabe quando 100 Reais compravam um carrinho cheio no mercado anos atrás e hoje compram duas sacolas? Isso é a inflação corroendo seu poder de compra.\n\nPor isso é vital **investir**: seu dinheiro precisa render *acima* da inflação para gerar ganho real.",
      },
      {
        patterns: ["juros compostos", "magia dos juros"],
        handler: () =>
          "❄️ **Juros Compostos (O Efeito Bola de Neve):**\nÉ quando os juros de um mês rendem sobre os juros do mês anterior, e não apenas sobre o valor inicial.\n\nNo começo, parece pouco, mas ao longo dos anos a curva sobe exponencialmente. É por isso que no mundo dos investimentos, o **Tempo** é o seu maior aliado. Quanto mais cedo começar, menos esforço terá que fazer no futuro.",
      },
      {
        patterns: ["acoes", "bolsa de valores", "renda variavel", "ações"],
        handler: () =>
          "🏢 **Ações e Renda Variável:**\nComprar uma ação significa comprar um 'pedacinho' de uma empresa listada na Bolsa de Valores. Se a empresa lucra e cresce, o valor do seu pedaço sobe e você também pode receber parte dos lucros (Dividendos).\n\nMas cuidado: os preços variam (sobem e descem) diariamente conforme o mercado. É um investimento para o **longo prazo**.",
      },
      {
        patterns: [
          "fii",
          "fundos imobiliarios",
          "fundo imobiliario",
          "aluguel",
        ],
        handler: () =>
          "🏢 **FIIs (Fundos de Investimento Imobiliário):**\nÉ como investir em imóveis (shoppings, galpões, prédios comerciais) junto com várias outras pessoas, sem precisar comprar um imóvel inteiro. A grande vantagem é que você recebe 'aluguéis' (dividendos) mensais proporcionais à quantidade de cotas que você possui. São isentos de Imposto de Renda para pessoa física.",
      },
      {
        patterns: ["divida", "dividas", "endividado", "nome sujo", "dívida"],
        handler: () =>
          "🚨 **Como sair das dívidas?**\n1. **Mapeie tudo:** Liste pra quem você deve, o valor e a taxa de juros.\n2. **Ataque os juros altos:** Foque em pagar primeiro as dívidas que crescem mais rápido (Cartão de Crédito e Cheque Especial).\n3. **Negocie:** Ligue para os credores ou use os feirões do Serasa para pedir descontos à vista.\n4. **Estanque o sangramento:** Pare de criar novas dívidas enquanto quita as antigas.",
      },
      {
        patterns: ["diversificar", "diversificacao", "risco"],
        handler: () =>
          "🥚 **Diversificação:**\nA regra de ouro é: *'Não coloque todos os ovos na mesma cesta'*.\n\nSe você investe tudo na Empresa X e ela faliu, você perde tudo. Se você investe em Renda Fixa, FIIs, Ações e Moeda Estrangeira, se um setor for mal, os outros seguram as pontas e garantem a saúde do seu patrimônio.",
      },

      // ----------------------------------------
      // 3. SAUDAÇÕES E FALLBACKS
      // ----------------------------------------
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
        handler: () =>
          "Olá! 👋 Estou aqui para ajudar com seus números, fazer projeções e tirar dúvidas financeiras. O que manda hoje?",
      },
      {
        patterns: [
          "quem e voce",
          "o que voce faz",
          "o que e voce",
          "inteligencia",
        ],
        handler: () =>
          "Eu sou o **FinControl AI** 🤖.\n\nFui projetado para ser seu braço direito. Como os seus dados financeiros ficam salvos direto no seu navegador (com total privacidade), eu consigo ler esses números e te entregar relatórios, buscar seus maiores gastos ou calcular quanto dinheiro você terá no futuro!",
      },
      {
        patterns: ["te amo", "obrigado", "valeu", "show", "top", "legal"],
        handler: () =>
          "Tamo junto! 🚀 O seu foco no futuro financeiro é o que me motiva. Mande a próxima dúvida quando quiser!",
      },
    ];
  },

  // ==========================================
  // PROCESSADOR CENTRAL
  // ==========================================
  processInput(rawInput) {
    const inputClean = this.removeAccents(rawInput);
    const intents = this.getIntents();

    // Varre todas as intenções buscando match
    for (const intent of intents) {
      if (intent.patterns.some((pattern) => inputClean.includes(pattern))) {
        return intent.handler(inputClean, rawInput);
      }
    }

    // Fallback se não encontrar nada
    return "Hum, não captei a ideia. 🤔\n\nTente algo mais específico, como:\n\n• *O que é CDB?*\n• *Qual meu saldo?*\n• *Gastei quanto com saúde?*\n• *Quanto terei se investir R$ 1000 até 2035?*";
  },

  // ==========================================
  // INTERFACE DO USUÁRIO (UI) - KANBAN/GLASSMORPHISM STYLE
  // ==========================================
  injectHTML() {
    if (document.getElementById("ai-chat-btn")) return; // Previne duplicidade

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
      
      .ai-chat-input-area { padding: 16px 20px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; }
      #ai-chat-input { flex: 1; background: #0f111a; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 12px 18px; color: #fff; font-size: 14px; outline: none; transition: all 0.3s; }
      #ai-chat-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }
      #ai-chat-send { background: linear-gradient(135deg, #6366f1, #a855f7); border: none; width: 44px; height: 44px; border-radius: 50%; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
      #ai-chat-send:hover { transform: scale(1.1); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5); }
      
      /* Estilização do texto Markdown na Bolha */
      .msg-bubble strong { color: #a855f7; font-weight: 700; }
      .msg-container.user .msg-bubble strong { color: #fff; } /* Override for user msg */
      
      .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; }
      .typing-indicator span { width: 6px; height: 6px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite ease-in-out both; }
      .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
      .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      
      @media (max-width: 480px) {
        #ai-chat-window { width: 90%; right: 5%; bottom: 100px; height: 60vh; }
      }
    `;
    document.head.appendChild(style);
  },

  // ==========================================
  // LÓGICA DE EVENTOS DA UI
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

      this.addMessage(text, "user");
      input.value = "";

      // Indicador de "Digitando..."
      const body = document.getElementById("ai-chat-body");
      const typingDiv = document.createElement("div");
      typingDiv.className = `msg-container ai typing-box`;
      typingDiv.innerHTML = `<div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
      body.appendChild(typingDiv);
      body.scrollTop = body.scrollHeight;

      // Simula o tempo de raciocínio da IA
      setTimeout(
        () => {
          typingDiv.remove(); // Remove o digitando
          const resposta = this.processInput(text);
          this.addMessage(this.formatMarkdown(resposta), "ai");
        },
        800 + Math.random() * 600,
      ); // Entre 0.8s e 1.4s
    };

    sendBtn.addEventListener("click", handleSend);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  },

  formatMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  },

  addMessage(text, sender) {
    const body = document.getElementById("ai-chat-body");
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg-container ${sender}`;
    msgDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;
    body.appendChild(msgDiv);
    body.scrollTop = body.scrollHeight;
  },
};

// Inicia automaticamente quando a página carrega
document.addEventListener("DOMContentLoaded", () => {
  FinControlAI.init();
});
