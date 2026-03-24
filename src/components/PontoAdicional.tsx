import React, { useState } from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Trash2,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  PlusCircle,
  Settings,
  ChevronDown,
  Upload,
  Loader2,
  X,
  History,
  ClipboardList
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

interface VagasInfo {
  count: string;
  day: string;
  color: 'green' | 'yellow' | 'red';
}

interface TechData {
  moto: Technician[];
  car: Technician[];
  vagasInfo?: VagasInfo;
}

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
  vagasInfo: {
    count: '0',
    day: '',
    color: 'green'
  }
};

interface PontoAdicionalFormData {
  dataAgendamento: string;
  periodo: string;
  horarioEspecifico: string;
  solicitacao: string;
  contato: string;
  planoAtual: string;
  clienteDesde: string;
  roteadorPrincipal: string;
  onu: string;
  upgradeRealizado: string;
  necessarioRoteador: string;
  tipoRoteador: string;
  geradoCusto: string;
  cienteCusto: string;
  valorCusto: string;
  cobrarPorMetro: boolean;
  vencimentoCusto: string;
  motivoIsencao: string;
  motivoIsencaoOutro: string;
  avaliacaoTecnica: string;
  baixaAvaliacao: string;
  autorizacaoExcecao: string;
  nomeAutorizador: string;
}

const initialFormState: PontoAdicionalFormData = {
  dataAgendamento: '',
  periodo: '',
  horarioEspecifico: '',
  solicitacao: '',
  contato: '',
  planoAtual: '',
  clienteDesde: '',
  roteadorPrincipal: '',
  onu: '',
  upgradeRealizado: 'Não',
  necessarioRoteador: 'Não',
  tipoRoteador: '',
  geradoCusto: 'Não',
  cienteCusto: 'Não',
  valorCusto: '',
  cobrarPorMetro: false,
  vencimentoCusto: '',
  motivoIsencao: '',
  motivoIsencaoOutro: '',
  avaliacaoTecnica: 'Não',
  baixaAvaliacao: '',
  autorizacaoExcecao: 'Não',
  nomeAutorizador: '',
};

interface PontoAdicionalProps {
  operatorName: string;
}

