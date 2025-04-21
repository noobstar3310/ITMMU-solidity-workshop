// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./OracleReader.sol";

contract FundingContract {
    OracleReader public oracleReader;
    address private immutable owner;
    
    // Mapping to track user deposits
    mapping(address => uint256) public userDeposits;
    
    // Array to keep track of funders
    address[] private funders;
    
    // Total funds in the contract
    uint256 public totalFunds;
    
    // Minimum funding amount in USD (1 USD with 18 decimals)
    uint256 public constant MIN_USD_AMOUNT = 1e18;

    // Custom error for unauthorized access
    error UnauthorizedAccess();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert UnauthorizedAccess();
        }
        _;
    }

    constructor(address _oracleReader) {
        oracleReader = OracleReader(_oracleReader);
        owner = msg.sender;
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
        
        // If this is the first time the user is funding, add them to funders array
        if (userDeposits[msg.sender] == 0) {
            funders.push(msg.sender);
        }
        
        // Update user's deposit
        userDeposits[msg.sender] += msg.value;
        totalFunds += msg.value;
    }

    /**
     * @notice Allows owner to withdraw all funds from the contract
     * @dev Only callable by contract owner
     */
    function withdraw() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds to withdraw");
        
        // Reset all user deposits and total funds
        for (uint256 i = 0; i < funders.length; i++) {
            userDeposits[funders[i]] = 0;
        }
        
        // Clear the funders array
        delete funders;
        totalFunds = 0;
        
        (bool success, ) = payable(owner).call{value: contractBalance}("");
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

    /**
     * @notice Returns the contract owner's address
     */
    function getOwner() external view returns (address) {
        return owner;
    }

    /**
     * @notice Returns the list of funders
     */
    function getFunders() external view returns (address[] memory) {
        return funders;
    }
}