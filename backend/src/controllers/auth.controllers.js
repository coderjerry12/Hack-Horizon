import User from '../models/user.models.js'
import { ApiResponse } from '../utils/api-response.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from '../utils/mail.js'
import crypto from 'crypto'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens", [])
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { email, username, password } = req.body

    if ([email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required", [])
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existedUser) {
        throw new ApiError(409, "Username or email already exists", [])
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false
    })

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()
    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry
    await user.save({ validateBeforeSave: false })

    await sendEmail({
        email: user?.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${process.env.FRONTEND_URL}/verify-email/${unHashedToken}`
        ),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    if (!createdUser) {
        throw new ApiError(500, "User registration failed", [])
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdUser },
            "User registered successfully. Please check your email to verify your account."
        )
    )
})

const login = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Email or username is required", [])
    }

    const user = await User.findOne({ $or: [{ username }, { email }] })

    if (!user) {
        throw new ApiError(404, "User does not exist", [])
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid credentials", [])
    }

    if (!user.isEmailVerified) {
        throw new ApiError(400, "Please verify your email first", [])
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:""
            }
        },
        {
            new:true
        },
    );

    const options = {
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production'
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged out"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,req.user,"Current User fetched successfully")
    )
})

const verifyEmail = asyncHandler(async(req,res)=>{
    const {verificationToken} = req.params

    if(!verificationToken){
        throw new ApiError(400,"Email verification token is missing")
    }

    let hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

    const user = await User.findOne({
        emailVerificationToken : hashedToken,
        emailVerificationExpiry: {$gt:Date.now()}
    })

    if(!user){
        throw new ApiError(400,"Token is invalid or expired")
    }

    user.emailVerificationToken=undefined
    user.emailVerificationExpiry=undefined

    user.isEmailVerified = true

    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{isEmailVerified : true},"Email is verified"))
})

const resendEmailVerification = asyncHandler(async(req,res)=>{
    const { email } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    if(user.isEmailVerified){
        throw new ApiError(409,"Email is already verified")
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken()
    user.emailVerificationToken = hashedToken
    user.emailVerificationExpiry = tokenExpiry
    await user.save({ validateBeforeSave: false })

    await sendEmail({
        email: user?.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${process.env.FRONTEND_URL}/verify-email/${unHashedToken}`
        ),
    })

    return res.status(200).json(new ApiResponse(200,{},"Mail has been sent to your Email Id"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized access")
    }

    try{
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired")
        }

        const options = {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production'
        }

        const {accessToken,refreshToken:newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        

        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},
            "Access token refreshed"
        ))
    }catch(error){
        throw new ApiError(401,"Invalid Refresh Token")
    }
})

const forgotPasswordRequest = asyncHandler(async(req,res)=>{
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const {unHashedToken,hashedToken,tokenExpiry} = user.generateTemporaryToken()

    user.forgotPasswordToken=hashedToken
    user.forgotPasswordExpiry=tokenExpiry

    await user.save({validateBeforeSave:false})

    await sendEmail({
        email: user?.email,
        subject: "Password reset request",
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        ),
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset mail has been sent to your email Id"
        )
    )
})

const resetForgotPassword = asyncHandler(async(req,res)=>{
    const {resetToken} = req.params
    const {newPassword} = req.body

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const user = await User.findOne({
        forgotPasswordToken:hashedToken,
        forgotPasswordExpiry:{$gt:Date.now()}
    })

    if(!user){
        throw new ApiError(401,"Token is invalid or expired")
    }

    user.forgotPasswordExpiry=undefined
    user.forgotPasswordToken=undefined

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset Successfully"
            )
        )
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newPassword

    await user.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

export { registerUser, login ,logoutUser , getCurrentUser,verifyEmail,resendEmailVerification,refreshAccessToken,forgotPasswordRequest,resetForgotPassword,changeCurrentPassword}