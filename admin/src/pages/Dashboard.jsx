import React, { useEffect } from 'react'
import DashboardContent from '../components/DashboardContent'
import Sidebar from '../components/Sidebar'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'

const Dashboard = () => {
  const navigate = useNavigate();
  const storedToken = localStorage.getItem('userToken');

  useEffect(() => {
    if (!storedToken) return navigate('/');
  }, [])
  return (
    <>
      <Sidebar />
      <div id="content-wrapper" className='d-flex flex-column'>
        <Topbar />
        <DashboardContent />
      </div>
    </>
  )
}

export default Dashboard