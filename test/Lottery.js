const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");

describe("LotteryStorage", function () {

  let LotteryStorage;
  let LotteryStorageContract;
  let LotteryStorageAddress;

  before(async () => {

    LotteryStorageContract = await ethers.getContractFactory("LotteryStorage");
    LotteryStorage = await LotteryStorageContract.deploy();
    await LotteryStorage.deployed();
    LotteryStorageAddress = LotteryStorage.address;
    
    LotteryLogicContract = await ethers.getContractFactory("LotteryLogic");
    LotteryLogic = await LotteryLogicContract.deploy(LotteryStorageAddress);
    await LotteryLogic.deployed();
    LotteryLogicAddress = LotteryLogic.address;
  });

  it("Storage (=) should be able to manage permitted addresses.", async function () {
    const [_, address2, address3, address4] = await ethers.getSigners();
    await expect(LotteryStorage.connect(address2).resetTicketCount()).to.be.revertedWith('msg.sender not permitted.');
    await LotteryStorage.managePermittedUsers(address2.address, true);
    await LotteryStorage.managePermittedUsers(LotteryLogicAddress, true);
    await LotteryStorage.connect(address2).resetTicketCount();
  })

  it("Logic (=) should be able to create and sell new tickets.", async function () {
    const [_, address2, address3, address4, address5] = await ethers.getSigners();

    const ticket1 = await LotteryLogic.connect(address2).buyTicket([1,2,3,4,5], { value: "1000000000000000000" });
    const ticket2 = await LotteryLogic.connect(address3).buyTicket([11,12,13,14,15], { value: "1000000000000000000" });
    const ticket3 = await LotteryLogic.connect(address4).buyTicket([2,4,6,20,30], { value: "1000000000000000000" });
    const ticket4 = await LotteryLogic.connect(address4).buyTicket([5,10,11,12,13,14,15,16], { value: "1000000000000000000" });
    const ticket5 = await LotteryLogic.connect(address3).buyTicket([2,10,4,8,6], { value: "1000000000000000000" });
    const ticket6 = await LotteryLogic.connect(address2).buyTicket([21,22,23,24,25,26,27], { value: "1000000000000000000" });
    const ticket7 = await LotteryLogic.connect(address5).buyTicket([3,4,1,2,8,12,6], { value: "1000000000000000000" });
    const ticket8 = await LotteryLogic.connect(address3).buyTicket([1,2,3,4,5], { value: "1000000000000000000" });

  })

  it("Storage (=) should be able to track tickets count.", async function () {
    expect(await LotteryStorage.ticketCount()).to.equal(8);
  })

  /*it("Logic (=) should be able to submit and count winning Tickets.", async function () {
    expect(await LotteryStorage.fourNumberWinnersCount()).to.equal(0);
    expect(await LotteryStorage.fiveNumberWinnersCount()).to.equal(0);
    await LotteryLogic.submitWinningTicket(4);
    expect(await LotteryStorage.fourNumberWinnersCount()).to.equal(0);
    expect(await LotteryStorage.fiveNumberWinnersCount()).to.equal(0);
    await LotteryLogic.submitWinningTicket(6);
    expect(await LotteryStorage.fourNumberWinnersCount()).to.equal(0);
    expect(await LotteryStorage.fiveNumberWinnersCount()).to.equal(0);
  }) */

  it("Logic (=) should be able to distribute rewards.", async function () {
    await LotteryLogic.retrieveNewNumbers();
    await LotteryLogic.submitWinningTicket(4);
    //await LotteryLogic.submitWinningTicket(6);

    const [_, address2, address3, address4, address5] = await ethers.getSigners();
    const provider = waffle.provider;
    console.log("     Lottery Balance before distributing rewards: ", parseInt((await provider.getBalance(LotteryLogicAddress)).toString()) / 1000000000000000000, " ETH")
    const oldAddress3Balance = parseInt((await provider.getBalance(address3.address)).toString())
    console.log("     Wallet 3  before distributing rewards:  ", oldAddress3Balance / 1000000000000000000, " ETH");

    const oldAddress5Balance = parseInt((await provider.getBalance(address5.address)).toString())
    console.log("     Wallet 5  before distributing rewards:  ", oldAddress5Balance / 1000000000000000000, " ETH");
    
    console.log('     Distributing rewards...')
    await LotteryLogic.buyTicket([13,14,15,16,17,18], { value: "1000000000000000000" });

    const newAddress3Balance = parseInt((await provider.getBalance(address3.address)).toString()) 
    console.log("     Wallet 3 after distributing rewards: ", newAddress3Balance / 1000000000000000000, " ETH")
    console.log("     Wallet 3 Difference: ", (newAddress3Balance - oldAddress3Balance)  /1000000000000000000, " ETH");

    const newAddress5Balance = parseInt((await provider.getBalance(address5.address)).toString()) 
    console.log("     Wallet 5 after distributing rewards: ", newAddress5Balance / 1000000000000000000, " ETH")
    console.log("     Wallet 5 Difference: ", (newAddress5Balance - oldAddress5Balance)  /1000000000000000000, " ETH");

    console.log("     Lottery Balance after distributing rewards: ", parseInt((await provider.getBalance(LotteryLogicAddress)).toString()), " ETH")
    
  })

});