import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  Settings, 
  History, 
  ShieldCheck, 
  ChevronDown, 
  Copy, 
  Trash2,
  CheckCircle2,
  Upload,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface Technician {
  name: string;
  region: string;
  city: string;
  obs?: string;
}

interface TechData {
  moto: Technician[];
  car: Technician[];
  routeStatus?: RouteStatus;
  vagasInfo?: VagasInfo;
}

interface RouteStatus {
  text: string;
  color: 'green' | 'yellow' | 'red';
}

interface VagasInfo {
  count: string;
  day: string;
  color: 'green' | 'yellow' | 'red';
}

interface FormData {
  data: string;
  periodo: string;
  roteador: string;
  onu: string;
  contato: string;
  clienteDesde: string;
  solicitacao: string;
  sinalStatus: string;
  historicoLogs: string;
  atendimentoRecente: string;
  tipoUltimaOs: string;
  dataUltimaOs: string;
  encerramentoUltimaOs: string;
  autorizacaoExcecao: string;
  nomeAutorizador: string;
  horarioEspecifico: string;
}

const initialFormState: FormData = {
  data: '',
  periodo: '',
  roteador: '',
  onu: '',
  contato: '',
  clienteDesde: '',
  solicitacao: '',
  sinalStatus: '',
  historicoLogs: '',
  atendimentoRecente: 'Não',
  tipoUltimaOs: '',
  dataUltimaOs: '',
  encerramentoUltimaOs: '',
  autorizacaoExcecao: 'Não',
  nomeAutorizador: '',
  horarioEspecifico: '',
};

const defaultTechData: TechData = {
  moto: [
    { name: "Clayton", region: "Todas as regioes", city: "Itanhaém e Mongaguá", obs: "Noturno" },
    { name: "Alexsandro", region: "Peruíbe (todas as regiões) - Itanhaém (Gaivotas até Belas Artes)", city: "Peruíbe e Itanhaém" },
    { name: "Lucas Rodrigues", region: "Centro até Loty (todos os bairros entre eles)", city: "Itanhaém" },
    { name: "Raphael dos Anjos", region: "Todas as regiões", city: "Mongaguá" },
    { name: "Bruno dos Santos", region: "Todas as regiões", city: "Praia Grande" },
  ],
  car: [
    { name: "Falar com a torre", region: "Todas as regiões", city: "Peruíbe" },
    { name: "Robson Borges", region: "Gaivotas até Belas Artes (todos os bairros entre eles)", city: "Itanhaém", obs: "Noturno" },
    { name: "Maxwell Lemos", region: "Centro até Loty (todos os bairros entre eles)", city: "Itanhaém", obs: "Noturno" },
    { name: "Marcos Vinicius", region: "Todas as regiões", city: "Mongaguá", obs: "Noturno" },
    { name: "Gabriel Felipe", region: "Todas as regiões", city: "Praia Grande", obs: "Noturno" },
  ],
  routeStatus: {
    text: 'Normal',
    color: 'green'
  },
  vagasInfo: {
    count: '0',
    day: '',
    color: 'green'
  }
};

interface OSGeralProps {
  operatorName: string;
}

