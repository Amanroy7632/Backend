import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if (!accessToken) {
      throw new ApiError(401, "Unauthorized access")
    }
    const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if (!user) {
      // TODO: discuss in frontend
      throw new ApiError(401, "Invalid access token")
    }
    req.user = user
    next()
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid access token")
  }

})