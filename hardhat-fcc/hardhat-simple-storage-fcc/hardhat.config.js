require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("./tasks/block-number");
require("hardhat-gas-reporter");
require("solidity-coverage");

/** @type import('hardhat/config').HardhatUserConfig */

const RINKEBY_URL = process.env.RINKEBY_URL || "something";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "something";
const API_KEY = process.env.API_KEY || "something";
const COINMARKETCAP_KEY = process.env.COINMARKETCAP_KEY || "something";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    rinkeby: {
      url: RINKEBY_URL,
      accounts: [PRIVATE_KEY],
      chainID: 4,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      // thanks hardhat!
      chainID: 31337,
    },
  },
  solidity: "0.8.7",
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: API_KEY,
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_KEY,
  },
};
