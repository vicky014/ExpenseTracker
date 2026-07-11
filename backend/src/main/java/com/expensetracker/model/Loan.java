package com.expensetracker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Document(collection = "loans")
public class Loan {
    @Id
    private Long id;
    
    private Long userId;
    private String name;
    private Double principal;
    private Double rate; // interest rate p.a. in %
    private Integer tenure; // tenure in months
    private Double emi;
    private LocalDate startDate;
    private String lender;
    private String type; // Home, Car, Personal, Credit Card, Education, Friend, Other
    private String prepayPriority = "MEDIUM"; // HIGH, MEDIUM, LOW, EXCLUDE

    // Advanced Payoff Planner Fields
    private Double outstandingAmount;
    private String debtType;
    private String priority;
    private Double flexibilityScore = 50.0;
    private Double emotionalStressScore = 50.0;
    private Double penaltyRiskScore = 50.0;
    private Double relationshipRisk = 50.0;
    private Boolean allowSkipPayment = false;
    private Double minimumRequired = 0.0;
    private LocalDate dueDate;
    private Boolean settlementEligible = false;

    // Dynamic Strategy Engine Fields
    private Double earlyClosureCharges = 0.0;    // Prepayment penalty / early closure fee
    private Integer remainingTenure;              // Remaining months (may differ from original tenure)
    private String creditorType = "BANK";         // BANK, NBFC, FRIEND, FAMILY, EMPLOYER, OTHER

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrincipal() { return principal; }
    public void setPrincipal(Double principal) { this.principal = principal; }
    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }
    public Integer getTenure() { return tenure; }
    public void setTenure(Integer tenure) { this.tenure = tenure; }
    public Double getEmi() { return emi; }
    public void setEmi(Double emi) { this.emi = emi; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public String getLender() { return lender; }
    public void setLender(String lender) { this.lender = lender; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPrepayPriority() { return prepayPriority; }
    public void setPrepayPriority(String prepayPriority) { this.prepayPriority = prepayPriority; }

    // Advanced Field Getters and Setters
    public Double getOutstandingAmount() { 
        return outstandingAmount != null ? outstandingAmount : principal; 
    }
    public void setOutstandingAmount(Double outstandingAmount) { this.outstandingAmount = outstandingAmount; }

    public String getDebtType() { 
        if (debtType != null) return debtType;
        if (type == null) return "personal_loan";
        String t = type.toLowerCase();
        if (t.contains("friend")) return "friend";
        if (t.contains("family")) return "family";
        if (t.contains("credit card") || t.contains("card")) return "credit_card";
        if (t.contains("bnpl")) return "bnpl";
        if (t.contains("salary")) return "salary_advance";
        return "personal_loan";
    }
    public void setDebtType(String debtType) { this.debtType = debtType; }

    public String getPriority() { 
        if (priority != null) return priority.toLowerCase();
        if (prepayPriority == null) return "medium";
        String p = prepayPriority.toUpperCase();
        if (p.equals("HIGH")) return "high";
        if (p.equals("LOW") || p.equals("EXCLUDE")) return "low";
        return "medium";
    }
    public void setPriority(String priority) { this.priority = priority; }

    public Double getFlexibilityScore() { return flexibilityScore != null ? flexibilityScore : 50.0; }
    public void setFlexibilityScore(Double flexibilityScore) { this.flexibilityScore = flexibilityScore; }

    public Double getEmotionalStressScore() { return emotionalStressScore != null ? emotionalStressScore : 50.0; }
    public void setEmotionalStressScore(Double emotionalStressScore) { this.emotionalStressScore = emotionalStressScore; }

    public Double getPenaltyRiskScore() { return penaltyRiskScore != null ? penaltyRiskScore : 50.0; }
    public void setPenaltyRiskScore(Double penaltyRiskScore) { this.penaltyRiskScore = penaltyRiskScore; }

    public Double getRelationshipRisk() { return relationshipRisk != null ? relationshipRisk : 50.0; }
    public void setRelationshipRisk(Double relationshipRisk) { this.relationshipRisk = relationshipRisk; }

    public Boolean getAllowSkipPayment() { return allowSkipPayment != null ? allowSkipPayment : false; }
    public void setAllowSkipPayment(Boolean allowSkipPayment) { this.allowSkipPayment = allowSkipPayment; }

    public Double getMinimumRequired() { return minimumRequired != null ? minimumRequired : 0.0; }
    public void setMinimumRequired(Double minimumRequired) { this.minimumRequired = minimumRequired; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Boolean getSettlementEligible() { return settlementEligible != null ? settlementEligible : false; }
    public void setSettlementEligible(Boolean settlementEligible) { this.settlementEligible = settlementEligible; }

    public Double getEarlyClosureCharges() { return earlyClosureCharges != null ? earlyClosureCharges : 0.0; }
    public void setEarlyClosureCharges(Double earlyClosureCharges) { this.earlyClosureCharges = earlyClosureCharges; }

    public Integer getRemainingTenure() {
        if (remainingTenure != null) return remainingTenure;
        // Fallback: derive from unpaid payment count when not explicitly set
        return tenure;
    }
    public void setRemainingTenure(Integer remainingTenure) { this.remainingTenure = remainingTenure; }

    public String getCreditorType() { return creditorType != null ? creditorType : "BANK"; }
    public void setCreditorType(String creditorType) { this.creditorType = creditorType; }
}

