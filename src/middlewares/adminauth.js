const auth = (req, res, next) => {
    const token = req.session.admin;
    // console.log("-------req.session-------",req.session)
    // console.log("-------req.session.admin-------",req.session.admin)
    if (token) {
        // res.redirect('/dashbord')
        next();
    } else {
        req.session.error = 'Access denied!';
        res.status(401).redirect('/login-admin');
    }
}

module.exports = auth;