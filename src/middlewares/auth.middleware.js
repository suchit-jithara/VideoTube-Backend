import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    console.log(accessToken);
    if (!accessToken) throw new ApiError(401, "Unauthorized request");
    const decodedToken = JWT.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken) throw new ApiError(400, "Invalid user");
    const user = await User.findById(decodedToken._id).select("-refreshToken");
    if (!user) throw new ApiError(401, "Invalid Access Token");
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
})

export { verifyJWT };