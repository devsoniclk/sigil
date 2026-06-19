// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISigil {
    /// @notice On-chain identity for an AI agent
    struct AgentIdentity {
        address owner;
        string metadataURI;
        uint256 registeredAt;
        bool active;
    }

    /// @notice A signed attestation about an agent's behavior
    struct Attestation {
        address attestor;
        address subject;
        string outcome;
        bool onTime;
        uint256 timestamp;
        bytes signature;
    }

    /// @notice Emitted when a new agent is registered
    event AgentRegistered(address indexed agent, string metadataURI);

    /// @notice Emitted when an agent updates its metadata
    event AgentUpdated(address indexed agent, string newURI);

    /// @notice Emitted when an agent is deactivated
    event AgentDeactivated(address indexed agent);

    /// @notice Emitted when a new attestation is recorded
    event AttestationRecorded(address indexed attestor, address indexed subject, string outcome);

    /// @notice Register a new agent identity
    /// @param metadataURI URI pointing to the agent's metadata
    function register(string calldata metadataURI) external;

    /// @notice Update an agent's metadata URI
    /// @param newURI New metadata URI
    function updateMetadata(string calldata newURI) external;

    /// @notice Deactivate the caller's agent identity
    function deactivate() external;

    /// @notice Resolve an agent's identity
    /// @param agent Address of the agent to resolve
    /// @return identity The agent's identity struct
    function resolve(address agent) external view returns (AgentIdentity memory identity);
}
