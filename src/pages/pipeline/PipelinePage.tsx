import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MOCK_PIPELINE_STAGES, MOCK_DEALS } from '@/mocks/mockData';
import { Deal } from '@/types/crm';
import { formatCurrency } from '@/lib/utils';
import {
  KanbanSquare,
  Table as TableIcon,
  PlusCircle,
  Building,
  Calendar,
  User as UserIcon,
  ExternalLink,
  CheckCircle2,
  X,
  TrendingUp,
} from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const stages = MOCK_PIPELINE_STAGES;
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [mobileStageFilter, setMobileStageFilter] = useState('ALL');

  // Modal states
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    title: '',
    companyName: '',
    leadName: '',
    stageId: 'stage-1',
    amount: 500000,
    probability: 30,
    expectedCloseDate: '2026-11-15',
    ownerName: 'Arjun Verma',
  });

  // Calculate totals
  const totalPipelineValue = useMemo(() => {
    return stages.reduce((acc, s) => acc + s.totalValue, 0);
  }, [stages]);

  const totalDealsCount = useMemo(() => {
    return stages.reduce((acc, s) => acc + s.dealCount, 0);
  }, [stages]);

  const uniqueOwners = useMemo(() => {
    return Array.from(new Set(deals.map((d) => d.ownerName)));
  }, [deals]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Owner filter
      if (ownerFilter !== 'ALL' && deal.ownerName !== ownerFilter) {
        return false;
      }

      // Mobile stage filter
      if (mobileStageFilter !== 'ALL' && deal.stageId !== mobileStageFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = deal.title.toLowerCase().includes(q);
        const matchesCompany = (deal.companyName || '').toLowerCase().includes(q);
        const matchesLead = deal.leadName.toLowerCase().includes(q);
        const matchesOwner = deal.ownerName.toLowerCase().includes(q);

        return matchesTitle || matchesCompany || matchesLead || matchesOwner;
      }

      return true;
    });
  }, [deals, ownerFilter, mobileStageFilter, searchQuery]);

  // Mobile stage pills
  const mobileStageOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Stages', count: filteredDeals.length },
      ...stages.map((stg) => {
        const count = deals.filter((d) => d.stageId === stg.id).length;
        return {
          id: stg.id,
          label: stg.name,
          count,
        };
      }),
    ];
  }, [stages, deals, filteredDeals.length]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setOwnerFilter('ALL');
    setMobileStageFilter('ALL');
  };

  const handleAddDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealForm.title.trim()) return;

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title: newDealForm.title,
      leadId: `lead-${Date.now()}`,
      leadName: newDealForm.leadName || newDealForm.companyName || 'Prospect',
      companyName: newDealForm.companyName || undefined,
      stageId: newDealForm.stageId,
      amount: Number(newDealForm.amount) || 0,
      currency: 'INR',
      probability: Number(newDealForm.probability) || 20,
      expectedCloseDate: newDealForm.expectedCloseDate,
      ownerId: 'user-1',
      ownerName: newDealForm.ownerName,
      status: 'OPEN',
    };

    setDeals([newDeal, ...deals]);
    setIsAddModalOpen(false);
    setNewDealForm({
      title: '',
      companyName: '',
      leadName: '',
      stageId: 'stage-1',
      amount: 500000,
      probability: 30,
      expectedCloseDate: '2026-11-15',
      ownerName: 'Arjun Verma',
    });
  };

  const handleAdvanceStage = (deal: Deal) => {
    const currentIndex = stages.findIndex((s) => s.id === deal.stageId);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      const updated = deals.map((d) => (d.id === deal.id ? { ...d, stageId: nextStage.id } : d));
      setDeals(updated);
      if (selectedDeal && selectedDeal.id === deal.id) {
        setSelectedDeal({ ...selectedDeal, stageId: nextStage.id });
      }
    }
  };

  const hasActiveFilters = searchQuery !== '' || ownerFilter !== 'ALL' || mobileStageFilter !== 'ALL';

  return (
    <div className="space-y-4 select-none">
      {/* 1. Standardized Page Header */}
      <PageHeader
        title="Pipeline"
        count={`${formatCurrency(totalPipelineValue)} (${totalDealsCount} deals)`}
        description="Active revenue stages, deal progression, and sales conversion velocity"
        actions={
          <div className="flex items-center gap-2">
            {/* View Switcher Toggle */}
            <div className="hidden sm:inline-flex items-center rounded-btn border border-border bg-white p-0.5 shadow-subtle">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-[#16181B] text-white shadow-subtle'
                    : 'text-txt-secondary hover:text-txt-primary'
                }`}
                aria-label="Kanban board view"
              >
                <KanbanSquare className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#16181B] text-white shadow-subtle'
                    : 'text-txt-secondary hover:text-txt-primary'
                }`}
                aria-label="Table list view"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white cursor-pointer shadow-subtle"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Add Deal
            </Button>
          </div>
        }
      />

      {/* 2. Compact Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-card border border-border shadow-card">
        <SearchInput
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search deals by title, company, lead, owner..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {/* Owner Filter Dropdown */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-8 rounded-input border border-border bg-white px-2.5 py-1 text-xs text-txt-primary shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            aria-label="Filter deals by owner"
          >
            <option value="ALL">All Owners</option>
            {uniqueOwners.map((own) => (
              <option key={own} value={own}>
                {own}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-txt-muted hover:text-txt-primary cursor-pointer"
            >
              <X className="mr-1 h-3 w-3" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* 3. Mobile Stage Filter Pills (Shown only on small screens) */}
      <div className="sm:hidden overflow-x-auto pb-1">
        <FilterPills
          options={mobileStageOptions}
          activeId={mobileStageFilter}
          onChange={(id) => setMobileStageFilter(id)}
        />
      </div>

      {/* 4. Main Pipeline Content */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="relative w-full overflow-x-auto pb-3 pt-1">
          <div className="flex gap-3 items-start min-w-[1080px] sm:min-w-[1240px]">
            {stages.map((stage) => {
              const stageDeals = filteredDeals.filter((d) => d.stageId === stage.id);
              const isWonStage = stage.stageType === 'WON';

              return (
                <div
                  key={stage.id}
                  className={`flex-1 min-w-[220px] max-w-[280px] rounded-card border flex flex-col gap-2.5 p-2.5 transition-colors ${
                    isWonStage
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/80 border-border'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-xs text-txt-primary truncate">
                        {stage.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums shrink-0 ${
                          isWonStage
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-white text-txt-secondary border border-border'
                        }`}
                      >
                        {stageDeals.length}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-txt-muted tabular-nums shrink-0 ml-1">
                      {formatCurrency(stage.totalValue)}
                    </span>
                  </div>

                  {/* Stage Cards Container */}
                  <div className="space-y-2 min-h-[140px] flex-1">
                    {stageDeals.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center border border-dashed border-border rounded-btn text-center p-2 text-txt-muted text-[11px]">
                        <span>No active deals</span>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className="bg-white rounded-card border border-border p-3 space-y-2 shadow-card hover:border-slate-300 hover:shadow-subtle transition-all cursor-pointer group select-none active:scale-[0.99]"
                        >
                          {/* Deal Header: Title */}
                          <div className="flex items-start justify-between gap-1.5">
                            <h4 className="text-xs font-semibold text-txt-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {deal.title}
                            </h4>
                            <div onClick={(e) => e.stopPropagation()}>
                              <ActionMenu
                                items={[
                                  {
                                    label: 'View Deal',
                                    icon: ExternalLink,
                                    onClick: () => setSelectedDeal(deal),
                                  },
                                  {
                                    label: 'Advance Stage',
                                    icon: TrendingUp,
                                    onClick: () => handleAdvanceStage(deal),
                                  },
                                ]}
                              />
                            </div>
                          </div>

                          {/* Company / Prospect Contact */}
                          <div className="flex items-center gap-1 text-[11px] text-txt-muted">
                            <Building className="h-3 w-3 shrink-0" />
                            <span className="truncate">{deal.companyName || deal.leadName}</span>
                          </div>

                          {/* Commercial Metric: Amount & Win Probability */}
                          <div className="pt-1.5 border-t border-border flex items-center justify-between">
                            <span className="text-xs font-bold text-txt-primary tabular-nums">
                              {formatCurrency(deal.amount, deal.currency)}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-badge text-[10px] font-semibold bg-slate-100 text-txt-secondary border border-border tabular-nums">
                              {deal.probability}% win
                            </span>
                          </div>

                          {/* Card Footer: Close Date & Owner Avatar */}
                          <div className="flex items-center justify-between text-[10px] text-txt-muted pt-0.5">
                            <div className="flex items-center gap-1 tabular-nums">
                              <Calendar className="h-3 w-3 text-txt-muted" />
                              <span>{deal.expectedCloseDate}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="bg-primary-soft text-primary text-[8px] font-bold">
                                  {deal.ownerName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[70px]">{deal.ownerName}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="rounded-card border border-border bg-white shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Deal & Prospect</TableHead>
                  <TableHead className="w-[160px]">Current Stage</TableHead>
                  <TableHead className="w-[140px] text-right">Value</TableHead>
                  <TableHead className="w-[110px] text-center">Probability</TableHead>
                  <TableHead className="w-[140px]">Expected Close</TableHead>
                  <TableHead className="w-[150px]">Owner</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-txt-muted text-xs">
                      No deals match the selected criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeals.map((deal) => {
                    const currentStage = stages.find((s) => s.id === deal.stageId);

                    return (
                      <TableRow
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        className="cursor-pointer hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Title & Company */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-txt-primary block group-hover:text-primary transition-colors">
                              {deal.title}
                            </span>
                            <span className="text-[11px] text-txt-muted flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {deal.companyName || deal.leadName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Stage */}
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-xs font-semibold bg-slate-100 text-txt-secondary border border-border">
                            {currentStage?.name || 'Open'}
                          </span>
                        </TableCell>

                        {/* Value */}
                        <TableCell className="text-right">
                          <span className="font-bold text-xs text-txt-primary tabular-nums">
                            {formatCurrency(deal.amount, deal.currency)}
                          </span>
                        </TableCell>

                        {/* Probability */}
                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-txt-secondary tabular-nums">
                            {deal.probability}%
                          </span>
                        </TableCell>

                        {/* Expected Close */}
                        <TableCell>
                          <span className="text-xs text-txt-secondary tabular-nums">
                            {deal.expectedCloseDate}
                          </span>
                        </TableCell>

                        {/* Owner */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary-soft text-primary text-[10px] font-bold">
                                {deal.ownerName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-txt-primary font-medium">
                              {deal.ownerName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <ActionMenu
                            items={[
                              {
                                label: 'View Deal',
                                icon: ExternalLink,
                                onClick: () => setSelectedDeal(deal),
                              },
                              {
                                label: 'Advance Stage',
                                icon: TrendingUp,
                                onClick: () => handleAdvanceStage(deal),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-border text-xs text-txt-muted">
            <span>
              Showing <strong className="text-txt-primary tabular-nums">{filteredDeals.length}</strong> deals
            </span>
            <span className="text-[11px]">Click row to inspect deal commercials</span>
          </div>
        </div>
      )}

      {/* 5. Deal Detail Preview Modal */}
      <Dialog open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)}>
        {selectedDeal && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-base font-bold text-txt-primary">
                    {selectedDeal.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-txt-muted mt-0.5">
                    {selectedDeal.companyName || selectedDeal.leadName}
                  </DialogDescription>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Amount
                  </span>
                  <span className="text-lg font-bold text-txt-primary tabular-nums">
                    {formatCurrency(selectedDeal.amount, selectedDeal.currency)}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              {/* Stage Progress Bar / Card */}
              <div className="p-3 rounded-card bg-slate-50 border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider">
                    Current Stage
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {stages.find((s) => s.id === selectedDeal.stageId)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-txt-secondary pt-1">
                  <span>Win Probability: <strong>{selectedDeal.probability}%</strong></span>
                  <span>Target Date: <strong>{selectedDeal.expectedCloseDate}</strong></span>
                </div>
              </div>

              {/* Deal Commercial Details */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-card bg-white border border-border">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Contact Prospect
                  </span>
                  <span className="font-medium text-txt-primary block">
                    {selectedDeal.leadName}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Account Owner
                  </span>
                  <span className="font-medium text-txt-primary flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-txt-muted" />
                    {selectedDeal.ownerName}
                  </span>
                </div>
              </div>

              {/* Stage Advancement Quick CTA */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => handleAdvanceStage(selectedDeal)}
                  className="flex-1 h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white cursor-pointer"
                >
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Advance to Next Stage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    alert(`Deal marked as Closed-Won`);
                    setSelectedDeal(null);
                  }}
                  className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Mark Won
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedDeal(null)}
                className="h-8 text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* 6. Add Deal Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-section-title text-txt-primary">Create New Deal</DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Add a commercial opportunity to the active sales pipeline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDealSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="text-caption text-txt-secondary block font-medium">
                Deal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDealForm.title}
                onChange={(e) => setNewDealForm({ ...newDealForm, title: e.target.value })}
                placeholder="e.g. Enterprise Cloud ERP Migration"
                className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Company Name</label>
                <input
                  type="text"
                  value={newDealForm.companyName}
                  onChange={(e) => setNewDealForm({ ...newDealForm, companyName: e.target.value })}
                  placeholder="e.g. Horizon Fintech"
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Contact Person</label>
                <input
                  type="text"
                  value={newDealForm.leadName}
                  onChange={(e) => setNewDealForm({ ...newDealForm, leadName: e.target.value })}
                  placeholder="e.g. Sandeep Varma"
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Deal Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={newDealForm.amount}
                  onChange={(e) => setNewDealForm({ ...newDealForm, amount: Number(e.target.value) })}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Initial Stage</label>
                <select
                  value={newDealForm.stageId}
                  onChange={(e) => setNewDealForm({ ...newDealForm, stageId: e.target.value })}
                  className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {stages.map((stg) => (
                    <option key={stg.id} value={stg.id}>
                      {stg.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Win Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newDealForm.probability}
                  onChange={(e) => setNewDealForm({ ...newDealForm, probability: Number(e.target.value) })}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Expected Close Date</label>
                <input
                  type="date"
                  value={newDealForm.expectedCloseDate}
                  onChange={(e) => setNewDealForm({ ...newDealForm, expectedCloseDate: e.target.value })}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white cursor-pointer"
              >
                Create Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
