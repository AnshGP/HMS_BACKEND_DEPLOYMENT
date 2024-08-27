import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
        minLength: [3, "First Name must contain atleast 3 characters!"] ,
    },
    lastName:{
        type: String,
        required: true,
        minLength: [3, "Last Name must contain atleast 3 characters!"] ,
    },
    dob:{
        type: Date,
        required: [true, "DOB is required"],
    },
    gender:{
        type: String,
        required: true,
        enum: ["Male", "Female", "Other"],
    },
    email:{
        type: String,
        required: true,
        validate: [validator.isEmail, "Please provide a valid email!"],
    },
    password:{
        type: String,
        required: true,
        minLength: [8, "Password must contain atleast 8 Characters!"],
        select: false,
    },
    phone:{
        type: String,
        required: true,
        minLength: [10, "Phone number must contain exactly 10 digits!"],
        maxLength: [10, "Phone number must contain exactly 10 digits!"],
        validate: [validator.isMobilePhone, "Please enter a valid phone number!"],
    },
    otp:{
        type: Number,
        default: 0,
    },
    otpExpiration:{
        type: Number,
        default: 0,
    },
    role:{
        type: String,
        required: true,
        enum: ["User", "Admin"],
        default: "User"
    },
    isDoctor:{
        type: Boolean,
        default: false,
    },
    doctorDepartment:{
        type: String,
    },
    docAvatar:{
        public_id: String,
        url: String,
    },
    doctorDays:{
        type: [String],
        enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    }
});


userSchema.pre('save', async function(next){
    if(!this.isModified("password")){
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function(){
    return jwt.sign({id: this._id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

export const User = mongoose.model("User", userSchema);