export function OSGeral({ operatorName }: OSGeralProps) {
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [techData, setTechData] = useState<TechData>(defaultTechData);
  const [isLoadingTech, setIsLoadingTech] = useState(true);
  const [showTechnicians, setShowTechnicians] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [newStatusColor, setNewStatusColor] = useState<'green' | 'yellow' | 'red'>('green');

  // Sincronização em tempo real com o Firebase
  React.useEffect(() => {
    const techDoc = doc(db, 'settings', 'technicians');
    
    const unsubscribe = onSnapshot(techDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TechData;
        if (!data.routeStatus) {
          data.routeStatus = defaultTechData.routeStatus;
        }
        if (!data.vagasInfo) {
          data.vagasInfo = defaultTechData.vagasInfo;
        }
        setTechData(data);
      } else {
        setDoc(techDoc, defaultTechData);
      }
      setIsLoadingTech(false);
    }, (error) => {
      console.error("Erro ao sincronizar técnicos:", error);
      setIsLoadingTech(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors.includes(name)) {
      setErrors(prev => prev.filter(err => err !== name));
    }
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setFormData(initialFormState);
    setErrors([]);
    setShowClearConfirm(false);
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    if (!formData.data) newErrors.push('data');
    if (!formData.periodo) newErrors.push('periodo');
    if (!formData.roteador) newErrors.push('roteador');
    if (!formData.onu) newErrors.push('onu');
    if (!formData.contato) newErrors.push('contato');
    if (!formData.clienteDesde) newErrors.push('clienteDesde');
    if (!formData.solicitacao) newErrors.push('solicitacao');
    if (!formData.sinalStatus) newErrors.push('sinalStatus');

    if (formData.periodo === 'Após (Informar Horário)') {
      if (!formData.horarioEspecifico) newErrors.push('horarioEspecifico');
    }

    if (formData.atendimentoRecente === 'Sim') {
      if (!formData.tipoUltimaOs) newErrors.push('tipoUltimaOs');
      if (!formData.dataUltimaOs) newErrors.push('dataUltimaOs');
      if (!formData.encerramentoUltimaOs) newErrors.push('encerramentoUltimaOs');
    }

    if (formData.autorizacaoExcecao === 'Sim') {
      if (!formData.nomeAutorizador) newErrors.push('nomeAutorizador');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCopy = () => {
    if (!validateForm()) return;

    let periodoTexto = formData.periodo;
    if (formData.periodo === 'Após (Informar Horário)' && formData.horarioEspecifico) {
      periodoTexto += ` (${formData.horarioEspecifico})`;
    }

    let script = `
=== AGENDAMENTO ===
DATA: ${formData.data.split('-').reverse().join('/')}
PERÍODO: ${periodoTexto}

=== INFORMAÇÕES DO CLIENTE ===
Roteador: ${formData.roteador}
ONU: ${formData.onu}
Contato: ${formData.contato}
Cliente desde: ${formData.clienteDesde}

=== DETALHES DA SOLICITAÇÃO ===
${formData.solicitacao}

=== INFORMAÇÕES TÉCNICAS ===
Sinal/Status: ${formData.sinalStatus}
Histórico:
${formData.historicoLogs}

=== HISTÓRICO ===
Recente Suporte/OS: ${formData.atendimentoRecente}
`.trim();

    if (formData.atendimentoRecente === 'Sim') {
      script += `\nTipo: ${formData.tipoUltimaOs} | Data: ${formData.dataUltimaOs} | Encerramento: ${formData.encerramentoUltimaOs}`;
    }

    script += `\n\n=== ATENDIMENTO ===\nAtendente: ${operatorName}\nAutorização por Exceção: ${formData.autorizacaoExcecao}`;

    if (formData.autorizacaoExcecao === 'Sim') {
      script += `\nAutorizado por: ${formData.nomeAutorizador}`;
    }

    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Chave de API não configurada.");

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        Analise esta imagem de uma tabela de técnicos. 
        Extraia os dados dos técnicos de MOTO e CARRO.
        Retorne APENAS um JSON no seguinte formato:
        {
          "moto": [{"name": "string", "region": "string", "city": "string", "obs": "string"}],
          "car": [{"name": "string", "region": "string", "city": "string", "obs": "string"}]
        }
      `;

      const result = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: file.type, data: base64Data } }] }]
      });

      const text = result.text;
      if (!text) throw new Error("A IA não conseguiu ler os dados.");

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        const techDoc = doc(db, 'settings', 'technicians');
        await setDoc(techDoc, { ...parsedData, updatedAt: new Date().toISOString() });
        setShowConfig(false);
        setShowTechnicians(true);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar imagem.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const techDoc = doc(db, 'settings', 'technicians');
      await setDoc(techDoc, {
        ...techData,
        routeStatus: { text: newStatusText, color: newStatusColor }
      }, { merge: true });
      setShowStatusEdit(false);
    } catch (error) {
      console.error(error);
    }
  };

  const openStatusEdit = () => {
    setNewStatusText(techData.routeStatus?.text || '');
    setNewStatusColor(techData.routeStatus?.color || 'green');
    setShowStatusEdit(true);
  };

  const getStatusColorClass = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'yellow': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'red': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusDotClass = (color?: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };

  const getFieldClass = (fieldName: string, baseClass: string = "") => {
    const errorClass = errors.includes(fieldName) ? "border-red-500 ring-1 ring-red-500" : "border-slate-200 focus:ring-red-500 focus:border-red-500";
    return `${baseClass} w-full p-2 border rounded-lg outline-none transition-all ${errorClass}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Gerenciador de O.S. Geral</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowConfig(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Atualizar Técnicos
          </button>
          <button 
            onClick={() => setFormData(prev => ({ ...prev, data: new Date().toISOString().split('T')[0] }))}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Hoje
          </button>
        </div>
      </div>

      {/* Modal Config */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800">Atualizar Técnicos com IA</h2>
                <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-8">
                <label className="relative group cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isProcessing} />
                  <div className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 transition-all ${isProcessing ? 'bg-slate-50 border-slate-200' : 'border-red-200 bg-red-50/30 group-hover:bg-red-50 group-hover:border-red-400'}`}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
                        <p className="text-sm font-medium text-slate-600 animate-pulse">Processando...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8" /></div>
                        <div className="text-center">
                          <p className="font-bold text-slate-700">Clique ou arraste a imagem</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Técnicos Accordion */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowTechnicians(!showTechnicians)} className="w-full px-6 py-4 flex items-center justify-between text-red-600 font-semibold hover:bg-red-50 transition-colors">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm uppercase tracking-wider">Técnicos da região</span>
            {isLoadingTech ? <Loader2 className="w-3 h-3 animate-spin text-slate-400" /> : (
              <>
                {techData !== defaultTechData && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Sincronizado</span>}
                {techData.routeStatus && (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusColorClass(techData.routeStatus.color)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(techData.routeStatus.color)}`} />
                      Status: {techData.routeStatus.text}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openStatusEdit(); }} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"><Settings className="w-3 h-3" /></button>
                  </div>
                )}
              </>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform ${showTechnicians ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showTechnicians && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 border-t border-red-50 overflow-x-auto">
              <div className="space-y-6 pt-4 min-w-[600px]">
                {['moto', 'car'].map(type => (
                  <div key={type} className="rounded-lg border border-slate-200 overflow-hidden">
                    <div className="bg-red-600 text-white py-2 px-4 text-center font-bold uppercase tracking-widest text-sm">Técnicos de {type === 'moto' ? 'Moto' : 'Carro'}</div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <th className="p-3 border-r border-slate-200 w-1/4">Técnico</th>
                          <th className="p-3 border-r border-slate-200 w-1/3">Região</th>
                          <th className="p-3 border-r border-slate-200 w-1/4">Cidade</th>
                          <th className="p-3">Obs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {techData[type as 'moto' | 'car'].map((tech, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">{tech.name}</td>
                            <td className="p-3 border-r border-slate-100 text-slate-600">{tech.region}</td>
                            <td className="p-3 border-r border-slate-100 text-slate-600">{tech.city}</td>
                            <td className="p-3 text-slate-600 font-medium">{tech.obs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card icon={<Calendar className="w-4 h-4" />} title="Agendamento">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input type="date" name="data" value={formData.data} onChange={handleInputChange} className={getFieldClass('data')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Período</label>
              <select name="periodo" value={formData.periodo} onChange={handleInputChange} className={getFieldClass('periodo', 'bg-white')}>
                <option value="">Selecione...</option>
                <option value="Horário Comercial">Horário Comercial</option>
                <option value="Primeira do dia">Primeira do dia</option>
                <option value="Manhã (9 às 12h30)">Manhã (9 às 12h30)</option>
                <option value="Tarde (13 às 17h30)">Tarde (13 às 17h30)</option>
                <option value="Última do dia">Última do dia</option>
                <option value="Após (Informar Horário)">Após (Informar Horário)</option>
              </select>
            </div>
            {formData.periodo === 'Após (Informar Horário)' && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Horário Específico</label>
                <input type="text" name="horarioEspecifico" placeholder="Ex: 16:30" value={formData.horarioEspecifico} onChange={handleInputChange} className={getFieldClass('horarioEspecifico')} />
              </div>
            )}
          </div>
        </Card>

        <Card icon={<User className="w-4 h-4" />} title="Informações do Cliente" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['roteador', 'onu'].map(field => (
              <div key={field}>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">{field}</label>
                <select name={field} value={formData[field as keyof FormData]} onChange={handleInputChange} className={getFieldClass(field, 'bg-white')}>
                  <option value="">Selecione...</option>
                  <option value="Comodato">Comodato</option>
                  <option value="Compra">Compra</option>
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contato</label>
              <input type="text" name="contato" value={formData.contato} onChange={handleInputChange} className={getFieldClass('contato')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cliente desde</label>
              <input type="text" name="clienteDesde" value={formData.clienteDesde} onChange={handleInputChange} className={getFieldClass('clienteDesde')} />
            </div>
          </div>
        </Card>

        <Card icon={<FileText className="w-4 h-4" />} title="Detalhes da O.S.">
          <textarea name="solicitacao" rows={4} value={formData.solicitacao} onChange={handleInputChange} className={getFieldClass('solicitacao', 'p-3 resize-none')} />
        </Card>

        <Card icon={<Settings className="w-4 h-4" />} title="Informações Técnicas">
          <div className="space-y-4">
            <input type="text" name="sinalStatus" placeholder="Sinal/Status" value={formData.sinalStatus} onChange={handleInputChange} className={getFieldClass('sinalStatus')} />
            <textarea name="historicoLogs" rows={2} placeholder="Logs..." value={formData.historicoLogs} onChange={handleInputChange} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none" />
          </div>
        </Card>

        <Card icon={<History className="w-4 h-4" />} title="Última O.S.">
          <div className="space-y-4">
            <div className="flex gap-6">
              {['Sim', 'Não'].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="atendimentoRecente" value={opt} checked={formData.atendimentoRecente === opt} onChange={handleInputChange} className="w-4 h-4 text-red-600" />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            {formData.atendimentoRecente === 'Sim' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">Tipo</label>
                  <input type="text" name="tipoUltimaOs" placeholder="Ex: Reparo" value={formData.tipoUltimaOs} onChange={handleInputChange} className={getFieldClass('tipoUltimaOs', 'text-sm')} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">Data</label>
                  <input type="text" name="dataUltimaOs" placeholder="Ex: 20/03" value={formData.dataUltimaOs} onChange={handleInputChange} className={getFieldClass('dataUltimaOs', 'text-sm')} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">Encerramento</label>
                  <input type="text" name="encerramentoUltimaOs" placeholder="Ex: OK" value={formData.encerramentoUltimaOs} onChange={handleInputChange} className={getFieldClass('encerramentoUltimaOs', 'text-sm')} />
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card icon={<ShieldCheck className="w-4 h-4" />} title="Atendente & Autorização" className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-slate-500 mb-1">Operador (Definido no Menu)</label>
              <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold">
                {operatorName}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-slate-500 mb-3">Autorização por Exceção?</label>
              <div className="flex gap-6">
                {['Sim', 'Não'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="autorizacaoExcecao" value={opt} checked={formData.autorizacaoExcecao === opt} onChange={handleInputChange} className="w-4 h-4 text-red-600" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              {formData.autorizacaoExcecao === 'Sim' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                  <label className="block text-[11px] font-bold text-red-600 mb-1 uppercase tracking-tight">Nome de quem autorizou</label>
                  <input 
                    type="text" 
                    name="nomeAutorizador"
                    value={formData.nomeAutorizador}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-red-200 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="Nome do autorizador"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button onClick={handleCopy} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${copied ? 'bg-emerald-500' : 'bg-red-600 hover:bg-red-700'}`}>
          {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copiado!' : 'Copiar Script'}
        </button>
        <button onClick={handleClear} className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all border border-slate-200"><Trash2 className="w-5 h-5" />Limpar</button>
      </div>

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold text-slate-800">Status da Rota</h2><button onClick={() => setShowStatusEdit(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <input type="text" value={newStatusText} onChange={(e) => setNewStatusText(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" />
                <div className="flex gap-3">
                  {['green', 'yellow', 'red'].map(c => (
                    <button key={c} onClick={() => setNewStatusColor(c as any)} className={`flex-1 py-2 rounded-lg border-2 ${newStatusColor === c ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}>{c}</button>
                  ))}
                </div>
                <button onClick={handleUpdateStatus} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Limpar Campos?</h3>
              <div className="flex gap-3">
                <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                <button onClick={confirmClear} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold">Sim, Limpar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ icon, title, children, className = "" }: { icon: React.ReactNode, title: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border-t-4 border-t-red-600 shadow-sm border-x border-b border-slate-100 overflow-hidden flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
        <span className="text-red-600">{icon}</span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">{title}</h3>
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  );
}
