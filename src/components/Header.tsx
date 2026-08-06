"use client";
import { Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [dateStr, setDateStr] = useState('');
  const pathname = usePathname();

  const getTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/gastos': return 'Gastos (Cartão/Pix)';
      case '/gastos-mensais': return 'Gastos (Mensais)';
      case '/investimentos': return 'Investimentos';
      default: return 'Dashboard';
    }
  };

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    setDateStr(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  return (
    <header className="fixed top-0 left-[250px] right-0 h-[70px] bg-[rgba(11,15,25,0.9)] backdrop-blur-md border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between px-10 z-[99]">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-[#f8fafc]">{getTitle()}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-[13px] text-[#cbd5e1] font-medium">{dateStr}</div>
        <button className="w-9 h-9 rounded-full bg-[#1a1d2d] border border-[rgba(255,255,255,0.05)] text-[#cbd5e1] flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f8fafc] transition-all">
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
