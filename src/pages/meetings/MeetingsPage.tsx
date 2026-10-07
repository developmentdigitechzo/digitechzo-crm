import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricCard } from '@/components/common/MetricCard';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MOCK_LEADS } from '@/mocks/mockData';
import { formatDate, cn } from '@/lib/utils';
import {
  PlusCircle,
  Video,
  Clock,
  Building2,
  User,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Calendar,
  Table as TableIcon,
  LayoutGrid,
  FileText,
} from 'lucide-react';

export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'RESCHEDULED' | 'CANCELLED';
export type MeetingType = 'TECHNICAL_DEMO' | 'DISCOVERY' | 'PROPOSAL_REVIEW' | 'COMMERCIAL_NEGOTIATION';

export interface MeetingItem {
  id: string;
  title: string;
  leadId: string;
  leadName: string;
  companyName: string;
  meetingType: MeetingType;
  date: string;
  time: string;
  duration: string;
  hostName: string;
  meetingUrl?: string;
  status: MeetingStatus;
  outcomeSummary?: string;
  nextStepNotes?: string;
  notes?: string;
}

const INITIAL_MEETINGS: MeetingItem[] = [
  {
    id: 'meet-1',
    title: 'B2B Wholesale Portal Architecture Demo',
    leadId: 'lead-1',
    leadName: 'Rohan Deshmukh',
    companyName: 'Apex Logistics Ltd',
    meetingType: 'TECHNICAL_DEMO',
    date: '2026-10-06',
    time: '11:30 AM',
    duration: '60 min',
    hostName: 'Arjun Verma',
    meetingUrl: 'https://meet.google.com/abc-xyz-demo',
    status: 'SCHEDULED',
    notes: 'Technical discovery & demo with Lead Solutions Architect',
  },
  {
    id: 'meet-2',
    title: 'Performance Marketing Discovery Session',
    leadId: 'lead-2',
    leadName: 'Ananya Iyer',
    companyName: 'Zenith EdTech',
    meetingType: 'DISCOVERY',
    date: '2026-10-07',
    time: '02:00 PM',
    duration: '45 min',
    hostName: 'Arjun Verma',
    meetingUrl: undefined,
    status: 'SCHEDULED',
    notes: 'Review campaign requirements and quarterly targets',
  },
  {
    id: 'meet-3',
    title: 'Omnichannel Retail App Scope Review',
    leadId: 'lead-5',
    leadName: 'Rajesh Jain',
    companyName: 'Vanguard Retail Solutions',
    meetingType: 'TECHNICAL_DEMO',
    date: '2026-10-04',
    time: '03:30 PM',
    duration: '60 min',
    hostName: 'Priya Sharma',
    meetingUrl: undefined,
    status: 'COMPLETED',
    outcomeSummary: 'Client confirmed budget readiness for mobile app pilot. Requested formal commercial quotation.',
    nextStepNotes: 'Prepare proposal draft and send for management review.',
  },
  {
    id: 'meet-4',
    title: 'Cloud Infrastructure Requirements Discovery',
    leadId: 'lead-3',
    leadName: 'Vikram Singhania',
    companyName: 'CloudScale Technologies',
    meetingType: 'DISCOVERY',
    date: '2026-10-03',
    time: '10:30 AM',
    duration: '30 min',
    hostName: 'Arjun Verma',
    meetingUrl: undefined,
    status: 'NO_SHOW',
    outcomeSummary: 'Prospect did not attend. Sent follow-up communication to reschedule.',
    nextStepNotes: 'Attempt phone contact next business day.',
  },
];

