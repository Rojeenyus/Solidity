const { assert, expect } = require("chai");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { networkConfig } = require("../../helper-hardhat-config");

const chainId = network.config.chainId;

chainId == 31337
  ? describe.skip
  : describe("Lottery", function () {
      let lottery, raffleEntraceFee, deployer;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        lottery = await ethers.getContract("Lottery", deployer);
        raffleEntraceFee = await lottery.getEntranceFee();
      });

      describe("fulfillRandomWords", async function () {
        it("works with live chainlink keepers, we get a random winner", async function () {
          console.log("Setting up test...");
          const startingTimeStamp = await lottery.getTimeStamp();
          const accounts = await ethers.getSigners();

          console.log("Setting up Listener...");
          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("winner picked, event fired!");
              try {
                const recentWinner = await lottery.getWinner();
                const raffleState = await lottery.getRaffleState();
                const endingBalance = await accounts[0].getBalance();
                const players = await lottery.getNumberOfPlayers();
                const endingTimeStamp = await lottery.getTimeStamp();

                assert(players == 0);
                assert(raffleState == 0);
                assert(recentWinner == accounts[0].address);
                assert.equal(
                  endingBalance.toString(),
                  startingBalance.add(raffleEntraceFee).toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
                resolve();
              } catch (e) {
                reject(e);
              }
            });
            console.log("Entering Raffle...");
            const tx = await lottery.enterRaffle({ value: raffleEntraceFee });
            await tx.wait(1);
            console.log("Ok, time to wait...");
            const startingBalance = await accounts[0].getBalance();
          });
        });
      });
    });
