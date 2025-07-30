/**
 * Select Components
 * Dropdown select component with options
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export const Select: React.FC<SelectProps> = ({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = ''
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue);
    } else {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    }
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  children,
  className = '',
  placeholder = 'Select an option'
}) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectTrigger must be used within Select');
  }

  const { open, setOpen } = context;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    setOpen(!open);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(!open);
    }
  };

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'border-gray-300 bg-white hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="truncate">
        {children || <span className="text-gray-500">{placeholder}</span>}
      </span>
      <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder = 'Select an option',
  className = ''
}) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectValue must be used within Select');
  }

  const { value } = context;

  return (
    <span className={cn('truncate', className)}>
      {value || <span className="text-gray-500">{placeholder}</span>}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: 'popper' | 'item-aligned';
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
  position = 'popper'
}) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectContent must be used within Select');
  }

  const { open, setOpen } = context;
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        'mt-1 border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  children,
  value,
  className = '',
  disabled = false
}) => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('SelectItem must be used within Select');
  }

  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onValueChange(value);
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'hover:bg-gray-100 focus:bg-gray-100',
        isSelected && 'bg-gray-100',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
};

interface SelectSeparatorProps {
  className?: string;
}

export const SelectSeparator: React.FC<SelectSeparatorProps> = ({
  className = ''
}) => {
  return (
    <div className={cn('-mx-1 my-1 h-px bg-muted', 'bg-gray-200', className)} />
  );
};

interface SelectLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectLabel: React.FC<SelectLabelProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', 'text-gray-900', className)}>
      {children}
    </div>
  );
};