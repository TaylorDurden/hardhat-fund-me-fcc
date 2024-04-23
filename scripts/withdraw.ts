import hre, { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { networkConfig, developmentChains } from "../helper-hardhat-config";

async function main() {
  const { deployer } = await getNamedAccounts();
  let ethUsdPriceFeedAddress;
  const chainId = network.config.chainId!;
  if (chainId == 31337 || !chainId) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  const FundMe = await hre.ethers.getContractFactory("FundMe");
  const fundMe = await FundMe.deploy(ethUsdPriceFeedAddress!, {
    from: deployer,
  });
  const transactionRes = await fundMe.withdraw();
  await transactionRes.wait(1);
  console.log("Got it back!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
