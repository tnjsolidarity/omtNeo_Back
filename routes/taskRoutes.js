const express = require('express');
const router = express.Router({ mergeParams: true });

const auth = require('../middleware/authMiddleware');

const {
  getTasks,
  getTaskStats,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  addAttachment,
  deleteAttachment
} = require('../controllers/taskController');

// Task CRUD operations
router.get('/', auth, getTasks);
router.post('/', auth, createTask);

router.get('/stats', auth, getTaskStats);

router.get('/:taskId', auth, getTask);
router.put('/:taskId', auth, updateTask);
router.delete('/:taskId', auth, deleteTask);

// Comments
router.post('/:taskId/comments', auth, addComment);
router.delete('/:taskId/comments/:commentId', auth, deleteComment);

// Attachments
router.post('/:taskId/attachments', auth, addAttachment);
router.delete('/:taskId/attachments/:attachmentId', auth, deleteAttachment);

module.exports = router;