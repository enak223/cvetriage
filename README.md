# CVETriage

> Automated CVE detection, prioritization, and remediation reporting pipeline powered by Nmap, Wazuh, n8n, NVD API v2.0, and Claude AI.

![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-n8n-orange) ![Status](https://img.shields.io/badge/status-active-brightgreen)

## Overview

CVETriage is a homelab-grade vulnerability management pipeline that automatically scans a network subnet, enriches discovered services with CVE data from the National Vulnerability Database, triages findings using AI, and delivers a prioritized remediation report — all on a daily schedule with zero manual intervention.

Built as a portfolio project demonstrating SOC automation, vulnerability management, and AI-assisted triage.

## Architecture

\`\`\`
Schedule Trigger (daily 02:00)
        │
        ▼
SSH → Nmap Scan (Kali Linux)
  -sV -sC -oX scan.xml 192.168.248.0/24
        │
        ▼
Parse XML (Code Node)
  Extract host / port / service / version
        │
        ▼
Loop Services (one per iteration)
        │
        ├──► NVD API v2.0
        │    keywordSearch = product + version
        │
        ├──► AI Triage (Claude claude-sonnet-4-6)
        │    Priority: Critical / High / Medium / Low
        │
        └──► Severity Filter (CVSS ≥ 7.0 → Critical)
                │
                ▼
        Report Builder (Markdown)
                │
                ▼
        Save to Disk (SSH → ubuntuai)
\`\`\`

## Homelab Environment

| VM | IP | Role |
|----|----|------|
| ubuntuai | 192.168.248.20 | n8n orchestration, Wazuh Manager |
| Kali Linux | 192.168.248.130 | Nmap scanner |
| Ubuntu Web Server | 192.168.248.139 | Scan target |
| Windows 11 | 192.168.248.128 | Scan target |

Network: \`192.168.248.0/24\` (VMware host-only)

## Pipeline Nodes

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | CVETriage - Schedule | Schedule Trigger | Fires daily at 02:00 |
| 2 | CVETriage - Nmap Scan | SSH | Runs Nmap on Kali against subnet |
| 3 | CVETriage - Parse XML | Code (JS) | Extracts open ports with product/version |
| 4 | CVETriage - Loop Services | Loop | Iterates one service per cycle |
| 5 | CVETriage - NVD Lookup | HTTP Request | Queries NVD API v2.0 per service |
| 6 | CVETriage - AI Triage | AI Agent | Claude prioritizes CVEs + recommends fixes |
| 7 | CVETriage - Severity Filter | IF | Passes Critical findings only |
| 8 | CVETriage - Report Builder | Code (JS) | Builds markdown CVE report |
| 9 | CVETriage - Write File | Code (JS) | Prepares binary file output |
| 10 | CVETriage - Save to Disk | SSH | Writes report to ubuntuai via SSH |

## Sample Output

\`\`\`markdown
# CVETriage Report
**Generated:** 2026-06-14T16:08:05.397Z

---

## dnsmasq 2.86 — 192.168.248.2:53

| CVE ID | CVSS | Priority | Summary |
|--------|------|----------|---------|
| CVE-2021-45951 | 9.8 | Critical | Heap-based buffer overflow in check_bad_address() in dnsmasq 2.86, exploitable remotely without authentication. |
| CVE-2021-45952 | 9.8 | Critical | Heap-based buffer overflow in dhcp_reply() in dnsmasq 2.86, remotely exploitable without credentials. |

### Remediation Steps
- **CVE-2021-45951:** Upgrade dnsmasq to 2.87 or later.
- **CVE-2021-45952:** Upgrade dnsmasq to 2.87 or later and restrict DHCP exposure to trusted segments.
\`\`\`

## Tech Stack

| Tool | Purpose |
|------|---------|
| [n8n](https://n8n.io) | Workflow orchestration |
| [Nmap](https://nmap.org) | Network scanning + service detection |
| [NVD API v2.0](https://nvd.nist.gov/developers/vulnerabilities) | CVE enrichment + CVSS scoring |
| [Claude claude-sonnet-4-6](https://anthropic.com) | AI triage + remediation recommendations |
| [Wazuh](https://wazuh.com) | SIEM + agent event ingestion |
| SSH | Secure remote command execution |

## Project Structure

\`\`\`
cvetriage/
├── README.md
├── workflows/
│   └── cvetriage_workflow.json
├── scripts/
│   └── parse_nmap_n8n.js
├── prompts/
│   └── triage_prompt.md
└── reports/
    └── sample_report.md
\`\`\`

## Setup

### Prerequisites

- n8n self-hosted via Docker
- Nmap installed on a reachable VM (Kali recommended)
- Anthropic API key
- SSH access between n8n host and scanner VM

### Credentials Required in n8n

| Credential | Type | Used By |
|------------|------|---------|
| Kali SSH | SSH Password | CVETriage - Nmap Scan |
| ubuntuai SSH | SSH Password | CVETriage - Save to Disk |
| Anthropic API | API Key | CVETriage - AI Triage |

### Installation

1. Clone this repo on **ubuntuai** terminal:
\`\`\`bash
git clone https://github.com/enak223/cvetriage.git
cd cvetriage
\`\`\`

2. Import the workflow into n8n:
   - Open n8n → Workflows → Import from file
   - Select \`workflows/cvetriage_workflow.json\`

3. Configure credentials in n8n for SSH (Kali + ubuntuai) and Anthropic API

4. Create the reports directory:
\`\`\`bash
mkdir -p /home/ubuntuai/cvetriage_reports
\`\`\`

5. Activate the workflow

## Key Design Decisions

**Why Kali for scanning?** Nmap is natively installed and the VM is purpose-built for offensive tooling, keeping the scanner isolated from the n8n orchestration host.

**Why filter empty product/version?** Services without detected versions produce irrelevant NVD results. The Parse XML node skips any open port where Nmap couldn't fingerprint a product.

**Why slice NVD results to top 5?** The NVD API can return thousands of CVEs for broad keyword searches. Limiting to 5 per service keeps AI triage token costs low while capturing the highest-severity findings.

**Why SSH for report delivery?** The n8n Docker container's volume mount only covers \`/home/node/.n8n\`. SSH to the host bypasses container filesystem isolation cleanly.

## Roadmap

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

## Author

**Eliezer Fuentes** — Cybersecurity Professional

Threat Hunting | Vulnerability Management | SOC Automation | Offensive Security

[![GitHub](https://img.shields.io/badge/GitHub-enak223-181717?logo=github)](https://github.com/enak223)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-eliezerfuentes-0A66C2?logo=linkedin)](https://linkedin.com/in/eliezerfuentes)

---

*Detect. Triage. Remediate.*
