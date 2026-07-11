package com.expensetracker.controller;

import com.expensetracker.model.EmiPayment;
import com.expensetracker.model.Loan;
import com.expensetracker.repository.EmiPaymentRepository;
import com.expensetracker.repository.LoanRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    public static class LoanWithPayments {
        private Loan loan;
        private List<EmiPayment> payments;

        public LoanWithPayments(Loan loan, List<EmiPayment> payments) {
            this.loan = loan;
            this.payments = payments;
        }

        public Loan getLoan() { return loan; }
        public List<EmiPayment> getPayments() { return payments; }
    }

    public static class ParsedPayment {
        private LocalDate dueDate;
        private LocalDate paidDate;
        private Double amount;
        private Boolean isPaid = false;

        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
        public LocalDate getPaidDate() { return paidDate; }
        public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        public Boolean getIsPaid() { return isPaid; }
        public void setIsPaid(Boolean paid) { isPaid = paid; }
    }

    public static class ScheduleUploadResult {
        private Map<String, Object> detectedLoan = new HashMap<>();
        private List<ParsedPayment> payments = new ArrayList<>();
        private List<String> missingFields = new ArrayList<>();
        private List<String> warnings = new ArrayList<>();

        public Map<String, Object> getDetectedLoan() { return detectedLoan; }
        public void setDetectedLoan(Map<String, Object> detectedLoan) { this.detectedLoan = detectedLoan; }
        public List<ParsedPayment> getPayments() { return payments; }
        public void setPayments(List<ParsedPayment> payments) { this.payments = payments; }
        public List<String> getMissingFields() { return missingFields; }
        public void setMissingFields(List<String> missingFields) { this.missingFields = missingFields; }
        public List<String> getWarnings() { return warnings; }
        public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    }

    public static class CreateFromScheduleRequest {
        private Loan loan;
        private List<ParsedPayment> payments;

        public Loan getLoan() { return loan; }
        public void setLoan(Loan loan) { this.loan = loan; }
        public List<ParsedPayment> getPayments() { return payments; }
        public void setPayments(List<ParsedPayment> payments) { this.payments = payments; }
    }

    @GetMapping
    public List<LoanWithPayments> getLoans(@RequestParam Long userId) {
        List<Loan> loans = loanRepository.findByUserId(userId);
        List<LoanWithPayments> result = new ArrayList<>();
        for (Loan loan : loans) {
            List<EmiPayment> payments = emiPaymentRepository.findByLoanId(loan.getId());
            // Sort payments by due date
            payments.sort(Comparator.comparing(EmiPayment::getDueDate));
            result.add(new LoanWithPayments(loan, payments));
        }
        return result;
    }

    @PostMapping
    @Transactional
    public LoanWithPayments createLoan(@RequestBody Loan loan) {
        if (loan.getStartDate() == null) {
            loan.setStartDate(LocalDate.now());
        }
        
        // Simple EMI calculation if not provided
        if (loan.getEmi() == null) {
            double p = loan.getPrincipal();
            double r = loan.getRate() != null ? (loan.getRate() / 100.0) / 12.0 : 0.0;
            int n = loan.getTenure() != null && loan.getTenure() > 0 ? loan.getTenure() : 1;
            if (r > 0) {
                double emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                loan.setEmi(Math.round(emi * 100.0) / 100.0);
            } else {
                loan.setEmi(Math.round((p / n) * 100.0) / 100.0);
            }
        }
        
        Loan savedLoan = loanRepository.save(loan);
        List<EmiPayment> payments = generatePaymentsForLoan(savedLoan, 0);
        return new LoanWithPayments(savedLoan, payments);
    }

    @PostMapping("/upload-schedule")
    public ResponseEntity<?> uploadSchedule(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please upload a repayment schedule file."));
            }

            String filename = Optional.ofNullable(file.getOriginalFilename()).orElse("").toLowerCase(Locale.ROOT);
            ScheduleUploadResult result;
            if (filename.endsWith(".csv")) {
                result = parseCsv(file);
            } else if (filename.endsWith(".xlsx")) {
                result = parseXlsx(file);
            } else if (filename.endsWith(".pdf")) {
                result = parsePdf(file);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file type. Upload CSV, XLSX, or PDF."));
            }

            fillDerivedLoanFields(result);
            result.setMissingFields(findMissingFields(result));
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Could not parse repayment schedule: " + ex.getMessage()));
        }
    }

    @PostMapping("/from-schedule")
    @Transactional
    public ResponseEntity<?> createLoanFromSchedule(@RequestBody CreateFromScheduleRequest request) {
        if (request.getLoan() == null || request.getPayments() == null || request.getPayments().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Loan details and repayment schedule are required."));
        }

        Loan loan = request.getLoan();
        List<String> missing = validateLoanForSchedule(loan);
        if (!missing.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields.", "missingFields", missing));
        }

        List<ParsedPayment> parsedPayments = request.getPayments().stream()
                .filter(p -> p.getDueDate() != null && p.getAmount() != null && p.getAmount() > 0)
                .sorted(Comparator.comparing(ParsedPayment::getDueDate))
                .collect(Collectors.toList());
        if (parsedPayments.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No valid repayment rows found."));
        }

        loan.setTenure(parsedPayments.size());
        loan.setStartDate(parsedPayments.get(0).getDueDate());
        Loan savedLoan = loanRepository.save(loan);

        List<EmiPayment> savedPayments = new ArrayList<>();
        for (ParsedPayment parsed : parsedPayments) {
            EmiPayment payment = new EmiPayment();
            payment.setLoanId(savedLoan.getId());
            payment.setDueDate(parsed.getDueDate());
            payment.setAmount(roundMoney(parsed.getAmount()));
            payment.setIsPaid(Boolean.TRUE.equals(parsed.getIsPaid()));
            payment.setPaidDate(Boolean.TRUE.equals(parsed.getIsPaid()) ? parsed.getPaidDate() : null);
            savedPayments.add(emiPaymentRepository.save(payment));
        }

        return ResponseEntity.ok(new LoanWithPayments(savedLoan, savedPayments));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteLoan(@PathVariable Long id) {
        emiPaymentRepository.deleteByLoanId(id);
        loanRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Loan> updateLoan(@PathVariable Long id, @RequestBody Loan loanDetails) {
        Optional<Loan> loanOpt = loanRepository.findById(id);
        if (loanOpt.isPresent()) {
            Loan loan = loanOpt.get();
            loan.setName(loanDetails.getName());
            loan.setPrincipal(loanDetails.getPrincipal());
            loan.setRate(loanDetails.getRate());
            loan.setTenure(loanDetails.getTenure());
            loan.setEmi(loanDetails.getEmi());
            loan.setLender(loanDetails.getLender());
            loan.setType(loanDetails.getType());
            if (loanDetails.getPrepayPriority() != null) {
                loan.setPrepayPriority(loanDetails.getPrepayPriority());
            }
            if (loanDetails.getStartDate() != null) {
                loan.setStartDate(loanDetails.getStartDate());
            }
            
            // Advanced Payoff Planner Fields
            loan.setOutstandingAmount(loanDetails.getOutstandingAmount());
            loan.setDebtType(loanDetails.getDebtType());
            loan.setPriority(loanDetails.getPriority());
            loan.setFlexibilityScore(loanDetails.getFlexibilityScore());
            loan.setEmotionalStressScore(loanDetails.getEmotionalStressScore());
            loan.setPenaltyRiskScore(loanDetails.getPenaltyRiskScore());
            loan.setRelationshipRisk(loanDetails.getRelationshipRisk());
            loan.setAllowSkipPayment(loanDetails.getAllowSkipPayment());
            loan.setMinimumRequired(loanDetails.getMinimumRequired());
            loan.setDueDate(loanDetails.getDueDate());
            loan.setSettlementEligible(loanDetails.getSettlementEligible());

            // Dynamic Strategy Engine Fields
            if (loanDetails.getEarlyClosureCharges() != null) {
                loan.setEarlyClosureCharges(loanDetails.getEarlyClosureCharges());
            }
            if (loanDetails.getRemainingTenure() != null) {
                loan.setRemainingTenure(loanDetails.getRemainingTenure());
            }
            if (loanDetails.getCreditorType() != null) {
                loan.setCreditorType(loanDetails.getCreditorType());
            }
            
            Loan saved = loanRepository.save(loan);
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{loanId}/payments/{paymentId}/toggle")
    public ResponseEntity<EmiPayment> togglePayment(
            @PathVariable Long loanId,
            @PathVariable Long paymentId,
            @RequestParam Boolean isPaid) {
        Optional<EmiPayment> paymentOpt = emiPaymentRepository.findById(paymentId);
        if (paymentOpt.isPresent()) {
            EmiPayment payment = paymentOpt.get();
            if (payment.getLoanId().equals(loanId)) {
                payment.setIsPaid(isPaid);
                payment.setPaidDate(isPaid ? LocalDate.now() : null);
                EmiPayment saved = emiPaymentRepository.save(payment);
                return ResponseEntity.ok(saved);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{loanId}/payments/{paymentId}")
    public ResponseEntity<EmiPayment> updatePaymentAmount(
            @PathVariable Long loanId,
            @PathVariable Long paymentId,
            @RequestParam Double amount) {
        Optional<EmiPayment> paymentOpt = emiPaymentRepository.findById(paymentId);
        if (paymentOpt.isPresent()) {
            EmiPayment payment = paymentOpt.get();
            if (payment.getLoanId().equals(loanId)) {
                payment.setAmount(amount);
                EmiPayment saved = emiPaymentRepository.save(payment);
                return ResponseEntity.ok(saved);
            }
        }
        return ResponseEntity.notFound().build();
    }

    private List<EmiPayment> generatePaymentsForLoan(Loan loan, int completedCount) {
        List<EmiPayment> payments = new ArrayList<>();
        LocalDate startDate = loan.getStartDate();
        for (int i = 0; i < loan.getTenure(); i++) {
            EmiPayment payment = new EmiPayment();
            payment.setLoanId(loan.getId());
            payment.setDueDate(startDate.plusMonths(i));
            payment.setAmount(loan.getEmi());
            if (i < completedCount) {
                payment.setIsPaid(true);
                payment.setPaidDate(startDate.plusMonths(i).plusDays(2));
            } else {
                payment.setIsPaid(false);
            }
            payments.add(emiPaymentRepository.save(payment));
        }
        return payments;
    }

    private ScheduleUploadResult parseCsv(MultipartFile file) throws Exception {
        List<List<String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty()) {
                    rows.add(splitCsvLine(line));
                }
            }
        }
        return parseRows(rows);
    }

    private ScheduleUploadResult parseXlsx(MultipartFile file) throws Exception {
        List<List<String>> rows = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();
            for (Row row : sheet) {
                List<String> values = new ArrayList<>();
                for (int i = 0; i < row.getLastCellNum(); i++) {
                    Cell cell = row.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    values.add(cell == null ? "" : formatter.formatCellValue(cell));
                }
                if (values.stream().anyMatch(v -> !v.trim().isEmpty())) {
                    rows.add(values);
                }
            }
        }
        return parseRows(rows);
    }

    private ScheduleUploadResult parsePdf(MultipartFile file) throws Exception {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            String text = new PDFTextStripper().getText(document);
            List<List<String>> rows = new ArrayList<>();
            for (String line : text.split("\\R")) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty()) {
                    rows.add(Arrays.asList(trimmed.split("\\s{2,}|\\t")));
                }
            }
            ScheduleUploadResult result = parseRows(rows);
            if (result.getPayments().isEmpty()) {
                result.getWarnings().add("No table-like repayment rows were detected. Scanned PDFs are not supported.");
            }
            return result;
        }
    }

    private ScheduleUploadResult parseRows(List<List<String>> rows) {
        ScheduleUploadResult result = new ScheduleUploadResult();
        if (rows.isEmpty()) {
            result.getWarnings().add("The uploaded file is empty.");
            return result;
        }

        int headerIndex = findHeaderIndex(rows);
        if (headerIndex < 0) {
            result.getWarnings().add("Could not detect a header row with date and amount columns.");
            return result;
        }

        List<String> headers = rows.get(headerIndex).stream().map(this::normalizeHeader).collect(Collectors.toList());
        int dueDateCol = findColumn(headers, "due date", "emi date", "payment date", "installment date", "instalment date", "date");
        int amountCol = findColumn(headers, "emi", "installment", "instalment", "payment", "amount", "total payment", "total");
        int paidDateCol = findColumn(headers, "paid date", "payment received date");
        int statusCol = findColumn(headers, "status", "paid", "payment status");

        detectLoanMetadata(result.getDetectedLoan(), headers, rows, headerIndex);

        for (int i = headerIndex + 1; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            LocalDate dueDate = parseDate(getCell(row, dueDateCol));
            Double amount = parseMoney(getCell(row, amountCol));
            if (dueDate == null || amount == null || amount <= 0) {
                continue;
            }

            ParsedPayment payment = new ParsedPayment();
            payment.setDueDate(dueDate);
            payment.setAmount(roundMoney(amount));
            payment.setPaidDate(parseDate(getCell(row, paidDateCol)));
            String status = getCell(row, statusCol).toLowerCase(Locale.ROOT);
            boolean paid = payment.getPaidDate() != null || status.contains("paid") || status.equals("yes") || status.equals("true");
            payment.setIsPaid(paid);
            result.getPayments().add(payment);
        }
        result.getPayments().sort(Comparator.comparing(ParsedPayment::getDueDate));
        return result;
    }

    private int findHeaderIndex(List<List<String>> rows) {
        for (int i = 0; i < Math.min(rows.size(), 20); i++) {
            List<String> normalized = rows.get(i).stream().map(this::normalizeHeader).collect(Collectors.toList());
            boolean hasDate = findColumn(normalized, "due date", "emi date", "payment date", "installment date", "instalment date", "date") >= 0;
            boolean hasAmount = findColumn(normalized, "emi", "installment", "instalment", "payment", "amount", "total payment", "total") >= 0;
            if (hasDate && hasAmount) {
                return i;
            }
        }
        return -1;
    }

    private void detectLoanMetadata(Map<String, Object> detectedLoan, List<String> headers, List<List<String>> rows, int headerIndex) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("name", getFirstValue(headers, rows, headerIndex, "loan name", "name", "account name"));
        fields.put("lender", getFirstValue(headers, rows, headerIndex, "lender", "bank", "institution"));
        fields.put("type", getFirstValue(headers, rows, headerIndex, "type", "loan type"));
        fields.put("principal", getFirstValue(headers, rows, headerIndex, "principal", "loan amount", "sanctioned amount"));
        fields.put("rate", getFirstValue(headers, rows, headerIndex, "rate", "interest rate", "roi"));

        fields.forEach((key, value) -> {
            if (value != null && !value.isBlank()) {
                if (key.equals("principal") || key.equals("rate")) {
                    Double number = parseMoney(value);
                    if (number != null) detectedLoan.put(key, number);
                } else {
                    detectedLoan.put(key, value.trim());
                }
            }
        });
    }

    private void fillDerivedLoanFields(ScheduleUploadResult result) {
        if (!result.getPayments().isEmpty()) {
            result.getDetectedLoan().putIfAbsent("tenure", result.getPayments().size());
            result.getDetectedLoan().putIfAbsent("emi", mostCommonAmount(result.getPayments()));
        }
    }

    private List<String> findMissingFields(ScheduleUploadResult result) {
        List<String> missing = new ArrayList<>();
        Map<String, Object> loan = result.getDetectedLoan();
        if (isBlankObject(loan.get("name"))) missing.add("name");
        if (loan.get("principal") == null) missing.add("principal");
        if (loan.get("tenure") == null) missing.add("tenure");
        if (loan.get("emi") == null) missing.add("emi");
        if (isBlankObject(loan.get("lender"))) missing.add("lender");
        if (isBlankObject(loan.get("type"))) missing.add("type");
        if (result.getPayments().isEmpty()) missing.add("payments");
        return missing;
    }

    private List<String> validateLoanForSchedule(Loan loan) {
        List<String> missing = new ArrayList<>();
        if (loan.getUserId() == null) missing.add("userId");
        if (loan.getName() == null || loan.getName().isBlank()) missing.add("name");
        if (loan.getPrincipal() == null || loan.getPrincipal() <= 0) missing.add("principal");
        if (loan.getEmi() == null || loan.getEmi() < 0) missing.add("emi");
        if (loan.getLender() == null || loan.getLender().isBlank()) missing.add("lender");
        if (loan.getType() == null || loan.getType().isBlank()) missing.add("type");
        return missing;
    }

    private String getFirstValue(List<String> headers, List<List<String>> rows, int headerIndex, String... aliases) {
        int col = findColumn(headers, aliases);
        if (col < 0) return null;
        for (int i = headerIndex + 1; i < rows.size(); i++) {
            String value = getCell(rows.get(i), col);
            if (!value.isBlank()) return value;
        }
        return null;
    }

    private int findColumn(List<String> headers, String... aliases) {
        for (String alias : aliases) {
            String normalizedAlias = normalizeHeader(alias);
            for (int i = 0; i < headers.size(); i++) {
                String header = headers.get(i);
                if (header.equals(normalizedAlias) || header.contains(normalizedAlias) || normalizedAlias.contains(header)) {
                    return i;
                }
            }
        }
        return -1;
    }

    private List<String> splitCsvLine(String line) {
        List<String> cells = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                quoted = !quoted;
            } else if (c == ',' && !quoted) {
                cells.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        cells.add(current.toString());
        return cells;
    }

    private String getCell(List<String> row, int index) {
        if (index < 0 || index >= row.size() || row.get(index) == null) return "";
        return row.get(index).trim();
    }

    private String normalizeHeader(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        String cleaned = value.trim().replaceAll("(\\d+)(st|nd|rd|th)", "$1");
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("d-M-yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("MMM d yyyy", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH)
        );
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(cleaned.replace(",", ""), formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }

    private Double parseMoney(String value) {
        if (value == null || value.isBlank()) return null;
        Matcher matcher = Pattern.compile("-?\\d+(?:,\\d{2,3})*(?:\\.\\d+)?|-?\\d+(?:\\.\\d+)?").matcher(value.replace("₹", ""));
        if (!matcher.find()) return null;
        try {
            return Double.parseDouble(matcher.group().replace(",", ""));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Double mostCommonAmount(List<ParsedPayment> payments) {
        return payments.stream()
                .filter(p -> p.getAmount() != null)
                .collect(Collectors.groupingBy(ParsedPayment::getAmount, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private boolean isBlankObject(Object value) {
        return value == null || value.toString().isBlank();
    }

    private Double roundMoney(Double value) {
        return value == null ? null : Math.round(value * 100.0) / 100.0;
    }
}
