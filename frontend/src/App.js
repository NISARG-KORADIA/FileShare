import './App.css';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import Home from './pages/Home/Home';
import Room from './pages/Room/Room'

function App() {
  return (
    < BrowserRouter >
      <Switch>
        <Route path='/' component={Home} exact />
        <Route path='/room/:roomID' component={Room} />
      </Switch>
    </BrowserRouter >
  );
}

export default App;
