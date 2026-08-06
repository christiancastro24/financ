"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, Calendar, TrendingUp } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Gastos (Cartão/Pix)', path: '/gastos', icon: CreditCard },
    { name: 'Gastos (Mensais)', path: '/gastos-mensais', icon: Calendar },
    { name: 'Investimentos', path: '/investimentos', icon: TrendingUp },
  ];

  return (
    <aside className="w-[250px] bg-[#0b0f19] border-r border-[rgba(255,255,255,0.05)] flex flex-col px-4 py-6 fixed top-0 left-0 h-screen z-[100] transition-all duration-250">
      <div className="flex items-center gap-3 text-xl font-bold text-white mb-8 px-2">
        <div className="w-7 h-7 bg-[#6366f1] rounded-lg flex items-center justify-center text-sm">FC</div>
        FinControl
      </div>

      <div className="flex items-center gap-3 bg-[#181b2b] px-3 py-2 rounded-xl mb-6 cursor-pointer border border-transparent hover:border-[rgba(255,255,255,0.1)] transition-all">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 bg-[#6366f1] text-white">C</div>
        <select className="bg-transparent border-none text-white text-sm font-medium outline-none w-full cursor-pointer appearance-none">
          <option className="bg-[#131722] text-[#f8fafc]">Perfil Pessoal</option>
          <option className="bg-[#131722] text-[#f8fafc]">Tia</option>
        </select>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 p-3 rounded-[10px] transition-all text-sm font-medium ${
                isActive ? 'text-white bg-[#1e243b]' : 'text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[rgba(255,255,255,0.05)] pt-4 text-[11px] text-[#64748b] text-center">
        Projeto FinControl - 31 Dias
      </div>
    </aside>
  );
}
