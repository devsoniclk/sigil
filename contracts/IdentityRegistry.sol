// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/ISigil.sol";

/// @title IdentityRegistry
/// @notice ERC-8004 aligned on-chain identity registry for AI agents
/// @dev Agents register with a metadata URI; identities are owned by msg.sender
contract IdentityRegistry {
    mapping(address => ISigil.AgentIdentity) private _identities;

    event AgentRegistered(address indexed agent, string metadataURI);
    event AgentUpdated(address indexed agent, string newURI);
    event AgentDeactivated(address indexed agent);

    /// @notice Register a new agent identity for msg.sender
    /// @param metadataURI URI pointing to the agent's off-chain metadata (e.g. IPFS)
    function register(string calldata metadataURI) external {
        require(bytes(metadataURI).length > 0, "IdentityRegistry: empty URI");
        require(!_identities[msg.sender].active, "IdentityRegistry: already registered");

        _identities[msg.sender] = ISigil.AgentIdentity({
            owner: msg.sender,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            active: true
        });

        emit AgentRegistered(msg.sender, metadataURI);
    }

    /// @notice Update the metadata URI for the caller's identity
    /// @param newURI New metadata URI
    function updateMetadata(string calldata newURI) external {
        require(_identities[msg.sender].active, "IdentityRegistry: not registered");
        require(bytes(newURI).length > 0, "IdentityRegistry: empty URI");

        _identities[msg.sender].metadataURI = newURI;

        emit AgentUpdated(msg.sender, newURI);
    }

    /// @notice Soft-delete: deactivate the caller's identity
    function deactivate() external {
        require(_identities[msg.sender].active, "IdentityRegistry: not active");

        _identities[msg.sender].active = false;

        emit AgentDeactivated(msg.sender);
    }

    /// @notice Resolve an agent's identity
    /// @param agent Address of the agent
    /// @return The agent's identity struct
    function resolve(address agent) external view returns (ISigil.AgentIdentity memory) {
        return _identities[agent];
    }

    /// @notice Check if an address has an active identity
    /// @param agent Address to check
    /// @return True if the agent is registered and active
    function isActive(address agent) external view returns (bool) {
        return _identities[agent].active;
    }
}
