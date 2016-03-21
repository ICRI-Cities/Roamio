/**
 * Created by Steven Houben (s.houben@ucl.ac.uk) - 2016
 */
var express= require('express');
var path= require('path');
var app = express();
var io = require('socket.io')(httpApp);
var httpApp = require('http').Server(app);
var bodyParser= require('body-parser');
var mongoose = require('mongoose');

var helmet = require('helmet');
var Keys = require('./PrivateKeys');
var HttpMessages = require('./HttpMessages');
var debug = require('./Debugger');


var httpMessages = new HttpMessages();
var Schema = mongoose.Schema;
var keys = new Keys();
var db = mongoose.connection;

var entity ={
    title:String,               //Title of the Question
    author:String,              //Author
    text:String,                //Actual text
    category:[String],          //Categories = array of string names indicating category
    reply:[String],             //Replies = array of IDs pointing to the replies.
    condition:{type:String,     //Condition
        description:String},
    id: String                  //Identifier
}

var collection ={
    title:String,               //Title of the collection
    author:String,              //Author
    category:[String],          //Categories = array of string names indicating category
    questions:[String],         //Question IDs of the questions in the collectopm
    id:String                   //Identifier
}

var entitySchema = new Schema(entity);
var collectionSchema= new Schema(collection);

var Question = mongoose.model('questions', entitySchema);
var Answer = mongoose.model('answers', entitySchema);
var Reply = mongoose.model('replies', entitySchema);
var Collection = mongoose.model('collections',collectionSchema);


app.use(helmet());
app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, './public')));
app.use(bodyParser.json());

/**
 * Start the database and output and error if anything
 * goes wrong.
 */
mongoose.connect(keys.databaseUrl,function(err) {
    if (err) throw err;
});

/**
 * Notify us when the database connection is broken
 */
db.on('error', console.error.bind(console, 'connection error:'));

/**
 * Print a message when the database is opened
 */
db.on('open', function() {
    Print("Database","Connected to db");
});

/**
 * Post new objects to the resources
 */
app.post('/:resource',function(req,res){

    //Find out what resource the user is posting to
    var resource = req.params.resource;

    //Grab the object from the body, BodyParser will
    //automatically deserialize the JSON
    var object = req.body;

    //Get the id of the resource
    var id = object.id;

    //Check if the resource exists
    if(resourceExist(resource))
    {
        //Check if object exists
        FindDatabaseObject(resource,id,function(result){

           //If the object does not exist, we can safely add it
           if(result == null)
           {
               new mongoose.models[resource](object).save(function(err){
                   if(err){
                       Print("Database", "Invalid data");
                       res.send(httpMessages.invalid);
                   }
                   else
                   {
                       Print("Database","Created "+req.method+" "+ req.url)
                       res.send(httpMessages.ok);
                   }
               });
           }
            else
           {
               Print("Database","Cannot create already existing "+req.method+" "+ req.url)
               res.send(DetailedHttpMmessage(httpMessages.notAllowed,"Object already exists, use PUT method to update object in database"));
           }
        });


    }
    else
    {
        res.send(httpMessages.notFound);
        Print("Http Server","Returned 404 error.");
    }
});
/**
 * Updates objects in the resources
 */
app.put('/:resource/:id',function(req,res){

    //Find out what resource the user is posting to
    var resource = req.params.resource;

    //Get the id of the resource
    var id = req.params.id;

    //Grab the object from the body, BodyParser will
    //automatically deserialize the JSON
    var object = req.body;

    //Check if the resource exists
    if(resourceExist(resource))
    {
        //Check if object exists
        FindDatabaseObject(resource,id,function(result){

            if(result !=null)
            {
                if(id != object.id){
                    Print("Http Server", "Object id "+ object.id + " does not match " + req.method + " " + req.url);
                    res.send(DetailedHttpMmessage(httpMessages.invalid, "Object id "+ object.id + " does not match " + req.method + " " + req.url));
                }
                else
                {
                    //Update the model that matches the identifier
                    result.update(object,function(err)
                    {
                        if(err){
                            Print("Database", "Invalid data");
                            res.send(httpMessages.invalid);
                        }
                        else
                        {
                            Print("Database","Updated "+req.method+" "+ req.url)
                            res.send(httpMessages.ok);
                        }
                    });
                }

            }
            else
            {
                Print("Database", "Cannot update non existing " + req.method + " " + req.url)
                res.send(DetailedHttpMmessage(httpMessages.notAllowed, "Object does not exists"));
            }
        });
    }
    else
    {
        res.send(httpMessages.notFound);
        Print("Http Server","Returned 404 error.");
    }
});

