const { ethers, run, network } = require("hardhat");
const { shortenFullJsonFilePath } = require("typechain");
require("@nomiclabs/hardhat-etherscan");

// const fs = require("fs-extra");
// require("dotenv").config();

async function main() {
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  console.log("deploying contract...");
  const simpleStorage = await SimpleStorageFactory.deploy();
  await simpleStorage.deployed();
  console.log(`deployed contract to: ${simpleStorage.address}`);

  //   console.log(network.config);
  if (network.config.chainID === 4 && process.env.API_KEY) {
    console / log("waiting for 6 blocks to finish");
    await simpleStorage.deployTransaction.wait(6);
    await verify(simpleStorage.address, []);
  }

  let currentValue = await simpleStorage.retrieve();
  console.log(currentValue.toString());

  // update the current value

  let transactionResponse = await simpleStorage.store("7");
  await transactionResponse.wait(1);
  let updatedValue = await simpleStorage.retrieve();
  console.log(updatedValue.toString());

  let person = await simpleStorage.addPerson("ronee", "69");
  await person.wait(1);
  let favnum = await simpleStorage.nameToFavoriteNumber("ronee");
  console.log(favnum.toString());
}

async function verify(contractAddress, args) {
  console.log("certifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("already verified");
    } else {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
