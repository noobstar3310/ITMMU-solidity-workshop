# FundMe DApp

A decentralized funding application built with Solidity and Web3.js. This DApp allows users to:

- Fund the contract with ETH (minimum 1 USD equivalent)
- View their funded amount in both ETH and USD
- Contract owner can withdraw all funds

## Features

- Real-time ETH/USD price conversion
- Minimum funding amount of 1 USD
- User-friendly interface with pixel art design
- Metamask integration
- Owner-only withdrawal function
- Responsive design

## Project Structure

```
fundme/
├── FundMe.sol         # Smart contract
├── OracleReader.sol   # Price feed contract
├── index.html         # Frontend UI
├── script.js          # Web3 integration
└── styles.css         # Styling
```

## Setup

1. Install MetaMask browser extension
2. Connect to your preferred Ethereum network
3. Deploy the OracleReader.sol contract first
4. Deploy FundMe.sol contract with the OracleReader contract address
5. Update the contract address in script.js
6. Open index.html in a web browser

## Contract Address

The contract is deployed at: `0xD52A901790C5eE56D0cE5BAb1002430c891b7Fcd`

## License

MIT
