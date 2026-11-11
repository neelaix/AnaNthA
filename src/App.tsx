import { ThemeProvider } from './context/ThemeContext'
import AppLayout from './components/layout/AppLayout'

function App() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  )
}

export default App
