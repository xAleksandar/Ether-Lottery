import { Button } from 'react-bootstrap'
import { FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { MetroSpinner } from "react-spinners-kit";
import { ethers } from 'ethers';

const Home = ({lotteryLogic, lotteryStorage, account}) => {
  
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [buyPeriod, setBuyPeriod] = useState(false);
  const [winState, setWinState] = useState(4);
  const [loading, setLoading] = useState(true);
  const [numbersText, setNumbersText] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("Loading App State...");

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
    const RPC = "https://eth-goerli.g.alchemy.com/v2/udeXBeBE8aVQnb7oj2zvSOlJRUhgca5g";
    const provider = new ethers.providers.JsonRpcProvider(RPC);

    // Getting latest blocknumber and timestamp from provider.
    const latestBlockNumber = await provider.getBlockNumber();
    const latestBlock = await provider.getBlock(latestBlockNumber);
    
    console.log("DAY ", Math.floor(latestBlock.timestamp/86400) % 7)
    // Check if lottery is currently in Buy or submit mode.
    if (!(Math.floor(latestBlock.timestamp/86400) % 7 === 2) && !(Math.floor(latestBlock.timestamp/86400) % 7 === 3)) {
      
      // BuyPeriod is false by default so we don't need to specify else statement.
      setBuyPeriod(true);
    } else {
      const blocktime = parseInt((await lotteryLogic.blocktime()).toString());
      
      if ((latestBlock.timestamp - blocktime) > 86400) {
        setWinState(1);
      }

      else if (await lotteryLogic.allowTicketSubmitting() == true) {
        setWinState(4);
      }

      else if ((latestBlock.timestamp - blocktime) > 120 && (latestBlock.timestamp - blocktime) < 86400) {
        setWinState(3);
      } else {
        setWinState(2);
      }

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
        if (!(Math.floor(latestBlock.timestamp/86400) % 7 === 2) && !(Math.floor(latestBlock.timestamp/86400) % 7 === 3)) {
          status = <div className="activeStatus">Active</div>
          
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
              status = <div className="submitedTicketBtn">Submitted</div>
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
      window.location.reload(true);
      //navigate("/");
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
  
  const displayStep = (step) => {
    switch (step) {
      
      case 1:
        
        return (
          <div className="NumbersBody">
            <div className="GenerateNumbersText">Ticket purchase period has ended. Please Generate new winning numbers to check your tickets.</div>
            <button className="infoNumbersBtn" onClick={
              async () => {
                await lotteryLogic.requestNumbers();
                setLoadingMessage("Loading, please wait..");
                setLoading(true);
                lotteryLogic.on("generateNumbers", async () => {
                  setWinState(2);
                  setLoading(false);
                })
              }} >Generate Numbers</button>
          </div>
        )

      case 2:
        
        return (
          <div className="GenerateNumbersText" style={{padding: '60px 0px'}}>Generating Numbers, please come back in two minutes.</div>
        )
        
      case 3:
        
        return (
          <div className="NumbersBody">
            <div className="GenerateNumbersText">New numbers have been generated. Click the button bellow to reveal them.</div>
            <button className="infoNumbersBtn" onClick={
              async () => {
                await lotteryLogic.retrieveNewNumbers()
                setLoadingMessage("Loading, please wait..");
                setLoading(true);
                lotteryLogic.on("generateNumbers", async () => {
                  setWinState(4);
                  setLoading(false);
                })
              }} >Reveal Numbers</button>
          </div>  
        )

      case 4:
        return (
          <div className="GenerateNumbersText">
            <h2>Lottery is in claim rewards state.</h2>
            <h2 className="mb-5 text-green-300"> Winning Numbers: {numbersText}</h2>

            {tickets.length >= 1 ? (
              <div className="TicketWindow">
                <div className="TicketsTop">Your Active Tickets</div>
                <FlatList 
                  data={tickets}
                  renderItem={({ item }) => (
                    <div className="TicketBody">
                      <div className="Numbers_Date">
                        <div className="TicketNumbers">{item.Numbers}</div>
                        <div className="TicketDate">{item.Date}</div>
                      </div>
                      <div className="TicketStatus">{item.Status}</div>
                    </div>
                  )}  
                />
                <div className="EmptySpace"></div>
              </div>
            ) : (
              <h2>you don't have any tickets.</h2>
            )}

          </div>
        )
    }
  };

  return(
    <header>
      
      {loading ? (
        <div className="LoadingContainer">
          <div className="loadingText">
             {loadingMessage}
          </div>
          <div className="spinner">
            <MetroSpinner size={80} color="white" />
          </div>
        </div>
      
      ):(

        <div className="Body" style={{ padding: 30}}>
        {buyPeriod ? (
          <div className="info">
          {tickets.length >= 1 ? (
            
            <div className="TicketWindow"> 
                <div className="TicketsTop">Your Active Tickets</div>
                <FlatList 
                  data={tickets}
                  renderItem={({ item }) => (
                    <div className="TicketBody">
                      <div className="Numbers_Date">
                        <div className="TicketNumbers">{item.Numbers}</div>
                        <div className="TicketDate">{item.Date}</div>
                      </div>
                      <div className="TicketStatus">{item.Status}</div>
                    </div>
                  )}  
                />
                <div className="EmptySpace"></div>
              </div>
            ) : (
            <div className="loadingText">you don't have any tickets.</div>
          )}
          
          <Button onClick={() => navigate("/newTicket")} className="BuyTicketBtn">Buy new Ticket</Button>
          </div>
        ) : (
          <div className="info">
            {displayStep(winState)}
          </div>
        )}
        </div>
      )}
    </header>
  )

}

export default Home;