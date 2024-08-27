import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/userSchema.js";
import { generateToken } from "../utils/jwtToken.js"
import cloudinary from "cloudinary";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";




export const userRegister = catchAsyncErrors(async(req, res, next)=>{
    const { firstName, lastName, dob, gender, email, password, phone, role } = req.body;
    if(!firstName || !lastName || !dob || !gender || !email || !password || !phone || !role){
        return next(new ErrorHandler("Please fill up the entire form!", 400));
    }
    let user = await User.findOne({email});
    if(user){
        return next(new ErrorHandler("User has already registered! Please login", 400));
    }
    user = await User.create({firstName, lastName, dob, gender, email, password, phone, role});
    generateToken(user, "User Registered Successfully!", 200, res);
});


export const login = catchAsyncErrors(async(req, res, next)=>{
    const {email, password, role} = req.body;
    if(!email || !password || !role){
        return next(new ErrorHandler("Please fill up the entire form", 400));
    }
    let user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandler("You do not have an account, please Register", 400));
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if(!isPasswordCorrect){
        return next(new ErrorHandler("Incorrect Password", 400));
    }
    if(role !== user.role){
        return next(new ErrorHandler("User with this role is not found", 400));
    }
    let userWithoutShowingPassword = await User.findOne({email});
    generateToken(userWithoutShowingPassword, "User Logged In Successfully!", 200, res);
});


export const addNewAdmin = catchAsyncErrors(async(req, res, next)=>{
    const { firstName, lastName, dob, gender, email, password, phone, confirmPassword } = req.body;
    if(!firstName || !lastName || !dob || !gender || !email || !password || !phone || !confirmPassword){
        return next(new ErrorHandler("Please fill up the entire form!", 400));
    }
    if(password !== confirmPassword){
      return next(new ErrorHandler("Password and Confirm-Password must be same", 400));
  }
    let user = await User.findOne({email});
    if(user){
        return next(new ErrorHandler(`${user.role} with this email already exists`, 400));
    }
    user = await User.create({firstName, lastName, dob, gender, email, password, confirmPassword , phone, role: "Admin"});
    res.status(200).json({
        success: true,
        message: "New Admin Registered",
    });
});


export const getAllDoctors = catchAsyncErrors(async(req, res, next)=>{
    const doctors = await User.find({isDoctor: true});
    res.status(200).json({
        success: true,
        doctors,
    });
});


export const getUserDetails = catchAsyncErrors(async(req, res, next)=>{
    const user = req.user;
    res.status(200).json({success:true, user});
})


export const logoutAdmin = catchAsyncErrors(async(req, res, next)=>{
    res.status(200).cookie("adminToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(Date.now()),
    }).json({success: true, message: "User logged out successfully"});
});


export const logoutUser = catchAsyncErrors(async(req, res, next)=>{
    res.status(200).cookie("userToken", "", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        expires: new Date(Date.now()),
    }).json({success: true, message: "User logged out successfully"});
});


export const addNewDoctor = catchAsyncErrors(async(req, res, next)=>{
    
    if(!req.files || Object.keys(req.files).length === 0){ //keys are the file fields in the Object of the req sent
        return next(new ErrorHandler("Doctor Avatar is required!", 400));
    }

    const { docAvatar } = req.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];  //allowed formats of the file, jpeg === jpg

    if(!allowedFormats.includes(docAvatar.mimetype)){  //if the extension of the docAvatar file does not matches the allowed formats
        return next(new ErrorHandler("File format not supported", 400));
    }
    
    const { firstName, lastName, dob, gender, email, password, phone, doctorDepartment, days } = req.body;

    if(!firstName || !lastName || !dob || !gender || !email || !password || !phone || !doctorDepartment || !days ){
        return next(new ErrorHandler("Please Provide full details", 400));
    }
    
    const isRegistered = await User.findOne({email});
    
    if(isRegistered){
        return next(new ErrorHandler(`${isRegistered.role} with this email already exists!`, 400));
    }
    
    const cloudinaryResponse = await cloudinary.uploader.upload(docAvatar.tempFilePath);
    
    if(!cloudinaryResponse || cloudinaryResponse.error){
        console.error("Cloudinary Error: ", cloudinaryResponse.error || "Unknown Cloudinary Error");
    }
    
    const doctorDays = days.split(" ");
    
    const doctor = await User.create({
        firstName,
        lastName,
        dob,
        gender,
        email,
        password,
        phone,
        doctorDepartment,
        doctorDays,
        isDoctor: true,
        docAvatar:{
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
        },
    });
    res.status(200).json({success: true, message:"New Doctor registered successfully!", doctor});
});


export const getRole = catchAsyncErrors(async(req, res, next)=>{
    const { email } = req.params;
    if(!email){
        return next(new ErrorHandler("Please enter the email", 400));      
    }
    let user = await User.findOne({ email });
    if(!user){
        return next(new ErrorHandler("User does not exist, please Register", 400));      
    }
    const role = user.role;
    res.status(200).json({
        success: true,
        role,
    });
})



export const resetPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
      const generateOtp = Math.floor(Math.random() * 10000);
      const otpExpiration = Date.now() + 63 * 1000;
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({
            success: false,
            message: "User is not found\nCreate an Account!",
          });
      }
  
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "ianshgp222003@gmail.com",
          pass: "pfksbsdoaggoetne",
        },
      });
  
      const info = await transporter.sendMail({
        from: "ianshgp222003@gmail.com",
        to: email,
        subject: "New OTP has been generated",
        html: `<h3>Your OTP is: <i>${generateOtp}</i></h3>`,
      });
      if (info.messageId) {
        await User.findOneAndUpdate(
          { email },
          {
            $set: {
              otp: generateOtp,
              otpExpiration,
            },
          }
        );
        return res
          .status(200)
          .json({ success: true, message: "OTP has been sent to your email" });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
};
  
export const verifyOtp = async (req, res, next) => {
    const { otp, newPassword, confirmNewPassword } = req.body;
    try {
      if(!otp){
        return res.status(400).json({ success: false, message: "Please enter the OTP" });
      }
      const user = await User.findOne({ otp });
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
      // Check if OTP has expired
      if (user.otpExpiration < Date.now()) {
        return res
          .status(400)
          .json({ success: false, message: "The OTP has expired" });
      }
      if(newPassword.length < 8){
        return next(new ErrorHandler("Password must contain atleast 8 Characters!", 400));
      }
      if(newPassword !== confirmNewPassword){
        return next(new ErrorHandler("Password and Confirm-Password must be same", 400));
    }
      const securePassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate(
        { otp },
        {
          $set: {
            password: securePassword,
            otp: 0,
            otpExpiration: 0, // Reset OTP expiration
          },
        }
      );
      return res
        .status(200)
        .json({ success: true, message: "Password has been updated" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
};