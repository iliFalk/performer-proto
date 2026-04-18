import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * ARC Data Card Component
 * 7.3 Data Card - Layer: Content (1) | Level: Molecule
 */

interface CardProps extends HTMLMotionProps<"div"> {
    loading?: boolean;
    error?: boolean;
    active?: boolean;
    children: React.ReactNode;
}

export const Card = ({
    loading = false,
    error = false,
    active = false,
    children,
    className,
    ...props
}: CardProps) => {
    return (
        <motion.div
            className={cn(
                "glass-standard rounded-arc-panel p-arc-4 transition-all duration-normal",
                "border border-arc-border-medium",
                active && "border-arc-primary shadow-arc-glow-subtle",
                error && "border-arc-color-caution", // Spec says --arc-color-warn which map to caution in my system
                "hover:brightness-110 hover:shadow-arc-glow-subtle focus-within:shadow-arc-glow-focus",
                loading && "animate-scan",
                className
            )}
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

/* --- Sub-Components --- */

const Header = ({ 
    title, 
    icon: Icon, 
    status, 
    className 
}: { 
    title: string; 
    icon?: LucideIcon; 
    status?: React.ReactNode; 
    className?: string;
}) => (
    <div className={cn("mb-arc-3", className)}>
        <div className="flex items-center justify-between mb-arc-2">
            <div className="flex items-center gap-arc-3">
                {Icon && <Icon className="w-4 h-4 text-arc-primary" />}
                <h3 className="font-display font-semibold text-h4 uppercase tracking-widest text-arc-text-high">
                    {title}
                </h3>
            </div>
            {status && (
                <div className="text-data-micro">
                    {status}
                </div>
            )}
        </div>
        <div className="relative h-[1px] w-full bg-arc-border-medium overflow-hidden">
            <div className="absolute inset-0 bg-arc-primary/30 blur-[2px] animate-pulse" />
        </div>
    </div>
);

const Content = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("py-arc-2", className)}>
        {children}
    </div>
);

const Footer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("mt-arc-4 flex items-center justify-between border-t border-arc-border-subtle pt-arc-3", className)}>
        {children}
    </div>
);

Card.Header = Header;
Card.Content = Content;
Card.Footer = Footer;

/* --- Specialized Variants --- */

export const StatCard = ({
    title,
    value,
    label,
    trend,
    icon,
    trendValue,
    ...props
}: {
    title: string;
    value: string | number;
    label: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: LucideIcon;
} & CardProps) => {
    return (
        <Card {...props}>
            <Card.Header title={title} icon={icon} />
            <Card.Content>
                <div className="flex flex-col gap-arc-1">
                    <div className="text-[32px] font-display font-extrabold text-arc-primary tracking-tight">
                        {value}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-data-micro text-arc-text-low uppercase tracking-wider">{label}</span>
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-arc-1 text-data-micro font-bold",
                                trend === 'up' && "text-arc-color-ok",
                                trend === 'down' && "text-arc-color-critical",
                                trend === 'neutral' && "text-arc-text-subtle"
                            )}>
                                {trend === 'up' && <TrendingUp size={12} />}
                                {trend === 'down' && <TrendingDown size={12} />}
                                {trend === 'neutral' && <Minus size={12} />}
                                {trendValue}
                            </div>
                        )}
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
};

export const StatusCard = ({
    title,
    message,
    status = 'ok',
    icon: Icon,
    ...props
}: {
    title: string;
    message: string;
    status?: 'ok' | 'caution' | 'critical' | 'info';
    icon?: LucideIcon;
} & CardProps) => {
    const statusColors = {
        ok: 'text-arc-color-ok border-arc-color-ok/30',
        caution: 'text-arc-color-caution border-arc-color-caution/30',
        critical: 'text-arc-color-critical border-arc-color-critical/30',
        info: 'text-arc-primary border-arc-primary/30'
    };

    return (
        <Card {...props} className={cn(status !== 'ok' && `border-l-4`, props.className)}>
            <div className="flex gap-arc-4">
                {Icon && (
                    <div className={cn("p-arc-3 rounded-arc-control bg-arc-bg-layer-2 border", statusColors[status])}>
                        <Icon size={24} />
                    </div>
                )}
                <div className="flex-1">
                    <h4 className="font-display font-bold text-arc-text-high uppercase tracking-wider mb-arc-1">{title}</h4>
                    <p className="text-data-s text-arc-text-low leading-relaxed">{message}</p>
                </div>
            </div>
        </Card>
    );
};
