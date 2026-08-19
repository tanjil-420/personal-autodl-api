const express = require('express');
const alldlHandler = require('./lib/alldl');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/ytb', alldlHandler.ytb);
app.get('/facebook', alldlHandler.facebook);
app.get('/tiktok', alldlHandler.tiktok);
app.get('/instagram', alldlHandler.instagram);
app.get('/alldl', alldlHandler.alldl);

app.get('/', alldlHandler.root);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
