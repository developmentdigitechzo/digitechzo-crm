import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensors,
  useSensor,
  DragEndEvent,
  DragStartEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  ArrowLeftRight,
  RotateCcw,
  Check,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavModuleItem } from '@/hooks/useBottomNavPreferences';

interface BottomNavCustomizerProps {
  pinnedModules: NavModuleItem[];
  secondaryModules: NavModuleItem[];
  allModules: NavModuleItem[];
  onSwap: (sourceId: string, targetId: string) => void;
  onSetSlot: (slotIndex: number, newModuleId: string) => void;
  onReset: () => void;
  onClose: () => void;
  isCustomized: boolean;
}

// Custom collision detection combining pointerWithin and rectIntersection
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return rectIntersection(args);
};

export const BottomNavCustomizer: React.FC<BottomNavCustomizerProps> = ({
  pinnedModules,
  secondaryModules,
  allModules,
  onSwap,
  onSetSlot,
  onReset,
  onClose,
  isCustomized,
}) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick swap modal state: if user taps "Swap" on a slot
  const [activeSlotToSwap, setActiveSlotToSwap] = useState<{
    index: number;
    currentModule: NavModuleItem;
  } | null>(null);

  // Quick pin modal state: if user taps an unpinned module to assign to a slot
  const [activeModuleToPin, setActiveModuleToPin] = useState<NavModuleItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 2800);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    // Check if dropped onto a slot container (e.g. "slot-0", "slot-1", "slot-2", "slot-3")
    if (overId.startsWith('slot-')) {
      const targetSlotIndex = parseInt(overId.replace('slot-', ''), 10);
      if (!isNaN(targetSlotIndex) && targetSlotIndex >= 0 && targetSlotIndex < 4) {
        const draggedModule = allModules.find((m) => m.id === activeId);
        onSetSlot(targetSlotIndex, activeId);
        showStatus(`Set ${draggedModule?.title || 'Module'} to Slot ${targetSlotIndex + 1}`);
        return;
      }
    }

    // Check if dropped onto another module
    const targetModule = allModules.find((m) => m.id === overId);
    const sourceModule = allModules.find((m) => m.id === activeId);

    if (targetModule && sourceModule) {
      onSwap(sourceModule.id, targetModule.id);
      showStatus(`Swapped ${sourceModule.title} with ${targetModule.title}`);
    }
  };

  const activeModuleItem = activeDragId
    ? allModules.find((m) => m.id === activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3 p-3 sm:p-4 text-slate-800">
        {/* Banner with Instructions & Actions */}
        <div className="flex items-center justify-between gap-2 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-2.5 sm:p-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-[#57B71B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                Customize Bottom 4 Tabs
              </h4>
              <p className="text-[10px] text-slate-600 truncate leading-tight mt-0.5">
                Drag any module into a slot below, or tap to swap
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isCustomized && (
              <button
                type="button"
                onClick={() => {
                  onReset();
                  showStatus('Reset bottom bar to default 4 modules');
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Reset to default (Home, Leads, Pipeline, Tasks)"
              >
                <RotateCcw className="h-3 w-3 text-slate-500" />
                <span className="hidden xs:inline">Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#57B71B] hover:bg-[#4ea518] text-white text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>

        {/* Status Toast / Helper */}
        {statusMessage && (
          <div className="bg-slate-900 text-white text-xs font-semibold py-1.5 px-3 rounded-xl text-center shadow-md animate-in fade-in zoom-in-95 duration-150">
            {statusMessage}
          </div>
        )}

        {/* 4 Bottom Slots Dock (Drop Targets & Reorder) */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-2.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Down Side 4 Modules (Bottom Bar)
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-bold">
              4 Pinned · {secondaryModules.length} Secondary
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {pinnedModules.map((module, index) => (
              <DroppableSlotItem
                key={`slot-${index}`}
                slotIndex={index}
                module={module}
                onOpenSwap={() => setActiveSlotToSwap({ index, currentModule: module })}
              />
            ))}
          </div>
        </div>

        {/* All 12 Modules Section (Draggable items with badges) */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              All 12 Modules (Drag or Tap to Swap)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Drag to slot 1-4
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {allModules.map((module) => {
              const pinnedIndex = pinnedModules.findIndex((m) => m.id === module.id);
              const isPinned = pinnedIndex !== -1;

              return (
                <DraggableModuleCard
                  key={module.id}
                  module={module}
                  isPinned={isPinned}
                  pinnedSlotNumber={isPinned ? pinnedIndex + 1 : null}
                  onTapUnpinned={() => {
                    if (isPinned) {
                      setActiveSlotToSwap({
                        index: pinnedIndex,
                        currentModule: module,
                      });
                    } else {
                      setActiveModuleToPin(module);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Drag Overlay Preview */}
      <DragOverlay dropAnimation={null}>
        {activeModuleItem ? (
          <div className="h-16 w-16 bg-white/95 rounded-2xl border-2 border-[#57B71B] shadow-2xl flex flex-col items-center justify-center p-1.5 scale-110 pointer-events-none rotate-2">
            {React.createElement(activeModuleItem.icon, {
              className: 'h-6 w-6 text-[#57B71B] mb-0.5',
              strokeWidth: 2.5,
            })}
            <span className="text-[9px] font-extrabold text-slate-900 truncate w-full text-center">
              {activeModuleItem.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>

      {/* Modal: Quick Swap for a Slot (Tap-to-Swap for accessibility) */}
      {activeSlotToSwap && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 animate-in fade-in duration-150"
          onClick={() => setActiveSlotToSwap(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm border border-slate-200 shadow-2xl p-4 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Swap Slot {activeSlotToSwap.index + 1}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Current: <span className="font-bold text-slate-800">{activeSlotToSwap.currentModule.title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlotToSwap(null)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] font-semibold text-slate-600 mb-2">
              Select module to place in Slot {activeSlotToSwap.index + 1}:
            </p>

            <div className="grid grid-cols-3 gap-2 overflow-y-auto p-1 max-h-60">
              {allModules.map((m) => {
                const isCurrent = m.id === activeSlotToSwap.currentModule.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      onSetSlot(activeSlotToSwap.index, m.id);
                      showStatus(`Placed ${m.title} into Slot ${activeSlotToSwap.index + 1}`);
                      setActiveSlotToSwap(null);
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer',
                      isCurrent
                        ? 'opacity-40 border-slate-200 bg-slate-100 cursor-not-allowed'
                        : 'border-slate-200 hover:border-[#57B71B] hover:bg-[#EAF7E3]/50 active:scale-95'
                    )}
                  >
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center mb-1 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 truncate w-full">
                      {m.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Place Module into a Slot */}
      {activeModuleToPin && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4 animate-in fade-in duration-150"
          onClick={() => setActiveModuleToPin(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm border border-slate-200 shadow-2xl p-4 sm:p-5 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#EAF7E3] text-[#57B71B] flex items-center justify-center shrink-0 border border-[#cdebc0]">
                  {React.createElement(activeModuleToPin.icon, { className: 'h-5 w-5', strokeWidth: 2.2 })}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Pin {activeModuleToPin.title} to Bottom Bar
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Choose which slot to place it in:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModuleToPin(null)}
                className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-2">
              {pinnedModules.map((pinnedMod, idx) => {
                const Icon = pinnedMod.icon;
                return (
                  <button
                    key={`pin-to-${idx}`}
                    type="button"
                    onClick={() => {
                      onSetSlot(idx, activeModuleToPin.id);
                      showStatus(`Placed ${activeModuleToPin.title} into Slot ${idx + 1}`);
                      setActiveModuleToPin(null);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border-2 border-slate-200 hover:border-[#57B71B] hover:bg-[#EAF7E3]/60 text-left transition-all cursor-pointer active:scale-95 bg-white shadow-2xs group"
                  >
                    <span className="h-7 w-7 rounded-xl bg-emerald-100 text-[#16A34A] text-xs font-black flex items-center justify-center shrink-0 group-hover:bg-[#57B71B] group-hover:text-white transition-colors">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">
                        Slot {idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-[#57B71B] shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate block leading-snug">
                          {pinnedMod.title}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

// Droppable Slot Item (Slots 1, 2, 3, 4)
interface DroppableSlotItemProps {
  slotIndex: number;
  module: NavModuleItem;
  onOpenSwap: () => void;
}

const DroppableSlotItem: React.FC<DroppableSlotItemProps> = ({
  slotIndex,
  module,
  onOpenSwap,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slotIndex}`,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: module.id,
  });

  const Icon = module.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex flex-col items-center justify-between p-1.5 rounded-2xl border-2 transition-all bg-white min-w-0 overflow-hidden',
        isOver
          ? 'border-[#57B71B] bg-[#EAF7E3] scale-105 shadow-md ring-2 ring-[#57B71B]/30'
          : 'border-slate-200 hover:border-slate-300 shadow-2xs',
        isDragging && 'opacity-40'
      )}
    >
      {/* Slot Header: Number Badge on Left + Quick Swap Icon on Right (no cramped text) */}
      <div className="w-full flex items-center justify-between mb-0.5 px-0.5">
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#16A34A] leading-none shrink-0">
          #{slotIndex + 1}
        </span>
        <button
          type="button"
          onClick={onOpenSwap}
          className="h-5 w-5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-[#57B71B] flex items-center justify-center cursor-pointer transition-colors shrink-0"
          title={`Swap Slot ${slotIndex + 1}`}
        >
          <ArrowLeftRight className="h-3 w-3" />
        </button>
      </div>

      {/* Draggable Icon & Label */}
      <div
        ref={setDragRef}
        {...attributes}
        {...listeners}
        className="flex flex-col items-center justify-center w-full cursor-grab active:cursor-grabbing touch-none py-0.5 min-w-0"
        title="Drag to reorder or drop another module here"
      >
        <div className="h-10 w-10 rounded-xl bg-[#EAF7E3] text-[#57B71B] flex items-center justify-center mb-1 border border-[#cbeabb] shadow-2xs shrink-0">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <span className="text-[10px] font-extrabold text-slate-900 tracking-tight text-center leading-tight block w-full truncate px-0.5">
          {module.title}
        </span>
      </div>

      {/* Clean full-width Swap button at bottom */}
      <button
        type="button"
        onClick={onOpenSwap}
        className="w-full mt-1 py-0.5 rounded-lg bg-slate-100 hover:bg-[#EAF7E3] text-slate-600 hover:text-[#16A34A] text-[9px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
        title={`Swap Slot ${slotIndex + 1}`}
      >
        <span>Swap</span>
      </button>
    </div>
  );
};

// Draggable Card in 12-Module Grid
interface DraggableModuleCardProps {
  module: NavModuleItem;
  isPinned: boolean;
  pinnedSlotNumber: number | null;
  onTapUnpinned: () => void;
}

const DraggableModuleCard: React.FC<DraggableModuleCardProps> = ({
  module,
  isPinned,
  pinnedSlotNumber,
  onTapUnpinned,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: module.id,
  });

  const Icon = module.icon;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex flex-col items-center justify-between p-1.5 rounded-2xl border transition-all text-center group select-none min-w-0 overflow-hidden',
        isPinned
          ? 'bg-emerald-50/60 border-emerald-300/80 shadow-2xs'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs',
        isDragging && 'opacity-30 scale-95'
      )}
    >
      {/* Pinned Slot Tag */}
      {isPinned ? (
        <span className="absolute top-1 right-1 text-[8px] font-black px-1.5 py-0.2 rounded-md bg-[#57B71B] text-white shadow-2xs z-10">
          #{pinnedSlotNumber}
        </span>
      ) : (
        <button
          type="button"
          onClick={onTapUnpinned}
          className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-[#57B71B] text-slate-400 flex items-center justify-center cursor-pointer transition-colors z-10"
          title="Place into bottom bar"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}

      {/* Drag handle target */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-col items-center justify-center w-full cursor-grab active:cursor-grabbing touch-none py-1 min-w-0"
      >
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center transition-all mb-1 shrink-0',
            isPinned
              ? 'bg-[#EAF7E3] text-[#57B71B] border border-[#57B71B]'
              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={isPinned ? 2.5 : 2} />
        </div>
        <span
          className={cn(
            'text-[10px] leading-tight text-center tracking-tight truncate w-full px-0.5 block',
            isPinned ? 'font-extrabold text-[#57B71B]' : 'font-semibold text-slate-700'
          )}
        >
          {module.title}
        </span>
      </div>

      {/* Bottom Swap/Pin text button */}
      <button
        type="button"
        onClick={onTapUnpinned}
        className={cn(
          'w-full text-[9px] font-bold py-0.5 rounded-lg transition-colors cursor-pointer mt-0.5',
          isPinned
            ? 'text-emerald-700 bg-emerald-100/50 hover:bg-emerald-100'
            : 'text-slate-500 bg-slate-100 hover:text-[#57B71B] hover:bg-emerald-50'
        )}
      >
        {isPinned ? 'Swap' : '+ Pin'}
      </button>
    </div>
  );
};
