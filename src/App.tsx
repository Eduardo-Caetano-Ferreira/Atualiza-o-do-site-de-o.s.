import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { OSGeral } from './components/OSGeral';
import { MudancaEndereco } from './components/MudancaEndereco';
import { MudancaComodo } from './components/MudancaComodo';
import { PontoAdicional } from './components/PontoAdicional';
import { 
  FilePlus, 
  Home, 
  PlusCircle, 
  MessageSquare,
  Clock
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('os-geral');
  const [operatorName, setOperatorName] = useState(() => {
    return localStorage.getItem('operatorName') || 'Eduardo';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Persist operator name to localStorage
  React.useEffect(() => {
    localStorage.setItem('operatorName', operatorName);
  }, [operatorName]);

  const renderContent = () => {
    switch (activeTab) {
      case 'os-geral':
        return <OSGeral operatorName={operatorName} />;
      case 'mudanca-endereco':
        return <MudancaEndereco operatorName={operatorName} />;
      case 'abertura':
        return <PlaceholderPage title="Abertura Atendimento" icon={<FilePlus className="w-12 h-12" />} />;
      case 'mudanca-comodo':
        return <MudancaComodo operatorName={operatorName} />;
      case 'ponto-adicional':
        return <PontoAdicional operatorName={operatorName} />;
      case 'feedback':
        return <PlaceholderPage title="Feedback" icon={<MessageSquare className="w-12 h-12" />} />;
      default:
        return <OSGeral operatorName={operatorName} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        operatorName={operatorName}
        setOperatorName={setOperatorName}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-bold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-red-600" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

function PlaceholderPage({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
      <div className="p-6 bg-slate-100 rounded-full text-slate-300">
        {icon}
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-sm">Esta página está em desenvolvimento.</p>
      </div>
    </div>
  );
}
