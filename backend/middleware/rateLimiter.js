const rateLimit = require('express-rate-limit');

const createLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = parseInt(process.env.GENERAL_RATE_LIMIT_MAX, 10) || 300,
  skip = () => process.env.NODE_ENV === 'test',
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
  });
};

const createAuthLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  skip = () => process.env.NODE_ENV === 'test',
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
  });
};

module.exports = {
  createLimiter,
  createAuthLimiter,
};
