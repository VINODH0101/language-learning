/**
 * Lexilume DiceBear Avatar Customizer Component
 * 
 * Powered by DiceBear API with offline SVG fallback.
 * Features:
 * - Style selection: personas, bottts, adventurer, initials, thumbs, pixel-art
 * - Regenerate seed and custom seed input
 * - Instant preview and profile save
 * - Zero PII sent to external servers
 */

import React, { useState } from 'react';
import {
  User,
  Sparkles,
  RotateCcw,
  Check,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { AvatarProvider, AvatarStyle } from '../../services/providers/avatars/avatarProvider';
import { authService } from '../../services/auth';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const AVATAR_STYLES: { id: AvatarStyle; label: string }[] = [
  { id: 'personas', label: 'Personas (Humanos)' },
  { id: 'bottts', label: 'Bottts (Robôs)' },
  { id: 'adventurer', label: 'Adventurer (Aventura)' },
  { id: 'initials', label: 'Iniciais Tipográficas' },
  { id: 'thumbs', label: 'Thumbs (Emojis)' },
  { id: 'pixel-art', label: 'Pixel Art (Retro)' },
  { id: 'lorelei', label: 'Lorelei (Ilustrado)' },
];

export interface AvatarCustomizerProps {
  initialSeed?: string;
  initialStyle?: AvatarStyle;
  onAvatarSaved?: (avatarUrl: string) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({
  initialSeed = 'lexilume_learner',
  initialStyle = 'personas',
  onAvatarSaved,
}) => {
  const avatarProvider = AvatarProvider.getInstance();
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(initialStyle);
  const [seed, setSeed] = useState(initialSeed);
  const [imgError, setImgError] = useState(false);

  const currentUrl = avatarProvider.getAvatarUrl({ seed, style: selectedStyle });
  const fallbackSvg = avatarProvider.getOfflineInitialsSvgUri(seed);

  const handleRandomize = () => {
    setSeed(avatarProvider.generateRandomSeed());
    setImgError(false);
  };

  const handleSave = async () => {
    try {
      const user = authService.getState().user;
      if (user) {
        await authService.updateProfile({ avatar_url: currentUrl });
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lexilume_user_avatar', currentUrl);
      }
      onAvatarSaved?.(currentUrl);
      toast.success('Novo avatar atualizado com sucesso no seu perfil!');
    } catch {
      toast.error('Não foi possível salvar o avatar.');
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-700">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-stone-900">Personalizador de Avatar Poliglota</h3>
            <p className="text-xs text-stone-500">Avatares gerados deterministicamente via DiceBear sem coleta de dados privados.</p>
          </div>
        </div>
        <Badge variant="slate" size="sm">DiceBear 9.x</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Avatar Live Preview */}
        <div className="flex flex-col items-center justify-center p-6 bg-stone-50/70 rounded-2xl border border-stone-200 space-y-3">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-stone-300 shadow-sm bg-white flex items-center justify-center">
            <img
              src={imgError ? fallbackSvg : currentUrl}
              alt="Avatar do Aprendiz"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-mono text-xs text-stone-500">{seed}</span>
          <Button
            onClick={handleRandomize}
            variant="secondary"
            size="sm"
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Gerar Aleatório</span>
          </Button>
        </div>

        {/* Style Selector & Seed Editor */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              Estilo Visual do Avatar:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVATAR_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStyle(s.id);
                    setImgError(false);
                  }}
                  className={`p-2.5 rounded-xl border text-xs text-left transition cursor-pointer font-medium ${
                    selectedStyle === s.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              Semente Determinística (Seed):
            </label>
            <input
              type="text"
              value={seed}
              onChange={(e) => {
                setSeed(e.target.value);
                setImgError(false);
              }}
              placeholder="Digite qualquer palavra para gerar..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nenhum dado pessoal ou e-mail é transmitido ao provedor.</span>
            </div>
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              className="gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Avatar no Perfil</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
