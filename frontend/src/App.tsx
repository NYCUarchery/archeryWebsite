import './App.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import { BrowserRouter } from 'react-router-dom';
import PageRoute from './routings/PageRoute';
import UnauthRoute from './routings/UnauthRoute';

import { useEffect, useState } from 'react';
import PageContainer from './components/PageContainer';

import { userStore } from './util/userReducer';
import { GetUid } from './util/api2';

function App() {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [subpage, setSubpage] = useState(<UnauthRoute />);
  userStore.subscribe(() => {
    if (userStore.getState().uid > 0) {
      setSubpage(<PageRoute />);
    }
    else {
      setSubpage(<UnauthRoute />);
    }
  })
	useEffect(() => {
		GetUid()
  }, [])
  
  return (
    <div>
      <BrowserRouter>
          <Header setSideBarOpen={setSideBarOpen} />
          <div style={{display: "flex"}}>
            <Sidebar setSideBarOpen={setSideBarOpen} sideBarOpen={sideBarOpen} />
            <div style={{position: "fixed", minHeight: "calc(100vh - 64px)", minWidth: "100vw", top: "64px", height: "calc(100vh - 64px)", overflowY: "scroll"}}>

              <PageContainer>
                {subpage}
              </PageContainer>
            </div>
          </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
