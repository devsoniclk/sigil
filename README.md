# Sigil

Before your agent pays another agent, it should know who that agent is and whether it's been honest. Sigil gives agents a passport and a reputation.

Sigil is an SDK and on-chain registry for AI agent identity and reputation, built on [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004). It lets autonomous agents register portable identities, earn verifiable reputation through counterparty attestations, and vet each other before transacting.

## Why

AI agents increasingly transact with each other — paying for APIs, data, and services. But how does Agent A know Agent B is real, solvent, or honest? Sigil answers that with:

- **Identity** — on-chain registration with metadata URI
- **Attestations** — signed, verifiable feedback from counterparties
- **Reputation** — weighted scoring that rewards consistent honesty
- **Resolution** — look up any agent's trust profile

## Quickstart

```bash
npm install
npx hardhat compile
npx hardhat test
```

### Register an Agent

```typescript
import { SigilRegister } from 'sigil';

const registrar = new SigilRegister(walletClient, publicClient, contractAddress);
const result = await registrar.register({
  agent: '0xAgentAddress',
  metadataURI: 'ipfs://QmAgentMeta',
  chain: baseTestnet,
});
// result.txHash, result.agent
```

### Submit an Attestation

```typescript
import { SigilAttest } from 'sigil';

const attester = new SigilAttest(walletClient, publicClient, contractAddress);
const result = await attester.attest({
  subject: '0xOtherAgent',
  outcome: 'delivered data on time',
  onTime: true,
});
```

### Resolve an Agent's Reputation

```typescript
import { SigilResolve } from 'sigil';

const resolver = new SigilResolve(publicClient, contractAddress);
const profile = await resolver.resolve('0xAgentAddress');
// { address, metadataURI, registeredAt, active, reputation, attestations }
```

## Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐
│ SigilRegister│───▶│ IdentityRegistry │◀───│   SigilResolve    │
│  (register)  │    │   (Solidity)     │    │   (look up agent) │
└─────────────┘    └──────────────────┘    └───────────────────┘
┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐
│ SigilAttest  │───▶│ReputationRegistry│───▶│ ReputationAggregator│
│  (sign+submit)│   │   (Solidity)     │    │  (score + weight)  │
└─────────────┘    └──────────────────┘    └───────────────────┘
```

## Reputation Model

Reputation is derived from attestations — signed statements from counterparties about outcomes of interactions.

**Scoring:**
- Each attestation carries an outcome string and an `onTime` boolean
- Attestations from high-reputation attestors are weighted more heavily
- Base weight = 1.0; attestors with score > 50 get weight 1.5, > 80 get 2.0
- Final score = weighted average of on-time rates, normalized to 0–100

**Caveats — Honest Sybil and Collusion:**
- A single agent can create many identities (Sybil). Without staking or identity verification, reputation can be farmed. Sigil provides the infrastructure; applications should layer anti-Sybil measures (proof of personhood, staking, allowlists).
- Colluding agents can attest positively to each other. The weighted scoring mitigates this — a new agent with no reputation can't boost others much. Applications should also consider attestation diversity (number of unique attestors) as a signal.
- Reputation is not transferable. It accrues to the on-chain identity, not the metadata URI.

## Deployment

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deploy to Base testnet
npx hardhat run scripts/deploy.ts --network baseTestnet
```

## ERC-8004 Alignment

Sigil's `IdentityRegistry` aligns with ERC-8004's vision of agent identity on Ethereum. The contract stores a minimal on-chain identity (owner address, metadata URI, registration timestamp) and exposes resolution functions compatible with the ERC-8004 resolver pattern. Reputation attestations extend this with a complementary `ReputationRegistry`.

## Roadmap

- [ ] ERC-8004 full compliance + ENS integration
- [ ] Staking-based reputation (skin in the game)
- [ ] Attestation revocation and dispute resolution
- [ ] Cross-chain identity resolution (L2 ↔ L2)
- [ ] ZK-attestations for privacy-preserving reputation
- [ ] Agent-to-agent discovery protocol

## License

MIT
