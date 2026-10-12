import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FilterPills, FilterOption } from '@/components/common/FilterPills';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricCard } from '@/components/common/MetricCard';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { crmApi } from '@/lib/api';
import { TeamUserItem, RoleItem } from '@/types/crm';
import {
  UserPlus,
  Users2,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Eye,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  UserX,
  UserCheck2,
} from 'lucide-react';

// Documented RBAC Capabilities strictly from docs/AUTH-RBAC.md Section 2.2
interface RbacCapability {
  capability: string;
  ADMIN: string;
  SALES_MANAGER: string;
  BDE: string;
}

const DOCUMENTED_CAPABILITIES: RbacCapability[] = [
  {
    capability: 'Manage Users & Teams',
    ADMIN: 'Full Access',
    SALES_MANAGER: 'Read Only',
    BDE: 'None',
  },
  {
    capability: 'View Leads & Pipeline',
    ADMIN: 'All Org Leads & Deals',
    SALES_MANAGER: 'Team Leads & Deals',
    BDE: 'Assigned Records Only',
  },
  {
    capability: 'Reassign Lead Owners',
    ADMIN: 'Permitted',
    SALES_MANAGER: 'Team Leads Only',
    BDE: 'Not Permitted',
  },
  {
    capability: 'Approve Discounts & Commercials',
    ADMIN: 'Permitted',
    SALES_MANAGER: 'Permitted',
    BDE: 'Not Permitted',
  },
  {
    capability: 'Bulk Export Data (CSV)',
    ADMIN: 'Full Org Export',
    SALES_MANAGER: 'Team Export Only',
    BDE: 'Restricted / None',
  },
  {
    capability: 'Access Audit Logs',
    ADMIN: 'Full Access',
    SALES_MANAGER: 'Not Permitted',
    BDE: 'Not Permitted',
  },
];

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamUserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    role: 'BDE',
    password: '',
  });

  // Queries
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => crmApi.getUsers({ limit: 100 }),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => crmApi.getRoles(),
  });

  const members: TeamUserItem[] = useMemo(() => {
    return usersQuery.data?.data || [];
  }, [usersQuery.data]);

  const roles: RoleItem[] = useMemo(() => {
    return rolesQuery.data || [];
  }, [rolesQuery.data]);

  // Derived counts for metrics and filter pills
  const totalActive = useMemo(
    () => members.filter((m) => m.status === 'ACTIVE').length,
    [members]
  );
  const bdeCount = useMemo(
    () => members.filter((m) => m.role?.name === 'BDE' || m.role?.name === 'BDE_SALES').length,
    [members]
  );
  const managerCount = useMemo(
    () => members.filter((m) => m.role?.name === 'MANAGER' || m.role?.name === 'SALES_MANAGER').length,
    [members]
  );
  const adminCount = useMemo(
    () => members.filter((m) => m.role?.name === 'ADMIN').length,
    [members]
  );

  // Filter pills options
  const filterOptions: FilterOption[] = useMemo(() => {
    return [
      { id: 'ALL', label: 'All Roles', count: members.length },
      { id: 'BDE', label: 'BDE', count: bdeCount },
      { id: 'SALES_MANAGER', label: 'Sales Manager', count: managerCount },
      { id: 'ADMIN', label: 'Admin', count: adminCount },
    ];
  }, [members.length, bdeCount, managerCount, adminCount]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      // Role filter
      if (roleFilter !== 'ALL') {
        const roleName = member.role?.name;
        if (roleFilter === 'BDE' && roleName !== 'BDE' && roleName !== 'BDE_SALES') {
          return false;
        }
        if (roleFilter === 'SALES_MANAGER' && roleName !== 'SALES_MANAGER' && roleName !== 'MANAGER') {
          return false;
        }
        if (roleFilter === 'ADMIN' && roleName !== 'ADMIN') {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${member.firstName || ''} ${member.lastName || ''} ${member.name || ''}`.toLowerCase();
        const email = (member.email || '').toLowerCase();
        const team = (member.teamName || '').toLowerCase();
        const phone = (member.phone || '').toLowerCase();
        if (!fullName.includes(query) && !email.includes(query) && !team.includes(query) && !phone.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [members, roleFilter, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || !inviteForm.email.trim()) {
      setFormError('Please fill in first name, last name, and work email.');
      return;
    }

    try {
      setIsSubmitting(true);
      await crmApi.createUser({
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim(),
        name: `${inviteForm.firstName.trim()} ${inviteForm.lastName.trim()}`,
        email: inviteForm.email.trim().toLowerCase(),
        phone: inviteForm.phone.trim() || undefined,
        role: inviteForm.role,
        roleId: inviteForm.roleId || undefined,
        password: inviteForm.password.trim() || undefined,
        status: 'ACTIVE',
      });

      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsInviteModalOpen(false);
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        roleId: '',
        role: 'BDE',
        password: '',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create team member. Please verify email and inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMemberStatus = async (member: TeamUserItem) => {
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setIsSubmitting(true);
      if (newStatus === 'INACTIVE') {
        await crmApi.deleteUser(member.id);
      } else {
        await crmApi.updateUser(member.id, { status: 'ACTIVE' });
      }
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update member status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (roleName?: string, displayAlias?: string) => {
    if (displayAlias) return displayAlias;
    switch (roleName) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
      case 'SALES_MANAGER':
        return 'Sales Manager';
      case 'BDE_SALES':
      case 'BDE':
        return 'BDE';
      case 'MARKETING':
        return 'Marketing';
      case 'DELIVERY':
        return 'Delivery';
      default:
        return roleName || 'Standard';
    }
  };

  const getDataScopeBadge = (member: TeamUserItem) => {
    const role = member.role?.name;
    if (member.dataScope) {
      if (member.dataScope.includes('All')) return <span className="text-[#DC2626] font-semibold">{member.dataScope}</span>;
      if (member.dataScope.includes('Team')) return <span className="text-[#D97706] font-semibold">{member.dataScope}</span>;
      if (member.dataScope.includes('Assigned')) return <span className="text-[#16A34A] font-semibold">{member.dataScope}</span>;
      return <span className="text-txt-secondary font-medium">{member.dataScope}</span>;
    }
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <span className="text-[#DC2626] font-semibold">All Records</span>;
      case 'MANAGER':
      case 'SALES_MANAGER':
        return <span className="text-[#D97706] font-semibold">Team Records</span>;
      case 'BDE':
      case 'BDE_SALES':
        return <span className="text-[#16A34A] font-semibold">Assigned Only</span>;
      default:
        return <span className="text-txt-secondary font-medium">Standard</span>;
    }
  };

  const getRoleBadgeVariant = (roleName?: string): 'danger' | 'warning' | 'success' | 'neutral' => {
    switch (roleName) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'danger';
      case 'MANAGER':
      case 'SALES_MANAGER':
        return 'warning';
      case 'BDE':
      case 'BDE_SALES':
        return 'success';
      default:
        return 'neutral';
    }
  };

  if (usersQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#57B71B]" />
        <p className="text-sm text-txt-muted">Loading team members...</p>
      </div>
    );
  }

  if (usersQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="flex items-center gap-2 text-danger-dark font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load team members from server</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => usersQuery.refetch()}
          className="cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <PageHeader
        title="Team"
        count={`${totalActive} active / ${members.length} total`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null);
              setIsInviteModalOpen(true);
            }}
            className="h-8 px-3 text-xs bg-[#57B71B] hover:bg-[#469815] text-white font-semibold cursor-pointer shrink-0"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite Member
          </Button>
        }
      />

      {/* 2. Compact Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricCard
          label="Total Active Members"
          value={totalActive}
          subtext="Verified organization accounts"
          subtextVariant="neutral"
          icon={Users2}
          iconVariant="neutral"
        />
        <MetricCard
          label="Sales Execution Team"
          value={`${bdeCount} BDEs`}
          subtext="Front-line sales representatives"
          subtextVariant="success"
          icon={UserCheck}
          iconVariant="success"
        />
      </div>

      {/* 3. Search & Compact Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search member by name, email, team..."
            />
          </div>
          <FilterPills
            options={filterOptions}
            activeId={roleFilter}
            onChange={setRoleFilter}
          />
        </div>

        {(searchQuery || roleFilter !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 px-2 text-xs text-txt-muted hover:text-txt-primary self-end sm:self-auto cursor-pointer"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* 4. Main Content: Table on Desktop, Stacked Cards on Mobile */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No team members found"
          description="No team members match your current search and role criteria."
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          {/* Desktop Table View (≥768px) */}
          <div className="hidden md:block rounded-card border border-border bg-white shadow-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Member</TableHead>
                  <TableHead className="w-[140px]">Role</TableHead>
                  <TableHead className="w-[180px]">Team</TableHead>
                  <TableHead className="w-[150px]">Data Scope</TableHead>
                  <TableHead className="w-[90px] text-center">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const initials = `${(member.firstName || member.name || 'U')[0] || ''}${(member.lastName || '')[0] || ''}`.toUpperCase();
                  const roleDisplayName = getRoleDisplayName(member.role?.name, member.role?.displayAlias);
                  const isUserActive = member.status === 'ACTIVE';

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border border-border shrink-0">
                            {member.avatarUrl && (
                              <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                            )}
                            <AvatarFallback className="bg-slate-100 text-txt-secondary text-[10px] font-bold">
                              {initials || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-txt-primary block leading-tight truncate">
                              {member.firstName} {member.lastName}
                            </span>
                            <span className="text-[11px] text-txt-muted block truncate">{member.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role?.name)}>
                          {roleDisplayName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-txt-secondary">
                        {member.teamName || 'Global / Leadership'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getDataScopeBadge(member)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isUserActive ? 'success' : 'neutral'}>
                          {isUserActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMember(member)}
                          className="h-7 text-xs px-2 text-txt-secondary hover:text-txt-primary hover:bg-slate-50 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Stacked Cards View (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member) => {
              const initials = `${(member.firstName || member.name || 'U')[0] || ''}${(member.lastName || '')[0] || ''}`.toUpperCase();
              const roleDisplayName = getRoleDisplayName(member.role?.name, member.role?.displayAlias);
              const isUserActive = member.status === 'ACTIVE';

              return (
                <div
                  key={member.id}
                  className="rounded-card border border-border bg-white p-3.5 shadow-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 border border-border shrink-0">
                        {member.avatarUrl && (
                          <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                        )}
                        <AvatarFallback className="bg-slate-100 text-txt-secondary text-[11px] font-bold">
                          {initials || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-txt-primary truncate">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-[11px] text-txt-muted truncate">{member.email}</div>
                      </div>
                    </div>
                    <Badge variant={isUserActive ? 'success' : 'neutral'}>
                      {isUserActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-border/50 pt-2.5">
                    <div className="flex items-center justify-between text-txt-secondary">
                      <span className="text-txt-muted">Role</span>
                      <Badge variant={getRoleBadgeVariant(member.role?.name)}>
                        {roleDisplayName}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-txt-secondary">
                      <span className="text-txt-muted">Assigned Team</span>
                      <span className="text-txt-primary font-medium">{member.teamName || 'Global / Leadership'}</span>
                    </div>

                    <div className="flex items-center justify-between text-txt-secondary">
                      <span className="text-txt-muted">Data Scope</span>
                      <div>{getDataScopeBadge(member)}</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMember(member)}
                    className="w-full h-8 text-xs font-medium cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> View Profile & Capabilities
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 5. Member Profile & Documented RBAC Capabilities Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-lg w-full p-5">
          {selectedMember && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border shrink-0">
                      {selectedMember.avatarUrl && (
                        <AvatarImage
                          src={selectedMember.avatarUrl}
                          alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                        />
                      )}
                      <AvatarFallback className="bg-slate-100 text-txt-secondary text-xs font-bold">
                        {`${(selectedMember.firstName || selectedMember.name || 'U')[0] || ''}${(selectedMember.lastName || '')[0] || ''}`.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-base font-bold text-txt-primary">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-txt-muted mt-0.5">
                        {selectedMember.email} {selectedMember.phone ? `• ${selectedMember.phone}` : ''}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={getRoleBadgeVariant(selectedMember.role?.name)}>
                      {getRoleDisplayName(selectedMember.role?.name, selectedMember.role?.displayAlias)}
                    </Badge>
                    <Badge variant={selectedMember.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {selectedMember.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              {/* Assignment Information Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-card border border-border/60 text-xs">
                <div>
                  <div className="text-[11px] font-medium text-txt-muted">Assigned Team</div>
                  <div className="font-semibold text-txt-primary mt-0.5">{selectedMember.teamName || 'Global / Leadership'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-txt-muted">Data Scope</div>
                  <div className="mt-0.5">{getDataScopeBadge(selectedMember)}</div>
                </div>
              </div>

              {/* Documented RBAC Capabilities Matrix (from docs/AUTH-RBAC.md) */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#57B71B]" /> Documented RBAC Capabilities
                  </span>
                  <span className="text-[10px] text-txt-muted">Per docs/AUTH-RBAC.md</span>
                </div>

                <div className="rounded-card border border-border overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-border text-[11px] text-txt-muted">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Capability</th>
                        <th className="py-2 px-3 font-semibold text-right">Access Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {DOCUMENTED_CAPABILITIES.map((cap) => {
                        const rawRole = selectedMember.role?.name || 'BDE';
                        let roleKey: 'ADMIN' | 'SALES_MANAGER' | 'BDE' = 'BDE';
                        if (rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN') {
                          roleKey = 'ADMIN';
                        } else if (rawRole === 'MANAGER' || rawRole === 'SALES_MANAGER') {
                          roleKey = 'SALES_MANAGER';
                        }
                        const access = cap[roleKey] || 'None';
                        const isGranted = access !== 'None' && access !== 'Not Permitted';

                        return (
                          <tr key={cap.capability} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-txt-primary font-medium">{cap.capability}</td>
                            <td className="py-2 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                  isGranted ? 'text-[#16A34A]' : 'text-txt-muted'
                                }`}
                              >
                                {isGranted ? (
                                  <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />
                                ) : (
                                  <Lock className="h-3 w-3 text-txt-muted" />
                                )}
                                {access}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border flex items-center justify-between sm:justify-between">
                <Button
                  type="button"
                  variant={selectedMember.status === 'ACTIVE' ? 'destructive' : 'outline'}
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleToggleMemberStatus(selectedMember)}
                  className="h-8 text-xs font-medium cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : selectedMember.status === 'ACTIVE' ? (
                    <UserX className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <UserCheck2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedMember.status === 'ACTIVE' ? 'Deactivate Member' : 'Reactivate Member'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                  className="h-8 text-xs font-medium cursor-pointer"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Invite Member Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md w-full p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#57B71B]" /> Add / Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Add a new team member to the organization directory and assign their role.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 p-2.5 bg-danger/10 border border-danger/30 rounded-card text-xs text-danger-dark font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleInviteSubmit} className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  First Name *
                </label>
                <Input
                  required
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  placeholder="e.g. Neha"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Last Name *
                </label>
                <Input
                  required
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  placeholder="e.g. Kulkarni"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Work Email *
              </label>
              <Input
                required
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="neha.k@digitechzo.com"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Role *
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    const matchedRoleObj = roles.find(
                      (r) => r.name === selectedRole || r.displayAlias === selectedRole
                    );
                    setInviteForm({
                      ...inviteForm,
                      role: selectedRole,
                      roleId: matchedRoleObj ? matchedRoleObj.id : '',
                    });
                  }}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.displayAlias || r.displayName || r.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="BDE">BDE (Sales Rep)</option>
                      <option value="MANAGER">Sales Manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="DELIVERY">Delivery</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Phone (Optional)
                </label>
                <Input
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="+919812345678"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                Initial Password (Optional)
              </label>
              <Input
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                placeholder="Auto-generated if empty (min 8 chars)"
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-txt-muted">
                If omitted, a secure default temporary password is automatically assigned.
              </p>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteModalOpen(false)}
                className="h-8 text-xs font-medium cursor-pointer"
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
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  'Create Member'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
