import express from "express";
import {
  userRegister,
  login,
  addNewAdmin,
  getAllDoctors,
  getUserDetails,
  logoutAdmin,
  logoutUser,
  addNewDoctor,
  getRole,
  resetPassword,
  verifyOtp,
} from "../controllers/userController.js";
import {
  isAdminAuthenticated,
  isUserAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.post("/user/register", userRegister);
router.post("/login", login);
router.post("/admin/addnew", isAdminAuthenticated, addNewAdmin);
router.get("/doctors", getAllDoctors);
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/user/me", isUserAuthenticated, getUserDetails);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
router.get("/user/logout", isUserAuthenticated, logoutUser);
router.post("/doctor/addnew", isAdminAuthenticated, addNewDoctor);
router.get("/:email", getRole);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOtp);

export default router;
