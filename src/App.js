import LotteryStorageAbi from  './contractsData/LotteryStorage.json'
import LotteryStorageAddress from './contractsData/LotteryStorage-address.json'
import LotteryLogicAbi from './contractsData/LotteryLogic.json'
import LotteryLogicAddress from './contractsData/LotteryLogic-address.json'
import { Button } from 'react-bootstrap'
import { MetroSpinner } from "react-spinners-kit";
import { useEffect, useState } from 'react'
import {Routes, Route, useNavigate} from 'react-router-dom';
import { ethers } from 'ethers';
import NewTicket from './NewTicket.js';
import SubmitState from "./SubmitState.js";
import Home from "./Home.js";
import './App.css';

function App() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(undefined)
  const [signer, setSigner] = useState(undefined);
  const [logicLottery, setLogicLottery] = useState({})
  const [storageLottery, setStorageLottery] = useState({})
  const [ticketsCount, setTicketsCount] = useState(0);
  const [lotteryRound, setLotteryRound] = useState(0);
  const [lotteryBalance, setLotteryBalance] = useState(0);
  const [blockNumber, setBlockNumber] = useState(0);

  const [open, setOpen] = useState(false);;

  useEffect(() => {
    async function loadLottery() {

      const RPC = "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";
      const provider = new ethers.providers.JsonRpcProvider(RPC);
      
      const systemLotteryLogic = new ethers.Contract(LotteryLogicAddress.address, LotteryLogicAbi.abi, provider);
      const systemLotteryStorage = new ethers.Contract(LotteryStorageAddress.address, LotteryStorageAbi.abi, provider);

      const tickets = await systemLotteryStorage.ticketCount();
      setTicketsCount(tickets.toString());

      const lotteryRound = await systemLotteryStorage.roundCount();
      setLotteryRound(lotteryRound.toString());
      
      const balance = await provider.getBalance(LotteryLogicAddress.address);
      setLotteryBalance(ethers.utils.formatEther(balance));
      
      const blocknum = await provider.getBlockNumber();
      setBlockNumber(blocknum);

      setLoading(false);
      //isConnected();
    }
    
  loadLottery()}, [])

  /////////

  async function isConnected() {
    const accounts = await window.ethereum.request({method: 'eth_accounts'});       
    if (accounts.length) {
       console.log(`You're connected to: ${accounts[0]}`);
       web3Handler();
    } else {
       console.log("Metamask is not connected");
    }
  }

  /////////

  /*const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  }); */

  
    const handleClickOpen = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };

  const web3Handler = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
    
    // Get provider from Metamask
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // Set signer
    const signer = provider.getSigner()
    setSigner(signer)

    window.ethereum.on('chainChanged', (chainId) => {
      window.location.reload();
    })

    window.ethereum.on('accountsChanged', async function (accounts) {
      setAccount(accounts[0])
      await web3Handler()
        })
    //localStorage.setItem('isWalletConnected', true)
    const LotteryLogic = new ethers.Contract(LotteryLogicAddress.address, LotteryLogicAbi.abi, signer)
    const LotteryStorage = new ethers.Contract(LotteryStorageAddress.address, LotteryStorageAbi.abi, signer);
    setLogicLottery(LotteryLogic);
    setStorageLottery(LotteryStorage);
    navigate("/");
  }

  //////////

  if (account == null) {

    return (
      <div className="App">
          {loading ? (
            <div className="App-header">
            <div className="LotteryLogo">
              <div className="LotteryLogo01">Ether</div>
              <div className="LotteryLogo02">Lottery</div>
            </div>
            <div className="loadingText">Loading App...</div>
            <div className="spinner">
            <MetroSpinner size={80} color="white" />
            </div>
            </div>
            
          ) : (
            <header className="App-header">
            <div className="LotteryLogo">
              <div className="LotteryLogo01">Ether</div>
              <div className="LotteryLogo02">Lottery</div>
            </div>
            <div className="LotteryInfo">
              <div className="LotteryInfoComponent">
                <div>Round:</div>
                <div>{lotteryRound}</div>
              </div>
              <div className="LotteryInfoComponent">
                <div>Tickets:</div>
                <div>{ticketsCount}</div>
              </div>
              <div className="LotteryInfoComponent">
                <div>Lottery Assets:</div>
                <div>{lotteryBalance} ETH</div>
              </div>
            </div>
              <Button onClick={web3Handler} className="ConnectButton">Connect Wallet</Button>
            </header>

          )}
      </div>
      );
    } else {
    
    return(
      
      <div className="App">
        <Routes>
          <Route path="/NewTicket" element={<NewTicket lotteryLogic={logicLottery} />} />
          <Route path="/hh" element={<SubmitState lotteryLogic={logicLottery} account={account} />} />
          <Route path="/" element={<Home lotteryLogic={logicLottery} lotteryStorage={storageLottery} account={account} />} />
        </Routes>
            
      </div>
    );
  }}

export default App;