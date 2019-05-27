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

const roomValidate = {
    invitation_code: {
        minLength: 10,
        maxLength: 50
    },
    name: {
        minLength: 10,
        maxLength: 50 
    },
    IMG_SIZE: 5, //MB
}

module.exports = {
    authValidate,
    roomValidate
};
