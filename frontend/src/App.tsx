import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';

function App() {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  
  return (
    <div>
      <Header setSideBarOpen={setSideBarOpen} />
      <div style={{display: "flex"}}>
        <Sidebar sideBarOpen={sideBarOpen} />
        page

      </div>
    </div>
  );
}

export default App;
