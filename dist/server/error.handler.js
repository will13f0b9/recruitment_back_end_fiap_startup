"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = (req, resp, err, done) => {
    console.log("ERRO DOIDO");
    console.log;
    err['toJSONx'] = () => {
        return {
            message: err.message
        };
    };
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
            console.log("ae");
            err['toJSONx'] = () => ({
                message: 'Validation error while processing your request',
                errors: messages
            });
            console.log("aexa");
            break;
    }
    console.log("aexac");
    done();
    console.log("aexacasdd");
};
