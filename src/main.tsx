import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider } from 'convex/react'
import App from './App.tsx'
import { convex, convexEnabled } from './lib/convex'
import { registerPwa } from './pwa'
import './styles/globals.css'

const app = convexEnabled && convex
  ? <ConvexProvider client={convex}><App /></ConvexProvider>
  : <App />;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {app}
  </React.StrictMode>,
)

registerPwa()
