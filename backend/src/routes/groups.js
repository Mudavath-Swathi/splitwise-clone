const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createGroup, getMyGroups, getGroup,
  addMember, removeMember, getGroupBalances
} = require('../controllers/groupsController');

router.post('/', auth, createGroup);
router.get('/', auth, getMyGroups);
router.get('/:id', auth, getGroup);
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);
router.get('/:id/balances', auth, getGroupBalances);

module.exports = router;