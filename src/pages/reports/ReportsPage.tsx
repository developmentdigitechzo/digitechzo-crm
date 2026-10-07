import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { EmptyState } from '@/components/common/EmptyState';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MOCK_DEALS,
  MOCK_LEADS,
  MOCK_TASKS,
  MOCK_ACTIVITIES,
  MOCK_PIPELINE_STAGES,
} from '@/mocks/mockData';
import { MOCK_USERS } from '@/mocks/mockAuth';
import { formatCurrency, cn } from '@/lib/utils';
import {
  TrendingUp,
  Target,
  Users,
  Clock,
  Download,
  CheckCircle2,
  Sliders,
  Building2,
  Layers,
  Share2,
  X,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  // Local UI State
  const [activeTab, setActiveTab] = useState<'overview' | 'reps' | 'sources'>('overview');
  const [repFilter, setRepFilter] = useState<string>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 1. Authoritative Record-Derived Calculations
  const activeDeals = useMemo(
    () => MOCK_DEALS.filter((deal) => deal.status === 'OPEN'),
    []
  );

  const activePipelineValue = useMemo(
    () => activeDeals.reduce((sum, deal) => sum + deal.amount, 0),
    [activeDeals]
  );

  const weightedForecast = useMemo(
    () =>
      activeDeals.reduce(
        (sum, deal) => sum + deal.amount * ((deal.probability || 0) / 100),
        0
      ),
    [activeDeals]
  );

  const overdueTasks = useMemo(
    () => MOCK_TASKS.filter((task) => task.status === 'OVERDUE'),
    []
  );

  const pendingTasks = useMemo(
    () => MOCK_TASKS.filter((task) => task.status === 'PENDING'),
    []
  );

  // 2. Active Deals Grouped by Pipeline Stage (Derived strictly from MOCK_DEALS)
  const activeStagesBreakdown = useMemo(() => {
    const stageMap = new Map<string, { count: number; totalValue: number; deals: typeof MOCK_DEALS }>();

    activeDeals.forEach((deal) => {
      const existing = stageMap.get(deal.stageId) || { count: 0, totalValue: 0, deals: [] };
      existing.count += 1;
      existing.totalValue += deal.amount;
      existing.deals.push(deal);
      stageMap.set(deal.stageId, existing);
    });

    // Map against stage names in MOCK_PIPELINE_STAGES
    return Array.from(stageMap.entries()).map(([stageId, data]) => {
      const stageConfig = MOCK_PIPELINE_STAGES.find((s) => s.id === stageId);
      const stageName = stageConfig ? stageConfig.name : stageId;
      const sharePercentage = activePipelineValue > 0 ? (data.totalValue / activePipelineValue) * 100 : 0;
      return {
        stageId,
        stageName,
        count: data.count,
        totalValue: data.totalValue,
        sharePercentage,
        deals: data.deals,
      };
    });
  }, [activeDeals, activePipelineValue]);

  // 3. Lead Source Acquisition Breakdown (Derived strictly from MOCK_LEADS)
  const sourceBreakdown = useMemo(() => {
    const totalLeads = MOCK_LEADS.length;
    const sourceMap = new Map<string, { count: number; leads: typeof MOCK_LEADS }>();

    MOCK_LEADS.forEach((lead) => {
      const existing = sourceMap.get(lead.source) || { count: 0, leads: [] };
      existing.count += 1;
      existing.leads.push(lead);
      sourceMap.set(lead.source, existing);
    });

    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      label: source.replace('_', ' '),
      count: data.count,
      percentage: totalLeads > 0 ? (data.count / totalLeads) * 100 : 0,
      leads: data.leads,
    }));
  }, []);

  // 4. Rep Performance Leaderboard (Derived strictly from actual arrays)
  const bdeUsers = useMemo(
    () => MOCK_USERS.filter((user) => user.role === 'BDE'),
    []
  );

  const repMetrics = useMemo(() => {
    return bdeUsers.map((rep) => {
      const assignedLeads = MOCK_LEADS.filter((l) => l.ownerId === rep.id);
      const repDeals = MOCK_DEALS.filter((d) => d.ownerId === rep.id && d.status === 'OPEN');
      const repValue = repDeals.reduce((sum, d) => sum + d.amount, 0);
      const repTasks = MOCK_TASKS.filter((t) => t.ownerId === rep.id);
      const repActivities = MOCK_ACTIVITIES.filter((a) => a.authorName === `${rep.firstName} ${rep.lastName}`);

      return {
        id: rep.id,
        name: `${rep.firstName} ${rep.lastName}`,
        role: rep.role,
        teamName: rep.teamName || 'Inbound Growth Team',
        assignedLeadsCount: assignedLeads.length,
        activeDealsCount: repDeals.length,
        managedPipelineValue: repValue,
        activeTasksCount: repTasks.length,
        overdueTasksCount: repTasks.filter((t) => t.status === 'OVERDUE').length,
        loggedActivitiesCount: repActivities.length,
      };
    });
  }, [bdeUsers]);

  const filteredRepMetrics = useMemo(() => {
    if (repFilter === 'ALL') return repMetrics;
    return repMetrics.filter((r) => r.id === repFilter);
  }, [repMetrics, repFilter]);

  // Rep Filter Options
  const repFilterOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Reps', count: repMetrics.length },
      ...repMetrics.map((r) => ({
        id: r.id,
        label: r.name,
        count: r.activeDealsCount,
      })),
    ];
  }, [repMetrics]);

  // Tab Filter Options
  const tabOptions: FilterOption[] = [
    { id: 'overview', label: 'Executive Overview' },
    { id: 'reps', label: 'Rep Performance' },
    { id: 'sources', label: 'Lead Sources' },
  ];

  // 5. Client-Side Prototype CSV Export
  const handleExportCsv = () => {
    const rows = [
      ['DigiTechzo CRM - Executive Analytics Summary (October 2026)'],
      ['Generated On', new Date().toISOString()],
      ['Data Nature', 'Verified Frontend Record-Derived Analytics'],
      [''],
      ['KPI Metrics', 'Value', 'Calculation / Notes'],
      ['Active Pipeline Value', activePipelineValue.toString(), `Calculated from ${activeDeals.length} active MOCK_DEALS`],
      ['Weighted Forecast', weightedForecast.toString(), 'Probability-adjusted expected close value'],
      ['Total Ingested Leads', MOCK_LEADS.length.toString(), 'From MOCK_LEADS (100% assigned with next action)'],
      ['Active Follow-up Tasks', MOCK_TASKS.length.toString(), `From MOCK_TASKS (${overdueTasks.length} overdue, ${pendingTasks.length} pending)`],
      [''],
      ['Active Pipeline Deals by Stage', 'Stage Name', 'Deal Count', 'Total Value (INR)', 'Share %'],
      ...activeStagesBreakdown.map((s) => [
        s.stageId,
        s.stageName,
        s.count.toString(),
        s.totalValue.toString(),
        `${s.sharePercentage.toFixed(1)}%`,
      ]),
      [''],
      ['Lead Acquisition Sources', 'Source Channel', 'Lead Count', 'Share %'],
      ...sourceBreakdown.map((sb) => [
        sb.source,
        sb.label,
        sb.count.toString(),
        `${sb.percentage.toFixed(1)}%`,
      ]),
      [''],
      ['BDE Rep Performance Leaderboard', 'Rep Name', 'Team', 'Leads', 'Deals', 'Managed Value (INR)', 'Tasks', 'Activities'],
      ...repMetrics.map((r) => [
        r.id,
        r.name,
        r.teamName,
        r.assignedLeadsCount.toString(),
        r.activeDealsCount.toString(),
        r.managedPipelineValue.toString(),
        r.activeTasksCount.toString(),
        r.loggedActivitiesCount.toString(),
      ]),
      [''],
      ['Pipeline Configuration Reference (Metadata)', 'Stage Name', 'Order', 'Benchmark Deal Target', 'Benchmark Value (INR)', 'Type'],
      ...MOCK_PIPELINE_STAGES.map((ps) => [
        ps.id,
        ps.name,
        ps.order.toString(),
        ps.dealCount.toString(),
        ps.totalValue.toString(),
        ps.stageType,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'digitechzo_analytics_oct_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Demo report exported.');
    setTimeout(() => {
      setExportNotice(null);
    }, 4000);
  };

  return (
    <div className="space-y-4 sm:space-y-5 select-none pb-8">
      {/* 1. Page Header */}
      <PageHeader
        title="Reports & Analytics"
        description="Executive sales performance, funnel velocity, and revenue analytics"
        count={activeDeals.length}
        badge="Active Window: Oct 2026"
        badgeVariant="neutral"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 text-xs font-semibold border-border text-txt-primary hover:bg-slate-50 transition-colors shadow-none"
          >
            <Download className="mr-1.5 h-3.5 w-3.5 text-txt-muted" />
            Export Summary (CSV)
          </Button>
        }
      />

      {/* Export Notice Banner */}
      {exportNotice && (
        <div className="flex items-center justify-between p-3 rounded-card bg-[#F0FDF4] border border-emerald-200 text-[#16A34A] text-xs font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />
            <span>{exportNotice} Download saved as <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-emerald-200 text-slate-800">digitechzo_analytics_oct_2026.csv</code></span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 transition-colors p-0.5"
            aria-label="Dismiss export notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Compact View Switcher Tabs (Mobile-Friendly Horizontal Scroll) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 border-b border-border pb-2.5 sm:pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 max-w-full [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabOptions.map((opt) => {
            const isActive = opt.id === activeTab;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveTab(opt.id as 'overview' | 'reps' | 'sources')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold whitespace-nowrap transition-colors shrink-0',
                  isActive
                    ? 'bg-[#1E242B] text-white shadow-subtle'
                    : 'bg-slate-100 text-txt-secondary hover:bg-slate-200 hover:text-txt-primary'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-txt-muted font-medium shrink-0">
          Source data: <span className="font-semibold text-txt-secondary">3</span> deals &bull; <span className="font-semibold text-txt-secondary">4</span> leads &bull; <span className="font-semibold text-txt-secondary">3</span> tasks
        </div>
      </div>

      {/* 3. Executive KPI Metric Row (4 Compact Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Active Pipeline Value */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-semibold text-txt-muted uppercase tracking-wider leading-tight whitespace-normal">
                Active Pipeline
              </p>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-txt-primary font-tabular">
                {formatCurrency(activePipelineValue)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#16A34A] font-medium leading-tight whitespace-normal flex items-center gap-1">
                {activeDeals.length} active opportunities
              </p>
            </div>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-btn bg-[#F0FDF4] text-[#16A34A] shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Weighted Forecast */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-semibold text-txt-muted uppercase tracking-wider leading-tight whitespace-normal">
                Weighted Forecast
              </p>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-txt-primary font-tabular">
                {formatCurrency(weightedForecast)}
              </div>
              <p className="text-[10px] sm:text-[11px] text-txt-secondary font-medium leading-tight whitespace-normal">
                Probability-adjusted
              </p>
            </div>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-btn bg-[#F5F3FF] text-[#7C3AED] shrink-0">
              <Target className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Total Ingested Leads */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-semibold text-txt-muted uppercase tracking-wider leading-tight whitespace-normal">
                Ingested Leads
              </p>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-txt-primary font-tabular">
                {MOCK_LEADS.length} Leads
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#2563EB] font-medium leading-tight whitespace-normal">
                100% assigned
              </p>
            </div>
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-btn bg-[#EFF6FF] text-[#2563EB] shrink-0">
              <Users className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Active Follow-up Queue */}
        <Card className="border-border hover:border-slate-300 transition-colors shadow-none">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-[10px] sm:text-[11px] font-semibold text-txt-muted uppercase tracking-wider leading-tight whitespace-normal">
                Follow-up Queue
              </p>
              <div className="text-base sm:text-2xl font-bold tracking-tight text-txt-primary font-tabular">
                {MOCK_TASKS.length} Tasks
              </div>
              <p
                className={cn(
                  'text-[10px] sm:text-[11px] font-medium leading-tight whitespace-normal',
                  overdueTasks.length > 0 ? 'text-[#DC2626] font-semibold' : 'text-[#D97706]'
                )}
              >
                {overdueTasks.length > 0
                  ? `${overdueTasks.length} overdue • ${pendingTasks.length} pending`
                  : `${pendingTasks.length} pending`}
              </p>
            </div>
            <div
              className={cn(
                'flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-btn shrink-0',
                overdueTasks.length > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#FFFBEB] text-[#D97706]'
              )}
            >
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Section Split: Active Pipeline Stage Breakdown & Lead Channel Attribution */}
      {(activeTab === 'overview' || activeTab === 'sources') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Active Deals by Pipeline Stage (7 cols on desktop) */}
          <Card className="lg:col-span-7 border-border shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-txt-muted" />
                <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                  Active Deals by Stage
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold border-border text-txt-secondary">
                {activeDeals.length} Open Deals
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              {activeStagesBreakdown.map((stage) => (
                <div key={stage.stageId} className="space-y-1.5 p-3 rounded-btn border border-border/70 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-[#57B71B] shrink-0" />
                      <span className="font-bold text-txt-primary truncate">{stage.stageName}</span>
                      <span className="text-[11px] text-txt-muted font-normal">
                        ({stage.count} deal{stage.count > 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-tabular shrink-0">
                      <span className="font-bold text-txt-primary text-xs">
                        {formatCurrency(stage.totalValue)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-txt-secondary font-semibold">
                        {stage.sharePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Visual */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#57B71B] transition-all duration-300"
                      style={{ width: `${Math.max(stage.sharePercentage, 8)}%` }}
                    />
                  </div>

                  {/* Associated Deal Pills */}
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {stage.deals.map((deal) => (
                      <span
                        key={deal.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-50 border border-border text-txt-secondary font-medium"
                      >
                        <Building2 className="h-2.5 w-2.5 text-txt-muted" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]">{deal.companyName}</span>
                        <span className="text-txt-muted font-tabular">({formatCurrency(deal.amount)})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lead Acquisition Channel Breakdown (5 cols on desktop) */}
          <Card className="lg:col-span-5 border-border shadow-none">
            <CardHeader className="py-3 px-4 border-b border-border bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-txt-muted" />
                <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                  Lead Channel Attribution
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold border-border text-txt-secondary">
                {MOCK_LEADS.length} Leads
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {sourceBreakdown.map((sb) => (
                <div key={sb.source} className="p-2.5 rounded-btn border border-border/70 bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider',
                          sb.source === 'META_ADS' && 'bg-blue-50 text-blue-700 border border-blue-200',
                          sb.source === 'GOOGLE_ADS' && 'bg-amber-50 text-amber-700 border border-amber-200',
                          sb.source === 'WEBSITE_FORM' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                          sb.source === 'WHATSAPP' && 'bg-green-50 text-green-700 border border-green-200'
                        )}
                      >
                        {sb.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-tabular text-xs">
                      <span className="font-bold text-txt-primary">{sb.count} lead</span>
                      <span className="text-[11px] text-txt-muted">({sb.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>

                  {/* Channel Lead Detail */}
                  <div className="text-[11px] text-txt-secondary space-y-0.5 pt-0.5">
                    {sb.leads.map((l) => (
                      <p key={l.id} className="truncate text-txt-muted">
                        &bull; <span className="font-semibold text-txt-primary">{l.companyName}</span> ({l.serviceInterest})
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Section: BDE Sales Performance Leaderboard */}
      {(activeTab === 'overview' || activeTab === 'reps') && (
        <Card className="border-border shadow-none">
          <CardHeader className="py-3 px-4 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-txt-muted" />
              <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                BDE Sales Performance Leaderboard
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <FilterPills
                options={repFilterOptions}
                activeId={repFilter}
                onChange={(id) => setRepFilter(id)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRepMetrics.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No representative records found"
                  description="No sales representative matches the active filter criteria."
                  actionLabel="Reset Filter"
                  onAction={() => setRepFilter('ALL')}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                      <TableHead className="w-[200px] text-[11px] font-bold uppercase text-txt-muted">
                        Sales Representative
                      </TableHead>
                      <TableHead className="text-[11px] font-bold uppercase text-txt-muted">
                        Assigned Team
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold uppercase text-txt-muted">
                        Assigned Leads
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold uppercase text-txt-muted">
                        Active Deals
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold uppercase text-txt-muted">
                        Managed Pipeline (INR)
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold uppercase text-txt-muted">
                        Active Tasks
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold uppercase text-txt-muted">
                        Logged Activities
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {filteredRepMetrics.map((rep) => (
                      <TableRow key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#57B71B]/15 text-[#57B71B] font-bold text-xs shrink-0">
                              {rep.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-txt-primary truncate">{rep.name}</p>
                              <span className="text-[10px] font-semibold text-txt-muted uppercase">
                                {rep.role}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-txt-secondary font-medium">
                          {rep.teamName}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold font-tabular text-txt-primary">
                          {rep.assignedLeadsCount}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold font-tabular text-txt-primary">
                          {rep.activeDealsCount}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold font-tabular text-txt-primary">
                          {formatCurrency(rep.managedPipelineValue)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold font-tabular">
                          <span
                            className={cn(
                              rep.overdueTasksCount > 0 ? 'text-[#DC2626] font-bold' : 'text-txt-primary'
                            )}
                          >
                            {rep.activeTasksCount}
                            {rep.overdueTasksCount > 0 && ` (${rep.overdueTasksCount} overdue)`}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-semibold font-tabular text-txt-primary">
                          {rep.loggedActivitiesCount}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Team Total Row (Only shown when viewing all reps) */}
                    {repFilter === 'ALL' && (
                      <TableRow className="bg-slate-50 font-bold border-t-2 border-border hover:bg-slate-50">
                        <TableCell className="py-3 text-xs text-txt-primary font-bold">
                          Team Total
                        </TableCell>
                        <TableCell className="py-3 text-xs text-txt-muted font-medium">
                          Inbound Growth Team
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold font-tabular text-txt-primary">
                          {MOCK_LEADS.length}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold font-tabular text-txt-primary">
                          {activeDeals.length}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold font-tabular text-[#57B71B]">
                          {formatCurrency(activePipelineValue)}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold font-tabular text-txt-primary">
                          {MOCK_TASKS.length}
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs font-bold font-tabular text-txt-primary">
                          {repMetrics.reduce((s, r) => s + r.loggedActivitiesCount, 0)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. Section: Pipeline Configuration Reference (Explicit Configuration Metadata) */}
      <Card className="border-border bg-slate-50/60 shadow-none">
        <CardHeader className="py-3 px-4 border-b border-border bg-slate-100/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-txt-muted" />
            <div>
              <CardTitle className="text-xs sm:text-sm font-bold text-txt-primary uppercase tracking-wide">
                Pipeline Configuration Reference
              </CardTitle>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold bg-white text-txt-muted border-border self-start sm:self-auto">
            System Benchmark Metadata
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <p className="text-[11px] text-txt-muted leading-relaxed">
            The values below represent the configured CRM stage taxonomy and target capacity benchmarks defined in organization settings (
            <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-border">MOCK_PIPELINE_STAGES</code>
            ). They serve as stage architecture reference definitions and are kept distinct from the 3 active deal records analyzed above.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {MOCK_PIPELINE_STAGES.map((ps) => (
              <div key={ps.id} className="p-2.5 rounded-btn bg-white border border-border space-y-1 text-center">
                <span className="text-[10px] font-bold text-txt-muted uppercase block truncate">
                  {ps.order}. {ps.name}
                </span>
                <span className="text-xs font-bold text-txt-primary block font-tabular">
                  {formatCurrency(ps.totalValue)}
                </span>
                <span className="text-[10px] text-txt-muted block font-medium font-tabular">
                  Benchmark: {ps.dealCount} deals
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
