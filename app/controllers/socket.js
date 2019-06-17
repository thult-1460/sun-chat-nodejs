const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Room = mongoose.model('Room');

module.exports = function(io) {
  io.on('connection', socket => {
    socket.on('disconnect', () => {
      console.log('socket disconnected');
    });

    socket.on('register_id', token => {
      jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
          socket.emit('register_id_failed', __('token_invalid'));
        } else {
          let { _id: userId } = decoded;
          socket.userId = userId;
          socket.join(userId);
        }
      });
    });

    // action of USER - BEGIN
    socket.on('open_room', roomId => {
      if (roomAuthorization(roomId, socket.userId)) {
        if (socket.roomId) {
          socket.leave(socket.roomId);
        }

        socket.join(roomId);
        socket.roomId = roomId;
      } else {
        socket.emit('open_room_failed', __('socket.room.open_room_failed'));
      }
    });

    socket.on('close_room', () => {
      socket.leave(socket.roomId);
      delete socket.roomId;
    });

    socket.on('update_request_friend_count', async function(userId) {
      userId = userId ? userId : socket.userId;
      let request_friend_count = await User.getAllContactRequest(userId);
      io.to(userId).emit('update_request_friend_count', request_friend_count[0].number_of_contact);
    });

    socket.on('update_msg', messageId => {
      let message = ''; // get from DB
      io.to(socket.roomId).emit('update_msg', { _id: messageId, content: message });
    });

    socket.on('update_last_readed_message', async function({ roomId, messageId }) {
      let result = await Room.updateLastMessageForMember(roomId, socket.userId, messageId);
      io.to(socket.userId).emit('update_last_readed_message', { messageId: result ? messageId : false });
    });

    socket.on('delete_msg', messageId => {
      io.to(socket.roomId).emit('delete_msg', messageId);
    });
    // action of USER - END

    // action of ADMIN - BEGIN
    socket.on('add_room', (roomId, userIds) => {
      userIds.map(userId => io.to(userId).emit('add_room', {}));
    });

    socket.on('edit_room', async function(roomId) {
      let roomInfo = await Room.getInforOfRoom(roomId);
      io.to(socket.roomId).emit('edit_room_successfully', roomInfo[0]);
    });

    socket.on('delete_room', () => {
      let message = '[ROOM_NAME] has been deleted.';
      io.to(socket.roomId).emit('delete_room', message);
    });

    socket.on('add_member', (roomId, userIds) => {
      let msg = '[USERNAMEs] joined the group.';
      let message = {}; // add message to room
      let members = {}; // get representative members
      io.to(socket.roomId).emit('change_member_count', { message: message, members: members });
      userIds.map(userId => io.to(userId).emit('add_room', {}));
    });

    socket.on('kick_out', (roomId, userIds) => {
      let msg = '[USERNAMEs] has been deleted.';
      let message = {}; // add message to room
      let members = {}; // get representative members

      userIds.map(userId => io.to(userId).emit('had_been_kicked_out', roomId));
      io.to(socket.roomId).emit('change_member_count', { message: message, members: members });
    });
    // action of ADMIN - END

    // action of MEMBER - BEGIN
    socket.on('new_request_member', roomId => {});

    socket.on('join_room', roomId => {});

    socket.on('left_room', () => {});
    // action of MEMBER - END

    socket.on('get_list_room', async params => {
      const options = {
        userId: socket.userId,
        filter_type: params.filter_type,
        limit: params.per_page,
        page: params.page
      }

      let rooms = await Room.getListRoomByUserId(options);
      io.to(socket.userId).emit('update_list_room', rooms);
    })
  });
};



roomAuthorization = (roomId, userId) => {
  return true;
};
