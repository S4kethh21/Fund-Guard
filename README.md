# 🛡️  Fraud Guard — MPLADS AI Surveillance & Audit System

**Smart India Hackathon (SIH 2026)**  
*Scheme Expenditure Tracking & Utilization AI (SETU-AI) for India's MPLADS (Members of Parliament Local Area Development Scheme).*

---

## 🚀 Quickstart: Streamlit Web Dashboard

The entire application runs with a **single command**:

```bash
streamlit run app.py
```

Open your browser at:  
👉 **`http://localhost:8501`**

---

## 🏛️ Executive Summary

Under the MPLADS government scheme, each Member of Parliament (MP) receives **₹5 Crore per year** for local developmental works. 

**SETU-AI** provides a multi-layer decision-support and fraud detection system for **District Magistrates (DMs)**, **State Nodal Officers**, and **Comptroller & Auditor General (CAG)** field inspection teams to rapidly prioritize and investigate high-risk projects.

> **Official Model Disclosure Statement:**  
> *"Risk scores combine rule-based checks (calibrated against real CAG audit findings) and an Isolation Forest anomaly detection model. This demo uses synthetic project data layered on real MP allocation records, pending integration with live eSAKSHI portal data."*

---

## 🔍 The Three Detection Layers Built

1. **Layer 1: Statutory Heuristic Rules & Isolation Forest (Risk Scoring)**
   - Flags prohibited categories under MPLADS Guidelines Clause 5.1 (commercial complexes, religious assets, private residential roads).
   - Flags single-bid/nomination works $\ge$ ₹25 Lakh without open e-tender under GFR 2017 Rule 149/194.
   - Flags low utilization ($<40\%$) on completed/aging projects.
   - Category-wise Isolation Forest detects multivariate cost deviations.
   - Combined Formula: `risk_score = prohibited*0.4 + no_tender*0.3 + low_util*0.1 + ml_score*0.2`

2. **Layer 2: Contractor/Agency Network Graph (`networkx` + `plotly`)**
   - Bipartite graph mapping contractors to distinct states.
   - Flags contractors operating across an unusually high number of distinct states (top 5% percentile, e.g. $\ge 4$ states) as potential collusion signals (e.g. *Om Sai Construction Co* active across 7 states, *Vanguard Civil Infrastructure Ltd* active across 6 states).
   - Interactive Plotly network graph with highlighted red nodes and hover details.

3. **Layer 3: Physical Evidence & GPS Consistency Check (`geopy`)**
   - Computes geodesic distance (in km) from project coordinates to state centers.
   - Flags works $> 300\text{ km}$ outside expected state borders as geographic discrepancies (ghost works or misreported GPS coordinates).
   - Interactive Mapbox scatter plot coloring verified vs mismatched works.

4. **Combined Overall Risk Indicator**
   - Synthesizes an **Overall Risk Level** (`High`, `Medium`, `Low`) and a unified plain-English explanation assembling all active reasons:
     > *“High Risk — Work category is prohibited under MPLADS guidelines Clause 5.1; Contractor 'Om Sai Construction Co' flagged for multi-state collusion (active across 7 states); Work GPS location does not match claimed district (412 km from state center).”*

---

## 📑 The 5 Dashboard Pages

1. **🏛️ Overview**: Headline KPI cards (Total Works, Total Sanctioned Funds, High-Risk Flags, Suspicious Networks), interactive Bar Chart of flagged works per state, interactive Donut Chart of risk reasons, and urgent priority watchlist.
2. **📋 Audit Worklist**: Master inspection queue sorted by `risk_score` descending. Multi-attribute sidebar filters. Expandable project dossier with full plain-English audit finding and 3-layer status badges. **"📥 Download Top 20 for Field Audit (CSV)" export button.**
3. **🕸️ Contractor Network**: Interactive NetworkX + Plotly network graph highlighting collusion clusters, plus a complete contractor directory sorted by distinct states.
4. **📍 Geo-Evidence Check**: India-wide Project Geotag Audit Map (Mapbox) highlighting works with $>300\text{ km}$ discrepancy, plus a register table.
5. **ℹ️ About / Methodology**: Complete technical disclosure on real vs synthetic data, plus **Live Empirical Model Validation** computed live on ground truth (Precision: 69.0%, Recall: 77.4%, F1: 0.730).

---

## 📁 Datasets Included (`data/`)

- `mp_allocations_clean.csv`: 542 real Lok Sabha MPs, states, constituencies, and ₹5 Crore annual allocation.
- `mplads_works_synthetic.csv`: 3,258 development works with `true_anomaly_type` ground truth.
- `mplads_works_scored.csv`: Master scored dataset with rule flags, ML anomaly scores, risk scores, and plain-English explanations.
