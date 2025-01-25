import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Messages() {
    const [messageThreads, setMessageThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const getAuthData = () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            return null;
        }
        
        return { token, userId };
    };

    const handleAuthError = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login', { state: { from: '/messages' } });
    };

    const fetchMessages = useCallback(async () => {
        const auth = getAuthData();
        if (!auth) {
            handleAuthError();
            return;
        }

        try {
            setLoading(true);
            setError('');

            console.log('Fetching messages...');
            const response = await axios.get(
                'http://localhost:5001/api/messages',
                {
                    headers: { Authorization: `Bearer ${auth.token}` }
                }
            );

            console.log('Messages received:', response.data.length);

            // Group messages by property
            const groupedMessages = response.data.reduce((acc, message) => {
                if (!message.propertyId || !message.sender || !message.receiver) {
                    console.log('Skipping invalid message:', message);
                    return acc;
                }

                const propertyId = message.propertyId._id;
                const otherUser = message.sender._id === auth.userId ? message.receiver : message.sender;

                if (!acc[propertyId]) {
                    acc[propertyId] = {
                        property: message.propertyId,
                        otherUser,
                        lastMessage: message,
                        unreadCount: message.receiver._id === auth.userId && !message.read ? 1 : 0
                    };
                } else {
                    // Update unread count
                    if (message.receiver._id === auth.userId && !message.read) {
                        acc[propertyId].unreadCount++;
                    }
                    // Update last message if this one is more recent
                    if (new Date(message.createdAt) > new Date(acc[propertyId].lastMessage.createdAt)) {
                        acc[propertyId].lastMessage = message;
                    }
                }
                return acc;
            }, {});

            const threads = Object.values(groupedMessages);
            console.log('Grouped into threads:', threads.length);
            setMessageThreads(threads);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (error.response?.status === 401) {
                handleAuthError();
            } else {
                setError(error.response?.data?.message || 'Error loading messages. Please try again.');
                setLoading(false);
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const renderMessageThread = (thread) => {
        const isPropertyDeleted = !thread.property || !thread.property.title;
        
        return (
            <div
                key={thread.property?._id || thread.lastMessage._id}
                className={`block bg-white rounded-lg shadow-md transition-shadow ${
                    isPropertyDeleted ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                }`}
            >
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-semibold">
                            {isPropertyDeleted ? 'Property Deleted' : thread.property.title}
                        </h2>
                        {!isPropertyDeleted && thread.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                                {thread.unreadCount} new
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 mb-2">
                        Conversation with {thread.otherUser.email}
                    </p>
                    <div className="flex justify-between items-end">
                        <p className="text-gray-700">
                            {thread.lastMessage.content.length > 50
                                ? thread.lastMessage.content.substring(0, 50) + '...'
                                : thread.lastMessage.content}
                        </p>
                        <p className="text-sm text-gray-500">
                            {new Date(thread.lastMessage.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    {isPropertyDeleted && (
                        <p className="text-red-500 text-sm mt-2">
                            This property has been deleted
                        </p>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center bg-red-100 text-red-700 p-6 rounded-lg max-w-md">
                    <p className="mb-4">{error}</p>
                    <button 
                        onClick={fetchMessages}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Messages</h1>
                <button 
                    onClick={fetchMessages}
                    className="text-blue-600 hover:text-blue-800"
                >
                    Refresh
                </button>
            </div>
            {messageThreads.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                    No messages yet. Browse properties to start a conversation!
                </div>
            ) : (
                <div className="space-y-4">
                    {messageThreads.map(thread => {
                        const isPropertyDeleted = !thread.property || !thread.property.title;
                        
                        if (isPropertyDeleted) {
                            return renderMessageThread(thread);
                        }
                        
                        return (
                            <Link
                                key={thread.property._id}
                                to={`/messages/${thread.property._id}`}
                                className="block"
                            >
                                {renderMessageThread(thread)}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Messages; 