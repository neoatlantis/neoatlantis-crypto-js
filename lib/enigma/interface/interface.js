/*
 * Interface of enigma high-level interface
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////
var loadAPI = [
    'identity-list',
    'identity-generate',
    'identity-import',
    'identity-export',
    'identity-delete',

    'message-write',
    'message-read',
];

/*****************************************************************************
 *
 * Provides a procedure constructor, which is the template of all sessions
 * =======================================================================
 *
 * Procedures are lists of functions, each function has following signature:
 *
 *   function(data)
 *
 * the functions within a list will be executed from the beginning. The
 * returned value of previous functions are excepted to be one of the following
 * styles:
 *  o continue proceeding to the next function:
 *      {data: ...}
 *  o pause proceeding and ask another question:
 *      {question: 'QUESTION NAME'}
 *    this may also be used as prompting an alarm, or info, whose expected
 *    answer may be anything.
 *  o jump to the function defined in this procedure:
 *      {jump: 'NAME OF THE DESTINATED FUNCTION'}
 *  o emit an error:
 *      {error: 'ERROR NAME'}
 *    this will not terminate the session, i.e. the procedure is stopped at
 *    current question, and will wait for another try.
 *  o emit an error and terminate the procedure:
 *      {error: 'ERROR NAME', terminate: true}
 */
function procedure(taskList, translator, validator, variableTypes, errorList){
    // translator: map a given id into localized string
    // validator: given a question ID, and an answer, validate the value
    //            against according rules
    var self = this;

    var index = {};
    var type = tool.get('util.type');

    // index all functions with names to enable jumping feature
    var regexp = /^function\s([0-9a-z\_]+)\(/i, regexec, funcname;
    for(var i in taskList){
        if(!type(taskList[i]).isFunction())
            throw new Error('Non function defined.');
        regexec = regexp.exec(taskList[i].toString());
        if(!regexec) continue;
        funcname = regexec[1];
        index[funcname] = i;
    };


    // callback register
    var callbacks = {error: [], question: [], terminated: []};
    this.onError = function(callback){
        callbacks.error.push(callback);
    };
    this.onQuestion = function(callback){
        callbacks.question.push(callback);
    };
    this.onTerminated = function(callback){
        callbacks.terminated.push(callback);
    };
    function emit(type, a, b){
        for(var i in callbacks[type]) callbacks[type][i](a, b);
    };


    // preassigned variables
    var preassigned = {};
    this.assign = function(n, v){
        preassigned[n] = v;
        return self;
    };


    // shift function
    var cancelled = false;
    var pointer = 0, previousData = {}, gotAnswers = {};
    function shift(){
        delete self.answer;
        delete self.cancel;

        if(pointer >= taskList.length || cancelled)
            return emit('terminated', previousData);

        var result = taskList[pointer](previousData, gotAnswers);
        if(!type(result).isObject())
            throw new Error('Result is not an object.');

        // copy result.data items into data
        if(type(result.data).isObject()){
            for(var key in result.data)
                previousData[key] = result.data[key];
        };

        // allowed attributes: data question jump error terminate

        if(result.error){
            if(errorList.indexOf(result.error))
                throw new Error('Undeclared error being thrown.');

            var error = {
                id: result.error,
                description: translator.error(result.error),
            };
            emit('error', error);
        };
        if(result.jump){
            var dest = index[result.jump];
            if(!dest) throw new Error('Jump destination unknown.');
            pointer = dest;
            shift();
        } else if(result.question){
            if(!variableTypes[result.question])
                throw new Error('Undeclared question being asked.');

            var question = {
                id: result.question,
                description: translator.question(result.question),
                type: variableTypes[result.question],
                hint: result.hint || undefined,
            };
            emit('question', question);

            (function(questionID){
                self.validate = function(ans){
                    return validator(questionID, ans);
                };
                self.answer = function(ans){
                    if(!validator(questionID, ans)){
                        emit('question', question);
                        return false;
                    };
                    gotAnswers[questionID] = ans;
                    pointer++;
                    shift();
                    return true;
                };
                self.cancel = function(){
                    cancelled = true;
                    shift();
                };
            })(result.question);
            
            if(preassigned[result.question])
                return self.answer(preassigned[result.question]);
        } else if(undefined !== result.terminate){
            emit('terminated', result.terminate);
        } else {
            pointer++;
            shift();
        };
    };

    // starter, to start the procedure
    this.start = function(){
        // binding listeners are now no longer possible
        delete self.onError;
        delete self.onQuestion;
        delete self.onTerminated;
        
        delete self.assign;
        delete self.start;
        shift();
    };

    return this;
};

/****************************************************************************/

function initializer(options){
    var translator = options.translator,
        storage = options.storage;

    if(!(translator && storage))
        throw new Error('Missing components for initialization.');

    return function(apiName){
        var type = tool.get('util.type');
        if(loadAPI.indexOf(apiName) < 0) throw new Error('Unknown API');
        
        var api = tool.get('enigma.interface.api.' + apiName);
        if(!api) throw new Error('API not exists or not loaded.');

        // load declared variables and errors that may be asked/emitted.
        var variables = api.variables, errors = api.errors;

        // build variable type list
        var variableTypes = {};
        for(var i in variables){
            if(type(variables[i]).isString())
                variableTypes[i] = variables[i];
            else if(type(variables[i]).isArray())
                variableTypes[i] = variables[i][0];
            else
                variableTypes[i] = variables[i].type;
        };

        // build a validator
        var validator = function(name, value){
            var desc = variables[name];

            function isType(t, value){
                if('string' === t) return type(value).isString();
                else if('boolean' === t) return type(value).isBoolean();
                else if('number' === t) return type(value).isNumber();
                else if('date' === t) return type(value).isDate();
                else if(type(t).isArray()){
                    if('enum' == t[0]) return t[1].indexOf(value) >= 0;
                };
                
                throw new Error('Unknown type descriptor');
            };

            var typeTest = type(desc);

            // variable type specified by a string
            if(typeTest.isString() || typeTest.isArray())
                return isType(desc, value);

            // variable validity specified by an object, with type specified
            // and function defined
            if(typeTest.isObject()){
                if(!isType(desc.type, value)) return false;
                if(!desc.validate(value)) return false;
                return true;
            };

            throw new Error('Unknown variable descriptor');
        };

        // build a logger
        var logStart = new Date().getTime();
        var log = function(text){
            var time = (new Date().getTime() - logStart) / 1000;
            console.log('[' + apiName + '][' + time + '] ' + text);
        };

        var taskList = api.constructor(storage, log);
        var session = new procedure(
            taskList,
            translator,
            validator,
            variableTypes,
            errors
        );

        return session;
    };
};

tool.exp('enigma.interface', initializer);
//////////////////////////////////////////////////////////////////////////////
})(tool);
