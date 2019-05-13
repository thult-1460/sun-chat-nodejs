const authValidate = {
    name: {
        minLength: 6,
        maxLength: 20
    },
    username: {
        minLength: 6,
        maxLength: 20
    },
    email: {
        maxLength: 255
    },
    password: {
        minLength: 6,
        maxLength: 20
    }
}

module.exports = {
    authValidate
};
