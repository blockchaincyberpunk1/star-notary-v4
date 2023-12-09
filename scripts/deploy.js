// Import the ethers library from Hardhat package
const { ethers } = require("hardhat");

// The main async function for deploying the contract
async function main() {
  // Get the list of accounts and assign the first account as the deployer
  const [deployer] = await ethers.getSigners();

  // Log the deployer's address and current balance
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the contract factory for the StarNotary contract
  const StarNotary = await ethers.getContractFactory("StarNotary");
  // Deploy the StarNotary contract
  const starNotary = await StarNotary.deploy();

  // Log the deployed contract's address
  console.log("StarNotary address:", starNotary.address);
}

// Execute the main function and handle any errors
main()
  .then(() => process.exit(0))
  .catch(error => {
      console.error(error);
      process.exit(1);
  });
