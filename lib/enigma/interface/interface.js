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
function procedure(taskList, translator, validator){
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

    // preassigned variables
    var preassigned = {};
    this.assign = function(n, v){
        preassigned[n] = v;
        return self;
    };

    
    function emit(type, a, b){
        for(var i in callbacks[type]) callbacks[type][i](a, b);
    };

    // shift function
    var cancelled = false;
    var pointer = 0, previousData = null, gotAnswer = null;
    function shift(){
        delete self.answer;
        delete self.cancel;

        if(pointer >= taskList.length || cancelled)
            return emit('terminated', previousData);

        var result = taskList[pointer](previousData, gotAnswer);
        if(!type(result).isObject())
            throw new Error('Result is not an object.');

        // data question jump error terminate

        previousData = result.data || null;

        if(result.error){
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
            var question = {
                id: result.question,
                description: translator.question(result.question),
            };
            emit('question', question);
            self.answer = function(ans){
                if(!validator(result.question, ans)){
                    emit('question', question);
                    return false;
                };
                gotAnswer = ans;
                pointer++;
                shift();
                return true;
            };
            self.cancel = function(){
                cancelled = true;
                shift();
            };
            
            if(preassigned[result.question])
                return self.answer(preassigned[result.question]);
        } else if(result.terminate){
            emit('terminated', previousData);
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
        if(loadAPI.indexOf(apiName) < 0) throw new Error('Unknown API');
        
    };
};

tool.exp('enigma.interface', initializer);
//////////////////////////////////////////////////////////////////////////////
})(tool);
