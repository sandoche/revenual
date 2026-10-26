# Security and maintenance status

This legacy application is intended for local evaluation. Credential/data sanitation is not a complete security review. Application-security and dependency-hardening work remains, and provider integrations use older APIs. Do not expose it to untrusted users or enable live billing until that work is complete.

Report suspected vulnerabilities privately to the maintainer at sandoche@gmail.com. Do not include live credentials, reports, private keys or personal data in public issues. Never upload an environment file, service-account JSON key or database dump.

If credentials may have been exposed, remove them from code **and revoke/rotate them at the provider**. Deleting files or starting fresh Git history does not invalidate tokens, sessions, passwords or keys. Review affected database records and backups too.
