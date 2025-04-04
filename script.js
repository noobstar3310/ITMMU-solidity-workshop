
let web3
let accounts = []
let fundingContract
let userFundedAmount = 0

const contractABI = [{"inputs":[{"internalType":"address","name":"priceFeed","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"FundMe__NotOwner","type":"error"},{"stateMutability":"payable","type":"fallback"},{"inputs":[],"name":"MINIMUM_USD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cheaperWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"fund","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"fundingAddress","type":"address"}],"name":"getAddressToAmountFunded","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getContractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"funderAddress","type":"address"}],"name":"getFundedAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getFunder","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVersion","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"s_funders","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

// Contract address - this would be the address of your deployed contract
const contractAddress = "0x8333852b6ED4C7f28834a8D59555C295ea6C0783" // Replace with actual contract address

// DOM Elements
const connectWalletBtn = document.getElementById("connectWallet")
const walletInfoDiv = document.getElementById("walletInfo")
const walletAddressSpan = document.getElementById("walletAddress")
const walletBalanceSpan = document.getElementById("walletBalance")
const contractBalanceSpan = document.getElementById("contractBalance")
const userFundedSpan = document.getElementById("userFunded")
const fundAmountInput = document.getElementById("fundAmount")
const fundButton = document.getElementById("fundButton")
const withdrawAmountInput = document.getElementById("withdrawAmount")
const withdrawButton = document.getElementById("withdrawButton")
const notificationDiv = document.getElementById("notification")

// Initialize the app
async function init() {
  // Add event listeners
  connectWalletBtn.addEventListener("click", connectWallet)
  fundButton.addEventListener("click", fundContract)
  withdrawButton.addEventListener("click", withdrawFunds)

  // Check if Web3 is injected
  if (window.ethereum) {
    web3 = new Web3(window.ethereum)

    // Check if already connected
    try {
      accounts = await web3.eth.getAccounts()
      if (accounts.length > 0) {
        onWalletConnected()
      }
    } catch (error) {
      console.error("Error checking connection:", error)
    }

    // Listen for account changes
    window.ethereum.on("accountsChanged", (newAccounts) => {
      accounts = newAccounts
      if (accounts.length > 0) {
        onWalletConnected()
      } else {
        onWalletDisconnected()
      }
    })
  } else {
    showNotification("No Ethereum wallet detected. Please install MetaMask.", "error")
  }

  // Add some visual effects
  addVisualEffects()
}

// Connect wallet function
async function connectWallet() {
  try {
    if (!window.ethereum) {
      showNotification("No Ethereum wallet detected. Please install MetaMask.", "error")
      return
    }

    accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
    onWalletConnected()
  } catch (error) {
    console.error("Error connecting wallet:", error)
    showNotification("Failed to connect wallet. " + error.message, "error")
  }
}

// Function called after wallet is connected
async function onWalletConnected() {
  if (accounts.length === 0) return

  // Update UI
  connectWalletBtn.classList.add("hidden")
  walletInfoDiv.classList.remove("hidden")

  // Display shortened address
  const shortAddress = `${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`
  walletAddressSpan.textContent = shortAddress

  // Initialize contract
  fundingContract = new web3.eth.Contract(contractABI, contractAddress)

  // Update balances
  updateBalances()
}

// Function called when wallet is disconnected
function onWalletDisconnected() {
  // Update UI
  connectWalletBtn.classList.remove("hidden")
  walletInfoDiv.classList.add("hidden")
  walletAddressSpan.textContent = "Not connected"
  walletBalanceSpan.textContent = "0"
  contractBalanceSpan.textContent = "0"
  userFundedSpan.textContent = "0"
}

// Update all balances
async function updateBalances() {
  try {
    // Get wallet balance
    const balance = await web3.eth.getBalance(accounts[0])
    const ethBalance = web3.utils.fromWei(balance, "ether")
    walletBalanceSpan.textContent = Number.parseFloat(ethBalance).toFixed(4)

    // Get contract balance
    const contractBalance = await web3.eth.getBalance(contractAddress)
    const contractEthBalance = web3.utils.fromWei(contractBalance, "ether")
    contractBalanceSpan.textContent = Number.parseFloat(contractEthBalance).toFixed(4)

    // Get user's funded amount
    try {
      const fundedAmount = await fundingContract.methods.getFundedAmount(accounts[0]).call()
      userFundedAmount = web3.utils.fromWei(fundedAmount, "ether")
      userFundedSpan.textContent = Number.parseFloat(userFundedAmount).toFixed(4)
    } catch (error) {
      console.error("Error getting funded amount:", error)
      // This might happen if the contract doesn't have this function
      userFundedSpan.textContent = "?"
    }
  } catch (error) {
    console.error("Error updating balances:", error)
    showNotification("Failed to update balances.", "error")
  }
}

// Fund the contract
async function fundContract() {
  try {
    if (!fundingContract) {
      showNotification("Please connect your wallet first.", "error")
      return
    }

    const amount = fundAmountInput.value
    if (!amount || Number.parseFloat(amount) <= 0) {
      showNotification("Please enter a valid amount to fund.", "error")
      return
    }

    const weiAmount = web3.utils.toWei(amount, "ether")

    // Show loading state
    fundButton.disabled = true
    fundButton.textContent = "PROCESSING..."

    // Call the fund function
    await fundingContract.methods.fund().send({
      from: accounts[0],
      value: weiAmount,
    })

    // Reset input and update balances
    fundAmountInput.value = ""
    updateBalances()

    showNotification(`Successfully funded ${amount} ETH!`, "success")
  } catch (error) {
    console.error("Error funding contract:", error)
    showNotification("Failed to fund contract. " + error.message, "error")
  } finally {
    // Reset button
    fundButton.disabled = false
    fundButton.textContent = "FUND"
  }
}

// Withdraw funds
async function withdrawFunds() {
  try {
    if (!fundingContract) {
      showNotification("Please connect your wallet first.", "error")
      return
    }

    const amount = withdrawAmountInput.value
    if (!amount || Number.parseFloat(amount) <= 0) {
      showNotification("Please enter a valid amount to withdraw.", "error")
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(userFundedAmount)) {
      showNotification("You cannot withdraw more than you've funded.", "error")
      return
    }

    const weiAmount = web3.utils.toWei(amount, "ether")

    // Show loading state
    withdrawButton.disabled = true
    withdrawButton.textContent = "PROCESSING..."

    // Call the withdraw function
    await fundingContract.methods.withdraw(weiAmount).send({
      from: accounts[0],
    })

    // Reset input and update balances
    withdrawAmountInput.value = ""
    updateBalances()

    showNotification(`Successfully withdrew ${amount} ETH!`, "success")
  } catch (error) {
    console.error("Error withdrawing funds:", error)
    showNotification("Failed to withdraw funds. " + error.message, "error")
  } finally {
    // Reset button
    withdrawButton.disabled = false
    withdrawButton.textContent = "WITHDRAW"
  }
}

// Show notification
function showNotification(message, type = "") {
  notificationDiv.textContent = message
  notificationDiv.className = "notification " + type

  // Show notification
  notificationDiv.classList.remove("hidden")

  // Hide after 5 seconds
  setTimeout(() => {
    notificationDiv.classList.add("hidden")
  }, 5000)
}

// Add visual effects
function addVisualEffects() {
  // Add glitch effect randomly
  setInterval(() => {
    const h1 = document.querySelector("h1")
    h1.classList.add("glitch")
    setTimeout(() => {
      h1.classList.remove("glitch")
    }, 1000)
  }, 10000)

  // Add pulse effect to connect button
  connectWalletBtn.classList.add("pulse")
}

async function withdrawFunds() {
  try {
      if (!fundingContract) {
          showNotification("Please connect your wallet first.", "error")
          return
      }

      // Show loading state
      withdrawButton.disabled = true
      withdrawButton.textContent = "PROCESSING..."

      // Call the withdraw function
      await fundingContract.methods.withdraw().send({
          from: accounts[0]
      })

      // Update balances
      updateBalances()

      showNotification("Successfully withdrew funds!", "success")
  } catch (error) {
      console.error("Error withdrawing funds:", error)
      showNotification("Failed to withdraw funds. " + error.message, "error")
  } finally {
      // Reset button
      withdrawButton.disabled = false
      withdrawButton.textContent = "WITHDRAW"
  }
}

// Initialize the app when the page loads
window.addEventListener("load", init)

