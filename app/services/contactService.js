const _ = require('underscore');

let getListRequestFriend = (listSearch, listRequestAccept, listSendRequested) => {
  let listSendFriend = {};

  listSearch = JSON.parse(JSON.stringify(listSearch));
  listRequestAccept = _.invert(JSON.parse(JSON.stringify(listRequestAccept)));
  listSendRequested.map(item => {
    return (listSendFriend[item._id.toString()] = true);
  });

  let result = listSearch.map((item, key) => {
    if (typeof listRequestAccept[item._id] != 'undefined') {
      item['flagRequestContact'] = true;
    } else if (typeof listSendFriend[item._id] != 'undefined') {
      item['flagSendContact'] = true;
    }

    return item;
  });

  return result;
};

module.exports = {
  getListRequestFriend,
};
