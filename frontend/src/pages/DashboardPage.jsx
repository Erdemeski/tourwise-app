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
import ProfileShowcase from '../components/ProfileShowcase';
import { Modal } from 'flowbite-react';

export default function DashboardPage() {

  const { currentUser } = useSelector((state) => state.user)
  const location = useLocation();
  const [tab, setTab] = useState('')
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      navigate(`/user/${currentUser?.username || ''}`);
      return;
    }
    // Check if we're on a direct URL route
    if (location.pathname === '/my-itineraries') {
      setTab('my-itineraries');
      return;
    }
    if (location.pathname === '/my-routes') {
      setTab('my-routes');
      return;
    }

    // Otherwise check query params
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
  }, [location.pathname, location.search, currentUser.isAdmin, navigate]);

  const renderTabContent = () => {
    if (!currentUser.isAdmin && (tab === 'my-routes' || !tab)) return <DashRoutes />;
    if (!currentUser.isAdmin && tab === 'my-itineraries') return <DashItineraries />;
    if (tab === 'profile') {
      return <div className='flex-1'>
        <div className='p-4 sm:p-8 w-full'>
          <ProfileShowcase /* onEditProfile={() => setShowProfileEditor(true)} */ />
        </div>
      </div>
    };
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
      <Modal show={showProfileEditor} size='5xl' onClose={() => setShowProfileEditor(false)}>
        <Modal.Header>Profili Güncelle</Modal.Header>
        <Modal.Body className='max-h-[80vh] overflow-y-auto'>
          <DashProfile />
        </Modal.Body>
      </Modal>
    </div>
  )
}
