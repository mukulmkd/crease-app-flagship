# Feature: Team Fund

Admin tracker for Ranches Thunders funds.

- Opening balance / historical import via ledger transactions (`FundService.setOpeningBalance`)
- Expenses decrease balance immediately (Home **Add expense** sheet)
- Manual ₹300 contribution asks — Home **Ask ₹300** sheet → in-app notify + WhatsApp if configured
- Balance shown on Home status rail via `DashboardSnapshot.fundBalanceInr`
- Player: view balance only (`FUND_VIEW`)
