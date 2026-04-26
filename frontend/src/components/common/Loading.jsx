import React from 'react';

const Loading = ({ 
  variant = 'academic', // 'academic', 'fluid', 'pulse', 'minimal'
  size = 'md',          // 'sm', 'md', 'lg'
  text = 'Loading...', 
  color = '#4f46e5'     // Primary theme color
}) => {

  // Responsive size mapping
  const sizeMap = {
    sm: { box: 40, font: '12px' },
    md: { box: 80, font: '14px' },
    lg: { box: 120, font: '16px' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Render different creative SVG loaders
  const renderLoader = () => {
    switch (variant) {
      case 'fluid':
        return (
          <svg width={currentSize.box} height={currentSize.box} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke={`${color}20`} strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray="250" strokeDashoffset="210" strokeLinecap="round"
              className="fluid-spin"
            />
            <circle cx="50" cy="50" r="20" fill={`${color}40`} className="fluid-pulse" />
          </svg>
        );

      case 'pulse':
        return (
          <svg width={currentSize.box} height={currentSize.box} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="10" fill={color} className="pulse-circle-1" />
            <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="4" className="pulse-circle-2" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={`${color}60`} strokeWidth="2" className="pulse-circle-3" />
          </svg>
        );

      case 'minimal':
        return (
          <svg width={currentSize.box} height={currentSize.box} viewBox="0 0 50 50">
            <style>
              {`
                .minimal-dash {
                  animation: dash 1.5s ease-in-out infinite, rotate 2s linear infinite;
                  stroke: ${color};
                }
                @keyframes dash {
                  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
                  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
                  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
                }
                @keyframes rotate { 100% { transform: rotate(360deg); } }
              `}
            </style>
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" className="minimal-dash" transform-origin="center" />
          </svg>
        );

      case 'academic':
      default:
        return (
          <div style={{ position: 'relative', width: currentSize.box, height: currentSize.box }}>
            {/* Pulsing Background ring */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px dashed ${color}40`,
              animation: 'spinClockwise 4s linear infinite'
            }} />
            
            {/* Core Animated cap icon */}
            <svg width="100%" height="100%" viewBox="0 0 64 64" className="academic-float" style={{ transformOrigin: 'center' }}>
              <path d="M32 16L12 26L32 36L52 26L32 16Z" fill={color} />
              <path d="M22 32V42C22 42 26 46 32 46C38 46 42 42 42 42V32" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="48" cy="40" r="3" fill={color} />
              <line x1="48" y1="28" x2="48" y2="40" stroke={color} strokeWidth="3" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '20px'
    }}>
      {/* Dynamic Keyframes Injection */}
      <style>
        {`
          @keyframes spinClockwise {
            to { transform: rotate(360deg); }
          }
          
          /* Fluid Variant Animations */
          .fluid-spin {
            transform-origin: center;
            animation: spinClockwise 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .fluid-pulse {
            transform-origin: center;
            animation: bounce 1.5s ease-in-out infinite;
          }

          /* Pulse Variant Animations */
          .pulse-circle-1 { transform-origin: center; animation: bounce 1s ease-in-out infinite; }
          .pulse-circle-2 { transform-origin: center; animation: ringPulse 1.5s ease-out infinite; }
          .pulse-circle-3 { transform-origin: center; animation: ringPulse 1.5s ease-out infinite 0.5s; }

          /* Academic Variant Floating */
          .academic-float {
            animation: float 2s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0) scale(0.95); }
            50% { transform: translateY(-8px) scale(1.05); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 1; }
          }

          @keyframes ringPulse {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.2); opacity: 0; }
          }

          .loading-text-glow {
            animation: textOpacity 1.5s ease-in-out infinite;
          }

          @keyframes textOpacity {
            0%, 100% { opacity: 0.4; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>

      {/* Render the selected Loader Graphic */}
      {renderLoader()}

      {/* Render Text with auto-pulsing glow */}
      {text && (
        <span 
          className="loading-text-glow" 
          style={{
            fontSize: currentSize.font,
            color: 'var(--text-secondary, #64748b)',
            fontWeight: 500,
            letterSpacing: '0.5px',
            fontFamily: 'sans-serif'
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default Loading;