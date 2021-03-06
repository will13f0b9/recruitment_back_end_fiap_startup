"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = (req, resp, err, done) => {
    err['toJSONx'] = () => {
        return {
            message: err.message
        };
    };
    console.log(err);
    switch (err.name) {
        case 'MongoError':
            if (err.code === 11000) {
                err.statusCode = 400;
            }
            break;
        case 'ValidationError':
            err.statusCode = 400;
            const messages = [];
            for (let name in err.errors) {
                messages.push({ message: err.errors[name].message });
            }
            err['toJSONx'] = () => ({
                message: 'Validation error while processing your request',
                errors: messages
            });
            break;
    }
    done();
};
