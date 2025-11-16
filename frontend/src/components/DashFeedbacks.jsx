import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Button, Modal, Spinner, Table } from 'flowbite-react'
import { HiArrowNarrowUp, HiOutlineExclamationCircle, HiOutlineUserGroup } from 'react-icons/hi'
import { FaCheck, FaTimes } from "react-icons/fa";
import { HiMiniArrowSmallRight } from 'react-icons/hi2';
import { IoIosMail } from 'react-icons/io';

export default function DashFeedbacks() {

    const { currentUser } = useSelector((state) => state.user)
    const [feedbacks, setFeedbacks] = useState([])
    const [showMore, setShowMore] = useState(true);
    /*
    const [showModal, setShowModal] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState('');
     */
    const [loading, setLoading] = useState(true);
    const [totalFeedback, setTotalFeedback] = useState(0)
    const [lastMonthFeedbacks, setLastMonthFeedbacks] = useState(0);



    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const res = await fetch('/api/contact/getContacts')
                const data = await res.json()
                if (res.ok) {
                    setLoading(false);
                    setFeedbacks(data.contacts);
                    setTotalFeedback(data.totalContacts);
                    setLastMonthFeedbacks(data.lastMonthContacts);
                    /*                     if (data.contacts.length < 7) {
                                            setShowMore(false);
                                        } */
                    setShowMore(data.totalContacts > data.contacts.length);
                }

            } catch (error) {
                setLoading(true);
                console.log(error.message)
            }
        };
        if (currentUser.isAdmin) {
            fetchFeedbacks();

        }
    }, [currentUser._id])


    const handleShowMore = async () => {
        const startIndex = feedbacks.length;
        try {
            const res = await fetch(`/api/contact/getContacts?startIndex=${startIndex}`);
            const data = await res.json();
            if (res.ok) {
                setFeedbacks((prev) => [...prev, ...data.contacts]);
                /*                 if (data.contacts.length < 7) {
                                    setShowMore(false);
                                } */
                setShowMore(totalFeedback > feedbacks.length + data.contacts.length);
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    /*     const handleDeleteUser = async () => {
            try {
                const res = await fetch(`/api/user/delete/${userIdToDelete}`, {
                    method: 'DELETE',
                });
                const data = await res.json();
                if (res.ok) {
                    setUsers((prev) => prev.filter((user) => user._id !== userIdToDelete));
                    setShowModal(false);
                }
                else {
                    console.log(data.message);
                }
            } catch (error) {
                console.log(error.message);
            }
        };
     */
    if (loading) return (
        <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
            <Spinner size='xl' />
            <p className='text-center text-gray-500 m-2'>Loading...</p>
        </div>
    );

    return (
        <div className='flex flex-col gap-3 md:mx-auto pt-3 overflow-x-scroll p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>

            <div className='flex flex-wrap justify-center md:justify-between'>
                <div className='flex flex-col p-3 dark:bg-slate-800 gap-4 md:w-72 w-full rounded-md shadow-md'>
                    <div className='flex justify-between'>
                        <div>
                            <h3 className='text-gray-500 text-md uppercase'>Total Feedbacks</h3>
                            <p className='text-2xl'>{totalFeedback}</p>
                        </div>
                        <IoIosMail className='bg-red-700 text-white rounded-full text-5xl p-3 shadow-lg' />
                    </div>
                    <div className='flex gap-2 text-sm'>
                        <span className={`${lastMonthFeedbacks === 0 ? 'text-gray-500' : 'text-green-500'} flex items-center`}>
                            {lastMonthFeedbacks === 0 ? <HiMiniArrowSmallRight /> : <HiArrowNarrowUp />}
                            {lastMonthFeedbacks}
                        </span>
                        <div className='text-gray-500  dark:text-gray-400'>Last month</div>
                    </div>
                </div>
            </div>

            <div className='min-h-[86vh] table-auto'>
                {currentUser.isAdmin && feedbacks.length > 0 ? (
                    <>
                        <Table hoverable className='shadow-md'>
                            <Table.Head>
                                <Table.HeadCell>Date Sended</Table.HeadCell>
                                <Table.HeadCell>Name</Table.HeadCell>
                                <Table.HeadCell>Surname</Table.HeadCell>
                                <Table.HeadCell>Email</Table.HeadCell>
                                <Table.HeadCell>Phone Number</Table.HeadCell>
                                <Table.HeadCell>Message</Table.HeadCell>
                                {/*                             <Table.HeadCell>Delete</Table.HeadCell>
 */}
                            </Table.Head>
                            {feedbacks.map((feedback) => (
                                <Table.Body key={feedback._id} className='divide-y'>
                                    <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                        <Table.Cell>{new Date(feedback.createdAt).toLocaleDateString() + ' ' + new Date(feedback.createdAt).toLocaleTimeString()}</Table.Cell>
                                        <Table.Cell>
                                            {feedback.name}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {feedback.surname}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {feedback.email}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {feedback.phoneNumber}
                                        </Table.Cell>
                                        <Table.Cell className='min-w-[400px]'>
                                            {feedback.message}
                                        </Table.Cell>
                                        {/*                                     <Table.Cell>
                                        <span onClick={() => {
                                            setShowModal(true);
                                            setUserIdToDelete(user._id);
                                        }} className='font-medium text-red-500 hover:underline cursor-pointer'>Delete</span>
                                    </Table.Cell> */}
                                    </Table.Row>
                                </Table.Body>
                            ))}
                        </Table>
                        {showMore && (
                            <button onClick={handleShowMore} className='w-full text-teal-500 self-center text-sm py-7'>
                                Show more
                            </button>
                        )}
                    </>
                ) : (<p>There is no user yet!</p>)
                }


                {/*             <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this user?</h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={handleDeleteUser}>Yes, I'm sure</Button>
                            <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
 */}
            </div >
        </div>
    )
}
