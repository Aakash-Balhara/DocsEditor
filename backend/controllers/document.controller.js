const Document = require('../models/document.model');
const User = require('../models/user.model');
const nodemailer = require('nodemailer');

// Create a new document
exports.create = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const { title, content } = req.body;
        const newDocument = new Document({
            title: title || 'Untitled Document',
            content: content || '',
            owner: req.user.id
        });

        const document = await newDocument.save();
        res.json(document);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get all documents for the current user
exports.getAll = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const documents = await Document.find({ owner: req.user.id }).sort({ updatedAt: -1 });
        res.json(documents);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Get a single document by ID
exports.getById = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check ownership
        const isOwner = document.owner.toString() === req.user.id;
        const isShared = document.sharedWith.some(s => s.email === user.email);

        if (!isOwner && !isShared) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(document);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Document not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Update a document
exports.update = async (req, res) => {
    const { title, content, saveVersion } = req.body;

    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        let document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check ownership
        const isOwner = document.owner.toString() === req.user.id;
        const sharedUser = document.sharedWith.find(s => s.email === user.email);
        const canEdit = isOwner || (sharedUser && sharedUser.role === 'editor');

        if (!canEdit) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (saveVersion) {
            document.versions.push({
                content: document.content,
                title: document.title,
                updatedBy: req.user.id,
                updatedByName: user.username,
                createdAt: new Date()
            });
        }

        if (title) document.title = title;
        if (content !== undefined) document.content = content;

        await document.save();
        res.json(document);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getVersions = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check access
        const isOwner = document.owner.toString() === req.user.id;
        const isShared = document.sharedWith.some(s => s.email === user.email);
        
        if (!isOwner && !isShared) {
             return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(document.versions.reverse()); // Newest first
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.restoreVersion = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ msg: 'Document not found' });

        // Check permissions
        const isOwner = document.owner.toString() === req.user.id;
        const sharedUser = document.sharedWith.find(s => s.email === user.email);
        const canEdit = isOwner || (sharedUser && sharedUser.role === 'editor');

        if (!canEdit) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const version = document.versions.id(req.params.versionId);
        if (!version) return res.status(404).json({ msg: 'Version not found' });

        document.title = version.title;
        document.content = version.content;
        await document.save();

        const io = req.app.get('io');
        io.to(req.params.id).emit('receive-changes', document.content);

        res.json(document);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// Delete a document
exports.delete = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check ownership
        if (document.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await document.deleteOne();
        res.json({ msg: 'Document removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Document not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.addComment = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Check permissions
        const isOwner = document.owner.toString() === req.user.id;
        const sharedUser = document.sharedWith.find(s => s.email === user.email);
        const role = isOwner ? 'owner' : (sharedUser ? sharedUser.role : null);

        if (!isOwner && role !== 'editor' && role !== 'commenter') {
            return res.status(401).json({ msg: 'Not authorized to comment' });
        }

        const { content } = req.body;
        if (!content) {
             return res.status(400).json({ msg: 'Comment content is required' });
        }

        const newComment = {
            content,
            author: req.user.id,
            authorName: user.username,
            createdAt: new Date()
        };

        document.comments.push(newComment);
        await document.save();

        const addedComment = document.comments[document.comments.length - 1];
        const io = req.app.get('io');
        io.to(req.params.id).emit('new-comment', addedComment);

        res.json(document.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.share = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(401).json({ msg: 'User not found' });

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        if (document.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { email, role } = req.body;
        const userRole = ['viewer', 'commenter', 'editor'].includes(role) ? role : 'viewer';

        const existingShare = document.sharedWith.find(s => s.email === email);
        if (existingShare) {
            existingShare.role = userRole;
        } else if (email) {
            document.sharedWith.push({ email, role: userRole });
        }

        if (email) {
            await document.save();

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                try {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        }
                    });

                    const clientUrl = process.env.FRONTEND_URL || req.headers.origin || (process.env.NODE_ENV === 'production' ? 'https://docseditor-cdrg.onrender.com' : 'http://localhost:5173');
                    const documentLink = `${clientUrl}/document/${document._id}`;

                    await transporter.sendMail({
                        from: user.email,
                        to: email,
                        subject: `Document Shared: ${document.title}`,
                        text: `You have been invited to ${userRole} the document "${document.title}". Click here to open: ${documentLink}`,
                        html: `<p>You have been invited to ${userRole} the document "<strong>${document.title}</strong>".</p><p><a href="${documentLink}">Click here to open the document</a></p>`
                    });
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                }
            } else {
                console.warn('Email credentials not found in environment variables. Skipping email notification.');
            }
        }
        
        res.json(document);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Document not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        const comment = document.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        if (comment.author.toString() !== req.user.id && document.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to delete this comment' });
        }

        document.comments.pull(req.params.commentId);
        await document.save();

        const io = req.app.get('io');
        io.to(req.params.id).emit('delete-comment', req.params.commentId);

        res.json(document.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.removeAccess = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Authorization denied' });
        }

        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        if (document.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { email } = req.body;
        document.sharedWith = document.sharedWith.filter(s => s.email !== email);
        await document.save();
        res.json(document);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
