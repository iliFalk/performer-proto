import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * ARC Input Field Component
 * 7.2 Input Field - Layer: Control (2) | Level: Atom
 */

type InputVariant = 'text' | 'password' | 'search' | 'textarea';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    variant?: InputVariant;
    error?: string;
    valid?: boolean;
    helperText?: string;
    hideLabel?: boolean;
    autoGrow?: boolean; // For textarea
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
    label,
    variant = 'text',
    error,
    valid,
    helperText,
    hideLabel,
    autoGrow,
    className,
    disabled,
    type,
    id,
    onFocus,
    onBlur,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `arc-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const errorId = `${inputId}-error`;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const isTextarea = variant === 'textarea';
    const InputComponent = isTextarea ? 'textarea' : 'input';
    
    // Correct type for password variant
    const inputType = variant === 'password' ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className={cn("flex flex-col gap-arc-1 w-full group", className)}>
            {/* Label Section */}
            <label 
                htmlFor={inputId}
                className={cn(
                    "text-data-micro uppercase tracking-widest transition-colors duration-quick",
                    isFocused ? "text-arc-primary" : "text-arc-text-low",
                    hideLabel && "sr-only"
                )}
            >
                {label}
            </label>

            {/* Input Container */}
            <div className="relative flex items-center">
                {/* Search Icon */}
                {variant === 'search' && (
                    <Search className="absolute left-arc-3 w-4 h-4 text-arc-text-low pointer-events-none" />
                )}

                <InputComponent
                    id={inputId}
                    ref={ref as any}
                    type={isTextarea ? undefined : inputType}
                    disabled={disabled}
                    className={cn(
                        // Base Material
                        "w-full bg-arc-bg-glass backdrop-blur-md text-arc-text-high text-[16px] transition-all duration-quick",
                        "border-b border-arc-border-medium rounded-t-sm",
                        "placeholder:text-arc-text-subtle/50 font-sans",
                        
                        // Dimensions
                        isTextarea ? "min-h-[100px] py-arc-3 px-arc-4 resize-none" : "h-10 px-arc-4",
                        variant === 'search' && "pl-arc-10",
                        (variant === 'password' || props.value) && "pr-arc-10",

                        // Focus State
                        "focus:outline-none focus:bg-arc-bg-glass/80 focus:border-arc-primary",
                        isFocused && "animate-line-pulse",

                        // Cursor Style (Oscilloscope feel)
                        "caret-arc-primary",

                        // Status
                        valid && "border-arc-color-ok",
                        error && "border-arc-color-critical",
                        disabled && "opacity-40 cursor-not-allowed",
                    )}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={!!error}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...(props as any)}
                />

                {/* Status Icons / Actions */}
                <div className="absolute right-arc-3 flex items-center gap-arc-2">
                    {variant === 'password' && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 hover:text-arc-primary transition-colors text-arc-text-low"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    )}
                    
                    {valid && !error && (
                        <Check className="w-4 h-4 text-arc-color-ok" />
                    )}

                    {error && (
                        <AlertCircle className="w-4 h-4 text-arc-color-critical" />
                    )}
                </div>
            </div>

            {/* Error / Helper Text */}
            <AnimatePresence>
                {error ? (
                    <motion.p 
                        id={errorId}
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-data-micro text-arc-color-critical flex items-center gap-arc-2"
                    >
                        {error}
                    </motion.p>
                ) : helperText && (
                    <p className="text-data-micro text-arc-text-subtle">
                        {helperText}
                    </p>
                )}
            </AnimatePresence>
        </div>
    );
});

Input.displayName = 'Input';
