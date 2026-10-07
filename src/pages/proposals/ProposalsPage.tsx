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
import { MOCK_LEADS, MOCK_DEALS } from '@/mocks/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  RotateCcw,
  Eye,
  Check,
  XCircle,
  Send,
} from 'lucide-react';

export type ProposalStatus = 'DRAFT' | 'SENT' | 'UNDER_REVIEW' | 'ACCEPTED' | 'DECLINED';

export interface ProposalItem {
  id: string;
  quoteNumber: string;
  clientName: string;
  companyName: string;
  leadId: string;
  dealId?: string;
  dealTitle?: string;
  versionNumber: number;
  versionLabel: string;
  amount: number;
  status: ProposalStatus;
  validUntil: string;
  ownerName: string;
  scopeNotes?: string;
}

const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: 'prop-1',
    quoteNumber: 'DTZ-2026-Q104',
    clientName: 'Rohan Deshmukh',
    companyName: 'Apex Logistics Ltd',
    leadId: 'lead-1',
    dealId: 'deal-1',
    dealTitle: 'B2B Wholesale Ordering Portal',
    versionNumber: 2,
    versionLabel: 'v2 (Revised)',
    amount: 650000,
    status: 'UNDER_REVIEW',
    validUntil: '2026-10-31',
    ownerName: 'Arjun Verma',
    scopeNotes: 'Custom B2B ordering portal with distributor tiering, automated invoicing, and ERP API connectors.',
  },
  {
    id: 'prop-2',
    quoteNumber: 'DTZ-2026-Q105',
    clientName: 'Ananya Iyer',
    companyName: 'Zenith EdTech',
    leadId: 'lead-2',
    dealId: 'deal-2',
    dealTitle: 'Performance Marketing Retainer Q4',
    versionNumber: 1,
    versionLabel: 'v1',
    amount: 350000,
    status: 'SENT',
    validUntil: '2026-10-25',
    ownerName: 'Arjun Verma',
    scopeNotes: 'Quarterly digital marketing, multi-channel search ads, campaign tracking, and lead generation management.',
  },
  {
    id: 'prop-3',
    quoteNumber: 'DTZ-2026-Q102',
    clientName: 'Rajesh Jain',
    companyName: 'Vanguard Retail Solutions',
    leadId: 'lead-5',
    dealId: 'deal-3',
    dealTitle: 'Omnichannel Customer Mobile App',
    versionNumber: 1,
    versionLabel: 'v1',
    amount: 800000,
    status: 'DRAFT',
    validUntil: '2026-11-15',
    ownerName: 'Priya Sharma',
    scopeNotes: 'Native iOS and Android client loyalty application with inventory synchronization.',
  },
  {
    id: 'prop-4',
    quoteNumber: 'DTZ-2026-Q098',
    clientName: 'Vikram Singhania',
    companyName: 'CloudScale Technologies',
    leadId: 'lead-3',
    dealId: undefined, // Demonstrating supported Lead-only relationship
    dealTitle: undefined,
    versionNumber: 1,
    versionLabel: 'v1',
    amount: 1200000,
    status: 'ACCEPTED',
    validUntil: '2026-09-30',
    ownerName: 'Arjun Verma',
    scopeNotes: 'Cloud infrastructure security hardening, SOC2 readiness audit, and Kubernetes cluster migration.',
  },
];

