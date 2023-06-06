import React from 'react'
import { useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  return (
    <>
      {/* <!-- Sidebar --> */}
      <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

        {/* <!-- Sidebar - Brand --> */}
        <a className="sidebar-brand d-flex align-items-center justify-content-center" href="/dashboard">
          <div className="sidebar-brand-icon rotate-n-15">
            <i className="fas fa-laugh-wink"></i>
          </div>
          <div className="sidebar-brand-text mx-3">1-Tap Admin</div>
        </a>

        {/* <!-- Divider --> */}
        <hr className="sidebar-divider my-0" />

        {/* <!-- Nav Item - Dashboard --> */}
        <li className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <a className="nav-link" id="dashboard-atag" href="/dashboard">
            <i className="fas fa-fw fa-tachometer-alt"></i>
            <span className='xl'>Dashboard</span></a>
        </li>

        {/* <!-- Divider --> */}
        <hr className="sidebar-divider" />

        {/* <!-- Heading --> */}
        <div className="sidebar-heading">
          Resources
        </div>

        {/* <!-- Nav Item - Tables --> */}
        <li className={`nav-item ${location.pathname === '/transactions' ? 'active' : ''}`}>
          <a className="nav-link" href="/transactions">
            <i className="fas fa-fw fa-table"></i>
            <span>Transactions</span>
          </a>
        </li>

        {/* <!-- Divider --> */}
        <hr className="sidebar-divider d-none d-md-block" />

        {/* <!-- Sidebar Toggler (Sidebar) --> */}
        <div className="text-center d-none d-md-inline">
          <button className="rounded-circle border-0" id="sidebarToggle"></button>
        </div>
      </ul>
    </>
  )
}

export default Sidebar