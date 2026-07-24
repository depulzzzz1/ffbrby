import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Sparkles, Compass, Eye, Layers } from 'lucide-react';
import { EngineSettings, WordName, WORDS } from '../types';
import { THEME_CONFIGS } from '../webgl/TextAnimationEngine';

interface AwwwardsOverlayProps {
  currentWord: WordName;
  currentStepIndex: number;
  settings: EngineSettings;
  onSelectWord: (word: WordName) => void;
  onPrevWord: () => void;
  onNextWord: () => void;
  onTogglePlay: () => void;
  onUpdateTheme: (theme: string) => void;
  onToggleSound: (enabled: boolean) => void;
  onToggleTilt: () => void;
  onToggleRepulsion: () => void;
}

const STEP_LABELS: Record<number, string> = {
  1: '01. LIGHT STREAK PASS',
  2: '02. COSMIC PARTICLE SPAWN',
  3: '03. GALAXY SWIRL PHYSICS',
  4: '04. MERGING 3D METALLIC LETTERS',
  5: '05. CHROME GRADIENT REFLECTION',
  6: '06. NEON BLOOM & FLOATING SPACE',
  7: '07. MOUSE WAVE DISTORTION',
  8: '08. CONTINUOUS SPECULAR SHEEN',
  9: '09. SPARKLE BURST EMISSION',
  10: '10. LIQUID ENERGY DISINTEGRATION',
  11: '11. MORPHING TO NEXT WORD',
};

export const AwwwardsOverlay: React.FC<AwwwardsOverlayProps> = ({
  currentWord,
  currentStepIndex,
  settings,
  onSelectWord,
  onPrevWord,
  onNextWord,
  onTogglePlay,
  onUpdateTheme,
  onToggleSound,
  onToggleTilt,
  onToggleRepulsion,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-12 font-sans select-none text-white/90">
      {/* Corner Metadata Overlays (Bold Typography Design) */}
      <div className="absolute top-8 left-8 hidden lg:flex flex-col gap-1">
        <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-medium">Site of the Day</span>
        <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase font-medium">FWA & Awwwards</span>
      </div>

      <div className="absolute top-8 right-8 hidden lg:flex flex-col items-end gap-1">
        <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase font-medium">3D Typography</span>
        <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase font-medium">Collection 2026</span>
      </div>

      <div className="absolute bottom-28 left-8 hidden lg:flex gap-12">
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 uppercase tracking-[0.25em]">Director</span>
          <span className="text-[11px] text-white/70 uppercase tracking-[0.2em] font-mono">Studio Flux</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 uppercase tracking-[0.25em]">Location</span>
          <span className="text-[11px] text-white/70 uppercase tracking-[0.2em] font-mono">Osaka, JP</span>
        </div>
      </div>

      <div className="absolute bottom-28 right-8 hidden lg:flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-bounce">
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
        <span className="text-[10px] tracking-[0.35em] text-white/40 uppercase font-medium">Interactive Canvas</span>
      </div>

      {/* Top Header Controls Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="pointer-events-auto flex items-center gap-3 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono tracking-widest uppercase text-white/90">
            3D ENGINE • {currentWord}
          </span>
        </div>

        {/* Current Sequence Stage Badge */}
        <div className="hidden md:flex items-center gap-2 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-mono tracking-wider text-cyan-300">
            {STEP_LABELS[currentStepIndex] || 'ACTIVE LOOP'}
          </span>
        </div>

        {/* Controls Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-2xl">
          <button
            onClick={() => onToggleSound(!settings.soundEnabled)}
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            title={settings.soundEnabled ? 'Mute Audio' : 'Enable Audio Synth'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleTilt}
            className={`p-2.5 rounded-full transition-colors ${
              settings.tiltEnabled ? 'bg-white/15 text-cyan-300' : 'hover:bg-white/10 text-white/60'
            }`}
            title="3D Parallax Tilt"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleRepulsion}
            className={`p-2.5 rounded-full transition-colors ${
              settings.mouseRepulsion ? 'bg-white/15 text-cyan-300' : 'hover:bg-white/10 text-white/60'
            }`}
            title="Mouse Repulsion Physics"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-full transition-colors ${
              showSettings ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/10 text-white/80'
            }`}
            title="Theme Settings"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Theme Picker Drawer (Modal / Floating Menu) */}
      {showSettings && (
        <div className="pointer-events-auto self-end mt-4 bg-black/80 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 shadow-2xl max-w-xs w-full transition-all animate-in fade-in slide-in-from-top-2">
          <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 mb-3">Metallic Material Theme</h4>
          <div className="space-y-2">
            {Object.values(THEME_CONFIGS).map(theme => (
              <button
                key={theme.id}
                onClick={() => {
                  onUpdateTheme(theme.id);
                  setShowSettings(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  settings.theme === theme.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-200'
                    : 'hover:bg-white/5 border border-transparent text-white/70'
                }`}
              >
                <span>{theme.name}</span>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Floating Navigation Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Word Chips Selector */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-2xl">
          {WORDS.map((word) => (
            <button
              key={word}
              onClick={() => onSelectWord(word)}
              className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
                currentWord === word
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {word}
            </button>
          ))}
        </div>

        {/* Timeline Playback Controls */}
        <div className="pointer-events-auto flex items-center gap-2 bg-black/50 backdrop-blur-2xl border border-white/10 rounded-full px-4 py-2 shadow-2xl">
          <button
            onClick={onPrevWord}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Previous Word"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={settings.autoLoop ? 'Pause Auto Loop' : 'Play Auto Loop'}
          >
            {settings.autoLoop ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={onNextWord}
            className="p-2 text-white/70 hover:text-white transition-colors"
            title="Next Word"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