export const MeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<MeetingItem[]>(INITIAL_MEETINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [hostFilter, setHostFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [outcomeModalMeeting, setOutcomeModalMeeting] = useState<MeetingItem | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);

  // Form states
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: '',
    leadId: MOCK_LEADS[0]?.id || 'lead-1',
    meetingType: 'TECHNICAL_DEMO' as MeetingType,
    date: new Date().toISOString().split('T')[0],
    time: '11:30 AM',
    duration: '45 min',
    hostName: 'Arjun Verma',
    meetingUrl: '',
    notes: '',
  });

  const [outcomeForm, setOutcomeForm] = useState({
    status: 'COMPLETED' as MeetingStatus,
    outcomeSummary: '',
    nextStepNotes: '',
  });

  // Derived counts
  const upcomingCount = useMemo(() => meetings.filter((m) => m.status === 'SCHEDULED').length, [meetings]);
  const completedCount = useMemo(() => meetings.filter((m) => m.status === 'COMPLETED').length, [meetings]);
  const noShowCount = useMemo(() => meetings.filter((m) => m.status === 'NO_SHOW').length, [meetings]);
  const rescheduledCount = useMemo(() => meetings.filter((m) => m.status === 'RESCHEDULED').length, [meetings]);

  // Filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'All', count: meetings.length },
      { id: 'SCHEDULED', label: 'Upcoming', count: upcomingCount, countVariant: 'info' },
      { id: 'COMPLETED', label: 'Completed', count: completedCount },
      { id: 'NO_SHOW', label: 'No-Show', count: noShowCount, countVariant: 'danger' },
      { id: 'RESCHEDULED', label: 'Rescheduled', count: rescheduledCount, countVariant: 'warning' },
    ];
  }, [meetings.length, upcomingCount, completedCount, noShowCount, rescheduledCount]);

  // Unique hosts
  const uniqueHosts = useMemo(() => {
    return Array.from(new Set(meetings.map((m) => m.hostName)));
  }, [meetings]);

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && m.meetingType !== typeFilter) return false;
      if (hostFilter !== 'ALL' && m.hostName !== hostFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(query);
        const matchesLead = m.leadName.toLowerCase().includes(query);
        const matchesCompany = m.companyName.toLowerCase().includes(query);
        const matchesHost = m.hostName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLead && !matchesCompany && !matchesHost) {
          return false;
        }
      }

      return true;
    });
  }, [meetings, statusFilter, typeFilter, hostFilter, searchQuery]);

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setHostFilter('ALL');
    setSearchQuery('');
  };

  const isFiltered = statusFilter !== 'ALL' || typeFilter !== 'ALL' || hostFilter !== 'ALL' || searchQuery.trim() !== '';

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="info">Upcoming</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'NO_SHOW':
        return <Badge variant="danger">No-Show</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="warning">Rescheduled</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: MeetingType) => {
    switch (type) {
      case 'TECHNICAL_DEMO':
        return <Badge variant="tech">Technical Demo</Badge>;
      case 'DISCOVERY':
        return <Badge variant="info">Discovery</Badge>;
      case 'PROPOSAL_REVIEW':
        return <Badge variant="warning">Proposal Review</Badge>;
      case 'COMMERCIAL_NEGOTIATION':
        return <Badge variant="warning">Negotiation</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingForm.title.trim()) return;

    const selectedLead = MOCK_LEADS.find((l) => l.id === newMeetingForm.leadId);

    const newMeeting: MeetingItem = {
      id: `meet-${Date.now()}`,
      title: newMeetingForm.title.trim(),
      leadId: newMeetingForm.leadId,
      leadName: selectedLead?.fullName || 'Prospect',
      companyName: selectedLead?.companyName || 'Lead Company',
      meetingType: newMeetingForm.meetingType,
      date: newMeetingForm.date,
      time: newMeetingForm.time,
      duration: newMeetingForm.duration,
      hostName: newMeetingForm.hostName,
      meetingUrl: newMeetingForm.meetingUrl.trim() || undefined,
      status: 'SCHEDULED',
      notes: newMeetingForm.notes.trim() || undefined,
    };

    setMeetings([newMeeting, ...meetings]);
    setIsScheduleModalOpen(false);
    setNewMeetingForm({
      title: '',
      leadId: MOCK_LEADS[0]?.id || 'lead-1',
      meetingType: 'TECHNICAL_DEMO',
      date: new Date().toISOString().split('T')[0],
      time: '11:30 AM',
      duration: '45 min',
      hostName: 'Arjun Verma',
      meetingUrl: '',
      notes: '',
    });
  };

  const handleSaveOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeModalMeeting) return;

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id === outcomeModalMeeting.id) {
          return {
            ...m,
            status: outcomeForm.status,
            outcomeSummary: outcomeForm.outcomeSummary.trim() || undefined,
            nextStepNotes: outcomeForm.nextStepNotes.trim() || undefined,
          };
        }
        return m;
      })
    );

    setOutcomeModalMeeting(null);
  };

  const openOutcomeModal = (meeting: MeetingItem) => {
    setOutcomeModalMeeting(meeting);
    setOutcomeForm({
      status: meeting.status === 'SCHEDULED' ? 'COMPLETED' : meeting.status,
      outcomeSummary: meeting.outcomeSummary || '',
      nextStepNotes: meeting.nextStepNotes || '',
    });
  };

  return (
    <div className="space-y-4 select-none max-w-full">
      {/* 1. Page Header */}
      <PageHeader
        title="Meetings & Demos"
        count={`${meetings.length} sessions`}
        badge={upcomingCount > 0 ? `${upcomingCount} upcoming` : 'all clear'}
        badgeVariant={upcomingCount > 0 ? 'brand' : 'neutral'}
        actions={
          <div className="flex items-center gap-2">
            {/* View Switcher: Table vs Grid */}
            <div className="flex items-center rounded-btn border border-border bg-white p-0.5 shadow-subtle">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-btn transition-colors cursor-pointer",
                  viewMode === 'table' ? "bg-[#16181B] text-white" : "text-txt-secondary hover:text-txt-primary"
                )}
                title="Spreadsheet Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-btn transition-colors cursor-pointer",
                  viewMode === 'grid' ? "bg-[#16181B] text-white" : "text-txt-secondary hover:text-txt-primary"
                )}
                title="Cards Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Schedule Demo
            </Button>
          </div>
        }
      />

      {/* 2. Compact Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Upcoming Demos"
          value={upcomingCount}
          subtext="Sessions scheduled"
          icon={Video}
          iconVariant="tech"
          onClick={() => setStatusFilter('SCHEDULED')}
          className={statusFilter === 'SCHEDULED' ? 'border-[#7C3AED] ring-1 ring-[#7C3AED]/30' : ''}
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          subtext="Outcomes evaluated"
          icon={CheckCircle2}
          iconVariant="success"
          onClick={() => setStatusFilter('COMPLETED')}
          className={statusFilter === 'COMPLETED' ? 'border-[#16A34A] ring-1 ring-[#16A34A]/30' : ''}
        />
        <MetricCard
          label="No-Show"
          value={noShowCount}
          subtext="Follow-up needed"
          subtextVariant="danger"
          icon={AlertCircle}
          iconVariant="danger"
          onClick={() => setStatusFilter('NO_SHOW')}
          className={statusFilter === 'NO_SHOW' ? 'border-[#DC2626] ring-1 ring-[#DC2626]/30' : ''}
        />
        <MetricCard
          label="Rescheduled"
          value={rescheduledCount}
          subtext="Updated timelines"
          icon={RotateCcw}
          iconVariant="warning"
          onClick={() => setStatusFilter('RESCHEDULED')}
          className={statusFilter === 'RESCHEDULED' ? 'border-[#D97706] ring-1 ring-[#D97706]/30' : ''}
        />
      </div>

      {/* 3. Compact Toolbar & Filters */}
      <div className="flex flex-col gap-2.5 sm:gap-3 p-3 rounded-card border border-border bg-white shadow-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search meetings by title, prospect, host..."
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Meeting Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Meeting Types</option>
              <option value="TECHNICAL_DEMO">Technical Demo</option>
              <option value="DISCOVERY">Discovery</option>
              <option value="PROPOSAL_REVIEW">Proposal Review</option>
              <option value="COMMERCIAL_NEGOTIATION">Negotiation</option>
            </select>

            {/* Host Filter */}
            <select
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Hosts</option>
              {uniqueHosts.map((host) => (
                <option key={host} value={host}>
                  {host}
                </option>
              ))}
            </select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                className="h-8 text-xs text-txt-muted hover:text-txt-primary cursor-pointer px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <FilterPills
          options={filterOptions}
          activeId={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* 4. Main Meeting Content: Primary Table or Grid */}
      {filteredMeetings.length === 0 ? (
        <div className="p-8 bg-white rounded-card border border-border">
          <EmptyState
            icon={Calendar}
            title="No meeting records found"
            description="No demonstration sessions match the current filter selection. Try resetting filters or schedule a demo."
            actionLabel={isFiltered ? "Reset filters" : "Schedule Demo"}
            onAction={isFiltered ? resetAllFilters : () => setIsScheduleModalOpen(true)}
          />
        </div>
      ) : viewMode === 'table' ? (
        /* Primary Table View with Mobile Card Transformation */
        <div className="space-y-3">
          {/* Desktop & Tablet Table */}
          <div className="hidden sm:block rounded-card border border-border bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/60">
                  <TableRow>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Status</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Meeting / Demo</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Prospect</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Date / Time</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Type</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Host</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Meeting Link</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-2.5">
                        {getStatusBadge(m.status)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedMeeting(m)}
                          className="font-semibold text-xs text-txt-primary hover:text-[#57B71B] transition-colors text-left cursor-pointer truncate max-w-xs block"
                        >
                          {m.title}
                        </button>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-xs">
                          <Link
                            to="/leads"
                            className="font-medium text-txt-primary hover:text-[#57B71B] transition-colors truncate block"
                          >
                            {m.leadName}
                          </Link>
                          <span className="text-[11px] text-txt-muted truncate block">{m.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-xs font-semibold tabular-nums text-txt-primary">
                          <span>{m.time}</span>
                          <span className="text-[10px] text-txt-muted block font-normal">
                            {formatDate(m.date)} ({m.duration})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {getTypeBadge(m.meetingType)}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-txt-secondary font-medium">
                        {m.hostName}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {m.meetingUrl ? (
                          <a
                            href={m.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-btn bg-slate-50 border border-border text-[11px] font-mono text-txt-secondary hover:text-[#57B71B] hover:border-[#57B71B] transition-colors"
                          >
                            <Video className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate max-w-[120px]">meet.google.com</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-txt-muted italic">No link</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openOutcomeModal(m)}
                            className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold cursor-pointer"
                          >
                            {m.status === 'SCHEDULED' ? 'Log Outcome' : 'Outcome'}
                          </Button>
                          <ActionMenu
                            items={[
                              {
                                label: 'View Details',
                                icon: FileText,
                                onClick: () => setSelectedMeeting(m),
                              },
                              {
                                label: 'Log Outcome',
                                icon: CheckCircle2,
                                onClick: () => openOutcomeModal(m),
                              },
                              {
                                label: 'View Prospect',
                                icon: ExternalLink,
                                onClick: () => {
                                  window.location.hash = '/leads';
                                },
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Stacked Representation (for width <= 640px) */}
          <div className="sm:hidden space-y-2.5">
            {filteredMeetings.map((m) => (
              <div
                key={m.id}
                className="rounded-card border border-border bg-white p-3.5 space-y-2.5 shadow-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(m.status)}
                    {getTypeBadge(m.meetingType)}
                  </div>
                  <span className="text-[11px] font-semibold text-txt-muted tabular-nums flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {m.time}
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedMeeting(m)}
                    className="font-bold text-xs text-txt-primary hover:text-[#57B71B] text-left block"
                  >
                    {m.title}
                  </button>
                  <div className="flex items-center gap-2 text-[11px] text-txt-secondary mt-0.5">
                    <span className="font-medium text-txt-primary">{m.leadName}</span>
                    <span>•</span>
                    <span className="text-txt-muted">{m.companyName}</span>
                  </div>
                </div>

                {m.meetingUrl && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 border border-border p-2 rounded-btn">
                    <Video className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate font-mono text-[11px] text-txt-secondary">{m.meetingUrl}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-txt-muted">Host: {m.hostName}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openOutcomeModal(m)}
                    className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold"
                  >
                    {m.status === 'SCHEDULED' ? 'Log Outcome' : 'Outcome'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Alternative Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMeetings.map((m) => (
            <div
              key={m.id}
              className="rounded-card border border-border bg-white hover:border-slate-300 transition-colors shadow-none flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(m.status)}
                    {getTypeBadge(m.meetingType)}
                  </div>
                  <span className="text-[11px] text-txt-muted flex items-center gap-1 tabular-nums">
                    <Clock className="h-3 w-3" /> {m.time}
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedMeeting(m)}
                    className="font-bold text-sm text-txt-primary hover:text-[#57B71B] transition-colors line-clamp-2 text-left cursor-pointer"
                  >
                    {m.title}
                  </button>
                  <p className="text-[11px] text-txt-muted mt-0.5">{formatDate(m.date)} ({m.duration})</p>
                </div>

                <div className="text-xs bg-slate-50/60 p-2.5 rounded-btn border border-slate-100 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-txt-primary font-medium">
                    <User className="h-3 w-3 text-txt-muted shrink-0" />
                    <span>{m.leadName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-txt-muted text-[11px] pl-4.5">
                    <Building2 className="h-3 w-3 text-txt-muted shrink-0" />
                    <span>{m.companyName}</span>
                  </div>
                </div>

                {m.meetingUrl ? (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs text-txt-primary bg-slate-50 hover:bg-slate-100 border border-border p-2 rounded-btn transition-colors"
                  >
                    <Video className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate font-mono text-[11px] text-txt-secondary flex-1">
                      {m.meetingUrl}
                    </span>
                    <ExternalLink className="h-3 w-3 text-txt-muted shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-txt-muted bg-slate-50/50 border border-dashed border-border p-2 rounded-btn">
                    <Video className="h-3.5 w-3.5 text-txt-muted shrink-0" />
                    <span className="text-[11px] italic">No video meeting URL</span>
                  </div>
                )}

                {m.outcomeSummary && (
                  <div className="text-[11px] text-txt-secondary bg-emerald-50/50 border border-emerald-100 p-2 rounded-btn">
                    <strong className="text-emerald-800 block text-[10px] uppercase font-bold">Outcome</strong>
                    <p className="line-clamp-2">{m.outcomeSummary}</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-slate-50/40 border-t border-border flex items-center justify-between text-xs">
                <span className="text-txt-muted text-[11px]">Host: {m.hostName}</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openOutcomeModal(m)}
                    className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold cursor-pointer"
                  >
                    {m.status === 'SCHEDULED' ? 'Log Outcome' : 'Outcome'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Schedule Demo Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary">Schedule Demo / Meeting</DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Schedule a product demo, technical architecture session, or discovery meeting.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMeeting} className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">
                Session Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. B2B Wholesale Portal Architecture Demo"
                value={newMeetingForm.title}
                onChange={(e) => setNewMeetingForm({ ...newMeetingForm, title: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Meeting Type</label>
                <select
                  value={newMeetingForm.meetingType}
                  onChange={(e) =>
                    setNewMeetingForm({ ...newMeetingForm, meetingType: e.target.value as MeetingType })
                  }
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  <option value="TECHNICAL_DEMO">Technical Demo</option>
                  <option value="DISCOVERY">Discovery</option>
                  <option value="PROPOSAL_REVIEW">Proposal Review</option>
                  <option value="COMMERCIAL_NEGOTIATION">Negotiation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Prospect</label>
                <select
                  value={newMeetingForm.leadId}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, leadId: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  {MOCK_LEADS.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.fullName} ({lead.companyName || 'Lead'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Date</label>
                <input
                  type="date"
                  required
                  value={newMeetingForm.date}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, date: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Time</label>
                <input
                  type="text"
                  placeholder="11:30 AM"
                  value={newMeetingForm.time}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, time: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Duration</label>
                <select
                  value={newMeetingForm.duration}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, duration: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                >
                  <option value="30 min">30 min</option>
                  <option value="45 min">45 min</option>
                  <option value="60 min">60 min</option>
                  <option value="90 min">90 min</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Host BDE</label>
                <select
                  value={newMeetingForm.hostName}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, hostName: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                >
                  <option value="Arjun Verma">Arjun Verma</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Meeting Link</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={newMeetingForm.meetingUrl}
                  onChange={(e) => setNewMeetingForm({ ...newMeetingForm, meetingUrl: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Pre-Meeting Notes</label>
              <textarea
                rows={2}
                placeholder="Key discovery questions or architecture points to demonstrate..."
                value={newMeetingForm.notes}
                onChange={(e) => setNewMeetingForm({ ...newMeetingForm, notes: e.target.value })}
                className="w-full p-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
              >
                Schedule Demo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Log Outcome & Attendance Modal */}
      <Dialog open={!!outcomeModalMeeting} onOpenChange={(open) => !open && setOutcomeModalMeeting(null)}>
        {outcomeModalMeeting && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-txt-primary">Log Attendance & Outcome</DialogTitle>
              <DialogDescription className="text-xs text-txt-muted">
                Record attendance status, demonstration feedback, and next steps for {outcomeModalMeeting.title}.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveOutcome} className="space-y-3 py-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Attendance Status</label>
                <select
                  value={outcomeForm.status}
                  onChange={(e) =>
                    setOutcomeForm({ ...outcomeForm, status: e.target.value as MeetingStatus })
                  }
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_SHOW">No-Show</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">
                  Outcome Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of client reception, validated requirements, and commercial intent..."
                  value={outcomeForm.outcomeSummary}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, outcomeSummary: e.target.value })}
                  className="w-full p-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Next Action Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatch customized proposal within 48 hours"
                  value={outcomeForm.nextStepNotes}
                  onChange={(e) => setOutcomeForm({ ...outcomeForm, nextStepNotes: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOutcomeModalMeeting(null)}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
                >
                  Save Outcome
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* 7. Meeting Detail Preview Modal */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => !open && setSelectedMeeting(null)}>
        {selectedMeeting && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold text-txt-primary">
                    {selectedMeeting.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-txt-muted">
                    {selectedMeeting.meetingType.replace('_', ' ')} session with {selectedMeeting.companyName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-card border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Status</span>
                  {getStatusBadge(selectedMeeting.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Prospect</span>
                  <span className="font-semibold text-txt-primary">
                    {selectedMeeting.leadName} ({selectedMeeting.companyName})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Scheduled</span>
                  <span className="font-semibold text-txt-primary tabular-nums">
                    {selectedMeeting.time} • {formatDate(selectedMeeting.date)} ({selectedMeeting.duration})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Host</span>
                  <span className="font-semibold text-txt-primary">{selectedMeeting.hostName}</span>
                </div>
                {selectedMeeting.meetingUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-txt-muted font-medium">Meeting URL</span>
                    <a
                      href={selectedMeeting.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-primary hover:underline text-[11px] truncate max-w-[200px]"
                    >
                      {selectedMeeting.meetingUrl}
                    </a>
                  </div>
                )}
              </div>

              {selectedMeeting.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    Pre-Meeting Notes
                  </span>
                  <p className="p-2.5 bg-white rounded-btn border border-border text-txt-secondary leading-relaxed text-xs">
                    {selectedMeeting.notes}
                  </p>
                </div>
              )}

              {selectedMeeting.outcomeSummary && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    Recorded Outcome
                  </span>
                  <p className="p-2.5 bg-emerald-50/60 rounded-btn border border-emerald-100 text-emerald-900 leading-relaxed text-xs">
                    {selectedMeeting.outcomeSummary}
                  </p>
                  {selectedMeeting.nextStepNotes && (
                    <p className="text-[11px] text-txt-muted italic pl-1">
                      Next Step: {selectedMeeting.nextStepNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                onClick={() => setSelectedMeeting(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs font-semibold cursor-pointer"
                  onClick={() => {
                    const m = selectedMeeting;
                    setSelectedMeeting(null);
                    openOutcomeModal(m);
                  }}
                >
                  Log Outcome
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
                  asChild
                >
                  <Link to="/leads" onClick={() => setSelectedMeeting(null)}>
                    View Prospect
                  </Link>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
