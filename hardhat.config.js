require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: "0.8.10",
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/L5ZnupIs2ZzueLSMCAdh2vli1AabxMHh",
      accounts: ['4f1646c9b737e6795f1d69840fce95de5121a1067383e0b1b44521f626613812']
      }
   } 
};
