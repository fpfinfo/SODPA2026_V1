'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Settings, 
  Smile, 
  User,
  Inbox,
  LogOut,
  LayoutDashboard,
  Search,
  FileText
} from 'lucide-react';
import { AppRole } from '../types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (module: AppRole) => void;
  onSignOut: () => void;
  onProfile: () => void;
  onPreferences: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onSignOut,
  onProfile,
  onPreferences
}: CommandPaletteProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Don't render the dialog at all when closed to avoid backdrop issues
  if (!open) return null;

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global Command Menu"
      className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[640px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="flex items-center border-b border-slate-100 px-4">
        <Search className="w-5 h-5 text-slate-400 mr-3" />
        <Command.Input 
          autoFocus
          placeholder="O que você precisa?"
          className="flex h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-400 font-medium" 
        />
        <div className="flex items-center gap-1">
             <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-500 opacity-100">
                <span className="text-xs">ESC</span>
            </kbd>
        </div>
      </div>
      
      <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
        <Command.Empty className="py-6 text-center text-sm text-slate-500">
          Nenhum resultado encontrado.
        </Command.Empty>

        <Command.Group heading="Navegação Rápida" className="px-2 py-1.5 text-xs font-semibold text-slate-400 mb-2">
          <Command.Item 
            onSelect={() => { onNavigate(AppRole.SUPRIDO); onOpenChange(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-600"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Módulo Suprido</span>
          </Command.Item>
          <Command.Item 
            onSelect={() => { onNavigate(AppRole.GESTOR); onOpenChange(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-600"
          >
            <User className="w-4 h-4" />
            <span>Painel do Gestor</span>
          </Command.Item>
          <Command.Item 
            onSelect={() => { onNavigate(AppRole.SOSFU); onOpenChange(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-600"
          >
            <Inbox className="w-4 h-4" />
            <span>Dashboard SOSFU</span>
          </Command.Item>
          <Command.Item 
            onSelect={() => { onNavigate(AppRole.SEFIN); onOpenChange(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-blue-600 cursor-pointer transition-colors aria-selected:bg-blue-50 aria-selected:text-blue-600"
          >
            <CreditCard className="w-4 h-4" />
            <span>Módulo SEFIN</span>
          </Command.Item>
        </Command.Group>

        <Command.Separator className="h-px bg-slate-100 my-1 bg-slate-200" />

        <Command.Group heading="Sistema" className="px-2 py-1.5 text-xs font-semibold text-slate-400 mb-2">
          <Command.Item 
             onSelect={() => { onProfile(); onOpenChange(false); }}
             className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-purple-600 cursor-pointer transition-colors aria-selected:bg-purple-50 aria-selected:text-purple-600"
          >
            <User className="w-4 h-4" />
            <span>Meu Perfil</span>
          </Command.Item>
          <Command.Item 
             onSelect={() => { onPreferences(); onOpenChange(false); }}
             className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors aria-selected:bg-slate-100"
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </Command.Item>
        </Command.Group>

        <Command.Separator className="h-px bg-slate-100 my-1 bg-slate-200" />
        
        <Command.Group heading="Ações" className="px-2 py-1.5 text-xs font-semibold text-slate-400 mb-2">
            <Command.Item 
                onSelect={() => { onSignOut(); onOpenChange(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors aria-selected:bg-red-50 aria-selected:text-red-700"
            >
                <LogOut className="w-4 h-4" />
                <span>Sair do Sistema</span>
            </Command.Item>
        </Command.Group>
      </Command.List>

      <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
           <span>Power Mode</span>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
            <span>Use</span> 
            <kbd className="inline-flex items-center rounded border border-slate-200 px-1 font-mono font-medium text-slate-500">↑</kbd>
            <kbd className="inline-flex items-center rounded border border-slate-200 px-1 font-mono font-medium text-slate-500">↓</kbd>
            <span>para navegar</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
