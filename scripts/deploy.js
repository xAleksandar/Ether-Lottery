async function main() {
  
  const LotteryStorage = await ethers.getContractFactory("LotteryStorage");
  const lotterystorage = await LotteryStorage.deploy();
  const lotterystorageAddress = lotterystorage.address;
  saveFrontendFiles(lotterystorage , "LotteryStorage");
  console.log('LotteryStorage deployed at: ', lotterystorageAddress);

  const LotteryLogic = await ethers.getContractFactory("LotteryLogic");
  const lotterylogic = await LotteryLogic.deploy(lotterystorageAddress);
  const lotterylogicAddress = lotterylogic.address;
  saveFrontendFiles(lotterylogic , "LotteryLogic");
  console.log('LotteryLogic deployed at: ', lotterylogicAddress);

}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../src/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });