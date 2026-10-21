
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required.',
      });
    }

    const token = authHeader.slice(7);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'securevote',
      audience: 'securevote-users',
    });

    if (
      !mongoose.isObjectIdOrHexString(decoded.sub) ||
      !['voter', 'admin'].includes(decoded.role)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

module.exports = authMiddleware;
