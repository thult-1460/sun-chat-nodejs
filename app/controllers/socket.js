const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const mongoose = require('mongoose');
const config = require('../../config/config');
const Room = mongoose.model('Room');

module.exports = function(io) {
  io.on('connection', socket => {
    socket.on('disconnect', async function() {
      if (socket.isMasterCall !== undefined) {
        let res = await Room.updateStatusCallMember(
          socket.roomId,
          socket.callId,
          socket.userId,
          socket.isMasterCall,
          config.CALL.PARTICIPANT.STATUS.HANGUP
        );

        if (socket.isMasterCall === false && res) {
          io.to(socket.callId).emit('change-offer-list', { userGiveUp: socket.userId });
        }
      }

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

    socket.on('join-live-chat', ({ liveChatId, peerId }) => {
      io.to(liveChatId).emit('add-member', { userId: socket.userId, peerId: peerId });
      socket.join(liveChatId);
      socket.peerId = peerId;
    });

    socket.on('close_room', () => {
      socket.leave(socket.roomId);
      delete socket.roomId;
    });

    socket.on('update_last_message_id', async function({ roomId, messageId }) {
      let result = await Room.updateLastMessageForMember(roomId, socket.userId, messageId);
      let roomInfo = await Room.getRoomInfoNewMember(roomId, [socket.userId]);
      io.to(socket.userId).emit('update_quantity_unread', {
        room_id: roomId,
        quantity_unread: roomInfo[0].quantity_unread,
      });
      io.to(socket.userId).emit('update_last_message_id_success', { messageId: result ? messageId : false });
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

    socket.on('regist-live-chat', async function({ roomId, liveId, master }) {
      socket.roomId = roomId;
      socket.callId = liveId;

      if (master) {
        socket.isMasterCall = true;
      } else {
        socket.isMasterCall = false;
        socket.status = config.CALL.PARTICIPANT.STATUS.CONNECTING;

        let masterId = null,
          findMaster = true;
        let liveChat = await Room.getLiveChat(roomId, masterId, liveId, findMaster);

        if (liveChat.member !== undefined) {
          socket.masterId = liveChat.member.user_id;
        }
      }
    });

    socket.on('invite-member', async function({ roomName, roomId, liveChatId, users }) {
      users.map(user => {
        io.to(user._id).emit('member_receive_notification_join_calling', { roomName, roomId, liveChatId });
      });
    });
  });
};

roomAuthorization = (roomId, userId) => {
  return true;
};
