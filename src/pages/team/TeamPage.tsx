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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { UserRole } from '@/types/auth';
import { MOCK_USERS } from '@/mocks/mockAuth';
import {
  UserPlus,
  Users2,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Eye,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export interface TeamMemberItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  teamName: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
}

const INITIAL_MEMBERS: TeamMemberItem[] = MOCK_USERS.map((user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  teamName: user.teamName || 'Global / Leadership',
  avatarUrl: user.avatarUrl,
  status: 'Active',
}));

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
  const [members, setMembers] = useState<TeamMemberItem[]>(INITIAL_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberItem | null>(null);

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'BDE' as UserRole,
    teamName: 'Inbound Growth Team',
  });

  // Derived counts for metrics and filter pills
  const totalActive = useMemo(() => members.filter((m) => m.status === 'Active').length, [members]);
  const bdeCount = useMemo(() => members.filter((m) => m.role === 'BDE').length, [members]);
  const managerCount = useMemo(() => members.filter((m) => m.role === 'SALES_MANAGER').length, [members]);
  const adminCount = useMemo(() => members.filter((m) => m.role === 'ADMIN').length, [members]);

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
      if (roleFilter !== 'ALL' && member.role !== roleFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        const email = member.email.toLowerCase();
        const team = member.teamName.toLowerCase();
        if (!fullName.includes(query) && !email.includes(query) && !team.includes(query)) {
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

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || !inviteForm.email.trim()) {
      return;
    }

    const newMember: TeamMemberItem = {
      id: `user-${Date.now()}`,
      firstName: inviteForm.firstName.trim(),
      lastName: inviteForm.lastName.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: inviteForm.role,
      teamName: inviteForm.teamName.trim() || 'Inbound Growth Team',
      status: 'Active',
    };

    setMembers((prev) => [newMember, ...prev]);
    setIsInviteModalOpen(false);
    setInviteForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'BDE',
      teamName: 'Inbound Growth Team',
    });
  };

  const getDataScopeBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <span className="text-[#DC2626] font-semibold">All Records</span>;
      case 'SALES_MANAGER':
        return <span className="text-[#D97706] font-semibold">Team Records</span>;
      case 'BDE':
        return <span className="text-[#16A34A] font-semibold">Assigned Only</span>;
      default:
        return <span className="text-txt-secondary font-medium">Standard</span>;
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'danger' | 'warning' | 'success' | 'neutral' => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'danger';
      case 'SALES_MANAGER':
        return 'warning';
      case 'BDE':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <PageHeader
        title="Team"
        count={`${totalActive} members`}
        actions={
          <Button
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
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
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-border shrink-0">
                          {member.avatarUrl && (
                            <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                          )}
                          <AvatarFallback className="bg-slate-100 text-txt-secondary text-[10px] font-bold">
                            {member.firstName[0]}
                            {member.lastName[0]}
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
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-txt-secondary">
                      {member.teamName}
                    </TableCell>
                    <TableCell className="text-xs">
                      {getDataScopeBadge(member.role)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={member.status === 'Active' ? 'success' : 'neutral'}>
                        {member.status}
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Stacked Cards View (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredMembers.map((member) => (
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
                        {member.firstName[0]}
                        {member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-txt-primary truncate">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-[11px] text-txt-muted truncate">{member.email}</div>
                    </div>
                  </div>
                  <Badge variant={member.status === 'Active' ? 'success' : 'neutral'}>
                    {member.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs border-t border-border/50 pt-2.5">
                  <div className="flex items-center justify-between text-txt-secondary">
                    <span className="text-txt-muted">Role</span>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-txt-secondary">
                    <span className="text-txt-muted">Assigned Team</span>
                    <span className="text-txt-primary font-medium">{member.teamName}</span>
                  </div>

                  <div className="flex items-center justify-between text-txt-secondary">
                    <span className="text-txt-muted">Data Scope</span>
                    <div>{getDataScopeBadge(member.role)}</div>
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
            ))}
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
                        {selectedMember.firstName[0]}
                        {selectedMember.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-base font-bold text-txt-primary">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-txt-muted mt-0.5">
                        {selectedMember.email}
                      </DialogDescription>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(selectedMember.role)}>
                    {selectedMember.role}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Assignment Information Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-card border border-border/60 text-xs">
                <div>
                  <div className="text-[11px] font-medium text-txt-muted">Assigned Team</div>
                  <div className="font-semibold text-txt-primary mt-0.5">{selectedMember.teamName}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-txt-muted">Data Scope</div>
                  <div className="mt-0.5">{getDataScopeBadge(selectedMember.role)}</div>
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
                        const roleKey = selectedMember.role as 'ADMIN' | 'SALES_MANAGER' | 'BDE';
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

              <DialogFooter className="pt-2 border-t border-border">
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

      {/* 6. Invite Member Modal (Strictly Local Frontend State) */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md w-full p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-txt-primary flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#57B71B]" /> Invite Organization Member
            </DialogTitle>
            <DialogDescription className="text-xs text-txt-muted">
              Add a team member to the organization directory.
            </DialogDescription>
          </DialogHeader>

          {/* Prominent Demo Mode Notice per requirements */}
          <div className="flex items-start gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-card text-xs text-blue-900 leading-relaxed">
            <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 shrink-0" />
            <span>
              <strong>Demo mode:</strong> Appends temporarily to local React state. No real email invitation is sent and no persistent database record is created.
            </span>
          </div>

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
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                  className="w-full h-8 rounded-button border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                >
                  <option value="BDE">BDE (Sales Rep)</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider">
                  Team Name
                </label>
                <Input
                  value={inviteForm.teamName}
                  onChange={(e) => setInviteForm({ ...inviteForm, teamName: e.target.value })}
                  placeholder="Inbound Growth Team"
                  className="h-8 text-xs"
                />
              </div>
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
                className="bg-[#57B71B] hover:bg-[#469815] text-white h-8 text-xs font-semibold px-3 rounded-button cursor-pointer"
              >
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
