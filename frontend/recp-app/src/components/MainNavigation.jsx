import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './navbar'
import Footer from './Footer'
function MainNavigation() {
  return (
   <>
<Navbar></Navbar>
<Outlet></Outlet>
<Footer></Footer>
   </>
  )
}

export default MainNavigation