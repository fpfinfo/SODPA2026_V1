import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Plane, ArrowLeft, CheckCircle, MapPin, Calendar, DollarSign, FileText, Search, Navigation } from 'lucide-react';

// Mock database of locations with real coordinates for the demo
const LOCATIONS_DB = [
    { name: 'Belém - PA (Sede)', lat: -1.4558, lng: -48.4902 },
    { name: 'Santarém - PA', lat: -2.4430, lng: -54.7082 },
    { name: 'Marabá - PA', lat: -5.3686, lng: -49.1176 },
    { name: 'Altamira - PA', lat: -3.2035, lng: -52.2064 },
    { name: 'Brasília - DF', lat: -15.7975, lng: -47.8919 },
    { name: 'São Paulo - SP', lat: -23.5505, lng: -46.6333 },
    { name: 'Rio de Janeiro - RJ', lat: -22.9068, lng: -43.1729 },
    { name: 'Manaus - AM', lat: -3.1190, lng: -60.0217 },
    { name: 'Fortaleza - CE', lat: -3.7172, lng: -38.5434 },
    { name: 'Lisboa - Portugal', lat: 38.7223, lng: -9.1393 },
    { name: 'Miami - EUA', lat: 25.7617, lng: -80.1918 },
    { name: 'Paris - França', lat: 48.8566, lng: 2.3522 },
];

interface PortalNewRequestProps {
  onBack?: () => void;
  onSubmit?: (formData: any) => void;
}

