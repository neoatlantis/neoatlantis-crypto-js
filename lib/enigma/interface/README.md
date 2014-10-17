An Interface for using Enigma Properly
======================================

This interface provides a factory function, which, when called, returns an
session object. This represents a very high-level model for using this library.

Although very low-level functions like generating random bytes or doing
symmetric or asymmetric key exchange can be done with exposed functions in this
library, it is not so easy to design a crypto-system entirely. Enigma aims
at copying the ideas like GPG and do improvements that are seen as necessary
by the author. The result should be therefore a system consisting of following
tasks:

* identity storage management:
    * listing local stored identities
    * generation of private identities
    * importing of new identities, either public or private
    * exporting identities, either public or private
    * deleting identities
* message related jobs:
    * accept user composed message, and:
        * encrypt it to one or more another identity, and/or
        * sign the message with one local private identity
    * accept incoming message, and:
        * decrypt, when necessary, the given message using one local private
          identity that's listed in the message body
        * if the message carries a signature, verify it

All above tasks consists of procedures that may not always proceed till the
end. Exceptions always exists.

This interface provides an implementation of above named system. By using this
interface, your task is no more than writing an user-friendly interface for it,
which is ready to prompt the user for questions that are asked by this library,
show translated exceptions, terminate the unproceedable sessions, or display
the result(NOTE that outputs of this library are still buffer. Packaging and
unpackaging them properly is your task but also freedom).


Usage
=====

### 1. Configure the interface

It's a pity that you have to firstly configure this interface(a lot). Only so
will you be rewarded with the factory function that generates session
instances. Following lists all requirements. They are not options. They must be
assigned properly(on your behave).

#### 1.1 Translation

All outputs of this library **must** be translated into your language. You are
required to set the `translation` as an assocative array.

#### 1.2 Provide a HTML5 `localStorage` compatiable data store

The system utilizes the standard `localStorage` API to store all its data. You
are responsible to provide a `localStorage` compatiable storing component.


### 2. Understanding the inputs and outputs

The session instance returned by this interface as an answer to the call with
an API name, can be imaginated as a form to be filled. The instance asks for
value of each item, and you just forward such requests to the user and
interprete its description. Each kind of item has a name and a description. So
does exceptions emitted by the same.

You may assign some of the variables in advance. For example, if you want a
centeralized management of private identities instead of asking user for each
use of a private identity, you may design your own encrypted storage and assign
the PIN with a constant.


