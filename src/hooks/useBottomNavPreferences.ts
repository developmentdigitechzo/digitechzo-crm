import { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Users,
  TrendingUp,
  CheckSquare,
  Activity,
  Calendar,
  FileText,
  Receipt,
  Briefcase,
  BarChart3,
  Users2,
  Settings,
} from 'lucide-react';
import { useAuth } from './useAuth';

export interface NavModuleItem {
  id: string;
  title: string;
  href: string;
  icon: React.ElementType;
}

// All 12 CRM Platform Modules in official system order
export const ALL_CRM_MODULES: NavModuleItem[] = [
  { id: 'dashboard', title: 'Home', href: '/dashboard', icon: Home },
  { id: 'leads', title: 'Leads', href: '/leads', icon: Users },
  { id: 'pipeline', title: 'Pipeline', href: '/pipeline', icon: TrendingUp },
  { id: 'tasks', title: 'Tasks', href: '/tasks', icon: CheckSquare },
  { id: 'activities', title: 'Activities', href: '/activities', icon: Activity },
  { id: 'meetings', title: 'Meetings', href: '/meetings', icon: Calendar },
  { id: 'proposals', title: 'Proposals', href: '/proposals', icon: FileText },
  { id: 'invoices', title: 'In-Voice', href: '/invoices', icon: Receipt },
  { id: 'customers', title: 'Customers', href: '/customers', icon: Briefcase },
  { id: 'reports', title: 'Reports', href: '/reports', icon: BarChart3 },
  { id: 'team', title: 'Team', href: '/team', icon: Users2 },
  { id: 'settings', title: 'Settings', href: '/settings', icon: Settings },
];

export const DEFAULT_BOTTOM_MODULE_IDS = ['dashboard', 'leads', 'pipeline', 'tasks'];

const STORAGE_KEY_PREFIX = 'digitechzo_bottom_nav_pref_';

export function useBottomNavPreferences() {
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}${user?.id || user?.email || 'default'}`;

  // Initialize from localStorage or fallback to default 4
  const [pinnedIds, setPinnedIdsState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          parsed.every((id) => ALL_CRM_MODULES.some((m) => m.id === id))
        ) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return DEFAULT_BOTTOM_MODULE_IDS;
  });

  // Re-sync if user changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length === 4 &&
          parsed.every((id) => ALL_CRM_MODULES.some((m) => m.id === id))
        ) {
          setPinnedIdsState(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setPinnedIdsState(DEFAULT_BOTTOM_MODULE_IDS);
  }, [storageKey]);

  // Save to localStorage helper
  const persist = useCallback(
    (newIds: string[]) => {
      setPinnedIdsState(newIds);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newIds));
      } catch {
        // ignore localStorage quota errors
      }
    },
    [storageKey]
  );

  // Swap two modules:
  // - If both are in pinned, swaps their positions (reorder).
  // - If one is in pinned and one is not, the unpinned module replaces the pinned one in that slot.
  const swapModules = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;

      const current = [...pinnedIds];
      const sourceIndex = current.indexOf(sourceId);
      const targetIndex = current.indexOf(targetId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        // Both are pinned -> swap positions
        current[sourceIndex] = targetId;
        current[targetIndex] = sourceId;
      } else if (sourceIndex !== -1 && targetIndex === -1) {
        // source is pinned, target is unpinned -> replace source with target
        current[sourceIndex] = targetId;
      } else if (sourceIndex === -1 && targetIndex !== -1) {
        // source is unpinned, target is pinned -> replace target with source
        current[targetIndex] = sourceId;
      }
      persist(current);
    },
    [pinnedIds, persist]
  );

  // Directly assign a module to a slot index (0, 1, 2, 3)
  const setSlotModule = useCallback(
    (slotIndex: number, newModuleId: string) => {
      if (slotIndex < 0 || slotIndex >= 4) return;
      if (!ALL_CRM_MODULES.some((m) => m.id === newModuleId)) return;

      const current = [...pinnedIds];
      const existingIndex = current.indexOf(newModuleId);

      if (existingIndex !== -1) {
        // Swap slots if already pinned in another slot
        const temp = current[slotIndex];
        current[slotIndex] = newModuleId;
        current[existingIndex] = temp;
      } else {
        // Replace slot with new module
        current[slotIndex] = newModuleId;
      }
      persist(current);
    },
    [pinnedIds, persist]
  );

  // Reorder pinned items
  const reorderSlots = useCallback(
    (startIndex: number, endIndex: number) => {
      if (
        startIndex < 0 ||
        startIndex >= pinnedIds.length ||
        endIndex < 0 ||
        endIndex >= pinnedIds.length ||
        startIndex === endIndex
      ) {
        return;
      }
      const updated = [...pinnedIds];
      const [removed] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, removed);
      persist(updated);
    },
    [pinnedIds, persist]
  );

  // Reset to system defaults
  const resetToDefault = useCallback(() => {
    persist(DEFAULT_BOTTOM_MODULE_IDS);
  }, [persist]);

  // Derived objects
  const pinnedModules: NavModuleItem[] = pinnedIds
    .map((id) => ALL_CRM_MODULES.find((m) => m.id === id)!)
    .filter(Boolean);

  const secondaryModules: NavModuleItem[] = ALL_CRM_MODULES.filter(
    (m) => !pinnedIds.includes(m.id)
  );

  const isPinned = useCallback(
    (id: string) => pinnedIds.includes(id),
    [pinnedIds]
  );

  const getSlotNumber = useCallback(
    (id: string) => {
      const idx = pinnedIds.indexOf(id);
      return idx !== -1 ? idx + 1 : null;
    },
    [pinnedIds]
  );

  return {
    pinnedIds,
    pinnedModules,
    secondaryModules,
    allModules: ALL_CRM_MODULES,
    swapModules,
    setSlotModule,
    reorderSlots,
    resetToDefault,
    isPinned,
    getSlotNumber,
    isCustomized: JSON.stringify(pinnedIds) !== JSON.stringify(DEFAULT_BOTTOM_MODULE_IDS),
  };
}
