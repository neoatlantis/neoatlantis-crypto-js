/*
 * Enigma Object Encoding/Decoding
 * ===============================
 *
 * Outputs of `identity.js` and `message.js` are instances of this encoder.
 * This a quasi-generic encoder dealing with serialization/deserialization of
 * mentioned messages. Binary or Base64 represented output can be selected
 * in such instances.
 *
 * It is also able to read in any input and decide, if it contains an `Enigma`
 * generated input. The reading and decoding such inputs will be then done.
 */
