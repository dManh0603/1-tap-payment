import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Homepage from './pages/Homepage';
import Transactions from './pages/Transactions';
import TransactionDetails from './pages/TransactionDetails';
import Chats from './pages/Chats';
import Sidebar from './components/miscellaneous/Sidebar';
import Topbar from './components/miscellaneous/Topbar';
import { UserState } from './contexts/UserProvider';
import { useEffect, useState } from 'react';
import io from 'socket.io-client'
import { ChatState } from './contexts/ChatProvider';
import axios from 'axios'
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Activities from './pages/Activities';
import Configuration from './pages/Configuration';

const ENDPOINT = 'http://localhost:4000';

let socket, selectedChatCompare;
socket = io(ENDPOINT);

function App() {
  const { user } = UserState();
  const [socketConennected, setSocketConennected] = useState(false)
  const { notification, setNotification } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const storedToken = localStorage.getItem('userToken');

  useEffect(() => {
    const fetchUnseenChats = async () => {
      const config = {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      }
      try {
        const { data } = await axios.get('/api/chat/unseen', config)
        console.log('unseen chat', data);
        setNotification([...data, ...notification]);
      } catch (error) {
        console.log(error);
      }
    }
    if (!storedToken) return;
    fetchUnseenChats();
  }, [])

  useEffect(() => {
    console.log(user)
    if (user) {
      console.log('app setup');
      socket.emit('setup', user);
      socket.on('connected', () => setSocketConennected(true));
    }
  }, [user])

  useEffect(() => {
    if (!socketConennected) return;
    socket.on('message received', (newMessage) => {
      console.log('message received')
      if (!selectedChatCompare || selectedChatCompare._id !== newMessage.chat._id) {
        if (!notification.includes(newMessage)) {
          setNotification([newMessage, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      }
    })
  }, [socketConennected])

  return (
    <div className="App" id='wrapper'>
      {user && <Sidebar />}
      <div id="content-wrapper" className='d-flex flex-column'>
        {user && <Topbar />}
        <Routes>
          <Route path="/" Component={Homepage}></Route>
          <Route path="/dashboard" Component={Dashboard}></Route>
          <Route path="/transactions" Component={Transactions}></Route>
          <Route path="/transaction/:id" Component={TransactionDetails}></Route>
          <Route path="/chats" Component={Chats}></Route>
          <Route path="/users" Component={Users}></Route>
          <Route path="/user/:id" Component={UserDetails}></Route>
          <Route path="/activities" Component={Activities}></Route>
          <Route path="/config" Component={Configuration}></Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;
