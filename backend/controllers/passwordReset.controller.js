const User = require('../models/user.model');
const PasswordResetToken = require('../models/passwordResetToken.model');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

exports.requestOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove existing token if any
    await PasswordResetToken.deleteOne({ userId: user._id });

    const newToken = new PasswordResetToken({
      userId: user._id,
      otp: otp
    });
    await newToken.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`,
            html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p>`
        });
    } else {
        console.log('Email credentials not found. OTP:', otp);
    }

    res.json({ msg: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const token = await PasswordResetToken.findOne({ userId: user._id, otp });
    if (!token) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await PasswordResetToken.deleteOne({ _id: token._id });

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
