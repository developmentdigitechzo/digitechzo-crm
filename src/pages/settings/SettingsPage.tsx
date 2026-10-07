import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_PIPELINE_STAGES, MOCK_DEALS } from '@/mocks/mockData';
import {
  Sliders,
  Building2,
  Tags,
  Cpu,
  CheckCircle2,
  ShieldAlert,
  Globe2,
  Layers,
  Database,
  Phone,
  MessageSquare,
  HardDrive,
} from 'lucide-react';

const SETTINGS_TABS: FilterOption[] = [
  { id: 'general', label: 'General' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'taxonomies', label: 'Taxonomies' },
  { id: 'adapters', label: 'Adapters' },
];

const STAGE_PROBABILITIES: Record<string, number> = {
  'stage-1': 10,
  'stage-2': 25,
  'stage-3': 40,
  'stage-4': 60,
  'stage-5': 80,
  'stage-6': 100,
};

const LOST_REASONS = [
  { code: 'PRICE_TOO_HIGH', label: 'Price Too High / Budget Constraints', category: 'Commercial' },
  { code: 'COMPETITOR_CHOSEN', label: 'Competitor Chosen', category: 'Competition' },
  { code: 'UNRESPONSIVE_GHOSTED', label: 'Unresponsive / Ghosted', category: 'Engagement' },
  { code: 'SCOPE_MISMATCH', label: 'Technical / Scope Mismatch', category: 'Capability' },
  { code: 'TIMING_POSTPONED', label: 'Project Postponed / Not Right Time', category: 'Timeline' },
  { code: 'OTHER', label: 'Other Justification Required', category: 'General' },
];

const LEAD_SOURCES = [
  { code: 'META_ADS', label: 'Meta Ads (Facebook / Instagram)', channelType: 'Digital Inbound' },
  { code: 'GOOGLE_ADS', label: 'Google Search & Display Ads', channelType: 'Digital Inbound' },
  { code: 'WEBSITE_FORM', label: 'Inbound Website Contact Form', channelType: 'Organic Direct' },
  { code: 'WHATSAPP', label: 'Inbound WhatsApp Inquiries', channelType: 'Messaging' },
  { code: 'MANUAL', label: 'Direct BDE Manual Entry', channelType: 'Outbound' },
  { code: 'IMPORT', label: 'CSV / Bulk Excel Import', channelType: 'Batch Upload' },
  { code: 'PHONE_INBOUND', label: 'Direct Inbound Telephony Calls', channelType: 'Voice Inbound' },
];

const SERVICE_LINES = [
  { name: 'Custom Web Application Development', domain: 'Full-Stack Software' },
  { name: 'Digital Marketing & Performance Ads', domain: 'Growth & Acquisition' },
  { name: 'Mobile App Development (iOS / Android)', domain: 'Native Mobile Engineering' },
  { name: 'SEO & Organic Growth', domain: 'Search Marketing' },
  { name: 'Cloud Infrastructure & DevOps Migration', domain: 'Cloud & Infrastructure' },
];

