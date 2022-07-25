const { task } = require("hardhat/config");

task("block-number", "prints block-number").setAction(
  async (taskArgs, hre) => {
    const blockNumber = await hre.ethers.provider.getBlockNumber()
    console.log(blockNumber)
  }
);

module.exports = {}