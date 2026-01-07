import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'Anonymous User',
        maxlength: 100
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        default: '',
        maxlength: 2000
    },
    userResponse: {
        type: String,
        required: true
    },
    adminSummary: {
        type: String,
        required: true
    },
    recommendedActions: {
        type: String,
        required: true
    },
    metadata: {
        reviewLength: Number,
        processingTime: Number,
        llmModel: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for performance
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ rating: 1 });

export default mongoose.model('Review', reviewSchema);
