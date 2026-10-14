import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricCard } from '@/components/common/MetricCard';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { crmApi } from '@/lib/api';
import { CustomerItem, CustomerStatus } from '@/types/crm';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CategorySelect } from '@/components/leads/CategorySelect';
import {
  PlusCircle,
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  RotateCcw,
  Eye,
  FileCheck2,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add form state
  const [formState, setFormState] = useState({
    companyName: '',
    contactName: '',
    title: '',
    contactEmail: '',
    contactPhone: '',
    status: 'ACTIVE' as CustomerStatus,
    leadId: '',
    dealId: '',
    category: '',
    notes: '',
  });

  // Edit form state
  const [editFormState, setEditFormState] = useState({
    companyName: '',
    contactName: '',
    title: '',
    contactEmail: '',
    contactPhone: '',
    status: 'ACTIVE' as CustomerStatus,
    category: '',
    notes: '',
  });

  // Real backend queries
  const {
    data: customersResponse,
    isLoading: isCustomersLoading,
    isError: isCustomersError,
    error: customersError,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers({ limit: 100 }),
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads'],
    queryFn: () => crmApi.getLeads({ limit: 100 }),
  });

  const { data: dealsResponse } = useQuery({
    queryKey: ['deals'],
    queryFn: () => crmApi.getDeals({ limit: 100 }),
  });

  // Extract raw lists
  const rawCustomers = useMemo(() => {
    return (
      customersResponse?.data ||
      customersResponse?.items ||
      (Array.isArray(customersResponse) ? customersResponse : [])
    );
  }, [customersResponse]);

  const leads = useMemo(() => {
    return (
      leadsResponse?.items ||
      leadsResponse?.leads ||
      (Array.isArray(leadsResponse?.data) ? leadsResponse?.data : leadsResponse?.data?.items) ||
      []
    );
  }, [leadsResponse]);

  const deals = useMemo(() => {
    return (
      dealsResponse?.deals ||
      dealsResponse?.data ||
      (Array.isArray(dealsResponse) ? dealsResponse : [])
    );
  }, [dealsResponse]);

  // Map Backend customer records to CustomerItem models
  const customers: CustomerItem[] = useMemo(() => {
    return rawCustomers.map((c: any) => {
      let status: CustomerStatus = 'ACTIVE';
      const upperStatus = String(c.status || '').toUpperCase();
      if (['ACTIVE', 'INACTIVE', 'AT_RISK', 'CHURNED'].includes(upperStatus)) {
        status = upperStatus as CustomerStatus;
      }

      return {
        id: c.id,
        organizationId: c.organizationId,
        leadId: c.leadId,
        dealId: c.dealId,
        companyName: c.companyName || 'Unnamed Company',
        contactName: c.contactName || 'Primary Contact',
        title: c.title || undefined,
        phone: c.phone || '—',
        email: c.email || '—',
        address: c.address || undefined,
        city: c.city || undefined,
        state: c.state || undefined,
        postalCode: c.postalCode || undefined,
        country: c.country || 'India',
        status,
        ownerId: c.ownerId,
        customerSince: c.customerSince,
        notes: c.notes || undefined,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        owner: c.owner,
        lead: c.lead,
        deal: c.deal,
        accountManager: c.owner?.name || 'Assigned Manager',
        purchasedServices: c.notes || (c.deal?.title ? `Deal: ${c.deal.title}` : 'Standard Account SLA'),
        contactEmail: c.email,
        contactPhone: c.phone,
      };
    });
  }, [rawCustomers]);

  // Unique owners for filter
  const ownerOptions = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.accountManager).filter(Boolean)));
  }, [customers]);

  // Status Filter Options for FilterPills
  const statusFilterOptions: FilterOption[] = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter((c) => c.status === 'ACTIVE' || c.status === 'Active').length;
    const inactiveCount = customers.filter((c) => c.status === 'INACTIVE' || c.status === 'Inactive').length;
    const atRiskCount = customers.filter((c) => c.status === 'AT_RISK').length;
    const churnedCount = customers.filter((c) => c.status === 'CHURNED').length;

    return [
      { id: 'ALL', label: 'All Accounts', count: totalCount },
      { id: 'ACTIVE', label: 'Active', count: activeCount },
      { id: 'INACTIVE', label: 'Inactive', count: inactiveCount },
      ...(atRiskCount > 0 ? [{ id: 'AT_RISK', label: 'At Risk', count: atRiskCount, countVariant: 'warning' as const }] : []),
      ...(churnedCount > 0 ? [{ id: 'CHURNED', label: 'Churned', count: churnedCount, countVariant: 'danger' as const }] : []),
    ];
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCompany = customer.companyName.toLowerCase().includes(query);
        const matchesContact = customer.contactName.toLowerCase().includes(query);
        const matchesService = (customer.purchasedServices || '').toLowerCase().includes(query);
        const matchesEmail = (customer.email || '').toLowerCase().includes(query);
        const matchesPhone = (customer.phone || '').toLowerCase().includes(query);
        if (!matchesCompany && !matchesContact && !matchesService && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        const cStatus = customer.status.toUpperCase();
        const fStatus = statusFilter.toUpperCase();
        if (cStatus !== fStatus) return false;
      }

      // Owner
      if (ownerFilter !== 'ALL' && customer.accountManager !== ownerFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, statusFilter, ownerFilter]);

  // Derived metrics
  const activeCount = useMemo(() => {
    return customers.filter((c) => c.status === 'ACTIVE' || c.status === 'Active').length;
  }, [customers]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setOwnerFilter('ALL');
  };

  const getStatusBadge = (status: CustomerStatus) => {
    const normalized = status.toUpperCase();
    switch (normalized) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="neutral">Inactive</Badge>;
      case 'AT_RISK':
        return <Badge variant="warning">At Risk</Badge>;
      case 'CHURNED':
        return <Badge variant="danger">Churned</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Add Customer submit handler
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.companyName.trim() || !formState.contactName.trim() || !formState.contactEmail.trim() || !formState.contactPhone.trim()) {
      setFormError('Please fill in all required fields (Company Name, Contact Person, Email, Phone).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.contactEmail.trim())) {
      setFormError('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const combinedNotes = [
      formState.category.trim() ? `Category: ${formState.category.trim()}` : '',
      formState.notes.trim(),
    ].filter(Boolean).join('\n\n') || undefined;

    try {
      await crmApi.createCustomer({
        companyName: formState.companyName.trim(),
        contactName: formState.contactName.trim(),
        title: formState.title.trim() || undefined,
        email: formState.contactEmail.trim().toLowerCase(),
        phone: formState.contactPhone.trim(),
        status: formState.status,
        leadId: formState.leadId || undefined,
        dealId: formState.dealId || undefined,
        notes: combinedNotes,
      });

      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });

      setIsAddModalOpen(false);
      setFormState({
        companyName: '',
        contactName: '',
        title: '',
        contactEmail: '',
        contactPhone: '',
        status: 'ACTIVE',
        leadId: '',
        dealId: '',
        category: '',
        notes: '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Customer setup & submit handler
  const handleOpenEdit = (customer: CustomerItem) => {
    setEditingCustomer(customer);
    let cat = '';
    let remNotes = customer.notes || '';
    if (remNotes.includes('Category: ')) {
      const match = remNotes.match(/Category:\s*([^\n]+)/);
      if (match) {
        cat = match[1].trim();
        remNotes = remNotes.replace(/Category:\s*[^\n]+(\n\n)?/, '').trim();
      }
    }
    setEditFormState({
      companyName: customer.companyName,
      contactName: customer.contactName,
      title: customer.title || '',
      contactEmail: customer.email,
      contactPhone: customer.phone,
      status: customer.status,
      category: cat,
      notes: remNotes,
    });
    setFormError(null);
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    if (!editFormState.companyName.trim() || !editFormState.contactName.trim() || !editFormState.contactEmail.trim() || !editFormState.contactPhone.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormState.contactEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const combinedNotes = [
      editFormState.category.trim() ? `Category: ${editFormState.category.trim()}` : '',
      editFormState.notes.trim(),
    ].filter(Boolean).join('\n\n') || undefined;

    try {
      await crmApi.updateCustomer(editingCustomer.id, {
        companyName: editFormState.companyName.trim(),
        contactName: editFormState.contactName.trim(),
        title: editFormState.title.trim() || undefined,
        email: editFormState.contactEmail.trim().toLowerCase(),
        phone: editFormState.contactPhone.trim(),
        status: editFormState.status,
        notes: combinedNotes,
      });

      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingCustomer(null);
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(null);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update customer account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Customer handler
  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer account?')) return;

    try {
      await crmApi.deleteCustomer(id);
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-4 select-none max-w-full">
      {/* Header */}
      <PageHeader
        title="Customers"
        count={`${activeCount} active`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
            className="h-8 px-3 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Customer
          </Button>
        }
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricCard
          label="Active Accounts"
          value={activeCount}
          subtext="Verified client organizations"
          subtextVariant="neutral"
          icon={Building2}
          iconVariant="neutral"
          onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
          className={statusFilter === 'ACTIVE' ? 'border-[#57B71B] ring-1 ring-[#57B71B]/30' : ''}
        />
        <MetricCard
          label="Invoices & Realized Revenue"
          value="Go to In-Voice"
          subtext="Click to view issued invoices and customer balances"
          subtextVariant="info"
          icon={TrendingUp}
          iconVariant="info"
          onClick={() => navigate('/in-voice')}
        />
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search company, contact, service..."
            />
          </div>
          <FilterPills
            options={statusFilterOptions}
            activeId={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Owner Filter */}
          <div className="flex items-center gap-1.5 text-xs text-txt-secondary">
            <span>Owner:</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              aria-label="Filter by Owner"
              className="h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
            >
              <option value="ALL">All Owners</option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL' || ownerFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-txt-muted hover:text-txt-primary"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {isCustomersLoading && (
        <div className="p-12 bg-white rounded-card border border-border flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-[#57B71B] animate-spin" />
          <p className="text-xs text-txt-muted">Loading customer accounts from server...</p>
        </div>
      )}

      {isCustomersError && (
        <div className="p-8 bg-red-50/50 rounded-card border border-red-200 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <p className="text-sm font-semibold text-red-900">Failed to load customer accounts</p>
          <p className="text-xs text-red-700 max-w-md">{(customersError as any)?.message || 'An error occurred while fetching customer directory.'}</p>
          <Button size="sm" variant="outline" onClick={() => refetchCustomers()} className="h-8 text-xs">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main Content: Table on Desktop, Stacked Cards on Mobile */}
      {!isCustomersLoading && !isCustomersError && filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No customers found"
          description="No customer accounts match your current search and filter criteria."
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : !isCustomersLoading && !isCustomersError && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-card border border-border bg-white shadow-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Company</TableHead>
                  <TableHead className="w-[180px]">Primary Contact</TableHead>
                  <TableHead className="w-[150px]">Account Manager</TableHead>
                  <TableHead>Purchased Services / Notes</TableHead>
                  <TableHead className="w-[140px] text-right">Realized Revenue</TableHead>
                  <TableHead className="w-[90px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-semibold text-xs text-txt-primary">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-txt-muted shrink-0" />
                        <span className="truncate">{customer.companyName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-txt-secondary">
                      <div className="space-y-0.5">
                        <div className="font-medium text-txt-primary flex items-center gap-1.5">
                          <User className="h-3 w-3 text-txt-muted shrink-0" />
                          <span>{customer.contactName}</span>
                        </div>
                        {customer.contactEmail && (
                          <div className="text-[11px] text-txt-muted truncate">
                            {customer.contactEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-txt-secondary">
                      {customer.accountManager}
                    </TableCell>
                    <TableCell className="text-xs text-txt-primary">
                      <span className="line-clamp-2">{customer.purchasedServices}</span>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-txt-muted text-right tabular-nums">
                      {customer.deal?.value ? formatCurrency(customer.deal.value) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                          className="h-7 text-xs px-2 text-txt-secondary hover:text-txt-primary hover:bg-slate-50 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          360
                        </Button>
                        <ActionMenu
                          items={[
                            {
                              label: 'View Account 360',
                              icon: Eye,
                              onClick: () => setSelectedCustomer(customer),
                            },
                            {
                              label: 'Edit Account',
                              icon: Edit2,
                              onClick: () => handleOpenEdit(customer),
                            },
                            {
                              label: 'Delete Customer',
                              icon: Trash2,
                              variant: 'danger' as const,
                              onClick: () => handleDeleteCustomer(customer.id),
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

          {/* Mobile Stacked Cards View (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-card border border-border bg-white p-3.5 shadow-card space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-txt-muted shrink-0" />
                    <span className="font-semibold text-xs text-txt-primary truncate">
                      {customer.companyName}
                    </span>
                  </div>
                  {getStatusBadge(customer.status)}
                </div>

                <div className="space-y-1.5 text-xs border-t border-border/50 pt-2.5">
                  <div className="flex items-center justify-between text-txt-secondary">
                    <span className="text-txt-muted flex items-center gap-1">
                      <User className="h-3 w-3" /> Contact
                    </span>
                    <span className="font-medium text-txt-primary">{customer.contactName}</span>
                  </div>

                  {customer.contactEmail && (
                    <div className="flex items-center justify-between text-txt-secondary text-[11px]">
                      <span className="text-txt-muted flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </span>
                      <span className="text-txt-muted truncate max-w-[200px]">
                        {customer.contactEmail}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-txt-secondary">
                    <span className="text-txt-muted">Account Manager</span>
                    <span className="text-txt-primary">{customer.accountManager}</span>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className="text-txt-muted shrink-0 flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Services
                    </span>
                    <span className="text-right text-txt-primary font-medium">
                      {customer.purchasedServices}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-txt-muted">Realized Revenue</span>
                    <span className="font-medium text-xs text-txt-muted tabular-nums">
                      {customer.deal?.value ? formatCurrency(customer.deal.value) : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex-1 h-8 text-xs font-medium cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> View Account 360
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(customer)}
                    className="h-8 px-2 text-xs font-medium cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Customer 360 Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg w-full p-5">
          {selectedCustomer && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <DialogTitle className="text-base font-bold text-txt-primary flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#57B71B] shrink-0" />
                      <span>{selectedCustomer.companyName}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-txt-muted mt-0.5">
                      Account 360 Profile & Overview
                    </DialogDescription>
                  </div>
                  {getStatusBadge(selectedCustomer.status)}
                </div>
              </DialogHeader>

              {/* Account Summary Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-card border border-border/60 text-xs">
                <div>
                  <div className="text-[11px] font-medium text-txt-muted">Account Manager</div>
                  <div className="font-semibold text-txt-primary mt-0.5">
                    {selectedCustomer.accountManager}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-txt-muted">Customer Since</div>
                  <div className="font-semibold text-txt-primary mt-0.5">
                    {selectedCustomer.customerSince ? formatDate(selectedCustomer.customerSince) : '—'}
                  </div>
                </div>
              </div>

              {/* Primary Contact Details */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-txt-muted" /> Primary Contact
                </div>
                <div className="space-y-1.5 text-xs bg-white rounded-card border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-txt-muted">Full Name</span>
                    <span className="font-medium text-txt-primary">{selectedCustomer.contactName}</span>
                  </div>
                  {selectedCustomer.title && (
                    <div className="flex items-center justify-between">
                      <span className="text-txt-muted">Designation</span>
                      <span className="font-medium text-txt-primary">{selectedCustomer.title}</span>
                    </div>
                  )}
                  {selectedCustomer.contactEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-txt-muted flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </span>
                      <span className="text-txt-primary font-mono text-[11px]">
                        {selectedCustomer.contactEmail}
                      </span>
                    </div>
                  )}
                  {selectedCustomer.contactPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-txt-muted flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </span>
                      <span className="text-txt-primary font-mono text-[11px]">
                        {selectedCustomer.contactPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Services & Notes */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-txt-muted" /> Services & SLA Notes
                </div>
                <div className="p-3 bg-white rounded-card border border-border space-y-1 text-xs">
                  <div className="font-medium text-txt-primary">
                    {selectedCustomer.purchasedServices}
                  </div>
                  {selectedCustomer.notes && (
                    <div className="text-[11px] text-txt-secondary leading-relaxed pt-1">
                      {selectedCustomer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Linked CRM Records */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-txt-muted" /> Linked CRM Records
                </div>
                {selectedCustomer.deal ? (
                  <div className="p-3 bg-[#F0FDF4] rounded-card border border-[#BBF7D0] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-txt-primary flex items-center gap-1.5">
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          DEAL
                        </Badge>
                        <span>{selectedCustomer.deal.title}</span>
                      </div>
                      <div className="text-[11px] text-txt-secondary">
                        Associated commercial deal
                      </div>
                    </div>
                    {selectedCustomer.deal.value !== undefined && (
                      <div className="text-right">
                        <div className="font-bold text-xs text-[#16A34A] tabular-nums">
                          {formatCurrency(selectedCustomer.deal.value)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedCustomer.lead ? (
                  <div className="p-3 bg-slate-50 rounded-card border border-border flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-txt-primary flex items-center gap-1.5">
                        <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                          LEAD
                        </Badge>
                        <span>{selectedCustomer.lead.fullName}</span>
                      </div>
                      <div className="text-[11px] text-txt-muted">
                        Converted from prospect lead
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-card border border-border/70 text-[11px] text-txt-muted text-center">
                    No prior proposals or deals linked directly to this account.
                  </div>
                )}
              </div>

              <DialogFooter className="flex-row justify-between items-center pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-8 text-xs font-medium cursor-pointer"
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const c = selectedCustomer;
                      setSelectedCustomer(null);
                      handleOpenEdit(c);
                    }}
                    className="h-8 text-xs font-medium cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit Account
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                    className="h-8 text-xs font-medium cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md w-full p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-[#57B71B]" /> Add Customer Account
            </DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Record a new customer account in the CRM directory.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-2.5 rounded-btn bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddCustomerSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Company Name *
              </label>
              <Input
                required
                value={formState.companyName}
                onChange={(e) => setFormState({ ...formState, companyName: e.target.value })}
                placeholder="e.g. Acme Enterprises Ltd"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Contact Person *
                </label>
                <Input
                  required
                  value={formState.contactName}
                  onChange={(e) => setFormState({ ...formState, contactName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Job Title / Designation
                </label>
                <Input
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. VP Operations"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Contact Email *
                </label>
                <Input
                  type="email"
                  required
                  value={formState.contactEmail}
                  onChange={(e) => setFormState({ ...formState, contactEmail: e.target.value })}
                  placeholder="rahul@acme.com"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Contact Phone *
                </label>
                <Input
                  required
                  value={formState.contactPhone}
                  onChange={(e) => setFormState({ ...formState, contactPhone: e.target.value })}
                  placeholder="+91 98000 00000"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Source Lead
                </label>
                <select
                  value={formState.leadId}
                  onChange={(e) => setFormState({ ...formState, leadId: e.target.value })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="">None / Direct</option>
                  {leads.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName || l.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Linked Deal
                </label>
                <select
                  value={formState.dealId}
                  onChange={(e) => setFormState({ ...formState, dealId: e.target.value })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="">None</option>
                  {deals.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as CustomerStatus })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="CHURNED">Churned</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Purchased Services / Category
                </label>
                <CategorySelect
                  value={formState.category}
                  onChange={(val) => setFormState({ ...formState, category: val })}
                  placeholder="Select category..."
                  allowAddNew={false}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Notes & Additional Instructions
              </label>
              <textarea
                rows={2}
                value={formState.notes}
                onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                placeholder="Optional customer account notes, billing preferences, special terms..."
                className="w-full rounded-input border border-border bg-white p-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-[#57B71B] resize-none"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 text-xs font-medium cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#57B71B] hover:bg-[#469815] text-white h-8 text-xs font-semibold px-3 rounded-button cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="max-w-md w-full p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-[#57B71B]" /> Edit Customer Account
            </DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Update organization profile, primary contact, or account status.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-2.5 rounded-btn bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleEditCustomerSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Company Name *
              </label>
              <Input
                required
                value={editFormState.companyName}
                onChange={(e) => setEditFormState({ ...editFormState, companyName: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Contact Person *
                </label>
                <Input
                  required
                  value={editFormState.contactName}
                  onChange={(e) => setEditFormState({ ...editFormState, contactName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Job Title
                </label>
                <Input
                  value={editFormState.title}
                  onChange={(e) => setEditFormState({ ...editFormState, title: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Email *
                </label>
                <Input
                  type="email"
                  required
                  value={editFormState.contactEmail}
                  onChange={(e) => setEditFormState({ ...editFormState, contactEmail: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Phone *
                </label>
                <Input
                  required
                  value={editFormState.contactPhone}
                  onChange={(e) => setEditFormState({ ...editFormState, contactPhone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={editFormState.status}
                  onChange={(e) => setEditFormState({ ...editFormState, status: e.target.value as CustomerStatus })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="CHURNED">Churned</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Services / Category
                </label>
                <CategorySelect
                  value={editFormState.category}
                  onChange={(val) => setEditFormState({ ...editFormState, category: val })}
                  placeholder="Select category..."
                  allowAddNew={false}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Notes & Additional Instructions
              </label>
              <textarea
                rows={2}
                value={editFormState.notes}
                onChange={(e) => setEditFormState({ ...editFormState, notes: e.target.value })}
                placeholder="Optional customer account notes, billing requirements..."
                className="w-full rounded-input border border-border bg-white p-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-[#57B71B] resize-none"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingCustomer(null)}
                className="h-8 text-xs font-medium cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#57B71B] hover:bg-[#469815] text-white h-8 text-xs font-semibold px-3 rounded-button cursor-pointer"
              >
                {isSubmitting ? (
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
      </Dialog>
    </div>
  );
};
