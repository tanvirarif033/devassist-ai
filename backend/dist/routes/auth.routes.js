"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', (0, validate_middleware_1.validateRequest)(auth_validator_1.registerSchema), authController.register);
router.post('/login', (0, validate_middleware_1.validateRequest)(auth_validator_1.loginSchema), authController.login);
router.post('/logout', authController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map