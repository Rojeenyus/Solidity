const { assert } = require("chai");
const { ethers, deployments, network } = require("hardhat");

const chainId = network.config.chainId;

chainId != 31337
  ? describe.skip
  : describe("BasicNFT", function () {
      let deployer, basicNFT;
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        // await deploy("BasicNFT", {
        //   from: deployer,
        //   log: true,
        //   args: [],
        //   wait: network.config.blockConfirmations,
        // });
        await deployments.fixture();
        basicNFT = await ethers.getContract("BasicNFT", deployer);
      });

      describe("constructor", function () {
        it("initializes correctly", async function () {
          const tokenCounter = await basicNFT.getTokenCounter();
          assert(tokenCounter.toString() == "0");
        });
      });

      describe("mintNFT", function () {
        it("mints an nft", async function () {
          await basicNFT.mintNft();
          const tokenCounter = await basicNFT.getTokenCounter();
          const tokenURI = await basicNFT.tokenURI(0);
          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, await basicNFT.TOKEN_URI());
        });
      });
    });
