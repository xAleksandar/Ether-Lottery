async function main() {

  const LotteryLogic = await ethers.getContractFactory("LotteryLogic");
  const lotterylogic = await LotteryLogic.deploy("0x3414F1638c2d0B3cD8188f9c7e04e9e13c5027a8");
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