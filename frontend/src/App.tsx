import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Calendar, 
  Brain, 
  Settings as SettingsIcon, 
  LogOut, 
  CheckCircle, 
  User, 
  ChevronRight,
  ChevronDown,
  ChevronUp, 
  Mic, 
  Sparkles,
  Info,
  Award,
  AlertTriangle,
  RotateCcw,
  PieChart as ChartIcon,
  Upload
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import confetti from 'canvas-confetti';

// Backend Base URL
const API_BASE = 'http://localhost:8080/api';

// Core Interfaces
interface UserProfile {
  id: number;
  name: string;
  email: string;
  currency: string;
  savingsGoal: number;
}

interface IncomeSource {
  id?: number;
  userId: number;
  type: string;
  amount: number;
  frequency: string;
  isConfirmed: boolean;
}

interface Expense {
  id?: number;
  userId: number;
  amount: number;
  category: string;
  note: string;
  date: string;
  isRecurring: boolean;
}

interface EmiPayment {
  id: number;
  loanId: number;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  isPaid: boolean;
}

interface Loan {
  id: number;
  userId: number;
  name: string;
  principal: number;
  rate: number;
  tenure: number;
  emi: number;
  startDate: string;
  lender: string;
  type: string;
  prepayPriority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE';
  
  // Advanced Payoff Planner Variables
  outstandingAmount?: number;
  debtType?: 'credit_card' | 'personal_loan' | 'friend' | 'family' | 'salary_advance' | 'bnpl';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  flexibilityScore?: number;
  emotionalStressScore?: number;
  penaltyRiskScore?: number;
  relationshipRisk?: number;
  allowSkipPayment?: boolean;
  minimumRequired?: number;
  dueDate?: string;
  settlementEligible?: boolean;
}

interface LoanWithPayments {
  loan: Loan;
  payments: EmiPayment[];
}

interface ParsedSchedulePayment {
  dueDate: string;
  paidDate: string | null;
  amount: number;
  isPaid: boolean;
}

interface ScheduleUploadResult {
  detectedLoan: Record<string, string | number>;
  payments: ParsedSchedulePayment[];
  missingFields: string[];
  warnings: string[];
}

interface Budget {
  id?: number;
  userId: number;
  category: string;
  monthlyLimit: number;
}

interface LoanSnapshot {
  name: string;
  interestAccrued: number;
  minPaid: number;
  extraPaid: number;
  remaining: number;
}

interface ProjectionPoint {
  month: string;
  balance: number;
  payment: number;
  details?: LoanSnapshot[];
}

interface StrategyResult {
  name: string;
  debtFreeMonths: number;
  debtFreeDate: string;
  totalInterestPaid: number;
  interestSaved: number;
  monthsSaved: number;
  projection: ProjectionPoint[];
}

interface AnalysisData {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  surplusSavings: number;
  baseline: StrategyResult;
  avalanche: StrategyResult;
  snowball: StrategyResult;
  balanced: StrategyResult;
  priorityFirst?: StrategyResult;
  hybridEmotional?: StrategyResult;
  cashflowRelief?: StrategyResult;
  survival?: StrategyResult;
  relationshipProtection?: StrategyResult;
  aiAdaptive?: StrategyResult;
  financialStressScore?: number;
  harassmentRiskLevel?: string;
  confidenceScore?: number;
  skipSuggestions?: string[];
  advice: string;
}


