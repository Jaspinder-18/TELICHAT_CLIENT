import React from 'react';

export const PasswordStrengthMeter = ({ password }) => {
  const checkStrength = (pass) => {
    let score = 0;
    if (!pass) return { score, label: 'Empty', color: 'bg-gray-700' };

    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: 'Very Weak', color: 'bg-red-500', width: '25%' };
      case 2:
        return { score, label: 'Weak', color: 'bg-orange-500', width: '50%' };
      case 3:
        return { score, label: 'Strong', color: 'bg-yellow-500', width: '75%' };
      case 4:
        return { score, label: 'Very Strong', color: 'bg-green-500', width: '100%' };
      default:
        return { score: 0, label: 'Empty', color: 'bg-gray-700', width: '0%' };
    }
  };

  const strength = checkStrength(password);

  return (
    <div className="mt-2 w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Password Strength:</span>
        <span className={strength.score <= 1 ? 'text-red-400' : strength.score === 2 ? 'text-orange-400' : strength.score === 3 ? 'text-yellow-400' : 'text-green-400'}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: strength.width || '0%' }}
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
        Must be at least 8 characters, include upper/lowercase, numbers, and special symbols.
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
