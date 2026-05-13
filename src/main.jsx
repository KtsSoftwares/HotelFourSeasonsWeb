import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import { BrowserRouter as Router } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.js'
import './index.css'
import App from './App.jsx'
import { FirebaseProvider } from './Context/FirebaseContext.jsx'
import Loader from './Components/Loader.jsx'

window.Buffer = Buffer;
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FirebaseProvider>
      <Router>
        <Loader />
        <App />
      </Router>
    </FirebaseProvider>
  </StrictMode>,
)
