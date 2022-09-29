const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth");

async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  const lendingPool = await getLendingPool(deployer);
  console.log(lendingPool.address);

  //deposit
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  //approve
  await approveErc20(wethAddress, lendingPool.address, AMOUNT, deployer);
  console.log("depositing...");
  await lendingPool.deposit(wethAddress, AMOUNT, deployer, 0);
  console.log("deposited");
  //borrow
  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );
  // dai/eth amount to borrow 95%
  const daiPrice = await getDaiPrice();
  const amountDaiToBorrow =
    availableBorrowsETH.toString() * (1 / daiPrice.toNumber()) * 0.95;
  console.log(`You can borrow ${amountDaiToBorrow}`);
  const amountDaiToBorrowWei = ethers.utils.parseEther(
    amountDaiToBorrow.toString()
  );

  await borrowDai(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    amountDaiToBorrowWei,
    lendingPool,
    deployer
  );
  await getBorrowUserData(lendingPool, deployer);
  //repay
  await repay(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    amountDaiToBorrowWei,
    lendingPool,
    deployer
  );
  await getBorrowUserData(lendingPool, deployer);
}

async function repay(daiAddress, amount, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
  await repayTx.wait(1);
  console.log(`Youve repaid ${amount} DAI!`);
}

async function borrowDai(daiAddress, amount, lendingPool, account) {
  const borrowTx = await lendingPool.borrow(daiAddress, amount, 1, 0, account);
  await borrowTx.wait(1);
  console.log(`Youve borrowed ${amount} DAI!`);
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  );
  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`the DAI/ETH price is ${price.toString()}`);
  return price;
}

async function getBorrowUserData(lendingpool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingpool.getUserAccountData(account);
  console.log(`you have ${totalCollateralETH} deposited`);
  console.log(`you have ${totalDebtETH} total debt`);
  console.log(`you have ${availableBorrowsETH} available ETH to be borrowed`);
  return { totalDebtETH, availableBorrowsETH };
}

async function getLendingPool(account) {
  const lendingPoolAddressProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account
  );
  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    account
  );
  return lendingPool;
}

async function approveErc20(
  tokenAddress,
  spenderAddress,
  amountToSpend,
  account
) {
  const appTokenAddress = await ethers.getContractAt(
    "IERC20",
    tokenAddress,
    account
  );
  const tx = await appTokenAddress.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("APPROVED!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
