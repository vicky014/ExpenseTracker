# Repayment Schedule Upload Feature Plan

## Summary

Add a debt upload flow where the user selects a repayment schedule file (`.csv`, `.xlsx`, or `.pdf`), the backend parses it, auto-detects schedule columns, and creates one debt entry (`Loan`) plus repayment rows (`EmiPayment`). If required loan details cannot be found in the file, the UI shows: "File does not contain the following fields, please add manually," then collects only the missing fields before saving.

## Key Changes

- Add a backend upload endpoint under `POST /api/loans/upload-schedule` using `multipart/form-data`.
- Support CSV, XLSX, and PDF parsers.
- Auto-detect due date, EMI amount, paid date, status, principal, rate, lender, loan name, and loan type where present.
- Add a save endpoint that creates a `Loan` from parsed schedule data and user-completed metadata.
- Add frontend upload UI inside the existing "Add New Active Debt" card.
- Show a preview summary before saving: installment count, first due date, last due date, and detected loan fields.
- Keep local fallback behavior for CSV only; require the backend for XLSX and PDF parsing.

## Test Plan

- Verify CSV upload detects due date and amount columns.
- Verify XLSX upload parses the first worksheet.
- Verify PDF upload parses simple text/table schedules.
- Verify missing metadata prompts manual entry instead of saving incomplete debt.
- Verify a completed upload creates one loan and the expected EMI checklist rows.
- Run `mvn clean test` from `backend/`.
- Run `npm run build` from `frontend/`.

## Assumptions

- "Debt" maps to the existing `Loan` entity.
- "Repayment schedule" maps to existing `EmiPayment` rows.
- PDF parsing is best-effort; scanned/image-only PDFs should ask the user to upload CSV/XLSX or enter details manually.
- No database schema change is required for this version.
