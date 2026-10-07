import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import {
  MOCK_LEADS,
  MOCK_TASKS,
  MOCK_PIPELINE_STAGES,
  MOCK_ACTIVITIES,
} from '@/mocks/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Clock,
  PhoneCall,
  Flame,
  Calendar,
  PlusCircle,
  MessageSquare,
  TrendingUp,
  Activity,
  KanbanSquare,
  Building2,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const totalPipelineValue = MOCK_PIPELINE_STAGES.reduce((acc, s) => acc + s.totalValue, 0);
  const totalDealsCount = MOCK_PIPELINE_STAGES.reduce((acc, s) => acc + s.dealCount, 0);
  const hotLeads = MOCK_LEADS.filter((l) => l.status === 'HOT');
  const overdueTasks = MOCK_TASKS.filter((t) => t.status === 'OVERDUE');
  const pendingTasks = MOCK_TASKS.filter((t) => t.status === 'PENDING');

  return (
    <div className="space-y-5 select-none">
      {/* 1. Compact Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">
              Dashboard
            </h1>
            {user && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-[11px] font-semibold bg-primary-soft text-primary border border-emerald-200">
                {user.firstName} ({user.role})
              </span>
            )}
          </div>
          <p className="text-xs text-txt-muted mt-0.5">
            Your sales activity and priority queue at a glance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <Link to="/pipeline">
              <KanbanSquare className="mr-1.5 h-3.5 w-3.5 text-txt-muted" />
              Pipeline
            </Link>
          </Button>
          <Button size="sm" asChild className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white">
            <Link to="/leads">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary: 4 Compact Action-Focused Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Overdue */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
                Overdue
              </p>
              <div className="text-2xl font-bold tracking-tight text-[#DC2626] font-tabular">
                {overdueTasks.length}
              </div>
              <p className="text-[11px] text-[#DC2626] font-medium flex items-center gap-1">
                Action required
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-[#FEF2F2] text-[#DC2626] shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Follow-ups Due */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
                Follow-ups Due
              </p>
              <div className="text-2xl font-bold tracking-tight text-txt-primary font-tabular">
                {pendingTasks.length}
              </div>
              <p className="text-[11px] text-txt-secondary font-medium">
                Pending today
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-[#F0FDF4] text-[#57B71B] shrink-0">
              <PhoneCall className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Hot Leads */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
                Hot Leads
              </p>
              <div className="text-2xl font-bold tracking-tight text-[#D97706] font-tabular">
                {hotLeads.length}
              </div>
              <p className="text-[11px] text-txt-secondary font-medium">
                High budget & intent
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-[#FFFBEB] text-[#D97706] shrink-0">
              <Flame className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Pipeline Value */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-1.5">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold text-txt-muted uppercase tracking-wider">
                Active Pipeline
              </p>
              <div className="text-base sm:text-xl xl:text-2xl font-bold tracking-tight text-txt-primary font-tabular whitespace-nowrap">
                {formatCurrency(totalPipelineValue)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#16A34A] font-medium flex items-center gap-1 truncate">
                <TrendingUp className="h-3 w-3 shrink-0" /> {totalDealsCount} deals
              </p>
            </div>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-btn bg-emerald-50 text-[#16A34A] shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Operational Workspace (2-Column Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Action Priority Queue & Recent Leads */}
        <div className="lg:col-span-7 space-y-5">
          {/* Priority Follow-ups / Action Queue */}
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                  Priority Follow-ups
                </CardTitle>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-rose-200">
                  {MOCK_TASKS.length}
                </span>
              </div>
              <Link
                to="/tasks"
                className="text-xs text-[#57B71B] hover:text-[#469815] font-semibold flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {MOCK_TASKS.map((task) => {
                const isOverdue = task.status === 'OVERDUE';
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-4 hover:bg-slate-50/80 transition-colors gap-2.5 sm:gap-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-btn shrink-0 ${
                          task.actionType === 'CALL'
                            ? 'bg-[#F0FDF4] text-[#57B71B]'
                            : task.actionType === 'WHATSAPP'
                            ? 'bg-emerald-50 text-[#16A34A]'
                            : 'bg-purple-50 text-[#7C3AED]'
                        }`}
                      >
                        {task.actionType === 'CALL' && <PhoneCall className="h-3.5 w-3.5" />}
                        {task.actionType === 'WHATSAPP' && <MessageSquare className="h-3.5 w-3.5" />}
                        {task.actionType === 'MEETING' && <Calendar className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-txt-primary truncate">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-txt-muted truncate flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>{task.leadName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t border-slate-100 sm:border-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} type="task" />
                        <span
                          className={`text-[11px] font-medium ${
                            isOverdue ? 'text-[#DC2626]' : 'text-txt-muted'
                          }`}
                        >
                          {task.dueTime || formatDate(task.dueDate)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary"
                        asChild
                      >
                        <Link to="/activities">Log</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                  Recent Leads
                </CardTitle>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-txt-secondary border border-border">
                  {MOCK_LEADS.length}
                </span>
              </div>
              <Link
                to="/leads"
                className="text-xs text-[#57B71B] hover:text-[#469815] font-semibold flex items-center gap-1 transition-colors"
              >
                All leads <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border">
              {MOCK_LEADS.slice(0, 4).map((lead) => (
                <div
                  key={lead.id}
                  className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/80 transition-colors gap-2 sm:gap-0"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-txt-primary hover:text-[#57B71B] transition-colors">
                        {lead.fullName}
                      </span>
                      <StatusBadge status={lead.status} type="lead" />
                    </div>
                    <p className="text-[11px] text-txt-secondary truncate">
                      {lead.companyName} &bull; <span className="text-txt-muted">{lead.serviceInterest}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0 border-t border-slate-100 sm:border-0">
                    {lead.nextAction ? (
                      <span className="text-[11px] text-[#57B71B] font-semibold block">
                        Next: {lead.nextAction.actionType} ({lead.nextAction.time || formatDate(lead.nextAction.date)})
                      </span>
                    ) : (
                      <span className="text-[11px] text-txt-muted block">No action scheduled</span>
                    )}
                    <span className="text-[10px] text-txt-muted block mt-0.5">
                      Owner: {lead.ownerName}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Pipeline Summary & Recent Sales Activity */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pipeline Snapshot */}
          <Card className="border-border shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                  Pipeline Snapshot
                </CardTitle>
              </div>
              <Link
                to="/pipeline"
                className="text-xs text-[#57B71B] hover:text-[#469815] font-semibold flex items-center gap-1 transition-colors"
              >
                Kanban <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-3.5 space-y-2">
              {MOCK_PIPELINE_STAGES.map((stage) => {
                const isWon = stage.stageType === 'WON';
                const percentage = totalPipelineValue > 0
                  ? Math.round((stage.totalValue / totalPipelineValue) * 100)
                  : 0;

                return (
                  <div
                    key={stage.id}
                    className="p-2 rounded-btn border border-border/60 bg-white hover:bg-slate-50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isWon ? 'bg-[#16A34A]' : 'bg-[#57B71B]'
                          }`}
                        />
                        <span className="font-semibold text-txt-primary">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-tabular">
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-txt-secondary font-medium">
                          {stage.dealCount} deals
                        </span>
                        <span className="font-bold text-txt-primary text-xs">
                          {formatCurrency(stage.totalValue)}
                        </span>
                      </div>
                    </div>

                    {/* Stage Distribution Progress Bar */}
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isWon ? 'bg-[#16A34A]' : 'bg-[#57B71B]'
                        }`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Activity Stream */}
          <Card className="border-border shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                  Recent Activity
                </CardTitle>
              </div>
              <Link
                to="/activities"
                className="text-xs text-[#57B71B] hover:text-[#469815] font-semibold flex items-center gap-1 transition-colors"
              >
                History <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-3.5 divide-y divide-border">
              {MOCK_ACTIVITIES.slice(0, 3).map((act) => (
                <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Activity className="h-3 w-3 text-txt-muted shrink-0" />
                      <span className="font-bold text-txt-primary truncate">{act.title}</span>
                    </div>
                    <span className="text-[10px] text-txt-muted shrink-0 font-medium">
                      {formatDate(act.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-txt-secondary leading-relaxed line-clamp-2 pl-4.5">
                    {act.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
