/**
 * Lexilume Scan and Learn (OCR) Component
 * 
 * Features:
 * - Client-side image upload & camera capture
 * - Tesseract.js WebAssembly OCR recognition
 * - Automatic script and language identification
 * - Tokenized interactive words with ContextualWordPopover
 * - Manual correction editing (never locks or destroys user edits)
 * - Low-contrast / low-confidence warnings & resolution advice
 * - Save recognized words to personal vocabulary notebook
 */

import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RotateCcw,
  Languages,
  BookOpen,
  Eye,
  Sliders,
  Loader2,
} from 'lucide-react';
import { Language } from '../../types';
import { OcrService, OcrResult } from '../../services/ocrService';
import { ContextualWordPopover } from '../../components/common/ContextualWordPopover';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export interface ScanAndLearnProps {
  language: Language;
}

export const ScanAndLearn: React.FC<ScanAndLearnProps> = ({ language }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [editableText, setEditableText] = useState('');
  const [contrastBoost, setContrastBoost] = useState(false);
  const [activeLookupWord, setActiveLookupWord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample texts for fast demonstration without camera
  const sampleImages = [
    {
      name: 'Cardápio / Menu (PT)',
      text: 'Entradas Tradicionais:\n- Pastéis de bacalhau artesanais com azeitonas galegas.\n- Caldo verde minhoto com chouriço de fumeiro.\nPratos Principais:\n- Polvo à lagareiro assado no forno a lenha com batatas a murro.',
      confidence: 94,
      script: 'Latin Script',
      lang: 'pt',
    },
    {
      name: 'Cartaz Cultural (ES)',
      text: 'Exposición de Arte Contemporáneo Hispánico:\nHorario: De martes a sábado de 10:00 a 20:00.\nEntrada gratuita para estudiantes y residentes.\nLugar: Palacio de Bellas Artes.',
      confidence: 91,
      script: 'Latin Script',
      lang: 'es',
    },
    {
      name: 'Notice Board (EN)',
      text: 'Public Notice:\nPlease retain your entry ticket until you depart the facility. Unauthorized parking in designated delivery zones will result in immediate towing.',
      confidence: 96,
      script: 'Latin Script',
      lang: 'en',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setOcrResult(null);
      setEditableText('');
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    if (!imagePreview) {
      toast.error('Nenhuma imagem carregada para digitalização.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await OcrService.recognizeImage(imagePreview, language);
      setOcrResult(res);
      setEditableText(res.text);

      if (res.isLowConfidence) {
        toast.warning('Aviso de qualidade: Nitidez ou contraste baixos podem ter reduzido a precisão do OCR.');
      } else {
        toast.success('Texto extraído com sucesso via Tesseract OCR!');
      }
    } catch (err: any) {
      toast.error('Falha ao processar OCR da imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplySample = (sample: typeof sampleImages[0]) => {
    setImagePreview('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%231e293b"><rect width="100%" height="100%" fill="%230f172a"/><text x="20" y="50" fill="%2338bdf8" font-size="16" font-family="sans-serif">Imagem de Teste Digitalizada</text></svg>');
    const scriptInfo = OcrService.detectScript(sample.text);
    const result: OcrResult = {
      text: sample.text,
      confidence: sample.confidence,
      detectedScript: sample.script || scriptInfo.script,
      detectedLanguage: sample.lang,
      isLowConfidence: sample.confidence < 60,
      words: sample.text.split(/\s+/).map(w => ({ text: w, confidence: sample.confidence })),
    };
    setOcrResult(result);
    setEditableText(sample.text);
  };

  const handleCopyText = () => {
    if (!editableText) return;
    navigator.clipboard.writeText(editableText);
    toast.success('Texto copiado para a área de transferência!');
  };

  const words = editableText.split(/(\s+)/);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Scan & Learn — OCR Poliglota</h2>
                <Badge variant="amber" size="sm">Tesseract.js</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fotografe cardápios, placas, rótulos e livros para extração de texto, tradução contextual e anotação léxica.
              </p>
            </div>
          </div>

          {/* Quick Sample Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Exemplos:
            </span>
            {sampleImages.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleApplySample(s)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Capture / Upload Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Upload and Preview Box */}
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition bg-slate-950/40 hover:bg-slate-950/80 min-h-[220px]"
              >
                <div className="p-3.5 bg-slate-800 text-amber-400 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-200">
                    Clique para carregar foto ou abrir câmera
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Suporta imagens em PNG, JPG, WebP e capturas diretas de celular
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[260px] flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview de Digitalização"
                    className={`max-h-[260px] object-contain transition ${contrastBoost ? 'contrast-150 grayscale' : ''}`}
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setOcrResult(null);
                      setEditableText('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-900/90 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition cursor-pointer text-xs"
                  >
                    Trocar Imagem
                  </button>
                </div>

                {/* Preprocessing and Run Action */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setContrastBoost(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                      contrastBoost
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Realce de Contraste (Baixa Luz)</span>
                  </button>

                  <Button
                    onClick={handleRunOcr}
                    disabled={isProcessing}
                    variant="primary"
                    size="md"
                    className="gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraindo Caracteres...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extrair Texto com OCR</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: OCR Status and Diagnostic Card */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Diagnóstico de Reconhecimento
              </h3>

              {ocrResult ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Escrita Detectada</div>
                      <div className="text-slate-100 font-semibold mt-0.5">{ocrResult.detectedScript}</div>
                    </div>
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Confiança do Motor</div>
                      <div className="text-slate-100 font-semibold mt-0.5">{ocrResult.confidence}%</div>
                    </div>
                  </div>

                  {ocrResult.isLowConfidence && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Atenção à Nitidez:</strong> A pontuação de confiança foi inferior a 60%. O texto foi exibido no editor abaixo para que você possa revisar pequenos erros de reconhecimento.
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-400">
                    O texto digitalizado está pronto para exploração interativa. Toque em qualquer palavra para consultar o vocabulário.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-6">
                  Carregue uma imagem ou clique em um dos exemplos acima para iniciar a leitura óptica de caracteres com o Tesseract OCR.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
              Privacidade Garantida: Todo o processamento de OCR e reconhecimento de escrita ocorre 100% no seu navegador via WebAssembly.
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Text & Interactive Word Inspector */}
      {editableText && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editable Text Area (allows fixing OCR errors) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Texto Bruto Extraído (Editável)
              </h3>
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>
            </div>

            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              rows={8}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono leading-relaxed"
              placeholder="O texto extraído aparecerá aqui..."
            />
            <div className="text-[11px] text-slate-500">
              Você pode corrigir manualmente quaisquer palavras que o scanner óptico tenha interpretado incorretamente.
            </div>
          </div>

          {/* Interactive Word Inspection Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Exploração Interativa de Vocabulário
              </h3>
              <span className="text-xs text-slate-500">Clique nas palavras</span>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 min-h-[190px] leading-relaxed text-sm text-slate-200">
              {words.map((word, wIdx) => {
                const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '').trim();
                if (!clean || /^\s+$/.test(word)) {
                  return <span key={wIdx}>{word}</span>;
                }
                return (
                  <span
                    key={wIdx}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopoverPos({ top: rect.bottom + 8, left: rect.left });
                      setActiveLookupWord(clean);
                    }}
                    className="hover:text-amber-300 hover:bg-amber-950/40 rounded px-0.5 cursor-pointer transition-colors decoration-amber-500/40 underline decoration-dotted"
                  >
                    {word}
                  </span>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Toque em qualquer vocábulo sublinhado para abrir a tradução, pronúncia e adicionar ao seu caderno de estudos.</span>
            </div>
          </div>
        </div>
      )}

      {activeLookupWord && (
        <ContextualWordPopover
          selectedWord={activeLookupWord}
          language={language}
          position={popoverPos}
          onClose={() => {
            setActiveLookupWord(null);
            setPopoverPos(undefined);
          }}
        />
      )}
    </div>
  );
};
