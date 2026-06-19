import { expect } from "chai";
import { ReputationAggregator } from "../src/reputation";
import type { Attestation } from "../src/types";

function makeAttestation(overrides: Partial<Attestation> = {}): Attestation {
  return {
    attestor: "0x" + "1".repeat(40),
    subject: "0x" + "2".repeat(40),
    outcome: "delivered",
    onTime: true,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    signature: "0x",
    ...overrides,
  };
}

describe("ReputationAggregator", function () {
  let agg: ReputationAggregator;

  beforeEach(function () {
    agg = new ReputationAggregator();
  });

  describe("calculateProfile", function () {
    it("should return zero score for no attestations", function () {
      const result = agg.calculateProfile([]);
      expect(result.score).to.equal(0);
      expect(result.totalAttestations).to.equal(0);
      expect(result.onTimeRate).to.equal(0);
    });

    it("should return 100 for all on-time", function () {
      const atts = [
        makeAttestation({ onTime: true }),
        makeAttestation({ onTime: true, attestor: "0x" + "3".repeat(40) }),
      ];
      const result = agg.calculateProfile(atts);
      expect(result.score).to.equal(100);
      expect(result.onTimeRate).to.equal(1);
    });

    it("should return 0 for all late", function () {
      const atts = [
        makeAttestation({ onTime: false }),
        makeAttestation({ onTime: false, attestor: "0x" + "3".repeat(40) }),
      ];
      const result = agg.calculateProfile(atts);
      expect(result.score).to.equal(0);
      expect(result.onTimeRate).to.equal(0);
    });

    it("should return 50 for half on-time", function () {
      const atts = [
        makeAttestation({ onTime: true }),
        makeAttestation({ onTime: false, attestor: "0x" + "3".repeat(40) }),
      ];
      const result = agg.calculateProfile(atts);
      expect(result.score).to.equal(50);
      expect(result.onTimeRate).to.equal(0.5);
    });

    it("should count outcomes", function () {
      const atts = [
        makeAttestation({ outcome: "delivered" }),
        makeAttestation({ outcome: "delivered", attestor: "0x" + "3".repeat(40) }),
        makeAttestation({ outcome: "late", attestor: "0x" + "4".repeat(40), onTime: false }),
      ];
      const result = agg.calculateProfile(atts);
      expect(result.outcomes["delivered"]).to.equal(2);
      expect(result.outcomes["late"]).to.equal(1);
    });
  });

  describe("calculateDiversity", function () {
    it("should count unique attestors", function () {
      const atts = [
        makeAttestation(),
        makeAttestation({ attestor: "0x" + "3".repeat(40) }),
        makeAttestation(), // duplicate attestor
      ];
      expect(agg.calculateDiversity(atts)).to.equal(2);
    });

    it("should return 0 for empty", function () {
      expect(agg.calculateDiversity([])).to.equal(0);
    });
  });

  describe("collusionRisk", function () {
    it("should return 0 for no attestations", function () {
      expect(agg.collusionRisk([])).to.equal(0);
    });

    it("should detect high collusion risk", function () {
      // 4 from same attestor, 1 from another
      const atts = [
        makeAttestation(),
        makeAttestation(),
        makeAttestation(),
        makeAttestation(),
        makeAttestation({ attestor: "0x" + "3".repeat(40) }),
      ];
      expect(agg.collusionRisk(atts)).to.equal(0.8);
    });

    it("should return low risk for diverse attestors", function () {
      const atts = [
        makeAttestation(),
        makeAttestation({ attestor: "0x" + "3".repeat(40) }),
        makeAttestation({ attestor: "0x" + "4".repeat(40) }),
      ];
      expect(agg.collusionRisk(atts)).to.be.closeTo(1 / 3, 0.01);
    });
  });
});
