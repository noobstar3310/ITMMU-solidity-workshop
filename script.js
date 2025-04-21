let web3
let accounts = []
let fundingContract
let userFundedAmount = 0
let isOwner = false

const contractABI = [{"inputs":[{"internalType":"address","name":"_oracleReader","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"UnauthorizedAccess","type":"error"},{"inputs":[],"name":"MIN_USD_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"fund","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getBalance","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getBalanceInUSD","outputs":[{"internalType":"uint256","name":"usdBalance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFunders","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracleReader","outputs":[{"internalType":"contract OracleReader","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalFunds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"userDeposits","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]

// Contract address
const contractAddress = "0xD52A901790C5eE56D0cE5BAb1002430c891b7Fcd"

// DOM Elements
const connectWalletBtn = document.getElementById("connectWallet")
const walletInfoDiv = document.getElementById("walletInfo")
const walletAddressSpan = document.getElementById("walletAddress")
const walletBalanceSpan = document.getElementById("walletBalance")
const contractBalanceSpan = document.getElementById("contractBalance")
const userFundedSpan = document.getElementById("userFunded")
const userFundedUSDSpan = document.getElementById("userFundedUSD")
const fundAmountInput = document.getElementById("fundAmount")
const fundButton = document.getElementById("fundButton")
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

    // Check if connected account is owner
    const owner = await fundingContract.methods.getOwner().call()
    isOwner = accounts[0].toLowerCase() === owner.toLowerCase()

    // Show/hide withdraw button based on owner status
    withdrawButton.style.display = isOwner ? "block" : "none"

    // Update balances
    updateBalances()
}

// Function called when wallet is disconnected
function onWalletDisconnected() {
    connectWalletBtn.classList.remove("hidden")
    walletInfoDiv.classList.add("hidden")
    walletAddressSpan.textContent = "Not connected"
    walletBalanceSpan.textContent = "0"
    contractBalanceSpan.textContent = "0"
    userFundedSpan.textContent = "0"
    userFundedUSDSpan.textContent = "0"
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

        // Get user's funded amount in ETH
        const fundedAmount = await fundingContract.methods.getBalance(accounts[0]).call()
        userFundedAmount = web3.utils.fromWei(fundedAmount, "ether")
        userFundedSpan.textContent = Number.parseFloat(userFundedAmount).toFixed(4)

        // Get user's funded amount in USD
        const usdBalance = await fundingContract.methods.getBalanceInUSD(accounts[0]).call()
        const usdValue = web3.utils.fromWei(usdBalance, "ether")
        userFundedUSDSpan.textContent = Number.parseFloat(usdValue).toFixed(2)

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

// Withdraw funds (owner only)
async function withdrawFunds() {
    try {
        if (!fundingContract) {
            showNotification("Please connect your wallet first.", "error")
            return
        }

        if (!isOwner) {
            showNotification("Only the contract owner can withdraw funds.", "error")
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

        showNotification("Successfully withdrew all funds!", "success")
    } catch (error) {
        console.error("Error withdrawing funds:", error)
        showNotification("Failed to withdraw funds. " + error.message, "error")
    } finally {
        // Reset button
        withdrawButton.disabled = false
        withdrawButton.textContent = "WITHDRAW ALL"
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

// Initialize the app when the page loads
window.addEventListener("load", init)

