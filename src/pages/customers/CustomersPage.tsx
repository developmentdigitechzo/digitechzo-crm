import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricCard } from '@/components/common/MetricCard';
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
import { formatCurrency } from '@/lib/utils';
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
} from 'lucide-react';

export type CustomerStatus = 'Active' | 'Inactive';

export interface LinkedRecord {
  type: 'PROPOSAL' | 'DEAL';
  reference: string;
  title: string;
  amount: number;
  status: string;
}

export interface CustomerItem {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  accountManager: string;
  purchasedServices: string;
  realizedRevenue: number;
  status: CustomerStatus;
  notes?: string;
  linkedRecord?: LinkedRecord;
}

const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust-1',
    companyName: 'OmniTech Solutions',
    contactName: 'Suresh Mehta',
    contactEmail: 'suresh@omnitech.in',
    contactPhone: '+91 98200 11223',
    accountManager: 'Vikram Malhotra',
    purchasedServices: 'Custom CRM + Mobile App',
    realizedRevenue: 1450000,
    status: 'Active',
    notes: 'Custom CRM system with mobile application deployment and team licensing.',
  },
  {
    id: 'cust-2',
    companyName: 'CloudScale Technologies',
    contactName: 'Vikram Singhania',
    contactEmail: 'vikram.s@cloudscale.tech',
    contactPhone: '+91 98190 44321',
    accountManager: 'Arjun Verma',
    purchasedServices: 'Cloud Infrastructure & DevOps Migration',
    realizedRevenue: 1200000,
    status: 'Active',
    notes: 'Cloud security audit, container orchestration, and automated deployment pipeline.',
    linkedRecord: {
      type: 'PROPOSAL',
      reference: 'DTZ-2026-Q098',
      title: 'Cloud Infrastructure Migration',
      amount: 1200000,
      status: 'ACCEPTED',
    },
  },
];

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Add form state
  const [formState, setFormState] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    accountManager: 'Vikram Malhotra',
    purchasedServices: '',
    realizedRevenue: '',
    status: 'Active' as CustomerStatus,
  });

  // Unique owners for filter
  const ownerOptions = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.accountManager)));
  }, [customers]);

  // Status Filter Options for FilterPills
  const statusFilterOptions: FilterOption[] = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter((c) => c.status === 'Active').length;
    const inactiveCount = customers.filter((c) => c.status === 'Inactive').length;

    return [
      { id: 'ALL', label: 'All Accounts', count: totalCount },
      { id: 'Active', label: 'Active', count: activeCount },
      { id: 'Inactive', label: 'Inactive', count: inactiveCount },
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
        const matchesService = customer.purchasedServices.toLowerCase().includes(query);
        if (!matchesCompany && !matchesContact && !matchesService) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL' && customer.status !== statusFilter) {
        return false;
      }

      // Owner
      if (ownerFilter !== 'ALL' && customer.accountManager !== ownerFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, statusFilter, ownerFilter]);

  // Derived metrics from verified data
  const activeCount = useMemo(() => {
    return customers.filter((c) => c.status === 'Active').length;
  }, [customers]);

  const totalRealizedRevenue = useMemo(() => {
    return customers
      .filter((c) => c.status === 'Active')
      .reduce((acc, c) => acc + c.realizedRevenue, 0);
  }, [customers]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setOwnerFilter('ALL');
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.companyName.trim() || !formState.contactName.trim() || !formState.purchasedServices.trim()) {
      return;
    }

    const newCustomer: CustomerItem = {
      id: `cust-${Date.now()}`,
      companyName: formState.companyName.trim(),
      contactName: formState.contactName.trim(),
      contactEmail: formState.contactEmail.trim() || undefined,
      contactPhone: formState.contactPhone.trim() || undefined,
      accountManager: formState.accountManager,
      purchasedServices: formState.purchasedServices.trim(),
      realizedRevenue: Number(formState.realizedRevenue) || 0,
      status: formState.status,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setIsAddModalOpen(false);
    setFormState({
      companyName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      accountManager: 'Vikram Malhotra',
      purchasedServices: '',
      realizedRevenue: '',
      status: 'Active',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Customers"
        count={`${activeCount} active`}
        actions={
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
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
        />
        <MetricCard
          label="Realized Revenue"
          value={formatCurrency(totalRealizedRevenue)}
          subtext="Total realized contract value"
          subtextVariant="success"
          icon={TrendingUp}
          iconVariant="success"
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

      {/* Main Content: Table on Desktop, Stacked Cards on Mobile */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No customers found"
          description="No customer accounts match your current search and filter criteria."
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-card border border-border bg-white shadow-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Company</TableHead>
                  <TableHead className="w-[180px]">Primary Contact</TableHead>
                  <TableHead className="w-[150px]">Account Manager</TableHead>
                  <TableHead>Purchased Services</TableHead>
                  <TableHead className="w-[140px] text-right">Realized Revenue</TableHead>
                  <TableHead className="w-[90px] text-center">Status</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
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
                    <TableCell className="font-bold text-xs text-[#16A34A] text-right tabular-nums">
                      {formatCurrency(customer.realizedRevenue)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.status === 'Active' ? 'success' : 'neutral'}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                        className="h-7 text-xs px-2 text-txt-secondary hover:text-txt-primary hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Account 360
                      </Button>
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
                  <Badge variant={customer.status === 'Active' ? 'success' : 'neutral'}>
                    {customer.status}
                  </Badge>
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
                    <span className="font-bold text-xs text-[#16A34A] tabular-nums">
                      {formatCurrency(customer.realizedRevenue)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full h-8 text-xs font-medium"
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> View Account 360
                </Button>
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
                  <Badge variant={selectedCustomer.status === 'Active' ? 'success' : 'neutral'}>
                    {selectedCustomer.status}
                  </Badge>
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
                  <div className="text-[11px] font-medium text-txt-muted">Realized Revenue</div>
                  <div className="font-bold text-[#16A34A] tabular-nums mt-0.5">
                    {formatCurrency(selectedCustomer.realizedRevenue)}
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

              {/* Purchased Services */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-txt-muted" /> Purchased Services
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
                {selectedCustomer.linkedRecord ? (
                  <div className="p-3 bg-[#F0FDF4] rounded-card border border-[#BBF7D0] flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-txt-primary flex items-center gap-1.5">
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          {selectedCustomer.linkedRecord.type}
                        </Badge>
                        <span>{selectedCustomer.linkedRecord.reference}</span>
                      </div>
                      <div className="text-[11px] text-txt-secondary">
                        {selectedCustomer.linkedRecord.title}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-[#16A34A] tabular-nums">
                        {formatCurrency(selectedCustomer.linkedRecord.amount)}
                      </div>
                      <div className="text-[10px] font-semibold text-[#16A34A] uppercase">
                        {selectedCustomer.linkedRecord.status}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-card border border-border/70 text-[11px] text-txt-muted text-center">
                    No prior proposals or deals linked directly to this account.
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                  className="h-8 text-xs font-medium"
                >
                  Close
                </Button>
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
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={formState.contactEmail}
                  onChange={(e) => setFormState({ ...formState, contactEmail: e.target.value })}
                  placeholder="rahul@acme.com"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Contact Phone
                </label>
                <Input
                  value={formState.contactPhone}
                  onChange={(e) => setFormState({ ...formState, contactPhone: e.target.value })}
                  placeholder="+91 98000 00000"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Account Manager
                </label>
                <select
                  value={formState.accountManager}
                  onChange={(e) => setFormState({ ...formState, accountManager: e.target.value })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="Vikram Malhotra">Vikram Malhotra</option>
                  <option value="Arjun Verma">Arjun Verma</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Purchased Services *
              </label>
              <Input
                required
                value={formState.purchasedServices}
                onChange={(e) => setFormState({ ...formState, purchasedServices: e.target.value })}
                placeholder="e.g. Custom Web App + Annual Maintenance"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Realized Revenue (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={formState.realizedRevenue}
                  onChange={(e) => setFormState({ ...formState, realizedRevenue: e.target.value })}
                  placeholder="500000"
                  className="h-8 text-xs tabular-nums"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as CustomerStatus })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#57B71B] hover:bg-[#469815] text-white h-8 text-xs font-semibold px-3 rounded-button cursor-pointer"
              >
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
