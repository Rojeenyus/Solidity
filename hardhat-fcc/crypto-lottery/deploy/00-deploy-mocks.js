const { network } = require("hardhat");
const {
  BASE_FEE,
  GAS_PRICE_LINK,
  developmentChains,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == "31337") {
    log("Local network detected! deploying mocks...");
    await deploy("VRFCoordinatorV2Mock", {
      //   contract: "VRFCoordinatorV2Mock",
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    log("Mocks deployed");
    log("---------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
