# Contributing to Sigil

Thank you for your interest in contributing to Sigil!

## Getting Started

```bash
git clone https://github.com/nousresearch/sigil.git
cd sigil
npm install
npx hardhat compile
npx hardhat test
```

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npx hardhat test`
5. Run lint: `npm run lint`
6. Commit with clear messages
7. Push and open a Pull Request

## Code Style

- TypeScript with strict mode
- Solidity 0.8.x with NatSpec comments
- 2-space indentation
- Descriptive variable names

## Pull Request Guidelines

- One feature per PR
- Include tests for new functionality
- Update documentation if needed
- Keep PRs small and focused

## Smart Contract Guidelines

- Follow [Solidity style guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- All public functions must have NatSpec
- Events for all state changes
- Revert with descriptive error messages
- Gas optimization is welcome but not at the cost of readability

## Testing

- Unit tests for all contract functions
- Integration tests for SDK workflows
- Run: `npx hardhat test`

## Questions?

Open a GitHub Discussion or reach out on our community channels.
