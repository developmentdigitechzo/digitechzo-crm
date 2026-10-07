import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionMenu } from '@/components/common/ActionMenu';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { crmApi } from '@/lib/api';
import { TaskItem, TaskActionType, TaskPriority, TaskStatus } from '@/types/crm';
import { formatDate, cn } from '@/lib/utils';
import {
  PlusCircle,
  PhoneCall,
  MessageSquare,
  Calendar,
  Mail,
  FileText,
  AlertCircle,
  Clock,
  Building2,
  User,
  CheckCircle2,
  CalendarClock,
  Check,
  CheckSquare,
  ListFilter,
  Table as TableIcon,
  RotateCcw,
  ExternalLink,
  Trash2,
  Loader2,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'queue' | 'table'>('queue');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Form state for scheduling task
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    leadId: '',
    actionType: 'CALL' as TaskActionType,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '11:00 AM',
    priority: 'HIGH' as TaskPriority,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const {
    data: tasksResponse,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => crmApi.getTasks({ limit: 100 }),
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.getLeads({ limit: 100 }),
  });

  const leads = useMemo(() => {
    return leadsResponse?.items || leadsResponse?.leads || (Array.isArray(leadsResponse?.data) ? leadsResponse?.data : leadsResponse?.data?.items) || [];
  }, [leadsResponse]);

  // Map Backend Tasks to frontend TaskItem models
  const rawTasks = useMemo(() => {
    return tasksResponse?.data || tasksResponse?.items || [];
  }, [tasksResponse]);

  const tasks: TaskItem[] = useMemo(() => {
    return rawTasks.map((t: any) => {
      const isCompleted = t.status === 'COMPLETED';
      const isCancelled = t.status === 'CANCELLED';
      const isOverdue = !isCompleted && !isCancelled && new Date(t.dueDate) < new Date();
      const status: TaskStatus = isCompleted
        ? 'COMPLETED'
        : isCancelled
        ? 'CANCELLED'
        : isOverdue
        ? 'OVERDUE'
        : 'PENDING';

      let actionType: TaskActionType = 'CALL';
      if (t.taskType === 'REVIEW') {
        actionType = 'INTERNAL_REVIEW';
      } else if (
        ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'PROPOSAL', 'FOLLOW_UP', 'OTHER'].includes(t.taskType)
      ) {
        actionType = t.taskType as TaskActionType;
      }

      let dueTime = '';
      try {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime())) {
          dueTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        dueTime = '';
      }

      return {
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        leadId: t.leadId || undefined,
        leadName: t.lead
          ? `${t.lead.fullName}${t.lead.companyName ? ` (${t.lead.companyName})` : ''}`
          : undefined,
        dealId: t.dealId || undefined,
        dealTitle: t.deal?.title || undefined,
        actionType,
        dueDate: t.dueDate,
        dueTime,
        priority: (t.priority || 'MEDIUM') as TaskPriority,
        status,
        ownerId: t.assignee?.id || t.assigneeId || '',
        ownerName: t.assignee?.name || t.creator?.name || 'Unassigned',
        isNextAction: Boolean(t.leadId),
      };
    });
  }, [rawTasks]);

  // Calculate metrics
  const overdueCount = useMemo(() => tasks.filter((t) => t.status === 'OVERDUE').length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter((t) => t.status === 'PENDING').length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'COMPLETED').length, [tasks]);
  const totalCount = tasks.length;

  // Filter options for pills
  const filterOptions: FilterOption[] = useMemo(() => {
    const callCount = tasks.filter((t) => t.actionType === 'CALL').length;
    const waCount = tasks.filter((t) => t.actionType === 'WHATSAPP').length;
    const meetingCount = tasks.filter((t) => t.actionType === 'MEETING').length;

    return [
      { id: 'ALL', label: 'All', count: totalCount },
      { id: 'OVERDUE', label: 'Overdue', count: overdueCount, countVariant: 'danger' },
      { id: 'PENDING', label: 'Pending', count: pendingCount, countVariant: 'warning' },
      { id: 'COMPLETED', label: 'Completed', count: completedCount, countVariant: 'neutral' },
      { id: 'CALL', label: 'Calls', count: callCount },
      { id: 'WHATSAPP', label: 'WhatsApp', count: waCount },
      { id: 'MEETING', label: 'Meetings', count: meetingCount },
    ];
  }, [tasks, totalCount, overdueCount, pendingCount, completedCount]);

  // Unique owners
  const uniqueOwners = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.ownerName).filter(Boolean)));
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Type/Status filter
      if (filterType === 'OVERDUE' && task.status !== 'OVERDUE') return false;
      if (filterType === 'PENDING' && task.status !== 'PENDING') return false;
      if (filterType === 'COMPLETED' && task.status !== 'COMPLETED') return false;
      if (filterType === 'CALL' && task.actionType !== 'CALL') return false;
      if (filterType === 'WHATSAPP' && task.actionType !== 'WHATSAPP') return false;
      if (filterType === 'MEETING' && task.actionType !== 'MEETING') return false;

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

      // Owner filter
      if (ownerFilter !== 'ALL' && task.ownerName !== ownerFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesLead = (task.leadName || '').toLowerCase().includes(query);
        const matchesOwner = task.ownerName.toLowerCase().includes(query);
        const matchesType = task.actionType.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLead && !matchesOwner && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filterType, priorityFilter, ownerFilter, searchQuery]);

  // Task interaction handlers
  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      if (task.status === 'COMPLETED') {
        await crmApi.reopenTask(taskId);
      } else {
        await crmApi.completeTask(taskId, {
          completionNotes: 'Completed from tasks action queue',
          createActivity: true,
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
      ]);
    } catch (err: any) {
      console.error('Failed to toggle completion status:', err);
    }
  };

  const handleReschedule = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      const currentDate = new Date(task.dueDate);
      currentDate.setDate(currentDate.getDate() + 1);
      await crmApi.updateTask(taskId, {
        dueDate: currentDate.toISOString(),
        status: 'PENDING',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
      ]);
    } catch (err: any) {
      console.error('Failed to reschedule task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await crmApi.deleteTask(taskId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
      ]);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const taskTypeMap: Record<string, any> = {
        CALL: 'CALL',
        WHATSAPP: 'WHATSAPP',
        EMAIL: 'EMAIL',
        MEETING: 'MEETING',
        PROPOSAL: 'PROPOSAL',
        INTERNAL_REVIEW: 'REVIEW',
        REVIEW: 'REVIEW',
        FOLLOW_UP: 'FOLLOW_UP',
        OTHER: 'OTHER',
      };

      let scheduledDate = new Date(`${newTaskForm.dueDate}T10:00:00.000Z`);
      if (newTaskForm.dueTime) {
        const match = newTaskForm.dueTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const ampm = match[3]?.toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          const d = new Date(newTaskForm.dueDate);
          d.setHours(hours, minutes, 0, 0);
          if (!isNaN(d.getTime())) {
            scheduledDate = d;
          }
        }
      }

      await crmApi.createTask({
        title: newTaskForm.title.trim(),
        taskType: taskTypeMap[newTaskForm.actionType] || 'FOLLOW_UP',
        dueDate: scheduledDate.toISOString(),
        priority: newTaskForm.priority,
        leadId: newTaskForm.leadId || undefined,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
      ]);

      setNewTaskForm({
        title: '',
        leadId: '',
        actionType: 'CALL',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '11:00 AM',
        priority: 'HIGH',
      });
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to schedule task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAllFilters = () => {
    setFilterType('ALL');
    setPriorityFilter('ALL');
    setOwnerFilter('ALL');
    setSearchQuery('');
  };

  const isFiltered =
    filterType !== 'ALL' || priorityFilter !== 'ALL' || ownerFilter !== 'ALL' || searchQuery.trim() !== '';

  const getActionTypeIcon = (actionType: TaskActionType) => {
    switch (actionType) {
      case 'CALL':
        return <PhoneCall className="h-3.5 w-3.5 text-[#57B71B]" />;
      case 'WHATSAPP':
        return <MessageSquare className="h-3.5 w-3.5 text-[#16A34A]" />;
      case 'MEETING':
        return <Calendar className="h-3.5 w-3.5 text-[#7C3AED]" />;
      case 'EMAIL':
        return <Mail className="h-3.5 w-3.5 text-[#2563EB]" />;
      case 'PROPOSAL':
        return <FileText className="h-3.5 w-3.5 text-[#D97706]" />;
      default:
        return <CheckSquare className="h-3.5 w-3.5 text-[#556070]" />;
    }
  };

  const getActionTypeBg = (actionType: TaskActionType) => {
    switch (actionType) {
      case 'CALL':
        return 'bg-[#F0FDF4] border-emerald-200/60';
      case 'WHATSAPP':
        return 'bg-emerald-50 border-emerald-200/60';
      case 'MEETING':
        return 'bg-purple-50 border-purple-200/60';
      case 'EMAIL':
        return 'bg-blue-50 border-blue-200/60';
      case 'PROPOSAL':
        return 'bg-amber-50 border-amber-200/60';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  if (isTasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#57B71B]" />
        <p className="text-sm text-txt-muted">Loading follow-ups and tasks...</p>
      </div>
    );
  }

  if (isTasksError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h3 className="text-base font-semibold text-txt-primary">Failed to load tasks</h3>
        <p className="text-xs text-txt-muted max-w-sm">
          {tasksError instanceof Error ? tasksError.message : 'Network error loading tasks from PostgreSQL backend.'}
        </p>
        <Button size="sm" onClick={() => refetchTasks()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none max-w-full">
      {/* 1. Page Header */}
      <PageHeader
        title="Tasks"
        count={tasks.length}
        badge={overdueCount > 0 ? `${overdueCount} overdue` : 'all clear'}
        badgeVariant={overdueCount > 0 ? 'danger' : 'success'}
        description="Your follow-ups and scheduled actions"
        actions={
          <div className="flex items-center gap-2">
            {/* View Switcher: Queue vs Table */}
            <div className="flex items-center rounded-btn border border-border bg-white p-0.5 shadow-subtle">
              <button
                type="button"
                onClick={() => setViewMode('queue')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-btn transition-colors cursor-pointer',
                  viewMode === 'queue' ? 'bg-[#16181B] text-white' : 'text-txt-secondary hover:text-txt-primary'
                )}
                title="Action Queue View"
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Queue</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-btn transition-colors cursor-pointer',
                  viewMode === 'table' ? 'bg-[#16181B] text-white' : 'text-txt-secondary hover:text-txt-primary'
                )}
                title="Spreadsheet Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            <Button
              size="sm"
              className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Schedule Task
            </Button>
          </div>
        }
      />

      {/* 2. Overdue Action Alert Banner */}
      {overdueCount > 0 && filterType !== 'OVERDUE' && (
        <div className="rounded-card bg-[#FEF2F2] border border-rose-200/80 p-3 sm:p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-[#DC2626] shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#991B1B]">
                Action required: {overdueCount} overdue {overdueCount === 1 ? 'follow-up' : 'follow-ups'} scheduled
              </p>
              <p className="text-[11px] text-rose-700">
                Overdue follow-ups risk stalling active sales conversations. Log outcomes promptly.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3 bg-white border-rose-200 text-[#DC2626] hover:bg-rose-50 self-start sm:self-center shrink-0 cursor-pointer"
            onClick={() => setFilterType('OVERDUE')}
          >
            View Overdue ({overdueCount})
          </Button>
        </div>
      )}

      {/* 3. Task Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Active"
          value={totalCount}
          subtext="In current queue"
          icon={CalendarClock}
          iconVariant="neutral"
          onClick={() => setFilterType('ALL')}
          className={filterType === 'ALL' && !isFiltered ? 'border-[#57B71B] ring-1 ring-[#57B71B]/30' : ''}
        />
        <MetricCard
          label="Overdue"
          value={overdueCount}
          subtext="Needs immediate call"
          subtextVariant="danger"
          icon={Clock}
          iconVariant="danger"
          onClick={() => setFilterType('OVERDUE')}
          className={filterType === 'OVERDUE' ? 'border-[#DC2626] ring-1 ring-[#DC2626]/30' : ''}
        />
        <MetricCard
          label="Due Today / Pending"
          value={pendingCount}
          subtext="Scheduled for action"
          subtextVariant="warning"
          icon={CheckCircle2}
          iconVariant="warning"
          onClick={() => setFilterType('PENDING')}
          className={filterType === 'PENDING' ? 'border-[#D97706] ring-1 ring-[#D97706]/30' : ''}
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          subtext="Outcomes logged"
          subtextVariant="success"
          icon={Check}
          iconVariant="success"
          onClick={() => setFilterType('COMPLETED')}
          className={filterType === 'COMPLETED' ? 'border-[#16A34A] ring-1 ring-[#16A34A]/30' : ''}
        />
      </div>

      {/* 4. Compact Toolbar & Filter Pills */}
      <div className="flex flex-col gap-2.5 sm:gap-3 p-3 rounded-card border border-border bg-white shadow-none">
        {/* Top toolbar: Search + Select Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks by title, lead, owner..."
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Owners</option>
              {uniqueOwners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
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
        <FilterPills options={filterOptions} activeId={filterType} onChange={setFilterType} />
      </div>

      {/* 5. Main Task Action Queue or Table View */}
      {viewMode === 'queue' ? (
        <Card className="border-border shadow-none overflow-hidden bg-white">
          <CardHeader className="py-2.5 px-4 border-b border-border bg-slate-50/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xs font-bold text-txt-primary uppercase tracking-wide">
                Action Queue
              </CardTitle>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-txt-secondary border border-border tabular-nums">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-[#57B71B] hover:underline font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {filteredTasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={CheckCircle2}
                  title="No tasks found in this view"
                  description="All clear for the current selection. Try resetting your filter or schedule a new task."
                  actionLabel={isFiltered ? 'Reset filters' : 'Schedule Task'}
                  onAction={isFiltered ? resetAllFilters : () => setIsScheduleModalOpen(true)}
                />
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue = task.status === 'OVERDUE';
                const isCompleted = task.status === 'COMPLETED';

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors',
                      isCompleted ? 'bg-slate-50/40 opacity-75' : ''
                    )}
                  >
                    {/* Left: Quick Complete Toggle + Type Icon + Title + Lead Info */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {/* Interactive completion checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(task.id)}
                        className={cn(
                          'mt-0.5 sm:mt-0 flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer shrink-0',
                          isCompleted
                            ? 'bg-[#16A34A] border-[#16A34A] text-white'
                            : 'border-slate-300 hover:border-[#57B71B] bg-white'
                        )}
                        title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                      >
                        {isCompleted && <Check className="h-3.5 w-3.5" />}
                      </button>

                      {/* Task Action Type Icon */}
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-btn border shrink-0',
                          getActionTypeBg(task.actionType)
                        )}
                        title={task.actionType}
                      >
                        {getActionTypeIcon(task.actionType)}
                      </div>

                      {/* Title & Metadata */}
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className={cn(
                              'font-bold text-xs sm:text-sm text-txt-primary hover:text-[#57B71B] transition-colors truncate text-left cursor-pointer',
                              isCompleted ? 'line-through text-txt-muted' : ''
                            )}
                          >
                            {task.title}
                          </button>
                          <StatusBadge status={task.status} type="task" />
                          <StatusBadge status={task.priority} type="priority" />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-txt-secondary">
                          {task.leadName && (
                            <Link
                              to="/leads"
                              className="flex items-center gap-1 truncate font-medium text-txt-secondary hover:text-[#57B71B] transition-colors"
                            >
                              <Building2 className="h-3 w-3 text-txt-muted shrink-0" />
                              <span>{task.leadName}</span>
                            </Link>
                          )}
                          {task.ownerName && (
                            <span className="flex items-center gap-1 text-txt-muted truncate">
                              <User className="h-3 w-3 shrink-0" />
                              <span>{task.ownerName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Due Date/Time + Log Action + ActionMenu */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                      <div className="text-left sm:text-right">
                        <div
                          className={cn(
                            'text-[11px] font-semibold flex items-center gap-1 tabular-nums',
                            isOverdue ? 'text-[#DC2626]' : isCompleted ? 'text-txt-muted' : 'text-txt-primary'
                          )}
                        >
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>Due: {task.dueTime || formatDate(task.dueDate)}</span>
                        </div>
                        <span className="text-[10px] text-txt-muted block">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold shrink-0 cursor-pointer"
                          asChild
                        >
                          <Link to="/activities">Log Outcome</Link>
                        </Button>

                        <ActionMenu
                          items={[
                            {
                              label: isCompleted ? 'Mark Pending' : 'Mark Completed',
                              icon: Check,
                              onClick: () => handleToggleComplete(task.id),
                            },
                            {
                              label: 'Log Outcome',
                              icon: ExternalLink,
                              onClick: () => {
                                window.location.hash = '/activities';
                              },
                            },
                            {
                              label: 'Reschedule (+1 Day)',
                              icon: RotateCcw,
                              onClick: () => handleReschedule(task.id),
                            },
                            {
                              label: 'View Details',
                              onClick: () => setSelectedTask(task),
                            },
                            {
                              label: 'Delete Task',
                              icon: Trash2,
                              variant: 'danger',
                              onClick: () => handleDeleteTask(task.id),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ) : (
        /* Alternative Table View */
        <Card className="border-border shadow-none overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60">
                <TableRow>
                  <TableHead className="w-10 text-center py-2.5">Done</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Task & Action</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Related Lead</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Priority</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Due Date & Time</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Owner</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Status</TableHead>
                  <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center">
                      <EmptyState
                        icon={CheckCircle2}
                        title="No tasks found"
                        description="Try resetting your active filters."
                        actionLabel="Reset Filters"
                        onAction={resetAllFilters}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => {
                    const isOverdue = task.status === 'OVERDUE';
                    const isCompleted = task.status === 'COMPLETED';

                    return (
                      <TableRow
                        key={task.id}
                        className={cn(
                          'hover:bg-slate-50/80 transition-colors',
                          isCompleted ? 'bg-slate-50/40 opacity-75' : ''
                        )}
                      >
                        <TableCell className="text-center py-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task.id)}
                            className={cn(
                              'inline-flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer',
                              isCompleted
                                ? 'bg-[#16A34A] border-[#16A34A] text-white'
                                : 'border-slate-300 hover:border-[#57B71B] bg-white'
                            )}
                          >
                            {isCompleted && <Check className="h-3 w-3" />}
                          </button>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={cn('p-1 rounded border', getActionTypeBg(task.actionType))}>
                              {getActionTypeIcon(task.actionType)}
                            </div>
                            <span
                              onClick={() => setSelectedTask(task)}
                              className={cn(
                                'font-semibold text-xs text-txt-primary hover:text-[#57B71B] cursor-pointer',
                                isCompleted ? 'line-through text-txt-muted' : ''
                              )}
                            >
                              {task.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-txt-secondary font-medium">
                          {task.leadName || '—'}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge status={task.priority} type="priority" />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="text-xs font-semibold tabular-nums">
                            <span className={isOverdue ? 'text-[#DC2626]' : 'text-txt-primary'}>
                              {task.dueTime || formatDate(task.dueDate)}
                            </span>
                            <span className="text-[10px] text-txt-muted block font-normal">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-txt-secondary">
                          {task.ownerName}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge status={task.status} type="task" />
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 text-[11px] px-2 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold"
                              asChild
                            >
                              <Link to="/activities">Log</Link>
                            </Button>
                            <ActionMenu
                              items={[
                                {
                                  label: isCompleted ? 'Mark Pending' : 'Mark Completed',
                                  icon: Check,
                                  onClick: () => handleToggleComplete(task.id),
                                },
                                {
                                  label: 'Reschedule (+1 Day)',
                                  icon: RotateCcw,
                                  onClick: () => handleReschedule(task.id),
                                },
                                {
                                  label: 'View Details',
                                  onClick: () => setSelectedTask(task),
                                },
                                {
                                  label: 'Delete Task',
                                  icon: Trash2,
                                  variant: 'danger',
                                  onClick: () => handleDeleteTask(task.id),
                                },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* 6. Schedule Task Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary">Schedule Task</DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Schedule a sales follow-up call, WhatsApp check-in, or demo meeting.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-2.5 text-xs bg-red-50 text-red-600 rounded-md border border-red-200 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-3.5 py-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">
                Task Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Follow-up demo call regarding proposal"
                value={newTaskForm.title}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                className="w-full h-8 px-2.5 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Action Type</label>
                <select
                  value={newTaskForm.actionType}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, actionType: e.target.value as TaskActionType })
                  }
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  <option value="CALL">Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="MEETING">Meeting / Demo</option>
                  <option value="EMAIL">Email</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="INTERNAL_REVIEW">Internal Review</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Priority</label>
                <select
                  value={newTaskForm.priority}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, priority: e.target.value as TaskPriority })
                  }
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Related Prospect / Lead</label>
              <select
                value={newTaskForm.leadId}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, leadId: e.target.value })}
                className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
              >
                <option value="">None / General Task</option>
                {leads.map((lead: any) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.fullName} {lead.companyName ? `(${lead.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Due Date</label>
                <input
                  type="date"
                  required
                  value={newTaskForm.dueDate}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Due Time</label>
                <input
                  type="text"
                  placeholder="e.g. 11:30 AM"
                  value={newTaskForm.dueTime}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, dueTime: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Task'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Task Detail Preview Modal */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        {selectedTask && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded-btn border', getActionTypeBg(selectedTask.actionType))}>
                  {getActionTypeIcon(selectedTask.actionType)}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold text-txt-primary truncate">
                    {selectedTask.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-txt-muted">
                    Scheduled {selectedTask.actionType.toLowerCase()} commitment
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-card border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Status</span>
                  <StatusBadge status={selectedTask.status} type="task" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Priority</span>
                  <StatusBadge status={selectedTask.priority} type="priority" />
                </div>
                {selectedTask.leadName && (
                  <div className="flex justify-between items-center">
                    <span className="text-txt-muted font-medium">Related Prospect</span>
                    <span className="font-semibold text-txt-primary truncate max-w-[200px]">
                      {selectedTask.leadName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Scheduled Time</span>
                  <span className="font-semibold text-txt-primary tabular-nums">
                    {selectedTask.dueTime || '—'} ({formatDate(selectedTask.dueDate)})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Owner</span>
                  <span className="font-semibold text-txt-primary">{selectedTask.ownerName}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs cursor-pointer"
                onClick={async () => {
                  await handleToggleComplete(selectedTask.id);
                  setSelectedTask(null);
                }}
              >
                {selectedTask.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Completed'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
                  asChild
                >
                  <Link to="/activities" onClick={() => setSelectedTask(null)}>
                    Log Outcome
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
