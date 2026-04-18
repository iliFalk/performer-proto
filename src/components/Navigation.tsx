import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LucideIcon, User, Settings, Bell, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * ARC Navigation Components
 * 7.6 Layer: Control (2) | Level: Organism
 */

export interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    href?: string;
}

interface NavProps {
    items: NavItem[];
    activeId?: string;
    onNavigate?: (id: string) => void;
    className?: string;
}

/* --- Top Bar --- */
export const TopBar = ({ items, activeId, onNavigate, className }: NavProps) => {
    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 h-16 glass-heavy z-50 flex items-center justify-between px-arc-6 border-b border-arc-border-medium",
            className
        )}>
            {/* Logo Section */}
            <div className="flex items-center gap-arc-3">
                <div className="w-8 h-8 rounded-arc-control bg-arc-primary flex items-center justify-center shadow-arc-glow-subtle">
                    <span className="font-display font-black text-arc-bg-ambient text-xl">A</span>
                </div>
                <span className="font-display font-bold text-h3 tracking-tighter text-arc-text-high">ARC SYSTEM</span>
            </div>

            {/* Navigation Items (Center) */}
            <div className="hidden lg:flex items-center gap-arc-8">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate?.(item.id)}
                        className={cn(
                            "relative py-2 font-display uppercase tracking-widest text-[14px] transition-all duration-quick hover:text-arc-primary",
                            activeId === item.id ? "text-arc-primary" : "text-arc-text-low"
                        )}
                    >
                        {item.label}
                        {activeId === item.id && (
                            <motion.div 
                                layoutId="topbar-active"
                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-arc-primary shadow-arc-glow-active" 
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* User / Status (Right) */}
            <div className="flex items-center gap-arc-5">
                <button className="text-arc-text-low hover:text-arc-primary transition-colors">
                    <Bell size={20} />
                </button>
                <div className="h-4 w-[1px] bg-arc-border-medium hidden sm:block" />
                <button className="flex items-center gap-arc-2 pl-arc-2 group">
                    <div className="w-8 h-8 rounded-full border border-arc-border-medium flex items-center justify-center group-hover:border-arc-primary group-hover:shadow-arc-glow-subtle transition-all">
                        <User size={18} className="text-arc-text-low group-hover:text-arc-primary" />
                    </div>
                </button>
            </div>
        </nav>
    );
};

/* --- Sidebar --- */
export const Sidebar = ({ items, activeId, onNavigate, className }: NavProps) => {
    return (
        <aside className={cn(
            "fixed left-0 top-16 bottom-0 w-20 lg:w-64 glass-heavy border-r border-arc-border-medium z-40 transition-all duration-normal",
            className
        )}>
            <div className="flex flex-col gap-arc-2 p-arc-3 pt-arc-6">
                {items.map((item) => {
                    const isActive = activeId === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate?.(item.id)}
                            className={cn(
                                "group relative flex items-center gap-arc-4 p-arc-3 rounded-arc-control transition-all duration-quick text-left",
                                "hover:bg-white/5",
                                isActive 
                                    ? "bg-arc-primary/10 text-arc-color-primary-strong shadow-arc-glow-subtle" 
                                    : "text-arc-text-low hover:text-arc-primary"
                            )}
                        >
                            <Icon size={24} className={cn("transition-transform group-active:scale-95", isActive && "animate-pulse-arc")} />
                            <span className={cn(
                                "font-display font-medium uppercase tracking-widest overflow-hidden transition-all duration-normal hidden lg:block",
                                isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                            )}>
                                {item.label}
                            </span>
                            
                            {/* Active Side Indicator */}
                            {isActive && (
                                <motion.div 
                                    layoutId="sidebar-active-indicator"
                                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-arc-primary rounded-full shadow-arc-glow-active" 
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            
            <div className="absolute bottom-arc-6 left-0 right-0 px-arc-3">
                <button className="w-full flex items-center gap-arc-4 p-arc-3 text-arc-text-low hover:text-arc-primary transition-all">
                    <Settings size={24} />
                    <span className="font-display font-medium uppercase tracking-widest hidden lg:block">Settings</span>
                </button>
            </div>
        </aside>
    );
};

/* --- Mobile Bottom Nav --- */
export const MobileNav = ({ items, activeId, onNavigate, className }: NavProps) => {
    return (
        <nav className={cn(
            "md:hidden fixed bottom-0 left-0 right-0 h-[72px] glass-heavy border-t border-arc-border-medium z-50 flex items-center justify-around px-arc-2",
            className
        )}>
            {items.slice(0, 5).map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => onNavigate?.(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center min-w-[64px] h-full transition-all duration-quick",
                            isActive ? "text-arc-primary" : "text-arc-text-low hover:text-arc-primary/70"
                        )}
                    >
                        <div className={cn(
                            "relative p-2 rounded-full transition-all",
                            isActive && "bg-arc-primary/10 shadow-arc-glow-subtle"
                        )}>
                            <Icon size={24} className={cn(isActive && "animate-pulse-arc")} />
                        </div>
                        <AnimatePresence>
                            {isActive && (
                                <motion.span 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="text-[10px] font-display font-bold uppercase tracking-widest mt-1"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                );
            })}
        </nav>
    );
};
