# SCHEMA (v1.0) — Replacement
الشيت يحوي أوراقًا باسم الجداول: `accounts, categories, transactions, budgets, projects, subscriptions`.

- **Header row (Row 1)**: أسماء الأعمدة بالترتيب الثابت.
- **Data rows**: من الصف 2 فصاعدًا.

## الجداول
### accounts
`id, name, type, currency, opening_balance`

### categories
`id, name, type, parent_id`

### transactions
`id, date, account_id, category_id, amount, note, tags, is_recurring, receipt_url, project_id`

### budgets
`id, month, category_id, amount`

### projects
`id, name, type`

### subscriptions
`id, name, amount, cycle, next_due`

> تُدار الثباتية عبر `schemas/schema.json` وربط الواجهات بـ `data-bind="<table>.<field>"`.