export default function App() {
  // Navigation & Wizard State
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('onboarded') === 'true';
  });
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // UI Buffers
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>('');
  
  // User Configuration / Data Store
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 1,
    name: 'Vikram',
    email: 'vikram@expensetracker.local',
    currency: '₹',
    savingsGoal: 15000
  });

  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loansWithPayments, setLoansWithPayments] = useState<LoanWithPayments[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisData | null>(null);
  const [aiKey, setAiKey] = useState<string>(() => localStorage.getItem('claude_api_key') || '');
  
  // Form input builders
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food & Dining',
    note: '',
    isRecurring: false
  });
  
  const [isSimpleLoan, setIsSimpleLoan] = useState<boolean>(false);
  const [loanRegistrationMode, setLoanRegistrationMode] = useState<'standard' | 'simple' | 'slice' | 'flexible'>('standard');
  const [sliceStartMonth, setSliceStartMonth] = useState<string>('2026-06');
  const [sliceTenure, setSliceTenure] = useState<string>('6');
  const [sliceAmounts, setSliceAmounts] = useState<Record<string, string>>({});
  const [editingLoanId, setEditingLoanId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  
  const [editExpenseForm, setEditExpenseForm] = useState({
    amount: '',
    category: 'Food & Dining',
    note: '',
    isRecurring: false
  });

  const [editLoanForm, setEditLoanForm] = useState({
    name: '',
    principal: '',
    rate: '',
    tenure: '',
    emi: '',
    lender: '',
    type: 'Home',
    prepayPriority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE',
    outstandingAmount: '',
    debtType: 'personal_loan' as 'credit_card' | 'personal_loan' | 'friend' | 'family' | 'salary_advance' | 'bnpl',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    flexibilityScore: 50,
    emotionalStressScore: 50,
    penaltyRiskScore: 50,
    relationshipRisk: 50,
    allowSkipPayment: false,
    minimumRequired: '',
    dueDate: '',
    settlementEligible: false
  });

  const [newLoan, setNewLoan] = useState({
    name: '',
    principal: '',
    rate: '',
    tenure: '',
    emi: '',
    lender: '',
    type: 'Home',
    prepayPriority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE',
    outstandingAmount: '',
    debtType: 'personal_loan' as 'credit_card' | 'personal_loan' | 'friend' | 'family' | 'salary_advance' | 'bnpl',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    flexibilityScore: 50,
    emotionalStressScore: 50,
    penaltyRiskScore: 50,
    relationshipRisk: 50,
    allowSkipPayment: false,
    minimumRequired: '',
    dueDate: '',
    settlementEligible: false
  });

  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [scheduleUploadResult, setScheduleUploadResult] = useState<ScheduleUploadResult | null>(null);
  const [scheduleUploadForm, setScheduleUploadForm] = useState({
    name: '',
    principal: '',
    rate: '0',
    tenure: '',
    emi: '',
    lender: '',
    type: 'Home',
    prepayPriority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE'
  });
  const [scheduleUploadError, setScheduleUploadError] = useState<string>('');
  const [isUploadingSchedule, setIsUploadingSchedule] = useState<boolean>(false);
  const [collapsedLoanIds, setCollapsedLoanIds] = useState<Record<number, boolean>>({});
  const toggleLoanCollapse = (id: number) => {
    setCollapsedLoanIds(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const [selectedStrategy, setSelectedStrategy] = useState<'Avalanche' | 'Snowball' | 'Balanced' | 'Baseline' | 'Priority' | 'Hybrid' | 'CashflowRelief' | 'Survival' | 'Relationship' | 'Adaptive'>('Avalanche');

  const [showAllSimMonths, setShowAllSimMonths] = useState<boolean>(false);

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            color: '#f87171', 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            padding: '0.2rem 0.5rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🔥 High
          </span>
        );
      case 'LOW':
        return (
          <span style={{ 
            background: 'rgba(59, 130, 246, 0.12)', 
            color: '#60a5fa', 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            padding: '0.2rem 0.5rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(59, 130, 246, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🐢 Low
          </span>
        );
      case 'EXCLUDE':
        return (
          <span style={{ 
            background: 'rgba(156, 163, 175, 0.12)', 
            color: '#9ca3af', 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            padding: '0.2rem 0.5rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(156, 163, 175, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            ❌ Excluded
          </span>
        );
      case 'MEDIUM':
      default:
        return (
          <span style={{ 
            background: 'rgba(168, 85, 247, 0.12)', 
            color: '#c084fc', 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            padding: '0.2rem 0.5rem', 
            borderRadius: '8px', 
            border: '1px solid rgba(168, 85, 247, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            ⚡ Medium
          </span>
        );
    }
  };

  const [newIncome, setNewIncome] = useState({
    type: 'Salary',
    amount: '',
    isConfirmed: true
  });

  // What-If Sliders
  const [simExtraMonthly, setSimExtraMonthly] = useState<number>(5000);
  const [simLumpSum, setSimLumpSum] = useState<number>(50000);
  const [simSalaryHike, setSimSalaryHike] = useState<number>(10);
  const [simCustomText, setSimCustomText] = useState<string>('');

  // Fallback indicator
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Recalculate loading + NLP result display
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [nlpParsedResult, setNlpParsedResult] = useState<{ description: string; lumpSum: number; salaryHikePercent: number; extraMonthly: number } | null>(null);
  const [isRefreshingData, setIsRefreshingData] = useState<boolean>(false);

  // Income Inline Edit State
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [editIncomeForm, setEditIncomeForm] = useState<{ type: string; amount: string }>({ type: 'Salary', amount: '' });

  // API Seeding / Synchronizers
  useEffect(() => {
    loadAllData();
  }, []);

  // When sliders or raw data dependencies change, compute locally and instantly for fluid 60fps responses
  useEffect(() => {
    if (isOnboarded && incomes.length > 0) {
      calculateAiProjectionsLocal();
    }
  }, [incomes, expenses, loansWithPayments, simExtraMonthly, simLumpSum, simSalaryHike, isOnboarded]);

  // Initial load backend fetch
  useEffect(() => {
    if (isOnboarded && incomes.length > 0 && !isUsingFallback) {
      calculateAiProjections();
    }
  }, [isOnboarded]);

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    try {
      await loadAllData();
      if (!isUsingFallback) {
        await calculateAiProjections();
      } else {
        calculateAiProjectionsLocal();
      }
    } catch (err) {
      console.error('Failed to refresh data', err);
    } finally {
      setIsRefreshingData(false);
    }
  };

  const loadAllData = async () => {
    try {
      // 1. Load profile
      const userRes = await fetch(`${API_BASE}/users/1`);
      if (!userRes.ok) throw new Error('Backend unreached');
      const userData = await userRes.json();
      setUserProfile(userData);

      // 2. Load incomes
      const incRes = await fetch(`${API_BASE}/income?userId=1`);
      const incData = await incRes.json();
      setIncomes(incData);

      // 3. Load expenses
      const expRes = await fetch(`${API_BASE}/expenses?userId=1`);
      const expData = await expRes.json();
      setExpenses(expData);

      // 4. Load loans
      const loanRes = await fetch(`${API_BASE}/loans?userId=1`);
      const loanData = await loanRes.json();
      setLoansWithPayments(loanData);

      // 5. Load budgets
      const budRes = await fetch(`${API_BASE}/budgets?userId=1`);
      const budData = await budRes.json();
      setBudgets(budData);

      setIsUsingFallback(false);
    } catch (err) {
      console.warn('Spring Boot backend is down. Falling back to secure local state tracker.', err);
      setIsUsingFallback(true);
      loadLocalDataFallback();
    }
  };

  // Browser Fallback Storage Seeding
  const loadLocalDataFallback = () => {
    const cachedProfile = localStorage.getItem('profile');
    if (cachedProfile) {
      setUserProfile(JSON.parse(cachedProfile));
    }

    const cachedIncomes = localStorage.getItem('incomes');
    if (cachedIncomes) {
      setIncomes(JSON.parse(cachedIncomes));
    } else {
      const defaultIncomes = [
        { id: 1, userId: 1, type: 'Salary', amount: 85000, frequency: 'Monthly', isConfirmed: true },
        { id: 2, userId: 1, type: 'Freelance', amount: 15000, frequency: 'Monthly', isConfirmed: false }
      ];
      setIncomes(defaultIncomes);
      localStorage.setItem('incomes', JSON.stringify(defaultIncomes));
    }

    const cachedExpenses = localStorage.getItem('expenses');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (cachedExpenses) {
      setExpenses(JSON.parse(cachedExpenses));
    } else {
      const defaultExpenses = [
        { id: 1, userId: 1, amount: 1200, category: 'Food & Dining', note: 'Dinner with family', date: yesterday, isRecurring: false },
        { id: 2, userId: 1, amount: 3500, category: 'Shopping', note: 'Bought jacket', date: yesterday, isRecurring: false },
        { id: 3, userId: 1, amount: 450, category: 'Transport', note: 'Uber ride to office', date: today, isRecurring: false },
        { id: 4, userId: 1, amount: 2000, category: 'Utilities & Bills', note: 'Electricity Bill', date: today, isRecurring: false }
      ];
      setExpenses(defaultExpenses);
      localStorage.setItem('expenses', JSON.stringify(defaultExpenses));
    }

    const cachedLoans = localStorage.getItem('loans');
    if (cachedLoans) {
      setLoansWithPayments(JSON.parse(cachedLoans));
    } else {
      const defaultLoans: LoanWithPayments[] = [
        {
          loan: { id: 1, userId: 1, name: 'HDFC Car Loan', principal: 600000, rate: 9.5, tenure: 36, emi: 19220, startDate: today, lender: 'HDFC Bank', type: 'Car' },
          payments: Array.from({ length: 36 }, (_, i) => ({
            id: 100 + i,
            loanId: 1,
            dueDate: new Date(Date.now() + i * 30 * 86400000).toISOString().split('T')[0],
            paidDate: i < 6 ? today : null,
            amount: 19220,
            isPaid: i < 6
          }))
        },
        {
          loan: { id: 2, userId: 1, name: 'Friend Loan - Rahul', principal: 50000, rate: 0.0, tenure: 10, emi: 5000, startDate: today, lender: 'Rahul', type: 'Friend' },
          payments: Array.from({ length: 10 }, (_, i) => ({
            id: 200 + i,
            loanId: 2,
            dueDate: new Date(Date.now() + i * 30 * 86400000).toISOString().split('T')[0],
            paidDate: i < 2 ? today : null,
            amount: 5000,
            isPaid: i < 2
          }))
        }
      ];
      setLoansWithPayments(defaultLoans);
      localStorage.setItem('loans', JSON.stringify(defaultLoans));
    }

    const cachedBudgets = localStorage.getItem('budgets');
    if (cachedBudgets) {
      setBudgets(JSON.parse(cachedBudgets));
    } else {
      const defaultBudgets = [
        { id: 1, userId: 1, category: 'Food & Dining', monthlyLimit: 10000 },
        { id: 2, userId: 1, category: 'Shopping', monthlyLimit: 8000 },
        { id: 3, userId: 1, category: 'Utilities & Bills', monthlyLimit: 6000 },
        { id: 4, userId: 1, category: 'Transport', monthlyLimit: 5000 }
      ];
      setBudgets(defaultBudgets);
      localStorage.setItem('budgets', JSON.stringify(defaultBudgets));
    }
  };

  // ── Claude LLM Intent Parser (runs client-side when API key is available) ──
  const parseIntentWithLLM = async (text: string): Promise<{
    lumpSum: number;
    lumpSumMonthOffset: number;
    extraMonthly: number;
    salaryHikePercent: number;
    description: string;
  } | null> => {
    const key = aiKey || localStorage.getItem('claude_api_key') || '';
    if (!key || !key.startsWith('sk-ant-')) return null;

    const systemPrompt = `You are a financial event extractor. Given a user's plain-English statement about their financial situation, extract structured parameters for a debt payoff simulation.

Return ONLY a single line of valid JSON with these keys:
- lumpSum: one-time cash inflow in rupees (0 if none)
- lumpSumMonthOffset: months from now when lump sum arrives (1 if immediate/now/soon, else best estimate)
- extraMonthly: extra monthly debt repayment amount in rupees (0 if none)
- salaryHikePercent: percentage salary increase (0 if none, e.g. 25 for a 25% hike)
- description: a short 1-line human-readable summary of what you understood

Be generous in interpretation. "joining bonus", "sign-on bonus", "relocation allowance", "incentive", "FD maturity", "maturity", "received money" all count as lumpSum. "switch job", "new job", "increment", "appraisal", "hike", "raise", "promotion" imply salaryHikePercent. If no hike percentage is mentioned for a job switch, use 20 as a reasonable default. Numbers can appear anywhere — before or after keywords.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-20240307',
          max_tokens: 256,
          system: systemPrompt,
          messages: [{ role: 'user', content: text }]
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      const raw = data?.content?.[0]?.text?.trim() || '';
      // Extract JSON even if Claude adds extra text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  };

  // AI Payoff Math Projection Simulator
  async function calculateAiProjections() {
    setIsRecalculating(true);
    setNlpParsedResult(null);

    try {
      // ── Step 1: Parse intent from custom text using LLM or backend regex ──
      let parsedLumpSum = simLumpSum;
      let parsedExtraMonthly = simExtraMonthly;
      let parsedSalaryHike = simSalaryHike;
      let parsedDescription = '';

      if (simCustomText.trim()) {
        // Try Claude LLM first (if API key set)
        const llmResult = await parseIntentWithLLM(simCustomText);
        if (llmResult) {
          parsedLumpSum = simLumpSum + (llmResult.lumpSum || 0);
          parsedExtraMonthly = simExtraMonthly + (llmResult.extraMonthly || 0);
          parsedSalaryHike = simSalaryHike + (llmResult.salaryHikePercent || 0);
          parsedDescription = llmResult.description || '';
          setNlpParsedResult({
            description: llmResult.description,
            lumpSum: llmResult.lumpSum,
            salaryHikePercent: llmResult.salaryHikePercent,
            extraMonthly: llmResult.extraMonthly
          });
        }
      }

      // ── Step 2: Run backend simulation with merged params ──
      if (!isUsingFallback) {
        try {
          const res = await fetch(`${API_BASE}/ai/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 1,
              extraMonthlyPayment: parsedExtraMonthly,
              lumpSumPrepayment: parsedLumpSum,
              salaryHikePercent: parsedSalaryHike,
              customText: simCustomText // still send for backend's own parsing/logging
            })
          });
          const data = await res.json();
          // Inject LLM-parsed description into advice if available
          if (parsedDescription && data.advice) {
            data.advice = `**🤖 AI understood:** *${parsedDescription}*\n\n` + data.advice;
          }
          if (data.nlpParsedResult) {
            setNlpParsedResult({
              description: data.nlpParsedResult.description,
              lumpSum: data.nlpParsedResult.lumpSum,
              salaryHikePercent: data.nlpParsedResult.salaryHikePercent,
              extraMonthly: data.nlpParsedResult.extraMonthly
            });
          }
          setAiAnalysis(data);
        } catch {
          calculateAiProjectionsLocal();
        }
      } else {
        calculateAiProjectionsLocal();
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  function calculateAiProjectionsLocal() {
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0) || 28000;
    const totalEmi = loansWithPayments.reduce((sum, item) => sum + item.loan.emi, 0);
    const totalDebtValue = loansWithPayments.reduce((sum, item) => {
      return sum + item.payments.filter(p => !p.isPaid).reduce((s, p) => s + p.amount, 0);
    }, 0);
    const surplus = Math.max(0, totalIncome - totalExpenses - totalEmi);

    // ── Parse simCustomText (NLP) ──
    let nlpLumpSum = 0;
    let nlpLumpSumOffset = 1;
    let nlpSalaryHike = 0;
    let nlpExtraMonthly = 0;
    let nlpAckMsg = '';

    if (simCustomText && simCustomText.trim()) {
      const txt = simCustomText.toLowerCase();

      // Extract all numbers > 100
      const numMatches = [...txt.matchAll(/(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g)];
      const allNums: number[] = numMatches
        .map(m => parseFloat(m[1].replace(/,/g, '')))
        .filter(n => n > 100);

      // Intent detection
      const isBonus = /join\w*|bonus|joining|incentive|award|gratuity|maturity|\bfd\b|fixed deposit|prepay|lump.?sum|receive|windfall|relocation/.test(txt);
      const isSalaryHike = /hike|increment|appraisal|raise|switch\w*\s+job|new job|new salary|salary increase|increase.*salary|salary.*hike|hike.*salary|salary.*raise|pay rise|package|\bctc\b|compensation|income increase/.test(txt);
      const isExtraMonthly = /extra.*month|month.*extra|per month|every month|monthly extra|monthly payment|additional.*month/.test(txt);

      // Lump sum
      if (isBonus && allNums.length > 0) {
        nlpLumpSum = Math.max(...allNums);
        if (txt.includes('now') || txt.includes('today') || txt.includes('immediate')) nlpLumpSumOffset = 1;
        else if (txt.includes('in 2 months') || txt.includes('2 months')) nlpLumpSumOffset = 2;
        else if (txt.includes('in 3 months') || txt.includes('3 months')) nlpLumpSumOffset = 3;
        else if (txt.includes('in 6 months') || txt.includes('6 months')) nlpLumpSumOffset = 6;
        else if (txt.includes('october') || txt.includes('diwali')) nlpLumpSumOffset = 5;
        else nlpLumpSumOffset = 1;
        nlpAckMsg += `🎉 Lump-sum inflow of ₹${nlpLumpSum.toLocaleString()} in ${nlpLumpSumOffset} month(s). `;
      }

      // Salary hike
      if (isSalaryHike) {
        const pctMatch = txt.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]);
          nlpSalaryHike = (pct / 100) * totalIncome;
          nlpAckMsg += `📈 ${pct}% salary hike → +₹${Math.round(nlpSalaryHike).toLocaleString()}/mo. `;
        } else if (allNums.length > 0) {
          const bigNum = Math.max(...allNums);
          if (bigNum !== nlpLumpSum) {
            nlpSalaryHike = bigNum > totalIncome ? (bigNum - totalIncome) : bigNum;
            nlpAckMsg += `📈 Salary boost of +₹${Math.round(nlpSalaryHike).toLocaleString()}/mo. `;
          }
        }
      }

      // Extra monthly
      if (isExtraMonthly) {
        const exMatch = txt.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:extra|per month|monthly|every month)/);
        if (exMatch) {
          nlpExtraMonthly = parseFloat(exMatch[1].replace(/,/g, ''));
          nlpAckMsg += `💳 +₹${nlpExtraMonthly.toLocaleString()} extra/month. `;
        }
      }

      // Fallback: any large number
      if (nlpLumpSum === 0 && nlpSalaryHike === 0 && nlpExtraMonthly === 0 && allNums.length > 0) {
        nlpLumpSum = Math.max(...allNums);
        nlpLumpSumOffset = 1;
        nlpAckMsg += `💡 Detected ₹${nlpLumpSum.toLocaleString()} — treating as one-time inflow next month. `;
      }
    }

    // Merge slider values + NLP values
    const effectiveLumpSum = simLumpSum + nlpLumpSum;
    const effectiveLumpSumOffset = nlpLumpSum > 0 ? nlpLumpSumOffset : 3;
    const effectiveExtraMonthly = simExtraMonthly + nlpExtraMonthly;
    const effectiveSalaryHikeAmt = ((simSalaryHike / 100) * totalIncome) + nlpSalaryHike;

    const activeExtraPool = surplus + effectiveExtraMonthly;

    const getPriorityVal = (priority?: string) => {
      if (!priority) return 2;
      const lower = priority.toLowerCase();
      if (lower === 'critical') return 4;
      if (lower === 'high') return 3;
      if (lower === 'medium') return 2;
      if (lower === 'low') return 1;
      return 2;
    };

    const runSim = (strategy: string) => {
      const localLoans = loansWithPayments.map(lw => ({
        name: lw.loan.name,
        balance: lw.payments.filter(p => !p.isPaid).reduce((s, p) => s + p.amount, 0),
        rate: lw.loan.rate || 0,
        emi: lw.loan.emi || 0,
        prepayPriority: lw.loan.prepayPriority || 'MEDIUM',
        priority: lw.loan.priority || 'medium',
        debtType: lw.loan.debtType || 'personal_loan',
        flexibilityScore: lw.loan.flexibilityScore || 50,
        emotionalStressScore: lw.loan.emotionalStressScore || 50,
        penaltyRiskScore: lw.loan.penaltyRiskScore || 50,
        relationshipRisk: lw.loan.relationshipRisk || 50,
        minimumRequired: lw.loan.minimumRequired || 0,
        allowSkipPayment: lw.loan.allowSkipPayment || false
      })).filter(l => l.balance > 0);

      if (localLoans.length === 0) {
        return {
          name: strategy,
          debtFreeMonths: 0,
          debtFreeDate: 'No active debt',
          totalInterestPaid: 0,
          interestSaved: 0,
          monthsSaved: 0,
          projection: []
        };
      }

      const points: ProjectionPoint[] = [];
      let totalInterest = 0;
      let monthIndex = 0;
      const today = new Date();

      // Starting point
      points.push({
        month: today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        balance: localLoans.reduce((sum, l) => sum + l.balance, 0),
        payment: 0
      });

      while (monthIndex < 240) {
        monthIndex++;
        const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + monthIndex, 1);
        let monthTotalPaid = 0;
        let activeExtra = strategy === 'Baseline' ? 0 : activeExtraPool;

        // Lump sum at NLP-detected month offset
        if (strategy !== 'Baseline' && monthIndex === effectiveLumpSumOffset) {
          activeExtra += effectiveLumpSum;
        }
        // Salary hike from NLP offset month onward
        if (strategy !== 'Baseline' && monthIndex >= effectiveLumpSumOffset) {
          activeExtra += effectiveSalaryHikeAmt;
        }

        // 1. Accrue Interest
        const interestPaid: Record<string, number> = {};
        for (const l of localLoans) {
          if (l.balance > 0) {
            const interest = l.balance * ((l.rate / 100) / 12);
            l.balance += interest;
            totalInterest += interest;
            interestPaid[l.name] = interest;
          } else {
            interestPaid[l.name] = 0;
          }
        }

        // 2. Pay Minimums
        const minPayments: Record<string, number> = {};
        for (const l of localLoans) {
          if (l.balance > 0) {
            let minPay = 0;
            if (strategy === 'Survival') {
              const isFlexible = l.allowSkipPayment || l.debtType === 'friend' || l.debtType === 'family';
              const pVal = getPriorityVal(l.priority);
              if (pVal <= 2 && isFlexible) {
                minPay = 0;
              } else {
                minPay = l.minimumRequired > 0 
                  ? Math.min(l.balance, l.minimumRequired) 
                  : Math.min(l.balance, Math.max(100, l.emi * 0.3));
              }
            } else {
              minPay = Math.min(l.balance, l.emi);
            }
            l.balance -= minPay;
            monthTotalPaid += minPay;
            minPayments[l.name] = minPay;
          } else {
            minPayments[l.name] = 0;
          }
        }

        // 3. Prepayment Pool Allocation
        const extraPayments: Record<string, number> = {};
        for (const l of localLoans) {
          extraPayments[l.name] = 0;
        }

        if (activeExtra > 0) {
          if (strategy === 'Avalanche') {
            localLoans.sort((a, b) => b.rate - a.rate);
          } else if (strategy === 'Snowball') {
            localLoans.sort((a, b) => a.balance - b.balance);
          } else if (strategy === 'PriorityFirst' || strategy === 'Priority') {
            localLoans.sort((a, b) => {
              const pA = getPriorityVal(a.priority);
              const pB = getPriorityVal(b.priority);
              if (pA !== pB) return pB - pA;
              return b.emi - a.emi;
            });
          } else if (strategy === 'Hybrid' || strategy === 'HybridEmotional') {
            localLoans.sort((a, b) => {
              const sA = (a.rate * 0.3) + (getPriorityVal(a.priority) * 20 * 0.3) + (a.emotionalStressScore * 0.2) + (a.penaltyRiskScore * 0.2);
              const sB = (b.rate * 0.3) + (getPriorityVal(b.priority) * 20 * 0.3) + (b.emotionalStressScore * 0.2) + (b.penaltyRiskScore * 0.2);
              return sB - sA;
            });
          } else if (strategy === 'CashflowRelief') {
            localLoans.sort((a, b) => b.emi - a.emi);
          } else if (strategy === 'RelationshipProtection' || strategy === 'Relationship') {
            localLoans.sort((a, b) => {
              const aPers = a.debtType === 'friend' || a.debtType === 'family';
              const bPers = b.debtType === 'friend' || b.debtType === 'family';
              if (aPers && !bPers) return -1;
              if (!aPers && bPers) return 1;
              return b.relationshipRisk - a.relationshipRisk;
            });
          } else if (strategy === 'AiAdaptive' || strategy === 'Adaptive') {
            localLoans.sort((a, b) => {
              const sA = (a.rate * 0.5) + (a.emotionalStressScore * 0.5);
              const sB = (b.rate * 0.5) + (b.emotionalStressScore * 0.5);
              return sB - sA;
            });
          } else if (strategy === 'Balanced') {
            const totalActiveBalance = localLoans.filter(l => l.balance > 0).reduce((sum, l) => sum + l.balance, 0);
            if (totalActiveBalance > 0) {
              let extraPaid = 0;
              for (const l of localLoans) {
                if (l.balance > 0) {
                  const share = (l.balance / totalActiveBalance) * activeExtra;
                  const paid = Math.min(l.balance, share);
                  l.balance -= paid;
                  monthTotalPaid += paid;
                  extraPaid += paid;
                  extraPayments[l.name] = paid;
                }
              }
              activeExtra = Math.max(0, activeExtra - extraPaid);
            }
          }

          if (strategy !== 'Balanced' && strategy !== 'Survival' && activeExtra > 0) {
            for (const l of localLoans) {
              if (l.balance > 0 && activeExtra > 0) {
                const paid = Math.min(l.balance, activeExtra);
                l.balance -= paid;
                monthTotalPaid += paid;
                activeExtra -= paid;
                extraPayments[l.name] = paid;
              }
            }
          }
        }

        const remaining = localLoans.reduce((sum, l) => sum + (l.balance > 0 ? l.balance : 0), 0);
        
        const loanSnapshots = localLoans.map(l => ({
          name: l.name,
          interestAccrued: interestPaid[l.name] || 0,
          minPaid: minPayments[l.name] || 0,
          extraPaid: extraPayments[l.name] || 0,
          remaining: Math.max(0, Math.round(l.balance))
        }));

        points.push({
          month: currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          balance: Math.max(0, Math.round(remaining)),
          payment: Math.round(monthTotalPaid),
          details: loanSnapshots
        });

        if (remaining <= 0) break;
      }

      const debtDateStr = new Date(today.getFullYear(), today.getMonth() + monthIndex, 1)
        .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      return {
        name: strategy,
        debtFreeMonths: monthIndex,
        debtFreeDate: debtDateStr,
        totalInterestPaid: Math.round(totalInterest),
        interestSaved: 0,
        monthsSaved: 0,
        projection: points
      };
    };

    const baseline = runSim('Baseline');
    const avalanche = runSim('Avalanche');
    const snowball = runSim('Snowball');
    const balanced = runSim('Balanced');
    const priorityFirst = runSim('PriorityFirst');
    const hybridEmotional = runSim('Hybrid');
    const cashflowRelief = runSim('CashflowRelief');
    const survival = runSim('Survival');
    const relationshipProtection = runSim('RelationshipProtection');
    const aiAdaptive = runSim('AiAdaptive');

    const makeRelative = (strat: any) => {
      strat.interestSaved = Math.max(0, baseline.totalInterestPaid - strat.totalInterestPaid);
      strat.monthsSaved = Math.max(0, baseline.debtFreeMonths - strat.debtFreeMonths);
      return strat;
    };

    const formattedAvalanche = makeRelative(avalanche);
    const formattedSnowball = makeRelative(snowball);
    const formattedBalanced = makeRelative(balanced);
    const formattedPriority = makeRelative(priorityFirst);
    const formattedHybrid = makeRelative(hybridEmotional);
    const formattedCashflow = makeRelative(cashflowRelief);
    const formattedSurvival = makeRelative(survival);
    const formattedRelation = makeRelative(relationshipProtection);
    const formattedAdaptive = makeRelative(aiAdaptive);

    // Advanced Metrics calculations
    const emiRatio = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : 0;
    let stressScore = (emiRatio * 0.5) + (totalDebtValue > 100000 ? 30 : (totalDebtValue / 100000) * 30);
    const avgStress = loansWithPayments.reduce((s, lw) => s + (lw.loan.emotionalStressScore || 50), 0) / (loansWithPayments.length || 1);
    stressScore = Math.round(stressScore * 0.6 + avgStress * 0.4);

    let harassmentRisk = 'LOW';
    const maxPenalty = loansWithPayments.reduce((max, lw) => Math.max(max, lw.loan.penaltyRiskScore || 50), 0);
    if (stressScore > 75 && maxPenalty > 70) {
        harassmentRisk = 'AGGRESSIVE COLLECTION RISK';
    } else if (maxPenalty > 50 || emiRatio > 60) {
        harassmentRisk = 'MODERATE RISK';
    }

    const skipSuggestions: string[] = [];
    loansWithPayments.forEach(lw => {
      if (lw.loan.allowSkipPayment || lw.loan.debtType === 'friend' || lw.loan.debtType === 'family') {
        if ((lw.loan.flexibilityScore || 50) > 60) {
          skipSuggestions.push(`You may safely defer payment on ${lw.loan.name} (${lw.loan.lender || 'Personal Lender'}) — flexibility score is high (${lw.loan.flexibilityScore || 50}%).`);
        }
      }
    });
    if (skipSuggestions.length === 0) skipSuggestions.push("All debts require standard payments this cycle.");

    const confidenceScore = Math.round(Math.max(20, Math.min(99, 60 + (surplus / (totalIncome || 1)) * 200 - stressScore * 0.2)));

    const adviceText = `### 💡 AI Debt Recovery & Financial Survival Coaching (Local Mode)

${nlpAckMsg ? `**Parsed from your input:** *${nlpAckMsg.trim()}*\n\n` : ''}Your monthly net take-home is **${userProfile.currency}${totalIncome.toLocaleString()}** against basic expenses of **${userProfile.currency}${totalExpenses.toLocaleString()}** and monthly EMIs of **${userProfile.currency}${totalEmi.toLocaleString()}**.

${stressScore > 70 
  ? `⚠️ **Critical Alert:** Your financial stress is **very high (${stressScore}/100)**. Consider executing **Survival Mode** to skip flexible payments or **Priority-First** to resolve collections first.`
  : `✨ **Healthy Position:** Your financial stress is **low (${stressScore}/100)**. Consider continuing aggressively with **Avalanche** to maximize interest savings.`
}

#### 🚀 Payoff Strategy Impact:
- **Avalanche Strategy:** Prepaying highest-interest first saves you **${userProfile.currency}${formattedAvalanche.interestSaved.toLocaleString()}** and makes you debt-free **${formattedAvalanche.monthsSaved} months sooner**!
- **Priority-First Strategy:** Eliminating critical risk first makes you debt-free **${formattedPriority.monthsSaved} months sooner**!
- **Cashflow Relief:** Eliminating highest EMI first makes you debt-free **${formattedCashflow.monthsSaved} months sooner**!`;

    setAiAnalysis({
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      totalDebt: totalDebtValue,
      surplusSavings: surplus,
      baseline,
      avalanche: formattedAvalanche,
      snowball: formattedSnowball,
      balanced: formattedBalanced,
      priorityFirst: formattedPriority,
      hybridEmotional: formattedHybrid,
      cashflowRelief: formattedCashflow,
      survival: formattedSurvival,
      relationshipProtection: formattedRelation,
      aiAdaptive: formattedAdaptive,
      financialStressScore: stressScore,
      harassmentRiskLevel: harassmentRisk,
      confidenceScore,
      skipSuggestions,
      advice: adviceText
    });
  };

  // Transaction Event Handlers
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount) return;

    const payload: Expense = {
      userId: 1,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      note: newExpense.note || 'Logged transaction',
      date: new Date().toISOString().split('T')[0],
      isRecurring: newExpense.isRecurring
    };

    if (isUsingFallback) {
      const updated = [...expenses, { ...payload, id: Date.now() }];
      setExpenses(updated);
      localStorage.setItem('expenses', JSON.stringify(updated));
    } else {
      await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadAllData();
    }

    setNewExpense({ amount: '', category: 'Food & Dining', note: '', isRecurring: false });
    setShowQuickAdd(false);
  };

  const handleDeleteExpense = async (id: number) => {
    if (isUsingFallback) {
      const updated = expenses.filter(e => e.id !== id);
      setExpenses(updated);
      localStorage.setItem('expenses', JSON.stringify(updated));
    } else {
      await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
      loadAllData();
    }
  };

  const startEditingExpense = (e: Expense) => {
    if (e.id) {
      setEditingExpenseId(e.id);
      setEditExpenseForm({
        amount: e.amount.toString(),
        category: e.category,
        note: e.note,
        isRecurring: e.isRecurring
      });
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpenseId || !editExpenseForm.amount) return;

    const payload = {
      userId: 1,
      amount: parseFloat(editExpenseForm.amount),
      category: editExpenseForm.category,
      note: editExpenseForm.note || 'Updated transaction',
      date: new Date().toISOString().split('T')[0],
      isRecurring: editExpenseForm.isRecurring
    };

    if (isUsingFallback) {
      const updated = expenses.map(item => {
        if (item.id === editingExpenseId) {
          return { ...item, ...payload };
        }
        return item;
      });
      setExpenses(updated);
      localStorage.setItem('expenses', JSON.stringify(updated));
    } else {
      await fetch(`${API_BASE}/expenses/${editingExpenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadAllData();
    }

    setEditingExpenseId(null);
  };

  // Loan & EMI Tick Off Handler
  const handleToggleEmiPayment = async (loanId: number, paymentId: number, currentPaidStatus: boolean) => {
    const nextPaidStatus = !currentPaidStatus;

    if (nextPaidStatus) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#a855f7', '#6366f1', '#10b981']
      });
    }

    if (isUsingFallback) {
      const updated = loansWithPayments.map(lw => {
        if (lw.loan.id === loanId) {
          const updatedPayments = lw.payments.map(p => {
            if (p.id === paymentId) {
              return { ...p, isPaid: nextPaidStatus, paidDate: nextPaidStatus ? new Date().toISOString().split('T')[0] : null };
            }
            return p;
          });
          return { ...lw, payments: updatedPayments };
        }
        return lw;
      });
      setLoansWithPayments(updated);
      localStorage.setItem('loans', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/loans/${loanId}/payments/${paymentId}/toggle?isPaid=${nextPaidStatus}`, {
        method: 'POST'
      });
      loadAllData();
    }
  };

  const handleUpdateEmiAmount = async (loanId: number, paymentId: number, newAmount: number) => {
    if (isNaN(newAmount) || newAmount < 0) return;

    if (isUsingFallback) {
      const updated = loansWithPayments.map(lw => {
        if (lw.loan.id === loanId) {
          const updatedPayments = lw.payments.map(p => {
            if (p.id === paymentId) {
              return { ...p, amount: newAmount };
            }
            return p;
          });
          return { ...lw, payments: updatedPayments };
        }
        return lw;
      });
      setLoansWithPayments(updated);
      localStorage.setItem('loans', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/loans/${loanId}/payments/${paymentId}?amount=${newAmount}`, {
        method: 'PUT'
      });
      loadAllData();
    }
  };

  const getSliceMonths = (startMonthStr: string, tenureVal: number) => {
    if (!startMonthStr) return [];
    const monthsList = [];
    const [y, m] = startMonthStr.split('-');
    const year = parseInt(y);
    const month = parseInt(m) - 1; // 0-indexed
    for (let i = 0; i < tenureVal; i++) {
      const d = new Date(year, month + i, 1);
      monthsList.push({
        dateStr: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }
    return monthsList;
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    const resetForm = {
      name: '', principal: '', rate: '', tenure: '', emi: '', lender: '', type: 'Home', prepayPriority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE',
      outstandingAmount: '',
      debtType: 'personal_loan' as 'credit_card' | 'personal_loan' | 'friend' | 'family' | 'salary_advance' | 'bnpl',
      priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
      flexibilityScore: 50,
      emotionalStressScore: 50,
      penaltyRiskScore: 50,
      relationshipRisk: 50,
      allowSkipPayment: false,
      minimumRequired: '',
      dueDate: '',
      settlementEligible: false
    };

    if (loanRegistrationMode === 'flexible') {
      const principalVal = parseFloat(newLoan.principal) || 0;
      if (!newLoan.name || principalVal <= 0) return;

      const loanPayload = {
        userId: 1,
        name: newLoan.name,
        principal: principalVal,
        rate: 0.0,
        tenure: 1,
        emi: 0.0, // 0.0 emi = flexible!
        lender: newLoan.lender || 'Private Lender',
        type: newLoan.type || 'Friend',
        startDate: new Date().toISOString().split('T')[0],
        prepayPriority: newLoan.prepayPriority || 'EXCLUDE',
        
        // Advanced variables
        outstandingAmount: parseFloat(newLoan.outstandingAmount) || principalVal,
        debtType: newLoan.debtType || 'friend',
        priority: newLoan.priority || 'low',
        flexibilityScore: newLoan.flexibilityScore,
        emotionalStressScore: newLoan.emotionalStressScore,
        penaltyRiskScore: newLoan.penaltyRiskScore,
        relationshipRisk: newLoan.relationshipRisk,
        allowSkipPayment: newLoan.allowSkipPayment,
        minimumRequired: parseFloat(newLoan.minimumRequired) || 0,
        settlementEligible: newLoan.settlementEligible
      };

      if (isUsingFallback) {
        const addedLoan: Loan = {
          id: Date.now(),
          userId: 1,
          name: loanPayload.name,
          principal: principalVal,
          rate: 0.0,
          tenure: 1,
          emi: 0.0,
          startDate: loanPayload.startDate,
          lender: loanPayload.lender,
          type: loanPayload.type,
          prepayPriority: loanPayload.prepayPriority,
          
          // Advanced variables
          outstandingAmount: loanPayload.outstandingAmount,
          debtType: loanPayload.debtType,
          priority: loanPayload.priority,
          flexibilityScore: loanPayload.flexibilityScore,
          emotionalStressScore: loanPayload.emotionalStressScore,
          penaltyRiskScore: loanPayload.penaltyRiskScore,
          relationshipRisk: loanPayload.relationshipRisk,
          allowSkipPayment: loanPayload.allowSkipPayment,
          minimumRequired: loanPayload.minimumRequired,
          settlementEligible: loanPayload.settlementEligible
        };

        const updated = [...loansWithPayments, {
          loan: addedLoan,
          payments: [{
            id: Date.now() + 1000,
            loanId: addedLoan.id,
            dueDate: addedLoan.startDate,
            paidDate: null,
            amount: principalVal,
            isPaid: false
          }]
        }];
        setLoansWithPayments(updated);
        localStorage.setItem('loans', JSON.stringify(updated));
        calculateAiProjectionsLocal();
      } else {
        await fetch(`${API_BASE}/loans/from-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            loan: loanPayload, 
            payments: [{
              dueDate: loanPayload.startDate,
              paidDate: null,
              amount: principalVal,
              isPaid: false
            }] 
          })
        });
        loadAllData();
      }

      setNewLoan(resetForm);
      return;
    }

    if (loanRegistrationMode === 'slice') {
      const tenureVal = parseInt(sliceTenure) || 0;
      if (!newLoan.name || tenureVal <= 0) return;
      const sliceMonthsList = getSliceMonths(sliceStartMonth, tenureVal);
      const parsedPayments = sliceMonthsList.map((m) => {
        const amount = parseFloat(sliceAmounts[m.dateStr]) || 0;
        return {
          dueDate: m.dateStr,
          paidDate: null,
          amount,
          isPaid: false
        };
      });

      if (parsedPayments.some(p => p.amount <= 0)) {
        alert('Please enter a valid amount greater than 0 for all months.');
        return;
      }

      const totalPrincipal = parsedPayments.reduce((sum, p) => sum + p.amount, 0);

      const loanPayload = {
        userId: 1,
        name: newLoan.name,
        principal: totalPrincipal,
        rate: 0.0,
        tenure: tenureVal,
        emi: parsedPayments[0].amount, // baseline EMI set as first installment
        lender: newLoan.lender || 'Slice Card',
        type: newLoan.type,
        startDate: sliceMonthsList[0].dateStr,
        prepayPriority: newLoan.prepayPriority || 'MEDIUM',
        
        // Advanced variables
        outstandingAmount: parseFloat(newLoan.outstandingAmount) || totalPrincipal,
        debtType: newLoan.debtType || 'bnpl',
        priority: newLoan.priority || 'high',
        flexibilityScore: newLoan.flexibilityScore,
        emotionalStressScore: newLoan.emotionalStressScore,
        penaltyRiskScore: newLoan.penaltyRiskScore,
        relationshipRisk: newLoan.relationshipRisk,
        allowSkipPayment: newLoan.allowSkipPayment,
        minimumRequired: parseFloat(newLoan.minimumRequired) || 0,
        settlementEligible: newLoan.settlementEligible
      };

      if (isUsingFallback) {
        const addedLoan: Loan = {
          id: Date.now(),
          userId: 1,
          name: loanPayload.name,
          principal: totalPrincipal,
          rate: 0.0,
          tenure: tenureVal,
          emi: loanPayload.emi,
          startDate: loanPayload.startDate,
          lender: loanPayload.lender,
          type: loanPayload.type,
          prepayPriority: newLoan.prepayPriority || 'MEDIUM',
          
          // Advanced variables
          outstandingAmount: loanPayload.outstandingAmount,
          debtType: loanPayload.debtType,
          priority: loanPayload.priority,
          flexibilityScore: loanPayload.flexibilityScore,
          emotionalStressScore: loanPayload.emotionalStressScore,
          penaltyRiskScore: loanPayload.penaltyRiskScore,
          relationshipRisk: loanPayload.relationshipRisk,
          allowSkipPayment: loanPayload.allowSkipPayment,
          minimumRequired: loanPayload.minimumRequired,
          settlementEligible: loanPayload.settlementEligible
        };

        const generatedPayments: EmiPayment[] = parsedPayments.map((p, i) => ({
          id: Date.now() + 1000 + i,
          loanId: addedLoan.id,
          dueDate: p.dueDate,
          paidDate: null,
          amount: p.amount,
          isPaid: false
        }));

        const updated = [...loansWithPayments, { loan: addedLoan, payments: generatedPayments }];
        setLoansWithPayments(updated);
        localStorage.setItem('loans', JSON.stringify(updated));
        calculateAiProjectionsLocal();
      } else {
        await fetch(`${API_BASE}/loans/from-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loan: loanPayload, payments: parsedPayments })
        });
        loadAllData();
      }

      // Reset form
      setNewLoan(resetForm);
      setSliceAmounts({});
      return;
    }

    if (isSimpleLoan) {
      if (!newLoan.name || !newLoan.emi || !newLoan.tenure) return;
    } else {
      if (!newLoan.name || !newLoan.principal || !newLoan.rate || !newLoan.tenure) return;
    }

    const isSimple = isSimpleLoan;
    const rateValue = isSimple ? 0.0 : parseFloat(newLoan.rate);
    const emiValue = isSimple ? parseFloat(newLoan.emi) : 0.0;
    const principalValue = isSimple ? (parseFloat(newLoan.emi) * parseInt(newLoan.tenure)) : parseFloat(newLoan.principal);

    const payload = {
      userId: 1,
      name: newLoan.name,
      principal: principalValue,
      rate: rateValue,
      tenure: parseInt(newLoan.tenure),
      emi: isSimple ? emiValue : undefined,
      lender: newLoan.lender || 'Private Lender',
      type: newLoan.type,
      startDate: new Date().toISOString().split('T')[0],
      prepayPriority: newLoan.prepayPriority || 'MEDIUM',
      
      // Advanced variables
      outstandingAmount: parseFloat(newLoan.outstandingAmount) || principalValue,
      debtType: newLoan.debtType || 'personal_loan',
      priority: newLoan.priority || 'medium',
      flexibilityScore: newLoan.flexibilityScore,
      emotionalStressScore: newLoan.emotionalStressScore,
      penaltyRiskScore: newLoan.penaltyRiskScore,
      relationshipRisk: newLoan.relationshipRisk,
      allowSkipPayment: newLoan.allowSkipPayment,
      minimumRequired: parseFloat(newLoan.minimumRequired) || 0,
      settlementEligible: newLoan.settlementEligible
    };

    if (isUsingFallback) {
      const p = payload.principal;
      const r = (payload.rate / 100) / 12;
      const n = payload.tenure;
      const calculatedEmi = isSimple ? emiValue : (r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n);
      const roundedEmi = Math.round(calculatedEmi);

      const addedLoan: Loan = { 
        id: Date.now(),
        userId: 1,
        name: payload.name,
        principal: p,
        rate: payload.rate,
        tenure: n,
        emi: roundedEmi,
        startDate: payload.startDate,
        lender: payload.lender,
        type: payload.type,
        prepayPriority: newLoan.prepayPriority || 'MEDIUM',
        
        // Advanced variables
        outstandingAmount: payload.outstandingAmount,
        debtType: payload.debtType,
        priority: payload.priority,
        flexibilityScore: payload.flexibilityScore,
        emotionalStressScore: payload.emotionalStressScore,
        penaltyRiskScore: payload.penaltyRiskScore,
        relationshipRisk: payload.relationshipRisk,
        allowSkipPayment: payload.allowSkipPayment,
        minimumRequired: payload.minimumRequired,
        settlementEligible: payload.settlementEligible
      };

      const generatedPayments: EmiPayment[] = Array.from({ length: n }, (_, i) => ({
        id: Date.now() + 1000 + i,
        loanId: addedLoan.id,
        dueDate: new Date(Date.now() + i * 30 * 86400000).toISOString().split('T')[0],
        paidDate: null,
        amount: roundedEmi,
        isPaid: false
      }));

      const updated = [...loansWithPayments, { loan: addedLoan, payments: generatedPayments }];
      setLoansWithPayments(updated);
      localStorage.setItem('loans', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadAllData();
    }

    setNewLoan(resetForm);
  };

  const applyDetectedScheduleLoan = (result: ScheduleUploadResult) => {
    const detected = result.detectedLoan || {};
    setScheduleUploadForm({
      name: String(detected.name || ''),
      principal: String(detected.principal || ''),
      rate: String(detected.rate || '0'),
      tenure: String(detected.tenure || result.payments.length || ''),
      emi: String(detected.emi || ''),
      lender: String(detected.lender || ''),
      type: String(detected.type || 'Home'),
      prepayPriority: 'MEDIUM'
    });
  };

  const parseScheduleCsvFallback = async (file: File): Promise<ScheduleUploadResult> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const rows = lines.map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const findColumn = (headers: string[], aliases: string[]) => headers.findIndex(header => aliases.some(alias => header.includes(alias)));
    const headerIndex = rows.findIndex(row => {
      const headers = row.map(normalize);
      return findColumn(headers, ['due date', 'emi date', 'payment date', 'installment date', 'date']) >= 0
        && findColumn(headers, ['emi', 'installment', 'payment', 'amount', 'total']) >= 0;
    });

    if (headerIndex < 0) {
      return { detectedLoan: {}, payments: [], missingFields: ['payments'], warnings: ['Could not detect due date and amount columns.'] };
    }

    const headers = rows[headerIndex].map(normalize);
    const dateCol = findColumn(headers, ['due date', 'emi date', 'payment date', 'installment date', 'date']);
    const amountCol = findColumn(headers, ['emi', 'installment', 'payment', 'amount', 'total']);
    const statusCol = findColumn(headers, ['status', 'paid']);
    const parseDate = (value: string) => {
      const raw = value.trim();
      if (!raw) return '';
      const iso = new Date(raw);
      if (!Number.isNaN(iso.getTime())) return iso.toISOString().split('T')[0];
      const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (!match) return '';
      const [, d, m, y] = match;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    };
    const parseMoney = (value: string) => {
      const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
      return match ? parseFloat(match[0]) : 0;
    };

    const payments = rows.slice(headerIndex + 1).map(row => {
      const dueDate = parseDate(row[dateCol] || '');
      const amount = parseMoney(row[amountCol] || '');
      const status = (row[statusCol] || '').toLowerCase();
      return { dueDate, paidDate: null, amount, isPaid: status.includes('paid') || status === 'yes' || status === 'true' };
    }).filter(payment => payment.dueDate && payment.amount > 0);
    const emi = payments[0]?.amount || '';
    const result: ScheduleUploadResult = {
      detectedLoan: { tenure: payments.length, emi },
      payments,
      missingFields: ['name', 'principal', 'lender', 'type'],
      warnings: []
    };
    return result;
  };

  const handleUploadRepaymentSchedule = async () => {
    setScheduleUploadError('');
    setScheduleUploadResult(null);
    if (!scheduleFile) {
      setScheduleUploadError('Please select a CSV, XLSX, or PDF repayment schedule.');
      return;
    }

    setIsUploadingSchedule(true);
    try {
      let result: ScheduleUploadResult;
      if (isUsingFallback) {
        if (!scheduleFile.name.toLowerCase().endsWith('.csv')) {
          setScheduleUploadError('Backend parsing is required for XLSX and PDF uploads. Start the backend and try again.');
          return;
        }
        result = await parseScheduleCsvFallback(scheduleFile);
      } else {
        const formData = new FormData();
        formData.append('file', scheduleFile);
        const res = await fetch(`${API_BASE}/loans/upload-schedule`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) {
          setScheduleUploadError(data.error || 'Could not parse repayment schedule.');
          return;
        }
        result = data;
      }

      setScheduleUploadResult(result);
      applyDetectedScheduleLoan(result);
      if (result.missingFields.length > 0) {
        setScheduleUploadError(`File does not contain the following fields, please add manually: ${result.missingFields.join(', ')}`);
      }
    } finally {
      setIsUploadingSchedule(false);
    }
  };

  const handleCreateLoanFromSchedule = async () => {
    if (!scheduleUploadResult || scheduleUploadResult.payments.length === 0) return;
    if (!scheduleUploadForm.name || !scheduleUploadForm.principal || !scheduleUploadForm.emi || !scheduleUploadForm.lender || !scheduleUploadForm.type) {
      setScheduleUploadError('File does not contain the following fields, please add manually: name, principal, emi, lender, type');
      return;
    }

    const loan: Loan = {
      id: Date.now(),
      userId: 1,
      name: scheduleUploadForm.name,
      principal: parseFloat(scheduleUploadForm.principal),
      rate: parseFloat(scheduleUploadForm.rate) || 0,
      tenure: parseInt(scheduleUploadForm.tenure) || scheduleUploadResult.payments.length,
      emi: parseFloat(scheduleUploadForm.emi),
      startDate: scheduleUploadResult.payments[0].dueDate,
      lender: scheduleUploadForm.lender,
      type: scheduleUploadForm.type,
      prepayPriority: scheduleUploadForm.prepayPriority
    };

    if (isUsingFallback) {
      const payments: EmiPayment[] = scheduleUploadResult.payments.map((payment, idx) => ({
        id: Date.now() + 2000 + idx,
        loanId: loan.id,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate,
        amount: payment.amount,
        isPaid: payment.isPaid
      }));
      const updated = [...loansWithPayments, { loan, payments }];
      setLoansWithPayments(updated);
      localStorage.setItem('loans', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      const res = await fetch(`${API_BASE}/loans/from-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loan: { ...loan, id: undefined }, payments: scheduleUploadResult.payments })
      });
      const data = await res.json();
      if (!res.ok) {
        setScheduleUploadError(data.error || 'Could not create debt from schedule.');
        return;
      }
      loadAllData();
    }

    setScheduleFile(null);
    setScheduleUploadResult(null);
    setScheduleUploadError('');
    setScheduleUploadForm({ name: '', principal: '', rate: '0', tenure: '', emi: '', lender: '', type: 'Home', prepayPriority: 'MEDIUM' });
  };

  const handleDeleteLoan = async (id: number) => {
    if (isUsingFallback) {
      const updated = loansWithPayments.filter(lw => lw.loan.id !== id);
      setLoansWithPayments(updated);
      localStorage.setItem('loans', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/loans/${id}`, { method: 'DELETE' });
      loadAllData();
    }
  };

  const handleUpdateLoan = async (loanId: number) => {
    const payload = {
      userId: 1,
      name: editLoanForm.name,
      principal: parseFloat(editLoanForm.principal) || 0,
      rate: parseFloat(editLoanForm.rate) || 0,
      tenure: parseInt(editLoanForm.tenure) || 0,
      emi: parseFloat(editLoanForm.emi) || 0,
      lender: editLoanForm.lender,
      type: editLoanForm.type,
      prepayPriority: editLoanForm.prepayPriority,
      
      // Advanced Payoff Planner Fields
      outstandingAmount: parseFloat(editLoanForm.outstandingAmount) || parseFloat(editLoanForm.principal) || 0,
      debtType: editLoanForm.debtType,
      priority: editLoanForm.priority,
      flexibilityScore: editLoanForm.flexibilityScore,
      emotionalStressScore: editLoanForm.emotionalStressScore,
      penaltyRiskScore: editLoanForm.penaltyRiskScore,
      relationshipRisk: editLoanForm.relationshipRisk,
      allowSkipPayment: editLoanForm.allowSkipPayment,
      minimumRequired: parseFloat(editLoanForm.minimumRequired) || 0,
      settlementEligible: editLoanForm.settlementEligible
    };

    if (isUsingFallback) {
      const updated = loansWithPayments.map(lw => {
        if (lw.loan.id === loanId) {
          return {
            ...lw,
            loan: {
              ...lw.loan,
              ...payload
            }
          };
        }
        return lw;
      });
      setLoansWithPayments(updated);
      localStorage.setItem('loans', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadAllData();
    }
    setEditingLoanId(null);
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.amount) return;

    const payload: IncomeSource = {
      userId: 1,
      type: newIncome.type,
      amount: parseFloat(newIncome.amount),
      frequency: 'Monthly',
      isConfirmed: newIncome.isConfirmed
    };

    if (isUsingFallback) {
      const updated = [...incomes, { ...payload, id: Date.now() }];
      setIncomes(updated);
      localStorage.setItem('incomes', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadAllData();
    }

    setNewIncome({ type: 'Salary', amount: '', isConfirmed: true });
  };

  const handleDeleteIncome = async (id: number) => {
    if (isUsingFallback) {
      const updated = incomes.filter(inc => inc.id !== id);
      setIncomes(updated);
      localStorage.setItem('incomes', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/income/${id}`, { method: 'DELETE' });
      loadAllData();
    }
  };

  const handleUpdateIncome = async (id: number) => {
    const newAmount = parseFloat(editIncomeForm.amount);
    if (isNaN(newAmount) || newAmount <= 0) return;

    if (isUsingFallback) {
      const updated = incomes.map(inc =>
        inc.id === id
          ? { ...inc, type: editIncomeForm.type, amount: newAmount }
          : inc
      );
      setIncomes(updated);
      localStorage.setItem('incomes', JSON.stringify(updated));
      calculateAiProjectionsLocal();
    } else {
      await fetch(`${API_BASE}/income/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: editIncomeForm.type, amount: newAmount, isConfirmed: true })
      });
      loadAllData();
    }
    setEditingIncomeId(null);
  };

  // Simulated Voice Input Action Parser
  const startVoiceCaptureSim = () => {
    setIsRecordingVoice(true);
    setVoiceText('Transcribing your query...');
    
    const voiceScenarios = [
      'Spent 800 rupees on food at Starbucks',
      'Paid 1500 for taxi transport',
      'I got a Diwali bonus of 50000 rupees in October',
      'Paid 3000 on shopping',
      'I am expecting a 20% salary increase next month'
    ];
    const picked = voiceScenarios[Math.floor(Math.random() * voiceScenarios.length)];
    
    setTimeout(() => {
      setVoiceText(`"${picked}"`);
      setTimeout(() => {
        setIsRecordingVoice(false);
        if (picked.includes('Spent')) {
          const match = picked.match(/(\d+)/);
          const amount = match ? match[1] : '800';
          const cat = picked.includes('food') ? 'Food & Dining' : 'Transport';
          setNewExpense({
            amount: amount,
            category: cat,
            note: 'Added via Voice Assistant 🎙️',
            isRecurring: false
          });
          setShowQuickAdd(true);
        } else if (picked.includes('bonus') || picked.includes('increase')) {
          setSimCustomText(picked);
          setActiveTab('planner');
        }
      }, 1500);
    }, 2000);
  };

  // Onboarding Setup Activator
  const completeOnboardingWizard = () => {
    setIsOnboarded(true);
    localStorage.setItem('onboarded', 'true');
    localStorage.setItem('profile', JSON.stringify(userProfile));
    loadAllData();
  };

  const activateDemoMode = () => {
    setUserProfile({
      id: 1,
      name: 'Vikram',
      email: 'vikram@expensetracker.local',
      currency: '₹',
      savingsGoal: 20000
    });
    localStorage.setItem('onboarded', 'true');
    setIsOnboarded(true);
    setIsUsingFallback(true);
    loadLocalDataFallback();
    calculateAiProjectionsLocal();
  };

  // Analytics aggregate math
  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalDebt = loansWithPayments.reduce((sum, item) => {
    return sum + item.payments.filter(p => !p.isPaid).reduce((s, p) => s + p.amount, 0);
  }, 0);

  const totalEMI = loansWithPayments.reduce((sum, item) => sum + item.loan.emi, 0);
  const netWorth = totalIncome - totalExpenses - totalDebt;

  const getMergedProjections = () => {
    if (!aiAnalysis) return [];
    interface MergedPoint {
      month: string;
      Baseline: number;
      Avalanche: number;
      Snowball: number;
      Balanced: number;
      Priority?: number;
      Hybrid?: number;
      CashflowRelief?: number;
      Survival?: number;
      Relationship?: number;
      Adaptive?: number;
    }
    const merged: MergedPoint[] = [];
    const maxMonths = Math.max(
      aiAnalysis.baseline?.projection?.length || 0,
      aiAnalysis.avalanche?.projection?.length || 0,
      aiAnalysis.snowball?.projection?.length || 0,
      aiAnalysis.balanced?.projection?.length || 0,
      aiAnalysis.priorityFirst?.projection?.length || 0,
      aiAnalysis.hybridEmotional?.projection?.length || 0,
      aiAnalysis.cashflowRelief?.projection?.length || 0,
      aiAnalysis.survival?.projection?.length || 0,
      aiAnalysis.relationshipProtection?.projection?.length || 0,
      aiAnalysis.aiAdaptive?.projection?.length || 0
    );

    const today = new Date();
    for (let i = 0; i < maxMonths; i++) {
      const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthLabel = currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const getBalanceAtIndex = (proj: ProjectionPoint[] | undefined, index: number) => {
        if (!proj || proj.length === 0) return 0;
        if (index >= proj.length) return 0;
        return proj[index].balance;
      };

      merged.push({
        month: monthLabel,
        'Baseline': getBalanceAtIndex(aiAnalysis.baseline?.projection, i),
        'Avalanche': getBalanceAtIndex(aiAnalysis.avalanche?.projection, i),
        'Snowball': getBalanceAtIndex(aiAnalysis.snowball?.projection, i),
        'Balanced': getBalanceAtIndex(aiAnalysis.balanced?.projection, i),
        'Priority': getBalanceAtIndex(aiAnalysis.priorityFirst?.projection, i),
        'Hybrid': getBalanceAtIndex(aiAnalysis.hybridEmotional?.projection, i),
        'CashflowRelief': getBalanceAtIndex(aiAnalysis.cashflowRelief?.projection, i),
        'Survival': getBalanceAtIndex(aiAnalysis.survival?.projection, i),
        'Relationship': getBalanceAtIndex(aiAnalysis.relationshipProtection?.projection, i),
        'Adaptive': getBalanceAtIndex(aiAnalysis.aiAdaptive?.projection, i),
      });
    }
    return merged;
  };


  // Render Onboarding Wizard
  if (!isOnboarded) {
    return (
      <div className="wizard-container">
        <div className="logo-container" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>💰</span>
          <span className="logo-text" style={{ fontSize: '2.2rem' }}>SmartPayoff</span>
        </div>

        <div className="wizard-progress-bar">
          <div className="wizard-progress-fill" style={{ width: `${(onboardStep / 5) * 100}%` }}></div>
        </div>

        <div className="premium-card wizard-card glow-card" style={{ padding: '2.5rem' }}>
          {onboardStep === 1 && (
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Welcome! Let's build your Profile 👤</h2>
              <p style={{ color: '--text-muted', marginBottom: '2rem' }}>What should we call you?</p>
              <input 
                type="text" 
                placeholder="Enter your name" 
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                style={{ width: '100%', marginBottom: '2rem', textAlign: 'center' }}
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={activateDemoMode}>
                  <Sparkles size={16} /> Try Demo Mode
                </button>
                <button className="btn btn-primary" onClick={() => setOnboardStep(2)}>
                  Next Step <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {onboardStep === 2 && (
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Monthly Take-home Salary 🏦</h2>
              <p style={{ color: '--text-muted', marginBottom: '2rem' }}>Input your primary fixed monthly net salary income.</p>
              <div style={{ position: 'relative', maxWidth: '300px', margin: '0 auto 2rem' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: 'var(--primary)' }}>₹</span>
                <input 
                  type="number" 
                  placeholder="85,000" 
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  style={{ width: '100%', paddingLeft: '2.5rem', textAlign: 'center', fontSize: '1.2rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setOnboardStep(1)}>Back</button>
                <button className="btn btn-primary" onClick={() => {
                  if (newIncome.amount) {
                    const parsedInc = parseFloat(newIncome.amount);
                    setIncomes([{ userId: 1, type: 'Salary', amount: parsedInc, frequency: 'Monthly', isConfirmed: true }]);
                  }
                  setOnboardStep(3);
                }}>Next Step <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {onboardStep === 3 && (
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Active Loans & EMIs 🏦</h2>
              <p style={{ color: '--text-muted', marginBottom: '1.5rem' }}>Do you currently have active personal, home, or car loans?</p>
              
              {/* Toggle Simple Payoff */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simple Payoff Mode (Just EMI & Tenure)</span>
                <label className="emi-checkbox-container" style={{ gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    className="emi-checkbox-input"
                    checked={isSimpleLoan}
                    onChange={(e) => setIsSimpleLoan(e.target.checked)}
                  />
                  <span className="emi-checkbox-custom" style={{ borderRadius: '50%' }}>
                    {isSimpleLoan ? '✓' : ''}
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <input 
                  type="text" 
                  placeholder="Loan Name (e.g. SBI Home Loan)" 
                  value={newLoan.name}
                  onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                  style={{ width: '100%' }}
                />
                
                {isSimpleLoan ? (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="number" 
                      placeholder="EMI Amount (₹)" 
                      value={newLoan.emi}
                      onChange={(e) => setNewLoan({ ...newLoan, emi: e.target.value })}
                      style={{ width: '50%' }}
                    />
                    <input 
                      type="number" 
                      placeholder="Tenure (months)" 
                      value={newLoan.tenure}
                      onChange={(e) => setNewLoan({ ...newLoan, tenure: e.target.value })}
                      style={{ width: '50%' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="number" 
                      placeholder="Principal Amount (₹)" 
                      value={newLoan.principal}
                      onChange={(e) => setNewLoan({ ...newLoan, principal: e.target.value })}
                      style={{ width: '50%' }}
                    />
                    <input 
                      type="number" 
                      placeholder="Interest Rate p.a. (%)" 
                      value={newLoan.rate}
                      onChange={(e) => setNewLoan({ ...newLoan, rate: e.target.value })}
                      style={{ width: '50%' }}
                    />
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {!isSimpleLoan && (
                    <input 
                      type="number" 
                      placeholder="Tenure (months)" 
                      value={newLoan.tenure}
                      onChange={(e) => setNewLoan({ ...newLoan, tenure: e.target.value })}
                      style={{ width: '50%' }}
                    />
                  )}
                  <select 
                    value={newLoan.type}
                    onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                    style={{ width: isSimpleLoan ? '100%' : '50%' }}
                  >
                    <option value="Home">Home Loan</option>
                    <option value="Car">Car Loan</option>
                    <option value="Personal">Personal Loan</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setOnboardStep(2)}>Back</button>
                <button className="btn btn-primary" onClick={() => {
                  const isSimple = isSimpleLoan;
                  const hasValidInputs = isSimple 
                    ? (newLoan.name && newLoan.emi && newLoan.tenure)
                    : (newLoan.name && newLoan.principal && newLoan.rate && newLoan.tenure);

                  if (hasValidInputs) {
                    const n = parseInt(newLoan.tenure) || 12;
                    const r = isSimple ? 0.0 : (parseFloat(newLoan.rate) || 0);
                    const emi = isSimple 
                      ? parseFloat(newLoan.emi)
                      : (r > 0 ? (parseFloat(newLoan.principal) * (r/100/12) * Math.pow(1+r/100/12, n)) / (Math.pow(1+r/100/12, n)-1) : parseFloat(newLoan.principal) / n);
                    const p = isSimple ? (emi * n) : parseFloat(newLoan.principal);
                    
                    const added: LoanWithPayments = {
                      loan: { id: 1, userId: 1, name: newLoan.name, principal: p, rate: r, tenure: n, emi: Math.round(emi), startDate: new Date().toISOString().split('T')[0], lender: newLoan.lender || 'Bank', type: newLoan.type },
                      payments: Array.from({ length: n }, (_, i) => ({
                        id: 1000 + i,
                        loanId: 1,
                        dueDate: new Date(Date.now() + i * 30 * 86400000).toISOString().split('T')[0],
                        paidDate: null,
                        amount: Math.round(emi),
                        isPaid: false
                      }))
                    };
                    setLoansWithPayments([added]);
                  }
                  setOnboardStep(4);
                  setNewLoan({
                    name: '', principal: '', rate: '', tenure: '', emi: '', lender: '', type: 'Home', prepayPriority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE',
                    outstandingAmount: '',
                    debtType: 'personal_loan' as 'credit_card' | 'personal_loan' | 'friend' | 'family' | 'salary_advance' | 'bnpl',
                    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
                    flexibilityScore: 50,
                    emotionalStressScore: 50,
                    penaltyRiskScore: 50,
                    relationshipRisk: 50,
                    allowSkipPayment: false,
                    minimumRequired: '',
                    dueDate: '',
                    settlementEligible: false
                  });

                }}>Next Step <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {onboardStep === 4 && (
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Fixed Monthly Living Costs 💡</h2>
              <p style={{ color: '--text-muted', marginBottom: '2rem' }}>Groceries, house rent, electricity bills, utilities, etc.</p>
              <div style={{ position: 'relative', maxWidth: '300px', margin: '0 auto 2rem' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: 'var(--primary)' }}>₹</span>
                <input 
                  type="number" 
                  placeholder="25,000" 
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  style={{ width: '100%', paddingLeft: '2.5rem', textAlign: 'center', fontSize: '1.2rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setOnboardStep(3)}>Back</button>
                <button className="btn btn-primary" onClick={() => {
                  if (newExpense.amount) {
                    setExpenses([{
                      id: 1,
                      userId: 1,
                      amount: parseFloat(newExpense.amount),
                      category: 'Utilities & Bills',
                      note: 'Fixed Monthly Living Expenses',
                      date: new Date().toISOString().split('T')[0],
                      isRecurring: true
                    }]);
                  }
                  setOnboardStep(5);
                }}>Next Step <ChevronRight size={16} /></button>
              </div>
            </div>
          )}

          {onboardStep === 5 && (
            <div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Ready to Conquer Debt! 🚀</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2.5rem' }}>
                We've captured your basic details. The app will generate interactive payoff graphs, smart analytics, and high-performance Avalanche/Snowball comparisons!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={completeOnboardingWizard} style={{ width: '100%', padding: '1rem' }}>
                  Open Dashboard <CheckCircle size={18} />
                </button>
                <button className="btn btn-secondary" onClick={() => setOnboardStep(4)}>Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Main Render Context
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <span style={{ fontSize: '1.8rem' }}>💰</span>
          <span className="logo-text">SmartPayoff</span>
        </div>

        <div className="nav-links">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <TrendingUp size={18} /> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
            <DollarSign size={18} /> Spend Logger
          </button>
          <button className={`nav-item ${activeTab === 'loans' ? 'active' : ''}`} onClick={() => setActiveTab('loans')}>
            <Calendar size={18} /> Loans & EMIs
          </button>
          <button className={`nav-item ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>
            <Brain size={18} /> AI Payoff Planner
          </button>
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <ChartIcon size={18} /> Analytics & Heatmap
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <SettingsIcon size={18} /> Settings
          </button>
        </div>

        {/* Fallback Banner */}
        {isUsingFallback && (
          <div style={{ padding: '0.85rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', fontSize: '0.8rem', color: '#fbbf24', marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertTriangle size={14} />
            <span>Local Offline Mode Active</span>
          </div>
        )}

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button className="nav-item" onClick={() => {
            localStorage.removeItem('onboarded');
            setIsOnboarded(false);
            setOnboardStep(1);
          }} style={{ width: '100%', background: 'transparent' }}>
            <LogOut size={16} /> Reset Wizard
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Floating Quick Action Button */}
        <button className="fab-btn" onClick={() => setShowQuickAdd(true)} title="Quickly Add Expense">
          <Plus size={24} />
        </button>

        {/* Dynamic Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Hi, {userProfile.name} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
              Here is your financial strategy snapshot for today.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={startVoiceCaptureSim} disabled={isRecordingVoice}>
              <Mic size={16} className={isRecordingVoice ? 'animate-pulse text-purple' : ''} />
              {isRecordingVoice ? 'Listening...' : 'Voice Quick Log'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <User size={16} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Demo Profile</span>
            </div>
          </div>
        </header>

        {isRecordingVoice && (
          <div className="premium-card glow-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderColor: 'var(--primary)' }}>
            <Sparkles style={{ color: 'var(--primary)' }} />
            <div>
              <h4 style={{ margin: 0 }}>Voice Assistant transcribing...</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic', color: 'var(--primary)' }}>{voiceText}</p>
            </div>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top Cards grid */}
            <div className="dashboard-grid">
              <div className="premium-card glow-card" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)', borderColor: 'var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Net Financial Position</span>
                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                      {userProfile.currency}{netWorth.toLocaleString()}
                    </h2>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', borderRadius: '12px' }}>
                    <TrendingUp size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <TrendingUp size={14} /> +₹12,400 expected side earnings
                  </span>
                </div>
              </div>

              <div className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Total Outstanding Debt</span>
                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
                      {userProfile.currency}{totalDebt.toLocaleString()}
                    </h2>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.2)', borderRadius: '12px' }}>
                    <TrendingDown size={24} style={{ color: 'var(--accent)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Award size={14} style={{ color: 'var(--warning)' }} />
                  <span>
                    {aiAnalysis ? `You are ${aiAnalysis.baseline.debtFreeMonths} months away from being debt free!` : 'Calculating strategies...'}
                  </span>
                </div>
              </div>

              <div className="premium-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Active EMIs Pool</span>
                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                      {userProfile.currency}{totalEMI.toLocaleString()}
                    </h2>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '12px' }}>
                    <Calendar size={24} style={{ color: 'var(--secondary)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>{loansWithPayments.length} Active accounts tracked</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Strategy Comparison Visualizer & Mini checklist */}
            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
              <div className="premium-card glow-card full-width-card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Projected Payoff Curves Strategy Visualizer
                </h3>
                
                {aiAnalysis && (
                  <div style={{ height: '300px', width: '100%', position: 'relative', marginTop: '1.5rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aiAnalysis.avalanche.projection}>
                        <defs>
                          <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAvalanche" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="var(--text-dimmed)" fontSize={11} />
                        <YAxis stroke="var(--text-dimmed)" fontSize={11} />
                        <Tooltip contentStyle={{ background: 'rgba(15,10,25,0.95)', borderColor: 'var(--border-color)', color: 'white' }} />
                        <Legend />
                        <Area name="Baseline Minimums Only" type="monotone" dataKey="balance" data={aiAnalysis.baseline.projection} stroke="var(--accent)" fillOpacity={1} fill="url(#colorBaseline)" />
                        <Area name="Avalanche Prepayment" type="monotone" dataKey="balance" stroke="var(--primary)" fillOpacity={1} fill="url(#colorAvalanche)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
              {/* Quick checklist */}
              <div className="premium-card">
                <h3>Upcoming EMI Reminders Checklist 🔔</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {loansWithPayments.map(lw => {
                    const nextUnpaid = lw.payments.find(p => !p.isPaid);
                    if (!nextUnpaid) return null;
                    return (
                      <div key={lw.loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{lw.loan.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {nextUnpaid.dueDate}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{userProfile.currency}{nextUnpaid.amount.toLocaleString()}</span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => handleToggleEmiPayment(lw.loan.id, nextUnpaid.id, false)}
                          >
                            Mark Paid
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Budget constraints */}
              <div className="premium-card">
                <h3>Budget Category Utilization limits 📊</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                  {budgets.map(b => {
                    const spend = expenses
                      .filter(e => e.category === b.category)
                      .reduce((sum, e) => sum + e.amount, 0);
                    const pct = Math.min(100, Math.round((spend / b.monthlyLimit) * 100));
                    
                    return (
                      <div key={b.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 500 }}>{b.category}</span>
                          <span style={{ color: pct > 80 ? 'var(--danger)' : 'var(--text-muted)' }}>
                            {userProfile.currency}{spend.toLocaleString()} / {userProfile.currency}{b.monthlyLimit.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--danger)' : 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DAILY EXPENSES LOG SCREEN */}
        {activeTab === 'expenses' && (
          <div>
            <div className="dashboard-grid">
              {/* Form card */}
              <div className="premium-card">
                <h3>Log New Transaction 💸</h3>
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Transaction Amount (₹)</label>
                    <input 
                      type="number" 
                      placeholder="1,200" 
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Category</label>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="Food & Dining">🍕 Food & Dining</option>
                      <option value="Transport">🚗 Transport</option>
                      <option value="Utilities & Bills">💡 Utilities & Bills</option>
                      <option value="Health">🏥 Health</option>
                      <option value="Entertainment">🎮 Entertainment</option>
                      <option value="Shopping">🛍️ Shopping</option>
                      <option value="Education">📚 Education</option>
                      <option value="Travel">✈️ Travel</option>
                      <option value="Other">📦 Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Short Note (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Family Dinner at restaurant" 
                      value={newExpense.note}
                      onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                    <input 
                      type="checkbox" 
                      id="isRecurring"
                      checked={newExpense.isRecurring}
                      onChange={(e) => setNewExpense({ ...newExpense, isRecurring: e.target.checked })}
                    />
                    <label htmlFor="isRecurring" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Mark as recurring expense monthly</label>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                    Add Transaction Log
                  </button>
                </form>
              </div>

              {/* Transactions log list */}
              <div className="premium-card" style={{ gridColumn: 'span 2' }}>
                <h3>Recent Transaction Activity History</h3>
                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.25rem', paddingRight: '0.5rem' }}>
                  {expenses.length === 0 ? (
                    <p style={{ color: 'var(--text-dimmed)', textAlign: 'center', marginTop: '2rem' }}>No logged transaction details yet.</p>
                  ) : (
                    expenses.slice().reverse().map(e => {
                      const isEditing = editingExpenseId === e.id;
                      return (
                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: isEditing ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.04)', transition: 'all 0.3s ease' }}>
                          {isEditing ? (
                            <form onSubmit={handleUpdateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', padding: '0.25rem' }}>
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <input 
                                  type="number" 
                                  value={editExpenseForm.amount}
                                  onChange={(evt) => setEditExpenseForm({ ...editExpenseForm, amount: evt.target.value })}
                                  style={{ width: '120px', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
                                  required
                                  placeholder="Amount"
                                />
                                <input 
                                  type="text" 
                                  value={editExpenseForm.note}
                                  onChange={(evt) => setEditExpenseForm({ ...editExpenseForm, note: evt.target.value })}
                                  style={{ flex: 1, minWidth: '150px', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
                                  placeholder="Note / Description"
                                />
                                <select 
                                  value={editExpenseForm.category}
                                  onChange={(evt) => setEditExpenseForm({ ...editExpenseForm, category: evt.target.value })}
                                  style={{ width: '160px', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
                                >
                                  <option value="Food & Dining">🍕 Food & Dining</option>
                                  <option value="Transport">🚗 Transport</option>
                                  <option value="Utilities & Bills">💡 Utilities & Bills</option>
                                  <option value="Health">🏥 Health</option>
                                  <option value="Entertainment">🎮 Entertainment</option>
                                  <option value="Shopping">🛍️ Shopping</option>
                                  <option value="Education">📚 Education</option>
                                  <option value="Travel">✈️ Travel</option>
                                  <option value="Other">📦 Other</option>
                                </select>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input 
                                    type="checkbox" 
                                    id={`editIsRecurring-${e.id}`}
                                    checked={editExpenseForm.isRecurring}
                                    onChange={(evt) => setEditExpenseForm({ ...editExpenseForm, isRecurring: evt.target.checked })}
                                  />
                                  <label htmlFor={`editIsRecurring-${e.id}`} style={{ fontSize: '0.82rem', cursor: 'pointer' }}>Recurring monthly</label>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Save</button>
                                  <button type="button" className="btn btn-secondary" onClick={() => setEditingExpenseId(null)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Cancel</button>
                                </div>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.75rem' }}>
                                  {e.category === 'Food & Dining' ? '🍕' :
                                   e.category === 'Transport' ? '🚗' :
                                   e.category === 'Utilities & Bills' ? '💡' :
                                   e.category === 'Shopping' ? '🛍️' : '📦'}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{e.note || e.category}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                                    <span>{e.date}</span>
                                    {e.isRecurring && <span style={{ color: 'var(--primary)' }}>• Recurring</span>}
                                  </div>
                                </div>
                              </div>
 
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>
                                  -{userProfile.currency}{e.amount.toLocaleString()}
                                </span>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.35rem 0.6rem', color: 'var(--primary)', borderColor: 'rgba(168, 85, 247, 0.2)' }}
                                  onClick={() => e.id && startEditingExpense(e)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '0.35rem 0.6rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                  onClick={() => e.id && handleDeleteExpense(e.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. LOAN & EMI AMORTIZATION SCREEN */}
        {activeTab === 'loans' && (
          <div>
            <div className="dashboard-grid">
              {/* Add Loan Form */}
              <div className="premium-card">
                <h3>Add New Active Debt 🏦</h3>
                
                {/* Premium Mode Selector Segment Control */}
                <div style={{ 
                  display: 'flex', 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '0.3rem', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '1.25rem' 
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanRegistrationMode('standard');
                      setIsSimpleLoan(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: loanRegistrationMode === 'standard' ? 'var(--primary)' : 'transparent',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    📈 Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanRegistrationMode('simple');
                      setIsSimpleLoan(true);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: loanRegistrationMode === 'simple' ? 'var(--primary)' : 'transparent',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    ⚙️ Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanRegistrationMode('slice');
                      setIsSimpleLoan(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: loanRegistrationMode === 'slice' ? 'var(--primary)' : 'transparent',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    💳 Slice/Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanRegistrationMode('flexible');
                      setIsSimpleLoan(false);
                      setNewLoan(prev => ({ ...prev, type: 'Friend', prepayPriority: 'EXCLUDE' }));
                    }}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: loanRegistrationMode === 'flexible' ? 'var(--primary)' : 'transparent',
                      color: 'white',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    🤝 Informal (Pay Anytime)
                  </button>
                </div>

                <form onSubmit={handleAddLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Loan Name (e.g. Slice Purchase, iPhone Split)" 
                    value={newLoan.name}
                    onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                    required
                  />
                  
                  {loanRegistrationMode === 'slice' ? (
                    <>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Start Month</label>
                          <input 
                            type="month" 
                            value={sliceStartMonth}
                            onChange={(e) => setSliceStartMonth(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tenure (months)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 11" 
                            value={sliceTenure}
                            onChange={(e) => setSliceTenure(e.target.value)}
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      {getSliceMonths(sliceStartMonth, parseInt(sliceTenure) || 0).length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.75rem', 
                          maxHeight: '220px', 
                          overflowY: 'auto', 
                          padding: '0.75rem', 
                          background: 'rgba(255,255,255,0.02)', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          marginTop: '0.5rem'
                        }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Enter payment for each month:
                          </label>
                          {getSliceMonths(sliceStartMonth, parseInt(sliceTenure) || 0).map(m => (
                            <div key={m.dateStr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{m.label}</span>
                              <input
                                type="number"
                                placeholder="Amount (₹)"
                                value={sliceAmounts[m.dateStr] || ''}
                                onChange={(e) => {
                                  setSliceAmounts({ ...sliceAmounts, [m.dateStr]: e.target.value });
                                }}
                                style={{ width: '130px', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
                                min="1"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {getSliceMonths(sliceStartMonth, parseInt(sliceTenure) || 0).reduce((sum, m) => sum + (parseFloat(sliceAmounts[m.dateStr]) || 0), 0) > 0 && (
                        <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, padding: '0.25rem 0' }}>
                          💰 Total Sliced Debt Principal: ₹{getSliceMonths(sliceStartMonth, parseInt(sliceTenure) || 0).reduce((sum, m) => sum + (parseFloat(sliceAmounts[m.dateStr]) || 0), 0).toLocaleString()}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <select 
                          value={newLoan.type}
                          onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="Home">🏠 Home Loan</option>
                          <option value="Car">🚗 Car Loan</option>
                          <option value="Personal">💳 Personal Loan</option>
                          <option value="Friend">🤝 Friend/Other</option>
                        </select>
                      </div>
                    </>
                  ) : loanRegistrationMode === 'simple' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <input 
                        type="number" 
                        placeholder="EMI Amount (₹)" 
                        value={newLoan.emi}
                        onChange={(e) => setNewLoan({ ...newLoan, emi: e.target.value })}
                        style={{ width: '50%' }}
                        required
                      />
                      <input 
                        type="number" 
                        placeholder="Tenure (months)" 
                        value={newLoan.tenure}
                        onChange={(e) => setNewLoan({ ...newLoan, tenure: e.target.value })}
                        style={{ width: '50%' }}
                        required
                      />
                    </div>
                  ) : loanRegistrationMode === 'flexible' ? (
                    <>
                      <input 
                        type="number" 
                        placeholder="Total Borrowed Amount (Principal) (₹)" 
                        value={newLoan.principal}
                        onChange={(e) => setNewLoan({ ...newLoan, principal: e.target.value })}
                        required
                      />
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <select 
                          value={newLoan.type}
                          onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                          style={{ width: '100%' }}
                        >
                          <option value="Friend">🤝 Friend/Relative</option>
                          <option value="Personal">💳 Personal Loan</option>
                          <option value="Home">🏠 Home Loan</option>
                          <option value="Car">🚗 Car Loan</option>
                        </select>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '0.25rem' }}>
                        ℹ️ <strong>No monthly EMI or tenure required:</strong> This tab is designed for informal debts (like from <strong>Ankit, Nithin, or Param</strong>) where you only enter the amount. You can repay them slowly in small chunks or in full at any time, completely at your convenience.
                      </p>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input 
                          type="number" 
                          placeholder="Principal Amount (₹)" 
                          value={newLoan.principal}
                          onChange={(e) => setNewLoan({ ...newLoan, principal: e.target.value })}
                          style={{ width: '50%' }}
                          required
                        />
                        <input 
                          type="number" 
                          placeholder="Interest Rate p.a. (%)" 
                          value={newLoan.rate}
                          onChange={(e) => setNewLoan({ ...newLoan, rate: e.target.value })}
                          style={{ width: '50%' }}
                          required
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <input 
                          type="number" 
                          placeholder="Tenure (months)" 
                          value={newLoan.tenure}
                          onChange={(e) => setNewLoan({ ...newLoan, tenure: e.target.value })}
                          style={{ width: '50%' }}
                          required
                        />
                        <select 
                          value={newLoan.type}
                          onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                          style={{ width: '50%' }}
                        >
                          <option value="Home">🏠 Home Loan</option>
                          <option value="Car">🚗 Car Loan</option>
                          <option value="Personal">💳 Personal Loan</option>
                          <option value="Friend">🤝 Friend/Other</option>
                        </select>
                      </div>
                    </>
                  )}

                  {loanRegistrationMode !== 'slice' && loanRegistrationMode !== 'flexible' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <select 
                        value={newLoan.type}
                        onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                        style={{ width: '100%', display: loanRegistrationMode === 'simple' ? 'block' : 'none' }}
                      >
                        <option value="Home">🏠 Home Loan</option>
                        <option value="Car">🚗 Car Loan</option>
                        <option value="Personal">💳 Personal Loan</option>
                        <option value="Friend">🤝 Friend/Other</option>
                      </select>
                    </div>
                  )}
                  
                  <input 
                    type="text" 
                    placeholder="Lender / Bank name" 
                    value={newLoan.lender}
                    onChange={(e) => setNewLoan({ ...newLoan, lender: e.target.value })}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Prepayment Priority Weight</label>
                    <select 
                      value={newLoan.prepayPriority || 'MEDIUM'}
                      onChange={(e) => setNewLoan({ ...newLoan, prepayPriority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE' })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                    >
                      <option value="HIGH">🔥 High Priority (Prepay First)</option>
                      <option value="MEDIUM">⚡ Medium Priority (Standard)</option>
                      <option value="LOW">🐢 Low Priority (Prepay Last)</option>
                      <option value="EXCLUDE">❌ Exclude (No Extra Prepayments)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Debt Category</label>
                      <select
                        value={newLoan.debtType || 'personal_loan'}
                        onChange={(e) => setNewLoan({ ...newLoan, debtType: e.target.value as any })}
                        style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                      >
                        <option value="personal_loan">💳 Personal Loan</option>
                        <option value="credit_card">🛍️ Credit Card</option>
                        <option value="friend">🤝 Friend Loan</option>
                        <option value="family">🏡 Family Loan</option>
                        <option value="salary_advance">💸 Salary Advance</option>
                        <option value="bnpl">📱 BNPL (Slice/Paylater)</option>
                      </select>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payoff Priority</label>
                      <select
                        value={newLoan.priority || 'medium'}
                        onChange={(e) => setNewLoan({ ...newLoan, priority: e.target.value as any })}
                        style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                      >
                        <option value="critical">🚨 Critical (Pay immediately)</option>
                        <option value="high">🔥 High</option>
                        <option value="medium">⚡ Medium</option>
                        <option value="low">🐢 Low (Flexible)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Anxiety & Emotional Stress</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{newLoan.emotionalStressScore || 50}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newLoan.emotionalStressScore || 50}
                      onChange={(e) => setNewLoan({ ...newLoan, emotionalStressScore: parseInt(e.target.value) })}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Lender Flexibility</span>
                      <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{newLoan.flexibilityScore || 50}/100</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={newLoan.flexibilityScore || 50}
                      onChange={(e) => setNewLoan({ ...newLoan, flexibilityScore: parseInt(e.target.value) })}
                      style={{ accentColor: 'var(--secondary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newLoan.allowSkipPayment || false}
                        onChange={(e) => setNewLoan({ ...newLoan, allowSkipPayment: e.target.checked })}
                      />
                      Allow Skip Payment (under stress)
                    </label>
                  </div>
                  
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Register Loan Schedule
                  </button>
                </form>

                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                    <Upload size={16} style={{ color: 'var(--primary)' }} />
                    Upload repayment schedule
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Supports CSV, XLSX, and PDF schedules. Columns are auto-detected from the file.
                  </p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.pdf"
                    onChange={(e) => {
                      setScheduleFile(e.target.files?.[0] || null);
                      setScheduleUploadError('');
                      setScheduleUploadResult(null);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleUploadRepaymentSchedule}
                    disabled={isUploadingSchedule || !scheduleFile}
                    style={{ width: '100%' }}
                  >
                    {isUploadingSchedule ? 'Reading schedule...' : 'Read Schedule File'}
                  </button>

                  {scheduleUploadError && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--warning)', lineHeight: 1.5 }}>
                      {scheduleUploadError}
                    </div>
                  )}

                  {scheduleUploadResult && scheduleUploadResult.payments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Found {scheduleUploadResult.payments.length} installments from {scheduleUploadResult.payments[0].dueDate} to {scheduleUploadResult.payments[scheduleUploadResult.payments.length - 1].dueDate}.
                      </div>
                      {scheduleUploadResult.warnings.map((warning, idx) => (
                        <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--warning)' }}>{warning}</div>
                      ))}

                      <input
                        type="text"
                        placeholder="Loan name"
                        value={scheduleUploadForm.name}
                        onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, name: e.target.value })}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                          type="number"
                          placeholder="Principal"
                          value={scheduleUploadForm.principal}
                          onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, principal: e.target.value })}
                          style={{ width: '50%' }}
                        />
                        <input
                          type="number"
                          placeholder="Interest rate"
                          value={scheduleUploadForm.rate}
                          onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, rate: e.target.value })}
                          style={{ width: '50%' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                          type="number"
                          placeholder="EMI"
                          value={scheduleUploadForm.emi}
                          onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, emi: e.target.value })}
                          style={{ width: '50%' }}
                        />
                        <input
                          type="number"
                          placeholder="Tenure"
                          value={scheduleUploadForm.tenure}
                          onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, tenure: e.target.value })}
                          style={{ width: '50%' }}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Lender / Bank name"
                        value={scheduleUploadForm.lender}
                        onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, lender: e.target.value })}
                      />
                      <select
                        value={scheduleUploadForm.type}
                        onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, type: e.target.value })}
                      >
                        <option value="Home">Home Loan</option>
                        <option value="Car">Car Loan</option>
                        <option value="Personal">Personal Loan</option>
                        <option value="Friend">Friend/Other</option>
                      </select>
                      <select
                        value={scheduleUploadForm.prepayPriority || 'MEDIUM'}
                        onChange={(e) => setScheduleUploadForm({ ...scheduleUploadForm, prepayPriority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE' })}
                      >
                        <option value="HIGH">🔥 High Priority (Prepay First)</option>
                        <option value="MEDIUM">⚡ Medium Priority (Standard)</option>
                        <option value="LOW">🐢 Low Priority (Prepay Last)</option>
                        <option value="EXCLUDE">❌ Exclude (No Extra Prepayments)</option>
                      </select>
                      <button type="button" className="btn btn-primary" onClick={handleCreateLoanFromSchedule}>
                        Create Debt From Uploaded Schedule
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Loans List and EMI checklist */}
              <div className="premium-card" style={{ gridColumn: 'span 2' }}>
                <h3>Active Loans Amortization Tracker</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                  {loansWithPayments.map(lw => {
                    const paidCount = lw.payments.filter(p => p.isPaid).length;
                    const totalCount = lw.payments.length;
                    const pct = Math.round((paidCount / totalCount) * 100) || 0;
                    
                    const remainingBalance = lw.payments.filter(p => !p.isPaid).reduce((sum, p) => sum + p.amount, 0);
                    
                    const isEditing = editingLoanId === lw.loan.id;
                    const isCollapsed = collapsedLoanIds[lw.loan.id];
                    const monthsLeft = lw.payments.filter(p => !p.isPaid).length;
                    const isFlexibleLoan = lw.loan.emi === 0;
                    const hasRemainingBalance = remainingBalance > 0;
                    const hasRate = lw.loan.rate > 0;
                    const hasEmiAndRate = lw.loan.rate > 0 && lw.loan.emi > 0;
                    const paidAmount = lw.loan.principal - remainingBalance;
                    const paidAmtPct = lw.loan.principal > 0 ? Math.round((paidAmount / lw.loan.principal) * 100) : 0;
                    const progressLabel = isFlexibleLoan
                      ? `Anytime Payoff Progress: ${userProfile.currency}${paidAmount.toLocaleString()} of ${userProfile.currency}${lw.loan.principal.toLocaleString()} paid`
                      : `EMI progress: ${paidCount}/${totalCount} payments ticked`;
                    const progressPct = isFlexibleLoan ? paidAmtPct : pct;
                    
                    return (
                      <div key={lw.loan.id} style={{ 
                        border: isEditing ? '1px solid var(--primary)' : '1px solid var(--border-color)', 
                        borderRadius: '16px', 
                        padding: '1.25rem', 
                        background: isEditing ? 'rgba(168,85,247,0.03)' : 'rgba(255,255,255,0.01)',
                        boxShadow: isEditing ? '0 0 15px rgba(168,85,247,0.1)' : 'none'
                      }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <input
                                type="text"
                                placeholder="Loan Name"
                                value={editLoanForm.name}
                                onChange={(e) => setEditLoanForm({ ...editLoanForm, name: e.target.value })}
                                style={{ width: '50%', padding: '0.4rem 0.75rem' }}
                                required
                              />
                              <input
                                type="text"
                                placeholder="Lender"
                                value={editLoanForm.lender}
                                onChange={(e) => setEditLoanForm({ ...editLoanForm, lender: e.target.value })}
                                style={{ width: '50%', padding: '0.4rem 0.75rem' }}
                                required
                              />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount Borrowed (Principal)</label>
                                <input
                                  type="number"
                                  placeholder="Principal"
                                  value={editLoanForm.principal}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, principal: e.target.value })}
                                  style={{ width: '100%', padding: '0.4rem 0.75rem' }}
                                  required
                                />
                              </div>
                              <div style={{ width: '33%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interest Rate (%)</label>
                                <input
                                  type="number"
                                  placeholder="Rate"
                                  value={editLoanForm.rate}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, rate: e.target.value })}
                                  style={{ width: '100%', padding: '0.4rem 0.75rem' }}
                                  required
                                />
                              </div>
                              <div style={{ width: '34%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMI (₹)</label>
                                <input
                                  type="number"
                                  placeholder="EMI"
                                  value={editLoanForm.emi}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, emi: e.target.value })}
                                  style={{ width: '100%', padding: '0.4rem 0.75rem' }}
                                  required
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tenure (months)</label>
                                <input
                                  type="number"
                                  placeholder="Tenure"
                                  value={editLoanForm.tenure}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, tenure: e.target.value })}
                                  style={{ width: '100%', padding: '0.4rem 0.75rem' }}
                                  required
                                />
                              </div>
                              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loan Category</label>
                                <select
                                  value={editLoanForm.type}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, type: e.target.value })}
                                  style={{ width: '100%', padding: '0.4rem' }}
                                >
                                  <option value="Home">🏠 Home Loan</option>
                                  <option value="Car">🚗 Car Loan</option>
                                  <option value="Personal">💳 Personal Loan</option>
                                  <option value="Friend">🤝 Friend/Other</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prepayment Priority</label>
                                <select
                                  value={editLoanForm.prepayPriority || 'MEDIUM'}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, prepayPriority: e.target.value as 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE' })}
                                  style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                                >
                                  <option value="HIGH">🔥 High Priority (Prepay First)</option>
                                  <option value="MEDIUM">⚡ Medium Priority (Standard)</option>
                                  <option value="LOW">🐢 Low Priority (Prepay Last)</option>
                                  <option value="EXCLUDE">❌ Exclude (No Extra Prepayments)</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Debt Category</label>
                                <select
                                  value={editLoanForm.debtType || 'personal_loan'}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, debtType: e.target.value as any })}
                                  style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                                >
                                  <option value="personal_loan">💳 Personal Loan</option>
                                  <option value="credit_card">🛍️ Credit Card</option>
                                  <option value="friend">🤝 Friend Loan</option>
                                  <option value="family">🏡 Family Loan</option>
                                  <option value="salary_advance">💸 Salary Advance</option>
                                  <option value="bnpl">📱 BNPL (Slice/Paylater)</option>
                                </select>
                              </div>

                              <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payoff Priority</label>
                                <select
                                  value={editLoanForm.priority || 'medium'}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, priority: e.target.value as any })}
                                  style={{ width: '100%', padding: '0.45rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                                >
                                  <option value="critical">🚨 Critical (Pay first)</option>
                                  <option value="high">🔥 High</option>
                                  <option value="medium">⚡ Medium</option>
                                  <option value="low">🐢 Low (Flexible)</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>Anxiety & Emotional Stress</span>
                                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{editLoanForm.emotionalStressScore || 50}/100</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editLoanForm.emotionalStressScore || 50}
                                onChange={(e) => setEditLoanForm({ ...editLoanForm, emotionalStressScore: parseInt(e.target.value) })}
                                style={{ accentColor: 'var(--accent)', width: '100%' }}
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>Lender Flexibility</span>
                                <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{editLoanForm.flexibilityScore || 50}/100</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={editLoanForm.flexibilityScore || 50}
                                onChange={(e) => setEditLoanForm({ ...editLoanForm, flexibilityScore: parseInt(e.target.value) })}
                                style={{ accentColor: 'var(--secondary)', width: '100%' }}
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={editLoanForm.allowSkipPayment || false}
                                  onChange={(e) => setEditLoanForm({ ...editLoanForm, allowSkipPayment: e.target.checked })}
                                />
                                Allow Skip Payment (under stress)
                              </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => handleUpdateLoan(lw.loan.id)}
                              >
                                Save Changes
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => setEditingLoanId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                              onClick={() => toggleLoanCollapse(lw.loan.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, marginRight: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  {isCollapsed ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{lw.loan.name}</h4>
                                    {getPriorityBadge(lw.loan.prepayPriority)}
                                  </div>
                                  
                                  {isCollapsed ? (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', rowGap: '0.25rem' }}>
                                      <span>Lender: {lw.loan.lender}</span>
                                      <span style={{ opacity: 0.3 }}>•</span>
                                      <span>Type: {lw.loan.type}</span>
                                      <span style={{ opacity: 0.3 }}>•</span>
                                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                                        Outstanding: {userProfile.currency}{remainingBalance.toLocaleString()} / {userProfile.currency}{lw.loan.principal.toLocaleString()}
                                      </span>
                                      <span style={{ opacity: 0.3 }}>•</span>
                                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                        🕒 {monthsLeft} month{monthsLeft !== 1 ? 's' : ''} left
                                      </span>
                                      <span style={{ opacity: 0.3 }}>•</span>
                                      <span style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                                        {pct}% paid
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                      Lender: {lw.loan.lender} • Type: {lw.loan.type}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>{userProfile.currency}{remainingBalance.toLocaleString()} left</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {lw.loan.emi === 0 ? 'Flexible (No EMI)' : `EMI: ${userProfile.currency}${lw.loan.emi.toLocaleString()}`}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', borderColor: 'var(--primary)' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingLoanId(lw.loan.id);
                                      setEditLoanForm({
                                        name: lw.loan.name,
                                        principal: String(lw.loan.principal),
                                        rate: String(lw.loan.rate),
                                        tenure: String(lw.loan.tenure),
                                        emi: String(lw.loan.emi),
                                        lender: lw.loan.lender,
                                        type: lw.loan.type,
                                        prepayPriority: lw.loan.prepayPriority || 'MEDIUM',
                                        
                                        outstandingAmount: String(lw.loan.outstandingAmount || lw.loan.principal),
                                        debtType: lw.loan.debtType || 'personal_loan',
                                        priority: lw.loan.priority || 'medium',
                                        flexibilityScore: lw.loan.flexibilityScore || 50,
                                        emotionalStressScore: lw.loan.emotionalStressScore || 50,
                                        penaltyRiskScore: lw.loan.penaltyRiskScore || 50,
                                        relationshipRisk: lw.loan.relationshipRisk || 50,
                                        allowSkipPayment: lw.loan.allowSkipPayment || false,
                                        minimumRequired: String(lw.loan.minimumRequired || 0),
                                        dueDate: lw.loan.dueDate || '',
                                        settlementEligible: lw.loan.settlementEligible || false
                                      });

                                    }}
                                  >
                                    Edit Details
                                  </button>
                                  <button 
                                    className="btn btn-secondary" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLoan(lw.loan.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>💰 Amount Borrowed: {userProfile.currency}{lw.loan.principal.toLocaleString()}</span>
                                  {hasRate && (
                                    <span style={{ color: 'var(--warning)', fontWeight: 500 }}>📈 Interest Rate: {lw.loan.rate}% p.a.</span>
                                  )}
                                  {hasEmiAndRate && (
                                    <span style={{ color: 'var(--text-dimmed)' }}>
                                      Scheduled Total Interest Cost: {userProfile.currency}{Math.max(0, Math.round((lw.loan.emi * lw.loan.tenure) - lw.loan.principal)).toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                    <span>{progressLabel}</span>
                                    <span>{progressPct}% Paid</span>
                                  </div>
                                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--success), #059669)', borderRadius: '4px' }}></div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {!isCollapsed && (
                          <div>
                            {!isFlexibleLoan && (
                              <>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', marginTop: '1rem' }}>EMI Installment Overview Grid (Tick to clear):</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '110px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
                                  {lw.payments.map((p, idx) => (
                                    <label key={p.id} className="emi-checkbox-container" title={`Due: ${p.dueDate}`}>
                                      <input 
                                        type="checkbox" 
                                        className="emi-checkbox-input"
                                        checked={p.isPaid}
                                        onChange={() => handleToggleEmiPayment(lw.loan.id, p.id, p.isPaid)}
                                      />
                                      <span className="emi-checkbox-custom" style={{ 
                                        background: p.isPaid ? '' : 'rgba(255,255,255,0.03)',
                                        borderColor: p.isPaid ? '' : 'rgba(255,255,255,0.1)'
                                      }}>
                                        {p.isPaid ? '✓' : idx + 1}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </>
                            )}

                            {isFlexibleLoan && (
                              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', marginTop: '1rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                  <Sparkles size={14} /> Flexible Anytime Repayment Controller (Pay Slowly or in Full)
                                </span>
                                
                                {hasRemainingBalance ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                      💡 Ankit, Nithin, and Param loans are <strong>flexible, non-mandatory debts</strong> with ₹0 required monthly EMI. Type any payment amount below and press Enter/blur to record repayment, or close it entirely in a single go.
                                    </p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                                      <div style={{ position: 'relative', width: '150px' }}>
                                        <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                                        <input 
                                          type="number" 
                                          placeholder="Prepay Amount (₹)"
                                          onBlur={(evt) => {
                                            const val = parseFloat(evt.target.value);
                                            if (isNaN(val) || val <= 0) return;
                                            const unpaid = lw.payments.find(p => !p.isPaid);
                                            if (unpaid) {
                                              if (val >= remainingBalance) {
                                                handleToggleEmiPayment(lw.loan.id, unpaid.id, false);
                                              } else {
                                                handleUpdateEmiAmount(lw.loan.id, unpaid.id, remainingBalance - val);
                                              }
                                            }
                                            evt.target.value = '';
                                          }}
                                          onKeyDown={(evt) => {
                                            if (evt.key === 'Enter') {
                                              const target = evt.target as HTMLInputElement;
                                              const val = parseFloat(target.value);
                                              if (isNaN(val) || val <= 0) return;
                                              const unpaid = lw.payments.find(p => !p.isPaid);
                                              if (unpaid) {
                                                if (val >= remainingBalance) {
                                                  handleToggleEmiPayment(lw.loan.id, unpaid.id, false);
                                                } else {
                                                  handleUpdateEmiAmount(lw.loan.id, unpaid.id, remainingBalance - val);
                                                }
                                              }
                                              target.value = '';
                                              target.blur();
                                            }
                                          }}
                                          style={{ width: '100%', padding: '0.35rem 0.5rem 0.35rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                          title="Type paid amount to subtract from flexible outstanding debt"
                                        />
                                      </div>
                                      
                                      <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
                                        onClick={() => {
                                          const unpaid = lw.payments.find(p => !p.isPaid);
                                          if (unpaid) {
                                            handleToggleEmiPayment(lw.loan.id, unpaid.id, false);
                                          }
                                        }}
                                      >
                                        Close Debt in Full
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center', padding: '0.5rem' }}>🎉 Flexible debt fully paid off!</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. AI PAYOFF PLANNER & WHAT-IF SIMULATOR */}
        {activeTab === 'planner' && (
          <div>
            <div className="premium-card glow-card" style={{ marginBottom: '2rem', borderLeftWidth: '5px', borderLeftColor: 'var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>Smart Payoff Context Simulator</h3>
                {!aiKey && <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '8px', marginLeft: '0.5rem' }}>Add Claude API key in Settings for smarter AI parsing</span>}
                <button
                  onClick={handleRefreshData}
                  disabled={isRefreshingData}
                  className="btn btn-secondary"
                  style={{
                    marginLeft: 'auto',
                    padding: '0.4rem 1rem',
                    fontSize: '0.85rem',
                    borderRadius: '10px',
                    borderColor: 'var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  title="Reload income, expenses, and loans from database to simulate fresh data"
                >
                  <RotateCcw 
                    size={14} 
                    style={{ 
                      animation: isRefreshingData ? 'spin 1s linear infinite' : 'none' 
                    }} 
                  />
                  {isRefreshingData ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                Describe any future financial event in plain English — job switch, bonus, extra payment, salary hike, FD maturity, etc. The AI will extract and simulate it automatically.
              </p>

              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <textarea
                    placeholder={"Try: 'I'm switching jobs next month with a joining bonus of ₹1,50,000'\nOr: 'Got a 30% hike, planning to put ₹8000 extra towards loans every month'\nOr: 'My FD of 2 lakhs matures in 3 months'"}
                    value={simCustomText}
                    onChange={(e) => setSimCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        calculateAiProjections();
                      }
                    }}
                    rows={3}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.95rem',
                      lineHeight: '1.5',
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(168,85,247,0.25)',
                      color: 'white',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', bottom: '0.5rem', right: '0.75rem', fontSize: '0.7rem', color: 'var(--text-dimmed)' }}>Ctrl+Enter to run</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={calculateAiProjections}
                    disabled={isRecalculating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      minWidth: '180px',
                      justifyContent: 'center',
                      opacity: isRecalculating ? 0.8 : 1,
                      cursor: isRecalculating ? 'not-allowed' : 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isRecalculating ? (
                      <>
                        <span style={{
                          width: '16px', height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.7s linear infinite'
                        }} />
                        Analysing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Recalculate Plan
                      </>
                    )}
                  </button>
                  {isRecalculating && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', animation: 'pulse 1.2s ease-in-out infinite' }}>
                      {aiKey ? '🤖 Parsing your prompt with Claude AI...' : '⚙️ Running simulation engine...'}
                    </span>
                  )}
                  {!isRecalculating && simCustomText && !nlpParsedResult && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>Press Ctrl+Enter or click to analyse</span>
                  )}
                </div>

                {/* NLP Result Banner */}
                {nlpParsedResult && !isRecalculating && (
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(168,85,247,0.08)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                      <Sparkles size={14} /> 🤖 AI Understood
                    </div>
                    <div style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'white' }}>"{nlpParsedResult.description}"</div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {nlpParsedResult.lumpSum > 0 && (
                        <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                          💰 One-time ₹{nlpParsedResult.lumpSum.toLocaleString()}
                        </span>
                      )}
                      {nlpParsedResult.salaryHikePercent > 0 && (
                        <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                          📈 +{nlpParsedResult.salaryHikePercent}% salary hike
                        </span>
                      )}
                      {nlpParsedResult.extraMonthly > 0 && (
                        <span style={{ fontSize: '0.8rem', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                          💳 +₹{nlpParsedResult.extraMonthly.toLocaleString()}/month extra
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>


            {aiAnalysis && (
              <div className="dashboard-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {/* Card 1: Safe To Spend */}
                <div className="premium-card glow-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)', borderColor: 'var(--success)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>💰 Safe-To-Spend Buffer</span>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#34d399' }}>
                    {userProfile.currency}{Math.max(0, totalIncome - totalExpenses - totalEMI - userProfile.savingsGoal).toLocaleString()}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Surplus left for guilt-free spend after meeting all EMIs ({userProfile.currency}{totalEMI.toLocaleString()}), essentials ({userProfile.currency}{totalExpenses.toLocaleString()}), and your {userProfile.currency}{userProfile.savingsGoal.toLocaleString()} savings goal.
                  </p>
                </div>

                {/* Card 2: Financial Stress Score Gauge */}
                <div className="premium-card" style={{ background: 'rgba(255,255,255,0.01)', borderColor: (aiAnalysis.financialStressScore || 50) > 75 ? 'var(--danger)' : (aiAnalysis.financialStressScore || 50) > 45 ? 'var(--warning)' : 'var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>🧠 Financial Stress Score</span>
                    <span style={{ 
                      background: (aiAnalysis.financialStressScore || 50) > 75 ? 'rgba(239, 68, 68, 0.15)' : (aiAnalysis.financialStressScore || 50) > 45 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: (aiAnalysis.financialStressScore || 50) > 75 ? '#f87171' : (aiAnalysis.financialStressScore || 50) > 45 ? '#fbbf24' : '#c084fc',
                      padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 
                    }}>
                      {(aiAnalysis.financialStressScore || 50) > 75 ? 'Critical' : (aiAnalysis.financialStressScore || 50) > 45 ? 'Moderate' : 'Healthy'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                    {aiAnalysis.financialStressScore || 50}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
                  </h2>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${aiAnalysis.financialStressScore || 50}%`, 
                      background: (aiAnalysis.financialStressScore || 50) > 75 ? 'var(--danger)' : (aiAnalysis.financialStressScore || 50) > 45 ? 'var(--warning)' : 'linear-gradient(90deg, var(--primary), var(--secondary))',
                      borderRadius: '3px' 
                    }}></div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Calculated based on debt-to-income ratio, flexibility metrics, and savings resilience cushion.
                  </p>
                </div>

                {/* Card 3: Collection Risk & Warnings */}
                <div className="premium-card glow-card" style={{ 
                  background: aiAnalysis.harassmentRiskLevel?.includes('AGGRESSIVE') ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.05) 100%)' : 'rgba(255,255,255,0.01)',
                  borderColor: aiAnalysis.harassmentRiskLevel?.includes('AGGRESSIVE') ? 'var(--danger)' : 'var(--border-color)' 
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>🛡️ Collector & Legal Risk</span>
                  <h3 style={{ margin: '0.5rem 0 0.25rem 0', fontSize: '1.15rem', color: aiAnalysis.harassmentRiskLevel?.includes('AGGRESSIVE') ? '#f87171' : '#c084fc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertTriangle size={16} /> {aiAnalysis.harassmentRiskLevel || 'LOW RISK'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {aiAnalysis.harassmentRiskLevel?.includes('AGGRESSIVE') 
                      ? '⚠️ Critical Warning: Creditors are highly active. Prioritize critical EMIs first or shift into Survival Mode to preserve primary legal buffers.' 
                      : 'All lenders are currently showing highly flexible/low-hostility profiles. Repayment terms remain cooperative.'}
                  </p>
                  
                  {/* Danger Cash Deficit period warning */}
                  {totalIncome < totalEMI + totalExpenses && (
                    <div style={{ marginTop: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                      ⚠️ Potential cashflow deficit next month (EMIs + essentials exceed income).
                    </div>
                  )}
                </div>

                {/* Card 4: Skip & AI Coaching Deferrals */}
                <div className="premium-card">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>💡 AI Smart Skip Recommendations</span>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {aiAnalysis.skipSuggestions && aiAnalysis.skipSuggestions.map((suggestion, idx) => (
                      <div key={idx} style={{ 
                        fontSize: '0.78rem', 
                        padding: '0.5rem 0.75rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.04)', 
                        borderRadius: '8px',
                        lineHeight: '1.3',
                        color: 'var(--text-main)'
                      }}>
                        {suggestion}
                      </div>
                    ))}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      Success Probability Score: <strong>{aiAnalysis.confidenceScore || 85}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="dashboard-grid">

              {/* Sliders card */}
              <div className="premium-card">
                <h3>What-If Payoff Planner Simulator</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Adjust variables to instantly view side-by-side strategy charts.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Extra Monthly Prepays:</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{userProfile.currency}{simExtraMonthly.toLocaleString()}/mo</span>
                    </div>
                    <input 
                      type="range" 
                      className="premium-slider"
                      min="0" 
                      max="50000" 
                      step="1000" 
                      value={simExtraMonthly}
                      onChange={(e) => setSimExtraMonthly(parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>One-Time Lump Sum Prepay:</span>
                      <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{userProfile.currency}{simLumpSum.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      className="premium-slider"
                      min="0" 
                      max="300000" 
                      step="5000" 
                      value={simLumpSum}
                      onChange={(e) => setSimLumpSum(parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)' }}>Simulated FD/bonus maturity in 3 months</span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Anticipated Salary Increase:</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>{simSalaryHike}%</span>
                    </div>
                    <input 
                      type="range" 
                      className="premium-slider"
                      min="0" 
                      max="50" 
                      step="2" 
                      value={simSalaryHike}
                      onChange={(e) => setSimSalaryHike(parseInt(e.target.value))}
                    />
                  </div>

                  <button className="btn btn-secondary" onClick={() => {
                    setSimExtraMonthly(5000);
                    setSimLumpSum(50000);
                    setSimSalaryHike(10);
                    setSimCustomText('');
                    calculateAiProjectionsLocal();
                  }} style={{ width: '100%' }}>
                    <RotateCcw size={16} /> Reset Sliders
                  </button>
                </div>
              </div>

              {/* Comparative analytics graph */}
              <div className="premium-card" style={{ gridColumn: 'span 2' }}>
                <h3>AI Payoff Strategy Side-By-Side Comparison</h3>
                
                {aiAnalysis && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div 
                        onClick={() => { setSelectedStrategy('Avalanche'); setShowAllSimMonths(false); }}
                        style={{ 
                          padding: '1rem', 
                          background: 'rgba(168, 85, 247, 0.08)', 
                          border: selectedStrategy === 'Avalanche' ? '2px solid var(--primary)' : '1px solid rgba(168, 85, 247, 0.15)', 
                          borderRadius: '12px', 
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: selectedStrategy === 'Avalanche' ? '0 0 15px rgba(168, 85, 247, 0.3)' : 'none',
                          transition: 'all 0.3s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avalanche Saved</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                          {userProfile.currency}{aiAnalysis.avalanche.interestSaved.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 600 }}>
                          {aiAnalysis.avalanche.monthsSaved} Months Faster!
                        </div>
                      </div>

                      <div 
                        onClick={() => { setSelectedStrategy('Snowball'); setShowAllSimMonths(false); }}
                        style={{ 
                          padding: '1rem', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          border: selectedStrategy === 'Snowball' ? '2px solid var(--secondary)' : '1px solid rgba(99, 102, 241, 0.15)', 
                          borderRadius: '12px', 
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: selectedStrategy === 'Snowball' ? '0 0 15px rgba(99, 102, 241, 0.3)' : 'none',
                          transition: 'all 0.3s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Snowball Saved</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.25rem' }}>
                          {userProfile.currency}{aiAnalysis.snowball.interestSaved.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 600 }}>
                          {aiAnalysis.snowball.monthsSaved} Months Faster!
                        </div>
                      </div>

                      <div 
                        onClick={() => { setSelectedStrategy('Balanced'); setShowAllSimMonths(false); }}
                        style={{ 
                          padding: '1rem', 
                          background: 'rgba(236, 72, 153, 0.08)', 
                          border: selectedStrategy === 'Balanced' ? '2px solid var(--accent)' : '1px solid rgba(236, 72, 153, 0.15)', 
                          borderRadius: '12px', 
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: selectedStrategy === 'Balanced' ? '0 0 15px rgba(236, 72, 153, 0.3)' : 'none',
                          transition: 'all 0.3s ease',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Balanced Saved</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
                          {userProfile.currency}{aiAnalysis.balanced.interestSaved.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 600 }}>
                          {aiAnalysis.balanced.monthsSaved} Months Faster!
                        </div>
                      </div>
                    </div>

                    {/* Heuristic 0% Interest Warning Banner */}
                    {aiAnalysis.baseline?.totalInterestPaid === 0 && (
                      <div style={{
                        padding: '1rem 1.25rem',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        color: 'var(--text-main)',
                      }}>
                        <Info size={18} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '0.1rem' }} />
                        <div>
                          <strong style={{ color: 'var(--secondary)' }}>💡 Zero-Interest Optimization Note:</strong> All of your active accounts currently have a <strong>0% interest rate</strong> (e.g. interest-free credit card EMIs, personal/friend loans). While prepayments won't save you interest expenses, allocating surplus cash to these accounts will make you completely <strong>debt-free {aiAnalysis.avalanche.monthsSaved} months faster</strong>!
                        </div>
                      </div>
                    )}

                    {/* Payoff Curve Visualizer Chart */}
                    <div style={{ height: '260px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getMergedProjections()}>
                          <defs>
                            <linearGradient id="colorBaselinePlanner" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAvalanchePlanner" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSnowballPlanner" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorBalancedPlanner" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" stroke="var(--text-dimmed)" fontSize={10} />
                          <YAxis stroke="var(--text-dimmed)" fontSize={10} tickFormatter={(v) => `₹${(v/1000)}k`} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(15,10,25,0.95)', 
                              borderColor: 'var(--border-color)', 
                              color: 'white',
                              borderRadius: '8px'
                            }} 
                            formatter={(value: unknown) => [`₹${Number(value || 0).toLocaleString()}`, '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Area name="Baseline (Minimums)" type="monotone" dataKey="Baseline" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorBaselinePlanner)" />
                          <Area name="Avalanche Strategy" type="monotone" dataKey="Avalanche" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAvalanchePlanner)" />
                          <Area name="Snowball Strategy" type="monotone" dataKey="Snowball" stroke="var(--secondary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSnowballPlanner)" />
                          <Area name="Balanced Strategy" type="monotone" dataKey="Balanced" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorBalancedPlanner)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* AI Advice */}
                    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                        <Info size={16} /> Financial Advisory Strategy Note
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: aiAnalysis.advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                    </div>

                    {/* Strategy Comparison Matrix Grid */}
                    <div className="premium-card" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)', boxShadow: '0 4px 30px rgba(0,0,0,0.15)', marginTop: '2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                        <Sparkles size={16} stroke="var(--primary)" /> 📊 Multi-Dimensional Payoff Matrix Grid
                      </div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Comparing Payoff Strategies Qualitatively</h3>
                      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        How different payment allocation schedules compare across emotional stress and mathematical efficiency.
                      </p>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Strategy Dimension</th>
                              <th style={{ padding: '1rem 0.75rem', color: 'var(--primary)', fontWeight: 700 }}>⚡ Avalanche</th>
                              <th style={{ padding: '1rem 0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>❄️ Snowball</th>
                              <th style={{ padding: '1rem 0.75rem', color: 'var(--accent)', fontWeight: 700 }}>🚨 Priority-First</th>
                              <th style={{ padding: '1rem 0.75rem', color: '#f87171', fontWeight: 700 }}>🛡️ Survival Mode</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                              <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Stress Reduction</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#60a5fa' }}>High</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#34d399', fontWeight: 700 }}>🟢 Highest</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#f87171' }}>Low</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Interest Saved</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#34d399', fontWeight: 700 }}>🟢 Highest</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#f87171' }}>Low</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#f87171' }}>Lowest</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                              <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Collector/Harassment Risk</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#60a5fa' }}>Low</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#34d399', fontWeight: 700 }}>🟢 Lowest</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Motivation & Momentum</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#34d399', fontWeight: 700 }}>🟢 Highest</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#60a5fa' }}>High</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#f87171' }}>Low</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                              <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Monthly Cashflow Relief</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#a8a29e' }}>Medium</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#60a5fa' }}>High</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#34d399', fontWeight: 700 }}>🟢 Highest</td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>Simulated Debt-Free Date</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{aiAnalysis.avalanche.debtFreeDate}</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>{aiAnalysis.snowball.debtFreeDate}</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: 'var(--accent)', fontWeight: 700 }}>{aiAnalysis.priorityFirst?.debtFreeDate || 'N/A'}</td>
                              <td style={{ padding: '0.85rem 0.75rem', color: '#f87171', fontWeight: 700 }}>{aiAnalysis.survival?.debtFreeDate || 'N/A'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Dynamic Strategy Repayment Waterfall Breakdown */}
                    <div className="premium-card" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', background: 'rgba(255,255,255,0.01)', boxShadow: '0 4px 30px rgba(0,0,0,0.15)', marginTop: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                            <Sparkles size={16} /> 🔍 Payoff Ledger Waterfall
                          </div>
                          <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.25rem' }}>Repayment Waterfall Timeline: {selectedStrategy} Strategy</h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Active Simulation details of payments made to each individual account.
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', maxWidth: '420px', justifyContent: 'flex-end' }}>
                          {(['Avalanche', 'Snowball', 'Balanced', 'Priority', 'Hybrid', 'CashflowRelief', 'Survival', 'Relationship', 'Adaptive', 'Baseline'] as const).map(strat => (
                            <button
                              key={strat}
                              className={`btn ${selectedStrategy === strat ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ 
                                padding: '0.3rem 0.6rem', 
                                fontSize: '0.74rem', 
                                borderRadius: '6px',
                                background: selectedStrategy === strat ? '' : 'transparent',
                                border: selectedStrategy === strat ? '' : 'none',
                                color: selectedStrategy === strat ? '' : 'var(--text-muted)'
                              }}
                              onClick={() => { setSelectedStrategy(strat); setShowAllSimMonths(false); }}
                            >
                              {strat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(() => {
                          const stratRes = 
                            selectedStrategy === 'Avalanche' ? aiAnalysis.avalanche :
                            selectedStrategy === 'Snowball' ? aiAnalysis.snowball :
                            selectedStrategy === 'Balanced' ? aiAnalysis.balanced :
                            aiAnalysis.baseline;

                          if (!stratRes || !stratRes.projection || stratRes.projection.length <= 1) {
                            return <div style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', textAlign: 'center', padding: '1rem' }}>No active payoff projection available.</div>;
                          }

                          const simulatedMonths = stratRes.projection.slice(1); // skip initial starting point
                          const limit = showAllSimMonths ? simulatedMonths.length : 12;

                          return (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {simulatedMonths.slice(0, limit).map((point, idx) => {
                                  return (
                                    <div 
                                      key={point.month} 
                                      className="premium-card" 
                                      style={{ 
                                        padding: '1rem', 
                                        background: 'rgba(255,255,255,0.01)', 
                                        border: '1px solid rgba(255,255,255,0.03)', 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.85rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                          <span style={{ 
                                            background: selectedStrategy === 'Avalanche' ? 'rgba(168,85,247,0.12)' : selectedStrategy === 'Snowball' ? 'rgba(99,102,241,0.12)' : selectedStrategy === 'Balanced' ? 'rgba(236,72,153,0.12)' : 'rgba(156,163,175,0.12)', 
                                            color: selectedStrategy === 'Avalanche' ? 'var(--primary)' : selectedStrategy === 'Snowball' ? 'var(--secondary)' : selectedStrategy === 'Balanced' ? 'var(--accent)' : 'var(--text-muted)', 
                                            padding: '0.2rem 0.5rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700 
                                          }}>
                                            Month #{idx + 1}
                                          </span>
                                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{point.month}</span>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem' }}>
                                          <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Paid: </span>
                                            <span style={{ fontWeight: 700, color: 'var(--success)' }}>{userProfile.currency}{point.payment.toLocaleString()}</span>
                                          </div>
                                          <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Outstanding: </span>
                                            <span style={{ fontWeight: 700, color: '#fbbf24' }}>{userProfile.currency}{point.balance.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Milestone and stress narrative */}
                                      {(() => {
                                        const clearedLoans = point.details?.filter(snap => snap.remaining === 0 && (snap.minPaid + snap.extraPaid) > 0) || [];
                                        return (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.15rem 0.45rem', borderRadius: '6px', color: 'var(--text-muted)' }}>
                                                🛡️ {point.details?.filter(snap => snap.remaining > 0).length} active debt accounts left
                                              </span>
                                              {clearedLoans.length > 0 ? (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.12)', padding: '0.15rem 0.45rem', borderRadius: '6px', color: '#34d399', fontWeight: 600 }}>
                                                  🧘 Stress Relief: Stress level dropped!
                                                </span>
                                              ) : (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(168,85,247,0.05)', padding: '0.15rem 0.45rem', borderRadius: '6px', color: 'var(--text-dimmed)' }}>
                                                  📉 Repayments progress stable
                                                </span>
                                              )}
                                            </div>
                                            {clearedLoans.length > 0 && (
                                              <div style={{
                                                background: 'linear-gradient(90deg, rgba(16,185,129,0.1) 0%, rgba(99,102,241,0.02) 100%)',
                                                border: '1px solid rgba(16,185,129,0.2)',
                                                borderRadius: '10px',
                                                padding: '0.6rem 0.85rem',
                                                fontSize: '0.82rem',
                                                color: '#34d399',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                              }}>
                                                <span>🎉</span>
                                                <div>
                                                  <strong>Milestone Reached!</strong> {clearedLoans.map(cl => cl.name).join(' & ')} fully ELIMINATED!
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                                        {point.details?.map(snap => {
                                          const paid = snap.minPaid + snap.extraPaid;
                                          if (paid <= 0 && snap.remaining <= 0) return null; // cleared earlier

                                          return (
                                            <div 
                                              key={snap.name} 
                                              style={{ 
                                                background: 'rgba(255,255,255,0.01)', 
                                                border: '1px solid rgba(255,255,255,0.03)', 
                                                borderRadius: '10px', 
                                                padding: '0.75rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.35rem'
                                              }}
                                            >
                                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
                                                <span>{snap.name}</span>
                                                {snap.remaining === 0 && paid > 0 && (
                                                  <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.12)', color: '#34d399', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>
                                                    🎉 Cleared
                                                  </span>
                                                )}
                                              </div>
                                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                  <span>Total Paid:</span>
                                                  <strong style={{ color: paid > 0 ? 'var(--text-main)' : 'var(--text-dimmed)' }}>
                                                    {userProfile.currency}{paid.toLocaleString()}
                                                  </strong>
                                                </div>
                                                {snap.minPaid > 0 && (
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', fontSize: '0.72rem', opacity: 0.85 }}>
                                                    <span>• Min EMI:</span>
                                                    <span>{userProfile.currency}{snap.minPaid.toLocaleString()}</span>
                                                  </div>
                                                )}
                                                {snap.extraPaid > 0 && (
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', fontSize: '0.72rem', opacity: 0.85, color: 'var(--primary)' }}>
                                                    <span>• Prepayment:</span>
                                                    <span style={{ fontWeight: 600 }}>+{userProfile.currency}{snap.extraPaid.toLocaleString()}</span>
                                                  </div>
                                                )}
                                                {snap.interestAccrued > 0 && (
                                                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', fontSize: '0.72rem', opacity: 0.75, color: 'var(--warning)' }}>
                                                    <span>• Interest:</span>
                                                    <span>+{userProfile.currency}{Math.round(snap.interestAccrued).toLocaleString()}</span>
                                                  </div>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                                                  <span>Remaining:</span>
                                                  <span style={{ fontWeight: 600, color: snap.remaining > 0 ? 'var(--text-main)' : 'var(--text-dimmed)' }}>
                                                    {userProfile.currency}{snap.remaining.toLocaleString()}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {simulatedMonths.length > 12 && (
                                <button
                                  className="btn btn-secondary"
                                  style={{ marginTop: '0.5rem', padding: '0.55rem', width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}
                                  onClick={() => setShowAllSimMonths(prev => !prev)}
                                >
                                  {showAllSimMonths ? 'Collapse timeline (First 12 Months)' : `Show Entire Payoff Timeline (${simulatedMonths.length} Months)`}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. ANALYTICS & CALENDAR HEATMAP SCREEN */}
        {activeTab === 'analytics' && (
          <div>
            <div className="dashboard-grid">
              {/* Daily Calendar Heatmap card */}
              <div className="premium-card" style={{ gridColumn: 'span 2' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: 'var(--primary)' }} /> Spending Intensity Calendar Heatmap
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Color-coded daily grid showing spending peaks over the current month.</p>
                
                <div className="calendar-grid">
                  {Array.from({ length: 30 }, (_, idx) => {
                    const day = idx + 1;
                    const dateStr = new Date(Date.now() - (30 - day) * 86400000).toISOString().split('T')[0];
                    const dailyTotal = expenses
                      .filter(e => e.date === dateStr)
                      .reduce((sum, e) => sum + e.amount, 0);
                    
                    let intensityClass = '';
                    if (dailyTotal > 0 && dailyTotal <= 1000) intensityClass = 'calendar-intensity-low';
                    else if (dailyTotal > 1000 && dailyTotal <= 3000) intensityClass = 'calendar-intensity-med';
                    else if (dailyTotal > 3000) intensityClass = 'calendar-intensity-high';
                    
                    return (
                      <div 
                        key={day} 
                        className={`calendar-cell ${intensityClass}`}
                        title={`Day ${day}: ${userProfile.currency}${dailyTotal.toLocaleString()}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '1.5rem', fontSize: '0.75rem', marginTop: '1.25rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}></span> No Spend
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '3px' }}></span> Under ₹1,000
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '3px' }}></span> ₹1,000 - ₹3,000
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.25)', borderRadius: '3px' }}></span> Over ₹3,000
                  </div>
                </div>
              </div>

              {/* Pie Chart Card */}
              <div className="premium-card">
                <h3>Category Breakdowns</h3>
                <div style={{ height: '220px', marginTop: '1rem' }}>
                  {expenses.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-dimmed)', marginTop: '3rem' }}>No transaction history available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Array.from(new Set(expenses.map(e => e.category))).map(cat => ({
                            name: cat,
                            value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--warning)', 'var(--success)'].map((col, idx) => (
                            <Cell key={idx} fill={col} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="premium-card">
              <h3>Profile Settings & Currency Configuration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Primary Username</label>
                  <input 
                    type="text" 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>User Email</label>
                  <input 
                    type="email" 
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '50%' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Primary Currency</label>
                    <select 
                      value={userProfile.currency}
                      onChange={(e) => setUserProfile({ ...userProfile, currency: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="₹">₹ INR (Indian Rupee)</option>
                      <option value="$">$ USD (US Dollar)</option>
                      <option value="€">€ EUR (Euro)</option>
                      <option value="£">£ GBP (Pound Sterling)</option>
                    </select>
                  </div>
                  <div style={{ width: '50%' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Monthly Savings Target</label>
                    <input 
                      type="number" 
                      value={userProfile.savingsGoal}
                      onChange={(e) => setUserProfile({ ...userProfile, savingsGoal: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Custom Claude API Key (Optional)</label>
                  <input 
                    type="password" 
                    placeholder="sk-ant-..." 
                    value={aiKey}
                    onChange={(e) => {
                      setAiKey(e.target.value);
                      localStorage.setItem('claude_api_key', e.target.value);
                    }}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', marginTop: '0.25rem', display: 'block' }}>Connect live Anthropic models for deep, hyper-custom advisory texts.</span>
                </div>

                <button className="btn btn-primary" onClick={() => {
                  localStorage.setItem('profile', JSON.stringify(userProfile));
                  alert('Settings updated successfully!');
                }} style={{ marginTop: '1rem' }}>
                  Save Configuration Details
                </button>
              </div>
            </div>

            {/* Income Manager Integrated in Settings */}
            <div className="premium-card">
              <h3>Monthly Income Stream Channels</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure multiple active salary streams or expected side hustles.</p>

              <form onSubmit={handleAddIncome} style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <select 
                  value={newIncome.type}
                  onChange={(e) => setNewIncome({ ...newIncome, type: e.target.value })}
                  style={{ width: '30%' }}
                >
                  <option value="Salary">💼 Salary</option>
                  <option value="Freelance">🎨 Freelance</option>
                  <option value="Side Income">🚀 Side Income</option>
                  <option value="Rental">🏠 Rental</option>
                </select>

                <input 
                  type="number" 
                  placeholder="Amount (₹)" 
                  value={newIncome.amount}
                  onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  style={{ width: '40%' }}
                  required
                />

                <button type="submit" className="btn btn-primary" style={{ width: '30%' }}>
                  Register Income
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                {incomes.map(inc => (
                  <div key={inc.id} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.01)', border: `1px solid ${editingIncomeId === inc.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`, borderRadius: '12px', transition: 'border-color 0.2s' }}>
                    {editingIncomeId === inc.id ? (
                      /* ─── Inline Edit Row ─── */
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          value={editIncomeForm.type}
                          onChange={(e) => setEditIncomeForm({ ...editIncomeForm, type: e.target.value })}
                          style={{ flex: '0 0 auto', minWidth: '130px' }}
                        >
                          <option value="Salary">💼 Salary</option>
                          <option value="Freelance">🎨 Freelance</option>
                          <option value="Side Income">🚀 Side Income</option>
                          <option value="Rental">🏠 Rental</option>
                          <option value="Bonus">🎁 Bonus</option>
                          <option value="Returns">📈 Returns</option>
                        </select>
                        <div style={{ position: 'relative', flex: '1 1 120px', minWidth: '120px' }}>
                          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: 'var(--primary)', pointerEvents: 'none' }}>₹</span>
                          <input
                            type="number"
                            value={editIncomeForm.amount}
                            onChange={(e) => setEditIncomeForm({ ...editIncomeForm, amount: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') inc.id && handleUpdateIncome(inc.id); if (e.key === 'Escape') setEditingIncomeId(null); }}
                            style={{ width: '100%', paddingLeft: '1.75rem' }}
                            autoFocus
                            placeholder="Amount"
                          />
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
                          onClick={() => inc.id && handleUpdateIncome(inc.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
                          onClick={() => setEditingIncomeId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* ─── Display Row ─── */
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>
                            {inc.type === 'Salary' ? '💼' : inc.type === 'Freelance' ? '🎨' : inc.type === 'Rental' ? '🏠' : inc.type === 'Bonus' ? '🎁' : inc.type === 'Returns' ? '📈' : '🚀'}
                          </span>
                          {inc.type}
                          {inc.isConfirmed === false && <span style={{ fontSize: '0.7rem', color: 'var(--warning)', background: 'rgba(245,158,11,0.1)', padding: '0.1rem 0.4rem', borderRadius: '6px' }}>Expected</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>+{userProfile.currency}{inc.amount.toLocaleString()}</span>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: 'var(--primary)', borderColor: 'rgba(168,85,247,0.25)' }}
                            onClick={() => {
                              setEditingIncomeId(inc.id ?? null);
                              setEditIncomeForm({ type: inc.type, amount: String(inc.amount) });
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => inc.id && handleDeleteIncome(inc.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* QUICK ADD MODAL */}
        {showQuickAdd && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="premium-card glow-card" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
              <button 
                onClick={() => setShowQuickAdd(false)}
                style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
              
              <h3 style={{ marginBottom: '1.5rem' }}>Quickly Add Expense 🍕</h3>
              
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="500" 
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    style={{ width: '100%' }}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Category</label>
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Food & Dining">🍕 Food & Dining</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Utilities & Bills">💡 Utilities & Bills</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Note</label>
                  <input 
                    type="text" 
                    placeholder="Starbucks Coffee" 
                    value={newExpense.note}
                    onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Log Transaction
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
