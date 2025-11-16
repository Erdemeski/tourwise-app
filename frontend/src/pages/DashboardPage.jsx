import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashSidebar from '../components/DashSidebar';
import DashProfile from '../components/DashProfile';
import DashUsers from '../components/DashUsers';
import DashComments from '../components/DashComments';
import DashboardMain from '../components/DashboardMain';
import { useSelector } from 'react-redux';
import NotFound from './NotFound';
import DashFeedbacks from '../components/DashFeedbacks';
import DashSettings from '../components/DashSettings';
import DashRoutes from '../components/DashRoutes';
import DashItineraries from '../components/DashItineraries';
import DashItineraryModeration from '../components/DashItineraryModeration';

export default function DashboardPage() {

  const { currentUser } = useSelector((state) => state.user)
  const location = useLocation();
  const [tab, setTab] = useState('')
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabFromUrl = urlParams.get('tab')
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
    const allowedUserTabs = ['profile', 'my-routes', 'my-itineraries'];
    if (!currentUser.isAdmin && !allowedUserTabs.includes(tabFromUrl || 'my-routes')) {
      navigate(`/dashboard?tab=my-routes`);
      setTab('my-routes');
    }
  }, [location.search, currentUser.isAdmin, navigate]);

  const renderTabContent = () => {
    if (!currentUser.isAdmin && (tab === 'my-routes' || !tab)) return <DashRoutes />;
    if (!currentUser.isAdmin && tab === 'my-itineraries') return <DashItineraries />;
    if (tab === 'profile') return <DashProfile />;
    if (currentUser.isAdmin && tab === 'routes') return <DashRoutes />;
    if (currentUser.isAdmin && tab === 'users') return <DashUsers />;
    if (currentUser.isAdmin && tab === 'comments') return <DashComments />;
    if (currentUser.isAdmin && tab === 'dashboard') return <DashboardMain />;
    if (currentUser.isAdmin && tab === 'moderation') return <DashItineraryModeration />;
    if (currentUser.isAdmin && tab === 'feedbacks') return <DashFeedbacks />;
    if (currentUser.isAdmin && tab === 'settings') return <DashSettings />;
    return <NotFound />;
  }


  return (
    <div className='min-h-screen flex flex-col md:flex-row'>
      <div className='md:w-56 z-20'>
        <DashSidebar />
      </div>
      {renderTabContent()}
    </div>
  )
}
