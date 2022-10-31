// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./VRFv2Consumer.sol";
import "./LotteryStorage.sol";

contract LotteryLogic {
    
    address public VRFv2ConsumerAddress ;       //The address of the newly created VRFv2Consumer contract.
    VRFv2Consumer ChainlinkVRF;                 //Instance of the Chainlink VRF.
    LotteryStorage Storage;                     //Instance of the Lottery Storage contract.
    address owner;                              //the wallet that deployed the contract.
    bool public allowTicketSubmitting;                 //Boolean that indicates whether or not the users can submit tickets.
    uint public blocktime;                             //Used to cooldown the call of retrieveNewNumbers functions, at least 5 minutes after requesting new numbers from Chainlink.
    uint[] winningNumbers = [2,4,6,8,10];       //Uint array to store current winning numbers.
    bool internal distributeRewards = false;    //Used to indicate if payRewards function needs to be executed after each round.

    constructor (address _lotteryStorageAddress) {
        
        VRFv2ConsumerAddress = address(new VRFv2Consumer(5903));
        ChainlinkVRF = VRFv2Consumer(VRFv2ConsumerAddress);
        Storage = LotteryStorage(_lotteryStorageAddress);
        owner = msg.sender;
    }

    // Mapping to track if a ticket is already submitted as winning.
    mapping (uint => mapping(uint => bool)) public submittedWinningTickets;

    // Used in checkUniqueNumbers function to temporary store the numbers that exists in a ticket.
    mapping(uint => bool) internal exist;

    event newTicket(uint[] ticketNumbers, address owner, uint creationDate);
    event newWinner(address winner, uint guessedNumbers);
    event generateNumbers(uint state);

    // ================================================== \\
    //       Allows users to buy lottery tickets.         \\
    //       @param _numbers the ticket numbers.          \\
    // ================================================== \\

    function buyTicket(uint[] memory _numbers) external  payable {        
        require(_numbers.length >= 5 && _numbers.length <= 10, "Minimum Numbers allowed: 5, Maximum Numbers allowed: 10.");
        require(msg.value == ((_numbers.length - 4)**2)*2000000000000000, "msg.value doesn't match ticket price.");
        require(!((block.timestamp/86400) % 7 == 2) && !((block.timestamp/86400) % 7 == 3), "Tickets can not be buyght while the lottery is in claim rewards state.");

        if (allowTicketSubmitting) {

            if (distributeRewards) {
                payWinners();
                Storage.resetFourNumberWinnersCount();
                Storage.resetFiveNumberWinnersCount();
                distributeRewards = false;
            }

            Storage.setTicketsPerRound(Storage.roundCount(), Storage.ticketCount());
            Storage.increaseRoundCount();
            Storage.resetTicketCount();

            allowTicketSubmitting = false;
        }

        checkUniqueNumbers(_numbers);
        Storage.addUserTicket(_numbers, msg.sender, block.timestamp);
        Storage.increaseTicketCount();

        emit newTicket(_numbers, msg.sender, block.timestamp);
        
    }

    // ================================================== \\
    //    Allows users to submit for a ticket Check.      \\
    //      @param _ticketId the id of the ticket.        \\
    // ================================================== \\

    function submitWinningTicket (uint _ticketId) external {
        require(((block.timestamp/86400) % 7 == 2) || ((block.timestamp/86400) % 7 == 3), "Winning tickets can not be submitted right now.");
        require(submittedWinningTickets[Storage.roundCount()][_ticketId] == false, "Ticket already submitted.");
        require(allowTicketSubmitting, "Cannot submit tickets before generating new wining numbers.");

        uint[] memory _ticketNumbers = Storage.getTicketNumbers(Storage.roundCount(), _ticketId);
        uint _guessedNumbers = 0;
        
        for (uint i = 0; i < _ticketNumbers.length; i++) {
            for (uint j = 0; j < 5; j ++) {
                if (_ticketNumbers[i] == winningNumbers[j]) {
                    _guessedNumbers++;
                    break;
                }
            }
        }
    
        if (_guessedNumbers == 4) {
            Storage.addFourNumbersWinner(Storage.roundCount(), Storage.fourNumberWinnersCount(), Storage.getTicket(Storage.roundCount(), _ticketId).owner);
            Storage.increaseFourNumberWinnersCount();
            emit newWinner(msg.sender, 4);

            if (!distributeRewards) {
                distributeRewards = true;
            }
        }

        if (_guessedNumbers == 5) {
            Storage.addFiveNumbersWinner(Storage.roundCount(), Storage.fourNumberWinnersCount(), Storage.getTicket(Storage.roundCount(), _ticketId).owner);
            Storage.increaseFiveNumberWinnersCount();
            emit newWinner(msg.sender, 5);

            if (!distributeRewards) {
                distributeRewards = true;
            }
        }

        submittedWinningTickets[Storage.roundCount()][_ticketId] = true;

    }

    // ================================================== \\
    //  Used to request new numbers from Chainlink VRF.   \\
    // ================================================== \\

    function requestNumbers() external {
        require(((block.timestamp/86400) % 7 == 2) || ((block.timestamp/86400) % 7 == 3), "You cannot request new numbers right now.");
        ChainlinkVRF.requestRandomWords();
        blocktime = block.timestamp;
        emit generateNumbers(1);
    }

    function retrieveNewNumbers () external {
        require((block.timestamp - blocktime) > 120 && (block.timestamp - blocktime) < 3600, "Please wait a little bit more before accesing the new numbers.");
        uint[] memory _winningNumbers = ChainlinkVRF.returnNewResults();
        
        for (uint i = 0; i < 5; i++) {
            if (_winningNumbers[i] % 50 == 0) {
                winningNumbers[i] = 50;
            } else {
                winningNumbers[i] = _winningNumbers[i] % 50;
            }
        }

        allowTicketSubmitting = true;
        emit generateNumbers(2);
    }

    // ================================================== \\
    //      Used to return latest Winning numbers.        \\
    // ================================================== \\

    function getWinningNumbers() public view returns (uint[] memory) {
        return winningNumbers;
    }

    // ================================================== \\
    //   Used to prevent duplicated numbers in ticket.    \\
    //   @param _numbers the ticket numbers to check.     \\
    // ================================================== \\

    function checkUniqueNumbers(uint[] memory _numbers) internal {
        for (uint i = 0; i < _numbers.length; i++) {
            if (exist[_numbers[i]] == true) {
                revert("Dublicated Numbers");
            } else {
                exist[_numbers[i]] = true;
            }
        }

        for (uint i = 0; i < _numbers.length; i++) {
            exist[_numbers[i]] = false;
        }
    }

    // ================================================== \\
    //        Used to distribute rewards to users.        \\
    // ================================================== \\

    function payWinners() internal {
        
        uint _totalAssets = address(this).balance - 10000000000; // 100000000000000000;
        uint ownerPercent = _totalAssets / 100;
        payable(owner).transfer(ownerPercent);
        _totalAssets = _totalAssets -(ownerPercent);


        uint fourNumberWinnersCount = Storage.fourNumberWinnersCount();
        if (fourNumberWinnersCount > 0) {
            uint _fourNumbersReward = ((_totalAssets / 100) * 20) / fourNumberWinnersCount;

            for (uint i = 0; i < fourNumberWinnersCount; i++) {
                payable(Storage.fourNumberWinners(Storage.roundCount(), i)).transfer(_fourNumbersReward);
            }
        }

        uint fiveNumberWinnersCount = Storage.fiveNumberWinnersCount();
        if (fiveNumberWinnersCount > 0) {
            uint _fiveNumbersReward = (address(this).balance - 10000000000) / fiveNumberWinnersCount;

            for (uint i = 0; i < fiveNumberWinnersCount; i++) {
                payable(Storage.fiveNumberWinners(Storage.roundCount(), i)).transfer(_fiveNumbersReward);
            }
        }

        distributeRewards = false;
    }

}
