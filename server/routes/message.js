const router = require('express').Router();
const Message = require('../models/Message');
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ message: 'No authentication token provided' });
        }
        const tokenString = token.replace('Bearer ', '');
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Please authenticate' });
    }
};

router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating new message. UserId:', req.userId);
        const { receiverId, content, propertyId } = req.body;

        if (!receiverId || !content || !propertyId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Cannot send messages for a deleted property' });
        }

        const isOwner = property.owner.toString() === req.userId;
        const isParticipant = await Message.findOne({
            propertyId,
            $or: [
                { sender: req.userId, receiver: receiverId },
                { sender: receiverId, receiver: req.userId }
            ]
        });

        if (!isOwner && !isParticipant) {
            if (property.owner.toString() !== receiverId) {
                return res.status(403).json({ 
                    message: 'You can only send messages to the property owner'
                });
            }
        }

        const message = new Message({
            sender: req.userId,
            receiver: receiverId,
            content,
            propertyId
        });
        
        await message.save();
        
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'email')
            .populate('receiver', 'email')
            .populate('propertyId', 'title');

        console.log('Message created successfully');
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error in POST /messages:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching messages for user:', req.userId);
        
        const messages = await Message.find({
            $or: [
                { sender: req.userId },
                { receiver: req.userId }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'email')
        .populate('receiver', 'email')
        .populate({
            path: 'propertyId',
            select: 'title owner',
            populate: {
                path: 'owner',
                select: 'email'
            }
        });

        console.log('Found messages:', messages.length);
        res.json(messages);
    } catch (error) {
        console.error('Error in GET /messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

router.get('/property/:propertyId', auth, async (req, res) => {
    try {
        console.log('Fetching property messages. PropertyId:', req.params.propertyId, 'UserId:', req.userId);
        
        if (!req.params.propertyId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid property ID format' });
        }

        const property = await Property.findById(req.params.propertyId)
            .populate('owner', 'email');

        const messages = await Message.find({
            propertyId: req.params.propertyId,
            $or: [
                { sender: req.userId },
                { receiver: req.userId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'email')
        .populate('receiver', 'email')
        .populate('propertyId', 'title');

        console.log('Found messages:', messages.length);

        let isOwner = false;
        let otherUser = null;
        
        if (property) {
            isOwner = property.owner._id.toString() === req.userId;
            otherUser = isOwner ? null : property.owner;
        } else if (messages.length > 0) {
            // If property is deleted but messages exist, determine other user from messages
            const firstMessage = messages[0];
            otherUser = firstMessage.sender._id.toString() === req.userId ? 
                firstMessage.receiver : firstMessage.sender;
        }

        // Return messages along with property details
        res.json({
            messages,
            property: property ? {
                _id: property._id,
                title: property.title,
                owner: property.owner,
                isOwner
            } : null,
            otherUser,
            isDeleted: !property
        });
    } catch (error) {
        console.error('Error in /property/:propertyId:', error);
        res.status(500).json({ message: 'Error fetching property messages' });
    }
});

router.patch('/:id/read', auth, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid message ID format' });
        }

        const message = await Message.findOne({
            _id: req.params.id,
            receiver: req.userId
        });
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        
        message.read = true;
        await message.save();
        
        res.json(message);
    } catch (error) {
        console.error('Error in PATCH /:id/read:', error);
        res.status(500).json({ message: 'Error updating message' });
    }
});

router.get('/unread/count', auth, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.userId,
            read: false
        });
        
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching unread count' });
    }
});

module.exports = router; 