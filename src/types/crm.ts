export type LeadStatus = 'NEW' | 'HOT' | 'WARM' | 'COLD' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';

export type LeadSource = 
  | 'META_ADS' 
  | 'GOOGLE_ADS' 
  | 'WEBSITE_FORM' 
  | 'WHATSAPP' 
  | 'MANUAL' 
  | 'IMPORT' 
  | 'PHONE_INBOUND';

export type TaskActionType = 
  | 'CALL' 
  | 'WHATSAPP' 
  | 'EMAIL' 
  | 'MEETING' 
  | 'PROPOSAL' 
  | 'INTERNAL_REVIEW';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'RESCHEDULED' | 'CANCELLED';

export interface NextAction {
  actionType: TaskActionType;
  date: string;
  time?: string;
  ownerId: string;
  ownerName: string;
  purpose: string;
}

export interface Lead {
  id: string;
  fullName: string;
  companyName?: string;
  title?: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  leadScore: number;
  serviceInterest: string;
  ownerId: string;
  ownerName: string;
  lastActivityAt: string;
  nextAction?: NextAction;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  dealCount: number;
  totalValue: number;
  stageType: 'OPEN' | 'WON' | 'LOST';
}

export interface Deal {
  id: string;
  title: string;
  leadId: string;
  leadName: string;
  companyName?: string;
  stageId: string;
  amount: number;
  currency: string;
  probability: number;
  expectedCloseDate: string;
  ownerId: string;
  ownerName: string;
  status: 'OPEN' | 'WON' | 'LOST';
  lostReason?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  leadId?: string;
  leadName?: string;
  actionType: TaskActionType;
  dueDate: string;
  dueTime?: string;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerName: string;
  isNextAction: boolean;
}

export interface ActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'NOTE' | 'MEETING' | 'STAGE_CHANGE';
  title: string;
  description?: string;
  authorName: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
