const Task = require('../models/Task');
const Event = require('../models/Event');
const Counter = require('../models/Counter'); // Add this import

// Update the stats in getTasks and getTaskStats to match your actual status values
const getTasks = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const tasks = await Task.find({ event: eventId })
      .populate('assignedTo', 'name memberId role')
      .populate('createdBy', 'username')
      .populate('dependencies', 'name status')
      .sort({ createdAt: -1 });
    
    // Get statistics - updated to match your model's status values
    const stats = {
      total: tasks.length,
      byStatus: {
        'Assigned': tasks.filter(t => t.status === 'Assigned').length,
        'Planning': tasks.filter(t => t.status === 'Planning').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        'On Hold': tasks.filter(t => t.status === 'On Hold').length,
        'Completed': tasks.filter(t => t.status === 'Completed').length,
        'Cancelled': tasks.filter(t => t.status === 'Cancelled').length,
        'Failed': tasks.filter(t => t.status === 'Failed').length
      },
      byPriority: {
        'Low': tasks.filter(t => t.priority === 'Low').length,
        'Medium': tasks.filter(t => t.priority === 'Medium').length,
        'High': tasks.filter(t => t.priority === 'High').length,
        'Critical': tasks.filter(t => t.priority === 'Critical').length
      },
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      progress: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100)
        : 0
    };
    
    res.json({ tasks, stats });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Same fix for getTaskStats
const getTaskStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const tasks = await Task.find({ event: eventId });
    
    const stats = {
      total: tasks.length,
      byStatus: {
        'Assigned': tasks.filter(t => t.status === 'Assigned').length,
        'Planning': tasks.filter(t => t.status === 'Planning').length,
        'In Progress': tasks.filter(t => t.status === 'In Progress').length,
        'On Hold': tasks.filter(t => t.status === 'On Hold').length,
        'Completed': tasks.filter(t => t.status === 'Completed').length,
        'Cancelled': tasks.filter(t => t.status === 'Cancelled').length,
        'Failed': tasks.filter(t => t.status === 'Failed').length
      },
      byPriority: {
        'Low': tasks.filter(t => t.priority === 'Low').length,
        'Medium': tasks.filter(t => t.priority === 'Medium').length,
        'High': tasks.filter(t => t.priority === 'High').length,
        'Critical': tasks.filter(t => t.priority === 'Critical').length
      },
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      progress: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100)
        : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get single task
// @route   GET /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId
// @access  Private
const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name memberId role')
      .populate('createdBy', 'username')
      .populate('dependencies', 'name status taskId')
      .populate('comments.author', 'name')
      .populate('attachments.uploadedBy', 'name');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to generate task ID
async function generateTaskId() {
  const year = new Date().getFullYear();
  
  const counter = await Counter.findOneAndUpdate(
    { name: `taskId-${year}` },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }  // Change 'new: true' to 'returnDocument: "after"'
  );
  
  return `TSK-${year}-${String(counter.seq).padStart(4, "0")}`;
}

// @desc    Create a task
// @route   POST /api/projects/:projectId/activities/:activityId/events/:eventId/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    // Debug logging
    console.log('Request admin:', req.admin);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    // Validate admin exists
    if (!req.admin) {
      return res.status(401).json({ error: 'User not authenticated - req.admin is missing' });
    }
    
    const { eventId } = req.params;
    const userId = req.admin.id;
    
    // Validate userId
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in request' });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Generate formatted task ID
    const taskId = await generateTaskId();
    console.log('Generated taskId:', taskId);
    
    // Prepare task data according to the model
    const taskData = {
      taskId: taskId, // Add the generated taskId
      name: req.body.name,
      description: req.body.description || '',
      priority: req.body.priority || 'Medium',
      status: req.body.status || 'Planning',
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      dependencies: req.body.dependencies || [],
      event: eventId,
      createdBy: userId
    };
    
    // Handle assignedTo - single ID (not array)
    if (req.body.assignedTo) {
      taskData.assignedTo = req.body.assignedTo;
    }
    
    console.log('Creating task with data:', taskData);
    
    const task = await Task.create(taskData);
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name memberId role')
      .populate('createdBy', 'username');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error details:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    // Check for duplicate key error (taskId already exists)
    if (error.code === 11000 && error.keyPattern?.taskId) {
      // Retry once if duplicate key (rare case)
      try {
        const newTaskId = await generateTaskId();
        req.body.taskId = newTaskId;
        return createTask(req, res);
      } catch (retryError) {
        return res.status(500).json({ error: 'Failed to generate unique task ID' });
      }
    }
    
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// @desc    Update a task
// @route   PUT /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.taskId;
    delete updateData.createdBy;
    delete updateData.event;
    
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { returnDocument: 'after', runValidators: true }  // Change 'new: true' to 'returnDocument: "after"'
    ).populate('assignedTo', 'name memberId role')
     .populate('createdBy', 'username')
     .populate('dependencies', 'name status');
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Remove this task from dependencies of other tasks
    await Task.updateMany(
      { dependencies: taskId },
      { $pull: { dependencies: taskId } }
    );
    
    await task.deleteOne();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Add comment to task
// @route   POST /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const userId = req.admin.id; // Changed from req.user.id to req.admin.id
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.comments.push({
      text,
      author: userId,
      createdAt: new Date()
    });
    
    await task.save();
    
    const updatedTask = await Task.findById(taskId)
      .populate('comments.author', 'name email');
    
    res.json(updatedTask.comments);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.comments = task.comments.filter(
      comment => comment._id.toString() !== commentId
    );
    
    await task.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Add attachment to task
// @route   POST /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId/attachments
// @access  Private
const addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, url } = req.body;
    const userId = req.admin.id; // Changed from req.user.id to req.admin.id
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Attachment name and URL are required' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.attachments.push({
      name,
      url,
      uploadedBy: userId,
      uploadedAt: new Date()
    });
    
    await task.save();
    
    const updatedTask = await Task.findById(taskId)
      .populate('attachments.uploadedBy', 'name email');
    
    res.json(updatedTask.attachments);
  } catch (error) {
    console.error('Add attachment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete attachment
// @route   DELETE /api/projects/:projectId/activities/:activityId/events/:eventId/tasks/:taskId/attachments/:attachmentId
// @access  Private
const deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.attachments = task.attachments.filter(
      attachment => attachment._id.toString() !== attachmentId
    );
    
    await task.save();
    
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
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
};