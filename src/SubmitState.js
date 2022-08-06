import { Button } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import {Routes, Route, useNavigate} from 'react-router-dom';
import { MetroSpinner } from "react-spinners-kit";
import { ethers } from 'ethers';

const SubmitState = ({lottery, account}) => {
  
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState([]);
  const [buyPeriod, setBuyPeriod] = useState(false);
  const [loading, setLoading] = useState(true)
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [winningNumbersText, setWinningNumbersText] = useState("")

  useEffect(() => {
    function load() {
      loadContracts(lottery, account)
    }
    
  load()}, [])

  const loadContracts = async (lottery, account) => {
    
    // Get deployed copies of contracts
    
    const xb = (await lottery.getWinningNumbers()).map(x => x.toString());
    setWinningNumbers(xb);

    let winningText = "";
    for (let i = 0; i < xb.length; i++) {
      winningText = winningText + xb[i].toString() + ", "
    }

    setWinningNumbersText(winningText.split(',').slice(0, -1).join(','))

    const RPC = "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const latestBlockNumber = await provider.getBlockNumber();
    const latestBlock = await provider.getBlock(latestBlockNumber);

    console.log('LatestBlock', latestBlock.timestamp);

    if (!((latestBlock.timestamp/86400) % 7 === 2) || ((latestBlock.timestamp/86400) % 7 === 3)) {
      setBuyPeriod(true);
      console.log('IT is buyperiod')
    } 

    
    const _tickets = [];

    const ticketsCount = await lottery.ticketCount();
    const lotteryRound = await lottery.roundCount();
    
    for (let i = 0; i < ticketsCount; i++) {

      //Check if connected wallet owns the current ticket.
      let info = await lottery.userTickets(lotteryRound, i);
      if (info.owner.toLowerCase() === account.toLowerCase()) {
        
        //Fetches the ticket Numbers.
        let ticketNumbers = await lottery.getTicketNumbers(lotteryRound, i);
        let ticketNumbersText = "";

        for (let i = 0; i < ticketNumbers.length; i++) {
          ticketNumbersText = ticketNumbersText + ticketNumbers[i].toString() + ', ';
        }

        ticketNumbersText = ticketNumbersText.split(',').slice(0, -1).join(',')

        //Fetches the rest ticket information.
        let ticketInfo = await lottery.userTickets(lotteryRound, i);
        
        let guessedNumbers = 0;

        for (let i = 0; i < ticketNumbers.length; i++) {
          for (let j = 0; j < 5; j++) {
            if ( parseInt(ticketNumbers[i].toString()) === parseInt(xb[j].toString()) ) {
              guessedNumbers = guessedNumbers + 1;
            }
          }
        }

        let ticketStatus = "Not Winning";
        
        if (guessedNumbers >= 3) {
          ticketStatus = <Button className="ClaimRewardBtn" onClick={() => submitWinningTicket(ticketNumbers)} >Claim</Button>;
        }

        //Create ticket Object and store it 
        
        let ticketObj = {
          Numbers : ticketNumbersText,
          Date : timeConverter(ticketInfo.creationDate.toString()),
          Status: ticketStatus,
          id: i
        }
        _tickets.push(ticketObj);
        //setTickets(tickets => [...tickets, {Date : ticketInfo.creationDate.toString(), Status: "active"}])
        
      }
    }
    
    setTickets(_tickets)
    setLoading(false);
    
  }
  
  function submitWinningTicket(numbers) {
    numbers = numbers.map(x => parseInt(x.toString()));
    console.log("Winning Numbers: ", numbers)
  }

  function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  }
  

  return(
    <header className="App-header">
      <div className="LotteryLogo">
        <div className="LotteryLogo01">Ether</div>
        <div className="LotteryLogo02">Lotterys</div>
      </div>
      <div className="LotteryInfo">


      {loading ? (
        
        <div className="asd">  
          <div className="loadingText">
            Loading App State...
          </div>
          <div className="spinner">
            <MetroSpinner size={80} color="white" />
          </div>
        </div>

      ) : (

        <div className="asd">
        
        <h2>{winningNumbersText}</h2>

        <table>
        <thead>
          <tr>
            <th>Numbers</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
        {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.Numbers}</td>
              <td>{ticket.Date}</td>
              <td>{ticket.Status}</td>
            </tr>
          ))}
        </tbody>
      </table>

        </div>        

      )}

      </div>
      </header>
  )
}

export default SubmitState;