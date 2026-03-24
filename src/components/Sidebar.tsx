import React from 'react';
import { 
  FilePlus, 
  ClipboardList, 
  MapPin, 
  Home, 
  PlusCircle, 
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Menu,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  operatorName: string;
  setOperatorName: (name: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'abertura', label: 'Abertura Atendimento', icon: FilePlus },
  { id: 'os-geral', label: 'O.S Geral', icon: ClipboardList },
  { id: 'mudanca-endereco', label: 'Mudança Endereço', icon: MapPin },
  { id: 'mudanca-comodo', label: 'Mudança Cômodo', icon: Home },
  { id: 'ponto-adicional', label: 'Ponto Adicional', icon: PlusCircle },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  operatorName, 
  setOperatorName,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#1e293b] text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-40`}>
      <div className={`p-6 flex items-center justify-between border-b border-slate-700/50 ${isCollapsed ? 'px-4' : ''}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="font-bold text-white tracking-tight">ServiceDesk</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all group ${
                isActive 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2 py-2'}`}>
          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {operatorName.substring(0, 2).toUpperCase() || <User className="w-4 h-4" />}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0 group/op">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 p-0 w-full placeholder:text-slate-600 cursor-text hover:bg-slate-800/50 rounded px-1 -ml-1 transition-colors"
                  placeholder="Nome do Operador"
                />
                <User className="w-3 h-3 text-slate-500 absolute right-0 opacity-0 group-hover/op:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase">Operador (Clique para editar)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
