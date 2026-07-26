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

  // Load the clean SVG file from public directory
  const IconMark = (
    <img
      src="/logo.svg"
      alt="FinFlow Logo Icon"
      width={iconPx}
      height={iconPx}
      style={{
        width: `${iconPx}px`,
        height: `${iconPx}px`,
        display: 'block',
        flexShrink: 0,
        filter: 'drop-shadow(0px 2px 8px rgba(0, 245, 212, 0.35))',
      }}
    />
  );

  if (variant === 'icon') {
    return <div className={`finflow-logo-container ${className}`}>{IconMark}</div>;
  }

  const textFontSize =
    typeof size === 'number'
      ? `${size * 0.55}px`
      : size === 'sm'
      ? '1.25rem'
      : size === 'lg'
      ? '2.5rem'
      : '1.75rem';

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
                fontSize:
                  typeof size === 'number'
                    ? `${size * 0.18}px`
                    : size === 'sm'
                    ? '0.55rem'
                    : size === 'lg'
                    ? '0.85rem'
                    : '0.65rem',
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