export const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);

  // Form state
  const [newProposalForm, setNewProposalForm] = useState({
    quoteNumber: `DTZ-2026-Q${106 + proposals.length - 4}`,
    leadId: MOCK_LEADS[0]?.id || 'lead-1',
    dealId: MOCK_DEALS[0]?.id || '',
    amount: 500000,
    validUntil: '2026-11-30',
    ownerName: 'Arjun Verma',
    scopeNotes: '',
  });

  // Derived counts and values
  const totalValue = useMemo(() => proposals.reduce((acc, p) => acc + p.amount, 0), [proposals]);
  const underReviewCount = useMemo(() => proposals.filter((p) => p.status === 'UNDER_REVIEW').length, [proposals]);
  const acceptedCount = useMemo(() => proposals.filter((p) => p.status === 'ACCEPTED').length, [proposals]);
  const sentCount = useMemo(() => proposals.filter((p) => p.status === 'SENT').length, [proposals]);
  const draftCount = useMemo(() => proposals.filter((p) => p.status === 'DRAFT').length, [proposals]);
  const declinedCount = useMemo(() => proposals.filter((p) => p.status === 'DECLINED').length, [proposals]);

  // Unique clients and owners derived from data
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(proposals.map((p) => p.companyName)));
  }, [proposals]);

  const uniqueOwners = useMemo(() => {
    return Array.from(new Set(proposals.map((p) => p.ownerName)));
  }, [proposals]);

  // Filter options for pills
  const filterOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'All', count: proposals.length },
      { id: 'UNDER_REVIEW', label: 'Under Review', count: underReviewCount, countVariant: 'info' },
      { id: 'SENT', label: 'Sent', count: sentCount },
      { id: 'DRAFT', label: 'Draft', count: draftCount },
      { id: 'ACCEPTED', label: 'Accepted', count: acceptedCount },
      { id: 'DECLINED', label: 'Declined', count: declinedCount, countVariant: 'danger' },
    ];
  }, [proposals.length, underReviewCount, sentCount, draftCount, acceptedCount, declinedCount]);

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (clientFilter !== 'ALL' && p.companyName !== clientFilter) return false;
      if (ownerFilter !== 'ALL' && p.ownerName !== ownerFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuote = p.quoteNumber.toLowerCase().includes(query);
        const matchesCompany = p.companyName.toLowerCase().includes(query);
        const matchesClient = p.clientName.toLowerCase().includes(query);
        const matchesDeal = (p.dealTitle || '').toLowerCase().includes(query);
        const matchesOwner = p.ownerName.toLowerCase().includes(query);
        if (!matchesQuote && !matchesCompany && !matchesClient && !matchesDeal && !matchesOwner) {
          return false;
        }
      }

      return true;
    });
  }, [proposals, statusFilter, clientFilter, ownerFilter, searchQuery]);

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setClientFilter('ALL');
    setOwnerFilter('ALL');
    setSearchQuery('');
  };

  const isFiltered = statusFilter !== 'ALL' || clientFilter !== 'ALL' || ownerFilter !== 'ALL' || searchQuery.trim() !== '';

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return <Badge variant="info">Under Review</Badge>;
      case 'SENT':
        return <Badge variant="tech">Sent</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">Accepted</Badge>;
      case 'DECLINED':
        return <Badge variant="danger">Declined</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = MOCK_LEADS.find((l) => l.id === newProposalForm.leadId);
    const deal = MOCK_DEALS.find((d) => d.id === newProposalForm.dealId);

    const newProp: ProposalItem = {
      id: `prop-${Date.now()}`,
      quoteNumber: newProposalForm.quoteNumber.trim(),
      clientName: lead?.fullName || 'Prospect',
      companyName: lead?.companyName || 'Lead Company',
      leadId: newProposalForm.leadId,
      dealId: deal?.id,
      dealTitle: deal?.title,
      versionNumber: 1,
      versionLabel: 'v1',
      amount: Number(newProposalForm.amount) || 0,
      status: 'DRAFT',
      validUntil: newProposalForm.validUntil,
      ownerName: newProposalForm.ownerName,
      scopeNotes: newProposalForm.scopeNotes.trim() || undefined,
    };

    setProposals([newProp, ...proposals]);
    setIsCreateModalOpen(false);
    setNewProposalForm({
      quoteNumber: `DTZ-2026-Q${106 + proposals.length - 3}`,
      leadId: MOCK_LEADS[0]?.id || 'lead-1',
      dealId: MOCK_DEALS[0]?.id || '',
      amount: 500000,
      validUntil: '2026-11-30',
      ownerName: 'Arjun Verma',
      scopeNotes: '',
    });
  };

  // Revision handler: v(n+1)
  const handleCreateRevision = (prop: ProposalItem) => {
    const nextVer = prop.versionNumber + 1;
    const revision: ProposalItem = {
      ...prop,
      id: `prop-${Date.now()}`,
      versionNumber: nextVer,
      versionLabel: `v${nextVer} (Revised)`,
      status: 'DRAFT',
    };

    setProposals([revision, ...proposals]);
    if (selectedProposal && selectedProposal.id === prop.id) {
      setSelectedProposal(revision);
    }
  };

  // Mock status transition
  const handleUpdateStatus = (propId: string, nextStatus: ProposalStatus) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status: nextStatus } : p))
    );
    if (selectedProposal && selectedProposal.id === propId) {
      setSelectedProposal((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  return (
    <div className="space-y-4 select-none max-w-full">
      {/* 1. Page Header */}
      <PageHeader
        title="Proposals"
        count={`${proposals.length} proposals`}
        badge={underReviewCount > 0 ? `${underReviewCount} under review` : undefined}
        badgeVariant="brand"
        actions={
          <Button
            size="sm"
            className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
            Create Proposal
          </Button>
        }
      />

      {/* 2. Compact Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Quoted Value"
          value={formatCurrency(totalValue)}
          subtext="Active commercial pipeline"
          icon={FileText}
          iconVariant="neutral"
          onClick={() => setStatusFilter('ALL')}
          className={statusFilter === 'ALL' && !isFiltered ? 'border-[#57B71B] ring-1 ring-[#57B71B]/30' : ''}
        />
        <MetricCard
          label="Under Review"
          value={underReviewCount}
          subtext="Awaiting client decision"
          icon={Clock}
          iconVariant="info"
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={statusFilter === 'UNDER_REVIEW' ? 'border-[#2563EB] ring-1 ring-[#2563EB]/30' : ''}
        />
        <MetricCard
          label="Accepted"
          value={acceptedCount}
          subtext="Won commercial contracts"
          subtextVariant="success"
          icon={CheckCircle2}
          iconVariant="success"
          onClick={() => setStatusFilter('ACCEPTED')}
          className={statusFilter === 'ACCEPTED' ? 'border-[#16A34A] ring-1 ring-[#16A34A]/30' : ''}
        />
        <MetricCard
          label="Drafts & Sent"
          value={draftCount + sentCount}
          subtext={`${sentCount} sent • ${draftCount} draft`}
          icon={Send}
          iconVariant="warning"
          onClick={() => setStatusFilter(sentCount > 0 ? 'SENT' : 'DRAFT')}
          className={statusFilter === 'SENT' || statusFilter === 'DRAFT' ? 'border-[#D97706] ring-1 ring-[#D97706]/30' : ''}
        />
      </div>

      {/* 3. Compact Toolbar & Filters */}
      <div className="flex flex-col gap-2.5 sm:gap-3 p-3 rounded-card border border-border bg-white shadow-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search proposals by quote #, client, deal, owner..."
            className="w-full sm:w-80"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-subtle"
            >
              <option value="ALL">All Clients</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
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

        <FilterPills
          options={filterOptions}
          activeId={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* 4. Primary View: Proposal Table */}
      {filteredProposals.length === 0 ? (
        <div className="p-8 bg-white rounded-card border border-border">
          <EmptyState
            icon={FileText}
            title="No proposals found"
            description="No quotation records match the current filter selection. Try resetting filters or create a new proposal."
            actionLabel={isFiltered ? "Reset filters" : "Create Proposal"}
            onAction={isFiltered ? resetAllFilters : () => setIsCreateModalOpen(true)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop & Tablet Table (contained scrolling) */}
          <div className="hidden sm:block rounded-card border border-border bg-white overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/60">
                  <TableRow>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Quote #</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Client / Deal</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Version</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Amount</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Status</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Valid Until</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase">Owner</TableHead>
                    <TableHead className="py-2.5 text-xs font-bold text-txt-muted uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedProposal(p)}
                          className="font-semibold text-xs text-primary hover:underline flex items-center gap-1.5 cursor-pointer font-mono"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span>{p.quoteNumber}</span>
                        </button>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="text-xs">
                          <Link
                            to="/leads"
                            className="font-semibold text-txt-primary hover:text-[#57B71B] transition-colors block leading-tight truncate max-w-xs"
                          >
                            {p.companyName}
                          </Link>
                          {p.dealTitle ? (
                            <span className="text-[11px] text-txt-secondary truncate block max-w-xs">
                              {p.dealTitle}
                            </span>
                          ) : (
                            <span className="text-[11px] text-txt-muted italic block">Lead proposal</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="neutral" className="text-[10px] font-mono">
                          {p.versionLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 font-bold text-xs text-txt-primary tabular-nums">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {getStatusBadge(p.status)}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs font-medium tabular-nums text-txt-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-txt-muted shrink-0" />
                          <span>{formatDate(p.validUntil)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-txt-secondary font-medium">
                        {p.ownerName}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedProposal(p)}
                            className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Preview
                          </Button>
                          <ActionMenu
                            items={[
                              {
                                label: 'View Details',
                                icon: Eye,
                                onClick: () => setSelectedProposal(p),
                              },
                              {
                                label: 'Create Revision (v+1)',
                                icon: RotateCcw,
                                onClick: () => handleCreateRevision(p),
                              },
                              {
                                label: 'Mark Accepted',
                                icon: Check,
                                onClick: () => handleUpdateStatus(p.id, 'ACCEPTED'),
                              },
                              {
                                label: 'Mark Declined',
                                icon: XCircle,
                                onClick: () => handleUpdateStatus(p.id, 'DECLINED'),
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

          {/* Mobile Stacked Transformation (for 390px with 0 page overflow) */}
          <div className="sm:hidden space-y-2.5">
            {filteredProposals.map((p) => (
              <div
                key={p.id}
                className="rounded-card border border-border bg-white p-3.5 space-y-2.5 shadow-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProposal(p)}
                      className="font-bold text-xs text-primary font-mono flex items-center gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{p.quoteNumber}</span>
                    </button>
                    <Badge variant="neutral" className="text-[10px] font-mono">
                      {p.versionLabel}
                    </Badge>
                  </div>
                  {getStatusBadge(p.status)}
                </div>

                <div>
                  <Link
                    to="/leads"
                    className="font-bold text-xs text-txt-primary hover:text-[#57B71B] block"
                  >
                    {p.companyName}
                  </Link>
                  {p.dealTitle && (
                    <p className="text-[11px] text-txt-secondary mt-0.5">{p.dealTitle}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-btn border border-slate-100">
                  <span className="text-txt-muted text-[11px]">Quoted Amount</span>
                  <span className="font-bold text-txt-primary tabular-nums">{formatCurrency(p.amount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-txt-muted">Valid: {formatDate(p.validUntil)}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedProposal(p)}
                      className="h-7 text-xs px-2.5 bg-slate-100 hover:bg-slate-200 text-txt-primary font-semibold"
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Create Proposal Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary">Create Proposal / Quotation</DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Generate a commercial quotation reference for an existing client or active deal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProposal} className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">
                  Quote # <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProposalForm.quoteNumber}
                  onChange={(e) => setNewProposalForm({ ...newProposalForm, quoteNumber: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs font-mono rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Client / Prospect</label>
                <select
                  value={newProposalForm.leadId}
                  onChange={(e) => setNewProposalForm({ ...newProposalForm, leadId: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
                >
                  {MOCK_LEADS.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.companyName || lead.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Related Deal</label>
              <select
                value={newProposalForm.dealId}
                onChange={(e) => setNewProposalForm({ ...newProposalForm, dealId: e.target.value })}
                className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle"
              >
                <option value="">None (Lead Only Proposal)</option>
                {MOCK_DEALS.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title} ({formatCurrency(deal.amount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">
                  Quoted Amount (INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newProposalForm.amount}
                  onChange={(e) => setNewProposalForm({ ...newProposalForm, amount: Number(e.target.value) })}
                  className="w-full h-8 px-2.5 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-subtle tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-txt-primary">Valid Until</label>
                <input
                  type="date"
                  required
                  value={newProposalForm.validUntil}
                  onChange={(e) => setNewProposalForm({ ...newProposalForm, validUntil: e.target.value })}
                  className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Owner</label>
              <select
                value={newProposalForm.ownerName}
                onChange={(e) => setNewProposalForm({ ...newProposalForm, ownerName: e.target.value })}
                className="w-full h-8 px-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle"
              >
                {uniqueOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-txt-primary">Scope Summary / Deliverables</label>
              <textarea
                rows={2}
                placeholder="High-level commercial deliverable highlights..."
                value={newProposalForm.scopeNotes}
                onChange={(e) => setNewProposalForm({ ...newProposalForm, scopeNotes: e.target.value })}
                className="w-full p-2 text-xs rounded-input border border-border bg-white text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-subtle resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
              >
                Create Proposal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Proposal Detail / Preview Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        {selectedProposal && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-btn border bg-emerald-50 border-emerald-200/60 text-[#57B71B]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-txt-primary font-mono">
                      {selectedProposal.quoteNumber}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-txt-muted">
                      {selectedProposal.versionLabel} • {selectedProposal.companyName}
                    </DialogDescription>
                  </div>
                </div>
                {getStatusBadge(selectedProposal.status)}
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-card border border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Client / Company</span>
                  <span className="font-semibold text-txt-primary">{selectedProposal.companyName}</span>
                </div>
                {selectedProposal.dealTitle && (
                  <div className="flex justify-between items-center">
                    <span className="text-txt-muted font-medium">Associated Deal</span>
                    <span className="font-medium text-txt-primary truncate max-w-[200px]">
                      {selectedProposal.dealTitle}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Quoted Total</span>
                  <span className="font-bold text-txt-primary text-sm tabular-nums">
                    {formatCurrency(selectedProposal.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Valid Until</span>
                  <span className="font-medium text-txt-primary tabular-nums">
                    {formatDate(selectedProposal.validUntil)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-txt-muted font-medium">Prepared By</span>
                  <span className="font-semibold text-txt-primary">{selectedProposal.ownerName}</span>
                </div>
              </div>

              {selectedProposal.scopeNotes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">
                    Scope of Work / Deliverables
                  </span>
                  <p className="p-2.5 bg-white rounded-btn border border-border text-txt-secondary leading-relaxed text-xs">
                    {selectedProposal.scopeNotes}
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
                onClick={() => setSelectedProposal(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs cursor-pointer"
                  onClick={() => handleCreateRevision(selectedProposal)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  New Revision
                </Button>

                {selectedProposal.status !== 'ACCEPTED' && (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer"
                    onClick={() => handleUpdateStatus(selectedProposal.id, 'ACCEPTED')}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark Accepted
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
