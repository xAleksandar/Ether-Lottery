// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract LotteryStorage {

    address owner;
    mapping (address => bool) public permittedUsers;

    constructor () {
        owner = msg.sender;
        permittedUsers[msg.sender] = true;
    }

    uint public roundCount = 1;
    uint public ticketCount = 0;
    uint public fourNumberWinnersCount;
    uint public fiveNumberWinnersCount;



    struct ticketInfo {
        uint[] ticketNumbers;
        address owner;
        uint creationDate;
    }

    // Mapping Lottery Round to ticket number which contains the ticket informaiton.
    mapping (uint => mapping(uint => ticketInfo)) public userTickets;

    function addUserTicket (uint[] memory _ticketNumbers, address _owner, uint _creationDate) external permitted {
        userTickets[roundCount][ticketCount] = ticketInfo(_ticketNumbers, _owner, _creationDate);
    }

    function getTicket (uint _round, uint _ticket) external view returns (ticketInfo memory) {
        return userTickets[_round][_ticket];
    }

    function getTicketNumbers (uint _round, uint _ticket) external view returns (uint[] memory) {
        return userTickets[_round][_ticket].ticketNumbers;
    } 

    // Mapping to track the total ticket count for every round.
    mapping (uint => uint) public ticketsPerRound;

    function setTicketsPerRound (uint _round, uint _value) external permitted {
        ticketsPerRound[_round] = _value;
    }



    mapping (uint => mapping(uint => address)) public fourNumberWinners;

    function addFourNumbersWinner (uint _round, uint _count, address _owner) external permitted {
        fourNumberWinners[_round][_count] = _owner;
    }



    mapping (uint => mapping(uint => address)) public fiveNumberWinners;

    function addFiveNumbersWinner (uint _round, uint _count, address _owner) external permitted {
        fiveNumberWinners[_round][_count] = _owner;
    }


    mapping (uint => mapping(uint => bool)) public submittedWinningTickets;

    function increaseRoundCount() external permitted {
        roundCount = roundCount + 1;
    }

    /////////

    function increaseTicketCount() external permitted {
        ticketCount = ticketCount + 1;
    }

    function resetTicketCount() external permitted {
        ticketCount = 0;
    }

    ///////

    function increaseFourNumberWinnersCount() external permitted {
        fourNumberWinnersCount = fourNumberWinnersCount + 1;
    }

    function resetFourNumberWinnersCount() external permitted {
        fourNumberWinnersCount = 0;
    }

    ////////

    function increaseFiveNumberWinnersCount() external permitted {
        fiveNumberWinnersCount = fiveNumberWinnersCount + 1;
    }

    function resetFiveNumberWinnersCount() external permitted {
        fiveNumberWinnersCount = 0;
    }

    ///////

    function managePermittedUsers (address _user, bool _state) external onlyOwner {
        if (_state) {
            permittedUsers[_user] = true;
        } else {
            permittedUsers[_user] = false;
        }
    }

    modifier onlyOwner() {
    require(msg.sender == owner);
    _;}

    modifier permitted() {
    require(permittedUsers[msg.sender] == true, "msg.sender not permitted.");
    _;}
}