const axios = require('axios');

/**
 * Middleware xác thực reCAPTCHA v2
 */
const verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ 
      success: false,
      message: 'reCAPTCHA token is required' 
    });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        }
      }
    );

    console.log('reCAPTCHA verification result:', response.data);

    if (!response.data.success) {
      return res.status(400).json({ 
        success: false,
        message: 'reCAPTCHA verification failed',
        errors: response.data['error-codes']
      });
    }

    // reCAPTCHA verified successfully
    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error verifying reCAPTCHA' 
    });
  }
};

module.exports = { verifyRecaptcha };