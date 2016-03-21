/**
 * Created by Steven Houben (s.houben@ucl.ac.uk) - 2016
 */

var HttpMessages = function(){
    this.notFound = {status:"404", message:"Resource not found"};
    this.ok = {status:"200", message:"Ok"};
    this.invalid = {status:"422",message:"Unprocessable Request"};
    this.badRequest = {status:"400",message:"Bad Request"};
    this.notAllowed = {status:"405",message:"Not Allowed"}
}

module.exports = HttpMessages;