/**
 * Deletes a resource in the collection
 */
app.delete('/:resource/:id',function(req,res){

    //Find out what resource the user is posting to
    var resource = req.params.resource;

    //Get the id of the resource
    var id = req.params.id;

    //Check if the resource exists
    if(resourceExist(resource))
    {
        //Check if object exists
        FindDatabaseObject(resource,id,function(result){

            //If the object does not exist, we can safely add it
            if(result != null)
            {
                result.remove(function(err){
                    if(err){
                        Print("Database", "Invalid data");
                        res.send(httpMessages.invalid);
                    }
                    else
                    {
                        Print("Database","Removed "+req.method+" "+ req.url)
                        res.send(httpMessages.ok);
                    }
                });
            }
            else
            {
                Print("Database","Cannot delete non existing "+req.method+" "+ req.url)
                res.send(DetailedHttpMmessage(httpMessages.notAllowed,"Object does not exists"));
            }
        });


    }
    else
    {
        res.send(httpMessages.notFound);
        Print("Http Server","Returned 404 error.");
    }
});

function DetailedHttpMmessage(httpMessage,details){
    var detailedMessage = httpMessage;
    detailedMessage.details=details;
    return detailedMessage;
}
function FindDatabaseObject(resource,objectId,callback){

    mongoose.models[resource].findOne({id:objectId},function (err, question) {
        if (err)
        {
            callback(null);
        }
        else
        {
            callback(question);
        }
    });
}


/**
 * Handles any get request on the generic resource
 */
app.get('/:resource',function(req,res){

    //Find out what resource the user is trying to access
    var resource = req.params.resource;

    //Check if the resource exists
    if(resourceExist(resource))
    {
        //Read the resources from the database
        mongoose.models[resource].find(function (err, questions) {
            if (err)
            {
                Print("Database", "Invalid data");
                res.send(httpMessages.invalid);
            }
            else
            {
                res.send(questions);
                Print("Http Server",req.method+" "+ req.url);
            }
        });
    }
    else
    {
        res.send(httpMessages.notFound);
        Print("Http Server","Returned 404 error.");
    }
});

/**
 * Handles any get request towards a specific resource
 */
app.get('/:resource/:id',function(req,res){

    //Find out what resource the user is trying to access
    var resource = req.params.resource;

    //Get the id of the resource
    var id = req.params.id;

    //Check if the resource exists
    if(resourceExist(resource))
    {
        //Read the id from the resource
        mongoose.models[resource].findOne({id:id},function (err, question) {
            if (err)
            {
                Print("Database", "Invalid data");
                res.send(httpMessages.invalid);
            }
            else
            {
                if(question != null)
                {
                    res.send(question);
                    Print("Http Server",req.method+" "+ req.url);
                }
                else
                {
                    res.send(httpMessages.notFound);
                    Print("Http Server",req.method+" "+ req.url);
                }

            }
        });
    }
    else
    {
        res.send({status:"404",message:"Resource not found on server."})
        res.send(httpMessages.notFound);
    }
});

/**
 * Check if the resource exists in the model collection
 * @param resource
 * @returns {boolean}
 */
function resourceExist(resource) {
    return mongoose.models.hasOwnProperty(resource);
}

httpApp.listen(process.env.PORT || 3000, function(){
    Print("Webserver","Listening on port:3000");
   // console.log("Listening on port: 3000");
});

function Print(source, message){
    debug.log("["+source+"]" + "\t"+message);
}


