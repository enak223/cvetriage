# CVETriage Report
**Generated:** 2026-06-14T16:08:05.397Z

---

## dnsmasq 2.86 — 192.168.248.2:53

| CVE ID | CVSS | Priority | Summary |
|--------|------|----------|---------|
| CVE-2021-45951 | 9.8 | Critical | Heap-based buffer overflow in check_bad_address() in dnsmasq 2.86, exploitable remotely without authentication, potentially allowing code execution. |
| CVE-2021-45952 | 9.8 | Critical | Heap-based buffer overflow in dhcp_reply() in dnsmasq 2.86, exploitable remotely without authentication, potentially compromising confidentiality, integrity, and availability. |
| CVE-2021-45953 | 9.8 | Critical | Heap-based buffer overflow in extract_name() (called from hash_questions) in dnsmasq 2.86, allowing a remote unauthenticated attacker to potentially execute arbitrary code. |
| CVE-2021-45954 | 9.8 | Critical | Heap-based buffer overflow in extract_name() (called from answer_auth) in dnsmasq 2.86, remotely exploitable without credentials, posing full CIA impact risk. |
| CVE-2021-45955 | 9.8 | Critical | Heap-based buffer overflow in resize_packet() in dnsmasq 2.86 due to missing bounds check on pseudo header re-insertion, exploitable remotely without authentication. |

### Remediation Steps
- **CVE-2021-45951:** Upgrade dnsmasq to the latest available version (2.87 or later) that includes security patches addressing this heap overflow condition.
- **CVE-2021-45952:** Upgrade dnsmasq to the latest available version (2.87 or later) and restrict DHCP service exposure to trusted network segments using firewall rules.
- **CVE-2021-45953:** Upgrade dnsmasq to the latest available version (2.87 or later) and apply network-level access controls to limit DNS query sources.
- **CVE-2021-45954:** Upgrade dnsmasq to the latest available version (2.87 or later) and restrict DNS authoritative service access via firewall rules to authorized clients only.
- **CVE-2021-45955:** Upgrade dnsmasq to the latest available version (2.87 or later) which includes the referenced security patch correcting the bounds check in resize_packet().

---


