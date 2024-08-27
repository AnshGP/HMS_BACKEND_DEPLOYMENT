export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJsonWebToken();
  const cookieName =
    user.role === "Admin"
      ? "adminToken"
      : "userToken"
  return res
    .status(statusCode)
    .cookie(cookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
    })
    .json({ success: true, message, user, token });
};
