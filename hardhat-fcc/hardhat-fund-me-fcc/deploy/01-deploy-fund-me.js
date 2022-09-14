// import
// main function
// calling of main function

// function deployFunc() {
//   console.log("ho");
// }

// module.exports.default = deployFunc;

const { networkConfig, developmentChain } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // if chainId is X, use address Y
  // if chainId us Z, use address A
  let ethUsdPriceFeedAddress;
  if (chainId == "31337") {
    const EthUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = EthUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  // if the contract doesnt exist, we deploy a minimal version
  // of for our local testing

  // what to do when we want to change chain??
  // when going for localhost or hardhat network, we want to use mocks
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // put price feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (chainId != "31337" && process.env.API_KEY) {
    await verify(fundMe.address, args);
  }
  log("---------------------------------");
};

module.exports.tags = ["all", "fundMe"];
