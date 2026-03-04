import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { generateTokens, hashPassword, comparePassword } from '../utils/auth';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, nickname, name, phone, gender } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          nickname,
          name,
          phone,
          gender,
          memberStatus: 'pending',
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          name: true,
          phone: true,
          gender: true,
          profileImage: true,
          bio: true,
          role: true,
          memberStatus: true,
          createdAt: true,
        }
      });

      res.status(201).json({
        message: 'Registration successful. Please wait for admin approval.',
        user,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.memberStatus === 'pending') {
        return res.status(403).json({ error: '계정이 승인 대기 중입니다. 관리자의 승인을 기다려주세요.' });
      }

      if (user.memberStatus === 'rejected') {
        return res.status(403).json({ error: '가입 신청이 거절되었습니다. 관리자에게 문의하세요.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      const { accessToken, refreshToken } = generateTokens(user.id);

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          name: user.name,
          phone: user.phone,
          gender: user.gender,
          profileImage: user.profileImage,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await prisma.session.deleteMany({
          where: { refreshToken }
        });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
      }

      const session = await prisma.session.findFirst({
        where: {
          refreshToken,
          expiresAt: { gt: new Date() }
        }
      });

      if (!session) {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.userId);

      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      });

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  },
};
