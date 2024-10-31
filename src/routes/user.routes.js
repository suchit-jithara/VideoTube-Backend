import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  deleteUser
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import errorHandler from "../middlewares/errorHandler.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser,
  errorHandler
);

router.route("/login").post(loginUser, errorHandler);
router.route("/generateAccessToken").get(refreshAccessToken, errorHandler);

// secure routes

router.route("/logout").post(verifyJWT, logoutUser, errorHandler);
router.route("/changePassword").patch(verifyJWT, changeCurrentPassword, errorHandler);
router.route("/getUser").get(verifyJWT, getCurrentUser, errorHandler);
router.route("/updateAccount").patch(verifyJWT, updateAccountDetails, errorHandler);
router.route("/deleteUser").post(verifyJWT, deleteUser, errorHandler);

router.route("/changeAvatar").patch(
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar,
  errorHandler);

router.route("/changeCoverImage").patch(verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage,
  errorHandler);


router.route("/channel/:username").get(verifyJWT, getUserChannelProfile, errorHandler)
router.route("/watchHistory").get(verifyJWT, getWatchHistory, errorHandler)


export default router;