const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
//const logEvents = require('./middleware/logEvents');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');
const PORT = process.env.PORT || 3500;
//===========================================================//
// middleware = is really anything between request and response
// there are 3 types of middlewares 
//1. built-in middleware
//2. custom middleware
//3. middlewares from third-parties
//===================[2]custom middleware===================//
// custom middleware logger👇
//👉if you here we have next which was not there when had built-in middleware because the next is automatically provided by built-in middleware but in custom middleware we need to have it on our own ****
/*
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
})
*/
// we can actually log these to the console to check to see if it's working 
// but really we would like to have it in log text file so to do that👇
//👉 create a middleware directory or folder 
//👉 then drag the logEvents.js in middleware folder
//👉 you might need to change the path for logs folder ( use '..' to go up one step ***);
/*
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, 'reqLog.txt');
    next();
})
*/
///////////////////
// let's make it more cleaner and clear 
// I'm gonna have this handler inside the logEvents function.

app.use(logger);
// we don't just want to log req methods to the console, instead we need to log it to the logEvents file*****
//////////////////////////////////////////////////////
//////////////Let's request data from another domain/////////////////////////////
// so as you can notice we got undefined in the request origin is because we are requesting data from localhost 
// Let's try to request data from another domain******
/* we got CORS err in the console and this will lead us to a third-party middleware 'CORS'
CORS === cross origin resource sharing 
so now we need to install cors as dependency to do that just write 
npm i cors
*/
// now import cors above👆
//Let's place this cors middleware as soon as but just below the logger***
//===================[3]middlewares from third-party👇==============================//
//app.use(cors());
/////////////////////////////////////////////////////////
//===================[4]let's go little deeper into the cors========================//
//app.use(cors()); // this is public which means this available for any domain** also any domain can request our data from our server
// however this is not that we always need. most of the times we need to have only the selected domains to request the data. we can actually do that👇
// Let's create a whitelist which will have the list selected domains
const whitelist = ['https://www.yoursite.com', 'http://127.0.0.1:5500', 'http://localhost:3500'];

// then we'll need to have a function that will allow these selected sites to request data
// 👉👉👉remember origin parameter inside the function which is same as the origin property of the object (corsOptions) here the origin parameter inside the function is the origin of the site that is requesting data ==>> ( origin ===>>  the domain or the url of the site that is requesting the data )👈👈👈
const corsOptions = {
    origin: (origin, callback) => {
        // now we need to check if the domain or url or origin that is present inside our whitelist
        //if ( whitelist.indexOf(origin) !== -1 ) // if whitelist.indexOf(origin) is strictly not equal to -1  means is not present in the whitelist
        // ||!origin this wil allow if there is no domain***
        if ( whitelist.indexOf(origin) !== -1 || !origin ) {
            callback(null, true); // here null is error**
        } else {
            callback(new Error('not allowed by the CORS'));
        }
    }
}

app.use(cors(corsOptions));

//1.====>>> we got CORS error again because we don't have www.google.com in our whitelist 
//2. let's have www.google.com in our whitelist 
//3. we got no CORS error now (because now we have www.google.com in our whitelist);
//4. so our corsOptions is working fine and we can have our frontend or react web site inside this whitelist 
/////////////////////////////////////////////////////////////////
//===============[1]built-in middleware=================//
/* built-in middleware to handle urlencoded data
 in other words, form data;
 // 'content-type: application/x-www-form-urlencoded'
 */
// syntax ==========>>>>>> app.use()
app.use(express.urlencoded({ extended: false }));

app.use(express.json());
// to handle static types or static files
// the files must be in public folder inorder route
app.use(express.static(path.join(__dirname, 'public')));
// like routes middlewares also handles down like a water fall
// which means the above all middlewares are applied to each of these routes******* (you can check in the web though);
/////////////////////////////////////////////////////////////////////
app.get('^/$|/index(.html)?', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
})
app.get('/new-page(.html)?', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'new-page.html'));
})
app.get('/old-page(.html)?', (req, res) => {
    res.redirect(301, '/new-page.html'); 
})
// Route handlers
app.get('/hello(.html)?', (req, res, next) => {
    console.log('attemped to load hello.html!');
    next();
}, (req, res) => {
    res.send('hello bro!');
})
// the another way of chaining these functions (handlers)***
const one = (req, res, next) => {
    console.log('one');
    next();
}
const two = (req, res, next) => {
    console.log('two');
    next();
}
const three = (req, res, next) => {
    console.log('three');
    res.send('finished!');
}
app.get('/chain(.html)?', [one, two, three]);
//====================[6]compare between app.use() & app.all()===================// 
/*
app.get('/*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html')); 
}) */
//1. app.use() does not accepts regular expressions i,e regX
//2. app.use() is likely to be used for middlewares not for routing***
//app.use('/') 
/////
//3. where as app.all() accepts regX and also it is used for routing 
//app.all('/*') or app.all('*')
app.all('/*', (req, res) => {
    res.status(404);
    // now we check for content type
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('json')) {
        res.json({ error: '404 not found'});
    } else {
        //now in this stage we treat every other type as text
        // and make it .txt
        res.type('txt').send('404 not found');
    }
})
//====================[5] little error handling=====================//
//1.Let's change www.google.com to www.yoursite.com to get that CORS error
//2. now let's handle these errors
//3. go all the way down even down after '/*' router 
//4. and have a little error handler function
 
/*
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send(err.message);
})
*/
app.use(errorHandler);
//1.instead of just logging error to the console we need to have a record of it just like logs we need to have a errlog
// 2.so even we can this error handler much clean to do that 
// 3.have a different file in middleware just like logEvents.js
//4. import the errorHandler and have it inside of app.use() here much better and cleaner***
//5. now we need to add one more step to have our index page working again
//6. add ||!origin  to the options condition which will allow if there is no domain or no url***
//==================================================================//
app.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
})
















