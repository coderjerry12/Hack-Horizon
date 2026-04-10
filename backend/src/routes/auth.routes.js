import {Router} from "express";
import {registerUser,login,logoutUser,getCurrentUser, verifyEmail, forgotPasswordRequest, resetForgotPassword, changeCurrentPassword, resendEmailVerification,refreshAccessToken} from '../controllers/auth.controllers.js'
import {validate} from "../middlewares/validator.middleware.js"
import {userChangeCurrentPasswordValidator, userForgotPasswordValidator, userLoginValidator, userRegisterValidator, userResetForgotPasswordValidator} from "../validators/index.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// public routes
router.route("/register").post(userRegisterValidator(), validate, registerUser)
router.route("/login").post(userLoginValidator(), validate, login)
router.route("/verify-email/:verificationToken").get(verifyEmail)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest)
router.route("/reset-password/:resetToken").post(userResetForgotPasswordValidator(), validate, resetForgotPassword)
router.route("/resend-email-verification").post(resendEmailVerification)

// protected routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/change-password').post(verifyJWT, userChangeCurrentPasswordValidator(), validate, changeCurrentPassword)

export default router
