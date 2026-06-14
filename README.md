# 🔍 CVETriage
### Automated CVE Detection, Prioritization & Remediation Reporting

> *"Don't wait for the breach. Find the vulnerability first."*

[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)](https://github.com/enak223)
[![Stack](https://img.shields.io/badge/Stack-Nmap%20%7C%20NVD%20API%20%7C%20n8n%20%7C%20Claude%20AI-blue?style=flat-square)](https://github.com/enak223)
[![Mode](https://img.shields.io/badge/Mode-Automated%20%7C%20Daily--Scan-orange?style=flat-square)](https://github.com/enak223)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](LICENSE)

---

## 📌 Overview

**CVETriage** is an automated vulnerability management pipeline built for homelabs and small environments. It scans your network daily, enriches every detected service with CVE data from the National Vulnerability Database, and uses AI to prioritize findings and generate actionable remediation reports — all without manual intervention.

It answers three questions automatically:
- **What's exposed?** — Nmap scans the subnet and fingerprints every open port, service, and version across all live hosts.
- **How dangerous is it?** — NVD API v2.0 enriches each service with its CVE history and CVSS scores. Claude AI triages the findings and assigns priority: Critical, High, Medium, or Low.
- **How do we fix it?** — A structured markdown report is generated per scan with CVE IDs, CVSS scores, summaries, and one-sentence remediation steps for every Critical finding.

No manual lookups. No spreadsheets. Just automated, AI-assisted vulnerability triage.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CVETRIAGE PIPELINE                            │
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐     ┌──────────────────┐    │
│  │   SCAN       │────▶│   ENRICH     │────▶│    TRIAGE        │    │
│  │              │      │              │     │                  │    │
│  │ Nmap -sV -sC │      │ NVD API v2.0 │     │ Claude AI Agent  │    │
│  │ SSH to Kali  │      │ CVE Lookup   │     │ CVSS Prioritizer │    │
│  │ XML Output   │      │ CVSS Scoring │     │ Severity Filter  │    │
│  └──────────────┘      └──────────────┘     └──────────────────┘    │
│                                                     │               │
│  ┌──────────────┐      ┌──────────────┐     ┌───────▼──────────┐    │
│  │  DELIVER     │◀────│   BUILD      │◀────│    FILTER        │    │
│  │              │      │              │     │                  │    │
│  │ SSH to Host  │      │ Report       │     │ CVSS ≥ 7.0       │    │
│  │ Markdown     │      │ Builder      │     │ Critical Only    │    │
│  │ Daily Report │      │ CVE Table    │     │ IF Node          │    │
│  └──────────────┘      └──────────────┘     └──────────────────┘    │
│                                                                     │
│         ┌────────────────────────────────────────┐                  │
│         │        DAILY AUTOMATED SCHEDULE        │                  │
│         │   Triggers at 02:00 — zero touch       │                  │
│         │   n8n orchestrates the full pipeline   │                  │
│         └────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
```
Schedule Trigger (02:00 daily)
    └──▶ SSH → Kali Linux: nmap -sV -sC -oX scan.xml 192.168.248.0/24
             └──▶ Code Node: parse XML → extract host / port / service / version
                      └──▶ Loop Services: one service per iteration
                               └──▶ NVD API v2.0: keywordSearch = product + version
                                        └──▶ Claude AI: triage → CVSS priority + remediation
                                                 └──▶ Severity Filter: CVSS ≥ 7.0 → Critical
                                                          └──▶ Report Builder: markdown CVE table
                                                                   └──▶ SSH → ubuntuai: save report
```

---

## 🧰 Tech Stack

| Component | Tool | Role |
|-----------|------|------|
| **Network Scanner** | Nmap 7.x | Service detection, version fingerprinting, XML output |
| **CVE Database** | NVD API v2.0 | CVE lookup, CVSS scoring, CPE matching |
| **AI Triage** | Claude claude-sonnet-4-6 | CVE prioritization, remediation recommendations |
| **Orchestration** | n8n (self-hosted) | Pipeline scheduling, node chaining, loop logic |
| **SIEM** | Wazuh 4.x | Agent telemetry, alert correlation (future integration) |
| **Scanner Host** | Kali Linux | Nmap execution via SSH |
| **Report Storage** | ubuntuai host | Markdown report delivery via SSH |
| **Host OS** | Ubuntu 22.04 | Primary n8n orchestration host |
| **Virtualization** | VMware Workstation | Homelab multi-VM environment |

---

## ✨ Features

### 🔎 Automated Network Scanning
- Nmap runs daily via SSH to the Kali Linux VM — fully automated, no manual trigger needed
- Service version detection (`-sV`) and default script scanning (`-sC`) for deep fingerprinting
- XML output parsed by a custom JavaScript Code node into structured host/port/service/version objects
- Empty product/version filter eliminates services Nmap couldn't fingerprint — no irrelevant CVE noise

### 📋 NVD API v2.0 Enrichment
- Each detected service triggers an NVD API v2.0 query using `product + version` as the keyword
- Returns CVE IDs, CVSS base scores, vulnerability descriptions, publication dates, and CPE identifiers
- Results capped at top 5 CVEs per service to control AI triage token costs while capturing highest-severity findings
- Loop node ensures services are processed one at a time to avoid API rate limiting

### 🤖 AI-Assisted Triage
- Claude claude-sonnet-4-6 receives NVD data and scanned service context per iteration
- Assigns priority based on CVSS: Critical (9.0+), High (7.0–8.9), Medium (4.0–6.9), Low (below 4.0)
- Generates a one-sentence plain-English summary and remediation recommendation per CVE
- Returns structured JSON for downstream report building — no parsing ambiguity

### 🚨 Severity Filtering
- IF node filters AI triage output — only Critical findings proceed to the report
- Low-signal services (unrecognized, no version, zero NVD results) are suppressed before reaching the AI
- Prevents report bloat from informational findings that don't require immediate action

### 📄 Automated Report Delivery
- Report Builder Code node generates a structured markdown document with CVE tables and remediation steps
- Delivered via SSH to `/home/ubuntuai/cvetriage_reports/cvetriage_report.md` on the ubuntuai host
- Report overwrites on each run — always reflects the current state of the network

---

## 📁 Project Structure

```
cvetriage/
├── README.md
│
├── workflows/
│   └── cvetriage_workflow.json       # n8n exportable workflow (import-ready)
│
├── scripts/
│   └── parse_nmap_n8n.js             # Nmap XML parser — n8n Code node script
│
├── prompts/
│   └── triage_prompt.md              # Claude AI triage system prompt
│
└── reports/
    └── sample_report.md              # Example CVETriage output report
```

---

## ⚙️ Setup & Installation

### Prerequisites

```
- Ubuntu 22.04 LTS (n8n orchestration host)
- n8n self-hosted via Docker
- Kali Linux VM with Nmap installed
- SSH access from n8n host to Kali VM
- SSH access from n8n host to report destination
- Anthropic API key (Claude claude-sonnet-4-6)
- Network subnet to scan (192.168.248.0/24 or adjust to your environment)
```

### 1. Clone the Repository

```bash
git clone https://github.com/enak223/cvetriage.git
cd cvetriage
```

### 2. Create Reports Directory

```bash
# On the report destination host (ubuntuai)
mkdir -p /home/ubuntuai/cvetriage_reports
```

### 3. Import n8n Workflow

```
- Open n8n → Workflows → Import from file
- Select workflows/cvetriage_workflow.json
- Configure credentials (see below)
- Activate the workflow
```

### 4. Configure Credentials in n8n

| Credential | Type | Used By |
|------------|------|---------|
| Kali SSH | SSH Password | CVETriage - Nmap Scan |
| ubuntuai SSH | SSH Password | CVETriage - Save to Disk |
| Anthropic API | API Key | CVETriage - AI Triage (Chat Model) |

### 5. Verify SSH Connectivity

```bash
# From ubuntuai — confirm Kali SSH is reachable
ssh kaliai@192.168.248.130

# Ensure SSH service is running on Kali
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 6. Test the Pipeline

```
- Open the CVETriage workflow in n8n
- Click Execute workflow
- Check /home/ubuntuai/cvetriage_reports/cvetriage_report.md
```

---

## 🔧 n8n Pipeline Nodes

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | CVETriage - Schedule | Schedule Trigger | Fires daily at 02:00 |
| 2 | CVETriage - Nmap Scan | SSH | Runs Nmap on Kali — outputs XML to stdout |
| 3 | CVETriage - Parse XML | Code (JS) | Parses XML, filters empty product/version |
| 4 | CVETriage - Loop Services | Loop | Iterates one service per cycle |
| 5 | CVETriage - NVD Lookup | HTTP Request | GET NVD API v2.0 per nvdKeyword |
| 6 | CVETriage - AI Triage | AI Agent | Claude triages CVEs, returns priority JSON |
| 7 | CVETriage - Severity Filter | IF | Passes Critical findings only |
| 8 | CVETriage - Report Builder | Code (JS) | Builds markdown CVE report |
| 9 | CVETriage - Write File | Code (JS) | Prepares binary file with base64 encoding |
| 10 | CVETriage - Save to Disk | SSH | Writes report to ubuntuai via echo redirect |

---

## 📊 Sample Output

```markdown
# CVETriage Report
**Generated:** 2026-06-14T16:08:05.397Z

---

## dnsmasq 2.86 — 192.168.248.2:53

| CVE ID | CVSS | Priority | Summary |
|--------|------|----------|---------|
| CVE-2021-45951 | 9.8 | Critical | Heap-based buffer overflow in check_bad_address() in dnsmasq 2.86, exploitable remotely without authentication. |
| CVE-2021-45952 | 9.8 | Critical | Heap-based buffer overflow in dhcp_reply() in dnsmasq 2.86, allowing remote unauthenticated attackers to potentially execute arbitrary code. |
| CVE-2021-45953 | 9.8 | Critical | Heap-based buffer overflow in extract_name() in dnsmasq 2.86, enabling remote unauthenticated code execution. |

### Remediation Steps
- **CVE-2021-45951:** Upgrade dnsmasq to 2.87 or later to obtain the security patch addressing this heap overflow.
- **CVE-2021-45952:** Upgrade dnsmasq to 2.87 or later and restrict DHCP service exposure to trusted network segments.
- **CVE-2021-45953:** Upgrade dnsmasq to 2.87 or later and apply network-level controls to limit DNS query sources.

---
```

---

## 🏠 Homelab Environment

```
┌─────────────────────────────────────────────────────────┐
│           CVETRIAGE HOMELAB — VMware Workstation        │
│                                                         │
│  VMnet: Host-Only (192.168.248.0/24)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  VM 1: ubuntuai — n8n Orchestration + Wazuh     │    │
│  │  IP: 192.168.248.20                             │    │
│  │  Role: n8n pipeline host, report storage        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  VM 2: Kali Linux — Scanner                     │    │
│  │  IP: 192.168.248.130                            │    │
│  │  Role: Nmap execution via SSH                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  VM 3: Ubuntu Web Server — Scan Target          │    │
│  │  IP: 192.168.248.139                            │    │
│  │  Role: Passively scanned target                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  VM 4: Windows 11 — Scan Target                 │    │
│  │  IP: 192.168.248.128                            │    │
│  │  Role: Passively scanned target                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Notes

- CVETriage is **read-only** at the network level. Nmap scans are passive fingerprinting — no exploitation.
- API keys (Anthropic) are stored as n8n credentials — never committed to version control.
- SSH credentials use password authentication within the homelab. Use key-based auth in production.
- NVD API v2.0 is used without an API key (public rate limit: 5 requests/30s). Add an NVD API key for higher throughput.
- **Authorized use only.** CVETriage must only be run against networks you own or have explicit written authorization to scan.

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| v1.0 | Nmap subnet scan via SSH to Kali Linux | ✅ Complete |
| v1.0 | Nmap XML parser — host/port/service/version extraction | ✅ Complete |
| v1.0 | NVD API v2.0 integration per detected service | ✅ Complete |
| v1.0 | AI triage via Claude claude-sonnet-4-6 with CVSS prioritization | ✅ Complete |
| v1.0 | Severity filter — Critical findings only | ✅ Complete |
| v1.0 | Markdown remediation report generation | ✅ Complete |
| v1.0 | Automated report delivery to ubuntuai via SSH | ✅ Complete |
| v1.0 | Empty product/version filter — eliminate irrelevant CVE matches | ✅ Complete |
| v1.0 | GitHub repo with workflow export, scripts, prompts, and sample report | ✅ Complete |
| v1.1 | Add Windows 11 and Ubuntu web server to scan scope | 🔲 Future |
| v1.1 | Store historical reports with timestamp-based filenames | 🔲 Future |
| v1.2 | Integrate Wazuh alerts as a second CVE trigger source | 🔲 Future |
| v1.2 | Add Slack/email notification on Critical findings | 🔲 Future |
| v1.3 | Add CVSS vector string parsing for attack vector context | 🔲 Future |
| v1.4 | Build a dashboard to visualize CVE trends over time | 🔲 Future |

---

## 👤 Author

**Eliezer Fuentes** — Cybersecurity Professional

Threat Hunting | Vulnerability Management | SOC Automation | Offensive Security

[![GitHub](https://img.shields.io/badge/GitHub-enak223-181717?style=flat&logo=github)](https://github.com/enak223)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-eliezerfuentes-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/eliezerfuentes/)

---

> *Detect. Triage. Remediate.*
