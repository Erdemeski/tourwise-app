import { BrowserRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MyRoutesPage from './pages/MyRoutesPage.jsx';
import MyItinerariesPage from './pages/MyItinerariesPage.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import OnlyAdminPrivateRoute from './components/OnlyAdminPrivateRoute.jsx';
import CreateRoute from './pages/CreateRoute.jsx';
import EditRoute from './pages/EditRoute.jsx';
import RouteDetailsPage from './pages/RouteDetailsPage.jsx';
import NotFound from './pages/NotFound.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import ContantUs from './pages/ContactUs.jsx';
import ExploreRoutes from './pages/ExploreRoutes.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContantUs />} />
        <Route path="/explore" element={<ExploreRoutes />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        <Route element={<OnlyAdminPrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/my-itineraries" element={<MyItinerariesPage />} />
          <Route path="/my-routes" element={<MyRoutesPage />} />
          <Route path="/routes/create" element={<CreateRoute />} />
          <Route path="/routes/:routeId/edit" element={<EditRoute />} />
        </Route>

        <Route path="/routes/:slug" element={<RouteDetailsPage />} />


      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
