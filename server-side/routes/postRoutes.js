const express = require("express");
const router = express.Router();
const {
    createPost,
    getAllPosts,
    claimPost,
    approveClaim,
    updatePostStatus,
    getUserHistory,
  ratePost
} = require("../controllers/postController")

const authMiddleware = require("../middleware/authMiddleware")

router.post("/create", authMiddleware, createPost)
router.get("/", getAllPosts);
router.post("/claim/:id", authMiddleware, claimPost)
router.patch("/approve/:id", authMiddleware, approveClaim)
router.patch("/status/:id", authMiddleware, updatePostStatus)
router.get("/user/history", authMiddleware, getUserHistory);
router.post("/rate/:id", authMiddleware, ratePost);


module.exports = router;
