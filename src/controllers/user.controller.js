import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // to register a user we need ton follow the steps 
    // Step 1: Get the details from user 
    const { username, email, password, fullname } = req.body;
    // console.log(`Username: ${username}&Email: ${email}&Password: ${password}`);
    if ([username, email, password, fullname].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    // Step 3: Check if user Already Registered ,email,username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with username or email already exists");
    }
    // Step 2: Validate the data --Empty or a correct format of data 
    // Step 4:Check for image or avtar 
    const avatarLocalpath = req.files?.avatar[0]?.path;
    console.log(avatarLocalpath);
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    // =req.files?.coverImage[0]?.path;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalpath) {
        throw new ApiError(400, "Avatar is required")
    }
    // now upload avatar and coverImage to cloudinary 
    // Step 5:Upload them to cloudinary check for avtar upload
    const avtarResponse = await uploadOnCloudinary(avatarLocalpath);
    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
    // now store the data in database using user 
    // Step 5:Create a user object  create entry in db
    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avtarResponse.url,
        coverImage: coverImageResponse?.url || "",
        fullname,
        email,
        password
    })
    // Step 6: Remove password and refresh token field from response 
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // Step7 :check user created or not 
    if (!userCreated) {
        throw new ApiError(500, "Something went wrong while registering user")
    }
    // return result 
    return res.status(201).json(
        new ApiResponse(200, userCreated, "User Registered successfully")
    );
})
const loginUser = asyncHandler(async (req, res) => {
    //   steps to login a user 
    //  Step 1: get req from body 
    // Step 2: username or email
    // Step 3: find username and email 
    // Step 4: Check password 
    // Step 5: access and refresh token
    // Step 6: send cookies
    const { username, email, password } = req.body
    if (!(email || username)) {
        throw new ApiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedinUser,
                accessToken, refreshToken
            }, "User logged in successfully")
        )



})
const logoutUser = asyncHandler(async (req, res) => {
    // console.log(req.user._id);
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingAccessToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingAccessToken) {
        throw new ApiError(401, "unauthorized access")
    }
    try {
        const decodedToken = jwt.verify(incomingAccessToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }
        if (incomingAccessToken !== user.refreshToken) {
            throw new ApiError(401, " Refresh token is expired or used")
        }
        const { accessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user._id)
        const options = {
            httpOnly: true,
            secure: true,
        }
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiResponse(200, {
                accessToken,
                newrefreshToken
            }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid token")
    }
})
const changeCurrentpassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    // console.log(`OLD PASSWORD: ${oldPassword} \nNEW PASSWORD: ${newPassword}`);
    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(401,"User Not Found")
    }
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, "Password updated successfully")
    )
})
const getCurrentUser = asyncHandler(async (req, res) => {
    console.log(`User id : ${req.user._id}`);
    // const userDetail=await User.findById(req.user._id).select("-password -refreshToken")
    // if(userDetail){

    //     console.log(`Current user Detail is:  ${userDetail}`);
    // }else{
    //     throw new ApiError(400,{},"User not found")
    // }
    return res.status(200)
        .json(new ApiResponse(200, req.user, "Current user Fetched successfully"))
})
const updateUserInfo = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(401, "All Fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullname,
                email: email
            },
        }, {
        new: true
    }).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, user, "Account details updated"))

})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(401, "Invalid avatar path")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Something went wrong uploading avatar")
    }
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, {
        new: true
    }).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, req.user, "Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(401, "Invalid cover Image path")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(500, "Something went wrong uploading cover image")
    }
    await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {
        new: true
    }).select("-password")
    return res.status(200)
        .json(new ApiResponse(200, req.user, "Successfully updated cover image"))
})
// TODO:implement the deletion of a user avatar 
const delteUserAvatar=asyncHandler(async(req,res)=>{

})
const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    console.log(username);
    if (!username.trim()) {
        throw new ApiError(400, "Username is required")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
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
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    console.log(channel);
    if (!channel?.length) {
        throw new ApiError(400, "Channel not found")
    }
    return res.status(200)
        .json(new ApiResponse(200, channel[0], "User Channel Data fetched Successfully"))

})
const getUserWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
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
    return res.status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "User Watch history fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateUserInfo,
    changeCurrentpassword,
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
    getUserWatchHistory
}  