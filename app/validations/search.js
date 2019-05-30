const { checkTextSearch } = require('./actions/searchRoom');

exports.validate = () => {
	return [checkTextSearch()];
};
