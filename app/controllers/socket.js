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

    socket.on('update_last_message_id', async function({ roomId, messageId }) {
      let result = await Room.updateLastMessageForMember(roomId, socket.userId, messageId);
      io.to(socket.userId).emit('update_last_message_id_success', { messageId: result ? messageId : false });
    });

    socket.on('delete_msg', messageId => {
      io.to(socket.roomId).emit('delete_msg', messageId);
    });
    // action of USER - END


    socket.on('get_list_room', async params => {
      const options = {
        userId: socket.userId,
        filter_type: params.filter_type,
        limit: params.per_page,
        page: params.page,
      };

      let rooms = await Room.getListRoomByUserId(options);
      io.to(socket.userId).emit('update_list_room', rooms);
    });
  });
};

roomAuthorization = (roomId, userId) => {
  return true;
};
