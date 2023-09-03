import './App.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageRoute from './routings/PageRoute';
import UnauthRoute from './routings/UnauthRoute';

import { useState } from 'react';
import PageContainer from './components/PageContainer';

function App() {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  
  return (
    <div>
      <BrowserRouter>
        <Header setSideBarOpen={setSideBarOpen} setAuthorized={setAuthorized}/>
        <div style={{display: "flex"}}>
          <Sidebar setSideBarOpen={setSideBarOpen} sideBarOpen={sideBarOpen} />
          <div style={{position: "fixed", minHeight: "calc(100vh - 64px)", minWidth: "100vw", top: "64px", height: "calc(100vh - 64px)", overflowY: "scroll"}}>

            <PageContainer>

              {authorized?
                <PageRoute />:
                <UnauthRoute setAuthorized={setAuthorized}/>
              }
            </PageContainer>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
