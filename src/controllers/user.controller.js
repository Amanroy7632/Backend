import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser=asyncHandler(async (req,res)=>{
    
    // to register a user we need ton follow the steps 
    // Step 1: Get the details from user 
    // Step 2: Validate the data --Empty or a correct format of data 
    // Step 3: Check if user Already Registered ,email,username
    // Step 4:Check for image or avtar 
    // Step 5:Upload them to cloudinary check for avtar upload
    // Step 5:Create a user object  create entry in db
    // Step 6: Remove password and refresh token field from response 
    // Step7 :check user created or not 
    // return result 
    const {username,email,password,fullName}=req.body;
    console.log(`Username: ${username}&Email: ${email}&Password: ${password}`);
    if ([username,email,password,fullName].some((field)=>field?.trim()==="")) {
        throw new ApiError(400,"All fields are required");
    }
    const existedUser=  User.findOne({
        $or:[{username},{email}]
    })
    if (existedUser) {
        throw new ApiError(409,"User with username or email already exists");
    }
    const avatarLocalpath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if (!avatarLocalpath) {
        throw new ApiError(400,"Avatar is required")
    }
    // now upload avatar and coverImage to cloudinary 
    const avtarResponse=await uploadOnCloudinary(avatarLocalpath);
    const coverImageResponse=await uploadOnCloudinary(coverImageLocalPath);
    // now store the data in database using user 
   const user= await User.create({
        username:username.tolowerCase(),
        avatar:avtarResponse.url,
        coverImage:coverImageResponse?.url||"",
        fullName,
        email,
        
    })
    const userCreated=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!userCreated) {
        throw new ApiError(500,"Something went wrong while registering user")
    }
    return res.status(201).json(
        new ApiResponse(200,userCreated,"User Registered successfully")
    );

})
export {registerUser} 