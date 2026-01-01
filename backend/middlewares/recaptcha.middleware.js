const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  const { recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ message: 'reCAPTCHA token is required' });
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

    if (!response.data.success) {
      return res.status(400).json({ 
        message: 'reCAPTCHA verification failed',
        errors: response.data['error-codes']
      });
    }

    // reCAPTCHA verified successfully
    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return res.status(500).json({ message: 'Error verifying reCAPTCHA' });
  }
};

module.exports = { verifyRecaptcha };