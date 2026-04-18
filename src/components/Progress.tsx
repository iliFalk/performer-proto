import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

/**
 * ARC Progress Ring & Status Bar
 * 7.5 Layer: Content (1) | Level: Molecule
 */

interface ProgressRingProps {
    value: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    label?: string;
    className?: string;
}

export const ProgressRing = ({
    value,
    size = 120,
    strokeWidth = 8,
    label,
    className
}: ProgressRingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    // Threshold logic for colors
    const colorClass = value > 90 
        ? 'text-arc-color-critical' 
        : value > 70 
        ? 'text-arc-color-caution' 
        : 'text-arc-primary';

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Track */}
                <circle
                    className="text-arc-bg-layer-2"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Fill */}
                <motion.circle
                    className={cn(colorClass, "transition-colors duration-normal")}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: [0, 0, 0.2, 1] }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    // Add glow filter or tip effect
                    filter="drop-shadow(0 0 8px currentColor)"
                />
            </svg>
            
            {/* Central Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
                <span className="text-[28px] font-display font-extrabold text-arc-text-high leading-none">
                    {Math.round(value)}%
                </span>
                {label && (
                    <span className="text-data-micro text-arc-text-low mt-arc-1 uppercase tracking-widest">
                        {label}
                    </span>
                )}
            </div>
            
            {/* Technical Tip Glow */}
            <div 
                className={cn("absolute w-2 h-2 rounded-full bg-white shadow-arc-glow-active transition-all duration-normal", colorClass)}
                style={{
                    transform: `rotate(${ (value / 100) * 360 - 90 }deg) translateY(-${radius}px)`,
                    opacity: value > 0 ? 1 : 0
                }}
            />
        </div>
    );
};

interface StatusBarProps {
    value?: number; // 0 to 100, undefined for infinite mode
    label?: string;
    infinite?: boolean;
    className?: string;
}

export const StatusBar = ({
    value = 0,
    label,
    infinite = false,
    className
}: StatusBarProps) => {
    return (
        <div className={cn("flex flex-col gap-arc-2 w-full", className)}>
            {(label || !infinite) && (
                <div className="flex justify-between items-end px-arc-1">
                    <span className="text-data-micro text-arc-text-low uppercase tracking-widest">{label}</span>
                    {!infinite && (
                        <span className="text-data-label text-arc-text-data font-mono">{Math.round(value)} %</span>
                    )}
                </div>
            )}
            
            <div className="relative h-2 w-full bg-arc-bg-layer-2 rounded-arc-pill overflow-hidden border border-arc-border-medium shadow-inner">
                {/* Background Shadow Fill Effect */}
                <div className="absolute inset-0 opacity-10 bg-arc-primary" />
                
                {/* Main Progress Bar */}
                {infinite ? (
                    <div className="absolute inset-0 flex items-center">
                        <div className="h-full w-full opacity-20 bg-arc-primary" />
                        {/* Particles Stream */}
                        {[...Array(6)].map((_, i) => (
                            <div 
                                key={i}
                                className="absolute h-1 w-8 bg-arc-primary rounded-full blur-[1px] animate-particle-stream"
                                style={{ 
                                    animationDelay: `${i * 0.4}s`,
                                    left: '-10%'
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        className="absolute inset-y-0 left-0"
                        style={{ background: 'var(--arc-gradient-energy)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
                    >
                        {/* Energy Particles inside the fill */}
                        <div className="absolute inset-0 overflow-hidden mix-blend-overlay">
                            {[...Array(4)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute h-full w-12 bg-white/20 animate-particle-stream"
                                    style={{ animationDelay: `${i * 0.6}s` }}
                                />
                            ))}
                        </div>
                        {/* Glow Tip */}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-arc-glow-active" />
                    </motion.div>
                )}
            </div>
            
            {/* Dynamic Status Text if needed */}
        </div>
    );
};
