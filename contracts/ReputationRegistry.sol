// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/ISigil.sol";

/// @title ReputationRegistry
/// @notice Stores reputation attestations for AI agents
/// @dev Attestations are signed off-chain and submitted on-chain
contract ReputationRegistry {
    mapping(address => ISigil.Attestation[]) private _attestations;
    mapping(address => bool) private _registeredAgents;

    event AttestationRecorded(address indexed attestor, address indexed subject, string outcome);

    /// @notice Register an agent address as a known participant
    /// @param agent Address to register
    function registerAgent(address agent) external {
        _registeredAgents[agent] = true;
    }

    /// @notice Submit a reputation attestation for a subject agent
    /// @param subject The agent being attested about
    /// @param outcome Description of the interaction outcome
    /// @param onTime Whether the subject delivered on time
    function attest(address subject, string calldata outcome, bool onTime) external {
        require(subject != address(0), "ReputationRegistry: zero address");
        require(subject != msg.sender, "ReputationRegistry: self-attestation");
        require(bytes(outcome).length > 0, "ReputationRegistry: empty outcome");

        ISigil.Attestation memory attestation = ISigil.Attestation({
            attestor: msg.sender,
            subject: subject,
            outcome: outcome,
            onTime: onTime,
            timestamp: block.timestamp,
            signature: "" // signature verified off-chain by SDK
        });

        _attestations[subject].push(attestation);
        _registeredAgents[msg.sender] = true;

        emit AttestationRecorded(msg.sender, subject, outcome);
    }

    /// @notice Get all attestations for a subject agent
    /// @param subject The agent address
    /// @return Array of attestations
    function getAttestations(address subject) external view returns (ISigil.Attestation[] memory) {
        return _attestations[subject];
    }

    /// @notice Get the number of attestations for a subject
    /// @param subject The agent address
    /// @return count Number of attestations
    function getAttestationCount(address subject) external view returns (uint256 count) {
        return _attestations[subject].length;
    }

    /// @notice Calculate a weighted reputation score for a subject
    /// @dev Score = weighted average of on-time rates, normalized to 0-100
    ///      Weight by attestor's own attestation count (proxy for reputation)
    /// @param subject The agent address
    /// @return score Reputation score (0-100)
    function getScore(address subject) external view returns (uint256 score) {
        ISigil.Attestation[] storage atts = _attestations[subject];
        if (atts.length == 0) return 0;

        uint256 weightedOnTime = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < atts.length; i++) {
            // Weight: attestors with more attestations of their own get higher weight
            uint256 attestorWeight = _getAttestorWeight(atts[i].attestor);
            totalWeight += attestorWeight;
            if (atts[i].onTime) {
                weightedOnTime += attestorWeight;
            }
        }

        if (totalWeight == 0) return 0;
        score = (weightedOnTime * 100) / totalWeight;
    }

    /// @dev Get weight for an attestor based on their own activity
    function _getAttestorWeight(address attestor) internal view returns (uint256) {
        uint256 attestationCount = _attestations[attestor].length;
        if (attestationCount >= 20) return 200; // 2.0x weight
        if (attestationCount >= 10) return 150; // 1.5x weight
        return 100; // 1.0x base weight
    }
}
