import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  Building2,
  User,
  FileSignature,
  ListChecks,
  Wallet,
  Calculator,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Printer,
  Bookmark,
  FolderOpen,
  Sparkles,
  Upload,
  X,
  CreditCard,
  CheckCircle2,
  Search,
  Landmark,
  ChevronDown,
  Edit2,
  Settings2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layout,
  FileText,
  Columns,
} from 'lucide-react';

export interface CustomColumnConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency';
  defaultValue?: string | number;
  showInPreview: boolean;
  required?: boolean;
}

interface InvoiceItem {
  id: string;
  description: string;
  subdesc?: string;
  quantity: number;
  price: number;
  advanceAmount?: number;
  customValues?: Record<string, any>;
}

interface SavedInvoiceRecord {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  clientName: string;
  total: number;
  status: string;
  currency: string;
  savedAt: string;
  data: any;
}

const DEFAULT_COMPANY_PROFILE = {
  name: 'Digitechzo',
  email: 'billing@digitechzo.com',
  address: 'Digitechzo Tech Solutions, Suite 200, IT Park, Chennai, TN 600001',
  phone: '+91 98765 43210',
  taxId: '33DIGI1234F1Z9',
  website: 'https://digitechzo.com',
  logo: '',
  logoHeight: 48,
};

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscSwift: string;
  branch: string;
}

const INITIAL_BANK_ACCOUNT: BankAccount = {
  id: 'bank_1',
  bankName: 'Primary Bank Account',
  accountName: 'Digitechzo Media & Technologies Pvt Ltd',
  accountNumber: '',
  ifscSwift: '',
  branch: '',
};

const UPI_PRESETS = {
  official: {
    upiId: 'digitechzo@okicici',
    payeeName: 'Digitechzo',
    note: 'Payment for DigiTechzo Invoice',
  },
  gpay: {
    upiId: '9876543210@okbizaxis',
    payeeName: 'Digitechzo Business',
    note: 'Digitechzo Commercial Operations',
  },
};

const CRYPTO_PRESETS = {
  usdt_trc20: {
    coin: 'USDT (TRC20)',
    network: 'TRON (TRC20)',
    address: 'TYDzsYWaWXtHVRMokBSuP2t97711234567',
  },
  usdt_erc20: {
    coin: 'USDT (ERC20)',
    network: 'Ethereum (ERC20)',
    address: '0x71C8364862Ab394F80bA176e3d2319047915B51c',
  },
  btc: {
    coin: 'BTC (Bitcoin)',
    network: 'Bitcoin Mainnet',
    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  },
};

export const DEFAULT_BRAND_THEME = {
  id: 'digitechzo_green',
  name: 'Digitechzo Green',
  primary: '#57B71B',
  secondary: '#10b981',
};

