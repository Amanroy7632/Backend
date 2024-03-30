import { Router } from "express";
import { changeCurrentpassword, getCurrentUser, getUserProfile, getUserWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserInfo } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();
// router.route("/register").post(registerUser)
router.route("/register").post(upload.fields([
  {
    name: "avatar",
    maxCount: 1
  },
  {
    name: "coverImage",
    maxCount: 1
  }
]),
  registerUser) //Middleware can be injected before the routes
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt, changeCurrentpassword)
router.route("/current-user").get(verifyJwt, getCurrentUser)
router.route("/update-account-detail").patch(verifyJwt, updateUserInfo)
router.route("/avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJwt, getUsegit rProfile)
router.route("/watch-history").get(verifyJwt, getUserWatchHistory)
export default router
