// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./OracleReader.sol";

contract FundingContract {
    OracleReader public oracleReader;
    
    // Mapping to track user deposits
    mapping(address => uint256) public userDeposits;
    
    // Total funds in the contract
    uint256 public totalFunds;
    
    // Minimum funding amount in USD (1 USD with 18 decimals)
    uint256 public constant MIN_USD_AMOUNT = 1e18;

    constructor(address _oracleReader) {
        oracleReader = OracleReader(_oracleReader);
    }

    /**
     * @notice Allows users to fund the contract
     * @dev Requires minimum value of 1 USD based on current ETH price
     */
    function fund() external payable {
        // Get current ETH/USD price from oracle
        (uint256 ethPrice, ) = oracleReader.read();
        
        // Calculate USD value of sent ETH (ethPrice has 18 decimals)
        uint256 ethInUsd = (msg.value * ethPrice) / 1e18;
        
        // Require minimum USD value
        require(ethInUsd >= MIN_USD_AMOUNT, "Must fund at least 1 USD worth of ETH");
        
        // Update user's deposit
        userDeposits[msg.sender] += msg.value;
        totalFunds += msg.value;
    }

    /**
     * @notice Allows users to withdraw their funds
     * @param amount Amount of ETH to withdraw
     */
    function withdraw(uint256 amount) external {
        require(userDeposits[msg.sender] >= amount, "Insufficient balance");
        require(amount <= address(this).balance, "Contract has insufficient funds");
        
        userDeposits[msg.sender] -= amount;
        totalFunds -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Returns the user's deposited balance
     * @param user Address of the user
     * @return balance User's deposited balance
     */
    function getBalance(address user) external view returns (uint256 balance) {
        return userDeposits[user];
    }

    /**
     * @notice Returns the user's deposited balance in USD
     * @param user Address of the user
     * @return usdBalance User's deposited balance in USD
     */
    function getBalanceInUSD(address user) external view returns (uint256 usdBalance) {
        uint256 ethBalance = userDeposits[user];
        (uint256 ethPrice, ) = oracleReader.read();
        return (ethBalance * ethPrice) / 1e18;
    }
}