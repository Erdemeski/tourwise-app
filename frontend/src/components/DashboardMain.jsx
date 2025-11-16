import React, { useEffect, useState } from 'react';
import { Card, Spinner, Table, Badge, Button } from 'flowbite-react';
import { Link } from 'react-router-dom';

export default function DashboardMain() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [itineraries, setItineraries] = useState([]);
    const [comments, setComments] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRoutes: 0,
        totalItineraries: 0,
        totalComments: 0,
        lastMonthRoutes: 0,
        lastMonthItineraries: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [usersRes, routesRes, itinerariesRes, commentsRes] = await Promise.all([
                    fetch('/api/user/getusers?limit=5', { credentials: 'include' }),
                    fetch('/api/routes?limit=5&order=desc', { credentials: 'include' }),
                    fetch('/api/itineraries?limit=5&order=desc', { credentials: 'include' }),
                    fetch('/api/comment/all?limit=5&sort=desc', { credentials: 'include' }),
                ]);

                const [usersData, routesData, itinerariesData, commentsData] = await Promise.all([
                    usersRes.json(),
                    routesRes.json(),
                    itinerariesRes.json(),
                    commentsRes.json(),
                ]);

                if (usersRes.ok) {
                    setUsers(usersData.users || []);
                    setStats((prev) => ({ ...prev, totalUsers: usersData.totalUsers || 0 }));
                }
                if (routesRes.ok) {
                    setRoutes(routesData.routes || []);
                    setStats((prev) => ({
                        ...prev,
                        totalRoutes: routesData.totalRoutes || 0,
                        lastMonthRoutes: routesData.lastMonthRoutes || 0,
                    }));
                }
                if (itinerariesRes.ok) {
                    setItineraries(itinerariesData.itineraries || []);
                    setStats((prev) => ({
                        ...prev,
                        totalItineraries: itinerariesData.totalItineraries || 0,
                        lastMonthItineraries: itinerariesData.lastMonthItineraries || 0,
                    }));
                }
                if (commentsRes.ok) {
                    setComments(commentsData.comments || []);
                    setStats((prev) => ({ ...prev, totalComments: commentsData.totalComments || 0 }));
                }
            } catch (error) {
                console.log(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className='flex p-5 justify-center pb-96 items-center md:items-baseline min-h-screen'>
                <Spinner size='xl' />
                <p className='text-center text-gray-500 m-2'>Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen relative isolate bg-white dark:bg-[rgb(22,26,29)] px-6 py-6 sm:py-10 lg:px-8">
            <div className='flex flex-wrap gap-4 justify-center mb-8'>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Users</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.totalUsers}</p>
                </Card>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Routes</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.totalRoutes}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>+{stats.lastMonthRoutes} last month</p>
                </Card>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Itineraries</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.totalItineraries}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>+{stats.lastMonthItineraries} last month</p>
                </Card>
                <Card className='min-w-52 bg-white dark:bg-slate-800 shadow-md'>
                    <h3 className='text-sm text-gray-500 uppercase'>Comments</h3>
                    <p className='text-3xl font-bold text-gray-900 dark:text-white'>{stats.totalComments}</p>
                </Card>
            </div>

            <div className='grid gap-6 xl:grid-cols-2'>
                <Card className='shadow-md'>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>Newest Routes</h2>
                        <Link to='/dashboard?tab=routes'>
                            <Button color='light' size='xs'>See all</Button>
                        </Link>
                    </div>
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>Title</Table.HeadCell>
                            <Table.HeadCell>Owner</Table.HeadCell>
                            <Table.HeadCell>Visibility</Table.HeadCell>
                        </Table.Head>
                        {routes.map((route) => (
                            <Table.Body key={route._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell className='max-w-xs line-clamp-2'>
                                        <Link to={`/routes/${route.slug}`} className='text-teal-600 hover:underline'>
                                            {route.title}
                                        </Link>
                                    </Table.Cell>
                                    <Table.Cell>{route.userId}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color={route.visibility === 'public' ? 'success' : 'gray'}>
                                            {route.visibility}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        ))}
                    </Table>
                </Card>

                <Card className='shadow-md'>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>Shared Itineraries</h2>
                        <Link to='/dashboard?tab=moderation'>
                            <Button color='light' size='xs'>Moderate</Button>
                        </Link>
                    </div>
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>Title</Table.HeadCell>
                            <Table.HeadCell>Owner</Table.HeadCell>
                            <Table.HeadCell>Visibility</Table.HeadCell>
                        </Table.Head>
                        {itineraries.map((item) => (
                            <Table.Body key={item._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell className='max-w-xs line-clamp-2'>
                                        {item.title}
                                    </Table.Cell>
                                    <Table.Cell>{item.userId}</Table.Cell>
                                    <Table.Cell>
                                        <Badge color={item.visibility === 'shared' ? 'success' : 'gray'}>
                                            {item.visibility}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        ))}
                    </Table>
                </Card>

                <Card className='shadow-md'>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>Recent Comments</h2>
                        <Link to='/dashboard?tab=comments'>
                            <Button color='light' size='xs'>Review</Button>
                        </Link>
                    </div>
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>Content</Table.HeadCell>
                            <Table.HeadCell>User</Table.HeadCell>
                        </Table.Head>
                        {comments.map((comment) => (
                            <Table.Body key={comment._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell className='line-clamp-2 max-w-md'>{comment.content}</Table.Cell>
                                    <Table.Cell>{comment.userId}</Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        ))}
                    </Table>
                </Card>

                <Card className='shadow-md'>
                    <div className='flex items-center justify-between mb-2'>
                        <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-100'>Newest Members</h2>
                        <Link to='/dashboard?tab=users'>
                            <Button color='light' size='xs'>Manage users</Button>
                        </Link>
                    </div>
                    <Table hoverable>
                        <Table.Head>
                            <Table.HeadCell>User</Table.HeadCell>
                            <Table.HeadCell>Email</Table.HeadCell>
                        </Table.Head>
                        {users.map((user) => (
                            <Table.Body key={user._id} className='divide-y'>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell>@{user.username}</Table.Cell>
                                    <Table.Cell>{user.email}</Table.Cell>
                                </Table.Row>
                            </Table.Body>
                        ))}
                    </Table>
                </Card>
            </div>
        </div>
    );
}