const PortalNewRequest: React.FC<PortalNewRequestProps> = ({ onBack, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
      type: 'DIARIA',
      origin: 'Belém - PA (Sede)',
      destination: '',
      startDate: '',
      returnDate: '',
      motive: '',
      bankAccount: 'Banco do Brasil - Ag 1234 - CC 55555-X'
  });

  // Autocomplete States
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
          if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
              setShowOriginSuggestions(false);
              setShowDestSuggestions(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredLocations = (query: string) => {
      if (!query) return LOCATIONS_DB;
      return LOCATIONS_DB.filter(loc => loc.name.toLowerCase().includes(query.toLowerCase()));
  };

  const selectLocation = (field: 'origin' | 'destination', value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setShowOriginSuggestions(false);
      setShowDestSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    if (onSubmit) {
      onSubmit(formData);
    } else {
      alert("Solicitação enviada com sucesso! Protocolo: TJPA-PORTAL-" + Date.now());
    }
    if (onBack) onBack();
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto" ref={wrapperRef}>
        
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
            <ArrowLeft size={20} />
            Voltar ao Portal
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {/* Header Wizard */}
            <div className="bg-indigo-900 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Nova Solicitação</h2>
                <p className="text-indigo-200">Preencha os dados abaixo para formalizar seu pedido de diária ou passagem.</p>
                
                <div className="flex items-center gap-4 mt-8">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-indigo-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-500' : 'bg-indigo-800'}`}>1</div>
                        <span className="text-sm font-bold">Tipo</span>
                    </div>
                    <div className="h-0.5 w-12 bg-indigo-700"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-indigo-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-500' : 'bg-indigo-800'}`}>2</div>
                        <span className="text-sm font-bold">Rota</span>
                    </div>
                    <div className="h-0.5 w-12 bg-indigo-700"></div>
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-white' : 'text-indigo-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-indigo-500' : 'bg-indigo-800'}`}>3</div>
                        <span className="text-sm font-bold">Revisão</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                
                {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-800">Qual o tipo de solicitação?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div 
                                onClick={() => setFormData({...formData, type: 'DIARIA'})}
                                className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-4 text-center hover:bg-gray-50 ${formData.type === 'DIARIA' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                            >
                                <div className={`p-4 rounded-full ${formData.type === 'DIARIA' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Briefcase size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Diária</h4>
                                    <p className="text-sm text-gray-500 mt-1">Para custeio de despesas com hospedagem e alimentação.</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => setFormData({...formData, type: 'PASSAGEM'})}
                                className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-4 text-center hover:bg-gray-50 ${formData.type === 'PASSAGEM' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}
                            >
                                <div className={`p-4 rounded-full ${formData.type === 'PASSAGEM' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Plane size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Passagem Aérea</h4>
                                    <p className="text-sm text-gray-500 mt-1">Solicitação de emissão de bilhetes aéreos.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setStep(2)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">Continuar</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Definição de Rota e Datas</h3>
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                <MapPin size={12} /> Google Maps Integrado
                            </div>
                        </div>
                        
                        {/* Maps-style Inputs */}
                        <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-4 before:bottom-12 before:w-0.5 before:bg-gray-200 before:border-l-2 before:border-dashed before:border-gray-300">
                            
                            {/* Origin Input */}
                            <div className="relative group">
                                <div className="absolute -left-8 top-3 w-3 h-3 rounded-full border-2 border-gray-400 bg-white"></div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Origem</label>
                                <div className="relative">
                                    <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-gray-700"
                                        placeholder="Cidade de Origem"
                                        value={formData.origin}
                                        onChange={e => setFormData({...formData, origin: e.target.value})}
                                        onFocus={() => setShowOriginSuggestions(true)}
                                    />
                                    {showOriginSuggestions && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-48 overflow-y-auto">
                                            {filteredLocations(formData.origin).map((loc, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => selectLocation('origin', loc.name)}
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm text-gray-700"
                                                >
                                                    <MapPin size={14} className="text-gray-400" />
                                                    {loc.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Destination Input */}
                            <div className="relative group">
                                <div className="absolute -left-8 top-3 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white"></div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Destino</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500" size={18} />
                                    <input 
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-medium text-gray-700"
                                        placeholder="Pesquisar cidade de destino..."
                                        value={formData.destination}
                                        onChange={e => setFormData({...formData, destination: e.target.value})}
                                        onFocus={() => setShowDestSuggestions(true)}
                                    />
                                    {showDestSuggestions && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-48 overflow-y-auto">
                                            {filteredLocations(formData.destination).map((loc, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => selectLocation('destination', loc.name)}
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm text-gray-700"
                                                >
                                                    <MapPin size={14} className="text-red-400" />
                                                    {loc.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Dates Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Calendar size={14} /> Ida
                                </label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700"
                                    value={formData.startDate}
                                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Calendar size={14} /> Volta
                                </label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700"
                                    value={formData.returnDate}
                                    onChange={e => setFormData({...formData, returnDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-100 pl-8">
                            <button type="button" onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-gray-800">Voltar</button>
                            <button 
                                type="button" 
                                onClick={() => setStep(3)} 
                                disabled={!formData.destination || !formData.startDate}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Revisar Detalhes
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">Confirmação</h3>
                        <p className="text-gray-500 max-w-md mx-auto">Verifique os dados antes do envio. As coordenadas foram validadas via Google Maps.</p>
                        
                        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-lg mx-auto border border-gray-200 shadow-inner">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Rota</span>
                                    <div className="flex items-center gap-1 mt-1">
                                        <p className="font-bold text-gray-900">{formData.origin.split('-')[0]}</p>
                                        <ArrowLeft size={14} className="rotate-180 text-gray-400" />
                                        <p className="font-bold text-gray-900">{formData.destination.split('-')[0]}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Tipo</span>
                                    <p className="font-bold text-gray-900">{formData.type}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Período</span>
                                    <p className="font-bold text-gray-900">{formData.startDate} até {formData.returnDate}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Motivo</label>
                                <textarea 
                                    rows={2}
                                    className="w-full bg-white border border-gray-200 rounded p-2 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
                                    placeholder="Descreva o motivo da viagem..."
                                    value={formData.motive}
                                    onChange={e => setFormData({...formData, motive: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-6 max-w-lg mx-auto">
                            <button type="button" onClick={() => setStep(2)} className="text-gray-500 font-medium hover:text-gray-800">Corrigir</button>
                            <button type="submit" className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-1">
                                Confirmar Envio
                            </button>
                        </div>
                    </div>
                )}

            </form>
        </div>
    </div>
  );
};

export default PortalNewRequest;
