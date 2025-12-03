/**
 * @swagger
 * tags:
 *   name: Games
 *   description: Firebase Authentication and Firestore operations for games
 */

/**
 * @swagger
 * /games/login:
 *   post:
 *     summary: Authenticate user with email and password
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 kind:
 *                   type: string
 *                   example: identitytoolkit#VerifyPasswordResponse
 *                 localId:
 *                   type: string
 *                   example: userId123
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 displayName:
 *                   type: string
 *                   example: John Doe
 *                 idToken:
 *                   type: string
 *                   description: Firebase ID token for authenticated requests
 *                 registered:
 *                   type: boolean
 *                   example: true
 *                 refreshToken:
 *                   type: string
 *                   description: Token used to refresh the idToken
 *                 expiresIn:
 *                   type: string
 *                   example: "3600"
 *       400:
 *         description: Missing credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 */

/**
 * @swagger
 * /games/refresh:
 *   post:
 *     summary: Refresh Firebase ID token
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token from login response
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: Same as idToken
 *                 expires_in:
 *                   type: string
 *                   example: "3600"
 *                 token_type:
 *                   type: string
 *                   example: Bearer
 *                 refresh_token:
 *                   type: string
 *                 id_token:
 *                   type: string
 *                   description: New ID token
 *                 user_id:
 *                   type: string
 *                 project_id:
 *                   type: string
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 */

/**
 * @swagger
 * /games/userinfo:
 *   post:
 *     summary: Get user information from Firebase Auth
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   example: userId123
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 emailVerified:
 *                   type: boolean
 *                   example: false
 *                 displayName:
 *                   type: string
 *                   nullable: true
 *                 photoURL:
 *                   type: string
 *                   nullable: true
 *                 disabled:
 *                   type: boolean
 *                   example: false
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     creationTime:
 *                       type: string
 *                       format: date-time
 *                     lastSignInTime:
 *                       type: string
 *                       format: date-time
 *                 providerData:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 */

/**
 * @swagger
 * /games/user-custom-token:
 *   post:
 *     summary: Generate a custom token from an ID token
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: Custom token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customToken:
 *                   type: string
 *                   description: Custom Firebase token
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 */

/**
 * @swagger
 * /games/fsread:
 *   post:
 *     summary: Read a document from Firestore
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *               - document
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token for authentication
 *               document:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Firestore document path as array
 *                 example: ["users", "userId123"]
 *     responses:
 *       200:
 *         description: Document read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Document data
 *                   additionalProperties: true
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 */

/**
 * @swagger
 * /games/fswrite:
 *   post:
 *     summary: Write a document to Firestore
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *               - document
 *               - data
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token for authentication
 *               document:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Firestore document path as array
 *                 example: ["users", "userId123"]
 *               data:
 *                 type: object
 *                 description: Data to write to the document
 *                 additionalProperties: true
 *                 example: { "name": "John Doe", "score": 100 }
 *               options:
 *                 type: object
 *                 description: Firestore write options
 *                 properties:
 *                   merge:
 *                     type: boolean
 *                     description: Merge data with existing document
 *                     default: false
 *                   mergeFields:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Specific fields to merge
 *     responses:
 *       200:
 *         description: Document written successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GamesError'
 */

/**
 * @swagger
 * /games/sendevent:
 *   post:
 *     summary: Send an analytics event to Google Analytics
 *     tags: [Games]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *               - event
 *             properties:
 *               client_id:
 *                 type: string
 *                 description: Unique identifier for the device
 *                 example: user-device-123
 *               event:
 *                 type: string
 *                 description: Event name
 *                 example: game_completed
 *               params:
 *                 type: object
 *                 description: Custom event parameters
 *                 additionalProperties: true
 *                 example: { "score": 100, "level": 5 }
 *     responses:
 *       200:
 *         description: Event sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 */

/**
 * @swagger
 * /games/man:
 *   get:
 *     summary: Get API documentation for games endpoints
 *     tags: [Games]
 *     responses:
 *       200:
 *         description: API documentation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Detailed documentation of all games endpoints
 *               additionalProperties: true
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GamesError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         code:
 *           type: string
 *           example: invalid-token
 *         name:
 *           type: string
 *           example: AuthError
 *         message:
 *           type: string
 *           example: Invalid or expired ID token
 */
