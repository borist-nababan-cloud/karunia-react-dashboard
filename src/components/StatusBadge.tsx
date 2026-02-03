import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface StatusBadgeProps {
  approved: boolean;
  blocked: boolean;
  size?: 'default' | 'sm';
}

export function StatusBadge({ approved, blocked, size = 'default' }: StatusBadgeProps) {
  if (blocked) {
    return (
      <Badge variant="destructive" className="gap-1">
        <X className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'}`} />
        Blocked
      </Badge>
    );
  }

  if (approved) {
    return (
      <Badge variant="default" className="gap-1 bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
        <Check className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'}`} />
        Approved
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      Pending
    </Badge>
  );
}