
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
} from 'recharts';
import { 
  Wallet, TrendingUp, PieChart as PieIcon, History, LayoutDashboard, BrainCircuit, Trash2, 
  AlertCircle, Save, ArrowDownCircle, ArrowUpCircle, Plus, Briefcase, User, Building, LineChart, Zap
} from 'lucide-react';
import { AppState, Transaction, BudgetCategory, Account, CategoryType, TransactionType, IncomeType } from './types';
import { INITIAL_CATEGORIES, INITIAL_ACCOUNTS, CURRENCY_FORMATTER } from './constants';
import { getFinancialAdvice } from './services/geminiService';

const COMMON_EXPENSES = [
  'Ăn uống', 'Tiền điện-nước', 'Wifi', 'Xăng xe', 'Học tập', 'Mua sắm', 'Giải trí', 'Sức khỏe'
];

const INCOME_CLASSIFICATIONS = [
  { id: IncomeType.EMPLOYEE, label: 'Làm thuê (E)', icon: <Briefcase className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
  { id: IncomeType.SELF_EMPLOYED, label: 'Tự doanh (S)', icon: <User className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
  { id: IncomeType.BUSINESS_OWNER, label: 'Làm chủ (B)', icon: <Building className="w-3 h-3" />, color: 'bg-amber-100 text-amber-700' },
  { id: IncomeType.INVESTOR, label: 'Đầu tư (I)', icon: <LineChart className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-700' },
  { id: IncomeType.PASSIVE, label: 'Thụ động (P)', icon: <Zap className="w-3 h-3" />, color: 'bg-rose-100 text-rose-700' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'budget' | 'accounts' | 'history'>('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('finsmart_state');
    return saved ? JSON.parse(saved) : {
      income: 10000000,
      categories: INITIAL_CATEGORIES,
      accounts: INITIAL_ACCOUNTS,
      transactions: []
    };
  });

  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('finsmart_state', JSON.stringify(state));
  }, [state]);

  const totalPercentage = useMemo(() => 
    state.categories.reduce((acc, c) => acc + c.percentage, 0)
  , [state.categories]);

  const budgetSummary = useMemo(() => {
    return state.categories.map(cat => {
      const allocated = (state.income * cat.percentage) / 100;
      const spent = state.transactions
        .filter(t => t.categoryId === cat.id && t.type === 'EXPENSE')
        .reduce((acc, t) => acc + t.amount, 0);
      return { ...cat, allocated, spent, remaining: allocated - spent };
    });
  }, [state.income, state.categories, state.transactions]);

  const stats = useMemo(() => {
    const totalIncome = state.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = state.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + t.amount, 0);
    return { totalIncome, totalExpense };
  }, [state.transactions]);

  const handleUpdateIncome = (val: string) => {
    setState(prev => ({ ...prev, income: Number(val) }));
  };

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Date.now().toString() };
    setState(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
      accounts: prev.accounts.map(acc => {
        if (acc.id === t.accountId) {
          return {
            ...acc,
            balance: t.type === 'INCOME' ? acc.balance + t.amount : acc.balance - t.amount
          };
        }
        return acc;
      })
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    const t = state.transactions.find(x => x.id === id);
    if (!t) return;
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(x => x.id !== id),
      accounts: prev.accounts.map(acc => {
        if (acc.id === t.accountId) {
          return {
            ...acc,
            balance: t.type === 'INCOME' ? acc.balance - t.amount : acc.balance + t.amount
          };
        }
        return acc;
      })
    }));
  };

  const fetchAiAdvice = async () => {
    setIsAiLoading(true);
    const advice = await getFinancialAdvice(state);
    setAiAdvice(advice || null);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-auto md:h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <Wallet className="w-8 h-8" />
            FinSmart
          </h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý tài chính cá nhân</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Tổng quan" />
          <NavItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<PieIcon />} label="Ngân sách (%)" />
          <NavItem active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<Wallet />} label="Tài khoản" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="Lịch sử giao dịch" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={fetchAiAdvice}
            disabled={isAiLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-semibold"
          >
            <BrainCircuit className={`w-5 h-5 ${isAiLoading ? 'animate-pulse' : ''}`} />
            {isAiLoading ? 'AI đang phân tích...' : 'Tư vấn AI'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">
              {activeTab === 'dashboard' && 'Bảng điều khiển'}
              {activeTab === 'budget' && 'Thiết lập Ngân sách'}
              {activeTab === 'accounts' && 'Quản lý Tài khoản'}
              {activeTab === 'history' && 'Lịch sử Giao dịch'}
            </h2>
            <p className="text-slate-500">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm flex items-center gap-4 group">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Cài đặt Thu nhập Tháng</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={state.income}
                  onChange={(e) => handleUpdateIncome(e.target.value)}
                  className="text-xl font-black text-blue-600 bg-transparent border-none focus:ring-0 p-0 text-right w-36"
                />
                <span className="text-blue-300 font-bold">VND</span>
              </div>
            </div>
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </header>

        {aiAdvice && (
          <div className="mb-8 p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <BrainCircuit className="w-6 h-6" />
              <h3 className="font-bold text-lg">Phân tích từ FinSmart AI</h3>
              <button onClick={() => setAiAdvice(null)} className="ml-auto text-white/60 hover:text-white">&times;</button>
            </div>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {aiAdvice}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Đã thu trong tháng</p>
                  <p className="text-xl font-black text-slate-800">{CURRENCY_FORMATTER.format(stats.totalIncome)}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Đã chi trong tháng</p>
                  <p className="text-xl font-black text-slate-800">{CURRENCY_FORMATTER.format(stats.totalExpense)}</p>
                </div>
              </div>
              <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100 flex items-center gap-4 text-white">
                <div className="p-4 bg-white/20 rounded-2xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/70 uppercase">Tổng số dư khả dụng</p>
                  <p className="text-xl font-black">{CURRENCY_FORMATTER.format(state.accounts.reduce((a, b) => a + b.balance, 0))}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Allocation Chart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-slate-700">Phân bổ Ngân sách (Mục tiêu)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgetSummary}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="allocated"
                      >
                        {budgetSummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => CURRENCY_FORMATTER.format(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {budgetSummary.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-slate-600 font-medium">{item.name}: {item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spending Progress */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-slate-700">Tình hình Chi tiêu</h3>
                <div className="space-y-6">
                  {budgetSummary.map(item => {
                    const percent = (item.spent / item.allocated) * 100;
                    return (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-slate-600">{item.name}</span>
                          <span className="text-slate-400">
                            {CURRENCY_FORMATTER.format(item.spent)} / {CURRENCY_FORMATTER.format(item.allocated)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(percent, 100)}%`, 
                              backgroundColor: percent > 100 ? '#ef4444' : item.color 
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions & Transaction Add */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TransactionForm accounts={state.accounts} categories={state.categories} onAdd={handleAddTransaction} />
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4 text-slate-700">Số dư Tài khoản</h3>
                <div className="space-y-4">
                  {state.accounts.map(acc => (
                    <div key={acc.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 hover:border-blue-200 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{acc.name}</p>
                        <p className="text-xs text-slate-400">{acc.type}</p>
                      </div>
                      <span className="font-bold text-blue-600">{CURRENCY_FORMATTER.format(acc.balance)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <BudgetSettings 
            categories={state.categories} 
            totalPercentage={totalPercentage}
            onUpdate={(cats) => setState(prev => ({ ...prev, categories: cats }))}
          />
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.accounts.map(acc => (
                <div key={acc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-110" />
                  <h4 className="font-bold text-slate-800 text-lg mb-1">{acc.name}</h4>
                  <p className="text-slate-400 text-xs mb-4 uppercase tracking-widest">{acc.type}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Số dư hiện tại</p>
                      <p className="text-2xl font-black text-blue-600">{CURRENCY_FORMATTER.format(acc.balance)}</p>
                    </div>
                    <button className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all group">
                <Plus className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold">Thêm tài khoản mới</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Lịch sử Giao dịch</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Ngày</th>
                    <th className="px-6 py-4">Mô tả</th>
                    <th className="px-6 py-4">Hạng mục / Loại</th>
                    <th className="px-6 py-4">Tài khoản</th>
                    <th className="px-6 py-4 text-right">Số tiền</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">Chưa có giao dịch nào được ghi lại.</td>
                    </tr>
                  ) : (
                    state.transactions.map(t => {
                      const cat = state.categories.find(c => c.id === t.categoryId);
                      const acc = state.accounts.find(a => a.id === t.accountId);
                      const isIncome = t.type === 'INCOME';
                      const iType = INCOME_CLASSIFICATIONS.find(ic => ic.id === t.incomeType);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 text-sm text-slate-500">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                          <td className="px-6 py-4 font-bold text-slate-700">{t.description}</td>
                          <td className="px-6 py-4">
                            {isIncome ? (
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">Thu nhập</span>
                                {iType && (
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${iType.color} flex items-center gap-1`}>
                                    {iType.icon} {iType.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span 
                                className="px-3 py-1 rounded-full text-[10px] font-black uppercase" 
                                style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                              >
                                {cat?.name}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-medium">{acc?.name}</td>
                          <td className={`px-6 py-4 text-right font-black ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {isIncome ? '+' : '-'}{CURRENCY_FORMATTER.format(t.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 md:hidden z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Home" />
        <MobileNavItem active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<PieIcon />} label="Ngân sách" />
        <MobileNavItem active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} icon={<Wallet />} label="Ví" />
        <MobileNavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="Lịch sử" />
      </nav>
    </div>
  );
};

// Sub-components

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    {label}
  </button>
);

const MobileNavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
      active ? 'text-blue-600' : 'text-slate-400'
    }`}
  >
    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);

const TransactionForm: React.FC<{ accounts: Account[]; categories: BudgetCategory[]; onAdd: (t: Omit<Transaction, 'id'>) => void }> = ({ accounts, categories, onAdd }) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [incomeType, setIncomeType] = useState<IncomeType>(IncomeType.EMPLOYEE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !accountId || (type === 'EXPENSE' && !categoryId)) return;
    onAdd({
      amount: Number(amount),
      description,
      categoryId: type === 'INCOME' ? '' : categoryId,
      accountId,
      type,
      incomeType: type === 'INCOME' ? incomeType : undefined,
      date: new Date().toISOString()
    });
    setAmount('');
    setDescription('');
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <Plus className="text-blue-500" />
          Ghi chép Giao dịch
        </h3>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'EXPENSE' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
          >
            Chi tiêu
          </button>
          <button 
            type="button"
            onClick={() => setType('INCOME')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
          >
            Thu nhập
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-1">
          <label className="text-xs font-bold text-slate-400 uppercase">{type === 'INCOME' ? 'Nguồn thu nhập' : 'Mô tả chi tiêu'}</label>
          <input 
            type="text" 
            placeholder={type === 'INCOME' ? 'Lương tháng, Thưởng...' : 'Ăn trưa, Cà phê...'} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium mb-2"
          />
          {type === 'EXPENSE' && (
            <div className="flex flex-wrap gap-2">
              {COMMON_EXPENSES.map(exp => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => setDescription(exp)}
                  className="px-2 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                >
                  {exp}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">Số tiền (VND)</label>
          <input 
            type="number" 
            placeholder="0" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold ${type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}
          />
        </div>
        
        {type === 'EXPENSE' ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Hạng mục quỹ</label>
            <select 
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Phân loại Thu nhập</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {INCOME_CLASSIFICATIONS.map(ic => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setIncomeType(ic.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                    incomeType === ic.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {ic.icon} {ic.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`space-y-2 ${type === 'INCOME' ? 'md:col-span-1' : ''}`}>
          <label className="text-xs font-bold text-slate-400 uppercase">{type === 'INCOME' ? 'Nhận vào tài khoản' : 'Thanh toán từ'}</label>
          <select 
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <button 
          type="submit"
          className={`md:col-span-2 w-full py-4 text-white rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg mt-2 ${
            type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
          }`}
        >
          {type === 'INCOME' ? 'Ghi nhận Thu nhập' : 'Lưu Chi tiêu'}
        </button>
      </form>
    </div>
  );
};

const BudgetSettings: React.FC<{ 
  categories: BudgetCategory[]; 
  totalPercentage: number; 
  onUpdate: (cats: BudgetCategory[]) => void 
}> = ({ categories, totalPercentage, onUpdate }) => {
  const [localCats, setLocalCats] = useState(categories);

  const handlePercentChange = (id: string, val: number) => {
    setLocalCats(prev => prev.map(c => c.id === id ? { ...c, percentage: val } : c));
  };

  const handleSave = () => {
    if (Math.abs(localCats.reduce((acc, c) => acc + c.percentage, 0) - 100) > 0.01) {
      alert("Tổng tỷ lệ phải bằng chính xác 100%!");
      return;
    }
    onUpdate(localCats);
  };

  const addCategory = () => {
    const newId = Date.now().toString();
    setLocalCats(prev => [...prev, { id: newId, name: 'Hạng mục mới', percentage: 0, type: CategoryType.CUSTOM, color: '#94a3b8' }]);
  };

  const removeCategory = (id: string) => {
    setLocalCats(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Cài đặt Tỷ lệ Ngân sách</h3>
          <p className="text-slate-400 text-sm">Tổng cộng phải là 100%</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl font-black text-lg ${Math.abs(totalPercentage - 100) < 0.01 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {totalPercentage}%
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {localCats.map(cat => (
          <div key={cat.id} className="flex items-center gap-4 group p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
            <input 
              type="text" 
              value={cat.name}
              onChange={(e) => setLocalCats(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))}
              className="flex-1 bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-700"
            />
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <input 
                type="number" 
                value={cat.percentage}
                onChange={(e) => handlePercentChange(cat.id, Number(e.target.value))}
                className="w-16 bg-transparent border-none focus:ring-0 p-0 text-center font-black text-blue-600"
              />
              <span className="text-slate-400 font-bold mr-2">%</span>
            </div>
            {cat.type === CategoryType.CUSTOM && (
              <button onClick={() => removeCategory(cat.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button 
          onClick={addCategory}
          className="flex-1 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all"
        >
          + Thêm quỹ mới
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Lưu thiết lập
        </button>
      </div>
    </div>
  );
};

export default App;
