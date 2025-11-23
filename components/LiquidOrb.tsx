
import React, { useRef, useEffect } from 'react';
import { Emotion, EMOTION_COLORS } from '../types';

interface LiquidOrbProps {
  emotion: Emotion;
  volume: number; // 0.0 to 1.0
  isListening: boolean;
  theme: 'light' | 'dark';
}

const LiquidOrb: React.FC<LiquidOrbProps> = ({ emotion, volume, isListening, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  // We use refs to smoothly interpolate color over time, avoiding flicker
  const colorRef = useRef({ r: 55, g: 65, b: 81 }); 

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 100, g: 100, b: 100 };
  };

  const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!canvas || !ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Color Transition - VERY SLOW (0.01) to keep emotions on screen longer visually
      const targetHex = isListening ? EMOTION_COLORS[emotion] : (theme === 'light' ? '#d1d5db' : '#4b5563');
      const targetRgb = hexToRgb(targetHex);
      const transitionSpeed = 0.015; // Smooth, slow transition

      colorRef.current.r = lerp(colorRef.current.r, targetRgb.r, transitionSpeed);
      colorRef.current.g = lerp(colorRef.current.g, targetRgb.g, transitionSpeed);
      colorRef.current.b = lerp(colorRef.current.b, targetRgb.b, transitionSpeed);

      const r = Math.round(colorRef.current.r);
      const g = Math.round(colorRef.current.g);
      const b = Math.round(colorRef.current.b);
      const mainColor = `rgb(${r}, ${g}, ${b})`;

      ctx.clearRect(0, 0, width, height);

      // Animation parameters
      timeRef.current += 0.008 + (volume * 0.05); // Slower base movement
      const baseRadius = 140;
      const pulse = isListening ? volume * 30 : Math.sin(timeRef.current * 0.5) * 5;
      const currentRadius = baseRadius + pulse;

      // Draw Outer Glow (Halo)
      const gradient = ctx.createRadialGradient(centerX, centerY, currentRadius * 0.7, centerX, centerY, currentRadius * 1.6);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Draw Main Orb (Liquid/Blob effect)
      ctx.save();
      ctx.beginPath();
      
      const points = 120; // Smoother
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Smooth noise
        const xNoise = Math.cos(angle * 3 + timeRef.current);
        const yNoise = Math.sin(angle * 2 + timeRef.current * 1.5);
        const distortion = isListening ? (volume * 12) + 2 : 2;
        
        // Crashout adds jagged randomness
        const isCrashout = emotion === Emotion.Crashout && isListening;
        const rOffset = isCrashout 
            ? (Math.random() * 8) 
            : (xNoise + yNoise) * distortion;
            
        const x = centerX + Math.cos(angle) * (currentRadius + rOffset);
        const y = centerY + Math.sin(angle) * (currentRadius + rOffset);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // 3D Shading Gradient
      const orbGrad = ctx.createRadialGradient(centerX - 40, centerY - 40, 10, centerX, centerY, currentRadius);
      orbGrad.addColorStop(0, '#ffffff'); // Specular Highlight
      orbGrad.addColorStop(0.2, mainColor);
      orbGrad.addColorStop(0.7, `rgb(${r * 0.8}, ${g * 0.8}, ${b * 0.8})`);
      orbGrad.addColorStop(1, `rgb(${r * 0.4}, ${g * 0.4}, ${b * 0.4})`);

      ctx.fillStyle = orbGrad;
      ctx.fill();
      
      // Rim Light
      ctx.strokeStyle = `rgba(255,255,255, ${0.15 + (volume * 0.2)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [emotion, volume, isListening, theme]);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <div className={`relative w-96 h-96 flex items-center justify-center ${emotion === Emotion.Crashout && isListening ? 'animate-[shake_0.1s_ease-in-out_infinite]' : ''}`}>
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={500}
          className="w-full h-full"
        />
      </div>
      
      {/* Emotion Label - Slow fade in/out */}
      <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 text-center pointer-events-none transition-all duration-1000 ease-out z-20 w-max">
        <h2 className={`text-4xl font-black tracking-[0.2em] uppercase opacity-90 transition-all duration-700 ${isListening ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ 
              color: EMOTION_COLORS[emotion], 
              textShadow: `0 0 30px ${EMOTION_COLORS[emotion]}` 
            }}>
          {emotion}
        </h2>
      </div>
    </div>
  );
};

export default LiquidOrb;
