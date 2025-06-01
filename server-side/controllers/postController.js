const Post = require("../models/post.model");

const createPost = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User info missing" });
    }

    try {
        const { type, description, quantity, pickupLocation, expiryDate } = req.body;

        if (!type || !description || !quantity || !pickupLocation || !expiryDate) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (isNaN(quantity)) {
            return res.status(400).json({ message: "Quantity must be a number" });
        }

        const newPost = new Post({
            userId: req.user.id,
            type,
            description,
            quantity: Number(quantity),
            pickupLocation,
            expiryDate
        });

        await newPost.save();
        res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (err) {
        res.status(500).json({ message: "Failed to create post", error: err.message });
    }
};

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        const now = new Date();
        const updatedPosts = await Promise.all(
            posts.map(async (post) => {
                if (new Date(post.expiryDate) < now && post.status !== "Expired") {
                    post.status = "Expired";
                    await post.save();
                }
                return post;
            })
        );

        const activePosts = updatedPosts.filter(post => post.status !== "Expired");
        res.json(activePosts);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch posts", error: err.message });
    }
};

const claimPost = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User info missing" });
    }

    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.status !== "Posted") {
            return res.status(400).json({ message: "Post is not available for claiming" });
        }

        if (post.userId.toString() === userId) {
            return res.status(400).json({ message: "You cannot claim your own post" });
        }

        post.claimedBy = userId;
        post.status = "Claimed";
        await post.save();

        res.json({ message: "Post claimed successfully", post });
    } catch (err) {
        res.status(500).json({ message: "Failed to claim post", error: err.message });
    }
};

const approveClaim = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User info missing" });
    }

    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.userId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to approve this claim" });
        }

        if (post.status !== "Claimed") {
            return res.status(400).json({ message: "No claim to approve" });
        }

        post.claimApproved = true;
        post.status = "Approved";
        await post.save();

        res.json({ message: "Claim approved successfully", post });
    } catch (err) {
        res.status(500).json({ message: "Failed to approve claim", error: err.message });
    }
};

const updatePostStatus = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User info missing" });
    }

    try {
        const postId = req.params.id;
        const { status } = req.body;
        const userId = req.user.id;

        const validStatuses = ["Picked Up", "Completed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status update" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const isOwner = post.userId.toString() === userId;
        const isClaimer = post.claimedBy?.toString() === userId;

        if (!isOwner && !isClaimer) {
            return res.status(403).json({ message: "Not authorized to update status" });
        }

        post.status = status;
        await post.save();

        res.json({ message: "Post status updated", post });
    } catch (err) {
        res.status(500).json({ message: "Failed to update status", error: err.message });
    }
};

const getUserHistory = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User info missing" });
    }

    try {
        const userId = req.user.id;

        const createdPosts = await Post.find({ userId }).sort({ createdAt: -1 });
        const claimedPosts = await Post.find({ claimedBy: userId }).sort({ createdAt: -1 });

        res.json({
            createdPosts,
            claimedPosts
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user history", error: err.message });
    }
};

const ratePost = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized: User info missing" });
    }

    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { rating } = req.body; // rating value (1 to 5)

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Check if user is owner or claimer
        if (
            post.userId.toString() !== userId &&
            (!post.claimedBy || post.claimedBy.toString() !== userId)
        ) {
            return res.status(403).json({ message: "You are not authorized to rate for this post" });
        }

        // Check if post is eligible for rating (picked up or completed)
        if (!["Picked Up", "Completed"].includes(post.status)) {
            return res.status(400).json({ message: "Post is not ready for rating" });
        }

        // Optional: Check if user already rated (implement as needed, for example, a ratings array)
        const existingRating = post.ratings?.find(r => r.user.toString() === userId);
        if (existingRating) {
            return res.status(400).json({ message: "You have already rated this post" });
        }

        // Add rating to post (assuming post schema has a 'ratings' array)
        post.ratings = post.ratings || [];
        post.ratings.push({ user: userId, rating });

        // Optionally, calculate average rating and save to post.avgRating
        const totalRating = post.ratings.reduce((sum, r) => sum + r.rating, 0);
        post.avgRating = totalRating / post.ratings.length;

        await post.save();

        res.json({ message: "Rating submitted successfully", post });
    } catch (err) {
        res.status(500).json({ message: "Failed to rate post", error: err.message });
    }
};



module.exports = {
    createPost,
    getAllPosts,
    claimPost,
    approveClaim,
    updatePostStatus,
    getUserHistory,
ratePost
};
