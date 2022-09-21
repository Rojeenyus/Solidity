const { assert, expect } = require("chai");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { networkConfig } = require("../../helper-hardhat-config");

const chainId = network.config.chainId;

chainId != 31337
  ? describe.skip
  : describe("Lottery", function () {
      let lottery, vrfCoordinator, raffleEntraceFee, deployer, interval;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all");
        lottery = await ethers.getContract("Lottery", deployer);
        vrfCoordinator = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffleEntraceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });

      describe("constructor", function () {
        it("initializes correctly", async function () {
          const raffleState = await lottery.getRaffleState();
          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
        });
      });

      describe("enterRaffle", function () {
        it("reverts when you dont pay enough", async function () {
          await expect(lottery.enterRaffle()).to.be.revertedWith(
            "Raffle__NotENoughEthEntered"
          );
        });
        it("record players when they put money", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          const response = await lottery.getPlayer(0);
          assert.equal(response.toString(), deployer);
        });
        it("emits an event", async function () {
          await expect(
            lottery.enterRaffle({ value: raffleEntraceFee })
          ).to.emit(lottery, "RaffleEnter");
        });
        it("does not allow entrance if not open", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep("0x");
          // await lottery.performUpkeep([]);
          await expect(
            lottery.enterRaffle({ value: raffleEntraceFee })
          ).to.be.revertedWith("Raffle__RaffleIsClosed");
        });
      });

      describe("checkUpkeep", function () {
        it("returns false if no eth in contract", async function () {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          // assert.equal((await lottery.checkUpkeep([]))[0], false);
          assert(!upkeepNeeded);
        });

        it("returns false if raffle is not open", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await lottery.performUpkeep("0x");
          const raffleState = await lottery.getRaffleState();
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert.equal(raffleState.toString(), "1");
          assert(!upkeepNeeded);
        });

        it("returns false if not enough time has passed by", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        it("returns true if all are achieved", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", function () {
        it("can only run if checkupkeep is true", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          assert(await lottery.performUpkeep("0x"));
        });
        it("reverts when UpkeepNeeded is false", async function () {
          await expect(lottery.performUpkeep("0x")).to.be.revertedWith(
            `Raffle__UpkeepNotNeeded`
          );
        });
        it("updates rafflestate and emit requestId", async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await lottery.performUpkeep("0x");
          const receipt = await tx.wait(1);
          assert(receipt.events[1].args.requestId > 0);
          assert.equal(await lottery.getRaffleState(), "1");
        });
      });

      describe("fulfillRandomWords", function () {
        beforeEach(async function () {
          await lottery.enterRaffle({ value: raffleEntraceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
        });
        it("can only be called after perform upkeep", async function () {
          await expect(
            vrfCoordinator.fulfillRandomWords(202, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });
        it("picks a winner, resets, and sends the money", async function () {
          const additionalAccts = 3;
          const startingIndex = 1; // 0 kasi deployer
          const account = await ethers.getSigners();
          for (i = startingIndex; i < startingIndex + additionalAccts; i++) {
            const lotteryConnectedContract = await lottery.connect(account[i]);
            await lotteryConnectedContract.enterRaffle({
              value: raffleEntraceFee,
            });
          }
          const startingTimeStamp = await lottery.getTimeStamp();
          const startingBalance = await account[1].getBalance();

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async (trans) => {
              console.log("found the event!");
              try {
                const recentWinner = await lottery.getWinner();
                const raffleState = await lottery.getRaffleState();
                const players = await lottery.getNumberOfPlayers();
                const endingTimeStamp = await lottery.getTimeStamp();
                const endingBalance = await account[1].getBalance();
                assert(players == 0);
                assert(raffleState == 0);
                assert(endingTimeStamp > startingTimeStamp);
                assert.equal(
                  endingBalance.toString(),
                  startingBalance
                    .add(raffleEntraceFee.mul(additionalAccts + 1))
                    .toString()
                );

                console.log(recentWinner);
                // console.log((await account[0].getBalance()).toString());
                // console.log((await account[1].getBalance()).toString());
                // console.log((await account[2].getBalance()).toString());
                // console.log((await account[3].getBalance()).toString());
              } catch (e) {
                reject(e);
              }
              resolve();
            });
            const tx = await lottery.performUpkeep([]);
            const txReceipt = await tx.wait(1);
            await vrfCoordinator.fulfillRandomWords(
              txReceipt.events[1].args.requestId,
              lottery.address
            );
          });
        });
      });
    });
