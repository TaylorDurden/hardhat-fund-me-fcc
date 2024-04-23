interface NetworkConfig {
  [chainId: number]: {
    name: string;
    ethUsdPriceFeed?: string;
  };
}

const networkConfig: NetworkConfig = {
  31337: {
    name: "hardhat",
  },
  // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // ETH/USD contract address
  },
  //ploygon
  137: {
    name: "Ploygon",
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
  },
};

const developmentChains = ["hardhat", "localhost"];
const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;

export default networkConfig;

export { networkConfig, developmentChains, DECIMALS, INITIAL_ANSWER };
