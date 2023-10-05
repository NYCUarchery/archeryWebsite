import './App.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

import { BrowserRouter } from 'react-router-dom';
import PageRoute from './routings/PageRoute';
import UnauthRoute from './routings/UnauthRoute';

import { useState } from 'react';
import PageContainer from './components/PageContainer';
import { host, api } from './util/api';

import UserContext from './util/userContext';

function App() {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [uid, setUid] = useState("");
  (uid == "") && fetch(`${host}/${api.user.getUserID}`, {
    method: "GET",
    credentials: "include",
  })
  .then((res) => res.json())
  .then((resjson) => {
    console.log(resjson);
    if (resjson["uid"]) {
      setUid(resjson["uid"]);
    }
  });

  return (
    <div>
      <BrowserRouter>
        <UserContext.Provider
          value={{
            uid: uid,
          }}
        >
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
        </UserContext.Provider>
      </BrowserRouter>
    </div>
  );
}

export default App;
