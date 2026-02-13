const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const documentController = require('../controllers/document.controller');

// @route   POST api/documents
// @desc    Create a document
// @access  Private
router.post('/', auth, documentController.create);

// @route   GET api/documents
// @desc    Get all documents for user
// @access  Private
router.get('/', auth, documentController.getAll);

// @route   GET api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', auth, documentController.getById);

// @route   PUT api/documents/:id
// @desc    Update document
// @access  Private
router.put('/:id', auth, documentController.update);

// @route   DELETE api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, documentController.delete);

// @route   POST api/documents/:id/share
// @desc    Share document with email
// @access  Private
router.post('/:id/share', auth, documentController.share);

// @route   POST api/documents/:id/share/remove
// @desc    Remove access for a user
// @access  Private
router.post('/:id/share/remove', auth, documentController.removeAccess);

// @route   POST api/documents/:id/comments
// @desc    Add a comment to a document
// @access  Private
router.post('/:id/comments', auth, documentController.addComment);

// @route   DELETE api/documents/:id/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:id/comments/:commentId', auth, documentController.deleteComment);

// @route   GET api/documents/:id/versions
// @desc    Get document version history
// @access  Private
router.get('/:id/versions', auth, documentController.getVersions);

// @route   PUT api/documents/:id/versions/:versionId/restore
// @desc    Restore a document version
// @access  Private
router.put('/:id/versions/:versionId/restore', auth, documentController.restoreVersion);

module.exports = router;
