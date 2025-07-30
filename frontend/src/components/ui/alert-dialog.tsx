/**
 * Alert Dialog Components
 * Modal dialog for confirmations and alerts
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(null);

interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  children,
  open: controlledOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({
  children,
  asChild = false,
  className = ''
}) => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogTrigger must be used within AlertDialog');
  }

  const handleClick = () => {
    context.setOpen(true);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick
    });
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogContent: React.FC<AlertDialogContentProps> = ({
  children,
  className = ''
}) => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogContent must be used within AlertDialog');
  }

  const { open, setOpen } = context;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      
      {/* Dialog */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
};

interface AlertDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({
  children,
  className = ''
}) => {
  return (
    <h2 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h2>
  );
};

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({
  children,
  className = ''
}) => {
  return (
    <p className={cn('text-sm text-gray-600 mt-2', className)}>
      {children}
    </p>
  );
};

interface AlertDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={cn('flex justify-end space-x-2 mt-6', className)}>
      {children}
    </div>
  );
};

interface AlertDialogActionProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export const AlertDialogAction: React.FC<AlertDialogActionProps> = ({
  children,
  onClick,
  className = '',
  variant = 'default'
}) => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogAction must be used within AlertDialog');
  }

  const handleClick = () => {
    onClick?.();
    context.setOpen(false);
  };

  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    destructive: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(variantClasses[variant], className)}
    >
      {children}
    </Button>
  );
};

interface AlertDialogCancelProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({
  children,
  onClick,
  className = ''
}) => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogCancel must be used within AlertDialog');
  }

  const handleClick = () => {
    onClick?.();
    context.setOpen(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={className}
    >
      {children}
    </Button>
  );
};