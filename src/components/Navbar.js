import { Link } from "react-router-dom";
import { Navbar, Nav, Button, Container } from 'react-bootstrap'
import logo from '../images/logo.ico';
import '../App.css'

const Navigation = ({ web3Handler, account }) => {
    return (
        <Navbar expand="lg" className="Navibar" bg="secondary" variant="dark">
            <Container>
                <Navbar.Brand href="">
                    <img src={logo} width="40" height="40" className="" alt="" />
                    &nbsp; Ether Lottery
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/About">About</Nav.Link>
                    </Nav>
                    <Nav>
                        {account ? (
                            <Nav.Link
                                href={`https://etherscan.io/address/${account}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="button nav-button btn-sm mx-4">
                                <Button variant="outline-light">
                                    {account.slice(0, 5) + '...' + account.slice(38, 42)}
                                </Button>

                            </Nav.Link>
                        ) : (
                            <Button onClick={web3Handler} className="Navibar" variant="outline-light">Connect Wallet</Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )

}

export default Navigation;