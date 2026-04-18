import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils'; // Assuming cn utility might exist or I should create it

/**
 * ARC Button Component
 * 7.1 Button - Layer: Control (2) | Level: Atom
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
type ButtonSize = 's' | 'm' | 'l';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    success?: boolean;
    error?: boolean;
    icon?: LucideIcon;
    children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'm',
    loading = false,
    success = false,
    error = false,
    icon: Icon,
    children,
    className,
    disabled,
    ...props
}, ref) => {
    
    // Base classes
    const baseClasses = "relative overflow-hidden inline-flex items-center justify-center font-display font-medium uppercase tracking-[0.08em] transition-all duration-quick focus:outline-none disabled:opacity-40 disabled:pointer-events-none";
    
    // Variant classes
    const variantClasses: Record<ButtonVariant, string> = {
        primary: "bg-arc-primary text-arc-bg-ambient shadow-arc-card hover:bg-arc-primary-strong hover:shadow-arc-glow-subtle",
        secondary: "bg-transparent border border-arc-primary text-arc-primary hover:bg-arc-primary/10 hover:shadow-arc-glow-subtle",
        ghost: "bg-transparent text-arc-primary hover:bg-arc-primary/5 hover:shadow-arc-glow-subtle",
        icon: "rounded-full p-2 text-arc-primary hover:bg-arc-primary/10 hover:shadow-arc-glow-subtle"
    };

    // Size classes
    const sizeClasses: Record<ButtonSize, string> = {
        s: "h-8 px-arc-3 text-[14px] rounded-arc-control",
        m: "h-10 px-arc-4 text-[16px] rounded-arc-control",
        l: "h-12 px-arc-6 text-[18px] rounded-arc-control"
    };

    // Status classes
    const statusClasses = cn(
        success && "border-arc-color-ok shadow-arc-glow-active text-arc-color-ok",
        error && "border-arc-color-critical shadow-arc-glow-critical text-arc-color-critical animate-shake",
    );

    // Focus and feedback
    const feedbackClasses = "focus-visible:ring-2 focus-visible:ring-arc-primary-strong focus-visible:shadow-arc-glow-focus";

    const combinedClassName = cn(
        baseClasses,
        variant !== 'icon' && sizeClasses[size],
        variantClasses[variant],
        statusClasses,
        feedbackClasses,
        className
    );

    return (
        <motion.button
            ref={ref}
            className={combinedClassName}
            disabled={disabled || loading}
            aria-disabled={disabled || loading}
            whileTap={{ y: 2, scale: 0.98 }}
            {...props}
        >
            {loading ? (
                <div className="flex items-center gap-arc-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-data-micro">PROCESSING</span>
                </div>
            ) : (
                <div className="flex items-center gap-arc-2">
                    {Icon && <Icon className={variant === 'icon' ? "w-5 h-5" : "w-4 h-4"} />}
                    {variant !== 'icon' && children}
                </div>
            )}
            
            {/* Specular highlight for glass feel if primary/secondary? 
                The spec didn't ask for it explicitly but ARC style likes it.
                I'll keep it simple for now to strictly follow 7.1.
            */}
        </motion.button>
    );
});

Button.displayName = 'Button';
