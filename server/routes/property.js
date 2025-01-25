const router = require('express').Router();
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
            req.fileValidationError = 'Only image files are allowed!';
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl;
        
        const property = new Property({
            ...req.body,
            imageUrl,
            owner: req.userId
        });
        
        await property.save();
        res.status(201).json(property);
    } catch (error) {
        res.status(500).json({ message: 'Error creating property' });
    }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError });
        }

        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Check if the user is the owner of the property
        if (property.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to edit this property' });
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        // Update the property
        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('owner', 'email');

        res.json(updatedProperty);
    } catch (error) {
        res.status(500).json({ message: 'Error updating property' });
    }
});

router.get('/', async (req, res) => {
    try {
        const properties = await Property.find().populate('owner', 'email');
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching properties' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('owner', 'email');
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json(property);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching property' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Check if the user is the owner of the property
        if (property.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this property' });
        }

        await Property.findByIdAndDelete(req.params.id);
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting property' });
    }
});

module.exports = router; 