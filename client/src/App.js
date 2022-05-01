import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home/Home';
import Room from './pages/Room/Room'

function App() {
  return (
    < BrowserRouter >
      <Routes>
        <Route path='/' element={<Home />} exact />
        <Route path="room/:roomID" element={<Room />} />
      </Routes>
    </BrowserRouter >
  );
}

export default App;
