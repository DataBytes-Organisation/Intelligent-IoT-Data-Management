const router = require("express").Router();
const controller = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
router.post("/auth/register", controller.register);
router.post("/auth/login", controller.login);
router.post("/auth/mfa/verify", controller.verifyMfa);
router.post("/auth/mfa/resend", controller.resendMfa);
router.post("/auth/refresh", controller.refresh);
router.post("/auth/logout", controller.logout);
router.post("/auth/password-reset/request", controller.requestReset);
router.post("/auth/password-reset/confirm", controller.confirmReset);
router.get(
  "/auth/admin/users",
  authMiddleware,
  roleMiddleware("admin"),
  controller.getUsers,
);
module.exports = router;
