"use client";
import { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [taskText, setTaskText] = useState('');
  
  return (
    <div className="flex flex-col gap-6">
      {/* Formulário de Tarefa */}
      <div className="bg-gradient-to-br from-[#1e243b99] to-[#0f111ae6] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="text-base font-semibold text-[#cbd5e1] mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nova Tarefa
        </div>
        <form className="flex gap-3 flex-wrap">
          <input
            type="text"
            className="flex-[2] min-w-[200px] px-4 py-3 bg-[#1a1d2d] border border-[rgba(255,255,255,0.05)] rounded-xl text-white text-sm outline-none focus:border-[#6366f1] transition-all"
            placeholder="O que precisa ser feito?"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
          />
          <select className="flex-1 min-w-[140px] px-4 py-3 bg-[#1a1d2d] border border-[rgba(255,255,255,0.05)] rounded-xl text-white text-sm outline-none focus:border-[#6366f1] transition-all">
            <option>Hoje</option>
            <option>Amanhã</option>
          </select>
          <select className="flex-1 min-w-[140px] px-4 py-3 bg-[#1a1d2d] border border-[rgba(255,255,255,0.05)] rounded-xl text-white text-sm outline-none focus:border-[#6366f1] transition-all">
            <option value="estudos">📚 Estudos</option>
            <option value="exercicios">💪 Exercícios</option>
            <option value="saude">❤️ Saúde</option>
            <option value="trabalho">💼 Trabalho</option>
            <option value="pessoal">🧘 Pessoal</option>
            <option value="casa">🏠 Casa</option>
            <option value="financas">💰 Finanças</option>
            <option value="outros">📌 Outros</option>
          </select>
          <button type="button" className="bg-[#6366f1] hover:bg-[#4f46e5] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2">
            Adicionar
          </button>
        </form>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-3 p-4 bg-gradient-to-br from-[#1e243b99] to-[#0f111ae6] border border-[rgba(255,255,255,0.05)] rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#cbd5e1] font-medium">Gerenciar:</span>
          <button className="flex items-center gap-2 bg-transparent border border-[rgba(255,255,255,0.05)] text-[#cbd5e1] hover:bg-[rgba(255,255,255,0.05)] hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            <Trash2 className="w-4 h-4" /> Limpar Dia
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#cbd5e1] font-medium">Filtrar:</span>
          <select className="px-3 py-1.5 bg-[#1a1d2d] border border-[rgba(255,255,255,0.05)] rounded-lg text-white text-[13px] outline-none focus:border-[#6366f1] transition-all">
            <option value="all">Todas Categorias</option>
          </select>
          <button className="flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            <CheckCircle2 className="w-4 h-4" /> Marcar/Desmarcar Hoje
          </button>
          <span className="text-[13px] px-3 py-1 bg-[rgba(99,102,241,0.1)] text-[#6366f1] font-medium rounded-full">
            0 pendentes
          </span>
        </div>
      </div>

      {/* Kanban Board (Placeholder) */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {[1, 2, 3, 4, 5, 6].map((day) => (
          <div key={day} className="flex-none w-[280px] bg-[#131722] border border-[rgba(255,255,255,0.05)] rounded-2xl p-4 min-h-[350px] flex flex-col snap-start">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[rgba(255,255,255,0.05)]">
              <h3 className="text-[13px] font-semibold text-white">Dia {day}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[#64748b]">0</span>
            </div>
            <div className="flex-1 text-center text-[#64748b] text-[11px] py-4">
              Sem tarefas
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
