import React from 'react';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon';
  size?: 'sm' | 'md' | 'lg' | number;
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  // Determine pixel sizes based on prop
  const getIconSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 64;
      case 'md':
      default:
        return 42;
    }
  };

  const iconPx = getIconSize();

  // SVG Icon Mark matching the FinFlow logo image
  const IconMark = (
    <svg
      width={iconPx}
      height={iconPx}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="finflow-logo-svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Outer Circular Arc Gradient */}
        <linearGradient id="ff-arc-grad" x1="20%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#00D2B8" />
          <stop offset="60%" stopColor="#00A896" />
          <stop offset="100%" stopColor="#0A2540" />
        </linearGradient>

        {/* Arrow & Bars Teal Gradient */}
        <linearGradient id="ff-teal-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00A896" />
          <stop offset="50%" stopColor="#00C9A7" />
          <stop offset="100%" stopColor="#00E5BF" />
        </linearGradient>

        {/* Main F Navy Gradient */}
        <linearGradient id="ff-f-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="40%" stopColor="#0F2C59" />
          <stop offset="100%" stopColor="#0B192C" />
        </linearGradient>
      </defs>

      {/* Outer Circular Swoosh Arc */}
      <path
        d="M 65 48 
           C 85 18, 142 16, 160 46 
           C 176 72, 174 116, 146 142 
           C 122 164, 76 166, 56 142 
           C 50 135, 68 140, 88 136 
           C 122 128, 150 102, 144 70 
           C 138 42, 108 28, 76 38 
           C 66 41, 58 46, 65 48 Z"
        fill="url(#ff-arc-grad)"
      />

      {/* Stylized Bold 'F' */}
      <path
        d="M 62 52 
           H 136 
           C 142 52, 142 63, 134 63 
           H 92 
           L 87 90 
           H 116 
           C 122 90, 122 99, 116 99 
           H 85 
           L 72 148 
           C 68 162, 54 158, 56 146 
           L 78 63 
           H 62 
           C 56 63, 56 52, 62 52 Z"
        fill="url(#ff-f-grad)"
      />

      {/* Growth Chart Bars inside F loop */}
      <rect x="94" y="118" width="11" height="18" rx="2.5" fill="url(#ff-teal-grad)" />
      <rect x="110" y="110" width="11" height="26" rx="2.5" fill="url(#ff-teal-grad)" />
      <rect x="126" y="100" width="11" height="36" rx="2.5" fill="url(#ff-teal-grad)" />
      <rect x="142" y="88" width="11" height="48" rx="2.5" fill="url(#ff-teal-grad)" />

      {/* Upward Arrow Swoosh */}
      <path
        d="M 82 128 Q 115 116, 146 76"
        stroke="url(#ff-teal-grad)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M 132 75 L 152 72 L 146 92 Z"
        fill="url(#ff-teal-grad)"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`finflow-logo-container ${className}`}>{IconMark}</div>;
  }

  const textFontSize = typeof size === 'number' ? `${size * 0.55}px` : size === 'sm' ? '1.25rem' : size === 'lg' ? '2.5rem' : '1.75rem';

  return (
    <div
      className={`finflow-logo-container ${variant === 'full' ? 'logo-full-stack' : 'logo-horizontal'} ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: variant === 'full' ? 'column' : 'row',
        alignItems: 'center',
        gap: variant === 'full' ? '0.75rem' : '0.6rem',
      }}
    >
      {IconMark}

      <div
        className="finflow-logo-text-group"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: variant === 'full' ? 'center' : 'flex-start',
          lineHeight: 1,
        }}
      >
        <div
          className="finflow-brand-name"
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
            fontSize: textFontSize,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span className="brand-fin" style={{ color: 'var(--brand-fin-color, #0F2C59)' }}>
            Fin
          </span>
          <span className="brand-flow" style={{ color: '#00C9A7' }}>
            Flow
          </span>
        </div>

        {(showTagline || variant === 'full') && (
          <div
            className="finflow-tagline-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.35rem',
              width: '100%',
            }}
          >
            <span
              style={{
                flex: 1,
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent, #00C9A7)',
              }}
            />
            <span
              style={{
                fontSize: typeof size === 'number' ? `${size * 0.18}px` : size === 'sm' ? '0.55rem' : size === 'lg' ? '0.85rem' : '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#00C9A7',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              PLAN. TRACK. GROW.
            </span>
            <span
              style={{
                flex: 1,
                height: '1.5px',
                background: 'linear-gradient(90deg, #00C9A7, transparent)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
