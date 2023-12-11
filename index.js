const express = require('express')
const cors = require('cors')
const routes = require("./routes");
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(routes);




app.listen(port, ()=>{
    console.log("Api Served at http://localhost:"+port);
})