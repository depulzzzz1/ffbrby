import React, { useEffect, useRef, useState } from 'react';
import { EngineSettings, WordName, WORDS } from './types';
import { TextAnimationEngine } from './webgl/TextAnimationEngine';
import { AwwwardsOverlay } from './components/AwwwardsOverlay';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TextAnimationEngine | null>(null);

  const [currentWord, setCurrentWord] = useState<WordName>(WORDS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [settings, setSettings] = useState<EngineSettings>({
    theme: 'chrome',
    particleDensity: 'ultra',
    fontSize: 220,
    fontFamily: 'Orbitron',
    speed: 1.0,
    soundEnabled: false,
    autoLoop: true,
    mouseRepulsion: true,
    tiltEnabled: true,
    qualityFPS: 120,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WebGL Text Engine
    const engine = new TextAnimationEngine(
      containerRef.current,
      settings,
      (word, stepIdx) => {
        setCurrentWord(word);
        setCurrentStepIndex(stepIdx);
      }
    );

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Control Handlers
  const handleSelectWord = (word: WordName) => {
    setCurrentWord(word);
    engineRef.current?.selectWord(word);
  };

  const handlePrevWord = () => {
    engineRef.current?.prevWord();
  };

  const handleNextWord = () => {
    engineRef.current?.nextWord();
  };

  const handleTogglePlay = () => {
    setSettings(prev => {
      const nextAutoLoop = !prev.autoLoop;
      if (engineRef.current) {
        // update engine loop setting
        (engineRef.current as any).settings.autoLoop = nextAutoLoop;
      }
      return { ...prev, autoLoop: nextAutoLoop };
    });
  };

  const handleUpdateTheme = (themeKey: string) => {
    setSettings(prev => ({ ...prev, theme: themeKey as any }));
    engineRef.current?.updateTheme(themeKey);
  };

  const handleToggleSound = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled: enabled }));
    engineRef.current?.toggleSound(enabled);
  };

  const handleToggleTilt = () => {
    setSettings(prev => {
      const nextTilt = !prev.tiltEnabled;
      if (engineRef.current) {
        (engineRef.current as any).settings.tiltEnabled = nextTilt;
      }
      return { ...prev, tiltEnabled: nextTilt };
    });
  };

  const handleToggleRepulsion = () => {
    setSettings(prev => {
      const nextRepulsion = !prev.mouseRepulsion;
      if (engineRef.current) {
        (engineRef.current as any).settings.mouseRepulsion = nextRepulsion;
      }
      return { ...prev, mouseRepulsion: nextRepulsion };
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Awwwards Luxury HUD Overlay */}
      <AwwwardsOverlay
        currentWord={currentWord}
        currentStepIndex={currentStepIndex}
        settings={settings}
        onSelectWord={handleSelectWord}
        onPrevWord={handlePrevWord}
        onNextWord={handleNextWord}
        onTogglePlay={handleTogglePlay}
        onUpdateTheme={handleUpdateTheme}
        onToggleSound={handleToggleSound}
        onToggleTilt={handleToggleTilt}
        onToggleRepulsion={handleToggleRepulsion}
      />
    </div>
  );
}
