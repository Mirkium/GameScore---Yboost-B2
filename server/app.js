const express = require('express');
const path = require('path');
const app = express();
const route = require('./route/route.js');

app.use('/', route);
app.use("/assets", express.static(path.join(__dirname, '../FrontEnd/assets')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});