export function PontoAdicional({ operatorName }: PontoAdicionalProps) {
  const [formData, setFormData] = useState<PontoAdicionalFormData>(initialFormState);
  const [techData, setTechData] = useState<TechData>(defaultTechData);
  const [isLoadingTech, setIsLoadingTech] = useState(true);
  const [showTechnicians, setShowTechnicians] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showVagasEdit, setShowVagasEdit] = useState(false);
  const [newVagasCount, setNewVagasCount] = useState('');
  const [newVagasDay, setNewVagasDay] = useState('');
  const [newVagasColor, setNewVagasColor] = useState<'green' | 'yellow' | 'red'>('green');

  // Sincronização em tempo real com o Firebase
  React.useEffect(() => {
    const techDoc = doc(db, 'settings', 'technicians');
    
    const unsubscribe = onSnapshot(techDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TechData;
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
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors.includes(name)) {
      setErrors(prev => prev.filter(err => err !== name));
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    const requiredFields = [
      'dataAgendamento', 'periodo', 'solicitacao', 'contato', 
      'planoAtual', 'clienteDesde', 'roteadorPrincipal', 'onu'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field as keyof PontoAdicionalFormData]) {
        newErrors.push(field);
      }
    });

    if (formData.periodo === 'Após (Informar Horário)' && !formData.horarioEspecifico) {
      newErrors.push('horarioEspecifico');
    }

    if (formData.geradoCusto === 'Não') {
      if (!formData.motivoIsencao) newErrors.push('motivoIsencao');
      if (formData.motivoIsencao === 'Outro' && !formData.motivoIsencaoOutro) newErrors.push('motivoIsencaoOutro');
    } else {
      if (!formData.valorCusto) newErrors.push('valorCusto');
      if (!formData.vencimentoCusto) newErrors.push('vencimentoCusto');
    }

    if (formData.necessarioRoteador === 'Sim' && !formData.tipoRoteador) {
      newErrors.push('tipoRoteador');
    }

    if (formData.avaliacaoTecnica === 'Sim' && !formData.baixaAvaliacao) {
      newErrors.push('baixaAvaliacao');
    }

    if (formData.autorizacaoExcecao === 'Sim' && !formData.nomeAutorizador) {
      newErrors.push('nomeAutorizador');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCopy = () => {
    if (!validateForm()) return;

    const script = `
=== AGENDAMENTO ===
DATA: ${formData.dataAgendamento.split('-').reverse().join('/')}
PERÍODO: ${formData.periodo}${formData.periodo === 'Após (Informar Horário)' ? ` (${formData.horarioEspecifico})` : ''}
Vagas Preenchidas: ${techData.vagasInfo?.count || '0'} - ${techData.vagasInfo?.day || ''}

=== INFORMAÇÕES DO CLIENTE ===
Plano Atual: ${formData.planoAtual}
Roteador Principal: ${formData.roteadorPrincipal}
ONU: ${formData.onu}
Contato: ${formData.contato}
Cliente desde: ${formData.clienteDesde}

=== DETALHES DA SOLICITAÇÃO ===
${formData.solicitacao}

=== INFORMAÇÕES DA O.S. ===
Upgrade Realizado? ${formData.upgradeRealizado}
Será necessário roteador? ${formData.necessarioRoteador}${formData.necessarioRoteador === 'Sim' ? `\nTipo do Roteador: ${formData.tipoRoteador}` : ''}
Gerado Custo? ${formData.geradoCusto}${formData.geradoCusto === 'Não' ? `\nMotivo da Isenção: ${formData.motivoIsencao === 'Outro' ? formData.motivoIsencaoOutro : formData.motivoIsencao}` : `\nCiente do Custo: ${formData.cienteCusto}\nValor: R$ ${formData.valorCusto}${formData.cobrarPorMetro ? ' (por metro)' : ''}\nVencimento: ${formData.vencimentoCusto.split('-').reverse().join('/')}`}

=== AVALIAÇÃO ===
Já foi feita avaliação técnica? ${formData.avaliacaoTecnica}${formData.avaliacaoTecnica === 'Sim' ? `\nBaixa da Avaliação: ${formData.baixaAvaliacao}` : ''}

=== ATENDIMENTO ===
Operador: ${operatorName}
Autorização por Exceção: ${formData.autorizacaoExcecao}${formData.autorizacaoExcecao === 'Sim' ? `\nAutorizado por: ${formData.nomeAutorizador}` : ''}
`.trim();

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
        await setDoc(techDoc, { ...parsedData, updatedAt: new Date().toISOString() }, { merge: true });
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

  const handleUpdateVagas = async () => {
    try {
      const techDoc = doc(db, 'settings', 'technicians');
      await setDoc(techDoc, {
        ...techData,
        vagasInfo: { count: newVagasCount, day: newVagasDay, color: newVagasColor }
      }, { merge: true });
      setShowVagasEdit(false);
    } catch (error) {
      console.error(error);
    }
  };

  const openVagasEdit = () => {
    setNewVagasCount(techData.vagasInfo?.count || '0');
    setNewVagasDay(techData.vagasInfo?.day || '');
    setNewVagasColor(techData.vagasInfo?.color || 'green');
    setShowVagasEdit(true);
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
    const hasError = errors.includes(fieldName);
    return `${baseClass} w-full p-2 border rounded-lg outline-none transition-all ${
      hasError 
        ? "border-red-500 ring-1 ring-red-500" 
        : "border-slate-200 focus:ring-red-500 focus:border-red-500"
    }`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">O.S. Ponto Adicional / Cabear Dispositivo</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowConfig(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" />
            Atualizar Técnicos
          </button>
          <button 
            onClick={() => setFormData(prev => ({ ...prev, dataAgendamento: new Date().toISOString().split('T')[0] }))}
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
                {techData.vagasInfo && (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusColorClass(techData.vagasInfo.color)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(techData.vagasInfo.color)}`} />
                      Vagas: {techData.vagasInfo.count} - {techData.vagasInfo.day}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openVagasEdit(); }} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"><Settings className="w-3 h-3" /></button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* O.S Ponto Adicional */}
        <Card icon={<PlusCircle className="w-4 h-4" />} title="O.S Ponto Adicional">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data de Agendamento</label>
              <input 
                type="date" 
                name="dataAgendamento"
                value={formData.dataAgendamento}
                onChange={handleInputChange}
                className={getFieldClass('dataAgendamento')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Período</label>
              <select 
                name="periodo"
                value={formData.periodo}
                onChange={handleInputChange}
                className={getFieldClass('periodo', 'bg-white')}
              >
                <option value="">Selecione...</option>
                <option value="Horário Comercial">Horário Comercial</option>
                <option value="Primeira do dia">Primeira do dia</option>
                <option value="Manhã (9 às 12h30)">Manhã (9 às 12h30)</option>
                <option value="Tarde (13 às 17h30)">Tarde (13 às 17h30)</option>
                <option value="Última do dia">Última do dia</option>
                <option value="Após (Informar Horário)">Após (Informar Horário)</option>
              </select>
              {formData.periodo === 'Após (Informar Horário)' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1 font-bold text-red-600">Horário Específico</label>
                  <input 
                    type="text" 
                    name="horarioEspecifico"
                    placeholder="Ex: 17:30"
                    value={formData.horarioEspecifico}
                    onChange={handleInputChange}
                    className={getFieldClass('horarioEspecifico')}
                  />
                </motion.div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Solicitação</label>
              <textarea 
                name="solicitacao"
                rows={4}
                placeholder="Detalhes da solicitação..."
                value={formData.solicitacao}
                onChange={handleInputChange}
                className={getFieldClass('solicitacao', 'resize-none')}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-red-600 uppercase tracking-wider">Vagas da Rota</label>
                <button 
                  onClick={openVagasEdit}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  EDITAR VAGAS
                </button>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${getStatusColorClass(techData.vagasInfo?.color)}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusDotClass(techData.vagasInfo?.color)} animate-pulse`} />
                  <div>
                    <p className="text-sm font-bold">{techData.vagasInfo?.count || '0'} Vagas Preenchidas</p>
                    <p className="text-[10px] opacity-80 font-medium uppercase">{techData.vagasInfo?.day || 'Dia não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Informações do Cliente */}
        <Card icon={<User className="w-4 h-4" />} title="Informações do Cliente">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Contato</label>
              <input 
                type="text" 
                name="contato"
                placeholder="(XX) XXXXX-XXXX"
                value={formData.contato}
                onChange={handleInputChange}
                className={getFieldClass('contato')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Plano Atual</label>
              <select 
                name="planoAtual"
                value={formData.planoAtual}
                onChange={handleInputChange}
                className={getFieldClass('planoAtual', 'bg-white')}
              >
                <option value="">Selecione...</option>
                <option value="10Mbps">10Mbps</option>
                <option value="100Mbps">100Mbps</option>
                <option value="600Mbps">600Mbps</option>
                <option value="800Mbps">800Mbps</option>
                <option value="1000 Mbps">1000 Mbps</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cliente Desde</label>
              <input 
                type="text" 
                name="clienteDesde"
                placeholder="Ex: 05/2021"
                value={formData.clienteDesde}
                onChange={handleInputChange}
                className={getFieldClass('clienteDesde')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Roteador (Principal)</label>
              <select 
                name="roteadorPrincipal"
                value={formData.roteadorPrincipal}
                onChange={handleInputChange}
                className={getFieldClass('roteadorPrincipal', 'bg-white')}
              >
                <option value="">Selecione...</option>
                <option value="Comodato">Comodato</option>
                <option value="Compra">Compra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">ONU</label>
              <select 
                name="onu"
                value={formData.onu}
                onChange={handleInputChange}
                className={getFieldClass('onu', 'bg-white')}
              >
                <option value="">Selecione...</option>
                <option value="Comodato">Comodato</option>
                <option value="Compra">Compra</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Informações da O.S. */}
        <Card icon={<FileText className="w-4 h-4" />} title="Informações da O.S." className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Cliente realizou upgrade?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      formData.upgradeRealizado === option 
                        ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="upgradeRealizado" 
                        value={option} 
                        checked={formData.upgradeRealizado === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Será necessário roteador?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      formData.necessarioRoteador === option 
                        ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}>
                      <input 
                        type="radio" 
                        name="necessarioRoteador" 
                        value={option} 
                        checked={formData.necessarioRoteador === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.necessarioRoteador === 'Sim' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50/30 rounded-xl border border-red-100 space-y-2">
                  <label className="block text-xs font-bold text-red-600 uppercase tracking-tight">Qual o tipo do roteador?</label>
                  <select 
                    name="tipoRoteador"
                    value={formData.tipoRoteador}
                    onChange={handleInputChange}
                    className={getFieldClass('tipoRoteador', 'bg-white')}
                  >
                    <option value="">Selecione...</option>
                    <option value="Comodato">Comodato</option>
                    <option value="Compra">Compra</option>
                  </select>
                </motion.div>
              )}
            </div>

            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-red-600 mb-2 uppercase tracking-wider">Será gerado custo?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      formData.geradoCusto === option 
                        ? 'bg-white border-red-200 text-red-600 shadow-sm' 
                        : 'bg-transparent border-slate-200 text-slate-600 hover:bg-white/50'
                    }`}>
                      <input 
                        type="radio" 
                        name="geradoCusto" 
                        value={option} 
                        checked={formData.geradoCusto === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              {formData.geradoCusto === 'Sim' ? (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2 border-t border-red-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">Cliente ciente do custo?</label>
                    <div className="flex gap-4">
                      {['Sim', 'Não'].map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="cienteCusto" 
                            value={option} 
                            checked={formData.cienteCusto === option}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm group-hover:text-red-600 transition-colors">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="valorCusto"
                          placeholder="0,00"
                          value={formData.valorCusto}
                          onChange={handleInputChange}
                          className={getFieldClass('valorCusto', 'pr-10')}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <input 
                            type="checkbox" 
                            name="cobrarPorMetro"
                            id="cobrarPorMetro"
                            checked={formData.cobrarPorMetro}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                          <label htmlFor="cobrarPorMetro" className="text-[10px] font-bold text-slate-400 cursor-pointer">/m?</label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Vencimento</label>
                      <input 
                        type="date" 
                        name="vencimentoCusto"
                        value={formData.vencimentoCusto}
                        onChange={handleInputChange}
                        className={getFieldClass('vencimentoCusto')}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <label className="block text-[11px] font-bold text-red-600 uppercase tracking-tight">Motivo da Isenção</label>
                  <select 
                    name="motivoIsencao"
                    value={formData.motivoIsencao}
                    onChange={handleInputChange}
                    className={getFieldClass('motivoIsencao', 'bg-white')}
                  >
                    <option value="">Selecione...</option>
                    <option value="Cliente antigo">Cliente antigo</option>
                    <option value="Primeira isenção">Primeira isenção</option>
                    <option value="Ameaçou cancelamento">Ameaçou cancelamento</option>
                    <option value="Autorizado diretoria">Autorizado diretoria</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {formData.motivoIsencao === 'Outro' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <input 
                        type="text" 
                        name="motivoIsencaoOutro"
                        placeholder="Digite o motivo específico..."
                        value={formData.motivoIsencaoOutro}
                        onChange={handleInputChange}
                        className={getFieldClass('motivoIsencaoOutro', 'bg-white')}
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </Card>

        {/* Avaliação Técnica */}
        <Card icon={<ClipboardCheck className="w-4 h-4" />} title="Avaliação Técnica">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Já foi feita avaliação técnica?</label>
              <div className="flex gap-4">
                {['Sim', 'Não'].map(option => (
                  <label key={option} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    formData.avaliacaoTecnica === option 
                      ? 'bg-red-50 border-red-200 text-red-600 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="avaliacaoTecnica" 
                      value={option} 
                      checked={formData.avaliacaoTecnica === option}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {formData.avaliacaoTecnica === 'Sim' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <label className="block text-xs font-medium text-slate-500 mb-1">Baixa da Avaliação</label>
                <textarea 
                  name="baixaAvaliacao"
                  rows={3}
                  placeholder="Informe o resultado da avaliação..."
                  value={formData.baixaAvaliacao}
                  onChange={handleInputChange}
                  className={getFieldClass('baixaAvaliacao', 'resize-none')}
                />
              </motion.div>
            )}
          </div>
        </Card>

        {/* Autorização & Atendente */}
        <Card icon={<ShieldCheck className="w-4 h-4" />} title="Autorização & Atendente">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Autorização por Exceção (Torre)?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não'].map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="autorizacaoExcecao" 
                        value={option}
                        checked={formData.autorizacaoExcecao === option}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm group-hover:text-red-600 transition-colors">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.autorizacaoExcecao === 'Sim' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
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
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Operador / Atendente (Definido no Menu)</label>
              <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-bold">
                {operatorName}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 ${copied ? 'bg-emerald-500' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Copiar Script
            </>
          )}
        </button>
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 className="w-5 h-5" />
          Limpar
        </button>
      </div>

      {/* Vagas Modal */}
      <AnimatePresence>
        {showVagasEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h2 className="font-bold text-slate-800">Vagas da Rota</h2><button onClick={() => setShowVagasEdit(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Número de Vagas</label>
                  <input type="text" value={newVagasCount} onChange={(e) => setNewVagasCount(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ex: 5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Dia</label>
                  <input type="text" value={newVagasDay} onChange={(e) => setNewVagasDay(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Ex: Segunda-feira" />
                </div>
                <div className="flex gap-3">
                  {['green', 'yellow', 'red'].map(c => (
                    <button key={c} onClick={() => setNewVagasColor(c as any)} className={`flex-1 py-2 rounded-lg border-2 ${newVagasColor === c ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}>{c}</button>
                  ))}
                </div>
                <button onClick={handleUpdateVagas} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-4">Limpar Campos?</h3>
              <p className="text-sm text-slate-500 mb-6">Tem certeza que deseja limpar todos os campos deste formulário?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)} 
                  className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setFormData(initialFormState);
                    setErrors([]);
                    setShowClearConfirm(false);
                  }} 
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Sim, Limpar
                </button>
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
      <div className="p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
