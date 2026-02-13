const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user && !user.isdeleted) {
      return res.status(400).json({ msg: 'User with this email already exists' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      if (!user || existingUsername._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Username is already taken' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    if (user) {
      user.username = username;
      user.password = hashedPassword;
      user.isVerified = false;
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = verificationTokenExpires;
      user.isdeleted = false;
      await user.save();
    } else {
      user = new User({
        username,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        verificationTokenExpires
      });
      await user.save();
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const clientUrl = process.env.FRONTEND_URL || 'https://docseditor-1.onrender.com';
      const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your email',
        html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`
      });
    }

    res.status(201).json({ msg: 'User created successfully. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (user.isdeleted) {
      return res.status(400).json({ msg: 'This account has been deleted' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email before logging in.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   maxAge: 24 * 60 * 60 * 1000 // 24 hours
    // });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    });


    console.log(token);

    res.json({
      msg: 'Sign in successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        documents: user.documents
      }
    });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ msg: 'Internal server error' });
  }
};

exports.update = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Authorization denied' });
    }

    // req.user.id is expected to be set by auth middleware
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (username) user.username = username;

    let emailChanged = false;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email is already in use' });
      }
      user.email = email;
      user.isVerified = false;
      const verificationToken = crypto.randomBytes(20).toString('hex');
      user.verificationToken = verificationToken;
      user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
      emailChanged = true;

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const clientUrl = process.env.FRONTEND_URL || 'https://docseditor-1.onrender.com';
        const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify your new email',
          html: `<p>Please verify your new email by clicking <a href="${verificationUrl}">here</a>.</p>`
        });
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      msg: emailChanged ? 'Profile updated. Please verify your new email.' : 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        documents: user.documents
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ msg: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Authorization denied' });
    }

    await User.findByIdAndUpdate(req.user.id, { isdeleted: true });
    res.json({ msg: 'Account deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};