import React, { useState, useEffect, useRef } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';

export const Captcha = ({ onChange }) => {
  const [code, setCode] = useState('');
  const canvasRef = useRef(null);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
    if (onChange) onChange(result);
  };

  useEffect(() => {
    generateCode();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 150, 45);

    // Background styling
    ctx.fillStyle = '#1e293b'; // Slate 800 dark color
    ctx.fillRect(0, 0, 150, 45);

    // Distorting noise lines
    ctx.strokeStyle = '#3b82f6'; // Blue 500
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 150, Math.random() * 45);
      ctx.lineTo(Math.random() * 150, Math.random() * 45);
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.stroke();
    }

    // Text rendering
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < code.length; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 75%, 70%)`; // Dynamic colors
      const x = 12 + i * 22;
      const y = 20 + Math.random() * 10;
      const angle = (Math.random() - 0.5) * 0.4; // Rotation

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  }, [code]);

  return (
    <div className="flex items-center gap-3">
      <canvas
        ref={canvasRef}
        width="150"
        height="45"
        className="rounded border border-gray-700 select-none pointer-events-none"
      />
      <button
        type="button"
        onClick={generateCode}
        className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-tg-blue transition-colors duration-150"
        title="Refresh CAPTCHA"
      >
        <RefreshIcon fontSize="small" />
      </button>
    </div>
  );
};

export default Captcha;
