import express from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import { generateUserResponse, generateAdminSummary, generateRecommendedActions } from '../services/geminiService.js';

const router = express.Router();

// Validation schemas
const submitReviewSchema = z.object({
    name: z.string().max(100).optional().default('Anonymous User'),
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().max(2000).optional().default('')
});

/**
 * POST /api/reviews - Submit a new review
 */
router.post('/reviews', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected. Please check server logs for IP whitelist errors.'
            });
        }

        // Validate request body
        const validatedData = submitReviewSchema.parse(req.body);
        let { name, rating, reviewText } = validatedData;

        // Truncate long reviews
        if (reviewText && reviewText.length > 2000) {
            reviewText = reviewText.substring(0, 1997) + '...';
        }

        // Process with AI (Parallel calls for speed)
        const startTime = Date.now();
        const [userResponse, adminSummary, recommendedActions] = await Promise.all([
            generateUserResponse(rating, reviewText),
            generateAdminSummary(rating, reviewText),
            generateRecommendedActions(rating, reviewText)
        ]);
        const processingTime = Date.now() - startTime;

        // Save to database
        const review = new Review({
            name,
            rating,
            reviewText,
            userResponse,
            adminSummary,
            recommendedActions,
            metadata: {
                processingTimeMs: processingTime,
                model: 'gemini-flash-1.5' // Hardcoded based on current service
            }
        });

        await review.save();

        // Return response
        res.status(201).json({
            success: true,
            data: {
                reviewId: review._id,
                userResponse: userResponse,
                timestamp: review.createdAt
            }
        });
    } catch (error) {
        console.error('Error submitting review:', error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to process review. Please try again.'
        });
    }
});

/**
 * GET /api/reviews - Fetch all reviews with analytics
 */
router.get('/reviews', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected. Please check server logs for IP whitelist errors.'
            });
        }

        const { limit = 50, rating } = req.query;

        // Build query
        const query = {};
        if (rating) {
            query.rating = parseInt(rating);
        }

        // Fetch reviews
        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // Calculate analytics
        const allReviews = await Review.find({});
        const totalReviews = allReviews.length;
        const averageRating = totalReviews > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        const ratingDistribution = {
            1: allReviews.filter(r => r.rating === 1).length,
            2: allReviews.filter(r => r.rating === 2).length,
            3: allReviews.filter(r => r.rating === 3).length,
            4: allReviews.filter(r => r.rating === 4).length,
            5: allReviews.filter(r => r.rating === 5).length
        };

        res.json({
            success: true,
            data: {
                reviews: reviews.map(r => ({
                    id: r._id,
                    name: r.name,
                    rating: r.rating,
                    reviewText: r.reviewText,
                    userResponse: r.userResponse,
                    adminSummary: r.adminSummary,
                    recommendedActions: r.recommendedActions,
                    createdAt: r.createdAt,
                    metadata: r.metadata
                })),
                total: reviews.length,
                analytics: {
                    totalReviews,
                    averageRating: parseFloat(averageRating.toFixed(2)),
                    ratingDistribution
                }
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        });
    }
});

/**
 * DELETE /api/reviews/:id - Delete a review
 */
router.delete('/reviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReview = await Review.findByIdAndDelete(id);

        if (!deletedReview) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            data: { id }
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete review'
        });
    }
});

export default router;
