import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import nodemailer from "nodemailer";

const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Kolkata",
};

export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    department,
    doctor_firstName,
    doctor_lastName,
    hasVisited,
    address,
  } = req.body;
  if(!firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !appointment_date ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address){
        return next(new ErrorHandler("Please fill up the entire form", 400));        
    }
    const isConflict = await User.find({
        firstName: doctor_firstName,
        lastName: doctor_lastName,
        isDoctor: true,
        doctorDepartment: department
    });
    if(isConflict.length === 0){
        return next(new ErrorHandler("Doctor not found", 400));
    }
    if(isConflict.length > 1){
        return next(new ErrorHandler("There are multiple doctors with the same name, kindly contact through email or phone", 404));
    }
    const doctorId = isConflict[0]._id;
    const patientId = req.user._id;
    const appointment = await Appointment.create({
        firstName,
        lastName,
        email,
        phone,
        dob,
        gender,
        appointment_date,
        department,
        doctor:{
            firstName: doctor_firstName,
            lastName: doctor_lastName,
        },
        hasVisited,
        address,
        doctorId,
        patientId,
    });
    res.status(200).json({success: true, message: "Appointment Sent Successfully!", appointment});
});

export const getAllAppointments = catchAsyncErrors(async (req, res, next)=>{
    const appointments = await Appointment.find({});
    res.status(200).json({success: true, appointments});
});

export const updateAppointmentStatus = catchAsyncErrors(async (req, res, next)=>{
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment not found", 400));
    }
    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
        new: true, 
        runValidators: true, 
        useFindAndModify: false,
    });
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "ianshgp222003@gmail.com",
          pass: "pfksbsdoaggoetne",
        },
      });
      appointment.status==="Accepted"?
      await transporter.sendMail({
        from: "ianshgp222003@gmail.com",
        to: appointment.email,
        subject: "New OTP has been generated",
        html: `<h3>Your appointment on ${new Date(appointment.appointment_date).toLocaleString(
            "en-IN",
            options
          )} has been confirmed</h3>`,
      }):"";
    res.status(200).json({
        success: true,
        message: "Appointment Status updated!",
        appointment,
    });
});

export const deleteAppointment = catchAsyncErrors(async(req, res, next)=>{
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment not found", 400));
    }
    await appointment.deleteOne();
    res.status(200).json({
        success: true,
        message: "Appointment deleted successfully!",
    });
});