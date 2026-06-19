'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface DailyPercentageMeterProps {
  percentage: number;       // 0–1 (can exceed 1 for bonus)
  projectedPayout: number;
  monthlySalary: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function DailyPercentageMeter({
  percentage,
  projectedPayout,
  monthlySalary,
  label = 'Daily Target',
  size = 'lg',
}: DailyPercentageMeterProps) {
  const arcRef = useRef<SVGPathElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const payoutTextRef = useRef<HTMLSpanElement>(null);

  const sizes = {
    sm: { svgSize: 120, stroke: 8, r: 46 },
    md: { svgSize: 160, stroke: 10, r: 62 },
    lg: { svgSize: 200, stroke: 12, r: 80 },
  };

  const { svgSize, stroke, r } = sizes[size];
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const circumference = 2 * Math.PI * r;
  const arcAngle = 220; // degrees of arc (not full circle)
  const arcLength = (arcAngle / 360) * circumference;

  // Calculate color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 1.0) return 'hsl(162 100% 50%)';  // Mint green - complete
    if (pct >= 0.75) return 'hsl(234 89% 74%)';  // Blue - good progress
    if (pct >= 0.5) return 'hsl(43 96% 56%)';     // Gold - halfway
    if (pct >= 0.25) return 'hsl(38 100% 56%)';   // Orange - low
    return 'hsl(0 84% 60%)';                       // Red - critical
  };

  const color = getColor(percentage);
  const cappedPct = Math.min(percentage, 1.05); // Cap visual at 105%

  useEffect(() => {
    const arc = arcRef.current;
    const percentText = percentTextRef.current;
    const payoutText = payoutTextRef.current;
    if (!arc || !percentText || !payoutText) return;

    const targetOffset = arcLength - (Math.min(cappedPct, 1) * arcLength);

    gsap.fromTo(
      arc,
      { strokeDashoffset: arcLength },
      {
        strokeDashoffset: targetOffset,
        duration: 1.8,
        ease: 'power3.out',
      }
    );

    const pctObj = { val: 0 };
    gsap.to(pctObj, {
      val: percentage * 100,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate() {
        if (percentText) {
          percentText.textContent = `${Math.round(pctObj.val)}%`;
        }
      },
    });

    const payoutObj = { val: 0 };
    gsap.to(payoutObj, {
      val: projectedPayout,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate() {
        if (payoutText) {
          payoutText.textContent = `₹${Math.round(payoutObj.val).toLocaleString('en-IN')}`;
        }
      },
    });
  }, [percentage, projectedPayout, arcLength, cappedPct]);

  // SVG arc path for the track
  const startAngle = -220 / 2; // Start from bottom-left
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const describeArc = (startDeg: number, endDeg: number) => {
    const start = {
      x: cx + r * Math.cos(toRad(startDeg - 90)),
      y: cy + r * Math.sin(toRad(startDeg - 90)),
    };
    const end = {
      x: cx + r * Math.cos(toRad(endDeg - 90)),
      y: cy + r * Math.sin(toRad(endDeg - 90)),
    };
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const trackPath = describeArc(-110, 110);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="overflow-visible">
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="hsl(220 20% 14%)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <path
            ref={arcRef}
            d={trackPath}
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength}
            filter="url(#glow)"
            style={{ transition: 'stroke 0.5s ease' }}
          />

          {/* Percentage text */}
          <foreignObject
            x={cx - 60}
            y={cy - 36}
            width={120}
            height={72}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span
                ref={percentTextRef}
                className="font-display font-bold text-text-primary"
                style={{
                  fontSize: size === 'lg' ? '32px' : size === 'md' ? '24px' : '18px',
                  lineHeight: 1,
                  color: color,
                  filter: `drop-shadow(0 0 12px ${color}60)`,
                }}
              >
                0%
              </span>
              <span className="text-xs text-text-muted mt-1">{label}</span>
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Payout display */}
      <div className="text-center mt-2">
        <span
          ref={payoutTextRef}
          className="font-display font-bold text-lg"
          style={{ color }}
        >
          ₹0
        </span>
        <p className="text-xs text-text-muted">of ₹{Math.round(monthlySalary / 30).toLocaleString('en-IN')} today</p>
      </div>

      {/* Status bar */}
      <div className="w-full mt-3 bg-surface-elevated rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(percentage * 100, 100)}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}
