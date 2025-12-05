import { Avatar, Badge, Button, Dropdown, DropdownHeader, Modal, Navbar, NavbarToggle, TextInput } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
// import { IoLanguage } from "react-icons/io5"
import { useSelector, useDispatch } from "react-redux"
import { toggleTheme } from '../redux/theme/themeSlice'
import { toggleLanguage } from '../redux/page_Language/languageSlice';
import { signoutSuccess } from "../redux/user/userSlice";
import { HiOutlineExclamationCircle } from 'react-icons/hi'
import en from "../assets/lang_Icons/en.png";
import tr from "../assets/lang_Icons/tr.png";
import { useTranslation } from "react-i18next";
import { AnimatedThemeToggler } from './ui/animated-theme-toggler';
//import '../i18n.jsx';


export default function Header() {

    /*     const { t, i18n } = useTranslation()
        const changeLanguage = (lng) => {
            i18n.changeLanguage(lng);
            console.log(lng);
        } */

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const path = useLocation().pathname;
    const { currentUser } = useSelector(state => state.user);
    const { theme } = useSelector((state) => state.theme);
    const [showSignout, setShowSignout] = useState(false);
    const { language } = useSelector((state) => state.language);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const [showSearchbar, setShowSearchbar] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);


    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const term = urlParams.get('searchTerm') || '';
        setSearchTerm(term);
    }, [location.search]);

    const handleSignout = async () => {
        try {
            const res = await fetch('/api/user/signout', {
                method: 'POST',
            });
            const data = await res.json();
            if (!res.ok) {
                console.log(data.message);
            } else {
                dispatch(signoutSuccess());
                setShowSignout(false);
                navigate('/');
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.set('searchTerm', searchTerm);
        params.set('order', 'desc');
        navigate(`/explore?${params.toString()}`, { replace: true });
        setShowSearchbar(false);
    };

    return (
        <div className={`sticky top-0 z-[9998] transition-all duration-300 ${isScrolled ? 'backdrop-blur-3xl bg-white/5 dark:bg-[rgb(22,26,29)]/5 shadow-md' : ''} ${path.startsWith('/qr-order') ? 'hidden' : ''}`}>
            <Navbar className={`transition-all duration-300 ${isScrolled ? 'bg-white/70 dark:bg-[rgb(22,26,29)]/70 dark:shadow-2xl' : 'dark:bg-[rgb(22,26,29)]'}`} >
                <Link to="/" className='self-center whitespace-nowrap text-xl sm:text-2xl font-semibold dark:text-white focus:outline-none focus:ring-0 font-brand' onClick={() => { setSearchTerm(''); setIsOpen(false); }}>
                    <span className='pl-1.5 pr-0.5 mr-0.5 py-1 bg-gradient-to-r from-blue-500 via-teal-400 to-cyan-400 rounded-lg text-white'>Tour</span>
                    <span className=''>wise</span>
                </Link>
                {!path.startsWith('/explore') && (
                    <>
                        <form onSubmit={handleSearch}>
                            <TextInput
                                type='text'
                                placeholder='Search...'
                                rightIcon={AiOutlineSearch}
                                className='hidden lg:inline'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                        <Button className='w-13 h-11 lg:hidden' color='gray' pill onClick={() => setShowSearchbar(!showSearchbar)}>
                            <AiOutlineSearch className='w-4 h-6' />
                        </Button>
                        <div className="inline lg:hidden">
                            <Modal show={showSearchbar} onClose={() => setShowSearchbar(false)} popup size='md' className='flex lg:hidden'>
                                <Modal.Header />
                                <Modal.Body className='m-2 mt-0 p-1'>
                                    <form onSubmit={handleSearch}>
                                        <TextInput
                                            type='text'
                                            placeholder='Search...'
                                            rightIcon={AiOutlineSearch}
                                            className='inline lg:hidden'
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </form>
                                </Modal.Body>
                            </Modal>
                        </div>
                    </>
                )}

                <div className='flex gap-1 md:order-2'>

                    {/*                     <Button className='w-13 h-11  hidden sm:inline' color='gray' pill onClick={() => dispatch(toggleLanguage())}>
                        {language === 'en' ?
                            <div className='flex justify-center items-center'><img src={en} alt="" className='w-4 h-4' /></div>
                            :
                            <div className='flex justify-center items-center'><img src={tr} alt="" className='w-4 h-4' /></div>}
                    </Button>

                    <Button className='w-13 h-11  hidden sm:inline' color='gray' pill onClick={() => dispatch(toggleTheme())}  >
                        {theme === 'light' ? <FaSun /> : <FaMoon />}
                    </Button>
 */}
                    <AnimatedThemeToggler className='w-13 h-11 mx-4 p-2 hidden sm:inline' />

                    {currentUser ? (
                        <Dropdown className='z-50' arrowIcon={false} inline label={<Avatar alt='user' img={currentUser.profilePicture} rounded className='bg-gray-50 rounded-full' />}>
                            <DropdownHeader>
                                {currentUser.isAdmin && (
                                    <Badge color='failure' size='xs' className='cursor-default'>Admin User</Badge>
                                )}
                                <span className='block text-sm'>@{currentUser.username}</span>
                                <span className='block text-sm font-medium truncate'>{currentUser.email}</span>
                            </DropdownHeader>
                            {currentUser.isAdmin && (
                                <div>
                                    <Link to={'/dashboard?tab=dashboard'}>
                                        <Dropdown.Item>Dashboard</Dropdown.Item>
                                    </Link>
                                    <Dropdown.Divider />
                                </div>
                            )}
                            <Link to={`/user/${currentUser.username}`}>
                                <Dropdown.Item>Profile</Dropdown.Item>
                            </Link>
                            {!currentUser.isAdmin && (
                                <>
                                    <Link to={'/my-routes'}>
                                        <Dropdown.Item>Your Routes</Dropdown.Item>
                                    </Link>
                                    <Link to={'/my-itineraries'}>
                                        <Dropdown.Item>Your Itineraries</Dropdown.Item>
                                    </Link>
                                </>
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={() => setShowSignout(true)}>Sign Out</Dropdown.Item>
                        </Dropdown>
                    ) : (
                        <Link to="/sign-in">
                            <Button gradientDuoTone='greenToBlue' outline>Sign In</Button>
                        </Link>
                    )
                    }
                    <NavbarToggle />
                </div >

                <Navbar.Collapse>
                    <Navbar.Link active={path === "/"} as={'div'}>
                        <Link to='/' onClick={() => setSearchTerm('')}>
                            Home
                        </Link>
                    </Navbar.Link>
                    <Navbar.Link active={path === "/explore"} as={'div'}>
                        <Link to='/explore' onClick={() => setSearchTerm('')}>
                            Explore Routes
                        </Link>
                    </Navbar.Link>
                    <Navbar.Link active={path === "/about" || path === "/contact"} as={'div'}>
                        <div onClick={(e) => e.stopPropagation()}>
                            <Dropdown label="About" className='z-50' inline>
                                <Dropdown.Item className={path === "/about" ? 'dark:bg-slate-600 bg-gray-100' : ''}>
                                    <Link to='/about' onClick={() => { setSearchTerm(''); }}>
                                        About Us
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item className={path === "/contact" ? 'dark:bg-slate-600 bg-gray-100' : ''}>
                                    <Link to='/contact' onClick={() => { setSearchTerm(''); }}>
                                        Contact Us
                                    </Link>
                                </Dropdown.Item>
                            </Dropdown>
                        </div>
                    </Navbar.Link>
                    <div className='flex justify-center sm:hidden'>
                        {/*                         <Navbar.Link as={'div'}>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Dropdown label="Language" className='rounded-full z-50' inline>
                                    <Button className='w-13 h-11 justify-center items-center mx-1' color='gray' pill onClick={() => dispatch(toggleLanguage())}>
                                        {language === 'en' ?
                                            <div className='flex justify-center items-center'><img src={en} alt="" className='w-4 h-4' /></div>
                                            :
                                            <div className='flex justify-center items-center'><img src={tr} alt="" className='w-4 h-4' /></div>}
                                    </Button>
                                </Dropdown>
                            </div>
                        </Navbar.Link>
 */}
                        {/*                         <Navbar.Link as={'div'}>
 */}                            <div onClick={(e) => e.stopPropagation()}>
                            {/*                                 <Dropdown label="Theme" className='rounded-full z-50' inline>
                                    <Button className='w-13 h-11 justify-center items-center mx-1' color='gray' pill onClick={() => dispatch(toggleTheme())}>
                                        {theme === 'light' ? <FaSun /> : <FaMoon />}
                                    </Button>
                                </Dropdown>
 */}

                            <AnimatedThemeToggler className='w-13 h-11' />
                        </div>
                        {/*                         </Navbar.Link>
 */}                    </div>
                </Navbar.Collapse>
            </Navbar >

            <Modal show={showSignout} onClose={() => setShowSignout(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to sign out?</h3>
                        <div className='flex justify-center gap-6'>
                            <Link to={'/'}>
                                <Button color='warning' onClick={handleSignout}>Yes, sign out</Button>
                            </Link>
                            <Button color='gray' onClick={() => setShowSignout(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div >
    )
}
