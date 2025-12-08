import { Alert, Button, Modal, Textarea } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export default function CommentSection({ routeId }) {
    const { currentUser } = useSelector((state) => state.user);
    const [comment, setComment] = useState('');
    const [commentError, setCommentError] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsCount, setCommentsCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchComments = async (page = 1) => {
        try {
            const res = await fetch(`/api/comment/route/${routeId}?page=${page}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments);
                setTotalPages(data.totalPages);
                setCommentsCount(data.totalComments);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    useEffect(() => {
        if (routeId) {
            fetchComments(currentPage);
        }
    }, [routeId, currentPage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (comment.trim() === '') {
            setCommentError('Comment cannot be empty.');
            return;
        }
        if (comment.length > 400) {
            setCommentError('Comment is too long.');
            return;
        }
        try {
            const res = await fetch('/api/comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: comment, routeId, userId: currentUser._id }),
            });
            const data = await res.json();
            if (res.ok) {
                setComment('');
                setCommentError(null);
                setComments((prev) => [data, ...prev]);
                setCommentsCount((prev) => prev + 1);
            } else {
                setCommentError(data.message || 'Unable to post comment.');
            }
        } catch (error) {
            setCommentError(error.message);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handleLike = async (commentId) => {
        try {
            if (!currentUser) {
                navigate('/sign-in');
                return;
            }
            const res = await fetch(`/api/comment/${commentId}/like`, {
                method: 'PUT',
            });
            if (res.ok) {
                const data = await res.json();
                setComments((prev) =>
                    prev.map((commentItem) =>
                        commentItem._id === commentId
                            ? {
                                ...commentItem,
                                likes: data.likes,
                                numberOfLikes: data.likes.length,
                            }
                            : commentItem
                    )
                );
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleEdit = (comment, editedContent) => {
        setComments((prev) =>
            prev.map((commentItem) =>
                commentItem._id === comment._id ? { ...commentItem, content: editedContent } : commentItem
            )
        );
    };

    const handleDelete = async (commentId) => {
        setShowModal(false);
        try {
            if (!currentUser) {
                navigate('/sign-in');
                return;
            }
            const res = await fetch(`/api/comment/${commentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setComments((prev) => prev.filter((commentItem) => commentItem._id !== commentId));
                setCommentsCount((prev) => Math.max(prev - 1, 0));
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    return (
        <div className='max-w-full mx-auto w-full'>
            {currentUser ? (
                <div className='flex items-center gap-1 text-gray-500 dark:text-gray-50 text-sm'>
                    <p>Signed in as:</p>
                    <img className='h-6 w-6 object-cover rounded-full' src={currentUser.profilePicture} alt={currentUser.username} />
                    <Link to={`/user/${currentUser.username}`} className='text-xs text-zinc-400 dark:text-zinc-300 hover:underline'>
                        @{currentUser.username}
                    </Link>
                </div>
            ) : (
                <div className='text-sm text-gray-500 flex gap-1'>
                    You must be signed in to comment.
                    <Link className='text-sky-600 dark:text-sky-400 hover:underline' to={'/sign-in'}>
                        Sign In
                    </Link>
                </div>
            )}
            {currentUser && (
                <form onSubmit={handleSubmit} className='my-2 p-3 bg-white dark:bg-[rgb(22,26,29)] rounded-md border border-gray-200 dark:border-[rgb(22,26,29)]'>
                    <Textarea
                        className='min-h-10 max-h-80 sm:max-h-40'
                        placeholder='Share your thoughts about this route...'
                        rows='3'
                        maxLength='400'
                        onChange={(e) => setComment(e.target.value)}
                        value={comment}
                    />
                    <div className='flex justify-between items-center mt-3'>
                        <p className='text-gray-500 dark:text-gray-400 text-xs'>{400 - comment.length} characters remaining</p>
                        <Button outline gradientDuoTone='purpleToBlue' type='submit' size='sm'>
                            Publish
                        </Button>
                    </div>
                    {commentError && <Alert color='failure' className='mt-5'>{commentError}</Alert>}
                </form>
            )}
            {commentsCount === 0 ? (
                <p className='text-sm flex justify-center mt-5 mb-2'>No comments yet!</p>
            ) : (
                <>
                    <div className='text-sm my-3 flex items-center justify-between gap-1 text-gray-500 dark:text-gray-50'>
                        <div className='flex border border-gray-200 py-0.5 px-2 rounded-md bg-white dark:bg-[rgb(22,26,29)] dark:border-gray-700 h-[46px] sm:h-[34px]'>
                            <p className='flex items-center text-center text-lg text-black dark:text-white'>
                                <span className='font-medium text-xl text-gray-700 dark:text-gray-300'>{commentsCount}</span>
                                <span className='mt-0.5 ml-2 text-sm font-medium text-gray-500 dark:text-gray-400'>Comments</span>
                            </p>
                        </div>
                    </div>

                    {comments.map((commentItem) => (
                        <Comment
                            key={commentItem._id}
                            comment={commentItem}
                            onLike={handleLike}
                            onEdit={handleEdit}
                            onDelete={(commentId) => {
                                setShowModal(true);
                                setCommentToDelete(commentId);
                            }}
                        />
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 pt-3 sm:px-6">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={handlePreviousPage}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center rounded-md border dark:bg-[rgb(22,26,29)] border-gray-300 dark:border-gray-600 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 dark:hover:border-gray-900'}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`relative ml-3 w-[88px] justify-center inline-flex items-center rounded-md border dark:bg-[rgb(22,26,29)] border-gray-300 dark:border-gray-600 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 dark:hover:border-gray-900'}`}
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between align-middle">
                                <p className="text-sm text-gray-700 dark:text-gray-400">
                                    Page <span className="font-medium dark:text-gray-300">{currentPage}</span> of <span className="font-medium dark:text-gray-300">{totalPages}</span>
                                </p>
                                <div className='flex'>
                                    <button
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 text-gray-500 dark:text-gray-300 ring-1 rounded-md ring-gray-200 dark:ring-gray-600 ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:text-black'}`}
                                    >
                                        <ChevronLeftIcon className="h-5 w-5" />
                                    </button>
                                    <div className='flex mx-0.5'>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => setCurrentPage(index + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium dark:text-gray-300 ${index + 1 === currentPage ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 dark:hover:text-black'}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center px-2 py-2 text-gray-500 dark:text-gray-300 ring-1 rounded-md ring-gray-200 dark:ring-gray-600 ${currentPage === totalPages ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 dark:hover:text-black'}`}
                                    >
                                        <ChevronRightIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <Modal className='z-[10000]' show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this comment?</h3>
                        <div className='flex justify-center gap-6'>
                            <Button color='failure' onClick={() => handleDelete(commentToDelete)}>Yes, I'm sure</Button>
                            <Button color='gray' onClick={() => setShowModal(false)}>Cancel</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
