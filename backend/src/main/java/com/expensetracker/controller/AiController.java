package com.expensetracker.controller;

import com.expensetracker.model.*;
import com.expensetracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private IncomeSourceRepository incomeSourceRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private AiContextRepository aiContextRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    // Request payload structures
    public static class SimulationRequest {
        private Long userId;
        private Double extraMonthlyPayment;
        private Double lumpSumPrepayment;
        private String lumpSumTargetLoanName;
        private Double salaryHikePercent;
        private String customText;

        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Double getExtraMonthlyPayment() { return extraMonthlyPayment; }
        public void setExtraMonthlyPayment(Double extraMonthlyPayment) { this.extraMonthlyPayment = extraMonthlyPayment; }
        public Double getLumpSumPrepayment() { return lumpSumPrepayment; }
        public void setLumpSumPrepayment(Double lumpSumPrepayment) { this.lumpSumPrepayment = lumpSumPrepayment; }
        public String getLumpSumTargetLoanName() { return lumpSumTargetLoanName; }
        public void setLumpSumTargetLoanName(String lumpSumTargetLoanName) { this.lumpSumTargetLoanName = lumpSumTargetLoanName; }
        public Double getSalaryHikePercent() { return salaryHikePercent; }
        public void setSalaryHikePercent(Double salaryHikePercent) { this.salaryHikePercent = salaryHikePercent; }
        public String getCustomText() { return customText; }
        public void setCustomText(String customText) { this.customText = customText; }
    }

    // Response models
    public static class ProjectionDataPoint {
        private String month;
        private Double balance;
        private Double payment;

        public ProjectionDataPoint(String month, Double balance, Double payment) {
            this.month = month;
            this.balance = Math.max(0.0, Math.round(balance * 100.0) / 100.0);
            this.payment = Math.round(payment * 100.0) / 100.0;
        }

        public String getMonth() { return month; }
        public Double getBalance() { return balance; }
        public Double getPayment() { return payment; }
    }

    public static class StrategyResult {
        private String name;
        private Integer debtFreeMonths;
        private String debtFreeDate;
        private Double totalInterestPaid;
        private Double interestSaved;
        private Integer monthsSaved;
        private List<ProjectionDataPoint> projection;

        public StrategyResult(String name, Integer debtFreeMonths, String debtFreeDate, Double totalInterestPaid, Double interestSaved, Integer monthsSaved, List<ProjectionDataPoint> projection) {
            this.name = name;
            this.debtFreeMonths = debtFreeMonths;
            this.debtFreeDate = debtFreeDate;
            this.totalInterestPaid = totalInterestPaid;
            this.interestSaved = interestSaved;
            this.monthsSaved = monthsSaved;
            this.projection = projection;
        }

        public String getName() { return name; }
        public Integer getDebtFreeMonths() { return debtFreeMonths; }
        public String getDebtFreeDate() { return debtFreeDate; }
        public Double getTotalInterestPaid() { return totalInterestPaid; }
        public Double getInterestSaved() { return interestSaved; }
        public Integer getMonthsSaved() { return monthsSaved; }
        public List<ProjectionDataPoint> getProjection() { return projection; }
    }

    public static class NlpParsedResult {
        private String description;
        private Double lumpSum;
        private Double salaryHikePercent;
        private Double extraMonthly;

        public NlpParsedResult(String description, Double lumpSum, Double salaryHikePercent, Double extraMonthly) {
            this.description = description;
            this.lumpSum = lumpSum;
            this.salaryHikePercent = salaryHikePercent;
            this.extraMonthly = extraMonthly;
        }

        public String getDescription() { return description; }
        public Double getLumpSum() { return lumpSum; }
        public Double getSalaryHikePercent() { return salaryHikePercent; }
        public Double getExtraMonthly() { return extraMonthly; }
    }

    public static class AnalysisResponse {
        private Double monthlyIncome;
        private Double monthlyExpenses;
        private Double totalDebt;
        private Double surplusSavings;
        private StrategyResult baseline;
        private StrategyResult avalanche;
        private StrategyResult snowball;
        private StrategyResult balanced;
        
        // New Strategy Results
        private StrategyResult priorityFirst;
        private StrategyResult hybridEmotional;
        private StrategyResult cashflowRelief;
        private StrategyResult survival;
        private StrategyResult relationshipProtection;
        private StrategyResult aiAdaptive;
        
        // Advanced Analytics
        private Double financialStressScore;
        private String harassmentRiskLevel;
        private Double confidenceScore;
        private List<String> skipSuggestions;
        
        private String advice;
        private NlpParsedResult nlpParsedResult;

        // Getters and Setters
        public Double getMonthlyIncome() { return monthlyIncome; }
        public void setMonthlyIncome(Double monthlyIncome) { this.monthlyIncome = monthlyIncome; }
        public Double getMonthlyExpenses() { return monthlyExpenses; }
        public void setMonthlyExpenses(Double monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }
        public Double getTotalDebt() { return totalDebt; }
        public void setTotalDebt(Double totalDebt) { this.totalDebt = totalDebt; }
        public Double getSurplusSavings() { return surplusSavings; }
        public void setSurplusSavings(Double surplusSavings) { this.surplusSavings = surplusSavings; }
        public StrategyResult getBaseline() { return baseline; }
        public void setBaseline(StrategyResult baseline) { this.baseline = baseline; }
        public StrategyResult getAvalanche() { return avalanche; }
        public void setAvalanche(StrategyResult avalanche) { this.avalanche = avalanche; }
        public StrategyResult getSnowball() { return snowball; }
        public void setSnowball(StrategyResult snowball) { this.snowball = snowball; }
        public StrategyResult getBalanced() { return balanced; }
        public void setBalanced(StrategyResult balanced) { this.balanced = balanced; }
        
        public StrategyResult getPriorityFirst() { return priorityFirst; }
        public void setPriorityFirst(StrategyResult priorityFirst) { this.priorityFirst = priorityFirst; }
        public StrategyResult getHybridEmotional() { return hybridEmotional; }
        public void setHybridEmotional(StrategyResult hybridEmotional) { this.hybridEmotional = hybridEmotional; }
        public StrategyResult getCashflowRelief() { return cashflowRelief; }
        public void setCashflowRelief(StrategyResult cashflowRelief) { this.cashflowRelief = cashflowRelief; }
        public StrategyResult getSurvival() { return survival; }
        public void setSurvival(StrategyResult survival) { this.survival = survival; }
        public StrategyResult getRelationshipProtection() { return relationshipProtection; }
        public void setRelationshipProtection(StrategyResult relationshipProtection) { this.relationshipProtection = relationshipProtection; }
        public StrategyResult getAiAdaptive() { return aiAdaptive; }
        public void setAiAdaptive(StrategyResult aiAdaptive) { this.aiAdaptive = aiAdaptive; }
        
        public Double getFinancialStressScore() { return financialStressScore; }
        public void setFinancialStressScore(Double financialStressScore) { this.financialStressScore = financialStressScore; }
        public String getHarassmentRiskLevel() { return harassmentRiskLevel; }
        public void setHarassmentRiskLevel(String harassmentRiskLevel) { this.harassmentRiskLevel = harassmentRiskLevel; }
        public Double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }
        public List<String> getSkipSuggestions() { return skipSuggestions; }
        public void setSkipSuggestions(List<String> skipSuggestions) { this.skipSuggestions = skipSuggestions; }
        
        public String getAdvice() { return advice; }
        public void setAdvice(String advice) { this.advice = advice; }
        public NlpParsedResult getNlpParsedResult() { return nlpParsedResult; }
        public void setNlpParsedResult(NlpParsedResult nlpParsedResult) { this.nlpParsedResult = nlpParsedResult; }
    }

    @GetMapping("/context")
    public List<AiContext> getContextHistory(@RequestParam Long userId) {
        return aiContextRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PostMapping("/context")
    public AiContext saveContext(@RequestBody AiContext context) {
        return aiContextRepository.save(context);
    }

    @PostMapping("/analyze")
    public AnalysisResponse analyze(@RequestBody SimulationRequest request) {
        Long userId = request.getUserId();
        List<Loan> loans = loanRepository.findByUserId(userId);
        List<IncomeSource> incomes = incomeSourceRepository.findByUserId(userId);
        List<Expense> expensesList = expenseRepository.findByUserId(userId);

        // 1. Calculate basic financial status
        double totalIncome = incomes.stream().mapToDouble(IncomeSource::getAmount).sum();
        
        // Dynamic variable average spend + fixed setup
        double totalExpenses = expensesList.stream().mapToDouble(Expense::getAmount).sum();
        // Since database contains individual logs, let's normalize monthly expenses.
        // If monthly expenses is small, let's assume default basic living cost of 25,000 for realistic simulation
        if (totalExpenses < 5000.0) {
            totalExpenses = 28000.0; 
        }
        
        double totalEmi = loans.stream().mapToDouble(Loan::getEmi).sum();
        
        Map<Long, Double> currentBalances = new HashMap<>();
        double totalDebt = 0.0;
        for (Loan loan : loans) {
            double remaining = emiPaymentRepository.findByLoanId(loan.getId()).stream()
                    .filter(p -> !Boolean.TRUE.equals(p.getIsPaid()))
                    .mapToDouble(EmiPayment::getAmount)
                    .sum();
            currentBalances.put(loan.getId(), remaining);
            totalDebt += remaining;
        }
        
        // Available surplus cash for prepayment
        double surplus = Math.max(0.0, totalIncome - totalExpenses - totalEmi);

        // 2. Parse any plain English NLP custom text
        String customText = request.getCustomText();
        double parsedLumpSum = 0.0;
        int parsedLumpSumMonthOffset = 0;
        double parsedSalaryHike = 0.0;
        double parsedSalaryHikePercent = 0.0;
        int parsedSalaryHikeMonthOffset = 0;
        double parsedExtraMonthly = 0.0;
        String nlpAcknowledgeMessage = "";

        if (customText != null && !customText.trim().isEmpty()) {
            // Save NLP text to database history
            AiContext history = new AiContext();
            history.setUserId(userId);
            history.setFreeText(customText);
            aiContextRepository.save(history);

            String textLower = customText.toLowerCase();

            // ── Step 1: Extract ALL numbers mentioned in the text (handles "100000 joining bonus" order) ──
            Pattern anyNumberPattern = Pattern.compile("(?:₹|rs\\.?|inr)?\\s*(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\\s*(?:k|lakh|l|lakhs)?");
            Matcher anyNumberMatcher = anyNumberPattern.matcher(textLower);
            List<Double> allNumbers = new ArrayList<>();
            while (anyNumberMatcher.find()) {
                String raw = anyNumberMatcher.group(1).replace(",", "");
                try {
                    double val = Double.parseDouble(raw);
                    // Scale "k" / "lakh" suffix
                    String afterNum = textLower.substring(anyNumberMatcher.end()).trim();
                    if (afterNum.startsWith("k") || afterNum.startsWith(" k")) val *= 1_000;
                    else if (afterNum.startsWith("lakh") || afterNum.startsWith("l ")) val *= 100_000;
                    if (val > 100) allNumbers.add(val); // ignore tiny numbers like percentages here
                } catch (NumberFormatException ignored) {}
            }

            // ── Step 2: Detect intent categories from keywords (order-agnostic) ──
            boolean isBonus = textLower.matches(".*(\\bjoin\\w*|\\bbonus\\b|\\bjoining\\b|\\bincentive\\b|\\baward\\b|\\bgratuity\\b|\\bmaturity\\b|\\bfd\\b|\\bfixed deposit\\b|\\bprepay\\b|\\blump.?sum\\b|\\breceive\\b|\\bwindfall\\b|\\brelocation\\b).*");
            boolean isSalaryHike = textLower.matches(".*(\\bhike\\b|\\bincrement\\b|\\bappraisal\\b|\\braise\\b|\\bswitch\\w*\\s+job|\\bnew job\\b|\\bnew salary\\b|\\bsalary increase\\b|\\bincrease.*salary|\\bsalary.*increase\\b|\\bsalary.*hike\\b|\\bhike.*salary\\b|\\bsalary.*raise|\\bpay rise\\b|\\bpackage\\b|\\bctc\\b|\\bcompensation\\b|\\bincome increase\\b).*");
            boolean isExtraMonthly = textLower.matches(".*(\\bextra.*month|\\bmonth.*extra|\\bper month|\\bevery month|\\bmonthly extra\\b|\\bmonthly payment\\b|\\badditional.*month\\b).*");

            // ── Step 3: Assign values based on intent ──

            // Lump-sum bonus / joining bonus / prepayment
            if (isBonus && !allNumbers.isEmpty()) {
                // If there's a percentage number mixed in, prefer the large absolute number
                parsedLumpSum = allNumbers.stream().mapToDouble(d -> d).max().orElse(0);

                // Month offset: look for timing hints
                if (textLower.contains("next month")) parsedLumpSumMonthOffset = 1;
                else if (textLower.contains("immediate") || textLower.contains("now") || textLower.contains("today")) parsedLumpSumMonthOffset = 1;
                else if (textLower.contains("in 2 months") || textLower.contains("2 months")) parsedLumpSumMonthOffset = 2;
                else if (textLower.contains("in 3 months") || textLower.contains("3 months")) parsedLumpSumMonthOffset = 3;
                else if (textLower.contains("in 6 months") || textLower.contains("6 months")) parsedLumpSumMonthOffset = 6;
                else if (textLower.contains("october")) parsedLumpSumMonthOffset = 5;
                else if (textLower.contains("january")) parsedLumpSumMonthOffset = 7;
                else if (textLower.contains("diwali")) parsedLumpSumMonthOffset = 5;
                else parsedLumpSumMonthOffset = 1; // default: next month

                nlpAcknowledgeMessage += String.format("🎉 Found lump-sum inflow of ₹%,.0f in %d month(s). ", parsedLumpSum, parsedLumpSumMonthOffset);
            }

            // Salary hike — look for a % number first, then absolute amount
            if (isSalaryHike) {
                // Try percentage pattern first e.g. "25% hike" or "hike of 30%"
                Pattern pctPat = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%");
                Matcher pctMat = pctPat.matcher(textLower);
                if (pctMat.find()) {
                    double pct = Double.parseDouble(pctMat.group(1));
                    parsedSalaryHike = (pct / 100.0) * totalIncome;
                    parsedSalaryHikePercent = pct;
                    parsedSalaryHikeMonthOffset = textLower.contains("3 months") ? 3 : textLower.contains("6 months") ? 6 : 1;
                    nlpAcknowledgeMessage += String.format("📈 Found %.0f%% salary hike → +₹%,.0f/mo additional income. ", pct, parsedSalaryHike);
                } else if (!allNumbers.isEmpty()) {
                    // Could be an absolute salary amount mentioned — treat as monthly income boost
                    // Heuristic: if the number is large (>10000), treat as new salary, derive increment
                    double bigNum = allNumbers.stream().mapToDouble(d -> d).max().orElse(0);
                    // If number wasn't already captured as lump-sum bonus, use it as extra monthly income
                    if (bigNum > 0 && bigNum != parsedLumpSum) {
                        parsedSalaryHike = bigNum > totalIncome ? (bigNum - totalIncome) : bigNum;
                        parsedSalaryHikePercent = totalIncome > 0 ? (parsedSalaryHike / totalIncome) * 100.0 : 0.0;
                        parsedSalaryHikeMonthOffset = 1;
                        nlpAcknowledgeMessage += String.format("📈 Found salary boost of +₹%,.0f/mo from job switch. ", parsedSalaryHike);
                    } else if (parsedLumpSum > 0) {
                        // bonus already captured, no extra monthly hike detected — that's fine
                    }
                }
            }

            // Extra monthly payment
            if (isExtraMonthly) {
                Pattern extraPat = Pattern.compile("(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\\s*(?:extra|per month|monthly|every month|/month)");
                Matcher extraMat = extraPat.matcher(textLower);
                if (extraMat.find()) {
                    parsedExtraMonthly = Double.parseDouble(extraMat.group(1).replace(",", ""));
                    nlpAcknowledgeMessage += String.format("💳 Adding ₹%,.0f extra monthly debt payment. ", parsedExtraMonthly);
                }
            }

            // ── Step 4: If nothing matched but numbers exist, use context clues ──
            if (parsedLumpSum == 0 && parsedSalaryHike == 0 && parsedExtraMonthly == 0 && !allNumbers.isEmpty()) {
                // Last resort: if user mentions any large number, treat as lump sum
                double largest = allNumbers.stream().mapToDouble(d -> d).max().orElse(0);
                if (largest > 0) {
                    parsedLumpSum = largest;
                    parsedLumpSumMonthOffset = 1;
                    nlpAcknowledgeMessage += String.format("💡 Detected financial event with ₹%,.0f — treating as one-time inflow next month. ", parsedLumpSum);
                }
            }
        }

        // Apply sliders / manual request parameters AND parsed parameters
        double simExtraMonthly = (request.getExtraMonthlyPayment() != null ? request.getExtraMonthlyPayment() : 0.0) + parsedExtraMonthly;
        double simLumpSum = (request.getLumpSumPrepayment() != null ? request.getLumpSumPrepayment() : 0.0) + parsedLumpSum;
        int simLumpSumOffset = parsedLumpSumMonthOffset > 0 ? parsedLumpSumMonthOffset : 3;
        double simHikeAmt = (request.getSalaryHikePercent() != null ? (request.getSalaryHikePercent() / 100.0) * totalIncome : 0.0) + parsedSalaryHike;

        // Cumulative active cash flow for prepayments
        double activeExtraCash = surplus + simExtraMonthly;

        // 3. Compute payoff schedules
        StrategyResult baselineRes = simulateDebtStrategy(loans, currentBalances, "Baseline", 0.0, 0.0, 0, 0.0, 0);
        StrategyResult avalancheRes = simulateDebtStrategy(loans, currentBalances, "Avalanche", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult snowballRes = simulateDebtStrategy(loans, currentBalances, "Snowball", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult balancedRes = simulateDebtStrategy(loans, currentBalances, "Balanced", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult priorityFirstRes = simulateDebtStrategy(loans, currentBalances, "PriorityFirst", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult hybridRes = simulateDebtStrategy(loans, currentBalances, "Hybrid", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult cashflowRes = simulateDebtStrategy(loans, currentBalances, "CashflowRelief", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult survivalRes = simulateDebtStrategy(loans, currentBalances, "Survival", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult relationshipRes = simulateDebtStrategy(loans, currentBalances, "RelationshipProtection", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult adaptiveRes = simulateDebtStrategy(loans, currentBalances, "AiAdaptive", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);

        // Adjust comparisons relative to Baseline
        avalancheRes = calculateRelativeResult(baselineRes, avalancheRes, "Avalanche");
        snowballRes = calculateRelativeResult(baselineRes, snowballRes, "Snowball");
        balancedRes = calculateRelativeResult(baselineRes, balancedRes, "Balanced");
        priorityFirstRes = calculateRelativeResult(baselineRes, priorityFirstRes, "PriorityFirst");
        hybridRes = calculateRelativeResult(baselineRes, hybridRes, "Hybrid");
        cashflowRes = calculateRelativeResult(baselineRes, cashflowRes, "CashflowRelief");
        survivalRes = calculateRelativeResult(baselineRes, survivalRes, "Survival");
        relationshipRes = calculateRelativeResult(baselineRes, relationshipRes, "RelationshipProtection");
        adaptiveRes = calculateRelativeResult(baselineRes, adaptiveRes, "AiAdaptive");

        // 4. Calculate Advanced Metrics
        double emiRatio = totalIncome > 0 ? (totalEmi / totalIncome) * 100.0 : 0.0;
        double stressScore = (emiRatio * 0.5) + (totalDebt > 100000.0 ? 30.0 : (totalDebt / 100000.0) * 30.0);
        double avgLoanStress = loans.stream().mapToDouble(Loan::getEmotionalStressScore).average().orElse(50.0);
        stressScore = (stressScore * 0.6) + (avgLoanStress * 0.4);
        stressScore = Math.round(Math.max(0.0, Math.min(100.0, stressScore)) * 10.0) / 10.0;
        
        String harassmentRisk = "LOW";
        double maxPenaltyRisk = loans.stream().mapToDouble(Loan::getPenaltyRiskScore).max().orElse(0.0);
        boolean hasOverdue = loans.stream().anyMatch(l -> l.getDueDate() != null && l.getDueDate().isBefore(LocalDate.now()));
        if (hasOverdue && maxPenaltyRisk > 75.0) {
            harassmentRisk = "AGGRESSIVE COLLECTION RISK";
        } else if (maxPenaltyRisk > 50.0 || emiRatio > 60.0) {
            harassmentRisk = "MODERATE RISK";
        } else {
            harassmentRisk = "LOW";
        }
        
        List<String> skipSuggestions = new ArrayList<>();
        for (Loan l : loans) {
            if (l.getAllowSkipPayment() || l.getDebtType().equals("friend") || l.getDebtType().equals("family")) {
                if (l.getFlexibilityScore() > 60.0) {
                    skipSuggestions.add(String.format("You may safely defer payment on %s (%s) — lender flexibility is high (%.0f%%).", 
                        l.getName(), l.getLender(), l.getFlexibilityScore()));
                }
            }
        }
        if (skipSuggestions.isEmpty()) {
            skipSuggestions.add("No safe skips identified this month. All active debts require standard payments.");
        }
        
        double surplusRatio = totalIncome > 0 ? (surplus / totalIncome) : 0.0;
        double confidenceScore = 60.0 + (surplusRatio * 100.0 * 2.0) - (stressScore * 0.2);
        confidenceScore = Math.round(Math.max(20.0, Math.min(99.0, confidenceScore)) * 10.0) / 10.0;

        // 5. Construct beautiful coaching advice
        String advice = "### 💡 AI Debt Recovery & Financial Survival Coaching\n\n";
        if (!nlpAcknowledgeMessage.isEmpty()) {
            advice += "**🤖 AI Understood Event:**\n*" + nlpAcknowledgeMessage.trim() + "*\n\n";
        }
        
        advice += String.format("Your monthly net take-home is **₹%,.0f** against basic expenses of **₹%,.0f** and EMIs of **₹%,.0f** (Debt-to-Income: **%.1f%%**).\n\n", 
            totalIncome, totalExpenses, totalEmi, emiRatio);
        
        if (stressScore > 70) {
            advice += "⚠️ **Critical Alert:** Your financial stress is **very high (" + stressScore + "/100)**. Your budget is heavily utilized by debt. We highly recommend activating the **Survival Mode Strategy** to pause flexible payments or the **Priority-First Strategy** to mitigate any harassment and collection risks immediately.\n\n";
        } else if (stressScore > 40) {
            advice += "⚡ **Action Required:** Your financial stress is **moderate (" + stressScore + "/100)**. Consider executing the **Cashflow Relief Strategy** to quickly eliminate your highest EMI loans, freeing up breathing room.\n\n";
        } else {
            advice += "✨ **Healthy Position:** Your financial stress is **low (" + stressScore + "/100)**. You can proceed aggressively with the mathematically optimal **Avalanche Strategy** to maximize interest savings.\n\n";
        }

        if (avalancheRes.getMonthsSaved() > 0) {
            advice += String.format("#### 🚀 Strategy Performance Comparison:\n" +
                    "- **Avalanche Strategy:** Prepaying highest-interest first saves you **₹%,.0f** and makes you debt-free **%d months faster** (by %s)!\n" +
                    "- **Priority-First Strategy:** Eliminating critical risk/harassment first makes you debt-free **%d months faster** (by %s)!\n" +
                    "- **Cashflow Relief Strategy:** Prepaying highest EMI first makes you debt-free **%d months faster** (by %s), instantly creating monthly budget cushion.", 
                    avalancheRes.getInterestSaved(), avalancheRes.getMonthsSaved(), avalancheRes.getDebtFreeDate(),
                    priorityFirstRes.getMonthsSaved(), priorityFirstRes.getDebtFreeDate(),
                    cashflowRes.getMonthsSaved(), cashflowRes.getDebtFreeDate());
        } else {
            advice += "Add an extra monthly payment or simulate a salary hike using the What-If slider to kickstart the visual payoff curve and see exactly how many months you can save!";
        }

        AnalysisResponse response = new AnalysisResponse();
        response.setMonthlyIncome(totalIncome);
        response.setMonthlyExpenses(totalExpenses);
        response.setTotalDebt(totalDebt);
        response.setSurplusSavings(surplus);
        response.setBaseline(baselineRes);
        response.setAvalanche(avalancheRes);
        response.setSnowball(snowballRes);
        response.setBalanced(balancedRes);
        
        // Advanced strategy results
        response.setPriorityFirst(priorityFirstRes);
        response.setHybridEmotional(hybridRes);
        response.setCashflowRelief(cashflowRes);
        response.setSurvival(survivalRes);
        response.setRelationshipProtection(relationshipRes);
        response.setAiAdaptive(adaptiveRes);
        
        // Advanced analytics
        response.setFinancialStressScore(stressScore);
        response.setHarassmentRiskLevel(harassmentRisk);
        response.setConfidenceScore(confidenceScore);
        response.setSkipSuggestions(skipSuggestions);
        
        response.setAdvice(advice);

        if (customText != null && !customText.trim().isEmpty()) {
            response.setNlpParsedResult(new NlpParsedResult(
                nlpAcknowledgeMessage.trim(),
                parsedLumpSum,
                parsedSalaryHikePercent,
                parsedExtraMonthly
            ));
        }

        return response;
    }

    private StrategyResult calculateRelativeResult(StrategyResult baseline, StrategyResult strategy, String name) {
        double intSaved = Math.max(0.0, baseline.getTotalInterestPaid() - strategy.getTotalInterestPaid());
        int monthsSaved = Math.max(0, baseline.getDebtFreeMonths() - strategy.getDebtFreeMonths());
        return new StrategyResult(name, strategy.getDebtFreeMonths(), strategy.getDebtFreeDate(), strategy.getTotalInterestPaid(), intSaved, monthsSaved, strategy.getProjection());
    }

    private static int getPriorityValue(String priority) {
        if (priority == null) return 2;
        switch (priority.toLowerCase()) {
            case "critical": return 4;
            case "high": return 3;
            case "medium": return 2;
            case "low": return 1;
            default: return 2;
        }
    }

    // Standard high-performance Amortization simulator supporting 8 strategies
    private StrategyResult simulateDebtStrategy(List<Loan> baseLoans, Map<Long, Double> loanBalances, String strategy, double monthlySurplus, double lumpSum, int lumpSumOffset, double salaryHike, int hikeOffset) {
        if (baseLoans.isEmpty()) {
            return new StrategyResult(strategy, 0, "No active debt", 0.0, 0.0, 0, new ArrayList<>());
        }

        // Clone loan states to simulate safely
        List<SimulatedLoan> loans = new ArrayList<>();
        for (Loan l : baseLoans) {
            double currentBalance = loanBalances.getOrDefault(l.getId(), l.getPrincipal());
            if (currentBalance > 0) {
                loans.add(new SimulatedLoan(l, currentBalance));
            }
        }

        List<ProjectionDataPoint> points = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        double cumulativeInterest = 0.0;
        int monthIndex = 0;
        int maxMonths = 360; // 30-year limit safety check
        
        double currentHike = 0.0;
        double currentLumpSum = 0.0;

        // Add starting data point
        double startBalance = loans.stream().mapToDouble(SimulatedLoan::getBalance).sum();
        points.add(new ProjectionDataPoint(today.format(formatter), startBalance, 0.0));

        while (true) {
            monthIndex++;
            LocalDate currentMonthDate = today.plusMonths(monthIndex);
            
            // Check for salary hike
            if (monthIndex >= hikeOffset && hikeOffset > 0) {
                currentHike = salaryHike;
            }
            
            // Check for lump sum
            if (monthIndex == lumpSumOffset && lumpSumOffset > 0) {
                currentLumpSum = lumpSum;
            } else {
                currentLumpSum = 0.0;
            }

            double activeExtraPool = monthlySurplus + currentHike + currentLumpSum;
            double monthTotalPaid = 0.0;
            double monthRemainingBalance = 0.0;

            // 1. Accrue monthly interest on each loan
            for (SimulatedLoan loan : loans) {
                if (loan.getBalance() > 0) {
                    double monthlyRate = (loan.rate / 100.0) / 12.0;
                    double interest = loan.getBalance() * monthlyRate;
                    loan.accrueInterest(interest);
                    cumulativeInterest += interest;
                }
            }

            // 2. Pay minimum EMIs first
            for (SimulatedLoan loan : loans) {
                if (loan.getBalance() > 0) {
                    double minEmi = 0.0;
                    if (strategy.equalsIgnoreCase("Survival")) {
                        // In survival mode, skip low/medium priority friend or family loans entirely
                        boolean isFlexible = loan.allowSkipPayment || loan.debtType.equals("friend") || loan.debtType.equals("family");
                        int priVal = getPriorityValue(loan.priority);
                        if (priVal <= 2 && isFlexible) {
                            minEmi = 0.0;
                        } else {
                            // Pay absolute minimum required or a highly reduced 30% EMI
                            minEmi = loan.minimumRequired > 0 ? Math.min(loan.getBalance(), loan.minimumRequired) 
                                           : Math.min(loan.getBalance(), Math.max(100.0, loan.emi * 0.3));
                        }
                    } else {
                        minEmi = Math.min(loan.getBalance(), loan.emi);
                    }
                    loan.pay(minEmi);
                    monthTotalPaid += minEmi;
                }
            }

            // 3. Allocate extra prepayment pool if any
            if (activeExtraPool > 0) {
                if (strategy.equalsIgnoreCase("Avalanche")) {
                    // Sort by interest rate descending
                    loans.sort((a, b) -> Double.compare(b.rate, a.rate));
                } else if (strategy.equalsIgnoreCase("Snowball")) {
                    // Sort by remaining balance ascending
                    loans.sort((a, b) -> Double.compare(a.getBalance(), b.getBalance()));
                } else if (strategy.equalsIgnoreCase("PriorityFirst") || strategy.equalsIgnoreCase("Priority")) {
                    // Sort by Priority descending, then highest EMI descending
                    loans.sort((a, b) -> {
                        int pA = getPriorityValue(a.priority);
                        int pB = getPriorityValue(b.priority);
                        if (pA != pB) return Integer.compare(pB, pA);
                        return Double.compare(b.emi, a.emi);
                    });
                } else if (strategy.equalsIgnoreCase("Hybrid") || strategy.equalsIgnoreCase("HybridEmotional")) {
                    // Weighted formula: Math + Emotion
                    loans.sort((a, b) -> {
                        double sA = (a.rate * 0.3) + (getPriorityValue(a.priority) * 20 * 0.3) + (a.emotionalStressScore * 0.2) + (a.penaltyRiskScore * 0.2);
                        double sB = (b.rate * 0.3) + (getPriorityValue(b.priority) * 20 * 0.3) + (b.emotionalStressScore * 0.2) + (b.penaltyRiskScore * 0.2);
                        return Double.compare(sB, sA);
                    });
                } else if (strategy.equalsIgnoreCase("CashflowRelief")) {
                    // Close highest EMI loans first
                    loans.sort((a, b) -> Double.compare(b.emi, a.emi));
                } else if (strategy.equalsIgnoreCase("RelationshipProtection") || strategy.equalsIgnoreCase("Relationship")) {
                    // Pay personal loans first to protect social relations
                    loans.sort((a, b) -> {
                        boolean aPers = a.debtType.equals("friend") || a.debtType.equals("family");
                        boolean bPers = b.debtType.equals("friend") || b.debtType.equals("family");
                        if (aPers && !bPers) return -1;
                        if (!aPers && bPers) return 1;
                        return Double.compare(b.relationshipRisk, a.relationshipRisk);
                    });
                } else if (strategy.equalsIgnoreCase("AiAdaptive") || strategy.equalsIgnoreCase("Adaptive")) {
                    // Combine interest rate and stress reduction dynamically
                    loans.sort((a, b) -> {
                        double sA = (a.rate * 0.5) + (a.emotionalStressScore * 0.5);
                        double sB = (b.rate * 0.5) + (b.emotionalStressScore * 0.5);
                        return Double.compare(sB, sA);
                    });
                } else if (strategy.equalsIgnoreCase("Balanced")) {
                    // Proportional split
                    double totalActiveBalance = loans.stream().filter(l -> l.getBalance() > 0).mapToDouble(SimulatedLoan::getBalance).sum();
                    if (totalActiveBalance > 0) {
                        for (SimulatedLoan loan : loans) {
                            if (loan.getBalance() > 0) {
                                double share = (loan.getBalance() / totalActiveBalance) * activeExtraPool;
                                double paid = Math.min(loan.getBalance(), share);
                                loan.pay(paid);
                                monthTotalPaid += paid;
                            }
                        }
                        activeExtraPool = 0.0; // fully allocated
                    }
                }

                // Apply sorted priority allocation (for all strategies except Balanced/Survival)
                if (!strategy.equalsIgnoreCase("Balanced") && !strategy.equalsIgnoreCase("Survival") && activeExtraPool > 0) {
                    for (SimulatedLoan loan : loans) {
                        if (loan.getBalance() > 0 && activeExtraPool > 0) {
                            double extraPaid = Math.min(loan.getBalance(), activeExtraPool);
                            loan.pay(extraPaid);
                            monthTotalPaid += extraPaid;
                            activeExtraPool -= extraPaid;
                        }
                    }
                }
            }

            // 4. Calculate total outstanding balance
            monthRemainingBalance = loans.stream().mapToDouble(SimulatedLoan::getBalance).sum();
            
            // Add graph datapoint
            points.add(new ProjectionDataPoint(currentMonthDate.format(formatter), monthRemainingBalance, monthTotalPaid));

            if (monthRemainingBalance <= 0 || monthIndex >= maxMonths) {
                break;
            }
        }

        String debtFreeDate = today.plusMonths(monthIndex).format(formatter);
        return new StrategyResult(strategy, monthIndex, debtFreeDate, cumulativeInterest, 0.0, 0, points);
    }

    private static class SimulatedLoan {
        String name;
        double balance;
        double rate;
        double emi;
        String priority;
        String debtType;
        double flexibilityScore;
        double emotionalStressScore;
        double penaltyRiskScore;
        double relationshipRisk;
        double minimumRequired;
        boolean allowSkipPayment;

        SimulatedLoan(Loan loan, double currentBalance) {
            this.name = loan.getName();
            this.balance = currentBalance;
            this.rate = loan.getRate() != null ? loan.getRate() : 0.0;
            this.emi = loan.getEmi() != null ? loan.getEmi() : 0.0;
            this.priority = loan.getPriority();
            this.debtType = loan.getDebtType();
            this.flexibilityScore = loan.getFlexibilityScore();
            this.emotionalStressScore = loan.getEmotionalStressScore();
            this.penaltyRiskScore = loan.getPenaltyRiskScore();
            this.relationshipRisk = loan.getRelationshipRisk();
            this.minimumRequired = loan.getMinimumRequired() != null ? loan.getMinimumRequired() : 0.0;
            this.allowSkipPayment = loan.getAllowSkipPayment() != null ? loan.getAllowSkipPayment() : false;
        }

        double getBalance() { return balance; }

        void accrueInterest(double interest) {
            this.balance += interest;
        }

        void pay(double amount) {
            this.balance -= amount;
        }
    }
}
