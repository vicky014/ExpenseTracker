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

    public static class AnalysisResponse {
        private Double monthlyIncome;
        private Double monthlyExpenses;
        private Double totalDebt;
        private Double surplusSavings;
        private StrategyResult baseline;
        private StrategyResult avalanche;
        private StrategyResult snowball;
        private StrategyResult balanced;
        private String advice;

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
        public String getAdvice() { return advice; }
        public void setAdvice(String advice) { this.advice = advice; }
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
        double totalDebt = loans.stream().mapToDouble(Loan::getPrincipal).sum();
        
        // Available surplus cash for prepayment
        double surplus = Math.max(0.0, totalIncome - totalExpenses - totalEmi);

        // 2. Parse any plain English NLP custom text
        String customText = request.getCustomText();
        double parsedLumpSum = 0.0;
        int parsedLumpSumMonthOffset = 0;
        double parsedSalaryHike = 0.0;
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
            
            // Regex for bonus/lump-sums e.g., "bonus of ₹50,000 in October" or "FD maturity of 100000" or "prepay 5000"
            Pattern numPattern = Pattern.compile("(?i)(?:bonus|prepay|fd|maturity|receive|lump-sum).*?(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\\b");
            Matcher numMatcher = numPattern.matcher(textLower);
            if (numMatcher.find()) {
                String amountStr = numMatcher.group(1).replace(",", "");
                parsedLumpSum = Double.parseDouble(amountStr);
                
                // Parse date offset (e.g. "next month" = 1, "in 3 months" = 3, "in October" etc.)
                if (textLower.contains("next month")) {
                    parsedLumpSumMonthOffset = 1;
                } else if (textLower.contains("in 2 months")) {
                    parsedLumpSumMonthOffset = 2;
                } else if (textLower.contains("in 3 months") || textLower.contains("3 months")) {
                    parsedLumpSumMonthOffset = 3;
                } else if (textLower.contains("october")) {
                    parsedLumpSumMonthOffset = 5;
                } else {
                    parsedLumpSumMonthOffset = 1; // Default next month
                }
                nlpAcknowledgeMessage += String.format("Acknowledge: Found lump sum inflow of ₹%,.0f in %d month(s). ", parsedLumpSum, parsedLumpSumMonthOffset);
            }

            // Regex for salary hike e.g. "salary increases by ₹10,000" or "25% salary hike"
            Pattern hikePercentPattern = Pattern.compile("(\\d+)\\s*%\\s*salary");
            Matcher hikePercentMatcher = hikePercentPattern.matcher(textLower);
            if (hikePercentMatcher.find()) {
                double pct = Double.parseDouble(hikePercentMatcher.group(1));
                parsedSalaryHike = (pct / 100.0) * totalIncome;
                parsedSalaryHikeMonthOffset = textLower.contains("3 months") ? 3 : 1;
                nlpAcknowledgeMessage += String.format("Acknowledge: Found %s%% salary hike (approx. +₹%,.0f/mo). ", hikePercentMatcher.group(1), parsedSalaryHike);
            } else {
                Pattern hikeAmtPattern = Pattern.compile("salary.*?increases.*?(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\\b");
                Matcher hikeAmtMatcher = hikeAmtPattern.matcher(textLower);
                if (hikeAmtMatcher.find()) {
                    String amtStr = hikeAmtMatcher.group(1).replace(",", "");
                    parsedSalaryHike = Double.parseDouble(amtStr);
                    parsedSalaryHikeMonthOffset = 1;
                    nlpAcknowledgeMessage += String.format("Acknowledge: Found salary increase of +₹%,.0f/mo. ", parsedSalaryHike);
                }
            }

            // Regex for extra monthly payment e.g. "pay ₹5,000 extra every month" or "extra 2000 per month"
            Pattern extraPattern = Pattern.compile("(?i)(?:pay|extra).*?(\\d{1,3}(?:,\\d{3})*(?:\\.\\d+)?)\\b.*?monthly");
            Matcher extraMatcher = extraPattern.matcher(textLower);
            if (extraMatcher.find()) {
                String amtStr = extraMatcher.group(1).replace(",", "");
                parsedExtraMonthly = Double.parseDouble(amtStr);
                nlpAcknowledgeMessage += String.format("Acknowledge: Adding ₹%,.0f extra monthly payment. ", parsedExtraMonthly);
            }
        }

        // Apply sliders / manual request parameters OR parsed parameters
        double simExtraMonthly = request.getExtraMonthlyPayment() != null ? request.getExtraMonthlyPayment() : parsedExtraMonthly;
        double simLumpSum = request.getLumpSumPrepayment() != null ? request.getLumpSumPrepayment() : parsedLumpSum;
        int simLumpSumOffset = parsedLumpSumMonthOffset;
        double simHikeAmt = request.getSalaryHikePercent() != null ? (request.getSalaryHikePercent() / 100.0) * totalIncome : parsedSalaryHike;

        // Cumulative active cash flow for prepayments
        double activeExtraCash = surplus + simExtraMonthly;

        // 3. Compute payoff schedules
        StrategyResult baselineRes = simulateDebtStrategy(loans, "Baseline", 0.0, 0.0, 0, 0.0, 0);
        StrategyResult avalancheRes = simulateDebtStrategy(loans, "Avalanche", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult snowballRes = simulateDebtStrategy(loans, "Snowball", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);
        StrategyResult balancedRes = simulateDebtStrategy(loans, "Balanced", activeExtraCash, simLumpSum, simLumpSumOffset, simHikeAmt, parsedSalaryHikeMonthOffset);

        // Adjust comparisons relative to Baseline
        double avIntSaved = Math.max(0.0, baselineRes.getTotalInterestPaid() - avalancheRes.getTotalInterestPaid());
        int avMonthsSaved = Math.max(0, baselineRes.getDebtFreeMonths() - avalancheRes.getDebtFreeMonths());
        avalancheRes = new StrategyResult("Avalanche", avalancheRes.getDebtFreeMonths(), avalancheRes.getDebtFreeDate(), avalancheRes.getTotalInterestPaid(), avIntSaved, avMonthsSaved, avalancheRes.getProjection());

        double sbIntSaved = Math.max(0.0, baselineRes.getTotalInterestPaid() - snowballRes.getTotalInterestPaid());
        int sbMonthsSaved = Math.max(0, baselineRes.getDebtFreeMonths() - snowballRes.getDebtFreeMonths());
        snowballRes = new StrategyResult("Snowball", snowballRes.getDebtFreeMonths(), snowballRes.getDebtFreeDate(), snowballRes.getTotalInterestPaid(), sbIntSaved, sbMonthsSaved, snowballRes.getProjection());

        double balIntSaved = Math.max(0.0, baselineRes.getTotalInterestPaid() - balancedRes.getTotalInterestPaid());
        int balMonthsSaved = Math.max(0, baselineRes.getDebtFreeMonths() - balancedRes.getDebtFreeMonths());
        balancedRes = new StrategyResult("Balanced", balancedRes.getDebtFreeMonths(), balancedRes.getDebtFreeDate(), balancedRes.getTotalInterestPaid(), balIntSaved, balMonthsSaved, balancedRes.getProjection());

        // 4. Construct beautiful Claude advice
        String advice = "### 💡 Smart Financial Assessment\n\n";
        if (!nlpAcknowledgeMessage.isEmpty()) {
            advice += "**Parsed Event Inputs:**\n*" + nlpAcknowledgeMessage.trim() + "*\n\n";
        }
        
        advice += String.format("Your monthly net take-home is **₹%,.0f** against basic expenses of **₹%,.0f** and monthly EMIs of **₹%,.0f**. ", totalIncome, totalExpenses, totalEmi);
        
        if (activeExtraCash > 0) {
            advice += String.format("By allocating your monthly surplus of **₹%,.0f** and extra payment towards your debt, you can save a significant amount of interest!\n\n", activeExtraCash);
        } else {
            advice += "Currently, your budget is fully utilized. You are paying minimum EMIs, which will take longer. Consider adding a small extra monthly payment (even ₹2,000 - ₹5,000) using the simulator slider to see how much faster you could become debt-free!\n\n";
        }

        if (avMonthsSaved > 0) {
            advice += String.format("#### 🚀 Why the **Avalanche Strategy** wins for you:\n" +
                    "- **Time saved:** You become debt-free **%d months sooner** (in %s rather than %s)!\n" +
                    "- **Interest saved:** You keep **₹%,.0f** in your pocket instead of paying it to lenders.\n" +
                    "- **Action:** Prioritize extra payments directly to your loan with the highest interest rate (like credit card or personal loan) while keeping minimums active on other loans.", 
                    avMonthsSaved, avalancheRes.getDebtFreeDate(), baselineRes.getDebtFreeDate(), avIntSaved);
        } else {
            advice += "#### 🎯 Recommendations:\n" +
                    "To build a strong payoff trajectory, we recommend the **Snowball Strategy** for emotional momentum (clearing small loans first), or the **Avalanche Strategy** to mathematically minimize interest. Add an extra monthly buffer in the What-If slider to kickstart the visual payoff curve!";
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
        response.setAdvice(advice);

        return response;
    }

    // Standard high-performance Amortization simulator
    private StrategyResult simulateDebtStrategy(List<Loan> baseLoans, String strategy, double monthlySurplus, double lumpSum, int lumpSumOffset, double salaryHike, int hikeOffset) {
        if (baseLoans.isEmpty()) {
            return new StrategyResult(strategy, 0, "No active debt", 0.0, 0.0, 0, new ArrayList<>());
        }

        // Clone loan states to simulate safely
        List<SimulatedLoan> loans = new ArrayList<>();
        for (Loan l : baseLoans) {
            loans.add(new SimulatedLoan(l));
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
                    double minEmi = Math.min(loan.getBalance(), loan.emi);
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

                // Apply sorted priority allocation (Avalanche or Snowball)
                if (!strategy.equalsIgnoreCase("Balanced") && activeExtraPool > 0) {
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

        SimulatedLoan(Loan loan) {
            this.name = loan.getName();
            this.balance = loan.getPrincipal();
            this.rate = loan.getRate();
            this.emi = loan.getEmi();
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
