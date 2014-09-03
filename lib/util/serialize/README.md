Enigma Defined Serialization
============================

This is a standard or description for only this program: Enigma. A
deterministical serialization should be designed. And it is not aimed to be
multi-purposes. To ease the usage, a structure of such data structures are
key-valued. But the serialization result contains only the structure and the
data. If the deserialization successes, the keys are re-assigned.

It is also decided, that the maximal capacity of the element in this data
structure will not exceed a length of 4GBytes, whose length will be the max. of
a representation of unsigned 32-bit integer. Considering that our program have
a really slow encryption speed, this should be acceptable. Files larger than
that should have been encrypted with something quicker and this program should
have been in this purpose only used as a transmission of the encryption key.

Data Types
----------

### binary

This a serial of bytes not exceeding 65535 in length. Its representation in
this program will be the `Buffer`.

Designed for carrying short data such as signatures.

### longBinary

This is a serial of bytes not exceeding (2^32-1) Bytes(about 4 GBytes) in
length. Its representation in this program will be the `Buffer`.

Designed for carrying final data file. 

### enum

This provides a notation of enumerating collection with max. 255 items. All
their names are pre-defined in the data structure.

### boolean

This provides a record of a boolean value, either True or False.

### datetime

This provides the recording of a timestamp.

### array

This provides an array __of `shortBinary`__ with max. 255 items. As returning
value there will be an array of `Buffer`.

This is designed to contain either short binaries, or to carry other small
objects.



Serialized Format
-----------------

The serialized format does NOT carry format info. To read a piece of data,
you have to firstly know its data structure.

It is simply a conjunction of pieces. Each piece is a pack result of an
element, and their total order is decided by ordered keys in definition.

Typically, each piece is a conjunction of a prefix and data. The prefix, whose
length defined by the data structure, carries information to deserialize.

Usage
-----

1. Initialize a serializer with given data structure:
    
    var signature = $.tools.serial({
        'key1': 'boolean',
        'key2': 
    });
