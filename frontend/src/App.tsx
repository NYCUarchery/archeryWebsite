import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import PersonalPage from './pages/PersonalPage';
import PageRoute from './components/PageRoute';
import LoginPage from './pages/LoginPage';



function App() {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  return (
    <div>
      <Router>
        <Header setSideBarOpen={setSideBarOpen} setAuthorized={setAuthorized}/>
        <div style={{display: "flex"}}>
          <Sidebar sideBarOpen={sideBarOpen} />
          <div style={{position: "fixed", minHeight: "calc(100vh - 64px)", minWidth: "100vw", top: "64px", height: "calc(100vh - 64px)", overflowY: "scroll"}}>
            {authorized?
              <PageRoute/>:
              <LoginPage setAuthorized={setAuthorized}/>
            }
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
