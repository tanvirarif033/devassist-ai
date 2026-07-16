"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../database");
const config_1 = require("../config");
class AuthController {
    async register(req, res) {
        try {
            const { email, username, password, fullName } = req.body;
            // Check if user exists
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    OR: [{ email }, { username }],
                },
            });
            if (existingUser) {
                return res.status(400).json({
                    error: 'User already exists with this email or username',
                });
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            // Create user
            const user = await database_1.prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    fullName,
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    fullName: true,
                    createdAt: true,
                },
            });
            // Generate token
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expire });
            res.status(201).json({
                success: true,
                data: { user, token },
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            // Find user
            const user = await database_1.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Verify password
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Generate token
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expire });
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        fullName: user.fullName,
                    },
                    token,
                },
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async logout(req, res) {
        // JWT is stateless, client should remove token
        res.json({ success: true, message: 'Logged out successfully' });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map