import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function MessageThread() {
    const { propertyId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [property, setProperty] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const messagesEndRef = useRef(null);
    const [sending, setSending] = useState(false);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
        navigate('/login', { state: { from: `/messages/${propertyId}` } });
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

            const response = await axios.get(
                `http://localhost:5001/api/messages/property/${propertyId}`,
                {
                    headers: { Authorization: `Bearer ${auth.token}` }
                }
            );

            const { messages: messagesList, property: propertyData, otherUser: otherUserData } = response.data;
            
            setMessages(messagesList || []);
            setProperty(propertyData);
            setIsOwner(propertyData.isOwner);
            setOtherUser(otherUserData);

            // Find and mark unread messages
            const unreadMessages = messagesList.filter(
                message => message.receiver._id === auth.userId && !message.read
            );

            if (unreadMessages.length > 0) {
                await markMessagesAsRead(unreadMessages);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            if (error.response?.status === 401) {
                handleAuthError();
            } else {
                setError(error.response?.data?.message || 'Error loading conversation. Please try again.');
                setLoading(false);
            }
        }
    }, [propertyId, navigate]);

    const markMessagesAsRead = useCallback(async (unreadMessages) => {
        const auth = getAuthData();
        if (!auth) return;
        
        try {
            await Promise.all(
                unreadMessages.map(message =>
                    axios.patch(
                        `http://localhost:5001/api/messages/${message._id}/read`,
                        {},
                        { headers: { Authorization: `Bearer ${auth.token}` } }
                    )
                )
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const auth = getAuthData();
        if (!auth) {
            handleAuthError();
            return;
        }

        try {
            setSending(true);
            setError('');
            
            // Determine the receiver ID
            let receiverId;
            if (isOwner) {
                // If we're the owner, try to get receiver from messages if otherUser is not set
                if (otherUser) {
                    receiverId = otherUser._id;
                } else if (messages.length > 0) {
                    // Get the other user from the first message
                    const firstMessage = messages[0];
                    receiverId = firstMessage.sender._id === auth.userId ? 
                        firstMessage.receiver._id : firstMessage.sender._id;
                } else {
                    setError('Cannot determine message recipient');
                    return;
                }
            } else {
                // If we're not the owner, send to the property owner
                receiverId = property.owner._id;
            }

            console.log('Sending message to:', receiverId);
            const response = await axios.post(
                'http://localhost:5001/api/messages',
                {
                    content: newMessage.trim(),
                    receiverId,
                    propertyId: property._id
                },
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.response?.status === 401) {
                handleAuthError();
            } else {
                setError(error.response?.data?.message || 'Error sending message. Please try again.');
            }
        } finally {
            setSending(false);
        }
    };

    // Check authentication
    const auth = getAuthData();
    if (!auth) {
        handleAuthError();
        return null;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading conversation...</p>
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

    if (!property) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">Property not found</p>
                <button 
                    onClick={() => navigate('/messages')}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                >
                    Back to Messages
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md">
                {/* Header */}
                <div className="border-b p-4">
                    <button
                        onClick={() => navigate('/messages')}
                        className="text-blue-600 hover:text-blue-800 mb-2"
                    >
                        ← Back to Messages
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold">{property.title}</h2>
                        {otherUser && (
                            <p className="text-gray-600">
                                Conversation with {otherUser.email}
                            </p>
                        )}
                        {isOwner && !otherUser && (
                            <p className="text-gray-600">
                                You are the owner of this property
                            </p>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="p-4 h-[60vh] overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            {isOwner ? 
                                'No messages yet. Wait for interested buyers to contact you.' :
                                'No messages yet. Start the conversation!'
                            }
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`flex ${
                                        message.sender._id === auth.userId ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${
                                            message.sender._id === auth.userId
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        <p>{message.content}</p>
                                        <p className={`text-xs mt-1 ${
                                            message.sender._id === auth.userId
                                                ? 'text-blue-100'
                                                : 'text-gray-500'
                                        }`}>
                                            {new Date(message.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Message Input */}
                {/* Show input if user is owner and there are messages, or if user is not owner */}
                {(isOwner ? messages.length > 0 : true) && (
                    <div className="border-t p-4">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={sending}
                                className={`bg-blue-600 text-white px-6 py-2 rounded-lg ${
                                    sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                                }`}
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MessageThread; 