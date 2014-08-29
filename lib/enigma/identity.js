/*
 * Enigma Identity Class
 * =====================
 *
 * In `Enigma`, an identity is a public key bound with a description. It is
 * always self-signed(this is the only signature that exists in Enigma system
 * and doesn't follow the standard format of signing--the signing in message).
 *
 * To initialize a class, 2 ways are provided:
 *  1 by generating an identity. Providing description and selecting algorithm.
 *  2 by providing a serialized public/private part of identity. A passphrase
 *    will be required, when a private part is given.
 *
 * After initialization, public identity part will be always ready to export.
 * The private part will be able to export, only when the initialization is
 * done by generation or by providing a private part. Either way, another
 * passphrase for protecting the private part is required.
 *
 * The identity is also ready for encryption/decryption/signing/verifying based
 * on how it is generated.
 */
