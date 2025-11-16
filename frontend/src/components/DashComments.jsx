import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Modal, Spinner, Table } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function DashComments() {
    const { currentUser } = useSelector((state) => state.user);
    const [comments, setComments] = useState([]);
    const [routes, setRoutes] = useState({});
    const [users, setUsers] = useState({});
    const [showMore, setShowMore] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [commentIdToDelete, setCommentIdToDelete] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [commentsRes, routesRes, usersRes] = await Promise.all([
                    fetch('/api/comment/all', { credentials: 'include' }),
                    fetch('/api/routes?limit=100', { credentials: 'include' }),
                    fetch('/api/user/getusers', { credentials: 'include' }),
                ]);

                const [commentsData, routesData, usersData] = await Promise.all([
                    commentsRes.json(),
                    routesRes.json(),
                    usersRes.json(),
                ]);

                if (commentsRes.ok) {
                    setComments(commentsData.comments);
                    setShowMore(commentsData.totalComments > commentsData.comments.length);
                }

                if (routesRes.ok) {
                    const routesMap = {};
                    (routesData.routes || []).forEach((route) => {
                        routesMap[route._id] = route;
                    });
                    setRoutes(routesMap);
                }

                if (usersRes.ok) {
                    const usersMap = {};
                    usersData.users.forEach(user => {
                        usersMap[user._id] = user;
                    });
                    setUsers(usersMap);
                }
            } catch (error) {
                console.log(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser.isAdmin) {
            fetchData();
        }
    }, [currentUser._id]);

    const handleShowMore = async () => {
        const startIndex = comments.length;
        try {
            const res = await fetch(`/api/comment/all?startIndex=${startIndex}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setComments((prev) => [...prev, ...data.comments]);
                /*                 if (data.contacts.length < 7) {
                                    setShowMore(false);
                                } */
                setShowMore(data.totalComments > comments.length + data.comments.length);

            }
        } catch (error) {
            console.log(error.message);
        }
    }

    const handleDeleteComment = async () => {
        try {
            const res = await fetch(`/api/comment/${commentIdToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                setComments((prev) => prev.filter((comment) => comment._id !== commentIdToDelete));
                setShowModal(false);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    if (loading) return (
        <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
            <Spinner size='xl' />
            <p className='text-center text-gray-500 m-2'>Loading...</p>
        </div>
    );

    return (
        <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
            {currentUser.isAdmin && comments.length > 0 ? (
                <>
                    <Table hoverable className='shadow-md'>
                        <Table.Head>
                            <Table.HeadCell>Date Updated</Table.HeadCell>
                            <Table.HeadCell>Comment</Table.HeadCell>
                            <Table.HeadCell>Likes</Table.HeadCell>
                            <Table.HeadCell>Route</Table.HeadCell>
                            <Table.HeadCell>User</Table.HeadCell>
                            <Table.HeadCell>Delete</Table.HeadCell>
                        </Table.Head>
                        {comments.map((comment) => (
                            <Table.Body key={comment._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell>
                                        {new Date(comment.updatedAt).toLocaleDateString()} {new Date(comment.updatedAt).toLocaleTimeString()}
                                    </Table.Cell>
                                    <Table.Cell className='min-w-[200px]'>{comment.content}</Table.Cell>
                                    <Table.Cell>{comment.numberOfLikes}</Table.Cell>
                                    <Table.Cell>
                                        {routes[comment.routeId] ? (
                                            <Link to={`/routes/${routes[comment.routeId].slug}`} className='text-teal-600 hover:underline'>
                                                {routes[comment.routeId].title}
                                            </Link>
                                        ) : (
                                            <span className='text-gray-400'>{comment.routeId}</span>
                                        )}
                                    </Table.Cell>

                                    <Table.Cell>
                                        {users[comment.userId] ? (
                                            <>
                                                <div className='flex flex-row gap-4 items-center'>
                                                    <img src={users[comment.userId].profilePicture} alt='User' className='w-10 h-10 object-cover rounded-full bg-gray-100' />
                                                    <span className='text-gray-400'>{users[comment.userId].username}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className='text-gray-400'>{comment.userId}</span>
                                        )}
                                    </Table.Cell>

                                    <Table.Cell>
                                        <span onClick={() => {
                                            setShowModal(true);
                                            setCommentIdToDelete(comment._id);
                                        }} className='font-medium text-red-500 hover:underline cursor-pointer'>Delete</span>
                                    </Table.Cell>
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
            ) : (<p>There is no comment yet!</p>)}

            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this comment?</h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={handleDeleteComment}>Yes, I'm sure</Button>
                            <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
