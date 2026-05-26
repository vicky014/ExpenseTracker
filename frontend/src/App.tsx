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
  Mic, 
  Sparkles,
  Info,
  Award,
  AlertTriangle,
  RotateCcw,
  PieChart as ChartIcon
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
}

interface LoanWithPayments {
  loan: Loan;
  payments: EmiPayment[];
}

interface Budget {
  id?: number;
  userId: number;
  category: string;
  monthlyLimit: number;
}

interface ProjectionPoint {
  month: string;
  balance: number;
  payment: number;
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

  const [newLoan, setNewLoan] = useState({
    name: '',
    principal: '',
    rate: '',
    tenure: '',
    emi: '',
    lender: '',
    type: 'Home'
  });

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

  // Income Inline Edit State
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [editIncomeForm, setEditIncomeForm] = useState<{ type: string; amount: string }>({ type: 'Salary', amount: '' });

  // API Seeding / Synchronizers
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (isOnboarded && incomes.length > 0) {
      calculateAiProjections();
    }
  }, [incomes, expenses, loansWithPayments, simExtraMonthly, simLumpSum, simSalaryHike, isOnboarded]);

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
  const calculateAiProjections = async () => {
    setIsRecalculating(true);
    setNlpParsedResult(null);

    try {
      // ── Step 1: Parse intent from custom text using LLM or backend regex ──
      let parsedLumpSum = simLumpSum;
      let parsedLumpSumOffset = 3;
      let parsedExtraMonthly = simExtraMonthly;
      let parsedSalaryHike = simSalaryHike;
      let parsedDescription = '';

      if (simCustomText.trim()) {
        // Try Claude LLM first (if API key set)
        const llmResult = await parseIntentWithLLM(simCustomText);
        if (llmResult) {
          parsedLumpSum = simLumpSum + (llmResult.lumpSum || 0);
          parsedLumpSumOffset = llmResult.lumpSumMonthOffset || 1;
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

  const calculateAiProjectionsLocal = () => {
    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0) || 28000;
    const totalEmi = loansWithPayments.reduce((sum, item) => sum + item.loan.emi, 0);
    const totalDebtValue = loansWithPayments.reduce((sum, item) => sum + item.loan.principal, 0);
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

    const runSim = (strategy: string) => {
      const localLoans = loansWithPayments.map(lw => ({
        name: lw.loan.name,
        balance: lw.loan.principal - (lw.payments.filter(p => p.isPaid).length * lw.loan.emi),
        rate: lw.loan.rate,
        emi: lw.loan.emi
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
        let activeExtra = activeExtraPool;

        // Lump sum at NLP-detected month offset
        if (monthIndex === effectiveLumpSumOffset) {
          activeExtra += effectiveLumpSum;
        }
        // Salary hike from NLP offset month onward
        if (monthIndex >= effectiveLumpSumOffset) {
          activeExtra += effectiveSalaryHikeAmt;
        }

        // 1. Accrue Interest
        for (const l of localLoans) {
          if (l.balance > 0) {
            const interest = l.balance * ((l.rate / 100) / 12);
            l.balance += interest;
            totalInterest += interest;
          }
        }

        // 2. Pay Minimums
        for (const l of localLoans) {
          if (l.balance > 0) {
            const minPay = Math.min(l.balance, l.emi);
            l.balance -= minPay;
            monthTotalPaid += minPay;
          }
        }

        // 3. Priority Allocation
        if (activeExtra > 0) {
          if (strategy === 'Avalanche') {
            localLoans.sort((a, b) => b.rate - a.rate);
          } else if (strategy === 'Snowball') {
            localLoans.sort((a, b) => a.balance - b.balance);
          } else if (strategy === 'Balanced') {
            const sumBalance = localLoans.reduce((sum, l) => sum + (l.balance > 0 ? l.balance : 0), 0);
            if (sumBalance > 0) {
              for (const l of localLoans) {
                if (l.balance > 0) {
                  const share = (l.balance / sumBalance) * activeExtra;
                  const paid = Math.min(l.balance, share);
                  l.balance -= paid;
                  monthTotalPaid += paid;
                }
              }
              activeExtra = 0;
            }
          }

          if (strategy !== 'Balanced') {
            for (const l of localLoans) {
              if (l.balance > 0 && activeExtra > 0) {
                const paid = Math.min(l.balance, activeExtra);
                l.balance -= paid;
                monthTotalPaid += paid;
                activeExtra -= paid;
              }
            }
          }
        }

        const remaining = localLoans.reduce((sum, l) => sum + (l.balance > 0 ? l.balance : 0), 0);
        points.push({
          month: currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          balance: Math.max(0, Math.round(remaining)),
          payment: Math.round(monthTotalPaid)
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

    // Attach relative metrics
    avalanche.interestSaved = Math.max(0, baseline.totalInterestPaid - avalanche.totalInterestPaid);
    avalanche.monthsSaved = Math.max(0, baseline.debtFreeMonths - avalanche.debtFreeMonths);

    snowball.interestSaved = Math.max(0, baseline.totalInterestPaid - snowball.totalInterestPaid);
    snowball.monthsSaved = Math.max(0, baseline.debtFreeMonths - snowball.debtFreeMonths);

    balanced.interestSaved = Math.max(0, baseline.totalInterestPaid - balanced.totalInterestPaid);
    balanced.monthsSaved = Math.max(0, baseline.debtFreeMonths - balanced.debtFreeMonths);

    const adviceText = `### 💡 Smart Financial Assessment\n\n${nlpAckMsg ? `**Parsed from your input:** *${nlpAckMsg.trim()}*\n\n` : ''}Your monthly net take-home is **${userProfile.currency}${totalIncome.toLocaleString()}** against basic expenses of **${userProfile.currency}${totalExpenses.toLocaleString()}** and monthly EMIs of **${userProfile.currency}${totalEmi.toLocaleString()}**.${effectiveLumpSum > 0 ? `\n\n💰 A lump-sum of **${userProfile.currency}${effectiveLumpSum.toLocaleString()}** will be applied in month ${effectiveLumpSumOffset} to slash your principal.` : ''}${effectiveSalaryHikeAmt > 0 ? `\n\n📈 Your effective monthly surplus increases by **+${userProfile.currency}${Math.round(effectiveSalaryHikeAmt).toLocaleString()}** from month ${effectiveLumpSumOffset} onward.` : ''}\n\n${
      avalanche.monthsSaved > 0 
        ? `#### 🚀 Why the **Avalanche Strategy** wins for you:\n- **Time saved:** You become debt-free **${avalanche.monthsSaved} months sooner** (in ${avalanche.debtFreeDate} rather than ${baseline.debtFreeDate})!\n- **Interest saved:** You keep **${userProfile.currency}${avalanche.interestSaved.toLocaleString()}** in your pocket instead of paying it to lenders.\n- **Action:** Prioritize extra payments directly to your loan with the highest interest rate while keeping minimums active on other loans.` 
        : `To build a strong payoff trajectory, allocate an extra monthly buffer in the What-If slider to kickstart the visual payoff curve!`
    }`;

    setAiAnalysis({
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      totalDebt: totalDebtValue,
      surplusSavings: surplus,
      baseline,
      avalanche,
      snowball,
      balanced,
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

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
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
      startDate: new Date().toISOString().split('T')[0]
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
        type: payload.type
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

    setNewLoan({ name: '', principal: '', rate: '', tenure: '', emi: '', lender: '', type: 'Home' });
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
    const paidCount = item.payments.filter(p => p.isPaid).length;
    return sum + (item.loan.principal - (paidCount * item.loan.emi));
  }, 0);

  const totalEMI = loansWithPayments.reduce((sum, item) => sum + item.loan.emi, 0);
  const netWorth = totalIncome - totalExpenses - totalDebt;

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
                  setNewLoan({ name: '', principal: '', rate: '', tenure: '', emi: '', lender: '', type: 'Home' });
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
                  <div style={{ height: '300px', marginTop: '1.5rem' }}>
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
                    expenses.slice().reverse().map(e => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>
                            -{userProfile.currency}{e.amount.toLocaleString()}
                          </span>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.6rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            onClick={() => e.id && handleDeleteExpense(e.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
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

                <form onSubmit={handleAddLoan} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="Loan Name (e.g. Home Loan SBI)" 
                    value={newLoan.name}
                    onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                    required
                  />
                  
                  {isSimpleLoan ? (
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
                  ) : (
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
                  )}

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isSimpleLoan && (
                      <input 
                        type="number" 
                        placeholder="Tenure (months)" 
                        value={newLoan.tenure}
                        onChange={(e) => setNewLoan({ ...newLoan, tenure: e.target.value })}
                        style={{ width: '50%' }}
                        required
                      />
                    )}
                    <select 
                      value={newLoan.type}
                      onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value })}
                      style={{ width: isSimpleLoan ? '100%' : '50%' }}
                    >
                      <option value="Home">🏠 Home Loan</option>
                      <option value="Car">🚗 Car Loan</option>
                      <option value="Personal">💳 Personal Loan</option>
                      <option value="Friend">🤝 Friend/Other</option>
                    </select>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Lender / Bank name" 
                    value={newLoan.lender}
                    onChange={(e) => setNewLoan({ ...newLoan, lender: e.target.value })}
                  />
                  
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Register Loan Schedule
                  </button>
                </form>
              </div>

              {/* Loans List and EMI checklist */}
              <div className="premium-card" style={{ gridColumn: 'span 2' }}>
                <h3>Active Loans Amortization Tracker</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
                  {loansWithPayments.map(lw => {
                    const paidCount = lw.payments.filter(p => p.isPaid).length;
                    const totalCount = lw.payments.length;
                    const pct = Math.round((paidCount / totalCount) * 100) || 0;
                    const remainingBalance = lw.loan.principal - (paidCount * lw.loan.emi);
                    
                    return (
                      <div key={lw.loan.id} style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.15rem' }}>{lw.loan.name}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lender: {lw.loan.lender} • Type: {lw.loan.type}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700 }}>{userProfile.currency}{remainingBalance.toLocaleString()} left</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMI: {userProfile.currency}{lw.loan.emi.toLocaleString()}</div>
                            </div>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.6rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              onClick={() => handleDeleteLoan(lw.loan.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            <span>EMI progress: {paidCount}/{totalCount} payments ticked</span>
                            <span>{pct}% Paid</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--success), #059669)', borderRadius: '4px' }}></div>
                          </div>
                        </div>

                        {/* Amortization EMI grids for tick off */}
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>EMI Installment Overview Grid (Tick to clear):</span>
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

                          {/* Variable EMI Upcoming adjustments */}
                          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                              <Sparkles size={14} /> Variable Installment Adjuster (Next 3 Months)
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {lw.payments.filter(p => !p.isPaid).slice(0, 3).map((p) => {
                                const idx = lw.payments.findIndex(item => item.id === p.id);
                                return (
                                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 500 }}>Month #{idx + 1} ({new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <div style={{ position: 'relative', width: '110px' }}>
                                        <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹</span>
                                        <input 
                                          type="number" 
                                          defaultValue={p.amount}
                                          onBlur={(e) => handleUpdateEmiAmount(lw.loan.id, p.id, parseFloat(e.target.value))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleUpdateEmiAmount(lw.loan.id, p.id, parseFloat((e.target as HTMLInputElement).value));
                                              (e.target as HTMLInputElement).blur();
                                            }
                                          }}
                                          style={{ width: '100%', padding: '0.35rem 0.5rem 0.35rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px' }}
                                          title="Click to change variable paid amount for this month"
                                        />
                                      </div>
                                      <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
                                        onClick={() => handleToggleEmiPayment(lw.loan.id, p.id, false)}
                                      >
                                        Mark Paid
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              {lw.payments.filter(p => !p.isPaid).length === 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', textAlign: 'center', padding: '0.5rem' }}>🎉 Outstanding debt fully paid off!</div>
                              )}
                            </div>
                          </div>
                        </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>Smart Payoff Context Simulator</h3>
                {!aiKey && <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '8px', marginLeft: '0.5rem' }}>Add Claude API key in Settings for smarter AI parsing</span>}
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
                      <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avalanche Saved</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                          {userProfile.currency}{aiAnalysis.avalanche.interestSaved.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                          {aiAnalysis.avalanche.monthsSaved} Months Faster!
                        </div>
                      </div>

                      <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Snowball Saved</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '0.25rem' }}>
                          {userProfile.currency}{aiAnalysis.snowball.interestSaved.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                          {aiAnalysis.snowball.monthsSaved} Months Faster!
                        </div>
                      </div>

                      <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.15)', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Balanced Saved</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.25rem' }}>
                          {userProfile.currency}{aiAnalysis.balanced.interestSaved.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                          {aiAnalysis.balanced.monthsSaved} Months Faster!
                        </div>
                      </div>
                    </div>

                    {/* AI Advice */}
                    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                        <Info size={16} /> Financial Advisory Strategy Note
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: aiAnalysis.advice.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
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
