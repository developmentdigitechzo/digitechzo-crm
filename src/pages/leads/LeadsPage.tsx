import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { crmApi } from '@/lib/api';
import { Lead, LeadSource, TaskPriority, TaskActionType } from '@/types/crm';
import { formatDate } from '@/lib/utils';
import {
  PlusCircle,
  Download,
  Phone,
  MessageSquare,
  Mail,
  Building,
  User as UserIcon,
  Sparkles,
  Calendar,
  X,
  ExternalLink,
  Edit,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');

  // Selected lead for detail preview modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Add lead modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    source: 'WEBSITE_FORM' as LeadSource,
    priority: 'MEDIUM' as TaskPriority,
    temperature: '' as '' | 'HOT' | 'WARM' | 'COLD',
    serviceInterest: 'Custom Web Application Development',
    ownerName: 'DigiTechzo Administrator',
    nextActionDueAt: '',
    nextActionType: 'CALL' as TaskActionType,
    nextActionPurpose: '',
  });

  // Edit lead modal state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    email: '',
    serviceInterest: '',
  });

  // Real Backend Data Query
  const {
    data: leadsResponse,
    isLoading,
  } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.getLeads({ limit: 100 }),
  });

  const rawLeads: any[] = leadsResponse?.items || leadsResponse?.data || [];

  // Adapt backend LeadResponseDto to frontend Lead model
  const leads: Lead[] = useMemo(() => {
    return rawLeads.map((item: any) => ({
      id: item.id,
      fullName: item.fullName,
      companyName: item.companyName || undefined,
      title: item.title || undefined,
      phone: item.phone,
      email: item.email,
      source: item.source,
      status: item.status,
      leadScore: item.leadScore ?? 80,
      serviceInterest: item.serviceInterest,
      ownerId: item.ownerId || item.owner?.id || '',
      ownerName: item.ownerName || item.owner?.name || 'Unassigned',
      lastActivityAt: item.lastActivityAt || item.createdAt,
      createdAt: item.createdAt,
      nextAction: item.nextAction
        ? {
            actionType: item.nextAction.type || 'CALL',
            date: item.nextAction.dueDate ? item.nextAction.dueDate.split('T')[0] : '',
            time: item.nextAction.dueDate
              ? new Date(item.nextAction.dueDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : undefined,
            ownerId: item.nextAction.ownerId || item.ownerId || '',
            ownerName: item.ownerName || 'Account Owner',
            purpose: item.nextAction.purpose || 'Follow-up',
          }
        : undefined,
    }));
  }, [rawLeads]);

  // Calculate status counts
  const statusOptions: FilterOption[] = useMemo(() => {
    const hotCount = leads.filter((l) => l.status === 'HOT').length;
    const warmCount = leads.filter((l) => l.status === 'WARM').length;
    const coldCount = leads.filter((l) => l.status === 'COLD').length;
    const wonCount = leads.filter((l) => l.status === 'CONVERTED').length;
    const unqualCount = leads.filter((l) => l.status === 'UNQUALIFIED' || l.status === 'LOST').length;

    return [
      { id: 'ALL', label: 'All', count: leads.length },
      { id: 'HOT', label: 'Hot', count: hotCount, countVariant: 'danger' },
      { id: 'WARM', label: 'Warm', count: warmCount, countVariant: 'warning' },
      { id: 'COLD', label: 'Cold', count: coldCount, countVariant: 'info' },
      { id: 'CONVERTED', label: 'Won', count: wonCount },
      { id: 'UNQUALIFIED', label: 'Unqualified', count: unqualCount, countVariant: 'neutral' },
    ];
  }, [leads]);

  // Unique sources and owners for filters
  const uniqueSources = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.source)));
  }, [leads]);

  const uniqueOwners = useMemo(() => {
    const owners = Array.from(new Set(leads.map((l) => l.ownerName).filter(Boolean)));
    return owners.length > 0 ? owners : ['DigiTechzo Administrator'];
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (statusFilter !== 'ALL' && lead.status !== statusFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) {
        return false;
      }

      // Owner filter
      if (ownerFilter !== 'ALL' && lead.ownerName !== ownerFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.fullName.toLowerCase().includes(q);
        const matchesCompany = (lead.companyName || '').toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        const matchesEmail = (lead.email || '').toLowerCase().includes(q);
        const matchesService = lead.serviceInterest.toLowerCase().includes(q);

        return matchesName || matchesCompany || matchesPhone || matchesEmail || matchesService;
      }

      return true;
    });
  }, [leads, statusFilter, sourceFilter, ownerFilter, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setOwnerFilter('ALL');
  };

  // Create Lead with Real Backend API Integration
  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanName = newLeadForm.fullName.trim();
    let rawPhone = newLeadForm.phone.trim().replace(/[\s\-\(\)]/g, '');
    if (!rawPhone.startsWith('+')) {
      // Format 10-digit Indian numbers with +91 if needed, otherwise prefix +
      rawPhone = rawPhone.length === 10 ? `+91${rawPhone}` : `+${rawPhone}`;
    }

    // Only set email if explicitly provided by the user (no fake/default email)
    const cleanEmail = newLeadForm.email.trim()
      ? newLeadForm.email.trim().toLowerCase()
      : undefined;

    if (!cleanName || !rawPhone) {
      setCreateError('Full Name and Phone Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await crmApi.createLead({
        fullName: cleanName,
        companyName: newLeadForm.companyName.trim() || undefined,
        phone: rawPhone,
        email: cleanEmail,
        source: newLeadForm.source,
        priority: newLeadForm.priority || 'MEDIUM',
        temperature: newLeadForm.temperature ? (newLeadForm.temperature as 'HOT' | 'WARM' | 'COLD') : undefined,
        serviceInterest: newLeadForm.serviceInterest.trim() || 'Custom Web Application Development',
        nextActionDueAt: newLeadForm.nextActionDueAt
          ? new Date(newLeadForm.nextActionDueAt).toISOString()
          : undefined,
        nextActionType: newLeadForm.nextActionDueAt ? newLeadForm.nextActionType : undefined,
        nextActionPurpose: newLeadForm.nextActionDueAt
          ? (newLeadForm.nextActionPurpose.trim() || 'Follow-up')
          : undefined,
      });

      // Invalidate queries so Leads and Dashboard both update immediately
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-leads'] });

      setIsAddModalOpen(false);
      setNewLeadForm({
        fullName: '',
        companyName: '',
        phone: '',
        email: '',
        source: 'WEBSITE_FORM' as LeadSource,
        priority: 'MEDIUM' as TaskPriority,
        temperature: '' as '' | 'HOT' | 'WARM' | 'COLD',
        serviceInterest: 'Custom Web Application Development',
        ownerName: 'DigiTechzo Administrator',
        nextActionDueAt: '',
        nextActionType: 'CALL' as TaskActionType,
        nextActionPurpose: '',
      });
    } catch (err: any) {
      setCreateError(
        err?.message || 'Failed to create lead. Please verify the entered information.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Lead Modal
  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      fullName: lead.fullName,
      companyName: lead.companyName || '',
      phone: lead.phone,
      email: lead.email || '',
      serviceInterest: lead.serviceInterest,
    });
    setEditError(null);
  };

  // Save Lead Edits with Real Backend API Integration
  const handleEditLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setEditError(null);

    let rawPhone = editForm.phone.trim().replace(/[\s\-\(\)]/g, '');
    if (!rawPhone.startsWith('+')) {
      rawPhone = rawPhone.length === 10 ? `+91${rawPhone}` : `+${rawPhone}`;
    }

    setIsEditSubmitting(true);
    try {
      const cleanEditEmail = editForm.email.trim()
        ? editForm.email.trim().toLowerCase()
        : undefined;

      await crmApi.updateLead(editingLead.id, {
        fullName: editForm.fullName.trim(),
        companyName: editForm.companyName.trim() || undefined,
        phone: rawPhone,
        email: cleanEditEmail,
        serviceInterest: editForm.serviceInterest.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-leads'] });

      // Update local preview if selected
      if (selectedLead?.id === editingLead.id) {
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                fullName: editForm.fullName.trim(),
                companyName: editForm.companyName.trim() || undefined,
                phone: rawPhone,
                email: cleanEditEmail,
                serviceInterest: editForm.serviceInterest.trim(),
              }
            : null
        );
      }

      setEditingLead(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update lead. Please try again.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const hasActiveFilters =
    searchQuery !== '' || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || ownerFilter !== 'ALL';

  return (
    <div className="space-y-4 select-none">
      {/* 1. Page Header */}
      <PageHeader
        title="Leads"
        count={`${filteredLeads.length} of ${leads.length}`}
        description="Prospective client inquiries, qualified opportunities, and lead queue"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                alert(`Exporting ${filteredLeads.length} leads to CSV`);
              }}
              className="h-8 text-xs cursor-pointer"
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-txt-muted" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setCreateError(null);
                setIsAddModalOpen(true);
              }}
              className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white cursor-pointer shadow-subtle"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Add Lead
            </Button>
          </div>
        }
      />

      {/* 2. Lead Status Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <FilterPills
          options={statusOptions}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id)}
        />
      </div>

      {/* 3. Search and Quick Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-card border border-border shadow-card">
        <SearchInput
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search by name, company, phone, email, service..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
          {/* Source Dropdown */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8 rounded-input border border-border bg-white px-2.5 py-1 text-xs text-txt-primary shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            aria-label="Filter by source"
          >
            <option value="ALL">All Sources</option>
            {uniqueSources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>

          {/* Owner Dropdown */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-8 rounded-input border border-border bg-white px-2.5 py-1 text-xs text-txt-primary shadow-subtle focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            aria-label="Filter by owner"
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

      {/* 4. Leads Content: High-Density Table on Desktop/Tablet, Responsive Cards on Mobile */}
      {isLoading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-card border border-border shadow-card">
          <Loader2 className="h-6 w-6 animate-spin text-[#57B71B] mb-2" />
          <p className="text-xs font-semibold text-txt-primary">Loading leads from server...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <EmptyState
          title="No leads match your criteria"
          description={
            hasActiveFilters
              ? 'Try modifying or clearing your filters to see more prospect records.'
              : 'Get started by creating your first prospective lead.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Add Lead'}
          onAction={hasActiveFilters ? handleResetFilters : () => setIsAddModalOpen(true)}
          className="bg-white"
        />
      ) : (
        <>
          {/* Desktop & Tablet Table (Hidden on small mobile) */}
          <div className="hidden sm:block rounded-card border border-border bg-white shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Lead</TableHead>
                    <TableHead className="w-[180px]">Contact</TableHead>
                    <TableHead className="w-[110px]">Source</TableHead>
                    <TableHead className="w-[130px]">Status & Score</TableHead>
                    <TableHead className="w-[180px]">Service Line</TableHead>
                    <TableHead className="w-[140px]">Owner</TableHead>
                    <TableHead className="min-w-[210px]">Next Action</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer group hover:bg-slate-50/80 transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* 1. Lead / Company */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-txt-primary block leading-tight group-hover:text-primary transition-colors">
                            {lead.fullName}
                          </span>
                          <span className="text-[11px] text-txt-muted flex items-center gap-1">
                            <Building className="h-3 w-3 text-txt-muted shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {lead.companyName || 'Individual'}
                            </span>
                          </span>
                        </div>
                      </TableCell>

                      {/* 2. Contact (Phone & Email) */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <span className="text-txt-primary font-medium block leading-tight tabular-nums">
                            {lead.phone}
                          </span>
                          <span className="text-[11px] text-txt-muted block truncate max-w-[150px]">
                            {lead.email}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Source */}
                      <TableCell>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-badge text-[10px] font-semibold bg-slate-100 text-txt-secondary border border-border">
                          {lead.source}
                        </span>
                      </TableCell>

                      {/* 4. Status & Lead Score */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={lead.status} type="lead" />
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-txt-secondary tabular-nums">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            {lead.leadScore}
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Service Line */}
                      <TableCell>
                        <span
                          className="text-xs text-txt-primary truncate block max-w-[170px]"
                          title={lead.serviceInterest}
                        >
                          {lead.serviceInterest}
                        </span>
                      </TableCell>

                      {/* 6. Owner */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-primary-soft text-primary text-[9px] font-bold">
                              {lead.ownerName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-txt-primary truncate max-w-[100px]">
                            {lead.ownerName}
                          </span>
                        </div>
                      </TableCell>

                      {/* 7. Next Action */}
                      <TableCell>
                        {lead.nextAction ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-primary">
                                {lead.nextAction.actionType}
                              </span>
                              <span className="text-[11px] text-txt-muted tabular-nums">
                                {lead.nextAction.time || formatDate(lead.nextAction.date)}
                              </span>
                            </div>
                            <span
                              className="text-[11px] text-txt-secondary truncate block max-w-[200px]"
                              title={lead.nextAction.purpose}
                            >
                              {lead.nextAction.purpose}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-badge text-[10px] font-medium bg-slate-100 text-txt-muted">
                            No action scheduled
                          </span>
                        )}
                      </TableCell>

                      {/* 8. Row Action */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          items={[
                            {
                              label: 'Edit Lead',
                              icon: Edit,
                              onClick: () => handleOpenEdit(lead),
                            },
                            {
                              label: 'View Dossier',
                              icon: ExternalLink,
                              onClick: () => setSelectedLead(lead),
                            },
                            {
                              label: `Call ${lead.phone}`,
                              icon: Phone,
                              onClick: () => alert(`Initiating click-to-call to ${lead.phone}`),
                            },
                            {
                              label: 'Send WhatsApp',
                              icon: MessageSquare,
                              onClick: () => alert(`Opening WhatsApp thread with ${lead.phone}`),
                            },
                            {
                              label: 'Send Email',
                              icon: Mail,
                              onClick: () => alert(`Opening email composer for ${lead.email}`),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Table Footer / Summary */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/70 border-t border-border text-xs text-txt-muted">
              <span>
                Showing <strong className="text-txt-primary tabular-nums">{filteredLeads.length}</strong> of{' '}
                <strong className="text-txt-primary tabular-nums">{leads.length}</strong> leads
              </span>
              <span className="text-[11px]">Click any row to open the 360° prospect dossier</span>
            </div>
          </div>

          {/* Mobile Stacked Cards (Visible only on <640px) */}
          <div className="sm:hidden space-y-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="bg-white rounded-card border border-border p-3.5 space-y-2.5 shadow-card active:bg-slate-50 transition-colors"
              >
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-xs text-txt-primary leading-tight">
                      {lead.fullName}
                    </h3>
                    <p className="text-[11px] text-txt-muted">{lead.companyName || 'Individual'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={lead.status} type="lead" />
                    <span className="text-[11px] font-semibold text-txt-secondary tabular-nums">
                      {lead.leadScore}
                    </span>
                  </div>
                </div>

                {/* Service Interest */}
                <div className="text-xs text-txt-secondary">
                  <span className="text-[10px] uppercase font-semibold text-txt-muted tracking-wider block">
                    Service
                  </span>
                  <span className="line-clamp-1">{lead.serviceInterest}</span>
                </div>

                {/* Next Action Pill */}
                {lead.nextAction && (
                  <div className="p-2 rounded-btn bg-slate-50 border border-border text-xs space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-primary">
                        Next: {lead.nextAction.actionType}
                      </span>
                      <span className="text-txt-muted tabular-nums">
                        {lead.nextAction.time || formatDate(lead.nextAction.date)}
                      </span>
                    </div>
                    <p className="text-[11px] text-txt-secondary truncate">
                      {lead.nextAction.purpose}
                    </p>
                  </div>
                )}

                {/* Footer: Owner + Touchpoint Actions */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-xs text-txt-muted">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="bg-primary-soft text-primary text-[8px] font-bold">
                        {lead.ownerName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] truncate max-w-[120px]">{lead.ownerName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleOpenEdit(lead)}
                      className="h-7 w-7 text-txt-muted hover:text-primary"
                      aria-label="Edit lead"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => alert(`Calling ${lead.phone}`)}
                      className="h-7 w-7 text-txt-muted hover:text-primary"
                      aria-label="Call lead"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedLead(lead)}
                      className="h-7 text-xs px-2"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 5. Lead 360° Dossier Preview Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        {selectedLead && (
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-base font-bold text-txt-primary flex items-center gap-2">
                    {selectedLead.fullName}
                    <StatusBadge status={selectedLead.status} type="lead" />
                  </DialogTitle>
                  <DialogDescription className="text-xs text-txt-muted mt-0.5">
                    {selectedLead.title ? `${selectedLead.title} • ` : ''}
                    {selectedLead.companyName || 'Independent Prospect'}
                  </DialogDescription>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    BANT Score
                  </span>
                  <span className="text-lg font-bold text-txt-primary tabular-nums">
                    {selectedLead.leadScore}
                    <span className="text-xs text-txt-muted font-normal">/100</span>
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Scheduled Next Action Banner */}
              {selectedLead.nextAction ? (
                <div className="p-3 rounded-card bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs">
                        Scheduled Next Action: {selectedLead.nextAction.actionType}
                      </span>
                      <span className="text-[11px] font-medium tabular-nums">
                        {selectedLead.nextAction.time || formatDate(selectedLead.nextAction.date)}
                      </span>
                    </div>
                    <p className="text-xs text-[#15803D]">{selectedLead.nextAction.purpose}</p>
                    <p className="text-[10px] text-[#166534] pt-0.5">
                      Assigned to: {selectedLead.nextAction.ownerName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-card bg-slate-50 border border-border text-txt-muted text-xs flex items-center justify-between">
                  <span>No scheduled next action</span>
                </div>
              )}

              {/* Core Information Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-card bg-slate-50 border border-border">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Contact Phone
                  </span>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="font-semibold text-txt-primary hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-txt-muted" />
                    {selectedLead.phone}
                  </a>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="font-medium text-txt-primary hover:text-primary transition-colors truncate block flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-txt-muted shrink-0" />
                    <span className="truncate">{selectedLead.email}</span>
                  </a>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Acquisition Source
                  </span>
                  <span className="font-medium text-txt-primary">{selectedLead.source}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                    Account Owner
                  </span>
                  <span className="font-medium text-txt-primary flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-txt-muted" />
                    {selectedLead.ownerName}
                  </span>
                </div>
              </div>

              {/* Service Interest */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-txt-muted uppercase tracking-wider block">
                  Service Interest & Commercial Requirement
                </span>
                <p className="p-2.5 rounded-btn border border-border bg-white text-txt-primary font-medium">
                  {selectedLead.serviceInterest}
                </p>
              </div>

              {/* Quick Communication Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Calling ${selectedLead.phone}`)}
                  className="flex-1 h-8 text-xs cursor-pointer hover:border-primary hover:text-primary"
                >
                  <Phone className="mr-1.5 h-3.5 w-3.5" /> Call Prospect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Launching WhatsApp to ${selectedLead.phone}`)}
                  className="flex-1 h-8 text-xs cursor-pointer hover:border-[#16A34A] hover:text-[#16A34A]"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Composing email to ${selectedLead.email}`)}
                  className="flex-1 h-8 text-xs cursor-pointer hover:border-blue-500 hover:text-blue-600"
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                </Button>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(selectedLead)}
                className="h-8 text-xs cursor-pointer"
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Details
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedLead(null)}
                className="h-8 text-xs cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* 6. Create New Lead Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-section-title text-txt-primary">Create New Lead</DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Record a new prospect inquiry and persist it to PostgreSQL
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddLeadSubmit} className="space-y-3 py-2 text-xs">
            {createError && (
              <div className="p-2.5 rounded-btn bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2 text-xs text-[#DC2626]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{createError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-caption text-txt-secondary block font-medium">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newLeadForm.fullName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, fullName: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                disabled={isSubmitting}
                className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Company Name</label>
                <input
                  type="text"
                  value={newLeadForm.companyName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, companyName: e.target.value })}
                  placeholder="e.g. Acme Tech Solutions"
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-caption text-txt-secondary block font-medium">
                Email Address <span className="text-[11px] text-txt-muted font-normal">(Optional - will not save fake email if blank)</span>
              </label>
              <input
                type="email"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                placeholder="rajesh@acmetech.in"
                disabled={isSubmitting}
                className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Lead Source</label>
                <select
                  value={newLeadForm.source}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, source: e.target.value as LeadSource })
                  }
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="WEBSITE_FORM">WEBSITE_FORM</option>
                  <option value="META_ADS">META_ADS</option>
                  <option value="GOOGLE_ADS">GOOGLE_ADS</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="MANUAL">MANUAL</option>
                  <option value="PHONE_INBOUND">PHONE_INBOUND</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Assign Owner</label>
                <select
                  value={newLeadForm.ownerName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, ownerName: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {uniqueOwners.map((own) => (
                    <option key={own} value={own}>
                      {own}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-caption text-txt-secondary block font-medium">Service Interest</label>
              <input
                type="text"
                value={newLeadForm.serviceInterest}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, serviceInterest: e.target.value })}
                placeholder="e.g. Custom Web Application Development"
                disabled={isSubmitting}
                className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Priority & Customer Temperature */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Customer Priority</label>
                <select
                  value={newLeadForm.priority}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, priority: e.target.value as TaskPriority })
                  }
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM (Default)</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Customer Temperature</label>
                <select
                  value={newLeadForm.temperature}
                  onChange={(e) =>
                    setNewLeadForm({
                      ...newLeadForm,
                      temperature: e.target.value as '' | 'HOT' | 'WARM' | 'COLD',
                    })
                  }
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">None (Unrated)</option>
                  <option value="HOT">HOT</option>
                  <option value="WARM">WARM</option>
                  <option value="COLD">COLD</option>
                </select>
              </div>
            </div>

            {/* Follow-up / Next Action Setting ("follow data setting") */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-caption font-semibold text-txt-primary block">
                Next Follow-Up / Action (Optional)
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-txt-muted block">Follow-Up Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newLeadForm.nextActionDueAt}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, nextActionDueAt: e.target.value })
                    }
                    disabled={isSubmitting}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-txt-muted block">Action Type</label>
                  <select
                    value={newLeadForm.nextActionType}
                    onChange={(e) =>
                      setNewLeadForm({
                        ...newLeadForm,
                        nextActionType: e.target.value as TaskActionType,
                      })
                    }
                    disabled={isSubmitting}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="INTERNAL_REVIEW">Internal Review</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-txt-muted block">Action Purpose / Agenda</label>
                <input
                  type="text"
                  value={newLeadForm.nextActionPurpose}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, nextActionPurpose: e.target.value })
                  }
                  placeholder="e.g. Introductory discovery call or review proposal"
                  disabled={isSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Create Lead'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Edit Lead Modal */}
      <Dialog open={!!editingLead} onOpenChange={(open) => !open && setEditingLead(null)}>
        {editingLead && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-section-title text-txt-primary">Edit Lead</DialogTitle>
              <DialogDescription className="text-xs text-txt-muted">
                Update prospect details and sync changes to PostgreSQL
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditLeadSubmit} className="space-y-3 py-2 text-xs">
              {editError && (
                <div className="p-2.5 rounded-btn bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2 text-xs text-[#DC2626]">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  disabled={isEditSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-caption text-txt-secondary block font-medium">Company Name</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    disabled={isEditSubmitting}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-caption text-txt-secondary block font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    disabled={isEditSubmitting}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={isEditSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-caption text-txt-secondary block font-medium">Service Interest</label>
                <input
                  type="text"
                  value={editForm.serviceInterest}
                  onChange={(e) => setEditForm({ ...editForm, serviceInterest: e.target.value })}
                  disabled={isEditSubmitting}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingLead(null)}
                  disabled={isEditSubmitting}
                  className="h-8 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isEditSubmitting}
                  className="h-8 text-xs bg-[#57B71B] hover:bg-[#469815] text-white cursor-pointer"
                >
                  {isEditSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