const ADAPTER_STATUSES = [
  {
    name: 'WhatsApp MessagingAdapter',
    statusText: 'Planned (Phase 7) / Not Connected',
    badgeVariant: 'warning' as const,
    phase: 'Phase 7 Planned',
    icon: MessageSquare,
  },
  {
    name: 'TelephonyAdapter (Cloud Voice)',
    statusText: 'Planned (Phase 8) / Not Connected',
    badgeVariant: 'warning' as const,
    phase: 'Phase 8 Planned',
    icon: Phone,
  },
  {
    name: 'StorageAdapter (Document Storage)',
    statusText: 'Mock / In-Memory',
    badgeVariant: 'neutral' as const,
    phase: 'Phase 2 Mock Mode',
    icon: HardDrive,
  },
  {
    name: 'Database & Persistence Layer',
    statusText: 'Mock Data Mode / PostgreSQL Planned',
    badgeVariant: 'neutral' as const,
    phase: 'Phase 5 Planned',
    icon: Database,
  },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [sessionSaveNotice, setSessionSaveNotice] = useState(false);

  const handleSaveChanges = () => {
    setSessionSaveNotice(true);
    setTimeout(() => {
      setSessionSaveNotice(false);
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="Settings"
        badge="Admin Config"
        actions={
          <div className="flex items-center gap-2">
            {sessionSaveNotice && (
              <span className="text-[11px] font-medium text-[#16A34A] flex items-center gap-1 bg-[#F0FDF4] px-2.5 py-1 rounded-badge border border-[#BBF7D0]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Changes saved for this session.
              </span>
            )}
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="h-8 px-3 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
            >
              Save Changes
            </Button>
          </div>
        }
      />

      {/* 2. Compact Category Navigation Tabs */}
      <div className="border-b border-border pb-2.5">
        <FilterPills
          options={SETTINGS_TABS}
          activeId={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* 3. Tab Contents */}

      {/* Tab 1: General Profile */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Card className="border-border shadow-card bg-white">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#57B71B]" /> Organization Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-txt-muted">Organization Name</span>
                <span className="font-semibold text-txt-primary">DigiTechzo</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-txt-muted">Base Currency</span>
                <span className="font-semibold text-txt-primary tabular-nums">INR (₹)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-txt-muted">System Timezone</span>
                <span className="font-medium text-txt-primary">Asia/Kolkata (IST, UTC+5:30)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-txt-muted">Tenant Mode</span>
                <Badge variant="neutral">Single-Tenant Dedicated</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card bg-white">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary" /> Application Runtime State
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-txt-muted">Execution Mode</span>
                <Badge variant="success">Phase 2 Mock Workflows</Badge>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-txt-muted">State Persistence</span>
                <span className="font-medium text-txt-secondary">In-Memory / React Session</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/60">
                <span className="text-txt-muted">Design System</span>
                <span className="font-medium text-txt-primary">DigiTechzo Tokenized (Manrope)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-txt-muted">Active Role Scopes</span>
                <span className="font-semibold text-txt-primary">Super Admin, Manager, BDE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Pipeline Stages */}
      {activeTab === 'pipeline' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-[#57B71B]" />
              Pipeline Stages & Forecast Probabilities
            </div>
            <div className="text-[11px] text-txt-muted">
              {MOCK_PIPELINE_STAGES.length} configured stages
            </div>
          </div>

          <div className="rounded-card border border-border bg-white shadow-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Sequence</TableHead>
                  <TableHead className="w-[200px]">Stage Name</TableHead>
                  <TableHead className="w-[120px]">Stage Type</TableHead>
                  <TableHead className="w-[140px] text-right">Win Probability</TableHead>
                  <TableHead className="w-[140px] text-right">Active Deals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PIPELINE_STAGES.map((stage) => {
                  const dealCount = MOCK_DEALS.filter((d) => d.stageId === stage.id).length;
                  const probability = STAGE_PROBABILITIES[stage.id] ?? 0;

                  return (
                    <TableRow key={stage.id}>
                      <TableCell className="font-semibold text-xs text-txt-muted tabular-nums">
                        #{stage.order}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-txt-primary">
                        {stage.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stage.stageType === 'WON' ? 'success' : 'neutral'}>
                          {stage.stageType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs text-txt-primary tabular-nums">
                        {probability}%
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-txt-primary tabular-nums">
                        {dealCount} {dealCount === 1 ? 'deal' : 'deals'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 3: Taxonomies & Loss Governance */}
      {activeTab === 'taxonomies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Column A: Lost Reason Codes */}
            <Card className="border-border shadow-card bg-white">
              <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-xs font-bold text-txt-primary flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-[#D97706]" /> Standardized Lost Reasons
                  </span>
                  <Badge variant="neutral" className="text-[10px]">
                    Rule BR-PIPE-02
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border text-xs">
                  {LOST_REASONS.map((reason) => (
                    <div key={reason.code} className="p-3 flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-txt-primary">{reason.label}</div>
                        <div className="font-mono text-[10px] text-txt-muted">{reason.code}</div>
                      </div>
                      <Badge variant="neutral" className="text-[10px] shrink-0">
                        {reason.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Column B: Lead Sources & Service Lines */}
            <div className="space-y-3.5">
              <Card className="border-border shadow-card bg-white">
                <CardHeader className="py-3 px-4 border-b border-border">
                  <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#57B71B]" /> Lead Capture Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border text-xs">
                    {LEAD_SOURCES.map((source) => (
                      <div key={source.code} className="p-2.5 px-3 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-txt-primary">{source.label}</span>
                          <span className="font-mono text-[10px] text-txt-muted ml-2">({source.code})</span>
                        </div>
                        <span className="text-[11px] text-txt-secondary">{source.channelType}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-card bg-white">
                <CardHeader className="py-3 px-4 border-b border-border">
                  <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
                    <Tags className="h-4 w-4 text-primary" /> Active Service Offerings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border text-xs">
                    {SERVICE_LINES.map((service) => (
                      <div key={service.name} className="p-2.5 px-3 flex items-center justify-between">
                        <span className="font-medium text-txt-primary">{service.name}</span>
                        <span className="text-[11px] text-txt-muted">{service.domain}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Integration Adapters Status */}
      {activeTab === 'adapters' && (
        <Card className="border-border shadow-card bg-white">
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-xs font-bold text-txt-primary flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#57B71B]" /> Integration Adapters Architecture Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              {ADAPTER_STATUSES.map((adapter) => {
                const Icon = adapter.icon;
                return (
                  <div
                    key={adapter.name}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-card border border-border bg-slate-50 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-txt-muted" />
                      </div>
                      <div>
                        <div className="font-semibold text-txt-primary">{adapter.name}</div>
                        <div className="text-[11px] text-txt-muted">{adapter.phase}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Badge variant={adapter.badgeVariant}>{adapter.statusText}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
