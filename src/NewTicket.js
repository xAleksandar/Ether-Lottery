import { useEffect, useState } from 'react'
import {useNavigate} from 'react-router-dom';
import { ethers } from 'ethers';
import Modal from "./components/Modal.js";

const NewTicket = ({lotteryLogic}) => {
  
  const navigate = useNavigate();

  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [showSelectedNumbers, setShowSelectedNUmbers] = useState("");
  const [maxNumbersWarning, setMaxNumbersWarning] = useState(false);
  const [enableBuyButton, setEnableBuyButton] = useState(false);
  const [priceText, setPriceText] = useState("--");
  const [modal, setOpenModal] = useState(false);
  const [currentModalStep, setCurrentModalStep] = useState(1);
  const [transactionHash, setTransactionHash] = useState("");
  const _ = require("lodash");



  useEffect(() => {
    function load() {
      createNumbers();
    }
    
  load()}, [])


  // Used to add or remove a number from the numbers list.
  const setupNumber = (num) => {
    
    // Getting a copy of already selected numbers
    const alreadySelectedNumbers = selectedNumbers.slice();
    
    // Remove the selected number if it is already selected.
    if (alreadySelectedNumbers.includes(num)) {
      setMaxNumbersWarning(false);
      for ( let i = 0; i < alreadySelectedNumbers.length; i++) {
        if (alreadySelectedNumbers[i] === num) {
          alreadySelectedNumbers.splice(i, 1);
        }
      }
    
    // Add the selected number in the numbers list if it's not selected and list's length is less than 10.
    } else if(alreadySelectedNumbers.length < 10) {
      alreadySelectedNumbers.push(num);
    
    // Enable max number warning if the user try to select more than 10 numbers.
    } else {
      setMaxNumbersWarning(true);
    }
    
    // String variable used to display the selected numbers in more nicer and readable way.
    let numbersText = "";

    for (let i = 0; i < alreadySelectedNumbers.length; i++) {
      numbersText = numbersText + alreadySelectedNumbers[i].toString() + ", ";
    }

    numbersText = numbersText.split(',').slice(0, -1).join(',');

    // A check that disabled the Buy button until user have selected 5 or more numbers.
    if (alreadySelectedNumbers.length >= 5) {
      setEnableBuyButton(true);
    } else {
      setEnableBuyButton(false);
    }

    // Update useState with new information.
    setSelectedNumbers(alreadySelectedNumbers);
    setupPrice(alreadySelectedNumbers);
    setShowSelectedNUmbers(numbersText);
  }

  // A function used to calculate and display the ticket price in eth.
  // "--" is shown instead of actual price before the user selects at least 5 numbers. 
  const setupPrice = (numbers) => {
    if (numbers.length >= 5) {
      let price = ethers.utils.formatEther((((numbers.length - 4)**2)*20000000000000000).toString());
      setPriceText(price + " ETH");
    } else {
      setPriceText('--')
    }
  }


  // Used to buy a ticket.
  const buyTicket = async (lottery, numbers) => {
    
    // Open the modal dialog once the user click the Buy button.
    setOpenModal(true);
    window.scrollTo(0, 0);
    
    // Calculate the msg.value (ticket price) in wei.
    const weiPrice = ((numbers.length - 4)**2)*2000000000000000;
    
    // Declare transaction.
    // let transaction;
    
    //const transaction;

    //setCurrentModalStep(2)

    // Listen to contract event to move the modal to final step once the transaction is mined.
    //lotteryLogic.on("newTicket", async (ticketNumbers, owner, creationDate) => {
      //setCurrentModalStep(3)
    //})
    try {
      //console.log("test 111")
      // Send the transaction.
      console.log("Price ", weiPrice.toString())
      const transaction = await lotteryLogic.buyTicket(numbers, { value: weiPrice.toString()});
      //console.log("test 222")
      setTransactionHash(transaction.hash)
      //Move modal to next step.
      setCurrentModalStep(2)

      // Listen to contract event to move the modal to final step once the transaction is mined.
      lotteryLogic.on("newTicket", async (ticketNumbers, owner, creationDate) => {
        setCurrentModalStep(3)
      })
    
    // In case of Metamask user rejection, close the modal window.
    } catch (err) {
      setOpenModal(false);
      setCurrentModalStep(1);
    }

    //console.log('typeOf', typeof(transaction.code))
    
  }


  // Used to create the numbers 
  const createNumbers = () => {
    const numbers = [];

    for (let i = 1; i < 51; i++) {
      numbers.push(<button className="NumberBtn" onClick={() => setupNumber(i)}>{i}</button>)
    }
    
    return _.chunk(numbers, 10);

  }

  return (
    <div className="App-header">
      {modal && <Modal currentStep = {currentModalStep} transactionHash = {transactionHash} />}
      <div className="Body">
        <div className="Display">
          <h2>Your Numbers: {showSelectedNumbers}</h2>
          <h2>Price: {priceText}</h2>
        </div>
        {maxNumbersWarning ? (<div className="maxNumbersWarning">Maximum Numbers already selected!</div>) : (<div></div>)}
        <div className="Numbers">
        {createNumbers().map(x => <div className="NumbersRow">{x}</div>)}
        </div>
        
        {enableBuyButton ? (
            <button className="BuyTicketBtn" onClick={() => buyTicket(lotteryLogic, selectedNumbers)}>Buy Ticket!</button>
          ) : (
            <button className="BuyTicketBtnDisabled" disabled={true}>Buy Ticket!</button>
          )}

        
      </div>
    </div>
  );
}

export default NewTicket;
