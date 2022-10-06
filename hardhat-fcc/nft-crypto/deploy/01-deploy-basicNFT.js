const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  log("---------------------------------");

  const basicNft = await deploy("BasicNFT", {
    from: deployer,
    log: true,
    args: [],
    wait: network.config.blockConfirmations,
  });

  if (chainId != "31337" && process.env.API_KEY) {
    await verify(basicNft.address, args);
  }

  log("---------------------------------");
};

module.exports.tags = ["all", "basic"];
