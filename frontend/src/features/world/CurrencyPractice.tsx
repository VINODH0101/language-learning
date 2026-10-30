/**
 * Lexilume Currency Practice & Financial Vocabulary Component
 * 
 * Powered by Frankfurter API Provider (European Central Bank reference data).
 * Features:
 * - Real-time currency conversion calculator
 * - Multilingual financial vocabulary (Preço, Custo, Barato, Caro, Desconto, Câmbio)
 * - Indicative rate disclaimer for educational study only
 * - Audio pronunciation via Web Speech API
 */

import React, { useState, useEffect } from 'react';
import {
  Coins,
  ArrowRightLeft,
  DollarSign,
  Languages,
  Volume2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CurrencyProvider, COMMON_CURRENCIES, NormalizedCurrencyConversion } from '../../services/providers/currency/currencyProvider';
import { SpeechService } from '../../services/speech';
import { Language } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export interface FinancialVocabItem {
  term: string;
  translation: string;
  exampleSentence: string;
}

export const FINANCIAL_VOCAB: Record<string, FinancialVocabItem[]> = {
  pt: [
    { term: 'Preço', translation: 'Price', exampleSentence: 'Qual é o preço deste bilhete de comboio?' },
    { term: 'Custo', translation: 'Cost', exampleSentence: 'O custo de vida nas grandes cidades é elevado.' },
    { term: 'Barato', translation: 'Cheap / Inexpensive', exampleSentence: 'Este restaurante tradicional é muito bom e barato.' },
    { term: 'Caro', translation: 'Expensive', exampleSentence: 'O alojamento no centro histórico ficou mais caro.' },
    { term: 'Desconto', translation: 'Discount', exampleSentence: 'Estudantes têm direito a vinte por cento de desconto.' },
    { term: 'Pagamento', translation: 'Payment', exampleSentence: 'Aceitam pagamento com cartão de crédito ou numerário?' },
    { term: 'Taxa de Câmbio', translation: 'Exchange Rate', exampleSentence: 'A taxa de câmbio do euro valorizou-se esta semana.' },
  ],
  es: [
    { term: 'Precio', translation: 'Price', exampleSentence: '¿Cuál es el precio de la entrada al museo?' },
    { term: 'Costo', translation: 'Cost', exampleSentence: 'El costo del transporte público está incluido.' },
    { term: 'Barato', translation: 'Cheap / Inexpensive', exampleSentence: 'El menú del día es bastante barato.' },
    { term: 'Caro', translation: 'Expensive', exampleSentence: 'Ese hotel de cinco estrellas es muy caro.' },
    { term: 'Descuento', translation: 'Discount', exampleSentence: 'Hay un descuento especial para jubilados.' },
    { term: 'Pago', translation: 'Payment', exampleSentence: '¿Prefiere el pago en efectivo o con tarjeta?' },
    { term: 'Tipo de Cambio', translation: 'Exchange Rate', exampleSentence: 'Consultamos el tipo de cambio antes de viajar.' },
  ],
  en: [
    { term: 'Price', translation: 'Preço', exampleSentence: 'What is the price of this flight?' },
    { term: 'Cost', translation: 'Custo', exampleSentence: 'The total cost includes local taxes.' },
    { term: 'Cheap', translation: 'Barato', exampleSentence: 'This youth hostel is clean and cheap.' },
    { term: 'Expensive', translation: 'Caro', exampleSentence: 'Dining out every night can get expensive.' },
    { term: 'Discount', translation: 'Desconto', exampleSentence: 'Is there any discount for group bookings?' },
    { term: 'Payment', translation: 'Pagamento', exampleSentence: 'We accept payment via digital wallet.' },
    { term: 'Exchange Rate', translation: 'Taxa de Câmbio', exampleSentence: 'The exchange rate fluctuates on global markets.' },
  ],
};

export interface CurrencyPracticeProps {
  learningLanguage?: Language;
}

export const CurrencyPractice: React.FC<CurrencyPracticeProps> = ({ learningLanguage = 'pt' }) => {
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('BRL');
  const [amount, setAmount] = useState<number>(50);
  const [conversion, setConversion] = useState<NormalizedCurrencyConversion | null>(null);
  const [loading, setLoading] = useState(false);

  const currencyProvider = new CurrencyProvider();

  const handleConvert = async () => {
    setLoading(true);
    try {
      const res = await currencyProvider.execute({
        from: fromCurrency,
        to: toCurrency,
        amount,
      });
      setConversion(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleConvert();
  }, [fromCurrency, toCurrency, amount]);

  const vocabList = FINANCIAL_VOCAB[learningLanguage] || FINANCIAL_VOCAB.pt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Câmbio Real & Vocabulário Financeiro</h2>
                <Badge variant="emerald" size="sm">BCE / Frankfurter</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pratique conversões com taxas de referência do Banco Central Europeu e aprenda terminologia comercial útil.
              </p>
            </div>
          </div>
        </div>

        {/* Currency Calculator Box */}
        <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            {/* Amount input */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Valor para Conversão
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            {/* From currency select */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Moeda Origem
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                {Object.values(COMMON_CURRENCIES).map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* To currency select */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Moeda Destino
              </label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                {Object.values(COMMON_CURRENCIES).map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Banner */}
          {conversion && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div>
                <div className="text-2xl font-extrabold text-teal-300 font-mono">
                  {conversion.amount} {conversion.from} = {conversion.convertedAmount} {conversion.to}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Taxa: 1 {conversion.from} = {conversion.rate} {conversion.to} • Data do Câmbio: {conversion.date}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Valores indicativos para fins pedagógicos de vocabulário e viagem.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Financial Vocabulary Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Languages className="w-4 h-4 text-teal-400" />
            Vocabulário Comercial & Viagens ({learningLanguage.toUpperCase()})
          </h3>
          <Badge variant="emerald" size="sm">Terminologia Essencial</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vocabList.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-100">{item.term}</div>
                  <div className="text-xs text-teal-400 font-medium">{item.translation}</div>
                </div>
                <button
                  onClick={() => SpeechService.speak(item.term, learningLanguage)}
                  title="Ouvir pronúncia"
                  className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 italic font-serif">
                "{item.exampleSentence}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
