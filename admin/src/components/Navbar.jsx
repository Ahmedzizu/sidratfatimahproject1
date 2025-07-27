import React from "react";
import { Nav, Navbar, NavDropdown, Container } from "react-bootstrap";
import { Link } from '@mui/material';

const AppNavbar = () => {
  return (
    <Navbar bg="light">
      <Container>
        <Navbar.Brand href="#">React Bootstrap Navbar</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav className="ms-auto">
            <Nav.Link href="#">Home</Nav.Link>
            <NavDropdown title="Booking" id="basic-nav-dropdown">
              <NavDropdown.Item><Link> Rooms</Link></NavDropdown.Item>
              <NavDropdown.Item><Link> Resorts</Link></NavDropdown.Item>
              <NavDropdown.Item><Link> Chalets</Link></NavDropdown.Item>
            </NavDropdown>
            <Nav.Link href="#">Settings</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
