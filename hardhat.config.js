require("@nomiclabs/hardhat-waffle");
require('hardhat-gas-reporter');
require("dotenv").config();

module.exports = {
  solidity: "0.8.10",
  
  networks: {
    Goerli: {
      url: process.env.GOERLI_API_URL,
      accounts: [process.env.GOERLI_PRIVATE_KEY]
      }
   },
  
  gasReporter: {
    enabled: false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};
