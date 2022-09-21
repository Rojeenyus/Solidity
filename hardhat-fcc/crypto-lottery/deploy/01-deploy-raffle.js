const { network, ethers } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const FUND_AMOUNT = "1000000000000000000000";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let vrfCoordinator, subscriptionId;
  let entranceFee = networkConfig[chainId]["entranceFee"];
  let gasLane = networkConfig[chainId]["gasLane"];
  let callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
  let interval = networkConfig[chainId]["interval"];

  if (chainId == "31337") {
    const VRFCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinator = VRFCoordinatorV2Mock.address;
    const transactionResponse = await VRFCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    await VRFCoordinatorV2Mock.fundSubscription(
      subscriptionId.toString(),
      FUND_AMOUNT
    );
  } else {
    vrfCoordinator = networkConfig[chainId]["vrfCoordinator"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
  }

  const args = [
    vrfCoordinator,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    interval,
  ];
  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (chainId != "31337" && process.env.API_KEY) {
    await verify(lottery.address, args);
  }
  log("---------------------------------");
};

module.exports.tags = ["all", "lottery"];
