import React, { useId } from 'react';

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
  // Generate a unique ID per instance to prevent SVG gradient ID collisions
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const arcGradId = `ff-arc-grad-${uid}`;
  const tealGradId = `ff-teal-grad-${uid}`;
  const fGradId = `ff-f-grad-${uid}`;

  // Determine pixel sizes based on prop
  const getIconSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 36;
      case 'lg':
        return 68;
      case 'md':
      default:
        return 46;
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
      style={{
        display: 'block',
        flexShrink: 0,
        filter: 'drop-shadow(0px 2px 8px rgba(0, 245, 212, 0.35))',
      }}
    >
      <defs>
        {/* Outer Circular Arc Gradient: Bright Electric Cyan to Blue */}
        <linearGradient id={arcGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5D4" />
          <stop offset="45%" stopColor="#00D2B8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Arrow & Bars Gradient: Vibrant Teal to Cyan */}
        <linearGradient id={tealGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00C9A7" />
          <stop offset="50%" stopColor="#00F5D4" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Main F Gradient: White to Sky Blue */}
        <linearGradient id={fGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F0F9FF" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Outer Circular Swoosh Arc */}
      <path
        d="M 60 45 
           C 82 14, 148 14, 166 45 
           C 182 72, 178 120, 148 148 
           C 120 172, 70 170, 50 144 
           C 44 136, 64 142, 86 138 
           C 124 130, 154 102, 148 68 
           C 142 38, 108 24, 74 35 
           C 62 39, 53 44, 60 45 Z"
        fill={`url(#${arcGradId})`}
      />

      {/* Stylized Bold 'F' */}
      <path
        d="M 58 50 
           H 138 
           C 145 50, 145 62, 136 62 
           H 90 
           L 84 92 
           H 118 
           C 125 92, 125 102, 118 102 
           H 82 
           L 68 152 
           C 64 166, 48 162, 52 148 
           L 76 62 
           H 58 
           C 50 62, 50 50, 58 50 Z"
        fill={`url(#${fGradId})`}
      />

      {/* Growth Chart Bars inside F loop */}
      <rect x="94" y="118" width="11" height="20" rx="3" fill={`url(#${tealGradId})`} />
      <rect x="110" y="108" width="11" height="30" rx="3" fill={`url(#${tealGradId})`} />
      <rect x="126" y="96" width="11" height="42" rx="3" fill={`url(#${tealGradId})`} />
      <rect x="142" y="82" width="11" height="56" rx="3" fill={`url(#${tealGradId})`} />

      {/* Upward Arrow Swoosh */}
      <path
        d="M 80 132 Q 116 118, 148 74"
        stroke={`url(#${tealGradId})`}
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <path
        d="M 134 72 L 156 70 L 148 92 Z"
        fill={`url(#${tealGradId})`}
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
        gap: variant === 'full' ? '0.75rem' : '0.65rem',
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
          <span className="brand-fin" style={{ color: 'var(--brand-fin-color, #ffffff)' }}>
            Fin
          </span>
          <span className="brand-flow" style={{ color: '#00F5D4' }}>
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
                background: 'linear-gradient(90deg, transparent, #00F5D4)',
              }}
            />
            <span
              style={{
                fontSize: typeof size === 'number' ? `${size * 0.18}px` : size === 'sm' ? '0.55rem' : size === 'lg' ? '0.85rem' : '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#00F5D4',
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
                background: 'linear-gradient(90deg, #00F5D4, transparent)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
