import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Terminal,
  Blocks,
  Globe,
  Megaphone,
  ChevronDown,
  Check,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_LEAD_CATEGORIES,
  getAllCategories,
  addCustomCategory,
  CATEGORIES_UPDATED_EVENT,
} from '@/lib/categories';

export const LEAD_CATEGORIES = DEFAULT_LEAD_CATEGORIES;
export type LeadCategory = (typeof DEFAULT_LEAD_CATEGORIES)[number];

interface CategorySelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  extraCategories?: string[];
  className?: string;
  allowAddNew?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select or add category...',
  id,
  extraCategories = [],
  className = '',
  allowAddNew = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [customListVersion, setCustomListVersion] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  // Listen for storage / cross-component category updates
  useEffect(() => {
    const handleUpdate = () => {
      setCustomListVersion((v) => v + 1);
    };
    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute all available categories (predefined + custom + extra + current value)
  const allCategories = useMemo(() => {
    return getAllCategories([...extraCategories, value]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraCategories, value, customListVersion]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setSearchFilter('');
        setNewCategoryInput('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter categories only if user typed a search filter
  const filteredCategories = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((cat) => cat.toLowerCase().includes(q));
  }, [allCategories, searchFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI Development Company':
        return <Bot className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
      case 'Forward Deployed Engineering':
        return <Terminal className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case 'Blockchain Development Company':
        return <Blocks className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      case 'Web3 Development Company':
        return <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
      case 'Web3 Marketing Agency':
        return <Megaphone className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
      default:
        return <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
    }
  };

  const handleSelectCategory = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchFilter('');
    setIsAddingNew(false);
  };

  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    addCustomCategory(trimmed);
    onChange(trimmed);
    setIsOpen(false);
    setIsAddingNew(false);
    setNewCategoryInput('');
    setSearchFilter('');
  };

  const handleToggleOpen = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    setSearchFilter('');
    setIsAddingNew(false);
    if (nextState) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button / Display Input */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-left flex items-center justify-between gap-2 shadow-subtle hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {value ? (
            <>
              {getCategoryIcon(value)}
              <span className="text-txt-primary font-medium truncate">{value}</span>
            </>
          ) : (
            <span className="text-txt-muted truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-txt-muted shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Hidden input for form validity if required */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu - Directly shows ALL categories */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-card shadow-lg py-1 text-xs max-h-72 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Quick Search Header */}
          <div className="p-1.5 border-b border-border/60 bg-slate-50/50">
            <div className="relative flex items-center">
              <Search className="absolute left-2 h-3.5 w-3.5 text-txt-muted pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search categories or type to filter..."
                className="w-full h-7 rounded-input border border-border bg-white pl-7 pr-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Categories List Container */}
          <div className="overflow-y-auto flex-1 py-1 max-h-48">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-txt-muted uppercase tracking-wider flex items-center justify-between">
              <span>Categories ({filteredCategories.length})</span>
              <span className="text-[9px] font-normal lowercase">click to select</span>
            </div>

            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => {
                const isSelected = value === cat;
                const isPredefined = (DEFAULT_LEAD_CATEGORIES as readonly string[]).includes(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-txt-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getCategoryIcon(cat)}
                      <span className="truncate">{cat}</span>
                      {!isPredefined && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Custom
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-txt-muted text-center italic">
                No matching category found
              </div>
            )}
          </div>

          {/* Add New Category / Other Section - only when allowAddNew is true */}
          {allowAddNew && (
            <div className="border-t border-border/70 p-1.5 bg-slate-50/80">
              {isAddingNew ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={newCatInputRef}
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory();
                        }
                        if (e.key === 'Escape') {
                          setIsAddingNew(false);
                        }
                      }}
                      placeholder="Enter new category name..."
                      className="flex-1 h-7 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      disabled={!newCategoryInput.trim()}
                      className="h-7 px-2.5 rounded-btn bg-[#57B71B] hover:bg-[#469815] text-white text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewCategoryInput('');
                      }}
                      className="h-7 px-2 text-xs text-txt-muted hover:text-txt-primary cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                  <span className="text-[10px] text-txt-muted block px-0.5">
                    Press Enter to save and select immediately for leads & customers.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(true);
                    if (searchFilter.trim() && !filteredCategories.includes(searchFilter.trim())) {
                      setNewCategoryInput(searchFilter.trim());
                    }
                    setTimeout(() => {
                      newCatInputRef.current?.focus();
                    }, 50);
                  }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-txt-secondary hover:text-txt-primary transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-[#2563EB]">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Other / Add New Category</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-txt-muted">
                    Custom
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
