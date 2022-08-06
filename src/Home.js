import { Button } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { MetroSpinner } from "react-spinners-kit";
import { ethers } from 'ethers';


const Home = ({lotteryLogic, lotteryStorage, account}) => {
  
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [buyPeriod, setBuyPeriod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [numbersText, setNumbersText] = useState("");


  useEffect(() => {
    function load() {
      loadContracts(lotteryLogic, lotteryStorage, account)
    }
    
  load()}, [])
  


  const loadContracts = async (lotteryLogic, lotteryStorage, account) => {
    
    // Get the winning numbers in an array of integers.
    let winningNumbers = await lotteryLogic.getWinningNumbers();
    winningNumbers = winningNumbers.map(x => parseInt(x.toString()));

    // Creating a winning numbers text that will be displayed to our users when the lottery is in submit state.
    let winningNumbersText = "";

    for ( let i = 0; i < 5; i++ ) {
      winningNumbersText = winningNumbersText + winningNumbers[i].toString() + ' ,';
    }

    winningNumbersText = winningNumbersText.split(',').slice(0, -1).join(',');
    setNumbersText(winningNumbersText);

    // Connecting to provider to read information before a metamask wallet is connected.
    const RPC = "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
    const provider = new ethers.providers.JsonRpcProvider(RPC);

    // Getting latest blocknumber and timestamp from provider.
    const latestBlockNumber = await provider.getBlockNumber();
    const latestBlock = await provider.getBlock(latestBlockNumber);


    // Check if lottery is currently in Buy or submit mode.
    if (!(Math.floor(latestBlock.timestamp/86400) % 7 === 2) && !(Math.floor(latestBlock.timestamp/86400) % 7 === 3) && !(Math.floor(latestBlock.timestamp/86400) % 7 === 5)) {
     
      // BuyPeriod is false by default so we don't need to specify else statement.
      setBuyPeriod(true);
    }


    // Getting ticket count and latest lottery round.
    const ticketsCount = await lotteryStorage.ticketCount();
    const lotteryRound = await lotteryStorage.roundCount();
    
    // This is the list where all of our tickets will be saved.
    const _tickets = [];

    for (let i = 0; i < ticketsCount; i++) {

      // Gets the ticket with ID "i" and check if the connected wallet owns that ticket.
      let ticketInfo = await lotteryStorage.getTicket(lotteryRound, i);
      if (ticketInfo.owner.toLowerCase() === account.toLowerCase()) {
        
        // Fetches the ticket Numbers.
        let ticketNumbers = ticketInfo.ticketNumbers.map(x => parseInt(x.toString()));
        
        // ticketNumbersText is a string variable used to output the numbers in more readable and nice way.
        let ticketNumbersText = "";

        for (let i = 0; i < ticketNumbers.length; i++) {
          ticketNumbersText = ticketNumbersText + ticketNumbers[i].toString() + ', ';
        }

        ticketNumbersText = ticketNumbersText.split(',').slice(0, -1).join(',')
        


        // Managing ticket Status.
        let status = "Active";

        // If the lottery is in buy mode, the status remains unchanged.
        if (!(Math.floor(latestBlock.timestamp/86400) % 7 === 2) && !(Math.floor(latestBlock.timestamp/86400) % 7 === 3) && !(Math.floor(latestBlock.timestamp/86400) % 7 === 5)) {
          status = 'Active'
          
        } else {

          // Counting how many numbers the user have guessed. If they are 4-5, the ticket status will be changed to winning (submit).
          let guessedNumbers = 0;
          for ( let k = 0; k < winningNumbers.length; k++ ) {
            for ( let j = 0; j < ticketNumbers.length; j++ ) {
              if ( winningNumbers[k] === ticketNumbers[j] ) {
                guessedNumbers = guessedNumbers + 1;
              }
            } 
          }
          

          if ( guessedNumbers >= 4 ) {

            // Check if the current ticket is already submitted to avoid double submittions.
            const isSubmitted = await lotteryLogic.submittedWinningTickets(lotteryRound, i);
            
            // If the ticket is already submitted, a Status of "Submitted" will be applied.
            if (!isSubmitted) {
              status = <button className="submitTicketBtn" onClick={() => {submitWinningTicket(i)}}>Submit</button>
            } else {
              status = <div className="submitTicketBtn">Submitted</div>
            }
          
          
          } else {

            // If the ticket have less than 4 correct numbers, a status of "Not Winning" will be applied.
            status = <div className="notWinningStatus">Not Winning</div>
          }
        } 


        // Create ticket object with the ticket numbers, creationDate, status and ticket id.
        let ticketObj = {
          Numbers : ticketNumbersText,
          Date : timeConverter(ticketInfo.creationDate.toString()),
          Status: status,
          id: i
        }

        // Store the new object in the _tickets list.
        _tickets.push(ticketObj);
      }
    }
    
    // Once all the tickets is loaded, pass them to useState and stop showing the Loading Page.
    setTickets(_tickets)
    setLoading(false);
    
  }
  


  // Used to submit a winning ticket.
  const submitWinningTicket = async (id) => {
    const submitTransaction = await lotteryLogic.submitWinningTicket(id);
    
    lotteryLogic.on("newWinner", async () => {
      navigate("/");
    })

  }

  // Used to convert unix timestamps to readable human date.
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
        <div className="LotteryLogo02">Lottery</div>
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
        
        {buyPeriod ? (
          
          <Button onClick={() => navigate("/newTicket")} className="BuyTicketBtn">Buy new Ticket</Button>
        
        ) : (
          <div className="winningNumbers">
            <h2>Winning Numbers:</h2>
            <h2 className="mb-5"> {numbersText}</h2>
          </div>
        )}

        {tickets.length >= 1 ? (

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

        ) : (
        
          <h2>You do not have any active tickets.</h2>
      
        )}
        
        </div>        

      )}

      </div>
      </header>
  )
}

export default Home;