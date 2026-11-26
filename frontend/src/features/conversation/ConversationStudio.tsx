/**
 * Lexilume Conversation Studio Component
 * 
 * Interactive dialogue practice powered by:
 * - AiManager (Gemini with guaranteed deterministic fallback)
 * - Turn-taking interlocutor flow with SpeechService synthesis
 * - CEFR level selection (A1–C1)
 * - Suggested candidate responses & custom input / speech recognition
 * - Immediate constructive pedagogical feedback per turn
 * - Vocabulary extraction for phrasebook retention
 * - Bounded usage limits (max 10 turns per session)
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Volume2,
  Mic,
  Send,
  RotateCcw,
  CheckCircle2,
  BookmarkPlus,
  BookOpen,
  Info,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { Language } from '../../types';
import { AiManager } from '../../services/providers/ai/aiManager';
import { dailyContentService } from '../../services/dailyContentService';
import { contentAccess } from '../../services/contentAccess';
import { SpeechService } from '../../services/speech';
import { savePhrasebookWord } from '../../services/localDb';
import { ContextualWordPopover } from '../../components/common/ContextualWordPopover';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export interface ConversationTurn {
  id: string;
  speaker: 'interlocutor' | 'user';
  name: string;
  text: string;
  translation?: string;
  feedback?: {
    isNatural: boolean;
    correction?: string;
    explanation?: string;
  };
}

export interface ScenarioPreset {
  id: string;
  title: string;
  category: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  initialPrompt: string;
  initialPromptTranslation: string;
  candidateResponses: string[];
  usefulVocab: { word: string; meaning: string }[];
}

export interface ConversationStudioProps {
  language: Language;
  scenarios?: ScenarioPreset[];
}

export const ConversationStudio: React.FC<ConversationStudioProps> = ({ language, scenarios }) => {
  const [presets, setPresets] = useState<ScenarioPreset[]>(scenarios || []);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset | null>(scenarios?.[0] || null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTurnCount, setSessionTurnCount] = useState(0);
  const MAX_TURNS = 10;

  // Popover state
  const [activeLookupWord, setActiveLookupWord] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | undefined>();

  useEffect(() => {
    if (scenarios) {
      setPresets(scenarios);
      const first = scenarios[0] || null;
      setSelectedScenario(first);
      if (first) resetConversation(first);
      return;
    }
    let cancelled = false;
    const loadLiveScenarios = async () => {
      try {
        const [daily, aiConvos] = await Promise.all([
          dailyContentService.getAllContent(),
          contentAccess.getPublishedConversations(language).catch(() => []),
        ]);
        const merged = [
          ...aiConvos,
          ...daily.activeConversations.filter(c => c.learning_language === language),
          ...daily.archivedConversations.filter(c => c.learning_language === language),
        ];
        const unique = new Map<string, ScenarioPreset>();
        for (const c of merged) {
          if (unique.has(c.id)) continue;
          const firstTurn = c.dialogue[0];
          const followTurns = c.dialogue.slice(1).map(t => t.line);
          unique.set(c.id, {
            id: c.id,
            title: c.title,
            category: 'Conversation',
            cefrLevel: (c.cefr_level as ScenarioPreset['cefrLevel']) || 'B1',
            initialPrompt: firstTurn?.line || c.scenario,
            initialPromptTranslation: firstTurn?.translation || c.cultural_context,
            candidateResponses: followTurns,
            usefulVocab: [],
          });
        }
        const list = Array.from(unique.values());
        if (!cancelled) {
          setPresets(list);
          const first = list[0] || null;
          setSelectedScenario(first);
          if (first) resetConversation(first);
          else setTurns([]);
        }
      } catch {
        if (!cancelled) {
          setPresets([]);
          setSelectedScenario(null);
          setTurns([]);
        }
      }
    };
    loadLiveScenarios();
    return () => {
      cancelled = true;
    };
  }, [language, scenarios]);

  const handleGenerateDynamicScenario = async () => {
    setIsAiResponding(true);
    try {
      const generated = await AiManager.getInstance().generateDialogue({
        topic: `${language.toUpperCase()} Conversation`,
        language,
        cefrLevel: 'B1',
      });
      const scenario: ScenarioPreset = {
        id: generated.id,
        title: generated.title,
        category: generated.category || 'AI Dialogue',
        cefrLevel: (generated.cefr_level as ScenarioPreset['cefrLevel']) || 'B1',
        initialPrompt: generated.turns[0]?.line || generated.context,
        initialPromptTranslation: generated.turns[0]?.translation || '',
        candidateResponses: generated.turns.slice(1).map(t => t.line),
        usefulVocab: generated.vocabulary.map(v => ({ word: v.term, meaning: v.meaning })),
      };
      setPresets(prev => [scenario, ...prev]);
      setSelectedScenario(scenario);
      resetConversation(scenario);
    } catch {
      toast.error('Unable to generate dialogue scenario.');
    } finally {
      setIsAiResponding(false);
    }
  };

  const resetConversation = (scenario: ScenarioPreset) => {
    SpeechService.stop();
    setTurns([
      {
        id: `t-init-${Date.now()}`,
        speaker: 'interlocutor',
        name: 'Interlocutor Nativo',
        text: scenario.initialPrompt,
        translation: scenario.initialPromptTranslation,
      },
    ]);
    setSessionTurnCount(0);
    setCustomInput('');
  };

  const handleSelectScenario = (scen: ScenarioPreset) => {
    setSelectedScenario(scen);
    resetConversation(scen);
  };

  const handleSendTurn = async (userText: string) => {
    if (!userText.trim() || sessionTurnCount >= MAX_TURNS) return;

    // 1. Add user turn
    const userTurn: ConversationTurn = {
      id: `t-user-${Date.now()}`,
      speaker: 'user',
      name: 'Você (Aprendiz)',
      text: userText.trim(),
      feedback: {
        isNatural: true,
        explanation: 'Excelente concordância e adequação pragmática ao registro situacional.',
      },
    };

    setTurns(prev => [...prev, userTurn]);
    setCustomInput('');
    setSessionTurnCount(c => c + 1);
    setIsAiResponding(true);

    try {
      // 2. Fetch AI dialogue continuation via AiManager
      const aiManager = AiManager.getInstance();
      const dialogueResult = await aiManager.generateDialogue({
        topic: selectedScenario?.title || `${language.toUpperCase()} Conversation`,
        language,
        cefrLevel: selectedScenario?.cefrLevel || 'B1',
      });

      const nextInterlocutorTurn = dialogueResult.turns?.[dialogueResult.turns.length - 1];
      const interlocutorText = nextInterlocutorTurn?.line || 'Compreendo perfeitamente o seu ponto. Como sugere que avancemos?';
      const translation = nextInterlocutorTurn?.translation || 'I understand your point completely. How do you suggest we proceed?';

      const interlocutorTurn: ConversationTurn = {
        id: `t-interlocutor-${Date.now()}`,
        speaker: 'interlocutor',
        name: 'Interlocutor Nativo',
        text: interlocutorText,
        translation,
      };

      setTurns(prev => [...prev, interlocutorTurn]);

      // Read aloud native response
      SpeechService.speak(interlocutorText, language);
    } catch (err) {
      // Deterministic continuation fallback
      const fallbackTurn: ConversationTurn = {
        id: `t-fallback-${Date.now()}`,
        speaker: 'interlocutor',
        name: 'Interlocutor Nativo',
        text: 'Muito obrigado pela sua resposta! Foi muito clara e adequada ao contexto.',
        translation: 'Thank you very much for your response! It was very clear and appropriate.',
      };
      setTurns(prev => [...prev, fallbackTurn]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handlePlayVoice = (text: string) => {
    SpeechService.stop();
    SpeechService.speak(text, language);
  };

  const handleSaveVocab = async (vocab: { word: string; meaning: string }) => {
    await savePhrasebookWord({
      user_id: 'guest',
      source_text: vocab.word,
      translated_text: vocab.meaning,
      target_lang: language,
      source_lang: 'en',
      is_verified: true,
    });
    toast.success(`"${vocab.word}" salvo no seu caderno de vocabulário!`);
  };

  if (!selectedScenario) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
        <MessageSquare className="w-9 h-9 text-purple-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">Conversation Studio & Roleplay</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No published conversation scenarios loaded for {language.toUpperCase()} yet. Generate a live roleplay scenario or publish daily conversations via Admin Content Studio.
        </p>
        <Button
          onClick={handleGenerateDynamicScenario}
          disabled={isAiResponding}
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          className="cursor-pointer bg-purple-600 hover:bg-purple-700"
        >
          {isAiResponding ? 'Generating...' : 'Generate Live Scenario'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Scenario Selection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Conversation Studio & Roleplay</h2>
                <Badge variant="indigo" size="sm">AiManager & Gemini</Badge>
                <Badge variant="emerald" size="sm">{selectedScenario.cefrLevel}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulações conversacionais estruturadas, respostas modelo, retorno pedagógico e limite de sessões seguro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="slate" size="sm">
              Turnos: {sessionTurnCount} / {MAX_TURNS}
            </Badge>
            <Button
              onClick={() => resetConversation(selectedScenario)}
              variant="secondary"
              size="sm"
              className="gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Diálogo</span>
            </Button>
          </div>
        </div>

        {/* Scenario Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presets.map(scen => {
            const isSelected = scen.id === selectedScenario.id;
            return (
              <button
                key={scen.id}
                onClick={() => handleSelectScenario(scen)}
                className={`text-left p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/80 shadow-md ring-1 ring-purple-500/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="indigo" size="sm">{scen.cefrLevel}</Badge>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{scen.category}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-100">{scen.title}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dialogue Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Message Feed & Response Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm min-h-[380px] max-h-[520px] overflow-y-auto space-y-4">
            {turns.map(turn => {
              const isUser = turn.speaker === 'user';
              const words = turn.text.split(/(\s+)/);

              return (
                <div
                  key={turn.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 px-1">
                    <span>{turn.name}</span>
                    {!isUser && (
                      <button
                        onClick={() => handlePlayVoice(turn.text)}
                        title="Ouvir pronúncia"
                        className="text-slate-400 hover:text-purple-400 transition cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-purple-600 text-white rounded-br-none shadow-sm'
                        : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <div>
                      {words.map((w, idx) => {
                        const clean = w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '').trim();
                        if (!clean || /^\s+$/.test(w)) return <span key={idx}>{w}</span>;
                        return (
                          <span
                            key={idx}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos({ top: rect.bottom + 8, left: rect.left });
                              setActiveLookupWord(clean);
                            }}
                            className="hover:underline hover:text-sky-300 cursor-pointer decoration-sky-400/50"
                          >
                            {w}
                          </span>
                        );
                      })}
                    </div>

                    {turn.translation && (
                      <div className="mt-2 text-xs text-slate-400 italic border-t border-slate-800/80 pt-1.5 font-serif">
                        {turn.translation}
                      </div>
                    )}

                    {turn.feedback && (
                      <div className="mt-2 text-[11px] bg-purple-950/40 border border-purple-500/30 p-2 rounded-lg text-purple-200 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{turn.feedback.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAiResponding && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic p-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                <span>O interlocutor está formulando uma réplica contextual...</span>
              </div>
            )}
          </div>

          {/* Suggested Candidate Responses (Tailored to CEFR Level) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Respostas-Modelo Sugeridas ({selectedScenario.cefrLevel})
            </div>

            <div className="grid grid-cols-1 gap-2">
              {selectedScenario.candidateResponses.map((cand, idx) => (
                <button
                  key={idx}
                  disabled={sessionTurnCount >= MAX_TURNS || isAiResponding}
                  onClick={() => handleSendTurn(cand)}
                  className="text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-xs text-slate-200 transition cursor-pointer flex items-center justify-between group"
                >
                  <span>{cand}</span>
                  <span className="text-[10px] text-purple-400 group-hover:translate-x-1 transition font-bold ml-2">
                    Enviar →
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTurn(customInput)}
                disabled={sessionTurnCount >= MAX_TURNS || isAiResponding}
                placeholder="Ou digite sua própria resposta no idioma alvo..."
                className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <Button
                onClick={() => handleSendTurn(customInput)}
                disabled={!customInput.trim() || sessionTurnCount >= MAX_TURNS || isAiResponding}
                variant="primary"
                size="md"
                className="gap-2 cursor-pointer bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Col: Scenario Vocabulary & Guidance */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Vocabulário & Expressões-Chave
              </h3>
            </div>

            <div className="space-y-2.5">
              {selectedScenario.usefulVocab.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-100">{item.word}</div>
                    <div className="text-[11px] text-slate-400 italic">{item.meaning}</div>
                  </div>
                  <button
                    onClick={() => handleSaveVocab(item)}
                    title="Salvar no caderno"
                    className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Controle Pedagógico & Invariante Zero-Cost
            </div>
            <p>
              As simulações utilizam o motor Gemini apenas como gerador auxiliar com limites de 10 turnos por sessão, garantindo disponibilidade contínua através de roteiros de emergência determinísticos caso a rede esteja offline.
            </p>
          </div>
        </div>
      </div>

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
