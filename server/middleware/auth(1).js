import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Token verification attempt', {
    hasAuthHeader: Boolean(authHeader),
    hasToken: Boolean(token),
    path: req.path,
    method: req.method
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET missing in environment');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded', { userId: decoded.userId, role: decoded.role, email: decoded.email });

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['passwordHash'] }
    });
    
    if (!user) {
      console.log('❌ User not found for token userId', decoded.userId);
      return res.status(401).json({ error: 'Invalid user' });
    }

    if (!user.isActive) {
      console.log('❌ Inactive user blocked', { id: user.id, role: user.role });
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    console.log('✅ Authenticated user', { id: user.id, role: user.role, email: user.email });
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    const name = error.name || 'UnknownError';
    if (name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    if (name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    return res.status(403).json({ error: 'Token verification failed' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    console.log('🔒 Role check', { required: roles, userRole: req.user?.role, userId: req.user?.id });
    if (!req.user) {
      console.log('❌ No authenticated user on request');
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.log('❌ Insufficient permissions', { required: roles, userRole: req.user.role });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('✅ Role authorized');
    next();
  };
};