import express from "express";
import { postAppointment, getAllAppointments, updateAppointmentStatus, deleteAppointment } from "../controllers/appointmentController.js";
import { isUserAuthenticated, isAdminAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isUserAuthenticated, postAppointment);
router.get("/getall", isAdminAuthenticated, getAllAppointments);
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);

export default router;