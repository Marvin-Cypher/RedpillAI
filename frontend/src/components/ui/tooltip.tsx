/**
 * Tooltip Components
 * Simple tooltip implementation using CSS and React state
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  delayDuration?: number;
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  className = '',
  delayDuration = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delayDuration);
    setShowTimeout(timeout);
  };

  const hideTooltip = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 100);
    setHideTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [showTimeout, hideTimeout]);

  const getPositionClasses = () => {
    const positions = {
      top: {
        start: 'bottom-full left-0 mb-2',
        center: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        end: 'bottom-full right-0 mb-2'
      },
      bottom: {
        start: 'top-full left-0 mt-2',
        center: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        end: 'top-full right-0 mt-2'
      },
      left: {
        start: 'right-full top-0 mr-2',
        center: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        end: 'right-full bottom-0 mr-2'
      },
      right: {
        start: 'left-full top-0 ml-2',
        center: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
        end: 'left-full bottom-0 ml-2'
      }
    };
    return positions[side][align];
  };

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none',
            getPositionClasses(),
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ 
  children, 
  asChild = false 
}) => {
  return <>{children}</>;
};

export const TooltipContent: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}> = ({ 
  children, 
  className = '',
  side = 'top',
  align = 'center'
}) => {
  return <>{children}</>;
};