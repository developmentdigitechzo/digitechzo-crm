import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LeadStatus, TaskPriority, TaskStatus } from '@/types/crm';

export interface StatusBadgeProps {
  status: LeadStatus | TaskPriority | TaskStatus | string;
  type?: 'lead' | 'priority' | 'task' | 'stage';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'lead', className }) => {
  const s = String(status).toUpperCase();

  if (type === 'lead') {
    switch (s) {
      case 'HOT':
        return <Badge variant="danger" className={className}>Hot</Badge>;
      case 'WARM':
        return <Badge variant="warning" className={className}>Warm</Badge>;
      case 'COLD':
        return <Badge variant="info" className={className}>Cold</Badge>;
      case 'NEW':
        return <Badge variant="info" className={className}>New</Badge>;
      case 'CONVERTED':
        return <Badge variant="success" className={className}>Won</Badge>;
      case 'UNQUALIFIED':
      case 'LOST':
        return <Badge variant="neutral" className={className}>Unqualified</Badge>;
      default:
        return <Badge variant="neutral" className={className}>{status}</Badge>;
    }
  }

  if (type === 'priority') {
    switch (s) {
      case 'URGENT':
        return <Badge variant="danger" className={className}>Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="warning" className={className}>High</Badge>;
      case 'MEDIUM':
        return <Badge variant="info" className={className}>Medium</Badge>;
      case 'LOW':
        return <Badge variant="neutral" className={className}>Low</Badge>;
      default:
        return <Badge variant="neutral" className={className}>{status}</Badge>;
    }
  }

  if (type === 'task') {
    switch (s) {
      case 'OVERDUE':
        return <Badge variant="danger" className={className}>Overdue</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" className={className}>Completed</Badge>;
      case 'PENDING':
        return <Badge variant="warning" className={className}>Pending</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="info" className={className}>Rescheduled</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" className={className}>Cancelled</Badge>;
      default:
        return <Badge variant="neutral" className={className}>{status}</Badge>;
    }
  }

  if (type === 'stage') {
    switch (s) {
      case 'NEW':
      case 'DISCOVERY':
        return <Badge variant="info" className={className}>Discovery</Badge>;
      case 'DEMO':
      case 'TECHNICAL_EVALUATION':
        return <Badge variant="tech" className={className}>Demo</Badge>;
      case 'PROPOSAL':
        return <Badge variant="warning" className={className}>Proposal</Badge>;
      case 'NEGOTIATION':
        return <Badge variant="warning" className={className}>Negotiation</Badge>;
      case 'WON':
      case 'CLOSED_WON':
        return <Badge variant="success" className={className}>Closed Won</Badge>;
      case 'LOST':
      case 'CLOSED_LOST':
        return <Badge variant="danger" className={className}>Closed Lost</Badge>;
      default:
        return <Badge variant="neutral" className={className}>{status}</Badge>;
    }
  }

  return <Badge variant="neutral" className={className}>{status}</Badge>;
};
