const { ethers, network } = require("hardhat");

async function main() {
  console.log("🚀 Deploying CertChainSBT...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // ethers v6 syntax for getting balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  // Deploy the contract (ethers v6 syntax)
  const CertChainSBT = await ethers.getContractFactory("CertChainSBT");
  const contract = await CertChainSBT.deploy();

  // ethers v6: use waitForDeployment() instead of deployed()
  await contract.waitForDeployment();
  
  // ethers v6: use contract.target instead of contract.address
  const contractAddress = await contract.getAddress();

  console.log("\n✅ CertChainSBT deployed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", contractAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📋 Next Steps:");
  console.log("1. Verify the contract on PolygonScan:");
  console.log(`   npx hardhat verify --network polygonAmoy ${contractAddress}`);
  console.log("\n2. Approve institutions to mint certificates:");
  console.log("   contract.approveInstitution(address, name, country)");
  console.log("\n3. Update frontend with contract address");

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: network.name,
    chainId: network.config.chainId,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
