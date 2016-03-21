/**
 * Created by Steven Houben (s.houben@ucl.ac.uk) - 2016
 */

function Entity(){

    this.text = "This is the text used for the question";
    this.category = new Array();
    this.replies = new Array();
    this.condition = new Condition();
    this.tag = "empy tag";
    this.id = -1;

}

module.exports = Entity;