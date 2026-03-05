const jwt = require('jsonwebtoken');

const secret = process.env.SECRET;

/* TOKEN MIDDLEWARE */

module.exports = function (req, res, next) {
    const token = req.get('X-Dorothy-Token');
    
    if(token) {
        try {
            const decoded = jwt.verify(token, secret);
            res.locals.user = decoded;
        } catch(e) {
            console.log('Token error', e.message);
        }
    }

    next()
};