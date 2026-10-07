import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MOCK_ACTIVITIES, MOCK_LEADS } from '@/mocks/mockData';
import { ActivityItem } from '@/types/crm';
import { formatDate, cn } from '@/lib/utils';
import {
  PlusCircle,
  Phone,
  MessageSquare,
  Calendar,
  Mail,
  FileText,
  ArrowRight,
  Play,
  Pause,
  Clock,
  Building2,
  User,
  Activity,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

type ActivityType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'NOTE' | 'MEETING' | 'STAGE_CHANGE';
type CallOutcome = 'CONNECTED' | 'NO_ANSWER' | 'BUSY' | 'CALLBACK_REQUESTED';

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [prospectFilter, setProspectFilter] = useState<string>('ALL');
  const [authorFilter, setAuthorFilter] = useState<string>('ALL');

  // Audio playback simulation state
  const [playingActivityId, setPlayingActivityId] = useState<string | null>(null);

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Form state for logging interaction
  const [newActivityForm, setNewActivityForm] = useState({
    type: 'CALL' as ActivityType,
    leadId: MOCK_LEADS[0]?.id || 'lead-1',
    leadName: MOCK_LEADS[0]?.fullName || 'Rohan Deshmukh',
    title: '',
    description: '',
    callOutcome: 'CONNECTED' as CallOutcome,
    callDuration: '10m 15s',
    authorName: 'Arjun Verma',
  });

  // Calculate metrics
  const callCount = useMemo(() => activities.filter((a) => a.type === 'CALL').length, [activities]);
  const waCount = useMemo(() => activities.filter((a) => a.type === 'WHATSAPP').length, [activities]);
  const stageChangeCount = useMemo(() => activities.filter((a) => a.type === 'STAGE_CHANGE').length, [activities]);
  const totalCount = activities.length;

  // Filter options for pills
  const filterOptions: FilterOption[] = useMemo(() => {
    const meetingCount = activities.filter((a) => a.type === 'MEETING').length;
    const emailCount = activities.filter((a) => a.type === 'EMAIL').length;
    const noteCount = activities.filter((a) => a.type === 'NOTE').length;

    return [
      { id: 'ALL', label: 'All', count: totalCount },
      { id: 'CALL', label: 'Calls', count: callCount },
      { id: 'WHATSAPP', label: 'WhatsApp', count: waCount },
      { id: 'STAGE_CHANGE', label: 'Stage Changes', count: stageChangeCount },
      { id: 'MEETING', label: 'Meetings', count: meetingCount },
      { id: 'EMAIL', label: 'Emails', count: emailCount },
      { id: 'NOTE', label: 'Notes', count: noteCount },
    ];
  }, [activities, totalCount, callCount, waCount, stageChangeCount]);

  // Unique prospects and authors
  const uniqueProspects = useMemo(() => {
    return Array.from(new Set(activities.map((a) => a.leadName)));
  }, [activities]);

  const uniqueAuthors = useMemo(() => {
    return Array.from(new Set(activities.map((a) => a.authorName)));
  }, [activities]);

  // Lead lookup helper for company name
  const leadCompanyMap = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_LEADS.forEach((l) => {
      if (l.companyName) {
        map.set(l.fullName, l.companyName);
        map.set(l.id, l.companyName);
      }
    });
    return map;
  }, []);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type filter
      if (typeFilter !== 'ALL' && act.type !== typeFilter) return false;

      // Prospect filter
      if (prospectFilter !== 'ALL' && act.leadName !== prospectFilter) return false;

      // Author filter
      if (authorFilter !== 'ALL' && act.authorName !== authorFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(query);
        const matchesDesc = (act.description || '').toLowerCase().includes(query);
        const matchesLead = act.leadName.toLowerCase().includes(query);
        const matchesAuthor = act.authorName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLead && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [activities, typeFilter, prospectFilter, authorFilter, searchQuery]);

  // Group activities chronologically by date
  const groupedActivities = useMemo(() => {
    const groups: { [dateStr: string]: ActivityItem[] } = {};

    filteredActivities.forEach((act) => {
      const dateKey = formatDate(act.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(act);
    });

    return groups;
  }, [filteredActivities]);

  const resetAllFilters = () => {
    setTypeFilter('ALL');
    setProspectFilter('ALL');
    setAuthorFilter('ALL');
    setSearchQuery('');
  };

  const isFiltered = typeFilter !== 'ALL' || prospectFilter !== 'ALL' || authorFilter !== 'ALL' || searchQuery.trim() !== '';

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityForm.title.trim()) return;

    // Rule BR-COMM-02: Require duration and outcome for calls
    let titleToSave = newActivityForm.title.trim();
    if (newActivityForm.type === 'CALL') {
      const durationPart = newActivityForm.callDuration.trim() ? ` (${newActivityForm.callDuration.trim()})` : '';
      if (!titleToSave.toLowerCase().includes('call')) {
        titleToSave = `Outbound Call ${newActivityForm.callOutcome}${durationPart}: ${titleToSave}`;
      }
    }

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      leadId: newActivityForm.leadId,
      leadName: newActivityForm.leadName,
      type: newActivityForm.type,
      title: titleToSave,
      description: newActivityForm.description.trim() || undefined,
      authorName: newActivityForm.authorName,
      createdAt: new Date().toISOString(),
      metadata:
        newActivityForm.type === 'CALL'
          ? {
              callOutcome: newActivityForm.callOutcome,
              callDuration: newActivityForm.callDuration,
              hasRecording: true,
            }
          : undefined,
    };

    // Rule BR-COMM-01: Immutable append-only
    setActivities([newActivity, ...activities]);
    setIsLogModalOpen(false);

    // Reset form
    setNewActivityForm({
      type: 'CALL',
      leadId: MOCK_LEADS[0]?.id || 'lead-1',
      leadName: MOCK_LEADS[0]?.fullName || 'Rohan Deshmukh',
      title: '',
      description: '',
      callOutcome: 'CONNECTED',
      callDuration: '10m 15s',
      authorName: 'Arjun Verma',
    });
  };

  const getActivityTypeConfig = (type: ActivityItem['type']) => {
    switch (type) {
      case 'CALL':
        return {
          icon: Phone,
          iconColor: 'text-[#57B71B]',
          bgColor: 'bg-[#F0FDF4] border-emerald-200/60',
          badgeVariant: 'success' as const,
          label: 'Call',
        };
      case 'WHATSAPP':
        return {
          icon: MessageSquare,
          iconColor: 'text-[#16A34A]',
          bgColor: 'bg-emerald-50 border-emerald-200/60',
          badgeVariant: 'success' as const,
          label: 'WhatsApp',
        };
      case 'STAGE_CHANGE':
        return {
          icon: ArrowRight,
          iconColor: 'text-[#2563EB]',
          bgColor: 'bg-blue-50 border-blue-200/60',
          badgeVariant: 'info' as const,
          label: 'Stage Change',
        };
      case 'MEETING':
        return {
          icon: Calendar,
          iconColor: 'text-[#7C3AED]',
          bgColor: 'bg-purple-50 border-purple-200/60',
          badgeVariant: 'tech' as const,
          label: 'Meeting',
        };
      case 'EMAIL':
        return {
          icon: Mail,
          iconColor: 'text-[#0284C7]',
          bgColor: 'bg-sky-50 border-sky-200/60',
          badgeVariant: 'info' as const,
          label: 'Email',
        };
      case 'NOTE':
      default:
        return {
          icon: FileText,
          iconColor: 'text-[#D97706]',
          bgColor: 'bg-amber-50 border-amber-200/60',
          badgeVariant: 'warning' as const,
          label: 'Internal Note',
        };
    }
  };

  return (
    <div className="space-y-4 select-none max-w-full">
      {/* 1. Page Header */}
      <PageHeader
        title="Activities"
        count={`${activities.length} total events`}
        description="Unified chronological audit log of prospect interactions, calls, messages, and stage changes"
        actions={
          <Button
            size="sm"
            className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
            onClick={() => setIsLogModalOpen(true)}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Log Interaction
          </Button>
        }
      />

      {/* 2. Compact Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Logged"
          value={totalCount}
          subtext="Chronological events"
          icon={Activity}
          iconVariant="neutral"
          onClick={() => setTypeFilter('ALL')}
          className={typeFilter === 'ALL' && !isFiltered ? 'border-[#57B71B] ring-1 ring-[#57B71B]/30' : ''}
        />
        <MetricCard
          label="Phone Calls"
          value={callCount}
          subtext="Outbound & inbound"
          icon={Phone}
          iconVariant="success"
          onClick={() => setTypeFilter('CALL')}
          className={typeFilter === 'CALL' ? 'border-[#57B71B] ring-1 ring-[#57B71B]/30' : ''}
        />
        <MetricCard
          label="WhatsApp Chats"
          value={waCount}
          subtext="Direct conversations"
          icon={MessageSquare}
          iconVariant="success"
          onClick={() => setTypeFilter('WHATSAPP')}
          className={typeFilter === 'WHATSAPP' ? 'border-[#16A34A] ring-1 ring-[#16A34A]/30' : ''}
        />
        <MetricCard
          label="Stage Changes"
          value={stageChangeCount}
          subtext="Pipeline transitions"
          icon={ArrowRight}
          iconVariant="info"
          onClick={() => setTypeFilter('STAGE_CHANGE')}
          className={typeFilter === 'STAGE_CHANGE' ? 'border-[#2563EB] ring-1 ring-[#2563EB]/30' : ''}
        />
      </div>

      {/* 3. Compact Toolbar & Filter Pills */}
      <div className="flex flex-col gap-2.5 sm:gap-3 p-3 rounded-card border border-border bg-white shadow-none">
        {/* Top toolbar: Search + Select Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search activities by title, prospect, notes, author..."
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Prospect Filter */}
            <select
              value={prospectFilter}
              onChange={(e) => setProspectFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Prospects</option>
              {uniqueProspects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Author Filter */}
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Authors</option>
              {uniqueAuthors.map((author) => (
                <option key={author} value={author}>
                  {author}
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

        {/* Bottom toolbar: Category Filter Pills */}
        <FilterPills
          options={filterOptions}
          activeId={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {/* 4. Chronological Timeline Feed */}
      {filteredActivities.length === 0 ? (
        <div className="p-8 bg-white rounded-card border border-border">
          <EmptyState
            icon={Activity}
            title="No activity records found"
            description="No logged touchpoints match your current filters. Try resetting or log a new interaction."
            actionLabel={isFiltered ? "Reset filters" : "Log Interaction"}
            onAction={isFiltered ? resetAllFilters : () => setIsLogModalOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateLabel, items]) => (
            <div key={dateLabel} className="space-y-3">
              {/* Date Header Pill */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-txt-muted bg-slate-100 border border-border px-2.5 py-0.5 rounded-full">
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Timeline Cards Container */}
              <div className="space-y-2.5 pl-1 sm:pl-2">
                {items.map((act) => {
                  const config = getActivityTypeConfig(act.type);
                  const Icon = config.icon;
                  const companyName = leadCompanyMap.get(act.leadName) || leadCompanyMap.get(act.leadId);
                  const isCall = act.type === 'CALL';
                  const isPlaying = playingActivityId === act.id;

                  return (
                    <div
                      key={act.id}
                      className="rounded-card border border-border bg-white p-3.5 sm:p-4 hover:border-slate-300 transition-colors shadow-none"
                    >
                      {/* Top Row: Icon + Title + Badges + Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-btn border shrink-0 mt-0.5",
                              config.bgColor
                            )}
                          >
                            <Icon className={cn("h-3.5 w-3.5", config.iconColor)} />
                          </div>

                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedActivity(act)}
                                className="font-bold text-xs sm:text-sm text-txt-primary hover:text-[#57B71B] transition-colors truncate text-left cursor-pointer"
                              >
                                {act.title}
                              </button>
                              <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0">
                                {config.label}
                              </Badge>
                            </div>

                            {/* Prospect context */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-txt-secondary">
                              <Link
                                to="/leads"
                                className="flex items-center gap-1 truncate font-medium text-txt-primary hover:text-[#57B71B] transition-colors"
                              >
                                <User className="h-3 w-3 text-txt-muted shrink-0" />
                                <span>{act.leadName}</span>
                              </Link>
                              {companyName && (
                                <span className="flex items-center gap-1 text-txt-muted truncate">
                                  <Building2 className="h-3 w-3 shrink-0" />
                                  <span>{companyName}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Timestamp in tabular numerals */}
                        <div className="text-left sm:text-right shrink-0 pl-9 sm:pl-0">
                          <span className="text-[11px] font-semibold text-txt-muted tabular-nums flex items-center gap-1 sm:justify-end">
                            <Clock className="h-3 w-3 shrink-0" />
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Description / Note Body */}
                      {act.description && (
                        <div className="mt-2.5 pl-9 text-xs text-txt-secondary leading-relaxed bg-slate-50/60 p-2.5 rounded-btn border border-slate-100">
                          {act.description}
                        </div>
                      )}

                      {/* Contextual Call Audio Scrub Bar (for recorded calls) */}
                      {isCall && (
                        <div className="mt-2.5 pl-9">
                          <div className="flex items-center gap-2.5 p-2 rounded-btn bg-[#F8FAFC] border border-border max-w-md">
                            <button
                              type="button"
                              onClick={() => setPlayingActivityId(isPlaying ? null : act.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16181B] text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                              title={isPlaying ? "Pause Recording" : "Play Recording"}
                            >
                              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                            </button>

                            {/* Simulated waveform scrubber */}
                            <div className="flex-1 flex items-center gap-1 h-3">
                              <div className={cn("h-1.5 rounded-full flex-1 transition-all", isPlaying ? "bg-[#57B71B]" : "bg-slate-200")}>
                                <div className={cn("h-full bg-[#57B71B] rounded-full", isPlaying ? "w-2/3 animate-pulse" : "w-1/4")} />
                              </div>
                            </div>

                            <span className="text-[10px] font-semibold text-txt-muted tabular-nums shrink-0">
                              {isPlaying ? "04:12 / 12:40" : "12m 40s"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Footer: Author info & Quick prospect link */}
                      <div className="mt-2.5 pl-9 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-txt-muted">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-4 w-4 text-[9px] bg-slate-200 text-txt-primary">
                            <AvatarFallback>
                              {act.authorName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>Logged by <strong className="text-txt-primary font-medium">{act.authorName}</strong></span>
                        </div>

                        <Link
                          to="/leads"
                          className="flex items-center gap-1 text-[11px] font-medium text-[#57B71B] hover:underline"
                        >
                          <span>View Prospect</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Log Interaction Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary">Log Interaction</DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Record a call, message, demo meeting, or internal client note. Follows append-only rule BR-COMM-01.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateActivity} className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Activity Type</label>
                <select
                  value={newActivityForm.type}
                  onChange={(e) =>
                    setNewActivityForm({ ...newActivityForm, type: e.target.value as ActivityType })
                  }
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="MEETING">Meeting / Demo</option>
                  <option value="EMAIL">Email</option>
                  <option value="NOTE">Internal Note</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Related Prospect</label>
                <select
                  value={newActivityForm.leadId}
                  onChange={(e) => {
                    const lead = MOCK_LEADS.find((l) => l.id === e.target.value);
                    setNewActivityForm({
                      ...newActivityForm,
                      leadId: e.target.value,
                      leadName: lead?.fullName || 'Prospect',
                    });
                  }}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  {MOCK_LEADS.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.fullName} {lead.companyName ? `(${lead.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rule BR-COMM-02: Mandatory Call Outcome & Duration for Phone Calls */}
            {newActivityForm.type === 'CALL' && (
              <div className="grid grid-cols-2 gap-3 p-2.5 rounded-btn bg-[#F0FDF4] border border-emerald-200/60">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#166534]">
                    Call Outcome <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newActivityForm.callOutcome}
                    onChange={(e) =>
                      setNewActivityForm({ ...newActivityForm, callOutcome: e.target.value as CallOutcome })
                    }
                    className="w-full h-7 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                  >
                    <option value="CONNECTED">Connected</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="BUSY">Busy</option>
                    <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#166534]">
                    Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 12m 40s"
                    value={newActivityForm.callDuration}
                    onChange={(e) => setNewActivityForm({ ...newActivityForm, callDuration: e.target.value })}
                    className="w-full h-7 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">
                Summary / Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Outbound Call Connected / Budget Validation"
                value={newActivityForm.title}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, title: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Detailed Notes / Transcript</label>
              <textarea
                rows={3}
                placeholder="Enter conversation highlights, client questions, or agreement notes..."
                value={newActivityForm.description}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, description: e.target.value })}
                className="w-full p-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Logged By</label>
              <select
                value={newActivityForm.authorName}
                onChange={(e) => setNewActivityForm({ ...newActivityForm, authorName: e.target.value })}
                className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
              >
                <option value="Arjun Verma">Arjun Verma</option>
                <option value="Priya Sharma">Priya Sharma</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLogModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
              >
                Save Touchpoint
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Activity Detail Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        {selectedActivity && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-btn border shrink-0",
                    getActivityTypeConfig(selectedActivity.type).bgColor
                  )}
                >
                  {React.createElement(getActivityTypeConfig(selectedActivity.type).icon, {
                    className: cn("h-3.5 w-3.5", getActivityTypeConfig(selectedActivity.type).iconColor),
                  })}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold text-txt-primary truncate">
                    {selectedActivity.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-txt-muted">
                    Logged {selectedActivity.type.toLowerCase()} event
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-card border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Prospect</span>
                  <span className="font-semibold text-txt-primary">{selectedActivity.leadName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Activity Type</span>
                  <Badge variant={getActivityTypeConfig(selectedActivity.type).badgeVariant}>
                    {getActivityTypeConfig(selectedActivity.type).label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Logged At</span>
                  <span className="font-semibold text-txt-primary tabular-nums">
                    {formatDate(selectedActivity.createdAt)} (
                    {new Date(selectedActivity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Author</span>
                  <span className="font-semibold text-txt-primary">{selectedActivity.authorName}</span>
                </div>
              </div>

              {selectedActivity.description && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    Full Notes / Transcript
                  </span>
                  <p className="p-3 bg-white rounded-btn border border-border text-txt-secondary leading-relaxed text-xs">
                    {selectedActivity.description}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
                asChild
              >
                <Link to="/leads" onClick={() => setSelectedActivity(null)}>
                  View Prospect
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
