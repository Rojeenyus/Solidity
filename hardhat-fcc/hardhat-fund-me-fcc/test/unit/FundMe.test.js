const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const { developmentChain } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1"); //1 eth
      beforeEach(async function () {
        // const accounts = await ethers.getSigners();
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.s_priceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async function () {
        it("will fail when not enought eth is sent", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updates the amount of deposited eth", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.s_addressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("updates s_funders array", async function () {
          await fundMe.fund({ value: sendValue });
          const response = fundMe.s_funders[0];
          assert.equal(response, deployer.address);
        });
      });

      describe("widthraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw eth from a single founder", async function () {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const gasCost =
            transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice;

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingFunderBalance).toString(),
            endingFunderBalance.add(gasCost).toString()
          );
        });

        it("allows us to withdraw with multiple s_funders", async function () {
          const account = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(account[0]);
          await fundMeConnectedContract.fund({ value: sendValue });
          //   for (i = 1; i < 6; i++) {
          //     const fundMeConnectedContract = await fundMe.connect(account[i]);
          //     await fundMeConnectedContract.fund({ value: sendValue });
          //   }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const gasCost =
            transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice;

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingFunderBalance).toString(),
            endingFunderBalance.add(gasCost).toString()
          );

          await expect(fundMe.s_funders(0)).to.be.reverted;

          //   for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.s_addressToAmountFunded(account[0].address),
            0
          );
          //   }
        });

        it("only owner should be able to widthraw", async () => {
          const account = await ethers.getSigners();
          const connectedContract = await fundMe.connect(account[1]);
          await expect(connectedContract.withdraw()).to.be.reverted;
        });

        it("cheaper withdraw...", async function () {
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const gasCost =
            transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice;

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingFunderBalance).toString(),
            endingFunderBalance.add(gasCost).toString()
          );
        });

        it("allows us to withdraw with multiple s_funders", async function () {
          const account = await ethers.getSigners();
          const fundMeConnectedContract = await fundMe.connect(account[0]);
          await fundMeConnectedContract.fund({ value: sendValue });
          //   for (i = 1; i < 6; i++) {
          //     const fundMeConnectedContract = await fundMe.connect(account[i]);
          //     await fundMeConnectedContract.fund({ value: sendValue });
          //   }

          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const gasCost =
            transactionReceipt.gasUsed * transactionReceipt.effectiveGasPrice;

          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance.add(startingFunderBalance).toString(),
            endingFunderBalance.add(gasCost).toString()
          );

          await expect(fundMe.s_funders(0)).to.be.reverted;

          //   for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.s_addressToAmountFunded(account[0].address),
            0
          );
          //   }
        });
      });
    });
