const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true,
        index: true
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});


messageSchema.index({ sender: 1, propertyId: 1 });
messageSchema.index({ receiver: 1, propertyId: 1 });
messageSchema.index({ propertyId: 1, createdAt: -1 });


messageSchema.pre('save', function(next) {
    if (this.content) {
        this.content = this.content.trim();
    }
    next();
});

module.exports = mongoose.model('Message', messageSchema); 