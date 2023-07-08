import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import QualifyingPhaseBoard from './components/QualifyingPhaseBoard/QualifyingPhaseBoard.tsx'

const router = createBrowserRouter([
  { path: "/",
    element: <App/>,
    children:[
      {
        path: "/novice/qualifying_phase",
        element:<QualifyingPhaseBoard/>,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
