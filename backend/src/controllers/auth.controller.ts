import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../database';
import { config } from '../config';

export class AuthController {
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, username, password, fullName } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
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
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
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
    const token = jwt.sign(
  { id: user.id, email: user.email },
  config.jwt.secret as Secret,
  {
    expiresIn: config.jwt.expire as SignOptions["expiresIn"],
  }
);

      return res.status(201).json({
        success: true,
        data: { user, token },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
     const token = jwt.sign(
  { id: user.id, email: user.email },
  config.jwt.secret as Secret,
  {
    expiresIn: config.jwt.expire as SignOptions["expiresIn"],
  }
);

      return res.json({
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
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

 async logout(_req: Request, res: Response): Promise<Response> {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}
}