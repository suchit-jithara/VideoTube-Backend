import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../utils/Cloudinary.js"
import { RemoveFileFromLocalStorage } from "../utils/RemoveFileFromLocalStorage.js";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.gennerateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token");
  }
}

const registerUser = asyncHandler(async (req, res) => {

  // Steps of Algorithams:
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res


  const { userName, email, password, fullName } = req.body;

  console.log(fullName, userName, email, password);

  if (
    [userName, email, password, fullName].some((field) => (field?.trim() === "" || field === undefined))
  ) {
    RemoveFileFromLocalStorage(req, res, "avatar");
    RemoveFileFromLocalStorage(req, res, "coverImage");
    throw new ApiError(400, "All field are required");
  }

  const existedUser = await User.findOne(
    {
      $or: [{ userName }, { email }]
    }
  )

  if (existedUser) {
    RemoveFileFromLocalStorage(req, res, "avatar");
    RemoveFileFromLocalStorage(req, res, "coverImage");
    throw new ApiError(409, "User with username or email already exists");
  }

  // console.log(req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // console.log(avatarLocalPath);
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // console.log(coverImageLocalPath);

  // let coverImageLocalPath;
  // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  if (!avatarLocalPath) {
    RemoveFileFromLocalStorage(req, res, "coverImage");
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  console.log(avatar);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
  console.log(coverImage);

  if (!avatar) throw new ApiError(500, "Avatar file is not store at cloudinary");

  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    password,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || ""
  }
  );

  const createduser = await User.findOne(user._id).select("-password -refreshToken");

  if (!createduser) {
    deleteFileFromCloudinary(avatar.url);
    deleteFileFromCloudinary(coverImage.url);
    throw ApiError(500, "Somthing went wrong while register the user");
  }

  res.status(201).json(
    new ApiResponse(
      200,
      createduser,
      "User register successfully"
    )
  )
})

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { userName, email, password } = req.body;
  if ([userName, email, password].some((field) => (field.trim() === "" || field === undefined))) {
    throw new ApiError(400, "All field are required");
  }
  const user = await User.findOne({
    $or: [
      { userName },
      { email }
    ]
  })

  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordValid = user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  console.log(accessToken, refreshToken, "Tokens");
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          // ...loggedInUser._doc,
          ...loggedInUser.toObject(), // here .toObject() method is mongoose method is not a part of javascript or node js. 
          // In JavaScript, .toObject() is a common method in libraries like Mongoose (used with MongoDB) to convert a document (which has methods and metadata specific to the database layer) into a plain JavaScript object. This plain object is easier to manipulate, serialize, or send as a JSON response.
          "accessToken": accessToken,
          "refreshToken": refreshToken
        },
        "User logged In Successfully"
      )
    )
});

const logoutUser = asyncHandler(async (req, res) => {

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: {
      //   refreshToken: ""
      // }

      // we also can do somthing like 

      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "User logged Out")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "unauthorized request");

  const decodedToken = JWT.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  if (!decodedToken) throw new ApiError(401, "unauthorized request");

  const user = await User.findById(decodedToken._id);

  if (incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh token is expired or used");

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(decodedToken._id);

  const options = {
    httpOnly: true,
    secure: true
  }

  res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          ...user.toObject(),
          accessToken,
          refreshToken
        },
        "accessToken and refreshToken is generated successfully"
      )
    )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) throw new ApiError(400, "password is required");

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, req.user, "User fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) throw new ApiError(400, "All fields are required")

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  res
    .status(200)
    .json(
      new ApiResponse(200, user, "Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  if (!avatar) throw new ApiError(500, "Avatar file is not store at cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  const deleteOldAvatarFromCloudinary = await deleteFileFromCloudinary(req.user?.avatar);

  // console.log(deleteOldAvatarFromCloudinary);
  if (!deleteOldAvatarFromCloudinary) throw new ApiError(500, "Old Avatar file is not delete from cloudinary");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) throw new ApiError(400, "Cover Image file is missing");

  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);
  if (!coverImage) throw new ApiError(500, "Cover Image file is not store at cloudinary");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password -refreshToken")

  const deleteOldCoverImageFromCloudinary = await deleteFileFromCloudinary(req.user.coverImage);

  if (!deleteOldCoverImageFromCloudinary) throw new ApiError(500, "Old Cover Image file is not delete from cloudinary");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image file updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username: userName } = req.params;

  console.log(userName)
  if (!userName?.trim()) throw new ApiError(400, "username is missing");

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers"
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        userName: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        // subscribedTo: 1,
        // subscribers: 1
      }
    }
  ])

  if (!channel?.length) throw new ApiError(404, "channel does not exists")
  console.log(channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
        // Aggregation pipelines (aggregate()) are low-level MongoDB operations, so they don’t automatically convert types. MongoDB expects data types to be explicitly defined here, as aggregation stages operate directly on the database engine without Mongoose’s automatic casting
        // Mongoose’s helper methods (find, findById, update) are designed to be more user-friendly and assume you may provide an _id as a string. Mongoose automatically casts _id values as ObjectId when needed in these methods.
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [ // here we can ferther write a pipeline for vedio model
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [ // here we can ferther write a pipeline for users model
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    email: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  // There is need to do some work on it.
  // const result = await User.find({_id: req.user._id}).populate({path: "Video",select: "whatchHistory"})
  // console.log(result);

  if (!user) throw new ApiError(400, "watchHistory is not available");
  console.log(user)


  // console.log("-------------")
  // console.log(user[0])
  console.log("-------------")
  console.log(user[0].watchHistory)

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    )
})

const deleteUser = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password?.trim()) throw new ApiError(400, "password is requiered");

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) throw new ApiError(401, "Invelid credentials");

  const deleteAvatarFromCloudinary = await deleteFileFromCloudinary(user.avatar);
  const deleteCoverImageFromCloudinary = await deleteFileFromCloudinary(user.coverImage);

  if (!deleteAvatarFromCloudinary || !deleteCoverImageFromCloudinary) throw new ApiError(500, "Internal error during deletion of Avatar and cover image on Cloudinary");

  const removeUser = await user.deleteOne({ _id: req.user?._id });

  if (!removeUser) throw new ApiError(500, "User is not Delete");

  const checkDeletion = await User.findById(req.user?._id);

  if (checkDeletion) throw new ApiError(500, "User is not Delete");

  const options = {
    httpOnly: true,
    secure: true
  }
  res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(200, {}, "User Delete successfully")
    )
})


export {
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
}