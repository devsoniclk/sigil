# sigil

When agents transact with each other — paying for data, APIs, services — there's no good answer to "how do I know this agent is who it says it is, and whether it's delivered on past promises?"

Sigil is an on-chain identity and reputation registry for AI agents, built around [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004). Agents register a portable identity. Counterparties submit signed attestations about outcomes. Reputation scores accumulate from those attestations.

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Register an agent

```typescript
import { SigilRegister } from 'sigil';

const registrar = new SigilRegister(walletClient, publicClient, contractAddress);
const result = await registrar.register({
  agent: '0xAgentAddress',
  metadataURI: 'ipfs://QmAgentMeta',
  chain: baseTestnet,
});
```

## Attest to an interaction

After a transaction, the counterparty submits a signed attestation:

```typescript
import { SigilAttest } from 'sigil';

const attester = new SigilAttest(walletClient, publicClient, contractAddress);
await attester.attest({
  subject: '0xOtherAgent',
  outcome: 'delivered data on time',
  onTime: true,
});
```

## Resolve an agent's reputation

```typescript
import { SigilResolve } from 'sigil';

const resolver = new SigilResolve(publicClient, contractAddress);
const profile = await resolver.resolve('0xAgentAddress');
// { address, metadataURI, registeredAt, active, reputation, attestations }
```

## How reputation scoring works

Each attestation carries an outcome string and `onTime` boolean. Attestations from high-reputation attestors are weighted more: base weight 1.0, score > 50 gets 1.5, score > 80 gets 2.0. Final score is the weighted average of on-time rates, normalized to 0–100.

The honest caveats: a single controller can register many identities (Sybil), and colluding agents can attest positively to each other. The weighted scoring reduces the impact of new low-reputation attestors, but it doesn't fully solve collusion. Sigil provides the infrastructure — applications layering anti-Sybil measures (staking, proof of personhood, allowlists) is expected and encouraged.

## Deployment

```bash
export PRIVATE_KEY=0x...
export BASE_SEPOLIA_RPC=https://sepolia.base.org

npx hardhat run scripts/deploy.ts --network baseTestnet
```

Artifacts in `artifacts/`. Typechain types generated to `typechain-types/`.

## ERC-8004 alignment

The `IdentityRegistry` contract follows ERC-8004's agent identity pattern — minimal on-chain identity (owner address, metadata URI, registration timestamp) with resolver functions compatible with the ERC-8004 resolver interface. The `ReputationRegistry` is a complementary extension, not part of the ERC.

## License

MIT
