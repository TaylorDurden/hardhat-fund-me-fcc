// import
import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { verify } from "../utils/verify";
// main function
// calling main function

// function deployFunc(hre) {}

// module.exports.default = deployFunc;

// module.exports = async (hre: HardhatRuntimeEnvironment) => {
//   const { getNamedAccounts} = hre;
// };
module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId!;
  console.log(`chainId: ${chainId}`);

  // if chainId is X use address Y
  // if chainId is Z use address A
  let ethUsdPriceFeedAddress;
  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  // well what happens when we want to change chains?
  // when going for localhost or network we want to use a mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed address
    log: true,
    waitConfirmations: 1,
  });
  log(`FundMe deployed at ${fundMe.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
};

module.exports.tags = ["all", "fundme"];
