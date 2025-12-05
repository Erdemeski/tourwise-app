import React, { useEffect, useState } from 'react'
import { Button, Modal, Sidebar } from 'flowbite-react'
import { HiAnnotation, HiArrowSmRight, HiChartPie, HiOutlineUserGroup, HiUser } from 'react-icons/hi'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signoutSuccess } from "../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { MdOutlineRoute } from "react-icons/md";
import { RiDraftLine } from "react-icons/ri";
import { IoIosMail } from "react-icons/io";
import { MdOutlineSettings } from "react-icons/md";

export default function DashSidebar() {

    const location = useLocation();
    const [tab, setTab] = useState('')
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search)
        const tabFromUrl = urlParams.get('tab')
        if (tabFromUrl) {
            setTab(tabFromUrl);
        }
    }, [location.search]);

    const dispatch = useDispatch();
    const [showSignout, setShowSignout] = useState(false);
    const { currentUser } = useSelector(state => state.user);
    const navigate = useNavigate();

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
                navigate('/');
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        <div className='h-full'>
            <Sidebar
                className='w-full md:w-56 h-full'
                theme={{
                    root: {
                        inner: "h-full overflow-y-auto overflow-x-hidden rounded bg-gray-50 px-3 py-4 dark:bg-[rgb(32,38,43)] dark:border-b-2 dark:border-gray-700"
                    },
                    item: {
                        base: "flex items-center justify-center rounded-lg p-2 text-sm font-normal text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
                        active: "bg-gray-100 dark:bg-gray-700",
                        content: {
                            base: "flex-1 whitespace-nowrap pl-3"
                        },
                    },
                    itemGroup: {
                        base: "mt-2 space-y-2 border-t border-gray-200 pt-2 first:mt-0 first:border-t-0 first:pt-0 dark:border-gray-700"
                    }
                }}
            >
                <Sidebar.Items>
                    <Sidebar.ItemGroup className='flex flex-col gap-1'>
                        {currentUser && currentUser.isAdmin && (
                            <Link to='/dashboard?tab=dashboard'>
                                <Sidebar.Item active={tab === 'dashboard' || !tab} icon={HiChartPie} as='div'>Dashboard</Sidebar.Item>
                            </Link>
                        )}
                        <Link to={`/user/${currentUser.username}`}>
                            <Sidebar.Item active={tab === 'profile'} icon={HiUser} label={currentUser.isAdmin ? 'Admin' : 'User'} labelColor={currentUser.isAdmin ? 'red' : 'dark'} as='div'>Profile</Sidebar.Item>
                        </Link>
                        <Link to='/dashboard?tab=my-routes'>
                            <Sidebar.Item active={tab === 'my-routes' || (!tab && !currentUser.isAdmin)} icon={MdOutlineRoute} as='div'>My Routes</Sidebar.Item>
                        </Link>
                        {!currentUser.isAdmin && (
                            <Link to='/dashboard?tab=my-itineraries'>
                                <Sidebar.Item active={tab === 'my-itineraries'} icon={RiDraftLine} as='div'>My Itineraries</Sidebar.Item>
                            </Link>
                        )}
                        {currentUser.isAdmin && (
                            <Link to='/dashboard?tab=settings'>
                                <Sidebar.Item active={tab === 'settings'} icon={MdOutlineSettings} as='div'>Settings</Sidebar.Item>
                            </Link>
                        )}

                    </Sidebar.ItemGroup>
                    {currentUser.isAdmin && (
                        <>
                            <Sidebar.ItemGroup className='flex flex-col gap-1'>
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=routes'>
                                        <Sidebar.Item active={tab === 'routes'} icon={MdOutlineRoute} as='div'>Routes</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=users'>
                                        <Sidebar.Item active={tab === 'users'} icon={HiOutlineUserGroup} as='div'>Users</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=comments'>
                                        <Sidebar.Item active={tab === 'comments'} icon={HiAnnotation} as='div'>Comments</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=moderation'>
                                        <Sidebar.Item active={tab === 'moderation'} icon={RiDraftLine} as='div'>Itinerary moderation</Sidebar.Item>
                                    </Link>
                                )}
                                {currentUser.isAdmin && (
                                    <Link to='/dashboard?tab=feedbacks'>
                                        <Sidebar.Item active={tab === 'feedbacks'} icon={IoIosMail} as='div'>Feedbacks</Sidebar.Item>
                                    </Link>
                                )}
                            </Sidebar.ItemGroup>
                        </>
                    )}
                    <Sidebar.ItemGroup className='flex flex-col gap-1'>
                        <Sidebar.Item icon={HiArrowSmRight} className='cursor-pointer' onClick={() => setShowSignout(true)}>Sign Out</Sidebar.Item>
                    </Sidebar.ItemGroup>
                </Sidebar.Items>
            </Sidebar>

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
