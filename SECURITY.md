# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Sigil, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: security@sigil.dev (or open a private security advisory on GitHub).

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 1 week
- **Fix + disclosure**: coordinated with reporter

## Scope

- Smart contracts in `contracts/`
- SDK in `src/`
- Deployment scripts in `scripts/`

## Out of Scope

- Third-party dependencies (report upstream)
- Social engineering attacks
- Attacks requiring physical access to a developer's machine

## Best Practices for Users

- Never share private keys
- Use hardware wallets for contract ownership
- Verify contract addresses before interacting
- Audit metadata URIs before trusting them
- Consider reputation scores as one signal, not ground truth

## Bug Bounty

We currently do not offer a formal bug bounty program. Contributions that improve security are recognized in release notes.
