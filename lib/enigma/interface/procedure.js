/*
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
 *  o jump to the function defined in this procedure:
 *      {jump: 'NAME OF THE DESTINATED FUNCTION'}
 *  o emit an error:
 *      {error: 'ERROR NAME'}
 *    this will not terminate the session, i.e. the procedure is stopped at
 *    current question, and will wait for another try.
 *  o emit an error and terminate the procedure:
 *      {error: 'ERROR NAME', terminate: true}
 */
(function(tool){
//////////////////////////////////////////////////////////////////////////////

function procedure(taskList){
    var self = this;

    

    return this;
};


tool.set('enigma.interface.procedure', function(p){return new procedure(p);});
//////////////////////////////////////////////////////////////////////////////
})(tool);