export const COLOR_PRESETS = [DEFAULT_BRAND_THEME];

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    if (!user) return true; // Default permissive in standalone dev mode
    const r = user.role?.toUpperCase();
    return r === 'ADMIN' || r === 'SUPER_ADMIN';
  }, [user]);

  // 1. Fetch CRM Leads for quick client auto-population
  const { data: leadsResponse } = useQuery({
    queryKey: ['invoice-leads-selector'],
    queryFn: () => crmApi.getLeads({ limit: 100 }),
  });
  const leads = useMemo(() => {
    return leadsResponse?.items || leadsResponse?.data || [];
  }, [leadsResponse]);

  // 1b. Fetch Invoices from PostgreSQL Database
  const {
    data: dbInvoicesData,
    refetch: refetchDbInvoices,
    isLoading: isLoadingDbInvoices,
  } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: () => crmApi.getInvoices({ limit: 100 }),
  });

  // 1c. Fetch Organization Company Profile from Database
  const { data: dbCompanyProfile } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => crmApi.getCompanyProfile(),
  });

  // 2. Sender / Company Profile State
  const [sender, setSender] = useState(() => {
    try {
      const saved = localStorage.getItem('digitechzo_company_profile');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_PROFILE;
    } catch {
      return DEFAULT_COMPANY_PROFILE;
    }
  });

  useEffect(() => {
    if (dbCompanyProfile && dbCompanyProfile.name) {
      setSender((prev: any) => ({
        ...prev,
        name: dbCompanyProfile.name || prev.name,
        email: dbCompanyProfile.email || prev.email,
        phone: dbCompanyProfile.phone || prev.phone,
        address: dbCompanyProfile.address || prev.address,
        taxId: dbCompanyProfile.taxId || prev.taxId,
        website: dbCompanyProfile.website || prev.website,
        logo: dbCompanyProfile.logo || prev.logo,
        logoHeight: dbCompanyProfile.logoHeight || prev.logoHeight,
      }));
    }
  }, [dbCompanyProfile]);

  // 3. Client State
  const [client, setClient] = useState({
    name: 'Vortex Global Tech Solutions',
    contact: 'Rajesh Kumar',
    email: 'rajesh@vortextech.com',
    phone: '+91 91234 56789',
    address: '45 Innovation Way, Cyber City, Hyderabad, TS',
  });

  // 4. Metadata State
  const [meta, setMeta] = useState({
    number: 'DIGI-2026-001',
    poNumber: 'PO-98402',
    date: new Date().toISOString().split('T')[0],
    paymentTermsDays: '15',
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    currency: '₹',
    status: 'UNPAID',
    amountPaid: 0,
  });

  // Auto-calculate Due Date when terms or date change
  useEffect(() => {
    if (meta.paymentTermsDays === 'custom') return;
    const days = parseInt(meta.paymentTermsDays, 10) || 0;
    const baseDate = new Date(meta.date || Date.now());
    if (isNaN(baseDate.getTime())) return;
    baseDate.setDate(baseDate.getDate() + days);
    setMeta((prev) => ({ ...prev, dueDate: baseDate.toISOString().split('T')[0] }));
  }, [meta.date, meta.paymentTermsDays]);

  // 5. Line Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: 'Enterprise Web Platform Architecture & Development',
      subdesc: 'Full-stack Node.js & React app setup with DB indexing',
      quantity: 1,
      price: 45000,
      advanceAmount: 20000,
    },
    {
      id: '2',
      description: 'UI/UX Design System & Figma Mockups',
      subdesc: 'Mobile responsive design system with dark/light themes',
      quantity: 1,
      price: 25000,
      advanceAmount: 10000,
    },
    {
      id: '3',
      description: 'RESTful API & Payment Gateway Integration',
      subdesc: 'UPI, Card & Webhook security setup',
      quantity: 1,
      price: 15000,
      advanceAmount: 5000,
    },
  ]);

  // 6. Tax, Discount, Advance & Custom Columns Settings
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discountRate, setDiscountRate] = useState<number>(5);
  const [advancePercent, setAdvancePercent] = useState<number>(0);
  const [enableQtyColumn, setEnableQtyColumn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('digitechzo_invoice_enable_qty');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [enablePriceColumn, setEnablePriceColumn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('digitechzo_invoice_enable_price');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [enableAdvanceColumn, setEnableAdvanceColumn] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('digitechzo_invoice_enable_advance');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Custom Columns configured by Admin or current user
  const [customColumns, setCustomColumns] = useState<CustomColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem('digitechzo_invoice_custom_columns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal / Form state for "+ Add Custom Column"
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<'text' | 'number' | 'currency'>('text');
  const [newColDefault, setNewColDefault] = useState('');
  const [newColShowInPreview, setNewColShowInPreview] = useState(true);
  const [newColRequired, setNewColRequired] = useState(false);
  const [editingColId, setEditingColId] = useState<string | null>(null);

  // 7. Payment Options
  const [payment, setPayment] = useState({
    activeTab: 'bank' as 'bank' | 'upi' | 'crypto',
    enableBank: true,
    enableUpi: true,
    enableCrypto: true,
    bankPreset: INITIAL_BANK_ACCOUNT.id,
    bank: INITIAL_BANK_ACCOUNT,
    upiPreset: 'official',
    upi: UPI_PRESETS.official,
    customUpiQr: '',
    cryptoPreset: 'usdt_trc20',
    crypto: CRYPTO_PRESETS.usdt_trc20,
    customCryptoQr: '',
  });

  // 8. Notes, Signature & Footer
  const [notesHeading, setNotesHeading] = useState('TERMS & INSTRUCTIONS:');
  const [notes, setNotes] = useState(
    'Thank you for partnering with Digitechzo! Please process payment within 15 days of invoice date.'
  );
  const [signature, setSignature] = useState({
    name: 'Alexander Vance',
    role: 'Managing Director',
    signatureImage: '',
  });
  const [footerText, setFooterText] = useState(
    'Digitechzo | Official Invoice Generator & Billing Portal'
  );

  // 9. Theme (Default Digitechzo Green)
  const [activeTheme, setActiveTheme] = useState(DEFAULT_BRAND_THEME);

  // 9b. Responsive Studio Layout View Mode ('split' | 'editor' | 'preview')
  const [studioViewMode, setStudioViewMode] = useState<'split' | 'editor' | 'preview'>('editor');

  // 10. Modals & Notifications
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('digitechzo_saved_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync real database invoices into studio history state
  useEffect(() => {
    const dbItems = dbInvoicesData?.items || dbInvoicesData?.data;
    if (Array.isArray(dbItems) && dbItems.length > 0) {
      const mapped: SavedInvoiceRecord[] = dbItems.map((inv: any) => ({
        id: inv.id,
        number: inv.invoiceNumber,
        date: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : '',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
        clientName: inv.clientName,
        total: Number(inv.total),
        status: inv.status,
        currency: inv.currency || '₹',
        savedAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString() : '',
        data: inv.rawData || {
          sender: inv.senderProfile,
          client: {
            name: inv.clientName,
            contact: inv.clientContact,
            email: inv.clientEmail,
            phone: inv.clientPhone,
            address: inv.clientAddress,
            taxId: inv.clientTaxId,
          },
          meta: {
            number: inv.invoiceNumber,
            poNumber: inv.poNumber,
            date: inv.issueDate?.split('T')[0],
            dueDate: inv.dueDate?.split('T')[0],
            paymentTermsDays: inv.paymentTermsDays,
            status: inv.status,
            currency: inv.currency,
            amountPaid: Number(inv.amountPaid || 0),
          },
          items: (inv.items || []).map((it: any) => ({
            id: it.id,
            description: it.description,
            subdesc: it.subdesc,
            quantity: it.quantity,
            price: Number(it.price),
            advanceAmount: it.advanceAmount ? Number(it.advanceAmount) : undefined,
            customValues: it.customValues,
          })),
          taxRate: Number(inv.taxRate || 0),
          discountRate: Number(inv.discountRate || 0),
          notes: inv.notes,
          footerText: inv.footerText,
          signature: inv.signature,
          payment: {
            bank: inv.bankDetails,
            upi: inv.upiDetails,
            crypto: inv.cryptoDetails,
          },
          customColumns: inv.customColumns || [],
          activeTheme: inv.activeTheme,
        },
      }));
      setSavedInvoices(mapped);
      localStorage.setItem('digitechzo_saved_invoices', JSON.stringify(mapped));
    }
  }, [dbInvoicesData]);

  // Bank Accounts Management (Persisted in localStorage without hardcoded HDFC/ICICI, purged of unnamed entries)
  const [savedBanks, setSavedBanks] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem('digitechzo_saved_banks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(
            (b: any) =>
              b &&
              b.bankName &&
              b.bankName.trim() !== '' &&
              b.bankName.trim().toLowerCase() !== 'unnamed bank account' &&
              !b.bankName?.toLowerCase().includes('hdfc bank') &&
              !b.bankName?.toLowerCase().includes('icici bank')
          );
          if (cleaned.length > 0) {
            localStorage.setItem('digitechzo_saved_banks', JSON.stringify(cleaned));
            return cleaned;
          }
        }
      }
    } catch {}
    const fallbackBank: BankAccount = {
      id: 'bank_default',
      bankName: 'Primary Bank Account',
      accountName: 'Digitechzo Media & Technologies Pvt Ltd',
      accountNumber: '',
      ifscSwift: '',
      branch: '',
    };
    try {
      localStorage.setItem('digitechzo_saved_banks', JSON.stringify([fallbackBank]));
    } catch {}
    return [fallbackBank];
  });

  const handleAddBankAccount = () => {
    setIsBankDropdownOpen(true);
    setIsAddingNewBank(true);
    setTimeout(() => {
      newBankInputRef.current?.focus();
    }, 50);
  };

  const handleUpdateCurrentBank = (fields: Partial<BankAccount>) => {
    const updatedBank = { ...payment.bank, ...fields };
    setPayment((p) => ({ ...p, bank: updatedBank }));

    // Real-time update in savedBanks list so dropdown displays whatever user types
    setSavedBanks((prev) => {
      const exists = prev.some((b) => b.id === payment.bankPreset);
      const nextList = exists
        ? prev.map((b) => (b.id === payment.bankPreset ? { ...b, ...fields } : b))
        : [...prev, { ...updatedBank, id: payment.bankPreset }];
      localStorage.setItem('digitechzo_saved_banks', JSON.stringify(nextList));
      return nextList;
    });
  };

  const handleDeleteSavedBank = (bankId: string) => {
    if (savedBanks.length <= 1) {
      showToast('You must have at least one bank account');
      return;
    }
    const updated = savedBanks.filter((b) => b.id !== bankId);
    setSavedBanks(updated);
    localStorage.setItem('digitechzo_saved_banks', JSON.stringify(updated));
    if (payment.bankPreset === bankId) {
      const nextBank = updated[0];
      setPayment((p) => ({ ...p, bankPreset: nextBank.id, bank: nextBank }));
    }
    showToast('Bank account removed');
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Custom Searchable & Addable Bank Account Dropdown State
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearchFilter, setBankSearchFilter] = useState('');
  const [isAddingNewBank, setIsAddingNewBank] = useState(false);
  const [newBankInput, setNewBankInput] = useState('');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBankName, setEditingBankName] = useState('');
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const bankSearchInputRef = useRef<HTMLInputElement>(null);
  const newBankInputRef = useRef<HTMLInputElement>(null);
  const editBankInputRef = useRef<HTMLInputElement>(null);

  // Close bank dropdown on click outside
  useEffect(() => {
    const handleClickOutsideBank = (event: MouseEvent) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
        setIsAddingNewBank(false);
        setEditingBankId(null);
        setBankSearchFilter('');
        setNewBankInput('');
      }
    };
    document.addEventListener('mousedown', handleClickOutsideBank);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideBank);
    };
  }, []);

  const handleAddNewBankConfirm = () => {
    const trimmed = newBankInput.trim();
    if (!trimmed) {
      showToast('Please enter a bank account name');
      return;
    }

    const newId = `bank_${Date.now()}`;
    const newBank: BankAccount = {
      id: newId,
      bankName: trimmed,
      accountName: sender.name || 'Digitechzo',
      accountNumber: '',
      ifscSwift: '',
      branch: '',
    };
    const updated = [...savedBanks, newBank];
    setSavedBanks(updated);
    localStorage.setItem('digitechzo_saved_banks', JSON.stringify(updated));
    setPayment((p) => ({ ...p, bankPreset: newId, bank: newBank }));
    setIsBankDropdownOpen(false);
    setIsAddingNewBank(false);
    setNewBankInput('');
    setBankSearchFilter('');
    showToast(`Bank "${trimmed}" added and selected!`);
  };

  const handleSaveBankRename = (bankId: string) => {
    const trimmed = editingBankName.trim();
    if (!trimmed) {
      showToast('Bank name cannot be empty');
      return;
    }
    const updated = savedBanks.map((b) => (b.id === bankId ? { ...b, bankName: trimmed } : b));
    setSavedBanks(updated);
    localStorage.setItem('digitechzo_saved_banks', JSON.stringify(updated));
    if (payment.bankPreset === bankId) {
      setPayment((p) => ({ ...p, bank: { ...p.bank, bankName: trimmed } }));
    }
    setEditingBankId(null);
    setEditingBankName('');
    showToast(`Bank renamed to "${trimmed}"`);
  };

  // Toggle Qty Column & Persist
  const handleToggleQtyColumn = (enabled: boolean) => {
    setEnableQtyColumn(enabled);
    localStorage.setItem('digitechzo_invoice_enable_qty', JSON.stringify(enabled));
    showToast(enabled ? 'Qty column enabled' : 'Qty column hidden');
  };

  // Toggle Full Amount Column & Persist
  const handleTogglePriceColumn = (enabled: boolean) => {
    setEnablePriceColumn(enabled);
    localStorage.setItem('digitechzo_invoice_enable_price', JSON.stringify(enabled));
    showToast(enabled ? 'Full Amount column enabled' : 'Full Amount column hidden');
  };

  // Toggle Advance Column & Persist in LocalStorage/Database Settings
  const handleToggleAdvanceColumn = (enabled: boolean) => {
    setEnableAdvanceColumn(enabled);
    localStorage.setItem('digitechzo_invoice_enable_advance', JSON.stringify(enabled));
    showToast(enabled ? 'Advanced Amount column enabled' : 'Advanced Amount column hidden');
  };

  // Custom Columns Actions
  const handleOpenAddColumnModal = (colToEdit?: CustomColumnConfig) => {
    if (colToEdit) {
      setEditingColId(colToEdit.id);
      setNewColLabel(colToEdit.label);
      setNewColType(colToEdit.type);
      setNewColDefault(colToEdit.defaultValue !== undefined ? String(colToEdit.defaultValue) : '');
      setNewColShowInPreview(colToEdit.showInPreview);
      setNewColRequired(!!colToEdit.required);
    } else {
      setEditingColId(null);
      setNewColLabel('');
      setNewColType('text');
      setNewColDefault('');
      setNewColShowInPreview(true);
      setNewColRequired(false);
    }
    setIsColumnModalOpen(true);
  };

  const handleSaveCustomColumn = () => {
    const trimmedLabel = newColLabel.trim();
    if (!trimmedLabel) {
      showToast('Column heading is required');
      return;
    }

    if (editingColId) {
      // Update existing column
      const updated = customColumns.map((col) => {
        if (col.id === editingColId) {
          return {
            ...col,
            label: trimmedLabel,
            type: newColType,
            defaultValue: newColDefault,
            showInPreview: newColShowInPreview,
            required: newColRequired,
          };
        }
        return col;
      });
      setCustomColumns(updated);
      localStorage.setItem('digitechzo_invoice_custom_columns', JSON.stringify(updated));
      showToast(`Column "${trimmedLabel}" updated successfully`);
    } else {
      // Create new column key from label
      const key = `col_${Date.now()}`;
      const newCol: CustomColumnConfig = {
        id: `col_${Date.now()}`,
        key,
        label: trimmedLabel,
        type: newColType,
        defaultValue: newColDefault,
        showInPreview: newColShowInPreview,
        required: newColRequired,
      };
      const updated = [...customColumns, newCol];
      setCustomColumns(updated);
      localStorage.setItem('digitechzo_invoice_custom_columns', JSON.stringify(updated));

      // Populate default value for existing items if specified
      if (newColDefault) {
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            customValues: {
              ...(item.customValues || {}),
              [key]: newColDefault,
            },
          }))
        );
      }
      showToast(`Column "${trimmedLabel}" added to invoice items!`);
    }

    setIsColumnModalOpen(false);
    setEditingColId(null);
  };

  const handleToggleColumnVisibility = (colId: string) => {
    const updated = customColumns.map((c) =>
      c.id === colId ? { ...c, showInPreview: !c.showInPreview } : c
    );
    setCustomColumns(updated);
    localStorage.setItem('digitechzo_invoice_custom_columns', JSON.stringify(updated));
    showToast('Column visibility updated');
  };

  const handleReorderColumn = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= customColumns.length) return;
    const updated = [...customColumns];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setCustomColumns(updated);
    localStorage.setItem('digitechzo_invoice_custom_columns', JSON.stringify(updated));
  };

  const handleDeleteCustomColumn = (col: CustomColumnConfig) => {
    // Check if any existing item has data in this column
    const hasData = items.some(
      (item) => item.customValues && item.customValues[col.key] !== undefined && item.customValues[col.key] !== ''
    );

    if (hasData) {
      const confirmDelete = window.confirm(
        `Column "${col.label}" contains data in your current invoice items. Are you sure you want to delete it? This data will be removed.`
      );
      if (!confirmDelete) return;
    }

    const updated = customColumns.filter((c) => c.id !== col.id);
    setCustomColumns(updated);
    localStorage.setItem('digitechzo_invoice_custom_columns', JSON.stringify(updated));

    // Clean up stored item values for this key
    setItems((prev) =>
      prev.map((item) => {
        if (!item.customValues) return item;
        const nextCustom = { ...item.customValues };
        delete nextCustom[col.key];
        return { ...item, customValues: nextCustom };
      })
    );
    showToast(`Column "${col.label}" removed`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Invoice Preview Sticky & Smooth Scroll Sync
  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.quantity || 0) * (it.price || 0), 0);
  }, [items]);

  const discountAmount = useMemo(() => {
    return subtotal * ((discountRate || 0) / 100);
  }, [subtotal, discountRate]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(() => {
    return taxableAmount * ((taxRate || 0) / 100);
  }, [taxableAmount, taxRate]);

  const grandTotal = taxableAmount + taxAmount;

  const totalAdvance = useMemo(() => {
    if (!enableAdvanceColumn) return 0;
    const fromItems = items.reduce((acc, it) => {
      const lineTotal = (it.quantity || 0) * (it.price || 0);
      if (typeof it.advanceAmount === 'number') {
        return acc + it.advanceAmount;
      }
      return acc + (advancePercent > 0 ? (lineTotal * advancePercent) / 100 : 0);
    }, 0);
    if (fromItems > 0) return fromItems;
    if (advancePercent > 0) return (grandTotal * advancePercent) / 100;
    return 0;
  }, [items, advancePercent, grandTotal, enableAdvanceColumn]);

  const balanceDue = Math.max(0, grandTotal - Math.max(meta.amountPaid || 0, totalAdvance));

  // Auto-generate invoice number
  const handleAutoGenerateInvoiceNumber = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const year = new Date().getFullYear();
    setMeta((prev) => ({ ...prev, number: `DIGI-${year}-${randomSuffix}` }));
    showToast('Generated new invoice number');
  };

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: 'New Consultation Service',
        subdesc: '',
        quantity: 1,
        price: 5000,
        advanceAmount: 2500,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast('Invoice must have at least one line item');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddPreset = (desc: string, price: number, defaultAdvance?: number) => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: desc,
        subdesc: 'Standard commercial service rate',
        quantity: 1,
        price,
        advanceAmount: defaultAdvance !== undefined ? defaultAdvance : Math.round(price * 0.5),
      },
    ]);
    showToast(`Added ${desc}`);
  };

  // Copy to clipboard
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(`Copied to clipboard: ${text}`);
  };

  // Save Company Profile
  const handleSaveCompanyProfile = async () => {
    localStorage.setItem('digitechzo_company_profile', JSON.stringify(sender));
    try {
      await crmApi.saveCompanyProfile(sender);
      showToast('Company profile saved to database!');
    } catch {
      showToast('Company profile saved locally');
    }
  };

  const handleLoadCompanyProfile = () => {
    try {
      const saved = localStorage.getItem('digitechzo_company_profile');
      if (saved) {
        setSender(JSON.parse(saved));
        showToast('Company profile loaded');
      } else {
        showToast('No saved profile found');
      }
    } catch {
      showToast('Failed to load profile');
    }
  };

  // Logo upload with image optimization (compression & auto-resizing via Canvas)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Logo file size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target?.result as string;
      if (!rawBase64) return;

      // Optimize image via Canvas to prevent bloated storage & speed up PDF rendering
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        // Proportional scale-down if image is larger than max bounding box
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Prefer PNG if transparency is needed, or compressed JPEG
          const isTransparent = file.type === 'image/png' || file.type === 'image/svg+xml' || file.type === 'image/webp';
          const optimizedBase64 = canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', 0.88);
          setSender((prev: any) => ({
            ...prev,
            logo: optimizedBase64,
            logoHeight: prev.logoHeight || 48,
          }));
          showToast(`Logo optimized & uploaded successfully (${width}×${height}px)`);
        } else {
          // Fallback if canvas context fails
          setSender((prev: any) => ({ ...prev, logo: rawBase64, logoHeight: prev.logoHeight || 48 }));
          showToast('Logo uploaded successfully');
        }
      };
      img.onerror = () => {
        setSender((prev: any) => ({ ...prev, logo: rawBase64, logoHeight: prev.logoHeight || 48 }));
        showToast('Logo uploaded');
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
    // Reset input so re-uploading the same file works
    e.target.value = '';
  };

  // Custom QR upload
  const handleUpiQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPayment((prev) => ({ ...prev, customUpiQr: base64 }));
      showToast('Custom UPI QR uploaded');
    };
    reader.readAsDataURL(file);
  };

  // Save Invoice (Database + Local Sync)
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  const handleSaveInvoice = async (statusOverride?: string) => {
    const finalStatus = statusOverride || meta.status;
    const localId = Date.now().toString();
    const snapshot: SavedInvoiceRecord = {
      id: localId,
      number: meta.number,
      date: meta.date,
      dueDate: meta.dueDate,
      clientName: client.name,
      total: grandTotal,
      status: finalStatus,
      currency: meta.currency,
      savedAt: new Date().toLocaleString(),
      data: {
        sender,
        client,
        meta: { ...meta, status: finalStatus },
        items,
        taxRate,
        discountRate,
        advancePercent,
        enableQtyColumn,
        enablePriceColumn,
        enableAdvanceColumn,
        customColumns,
        payment,
        notes,
        signature,
        footerText,
        activeTheme,
      },
    };

    const existing = savedInvoices.filter((inv) => inv.number !== meta.number);
    const updated = [snapshot, ...existing];
    setSavedInvoices(updated);
    localStorage.setItem('digitechzo_saved_invoices', JSON.stringify(updated));
    if (statusOverride) {
      setMeta((prev) => ({ ...prev, status: statusOverride }));
    }

    try {
      setIsSavingInvoice(true);
      const payload = {
        invoiceNumber: meta.number,
        poNumber: meta.poNumber,
        clientName: client.name,
        clientContact: client.contact,
        clientEmail: client.email,
        clientPhone: client.phone,
        clientAddress: client.address,
        issueDate: meta.date ? new Date(meta.date).toISOString() : new Date().toISOString(),
        dueDate: meta.dueDate ? new Date(meta.dueDate).toISOString() : new Date().toISOString(),
        paymentTermsDays: meta.paymentTermsDays,
        status: finalStatus,
        currency: meta.currency,
        subtotal,
        taxRate,
        taxAmount,
        discountRate,
        discountAmount,
        total: grandTotal,
        advanceAmount: totalAdvance,
        amountPaid: meta.amountPaid || 0,
        balanceDue,
        notes,
        notesHeading,
        footerText,
        senderProfile: sender,
        bankDetails: payment.bank,
        upiDetails: payment.upi,
        cryptoDetails: payment.crypto,
        signature,
        customColumns,
        columnConfig: {
          enableQtyColumn,
          enablePriceColumn,
          enableAdvanceColumn,
        },
        activeTheme,
        rawData: snapshot.data,
        items: items.map((it, idx) => ({
          description: it.description,
          subdesc: it.subdesc,
          quantity: it.quantity || 1,
          price: it.price || 0,
          advanceAmount: it.advanceAmount,
          customValues: it.customValues,
          order: idx,
        })),
      };

      await crmApi.createInvoice(payload);
      await refetchDbInvoices();
      showToast(`Invoice ${meta.number} saved to PostgreSQL database!`);
    } catch (err: any) {
      console.warn('Backend invoice save note:', err);
      showToast(`Invoice ${meta.number} saved!`);
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Load Invoice
  const handleLoadInvoice = (rec: SavedInvoiceRecord) => {
    const d = rec.data;
    if (!d) return;
    if (d.sender) setSender(d.sender);
    if (d.client) setClient(d.client);
    if (d.meta) setMeta(d.meta);
    if (d.items) setItems(d.items);
    if (d.taxRate !== undefined) setTaxRate(d.taxRate);
    if (d.discountRate !== undefined) setDiscountRate(d.discountRate);
    if (d.advancePercent !== undefined) setAdvancePercent(d.advancePercent);
    if (d.enableQtyColumn !== undefined) setEnableQtyColumn(d.enableQtyColumn);
    if (d.enablePriceColumn !== undefined) setEnablePriceColumn(d.enablePriceColumn);
    if (d.enableAdvanceColumn !== undefined) setEnableAdvanceColumn(d.enableAdvanceColumn);
    if (d.customColumns) setCustomColumns(d.customColumns);
    if (d.payment) setPayment(d.payment);
    if (d.notes !== undefined) setNotes(d.notes);
    if (d.notesHeading !== undefined) setNotesHeading(d.notesHeading);
    if (d.signature) setSignature(d.signature);
    if (d.footerText !== undefined) setFooterText(d.footerText);
    if (d.activeTheme) setActiveTheme(d.activeTheme);
    setIsHistoryModalOpen(false);
    showToast(`Loaded invoice ${rec.number}`);
  };

  // Delete Invoice from History & Database
  const handleDeleteInvoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved invoice?')) return;
    const updated = savedInvoices.filter((i) => i.id !== id);
    setSavedInvoices(updated);
    localStorage.setItem('digitechzo_saved_invoices', JSON.stringify(updated));

    try {
      if (id.includes('-') && id.length > 20) {
        await crmApi.deleteInvoice(id);
        await refetchDbInvoices();
        showToast('Invoice deleted from database');
      } else {
        showToast('Invoice deleted from history');
      }
    } catch {
      showToast('Invoice deleted');
    }
  };

  // Reset Form
  const handleResetForm = () => {
    if (!window.confirm('Reset invoice editor to default values?')) return;
    handleAutoGenerateInvoiceNumber();
    setClient({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
    });
    setItems([
      {
        id: '1',
        description: 'Commercial Service',
        subdesc: '',
        quantity: 1,
        price: 10000,
      },
    ]);
    setMeta((prev) => ({
      ...prev,
      poNumber: '',
      status: 'UNPAID',
      amountPaid: 0,
    }));
    setActiveTheme(DEFAULT_BRAND_THEME);
    showToast('Invoice form reset');
  };

  // Print Invoice
  const handlePrint = () => {
    window.print();
  };

  // UPI QR Code URL
  const upiQrUrl = useMemo(() => {
    if (payment.customUpiQr) return payment.customUpiQr;
    if (!payment.upi.upiId) return '';
    const upiUrl = `upi://pay?pa=${encodeURIComponent(payment.upi.upiId)}&pn=${encodeURIComponent(
      payment.upi.payeeName || sender.name
    )}&am=${grandTotal.toFixed(2)}&tn=${encodeURIComponent(
      payment.upi.note || `Invoice ${meta.number}`
    )}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      upiUrl
    )}`;
  }, [payment.customUpiQr, payment.upi, sender.name, grandTotal, meta.number]);

  // Crypto QR Code URL
  const cryptoQrUrl = useMemo(() => {
    if (payment.customCryptoQr) return payment.customCryptoQr;
    if (!payment.crypto.address) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      payment.crypto.address
    )}`;
  }, [payment.customCryptoQr, payment.crypto.address]);

  // Filtered saved invoices
  const filteredInvoices = useMemo(() => {
    if (!historySearch.trim()) return savedInvoices;
    const q = historySearch.toLowerCase();
    return savedInvoices.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.date.toLowerCase().includes(q)
    );
  }, [savedInvoices, historySearch]);

  return (
    <div className="space-y-4 select-none pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-[#57B71B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Quick Actions Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-900 text-white p-3.5 sm:p-4 rounded-card shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#57B71B] to-emerald-400 text-white shadow-md">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Digitechzo <span className="text-[#57B71B]">Invoice Studio</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Admin Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-payment admin billing, live invoice paper preview & print generator
            </p>
          </div>
        </div>

        {/* Action Buttons & View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher (Editor / Preview / Split) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-btn border border-slate-700/80 mr-1">
            <button
              type="button"
              onClick={() => setStudioViewMode('editor')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                studioViewMode === 'editor'
                  ? 'bg-[#57B71B] text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Full Width Spacious Editor"
            >
              <Layout className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editor Only</span>
              <span className="sm:hidden">Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                studioViewMode === 'split'
                  ? 'bg-[#57B71B] text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Side-by-Side Split View"
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Side-by-Side</span>
              <span className="sm:hidden">Split</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioViewMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                studioViewMode === 'preview'
                  ? 'bg-[#57B71B] text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Full Width Live Invoice Paper Preview"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Full Preview</span>
              <span className="sm:hidden">Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSaveInvoice()}
            disabled={isSavingInvoice}
            className="flex items-center gap-1.5 h-8 px-3 rounded-btn text-xs font-bold bg-[#57B71B] hover:bg-[#469815] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Save Invoice to Database & History"
          >
            <Bookmark className="h-3.5 w-3.5" /> {isSavingInvoice ? 'Saving...' : 'Save Invoice'}
          </button>

          <button
            type="button"
            onClick={() => handleSaveInvoice('DRAFT')}
            disabled={isSavingInvoice}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-btn text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Save as Draft"
          >
            Draft
          </button>

          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="relative flex items-center gap-1.5 h-8 px-2.5 rounded-btn text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <FolderOpen className="h-3.5 w-3.5 text-blue-400" /> History
            {savedInvoices.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-500 text-white">
                {savedInvoices.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 h-8 px-3 rounded-btn text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="h-3.5 w-3.5 text-slate-700" /> Print / PDF
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center justify-center h-8 w-8 rounded-btn bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Reset Form"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Studio Layout: Responsive Modes (Full Editor / Side-by-Side Split / Full Preview) */}
      <div
        className={
          studioViewMode === 'split'
            ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'
            : 'max-w-5xl mx-auto w-full'
        }
      >
        {/* ========================================================= */}
        {/* LEFT COLUMN: Admin Editor Form Cards                      */}
        {/* ========================================================= */}
        <div
          className={`no-print space-y-4 ${
            studioViewMode === 'preview'
              ? 'hidden'
              : studioViewMode === 'split'
              ? 'lg:col-span-5'
              : 'w-full'
          }`}
        >
          {/* Card 1: Sender (Your Business) & Logo */}
          <details open className="group rounded-card border border-border bg-white shadow-xs overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-border font-bold text-xs text-txt-primary cursor-pointer hover:bg-slate-100 transition-colors list-none">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#57B71B]" />
                <span>Sender (Your Business Profile)</span>
              </div>
              <span className="text-[10px] text-txt-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCompanyProfile}
                  className="flex-1 h-7 rounded-btn border border-border bg-white hover:bg-slate-50 text-[11px] font-semibold text-txt-secondary flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Bookmark className="h-3 w-3 text-[#57B71B]" /> Save Profile
                </button>
                <button
                  type="button"
                  onClick={handleLoadCompanyProfile}
                  className="flex-1 h-7 rounded-btn border border-border bg-white hover:bg-slate-50 text-[11px] font-semibold text-txt-secondary flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="h-3 w-3 text-blue-500" /> Load Profile
                </button>
              </div>

              {/* Logo Upload Dropzone & Size Controls */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-txt-secondary">Company Logo</label>
                  {sender.logo && (
                    <span className="text-[10px] text-txt-muted font-medium">
                      Height: <strong className="text-[#57B71B] font-bold">{sender.logoHeight || 48}px</strong>
                    </span>
                  )}
                </div>

                <div className="border border-dashed border-slate-300 rounded-btn p-3 bg-slate-50 text-center flex flex-col items-center justify-center relative hover:border-[#57B71B] transition-colors">
                  {sender.logo ? (
                    <div className="w-full space-y-2.5">
                      <div className="relative group w-full flex items-center justify-between bg-white p-2 rounded-md border border-slate-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={sender.logo}
                            alt="Company Logo"
                            style={{ height: `${Math.min(sender.logoHeight || 48, 56)}px` }}
                            className="max-w-[140px] object-contain rounded"
                          />
                          <span className="text-[10px] text-txt-muted truncate">Custom Logo</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <label
                            className="h-6 px-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-semibold flex items-center cursor-pointer transition-colors"
                            title="Replace Logo"
                          >
                            Replace
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => setSender((p: any) => ({ ...p, logo: '' }))}
                            className="h-6 w-6 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center cursor-pointer transition-colors"
                            title="Remove Logo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Logo Height Controller */}
                      <div className="bg-white p-2.5 rounded-md border border-slate-200 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                            <span>Logo Display Height</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="24"
                              max="160"
                              value={sender.logoHeight || 48}
                              onChange={(e) => {
                                const val = Math.max(20, Math.min(200, parseInt(e.target.value, 10) || 48));
                                setSender((p: any) => ({ ...p, logoHeight: val }));
                              }}
                              className="w-14 h-6 text-center text-xs font-bold border border-slate-300 rounded bg-slate-50 focus:bg-white focus:border-[#57B71B] outline-none"
                            />
                            <span className="text-[10px] text-slate-500 font-semibold">px</span>
                          </div>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min="24"
                          max="140"
                          step="2"
                          value={sender.logoHeight || 48}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setSender((p: any) => ({ ...p, logoHeight: val }));
                          }}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#57B71B]"
                        />

                        {/* Preset quick buttons */}
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          {[
                            { label: 'Small', h: 36 },
                            { label: 'Medium', h: 48 },
                            { label: 'Large', h: 64 },
                            { label: 'XL', h: 84 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setSender((p: any) => ({ ...p, logoHeight: preset.h }))}
                              className={`flex-1 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                                (sender.logoHeight || 48) === preset.h
                                  ? 'bg-[#57B71B] text-white border-[#57B71B]'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {preset.label} ({preset.h}px)
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-5 w-5 text-txt-muted mb-1" />
                      <span className="text-[11px] font-semibold text-txt-primary">Click to upload company logo</span>
                      <span className="text-[10px] text-txt-muted">PNG, JPG, SVG, WebP (Auto-optimized & resized)</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Business Name</label>
                  <input
                    type="text"
                    value={sender.name}
                    onChange={(e) => setSender({ ...sender, name: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Email Address</label>
                  <input
                    type="email"
                    value={sender.email}
                    onChange={(e) => setSender({ ...sender, email: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Street Address</label>
                <input
                  type="text"
                  value={sender.address}
                  onChange={(e) => setSender({ ...sender, address: e.target.value })}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={sender.phone}
                    onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">GST / Tax ID</label>
                  <input
                    type="text"
                    value={sender.taxId}
                    onChange={(e) => setSender({ ...sender, taxId: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Card 2: Bill To (Client Information) */}
          <details open className="group rounded-card border border-border bg-white shadow-xs overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-border font-bold text-xs text-txt-primary cursor-pointer hover:bg-slate-100 transition-colors list-none">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span>Bill To (Client Information)</span>
              </div>
              <span className="text-[10px] text-txt-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 space-y-3 text-xs">
              {/* Quick Select from CRM Leads */}
              {leads.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-[#57B71B] flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" /> Quick Auto-Fill from CRM Leads:
                  </label>
                  <select
                    className="w-full h-8 rounded-input border border-border bg-emerald-50/50 px-2 text-xs text-txt-primary font-medium cursor-pointer"
                    onChange={(e) => {
                      const selected = leads.find((l: any) => l.id === e.target.value);
                      if (selected) {
                        setClient({
                          name: selected.companyName || selected.fullName || '',
                          contact: selected.fullName || '',
                          email: selected.email || '',
                          phone: selected.phone || '',
                          address: `${selected.serviceInterest || 'Enterprise Client'} - Registered Prospect`,
                        });
                        showToast(`Filled client details for ${selected.fullName}`);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select an existing CRM Lead / Company...
                    </option>
                    {leads.map((lead: any) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.companyName ? `${lead.companyName} (${lead.fullName})` : lead.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">
                    Client Name / Business
                  </label>
                  <input
                    type="text"
                    value={client.name}
                    onChange={(e) => setClient({ ...client, name: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Contact Person</label>
                  <input
                    type="text"
                    value={client.contact}
                    onChange={(e) => setClient({ ...client, contact: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Client Email</label>
                  <input
                    type="email"
                    value={client.email}
                    onChange={(e) => setClient({ ...client, email: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Client Phone</label>
                  <input
                    type="text"
                    value={client.phone}
                    onChange={(e) => setClient({ ...client, phone: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Billing Address</label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                />
              </div>
            </div>
          </details>

          {/* Card 3: Invoice Number, Due Dates & Status */}
          <details open className="group rounded-card border border-border bg-white shadow-xs overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-border font-bold text-xs text-txt-primary cursor-pointer hover:bg-slate-100 transition-colors list-none">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-purple-500" />
                <span>Invoice Number, Dates & Status</span>
              </div>
              <span className="text-[10px] text-txt-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Invoice #</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={meta.number}
                      onChange={(e) => setMeta({ ...meta, number: e.target.value })}
                      className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs font-bold text-txt-primary font-tabular"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateInvoiceNumber}
                      className="h-8 w-8 rounded-btn border border-border bg-slate-50 hover:bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                      title="Generate new invoice number"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-txt-muted" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">P.O. / Ref Number</label>
                  <input
                    type="text"
                    value={meta.poNumber}
                    onChange={(e) => setMeta({ ...meta, poNumber: e.target.value })}
                    placeholder="PO-98402 (Optional)"
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Invoice Date</label>
                  <input
                    type="date"
                    value={meta.date}
                    onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary font-tabular"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Payment Terms</label>
                  <select
                    value={meta.paymentTermsDays}
                    onChange={(e) => setMeta({ ...meta, paymentTermsDays: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary cursor-pointer"
                  >
                    <option value="0">Due on Receipt</option>
                    <option value="7">Net 7 Days</option>
                    <option value="15">Net 15 Days</option>
                    <option value="30">Net 30 Days</option>
                    <option value="60">Net 60 Days</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Payment Due</label>
                  <input
                    type="date"
                    value={meta.dueDate}
                    onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-semibold text-txt-primary font-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Currency</label>
                  <select
                    value={meta.currency}
                    onChange={(e) => setMeta({ ...meta, currency: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary font-bold cursor-pointer"
                  >
                    <option value="₹">INR (₹)</option>
                    <option value="$">USD ($)</option>
                    <option value="€">EUR (€)</option>
                    <option value="£">GBP (£)</option>
                    <option value="AED">AED (AED)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Invoice Status</label>
                  <select
                    value={meta.status}
                    onChange={(e) => setMeta({ ...meta, status: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-bold text-txt-primary cursor-pointer"
                  >
                    <option value="DRAFT">⚪ DRAFT</option>
                    <option value="UNPAID">🔴 UNPAID</option>
                    <option value="PARTIALLY_PAID">🟡 PARTIALLY PAID</option>
                    <option value="PAID">🟢 PAID</option>
                    <option value="CANCELLED">🟣 CANCELLED</option>
                  </select>
                </div>
              </div>

              {meta.status === 'PARTIALLY_PAID' && (
                <div className="p-2.5 rounded-btn bg-amber-50 border border-amber-200">
                  <label className="text-[11px] font-semibold text-amber-900 block mb-0.5">
                    Amount Paid to Date ({meta.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={meta.amountPaid || ''}
                    onChange={(e) => setMeta({ ...meta, amountPaid: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter amount already paid..."
                    className="w-full h-8 rounded-input border border-amber-300 bg-white px-2.5 text-xs text-txt-primary font-tabular"
                  />
                </div>
              )}
            </div>
          </details>

          {/* Card 4: Items & Description */}
          <details open className="group rounded-card border border-border bg-white shadow-xs overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-border font-bold text-xs text-txt-primary cursor-pointer hover:bg-slate-100 transition-colors list-none">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-500" />
                <span>Invoice Items & Services ({items.length})</span>
              </div>
              <span className="text-[10px] text-txt-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 space-y-3 text-xs">
              {/* Invoice Column Settings (Admin / User management) */}
              <div className="p-2.5 rounded-btn bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-[#57B71B]" />
                    <span className="font-bold text-xs text-txt-primary">Invoice Column Settings</span>
                    {!isAdmin && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                        Standard User
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Add Custom Column Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddColumnModal()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#57B71B] hover:bg-[#469815] text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                      title="Add a custom column to invoice items (e.g. Milestone Amount, Service Fee, Installation Charge)"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Custom Column
                    </button>
                  </div>
                </div>

                {/* Standard Columns Visibility & Quick Toggles */}
                <div className="pt-1.5 border-t border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">Standard Columns:</span>
                    <span className="text-[10px] text-txt-muted">Toggle or remove headings anytime</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Qty Column Toggle */}
                    <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-txt-primary">
                        <input
                          type="checkbox"
                          checked={enableQtyColumn}
                          disabled={!isAdmin}
                          onChange={(e) => handleToggleQtyColumn(e.target.checked)}
                          className="rounded accent-[#57B71B] cursor-pointer"
                        />
                        <span>Qty</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleQtyColumn(!enableQtyColumn)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title={enableQtyColumn ? 'Hide Qty column' : 'Show Qty column'}
                      >
                        {enableQtyColumn ? <Eye className="h-3 w-3 text-[#57B71B]" /> : <EyeOff className="h-3 w-3 text-slate-400" />}
                      </button>
                    </div>

                    {/* 2. Full Amount Column Toggle */}
                    <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-txt-primary">
                        <input
                          type="checkbox"
                          checked={enablePriceColumn}
                          disabled={!isAdmin}
                          onChange={(e) => handleTogglePriceColumn(e.target.checked)}
                          className="rounded accent-[#57B71B] cursor-pointer"
                        />
                        <span>Full Amount</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleTogglePriceColumn(!enablePriceColumn)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title={enablePriceColumn ? 'Hide Full Amount column' : 'Show Full Amount column'}
                      >
                        {enablePriceColumn ? <Eye className="h-3 w-3 text-[#57B71B]" /> : <EyeOff className="h-3 w-3 text-slate-400" />}
                      </button>
                    </div>

                    {/* 3. Advanced Amount Column Toggle & Remove */}
                    <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-txt-primary">
                        <input
                          type="checkbox"
                          checked={enableAdvanceColumn}
                          disabled={!isAdmin}
                          onChange={(e) => handleToggleAdvanceColumn(e.target.checked)}
                          className="rounded accent-[#57B71B] cursor-pointer"
                        />
                        <span>Advanced</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleAdvanceColumn(!enableAdvanceColumn)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                          title={enableAdvanceColumn ? 'Hide Advanced column' : 'Show Advanced column'}
                        >
                          {enableAdvanceColumn ? <Eye className="h-3 w-3 text-[#57B71B]" /> : <EyeOff className="h-3 w-3 text-slate-400" />}
                        </button>
                        {enableAdvanceColumn && (
                          <button
                            type="button"
                            onClick={() => {
                              const hasAdvanceValues = items.some(
                                (it) => typeof it.advanceAmount === 'number' && it.advanceAmount > 0
                              );
                              if (hasAdvanceValues) {
                                const ok = window.confirm(
                                  'Delete and clear all Advanced Amounts from this invoice? This will remove advance values and hide the column.'
                                );
                                if (!ok) return;
                              }
                              setItems((prev) => prev.map((it) => ({ ...it, advanceAmount: undefined })));
                              handleToggleAdvanceColumn(false);
                              showToast('Advanced Amount column deleted and cleared');
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                            title="Delete / Remove Advanced Amount column"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Columns Chips / Reorder / Edit List */}
                {customColumns.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/70 space-y-1.5">
                    <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider block">
                      Custom Columns ({customColumns.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {customColumns.map((col, idx) => (
                        <div
                          key={col.id}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-all ${
                            col.showInPreview
                              ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                              : 'bg-slate-100/80 border-slate-200 text-slate-400 line-through'
                          }`}
                        >
                          <span className="font-bold">{col.label}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-500 font-mono">
                            {col.type}
                          </span>

                          {/* Visibility Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleColumnVisibility(col.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                            title={col.showInPreview ? 'Hide from invoice preview & PDF' : 'Show in invoice preview & PDF'}
                          >
                            {col.showInPreview ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>

                          {/* Reorder Buttons */}
                          {isAdmin && idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleReorderColumn(idx, 'up')}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Move left"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                          )}
                          {isAdmin && idx < customColumns.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleReorderColumn(idx, 'down')}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="Move right"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          )}

                          {/* Edit button */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddColumnModal(col)}
                              className="text-slate-400 hover:text-[#57B71B] p-0.5 cursor-pointer"
                              title="Edit column settings"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}

                          {/* Delete button */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomColumn(col)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              title="Delete column"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Add Presets Chips */}
              <div>
                <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider block mb-1.5">
                  Quick Add Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddPreset('Web Application Development', 45000)}
                    className="px-2.5 py-1 rounded-btn bg-slate-100 hover:bg-emerald-50 hover:text-[#57B71B] border border-border text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    💻 Web Dev (₹45k)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset('UI/UX Mobile Design', 25000)}
                    className="px-2.5 py-1 rounded-btn bg-slate-100 hover:bg-emerald-50 hover:text-[#57B71B] border border-border text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    🎨 UI/UX (₹25k)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset('API Integration & Backend', 30000)}
                    className="px-2.5 py-1 rounded-btn bg-slate-100 hover:bg-emerald-50 hover:text-[#57B71B] border border-border text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    ⚡ API (₹30k)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPreset('Cloud Server Hosting Setup', 15000)}
                    className="px-2.5 py-1 rounded-btn bg-slate-100 hover:bg-emerald-50 hover:text-[#57B71B] border border-border text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    ☁️ Hosting (₹15k)
                  </button>
                </div>
              </div>

              {/* Line Items List */}
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div key={item.id} className="p-2.5 rounded-btn border border-border bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-txt-muted">Item #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, description: val } : it)));
                      }}
                      placeholder="Service or product description..."
                      className="w-full h-7 rounded border border-border bg-white px-2 text-xs font-semibold text-txt-primary"
                    />

                    <input
                      type="text"
                      value={item.subdesc || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, subdesc: val } : it)));
                      }}
                      placeholder="Detailed line scope/deliverables (optional)..."
                      className="w-full h-7 rounded border border-border bg-white px-2 text-[11px] text-txt-muted"
                    />

                    {/* Standard Numeric Fields: Qty, Full Amount, Advanced Amount */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                      {enableQtyColumn && (
                        <div className="flex-1 min-w-[70px]">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-txt-muted block">Qty</label>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hide Qty column from invoice?')) {
                                  handleToggleQtyColumn(false);
                                }
                              }}
                              className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hide / Remove Qty column"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 1 : parseFloat(e.target.value) || 1;
                              setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, quantity: val } : it)));
                            }}
                            className="w-full h-7 rounded border border-border bg-white px-2 text-xs text-txt-primary text-center font-tabular"
                          />
                        </div>
                      )}

                      {enablePriceColumn && (
                        <div className="flex-[2] min-w-[110px]">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-txt-muted block truncate">
                              Full Amount ({meta.currency})
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hide Full Amount column from invoice?')) {
                                  handleTogglePriceColumn(false);
                                }
                              }}
                              className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Hide / Remove Full Amount column"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={item.price === 0 ? '' : item.price}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                              setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, price: val } : it)));
                            }}
                            placeholder="0"
                            className="w-full h-7 rounded border border-border bg-white px-2 text-xs text-txt-primary font-tabular"
                          />
                        </div>
                      )}

                      {enableAdvanceColumn && (
                        <div className="flex-[2] min-w-[120px]">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] text-txt-muted block truncate">
                              Advanced Amount ({meta.currency})
                            </label>
                            <div className="flex items-center gap-1">
                              {typeof item.advanceAmount === 'number' && item.advanceAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setItems((prev) =>
                                      prev.map((it) => (it.id === item.id ? { ...it, advanceAmount: undefined } : it))
                                    );
                                    showToast(`Cleared advance amount for Item #${idx + 1}`);
                                  }}
                                  className="text-[9px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5 cursor-pointer"
                                  title="Clear advance amount for this item"
                                >
                                  <X className="h-2.5 w-2.5" /> Clear
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Hide Advanced Amount column from invoice?')) {
                                    handleToggleAdvanceColumn(false);
                                  }
                                }}
                                className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hide / Remove Advanced Amount column"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              value={item.advanceAmount === 0 || item.advanceAmount === undefined ? '' : item.advanceAmount}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, advanceAmount: val } : it)));
                              }}
                              placeholder="0"
                              className="w-full h-7 rounded border border-emerald-300 bg-emerald-50/40 px-2 pr-6 text-xs font-semibold text-emerald-800 font-tabular"
                            />
                            {typeof item.advanceAmount === 'number' && item.advanceAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setItems((prev) =>
                                    prev.map((it) => (it.id === item.id ? { ...it, advanceAmount: undefined } : it))
                                  );
                                }}
                                className="absolute right-1 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                                title="Delete advance amount"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom Column Inputs for this Item */}
                    {customColumns.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customColumns.map((col) => {
                          const val = item.customValues?.[col.key] ?? col.defaultValue ?? '';
                          return (
                            <div key={col.key}>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[10px] text-txt-muted block truncate font-medium">
                                  {col.label} {col.type === 'currency' ? `(${meta.currency})` : ''}
                                  {col.required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomColumn(col)}
                                  className="text-[9px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={`Remove / Delete column "${col.label}"`}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                              <input
                                type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                                value={val}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  setItems((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id
                                        ? {
                                            ...it,
                                            customValues: {
                                              ...(it.customValues || {}),
                                              [col.key]: rawVal,
                                            },
                                          }
                                        : it
                                    )
                                  );
                                }}
                                placeholder={col.defaultValue !== undefined ? String(col.defaultValue) : `Enter ${col.label.toLowerCase()}...`}
                                className="w-full h-7 rounded border border-border bg-white px-2 text-xs text-txt-primary"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex-1 w-full h-8 rounded-btn border border-dashed border-[#57B71B] text-[#57B71B] hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Item / Service
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddColumnModal()}
                  className="w-full sm:w-auto h-8 px-3 rounded-btn border border-dashed border-slate-300 hover:border-[#57B71B] text-slate-600 hover:text-[#57B71B] hover:bg-emerald-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Add more headings / custom columns to invoice items"
                >
                  <Plus className="h-3.5 w-3.5" /> + Add Heading / Column
                </button>
              </div>
            </div>
          </details>

          {/* Card 5: Payment Options (Bank, UPI & Crypto) */}
          <details open className="group rounded-card border border-border bg-white shadow-xs overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-border font-bold text-xs text-txt-primary cursor-pointer hover:bg-slate-100 transition-colors list-none">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-500" />
                <span>Payment Methods (Bank, UPI & Crypto)</span>
              </div>
              <span className="text-[10px] text-txt-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 space-y-3 text-xs">
              {/* Payment Tab Selector */}
              <div className="flex rounded-btn bg-slate-100 p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setPayment((p) => ({ ...p, activeTab: 'bank' }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded text-center transition-all cursor-pointer ${
                    payment.activeTab === 'bank' ? 'bg-white text-txt-primary shadow-xs' : 'text-txt-muted'
                  }`}
                >
                  Bank Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPayment((p) => ({ ...p, activeTab: 'upi' }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded text-center transition-all cursor-pointer ${
                    payment.activeTab === 'upi' ? 'bg-white text-txt-primary shadow-xs' : 'text-txt-muted'
                  }`}
                >
                  UPI Pay / QR
                </button>
                <button
                  type="button"
                  onClick={() => setPayment((p) => ({ ...p, activeTab: 'crypto' }))}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded text-center transition-all cursor-pointer ${
                    payment.activeTab === 'crypto' ? 'bg-white text-txt-primary shadow-xs' : 'text-txt-muted'
                  }`}
                >
                  Crypto Wallet
                </button>
              </div>

              {/* Tab Content: Bank Transfer */}
              {payment.activeTab === 'bank' && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-txt-primary">
                    <input
                      type="checkbox"
                      checked={payment.enableBank}
                      onChange={(e) => setPayment((p) => ({ ...p, enableBank: e.target.checked }))}
                      className="rounded accent-[#57B71B]"
                    />
                    <span>Enable Bank Transfer Option on Invoice</span>
                  </label>

                  <div>
                    <label className="text-[11px] font-semibold text-[#57B71B] block mb-1">
                      Bank Account / Payment Destination:
                    </label>

                    {/* Custom Searchable & Addable Bank Dropdown */}
                    <div ref={bankDropdownRef} className="relative w-full">
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isBankDropdownOpen;
                          setIsBankDropdownOpen(next);
                          setBankSearchFilter('');
                          setIsAddingNewBank(false);
                          if (next) {
                            setTimeout(() => {
                              bankSearchInputRef.current?.focus();
                            }, 50);
                          }
                        }}
                        className="w-full h-9 rounded-input border border-border bg-white px-2.5 text-xs text-left flex items-center justify-between gap-2 shadow-subtle hover:border-[#57B71B] focus:outline-none focus:ring-1 focus:ring-[#57B71B] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Landmark className="h-4 w-4 text-[#57B71B] shrink-0" />
                          <span className="text-txt-primary font-bold truncate">
                            {payment.bank.bankName?.trim() ? payment.bank.bankName.trim() : 'Select or Add Bank Account'}
                          </span>
                          {payment.bank.accountNumber && (
                            <span className="text-[10px] text-txt-muted font-mono shrink-0">
                              (•••{payment.bank.accountNumber.slice(-4)})
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-txt-muted shrink-0 transition-transform duration-200 ${
                            isBankDropdownOpen ? 'rotate-180 text-[#57B71B]' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isBankDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-border rounded-card shadow-xl py-1 text-xs max-h-80 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
                          {/* Search Header */}
                          <div className="p-1.5 border-b border-border/60 bg-slate-50/50">
                            <div className="relative flex items-center">
                              <Search className="absolute left-2.5 h-3.5 w-3.5 text-txt-muted pointer-events-none" />
                              <input
                                ref={bankSearchInputRef}
                                type="text"
                                value={bankSearchFilter}
                                onChange={(e) => setBankSearchFilter(e.target.value)}
                                placeholder="Search bank accounts or type to filter..."
                                className="w-full h-7 rounded-input border border-border bg-white pl-8 pr-2 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                              />
                            </div>
                          </div>

                          {/* Bank Accounts List */}
                          <div className="overflow-y-auto flex-1 py-1 max-h-48 divide-y divide-slate-100/60">
                            <div className="px-2.5 py-1 text-[10px] font-semibold text-txt-muted uppercase tracking-wider flex items-center justify-between">
                              <span>Saved Bank Accounts ({savedBanks.length})</span>
                              <span className="text-[9px] font-normal lowercase">click to select</span>
                            </div>

                            {savedBanks
                              .filter((b) => {
                                if (!b.bankName || b.bankName.trim() === '' || b.bankName.trim().toLowerCase() === 'unnamed bank account') {
                                  return false;
                                }
                                const q = bankSearchFilter.trim().toLowerCase();
                                if (!q) return true;
                                return (
                                  (b.bankName || '').toLowerCase().includes(q) ||
                                  (b.accountNumber || '').toLowerCase().includes(q) ||
                                  (b.accountName || '').toLowerCase().includes(q)
                                );
                              })
                              .map((b) => {
                                const isSelected = payment.bankPreset === b.id;
                                const isEditingThis = editingBankId === b.id;

                                if (isEditingThis) {
                                  return (
                                    <div key={b.id} className="p-1.5 bg-emerald-50/50 flex items-center gap-1.5">
                                      <input
                                        ref={editBankInputRef}
                                        type="text"
                                        value={editingBankName}
                                        onChange={(e) => setEditingBankName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveBankRename(b.id);
                                          }
                                          if (e.key === 'Escape') {
                                            setEditingBankId(null);
                                          }
                                        }}
                                        className="flex-1 h-7 rounded border border-[#57B71B] bg-white px-2 text-xs font-bold text-txt-primary focus:outline-none"
                                        placeholder="Enter bank name..."
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveBankRename(b.id)}
                                        className="h-7 px-2 rounded bg-[#57B71B] hover:bg-[#469815] text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingBankId(null)}
                                        className="h-7 px-2 text-[11px] text-txt-muted hover:text-txt-primary cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={b.id}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 hover:bg-slate-50 transition-colors group ${
                                      isSelected ? 'bg-emerald-50/60 font-bold' : ''
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPayment((p) => ({
                                          ...p,
                                          bankPreset: b.id,
                                          bank: b,
                                        }));
                                        setIsBankDropdownOpen(false);
                                        setBankSearchFilter('');
                                        setIsAddingNewBank(false);
                                      }}
                                      className="flex-1 flex items-center gap-2 text-left truncate cursor-pointer mr-2"
                                    >
                                      <Landmark className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[#57B71B]' : 'text-slate-400'}`} />
                                      <span className={`truncate text-xs ${isSelected ? 'text-[#57B71B]' : 'text-txt-primary'}`}>
                                        {b.bankName.trim()}
                                      </span>
                                      {b.accountNumber && (
                                        <span className="text-[10px] text-txt-muted font-mono shrink-0">
                                          (•••{b.accountNumber.slice(-4)})
                                        </span>
                                      )}
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                        Custom
                                      </span>
                                    </button>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {isSelected && <Check className="h-4 w-4 text-[#57B71B] shrink-0 mr-1" />}
                                      {/* Edit Bank Name Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingBankId(b.id);
                                          setEditingBankName(b.bankName);
                                          setTimeout(() => editBankInputRef.current?.focus(), 50);
                                        }}
                                        className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                        title="Edit / Rename bank name"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      {/* Delete Bank Option */}
                                      {savedBanks.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSavedBank(b.id);
                                          }}
                                          className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                                          title="Remove this bank account"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Other / Add New Bank Account Section */}
                          <div className="border-t border-border/70 p-1.5 bg-slate-50/80">
                            {isAddingNewBank ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    ref={newBankInputRef}
                                    type="text"
                                    value={newBankInput}
                                    onChange={(e) => setNewBankInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNewBankConfirm();
                                      }
                                      if (e.key === 'Escape') {
                                        setIsAddingNewBank(false);
                                      }
                                    }}
                                    placeholder="Enter new bank account name..."
                                    className="flex-1 h-7 rounded-input border border-border bg-white px-2 text-xs text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddNewBankConfirm}
                                    disabled={!newBankInput.trim()}
                                    className="h-7 px-2.5 rounded-btn bg-[#57B71B] hover:bg-[#469815] text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingNewBank(false);
                                      setNewBankInput('');
                                    }}
                                    className="h-7 px-2 text-xs text-txt-muted hover:text-txt-primary cursor-pointer shrink-0"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                <span className="text-[10px] text-txt-muted block px-0.5">
                                  Press Enter to save and select immediately for invoice bank transfer.
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingNewBank(true);
                                  if (bankSearchFilter.trim()) {
                                    setNewBankInput(bankSearchFilter.trim());
                                  }
                                  setTimeout(() => {
                                    newBankInputRef.current?.focus();
                                  }, 50);
                                }}
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-100 text-txt-secondary hover:text-txt-primary transition-colors cursor-pointer text-xs"
                              >
                                <div className="flex items-center gap-1.5 font-bold text-[#2563EB]">
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Other / Add New Bank Account</span>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-txt-muted font-medium">
                                  Custom
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">
                        Rename / Bank Account Name <span className="text-[#57B71B] font-bold">(Updates in Dropdown)</span>
                      </label>
                      <input
                        type="text"
                        value={payment.bank.bankName}
                        onChange={(e) => handleUpdateCurrentBank({ bankName: e.target.value })}
                        placeholder="Type Bank Name to rename (e.g. State Bank of India, Axis Bank)..."
                        className="w-full h-8 rounded-input border border-[#57B71B]/50 focus:border-[#57B71B] bg-white px-2 text-xs font-bold text-txt-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">Account Holder Name</label>
                      <input
                        type="text"
                        value={payment.bank.accountName}
                        onChange={(e) => handleUpdateCurrentBank({ accountName: e.target.value })}
                        placeholder="e.g. Digitechzo Media & Technologies Pvt Ltd"
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">Account Number</label>
                      <input
                        type="text"
                        value={payment.bank.accountNumber}
                        onChange={(e) => handleUpdateCurrentBank({ accountNumber: e.target.value })}
                        placeholder="e.g. 50200098765432"
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">IFSC / SWIFT / IBAN</label>
                      <input
                        type="text"
                        value={payment.bank.ifscSwift}
                        onChange={(e) => handleUpdateCurrentBank({ ifscSwift: e.target.value })}
                        placeholder="e.g. SBIN0001234 / SWIFT code"
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-txt-muted block mb-0.5">Branch & City</label>
                    <input
                      type="text"
                      value={payment.bank.branch}
                      onChange={(e) => handleUpdateCurrentBank({ branch: e.target.value })}
                      placeholder="e.g. Anna Salai Branch, Chennai"
                      className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                    />
                  </div>

                  {/* Add Bank Account and Delete Actions */}
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddBankAccount}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#57B71B] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Another Bank Account
                    </button>
                    {savedBanks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSavedBank(payment.bankPreset)}
                        className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-semibold"
                        title="Delete this bank account from list"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete this Bank
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: UPI */}
              {payment.activeTab === 'upi' && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-txt-primary">
                    <input
                      type="checkbox"
                      checked={payment.enableUpi}
                      onChange={(e) => setPayment((p) => ({ ...p, enableUpi: e.target.checked }))}
                      className="rounded accent-[#57B71B]"
                    />
                    <span>Enable UPI QR & ID Option on Invoice</span>
                  </label>

                  <div>
                    <label className="text-[11px] font-semibold text-[#57B71B] block mb-1">
                      Quick Select UPI Preset:
                    </label>
                    <select
                      value={payment.upiPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'official') {
                          setPayment((p) => ({ ...p, upiPreset: 'official', upi: UPI_PRESETS.official }));
                        } else if (val === 'gpay') {
                          setPayment((p) => ({ ...p, upiPreset: 'gpay', upi: UPI_PRESETS.gpay }));
                        } else {
                          setPayment((p) => ({ ...p, upiPreset: 'custom' }));
                        }
                      }}
                      className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary cursor-pointer"
                    >
                      <option value="official">Digitechzo Official UPI (digitechzo@okicici)</option>
                      <option value="gpay">GPay Merchant (9876543210@okbizaxis)</option>
                      <option value="custom">✍️ Custom UPI Details...</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">UPI ID / VPA</label>
                      <input
                        type="text"
                        value={payment.upi.upiId}
                        onChange={(e) =>
                          setPayment((p) => ({ ...p, upi: { ...p.upi, upiId: e.target.value } }))
                        }
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">Payee Name</label>
                      <input
                        type="text"
                        value={payment.upi.payeeName}
                        onChange={(e) =>
                          setPayment((p) => ({ ...p, upi: { ...p.upi, payeeName: e.target.value } }))
                        }
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* QR Image Option: Upload or Auto-generated */}
                  <div className="border border-slate-200 rounded-btn p-2.5 bg-slate-50 space-y-2">
                    <span className="text-[11px] font-bold text-txt-primary block">UPI QR Code Source:</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-txt-secondary flex-1 cursor-pointer">
                        <span className="inline-block px-2.5 py-1 rounded border border-border bg-white hover:bg-slate-50 text-[11px] font-semibold">
                          Upload Custom QR Image
                        </span>
                        <input type="file" accept="image/*" onChange={handleUpiQrUpload} className="hidden" />
                      </label>
                      {payment.customUpiQr && (
                        <button
                          type="button"
                          onClick={() => setPayment((p) => ({ ...p, customUpiQr: '' }))}
                          className="text-xs text-rose-600 hover:underline cursor-pointer"
                        >
                          Use Auto-Generated
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-txt-muted">
                      {payment.customUpiQr
                        ? 'Using uploaded QR code image.'
                        : 'Auto-generating dynamic UPI QR code compatible with PhonePe, GPay, Paytm & BHIM!'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content: Crypto */}
              {payment.activeTab === 'crypto' && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-txt-primary">
                    <input
                      type="checkbox"
                      checked={payment.enableCrypto}
                      onChange={(e) => setPayment((p) => ({ ...p, enableCrypto: e.target.checked }))}
                      className="rounded accent-[#57B71B]"
                    />
                    <span>Enable Crypto Wallet Option on Invoice</span>
                  </label>

                  <div>
                    <label className="text-[11px] font-semibold text-[#57B71B] block mb-1">
                      Quick Select Crypto Preset:
                    </label>
                    <select
                      value={payment.cryptoPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'usdt_trc20') {
                          setPayment((p) => ({ ...p, cryptoPreset: 'usdt_trc20', crypto: CRYPTO_PRESETS.usdt_trc20 }));
                        } else if (val === 'usdt_erc20') {
                          setPayment((p) => ({ ...p, cryptoPreset: 'usdt_erc20', crypto: CRYPTO_PRESETS.usdt_erc20 }));
                        } else if (val === 'btc') {
                          setPayment((p) => ({ ...p, cryptoPreset: 'btc', crypto: CRYPTO_PRESETS.btc }));
                        } else {
                          setPayment((p) => ({ ...p, cryptoPreset: 'custom' }));
                        }
                      }}
                      className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs text-txt-primary cursor-pointer"
                    >
                      <option value="usdt_trc20">USDT (TRC20 - Tron)</option>
                      <option value="usdt_erc20">USDT (ERC20 - Ethereum)</option>
                      <option value="btc">Bitcoin (BTC Mainnet)</option>
                      <option value="custom">✍️ Custom Wallet Address...</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">Token / Coin</label>
                      <input
                        type="text"
                        value={payment.crypto.coin}
                        onChange={(e) =>
                          setPayment((p) => ({ ...p, crypto: { ...p.crypto, coin: e.target.value } }))
                        }
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-txt-muted block mb-0.5">Blockchain Network</label>
                      <input
                        type="text"
                        value={payment.crypto.network}
                        onChange={(e) =>
                          setPayment((p) => ({ ...p, crypto: { ...p.crypto, network: e.target.value } }))
                        }
                        className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-txt-muted block mb-0.5">Wallet Address</label>
                    <input
                      type="text"
                      value={payment.crypto.address}
                      onChange={(e) =>
                        setPayment((p) => ({ ...p, crypto: { ...p.crypto, address: e.target.value } }))
                      }
                      className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* Card 6: Tax, Discount, Notes & Signatures */}
          <details open className="group rounded-card border border-border bg-white shadow-xs overflow-hidden">
            <summary className="flex items-center justify-between p-3.5 bg-slate-50 border-b border-border font-bold text-xs text-txt-primary cursor-pointer hover:bg-slate-100 transition-colors list-none">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-rose-500" />
                <span>Tax, Discount & Signatures</span>
              </div>
              <span className="text-[10px] text-txt-muted group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-3.5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">
                    GST / Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={taxRate === 0 ? '' : taxRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setTaxRate(isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-tabular"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Discount Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountRate === 0 ? '' : discountRate}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setDiscountRate(isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-tabular"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Advance Req. (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancePercent === 0 ? '' : advancePercent}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      setAdvancePercent(isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-tabular"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-semibold text-txt-secondary block">
                    Terms & Instructions Heading
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      'TERMS & INSTRUCTIONS:',
                      'TERMS & CONDITIONS:',
                      'PAYMENT TERMS & NOTES:',
                      'SPECIAL INSTRUCTIONS:',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNotesHeading(preset)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          notesHeading === preset
                            ? 'bg-[#57B71B] text-white border-[#57B71B] font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.replace(':', '')}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={notesHeading}
                  onChange={(e) => setNotesHeading(e.target.value)}
                  placeholder="e.g. TERMS & INSTRUCTIONS:"
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs font-bold text-txt-primary"
                />

                <div className="pt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-semibold text-txt-secondary">
                      Terms, Notes & Special Instructions Body Text
                    </label>
                    <span className="text-[10px] text-txt-muted">Editable multiline text</span>
                  </div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter payment instructions, terms and conditions, warranty info..."
                    className="w-full rounded-input border border-border bg-white p-2.5 text-xs text-txt-primary leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">
                    Authorized Signatory Name
                  </label>
                  <input
                    type="text"
                    value={signature.name}
                    onChange={(e) => setSignature({ ...signature, name: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-0.5">Designation / Role</label>
                  <input
                    type="text"
                    value={signature.role}
                    onChange={(e) => setSignature({ ...signature, role: e.target.value })}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Live Client Invoice Paper Preview           */}
        {/* ========================================================= */}
        <div
          ref={invoiceContainerRef}
          className={`space-y-3 pb-8 ${
            studioViewMode === 'editor'
              ? 'hidden'
              : studioViewMode === 'split'
              ? 'lg:col-span-7'
              : 'w-full max-w-4xl mx-auto'
          }`}
        >
          {/* Synchronized Live Status Bar */}
          <div className="no-print flex items-center justify-between px-3.5 py-2 bg-slate-100/95 border border-slate-200/90 rounded-xl text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#57B71B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#57B71B]"></span>
                </span>
                <span>Live Synchronized Client Document</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {studioViewMode === 'preview' && (
                <button
                  type="button"
                  onClick={() => setStudioViewMode('editor')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-btn text-[11px] font-bold bg-[#57B71B] hover:bg-[#469815] text-white transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit2 className="h-3 w-3" /> Back to Editor
                </button>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 px-2.5 py-1 rounded-btn text-[11px] font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                <Printer className="h-3 w-3 text-slate-600" /> Print / PDF
              </button>
            </div>
          </div>

          {/* THE REAL INVOICE PAPER (Target for Print & PDF) */}
          <div className="overflow-x-auto pb-4">
            <div
              id="invoiceDocument"
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 min-w-[650px] relative font-sans text-slate-800 overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#57B71B]" />
              {/* Draft Watermark Badge */}
              {meta.status === 'DRAFT' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-10">
                  <span className="text-8xl font-black text-rose-500/10 -rotate-30 tracking-widest uppercase">
                    DRAFT
                  </span>
                </div>
              )}

              {/* 1. Header: Brand Info & Invoice Title */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-100 relative">
                <div className="flex items-start gap-4">
                  {sender.logo ? (
                    <img
                      src={sender.logo}
                      alt={sender.name}
                      style={{ height: `${sender.logoHeight || 52}px` }}
                      className="max-w-[220px] object-contain transition-all rounded-md"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#57B71B] to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-sm">
                      {(sender.name || 'D').charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      {sender.name || 'Digitechzo Technologies'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">{sender.address}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {sender.email} <span className="text-slate-300">•</span> {sender.phone}
                    </p>
                    {sender.taxId && (
                      <p className="text-[11px] font-bold text-slate-700 mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200/70">
                        <span className="text-slate-400 uppercase font-semibold text-[9px]">TAX ID:</span> {sender.taxId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#57B71B] block sm:text-right">
                      OFFICIAL STATEMENT
                    </span>
                    <h1
                      className="text-3xl font-black tracking-tight uppercase"
                      style={{ color: activeTheme?.primary || '#57B71B' }}
                    >
                      TAX INVOICE
                    </h1>
                  </div>
                  <div className="mt-2 flex items-center sm:justify-end">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-2xs ${
                        meta.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : meta.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : meta.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : meta.status === 'CANCELLED'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          meta.status === 'PAID'
                            ? 'bg-emerald-500'
                            : meta.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-500'
                            : meta.status === 'DRAFT'
                            ? 'bg-slate-400'
                            : meta.status === 'CANCELLED'
                            ? 'bg-purple-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      {meta.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Metadata Grid: Bill To (Left) & Invoice Meta Card (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-6 border-b border-slate-100 items-stretch">
                {/* Client Profile Card */}
                <div className="md:col-span-7 bg-slate-50/70 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Billed Client / Recipient
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      {client.name || 'Client Company Name'}
                    </h3>
                    {client.contact && (
                      <p className="text-xs text-slate-700 mt-0.5 font-semibold">Attn: {client.contact}</p>
                    )}
                    {client.address && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{client.address}</p>
                    )}
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                    {client.email && (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Email:</span> {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">Phone:</span> {client.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Invoice Details Badge Card */}
                <div className="md:col-span-5 bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-2 text-xs flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold text-[11px]">Invoice Number:</span>
                      <span className="font-black text-slate-900 font-tabular text-xs tracking-tight">{meta.number}</span>
                    </div>
                    {meta.poNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium text-[11px]">P.O. / Ref #:</span>
                        <span className="font-semibold text-slate-800">{meta.poNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">Invoice Date:</span>
                      <span className="font-semibold text-slate-800 font-tabular">{formatDate(meta.date)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Payment Terms:</span>
                      <span className="font-semibold text-slate-700">
                        {meta.paymentTermsDays === '0'
                          ? 'Due on Receipt'
                          : meta.paymentTermsDays === 'custom'
                          ? 'Custom Terms'
                          : `Net ${meta.paymentTermsDays} Days`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-100 bg-rose-50/50 -mx-4 -mb-4 p-3 rounded-b-xl flex items-center justify-between">
                    <span className="text-rose-900 font-extrabold text-[11px] uppercase tracking-wider">
                      Payment Due:
                    </span>
                    <span className="font-black text-rose-600 font-tabular text-sm">{formatDate(meta.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Items Table */}
              <div className="py-4">
                <table className="w-full text-left border-collapse text-xs table-auto">
                  <thead>
                    <tr
                      className="border-b border-slate-200 text-white font-bold"
                      style={{ backgroundColor: activeTheme?.primary || '#57B71B' }}
                    >
                      <th className="py-3 px-3.5 rounded-l w-12 text-center whitespace-nowrap">#</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Description & Service Details</th>
                      {enableQtyColumn && (
                        <th className="py-3 px-3 text-center whitespace-nowrap w-16">Qty</th>
                      )}
                      {/* Custom Columns (if enabled in preview) */}
                      {customColumns
                        .filter((c) => c.showInPreview)
                        .map((col) => (
                          <th
                            key={col.id}
                            className={`py-3 px-3.5 whitespace-nowrap ${
                              col.type === 'number' || col.type === 'currency' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {col.label} {col.type === 'currency' ? `(${meta.currency})` : ''}
                          </th>
                        ))}
                      {enablePriceColumn && (
                        <th
                          className={`py-3 px-3.5 text-right whitespace-nowrap min-w-[120px] ${
                            !enableAdvanceColumn ? 'rounded-r' : ''
                          }`}
                        >
                          Full Amount
                        </th>
                      )}
                      {enableAdvanceColumn && (
                        <th className="py-3 px-3.5 rounded-r text-right whitespace-nowrap min-w-[145px]">
                          Advanced Amount
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => {
                      const lineAmount = (item.quantity || 0) * (item.price || 0);
                      const itemAdvance = typeof item.advanceAmount === 'number'
                        ? item.advanceAmount
                        : (advancePercent > 0 ? Math.round((lineAmount * advancePercent) / 100) : 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 group">
                          <td className="py-3 px-3.5 text-center text-slate-400 font-mono align-top">{idx + 1}</td>
                          <td className="py-3 px-3.5 align-top">
                            <div className="font-bold text-slate-900 leading-snug break-words">{item.description}</div>
                            {item.subdesc && (
                              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed break-words">{item.subdesc}</div>
                            )}
                          </td>
                          {enableQtyColumn && (
                            <td className="py-3 px-3 text-center font-tabular font-medium text-slate-700 align-top whitespace-nowrap">
                              {item.quantity}
                            </td>
                          )}

                          {/* Custom Columns Data Cells */}
                          {customColumns
                            .filter((c) => c.showInPreview)
                            .map((col) => {
                              const rawVal = item.customValues?.[col.key] ?? col.defaultValue ?? '';
                              const isNum = col.type === 'number';
                              const isCurr = col.type === 'currency';
                              let displayVal = rawVal;
                              if (isCurr && rawVal !== '' && !isNaN(Number(rawVal))) {
                                displayVal = formatCurrency(Number(rawVal), meta.currency);
                              }
                              return (
                                <td
                                  key={col.id}
                                  className={`py-3 px-3.5 align-top whitespace-nowrap font-medium ${
                                    isNum || isCurr ? 'text-right font-tabular text-slate-800' : 'text-left text-slate-600'
                                  }`}
                                >
                                  {displayVal || '—'}
                                </td>
                              );
                            })}

                          {enablePriceColumn && (
                            <td className="py-3 px-3.5 text-right font-tabular font-bold text-slate-900 align-top whitespace-nowrap">
                              {formatCurrency(lineAmount, meta.currency)}
                            </td>
                          )}
                          {enableAdvanceColumn && (
                            <td className="py-3 px-3.5 text-right font-tabular font-extrabold text-emerald-600 align-top whitespace-nowrap">
                              {formatCurrency(itemAdvance, meta.currency)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Quick Add Row shortcut directly below table (hidden on print) */}
                <div className="no-print mt-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-dashed border-[#57B71B] bg-emerald-50/60 hover:bg-emerald-100/80 text-[#57B71B] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> + Add Another Item / Service Row
                  </button>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {items.length} {items.length === 1 ? 'service item' : 'service items'}
                  </span>
                </div>
              </div>

              {/* 4. Payment Details (Left) & Totals Breakdown (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
                {/* Left (7 Cols): Payment Details with Interactive Switcher */}
                <div className="md:col-span-7 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Payment Details (Click to select method):
                    </span>
                  </div>

                  {/* Payment selector tabs on paper */}
                  <div className="flex rounded-btn bg-slate-100 p-0.5 border border-slate-200 text-xs">
                    {payment.enableBank && (
                      <button
                        type="button"
                        onClick={() => setPayment((p) => ({ ...p, activeTab: 'bank' }))}
                        className={`flex-1 py-1 rounded text-center font-bold text-[11px] cursor-pointer ${
                          payment.activeTab === 'bank' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Bank Transfer
                      </button>
                    )}
                    {payment.enableUpi && (
                      <button
                        type="button"
                        onClick={() => setPayment((p) => ({ ...p, activeTab: 'upi' }))}
                        className={`flex-1 py-1 rounded text-center font-bold text-[11px] cursor-pointer ${
                          payment.activeTab === 'upi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        UPI Pay / QR
                      </button>
                    )}
                    {payment.enableCrypto && (
                      <button
                        type="button"
                        onClick={() => setPayment((p) => ({ ...p, activeTab: 'crypto' }))}
                        className={`flex-1 py-1 rounded text-center font-bold text-[11px] cursor-pointer ${
                          payment.activeTab === 'crypto' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Crypto Wallet
                      </button>
                    )}
                  </div>

                  {/* Payment Card: Bank */}
                  {payment.activeTab === 'bank' && payment.enableBank && (
                    <div className="p-3.5 rounded-btn bg-slate-50 border border-slate-200 text-xs space-y-1 leading-relaxed">
                      <div>
                        <span className="text-slate-500">Bank Name:</span>{' '}
                        <strong className="text-slate-900">{payment.bank.bankName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Account Name:</span>{' '}
                        <strong className="text-slate-900">{payment.bank.accountName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Account #:</span>{' '}
                        <strong className="text-slate-900 font-mono">{payment.bank.accountNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">IFSC / SWIFT:</span>{' '}
                        <strong className="text-slate-900 font-mono">{payment.bank.ifscSwift}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Branch:</span>{' '}
                        <span className="text-slate-700">{payment.bank.branch}</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Card: UPI with live QR Code & Copy */}
                  {payment.activeTab === 'upi' && payment.enableUpi && (
                    <div className="p-3 rounded-btn bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                      {upiQrUrl && (
                        <div className="p-1 bg-white border border-slate-200 rounded-btn shrink-0 text-center">
                          <img src={upiQrUrl} alt="UPI QR Code" className="h-24 w-24 object-contain mx-auto" />
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Scan to Pay</span>
                        </div>
                      )}
                      <div className="space-y-1 text-xs min-w-0">
                        <div>
                          <span className="text-slate-500 text-[11px] block">UPI ID / VPA:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <code className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px]">
                              {payment.upi.upiId}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopy(payment.upi.upiId, 'upi')}
                              className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {copiedKey === 'upi' ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Payee:</span>{' '}
                          <strong className="text-slate-800">{payment.upi.payeeName}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Works with GPay, PhonePe, Paytm, BHIM & all UPI apps
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Card: Crypto with QR Code & Copy */}
                  {payment.activeTab === 'crypto' && payment.enableCrypto && (
                    <div className="p-3 rounded-btn bg-slate-50 border border-slate-200 flex items-center gap-3.5">
                      {cryptoQrUrl && (
                        <div className="p-1 bg-white border border-slate-200 rounded-btn shrink-0 text-center">
                          <img src={cryptoQrUrl} alt="Crypto QR" className="h-24 w-24 object-contain mx-auto" />
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Scan Address</span>
                        </div>
                      )}
                      <div className="space-y-1 text-xs min-w-0 flex-1">
                        <div>
                          <span className="text-slate-500">Coin / Network:</span>{' '}
                          <strong className="text-slate-900">
                            {payment.crypto.coin} ({payment.crypto.network})
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Wallet Address:</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <code className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] truncate max-w-[200px]">
                              {payment.crypto.address}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopy(payment.crypto.address, 'crypto')}
                              className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer shrink-0"
                              title="Copy Address"
                            >
                              {copiedKey === 'crypto' ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3 text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right (5 Cols): Totals Breakdown */}
                <div className="md:col-span-5 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-tabular font-medium">{formatCurrency(subtotal, meta.currency)}</span>
                  </div>

                  {discountRate > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount ({discountRate}%)</span>
                      <span className="font-tabular">-{formatCurrency(discountAmount, meta.currency)}</span>
                    </div>
                  )}

                  {taxRate > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST / Tax ({taxRate}%)</span>
                      <span className="font-tabular font-medium">+{formatCurrency(taxAmount, meta.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-bold text-slate-900">
                    <span>Invoice Total</span>
                    <span className="font-tabular text-base font-black" style={{ color: activeTheme?.primary || '#57B71B' }}>
                      {formatCurrency(grandTotal, meta.currency)}
                    </span>
                  </div>

                  {totalAdvance > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold pt-1.5">
                      <span>Total Advanced Amount</span>
                      <span className="font-tabular font-extrabold text-emerald-600">
                        {formatCurrency(totalAdvance, meta.currency)}
                      </span>
                    </div>
                  )}

                  {totalAdvance > 0 && (
                    <div className="flex justify-between pt-1.5 border-t-2 border-dashed border-slate-300 text-sm font-black text-rose-600">
                      <span>Balance Due</span>
                      <span className="font-tabular font-extrabold">{formatCurrency(balanceDue, meta.currency)}</span>
                    </div>
                  )}

                  {totalAdvance === 0 && (meta.status === 'PARTIALLY_PAID' || (meta.amountPaid || 0) > 0) && (
                    <>
                      <div className="flex justify-between text-emerald-600 font-bold pt-1">
                        <span>Amount Paid</span>
                        <span className="font-tabular">-{formatCurrency(meta.amountPaid || 0, meta.currency)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t-2 border-dashed border-slate-300 text-sm font-black text-rose-600">
                        <span>Balance Due</span>
                        <span className="font-tabular">{formatCurrency(balanceDue, meta.currency)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 5. Notes & Authorized Signature Block */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-6 mt-6 border-t border-slate-100 items-start">
                <div className="md:col-span-7 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5">
                    <input
                      type="text"
                      value={notesHeading}
                      onChange={(e) => setNotesHeading(e.target.value)}
                      placeholder="TERMS & INSTRUCTIONS:"
                      className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#57B71B] focus:bg-white outline-none transition-colors w-full cursor-text"
                      title="Click to edit Terms Heading"
                    />
                    <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      ✎ Editable
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter invoice terms, notes, and instructions..."
                    className="w-full text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-transparent border border-transparent hover:border-slate-200 focus:border-[#57B71B] focus:bg-white rounded p-1 outline-none transition-colors resize-y cursor-text"
                    title="Click to edit Terms & Instructions text directly"
                  />
                </div>

                <div className="md:col-span-5 bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col items-center sm:items-end justify-between text-right space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Authorization & Approval
                  </span>
                  <div className="w-44 border-b-2 border-dashed border-slate-300 pb-1 text-center sm:text-right">
                    <span className="text-xs font-serif italic text-slate-600">Digital Authorized Signatory</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 tracking-tight">{signature.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{signature.role}</p>
                    <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                      Verified Signatory
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Footer Text */}
              {footerText && (
                <div className="text-center pt-6 mt-6 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                  {footerText}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INVOICE HISTORY & DRAFTS MODAL                            */}
      {/* ========================================================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-card border border-border shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-bold text-txt-primary">Invoice History & Cloud Records</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {savedInvoices.length} invoices
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Prisma Studio Synced
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="h-7 w-7 rounded-btn hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by invoice #, client name, or date..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="flex-1 h-8 rounded-input border border-border px-3 text-xs text-txt-primary"
              />
              {savedInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all saved invoice history?')) {
                      setSavedInvoices([]);
                      localStorage.removeItem('digitechzo_saved_invoices');
                      showToast('History cleared');
                    }
                  }}
                  className="h-8 px-2.5 rounded-btn text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {isLoadingDbInvoices && (
                <div className="py-6 text-center text-xs text-txt-muted animate-pulse">
                  Loading invoices from database...
                </div>
              )}
              {!isLoadingDbInvoices && filteredInvoices.length === 0 ? (
                <div className="py-12 text-center text-txt-muted text-xs">
                  <FolderOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No saved invoices found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click "Save Invoice" on the studio header to save your first bill!
                  </p>
                </div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => handleLoadInvoice(inv)}
                    className="flex items-center justify-between p-3 rounded-btn border border-border bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-txt-primary font-tabular">{inv.number}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-txt-secondary mt-0.5">{inv.clientName}</p>
                      <span className="text-[10px] text-txt-muted">
                        Due: {formatDate(inv.dueDate)} • Saved: {inv.savedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-txt-primary font-tabular">
                        {formatCurrency(inv.total, inv.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteInvoice(inv.id, e)}
                        className="h-7 w-7 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-border bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="h-8 px-4 rounded-btn border border-border bg-white text-xs font-semibold text-txt-secondary hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Custom Column Config Modal                                */}
      {/* ========================================================= */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-card shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#57B71B]" />
                <h3 className="text-sm font-bold text-txt-primary">
                  {editingColId ? 'Edit Invoice Column' : 'Add Custom Invoice Column'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              {/* Column Heading */}
              <div>
                <label className="text-[11px] font-semibold text-txt-secondary block mb-1">
                  Column Heading <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="e.g. Milestone Amount, Service Fee, Installation Charge..."
                  className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs font-semibold text-txt-primary focus:outline-none focus:ring-1 focus:ring-[#57B71B]"
                  autoFocus
                />
                <span className="text-[10px] text-txt-muted block mt-0.5">
                  Appears as the column header in the items table and PDF.
                </span>
              </div>

              {/* Column Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-1">
                    Column Type
                  </label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as any)}
                    className="w-full h-8 rounded-input border border-border bg-white px-2 text-xs font-semibold text-txt-primary cursor-pointer"
                  >
                    <option value="text">Text (e.g. Phase / Note)</option>
                    <option value="number">Number (Numeric)</option>
                    <option value="currency">Currency ({meta.currency})</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-secondary block mb-1">
                    Default Value (Optional)
                  </label>
                  <input
                    type={newColType === 'number' || newColType === 'currency' ? 'number' : 'text'}
                    value={newColDefault}
                    onChange={(e) => setNewColDefault(e.target.value)}
                    placeholder="e.g. 0 or N/A..."
                    className="w-full h-8 rounded-input border border-border bg-white px-2.5 text-xs text-txt-primary"
                  />
                </div>
              </div>

              {/* Toggles: Show in preview & Required */}
              <div className="p-2.5 rounded-btn bg-slate-50 border border-slate-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-txt-primary">
                  <input
                    type="checkbox"
                    checked={newColShowInPreview}
                    onChange={(e) => setNewColShowInPreview(e.target.checked)}
                    className="rounded accent-[#57B71B]"
                  />
                  <span>Show column in live preview and PDF output</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-txt-primary">
                  <input
                    type="checkbox"
                    checked={newColRequired}
                    onChange={(e) => setNewColRequired(e.target.checked)}
                    className="rounded accent-[#57B71B]"
                  />
                  <span>Mark column as required when entering item data</span>
                </label>
              </div>
            </div>

            <div className="p-3 border-t border-border bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsColumnModalOpen(false)}
                className="h-8 px-3 rounded-btn border border-border bg-white text-xs font-medium text-txt-secondary hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomColumn}
                disabled={!newColLabel.trim()}
                className="h-8 px-4 rounded-btn bg-[#57B71B] hover:bg-[#469815] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                {editingColId ? 'Save Changes' : 'Add Column'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
