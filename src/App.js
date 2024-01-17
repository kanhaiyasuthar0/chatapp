import React, { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./components/PrivateRute/PrivateRoute";
import { Typography, Container } from '@mui/material';
import { makeStyles } from "@material-ui/core/styles"

const useStyles = makeStyles((theme) => ({
  container: {
    textAlign : "center",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh', // Center vertically in viewport
    // border : "10px solid"
  },
  heading: {
    fontSize: '36px', 
    color: '#333', 
    backgroundColor: '#f0f0f0', 
    padding: theme.spacing(2), 
    borderRadius: '10px', 
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)', 
    textAlign: 'center', 
    width: '98%', 
    margin : "auto",
    // border : "1px solid",
    // display : "inline-block"



  },
}));

function App() {
  const classes = useStyles();
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("isLoggedIn") ?? false);
  return (
    <div style={{ padding: "10px" }}>
      {/* <h1 style={{textAlign : "center", margin: "auto"}}>Welcome to  GupShupIndia</h1> */}
      <Typography variant="h3" className={classes.heading}>
  Welcome to{' '}
  <div style={{ background: '#ff9933', display: 'inline', fontWeight: '600' }}>
    <span style={{ color: 'white' }}>Gup</span>
  </div>
  <div style={{ background: '#ffffff', display: 'inline', fontWeight: '600' }}>
    <span style={{ color: '#138808' }}>Shup</span>
  </div>
  <div style={{ background: '#138808', display: 'inline', fontWeight: '600' }}>
    <span style={{ color: 'white' }}>India</span>
  </div>
</Typography>
<div style={{margin : "0px 45%"}}>

Hello, {
 <span style={{color : "green"}}> {localStorage.getItem("userName") ?? ""}</span>
}
  </div>
      <Router>
        <Routes>
        <Route path="/" element={<Login  setIsAuthenticated={setIsAuthenticated}/>} />
          <Route path="/login" element={<Login  setIsAuthenticated={setIsAuthenticated}/>} />
          <Route path="/register" element={<Register />} />

          {isAuthenticated && <Route path="/chat" element={<Chat />} />}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
