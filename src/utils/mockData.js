/**
 * utils/mockData.js
 *
 * Used automatically when VITE_AIRTABLE_PAT is not set.
 * Mirrors the normalised shape produced by airtableClient.normalise().
 */

export const MOCK_RECORDS = [
  // ── Oct 2024 ──────────────────────────────────────────────────────────────
  { id:'r01', date:'2024-10-03', platform:'Facebook',  spend:4200, clicks:1840, impressions:62000, conversions:38, deals:12, wins:4 },
  { id:'r02', date:'2024-10-11', platform:'Google',    spend:5100, clicks:2900, impressions:48000, conversions:61, deals:19, wins:7, linkedDealIds:['rec_mock_1','rec_mock_2'] },
  { id:'r03', date:'2024-10-18', platform:'Microsoft', spend:1200, clicks:490,  impressions:18000, conversions:11, deals:4,  wins:1 },
  { id:'r04', date:'2024-10-25', platform:'TikTok',    spend:900,  clicks:3200, impressions:95000, conversions:9,  deals:2,  wins:0 },
  // ── Nov 2024 ──────────────────────────────────────────────────────────────
  { id:'r05', date:'2024-11-04', platform:'Facebook',  spend:4600, clicks:2100, impressions:68000, conversions:44, deals:14, wins:5, linkedDealIds:['rec_mock_4'] },
  { id:'r06', date:'2024-11-12', platform:'Google',    spend:5400, clicks:3100, impressions:51000, conversions:67, deals:21, wins:8, linkedDealIds:['rec_mock_2','rec_mock_3'] },
  { id:'r07', date:'2024-11-19', platform:'Microsoft', spend:1100, clicks:410,  impressions:15000, conversions:9,  deals:3,  wins:1 },
  { id:'r08', date:'2024-11-26', platform:'TikTok',    spend:1200, clicks:4100, impressions:110000,conversions:12, deals:3,  wins:0 },
  // ── Dec 2024 ──────────────────────────────────────────────────────────────
  { id:'r09', date:'2024-12-05', platform:'Facebook',  spend:5200, clicks:2400, impressions:78000, conversions:52, deals:16, wins:6 },
  { id:'r10', date:'2024-12-13', platform:'Google',    spend:6100, clicks:3400, impressions:57000, conversions:73, deals:23, wins:9 },
  { id:'r11', date:'2024-12-20', platform:'Microsoft', spend:1400, clicks:550,  impressions:19000, conversions:13, deals:5,  wins:2 },
  { id:'r12', date:'2024-12-27', platform:'TikTok',    spend:1500, clicks:5200, impressions:130000,conversions:15, deals:4,  wins:1 },
  // ── Jan 2025 ──────────────────────────────────────────────────────────────
  { id:'r13', date:'2025-01-06', platform:'Facebook',  spend:3800, clicks:1700, impressions:58000, conversions:34, deals:11, wins:4 },
  { id:'r14', date:'2025-01-14', platform:'Google',    spend:4900, clicks:2700, impressions:45000, conversions:58, deals:18, wins:7 },
  { id:'r15', date:'2025-01-21', platform:'Microsoft', spend:1050, clicks:380,  impressions:14000, conversions:8,  deals:3,  wins:1 },
  { id:'r16', date:'2025-01-28', platform:'TikTok',    spend:800,  clicks:2800, impressions:88000, conversions:7,  deals:2,  wins:0 },
  // ── Feb 2025 ──────────────────────────────────────────────────────────────
  { id:'r17', date:'2025-02-05', platform:'Facebook',  spend:4400, clicks:2000, impressions:65000, conversions:41, deals:13, wins:5 },
  { id:'r18', date:'2025-02-13', platform:'Google',    spend:5200, clicks:2950, impressions:50000, conversions:63, deals:20, wins:8 },
  { id:'r19', date:'2025-02-20', platform:'Microsoft', spend:1150, clicks:440,  impressions:16000, conversions:10, deals:4,  wins:1 },
  { id:'r20', date:'2025-02-25', platform:'TikTok',    spend:1100, clicks:3800, impressions:105000,conversions:11, deals:3,  wins:0 },
  // ── Mar 2025 ──────────────────────────────────────────────────────────────
  { id:'r21', date:'2025-03-07', platform:'Facebook',  spend:4800, clicks:2200, impressions:71000, conversions:47, deals:15, wins:5 },
  { id:'r22', date:'2025-03-14', platform:'Google',    spend:5600, clicks:3200, impressions:53000, conversions:69, deals:22, wins:9 },
  { id:'r23', date:'2025-03-21', platform:'Microsoft', spend:1300, clicks:510,  impressions:18000, conversions:12, deals:5,  wins:2 },
  { id:'r24', date:'2025-03-28', platform:'TikTok',    spend:1300, clicks:4500, impressions:118000,conversions:13, deals:3,  wins:1 },
  // ── Previous period: Apr–Sep 2024 ─────────────────────────────────────────
  { id:'r25', date:'2024-04-05', platform:'Facebook',  spend:3500, clicks:1500, impressions:55000, conversions:30, deals:9,  wins:3 },
  { id:'r26', date:'2024-04-14', platform:'Google',    spend:4400, clicks:2500, impressions:42000, conversions:52, deals:16, wins:6 },
  { id:'r27', date:'2024-04-22', platform:'Microsoft', spend:950,  clicks:340,  impressions:13000, conversions:7,  deals:2,  wins:1 },
  { id:'r28', date:'2024-05-06', platform:'Facebook',  spend:3700, clicks:1600, impressions:57000, conversions:33, deals:10, wins:3 },
  { id:'r29', date:'2024-05-14', platform:'Google',    spend:4600, clicks:2600, impressions:44000, conversions:55, deals:17, wins:6 },
  { id:'r30', date:'2024-05-20', platform:'Microsoft', spend:1000, clicks:360,  impressions:14000, conversions:8,  deals:3,  wins:1 },
  { id:'r31', date:'2024-06-04', platform:'Facebook',  spend:4000, clicks:1750, impressions:60000, conversions:36, deals:11, wins:4 },
  { id:'r32', date:'2024-06-12', platform:'Google',    spend:4800, clicks:2700, impressions:46000, conversions:58, deals:18, wins:7 },
  { id:'r33', date:'2024-06-24', platform:'TikTok',    spend:700,  clicks:2500, impressions:80000, conversions:7,  deals:2,  wins:0 },
  { id:'r34', date:'2024-07-03', platform:'Facebook',  spend:3900, clicks:1650, impressions:58000, conversions:35, deals:11, wins:4 },
  { id:'r35', date:'2024-07-11', platform:'Google',    spend:4700, clicks:2650, impressions:45000, conversions:56, deals:17, wins:6 },
  { id:'r36', date:'2024-07-22', platform:'TikTok',    spend:750,  clicks:2700, impressions:85000, conversions:8,  deals:2,  wins:0 },
  { id:'r37', date:'2024-08-05', platform:'Facebook',  spend:4100, clicks:1800, impressions:63000, conversions:37, deals:12, wins:4 },
  { id:'r38', date:'2024-08-13', platform:'Google',    spend:4900, clicks:2800, impressions:48000, conversions:60, deals:19, wins:7 },
  { id:'r39', date:'2024-08-27', platform:'TikTok',    spend:820,  clicks:2900, impressions:90000, conversions:8,  deals:2,  wins:0 },
  { id:'r40', date:'2024-09-08', platform:'Facebook',  spend:4000, clicks:1700, impressions:61000, conversions:36, deals:11, wins:4 },
  { id:'r41', date:'2024-09-16', platform:'Google',    spend:4800, clicks:2750, impressions:47000, conversions:58, deals:18, wins:7 },
  { id:'r42', date:'2024-09-24', platform:'TikTok',    spend:800,  clicks:2800, impressions:88000, conversions:8,  deals:2,  wins:0 },
]

export const MOCK_DEALS = [
  { id: 'rec_mock_1', date: '2024-10-11', businessName: 'Summit Outdoor Co.', dealStage: 'Discovery', dealStatus: 'open', lostReason: null, label: 'New Lead' },
  { id: 'rec_mock_2', date: '2024-11-10', businessName: 'Harbor View Dental', dealStage: 'Consideration & Follow up', dealStatus: 'active', lostReason: null, label: 'Warm' },
  { id: 'rec_mock_3', date: '2024-11-12', businessName: 'Northline HVAC', dealStage: 'Proposal', dealStatus: 'won', lostReason: null, label: 'Partner' },
  { id: 'rec_mock_4', date: '2024-11-04', businessName: 'Cedar Creek Realty', dealStage: 'Closed', dealStatus: 'lost', lostReason: 'Budget', label: null },
]
