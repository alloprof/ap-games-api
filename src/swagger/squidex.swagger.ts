/**
 * @openapi
 * /squidex/config:
 *   get:
 *     tags:
 *       - Squidex
 *     summary: Get Squidex configuration
 *     description: Returns Squidex configuration information (for debugging/testing)
 *     responses:
 *       200:
 *         description: Configuration information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 graphqlUrl:
 *                   type: string
 *                   example: https://cloud.squidex.io/api/content/{{app}}/graphql
 *                 identUrl:
 *                   type: string
 *                   example: https://cloud.squidex.io/identity-server
 *                 app:
 *                   type: string
 *                   example: exercisers
 *                 exercisersGraphUrl:
 *                   type: string
 *                   example: https://cloud.squidex.io/api/content/exercisers/graphql
 */

/**
 * @openapi
 * /squidex/content/{schema}:
 *   get:
 *     tags:
 *       - Squidex
 *     summary: Get content list from schema
 *     description: Retrieve a list of content items from a Squidex schema with optional filtering and pagination. Supports multiple Squidex apps via the app parameter.
 *     parameters:
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/top'
 *       - $ref: '#/components/parameters/skip'
 *       - $ref: '#/components/parameters/filter'
 *       - $ref: '#/components/parameters/orderby'
 *     responses:
 *       200:
 *         description: List of content items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContentList'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags:
 *       - Squidex
 *     summary: Create new content
 *     description: Create a new content item in the specified schema
 *     parameters:
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/publish'
 *       - name: id
 *         in: query
 *         required: false
 *         description: Custom content ID (optional)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Content data following the schema structure
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *           example:
 *             title:
 *               iv: "Example Exercise"
 *             difficulty:
 *               iv: "easy"
 *             description:
 *               iv: "This is an example exercise"
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /squidex/content/{schema}/{id}:
 *   get:
 *     tags:
 *       - Squidex
 *     summary: Get content by ID
 *     description: Retrieve a single content item by its ID
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Content item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     tags:
 *       - Squidex
 *     summary: Update content (full update)
 *     description: Perform a full update of a content item (replaces all fields)
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *       - $ref: '#/components/parameters/expectedVersion'
 *     requestBody:
 *       required: true
 *       description: Complete content data
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *           example:
 *             title:
 *               iv: "Updated Exercise"
 *             difficulty:
 *               iv: "medium"
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     tags:
 *       - Squidex
 *     summary: Update content (partial update)
 *     description: Perform a partial update of a content item (updates only specified fields)
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *       - $ref: '#/components/parameters/expectedVersion'
 *     requestBody:
 *       required: true
 *       description: Partial content data (only fields to update)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *           example:
 *             difficulty:
 *               iv: "hard"
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags:
 *       - Squidex
 *     summary: Delete content
 *     description: Delete a content item (soft delete by default, can be permanent)
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *       - $ref: '#/components/parameters/permanent'
 *     responses:
 *       204:
 *         description: Content deleted successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /squidex/content/{schema}/{id}/publish:
 *   put:
 *     tags:
 *       - Squidex
 *     summary: Publish content
 *     description: Change content status to published
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Content published successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /squidex/content/{schema}/{id}/unpublish:
 *   put:
 *     tags:
 *       - Squidex
 *     summary: Unpublish content
 *     description: Change content status to draft (unpublished)
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Content unpublished successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /squidex/content/{schema}/{id}/archive:
 *   put:
 *     tags:
 *       - Squidex
 *     summary: Archive content
 *     description: Move content to archived status
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Content archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /squidex/content/{schema}/{id}/restore:
 *   put:
 *     tags:
 *       - Squidex
 *     summary: Restore archived content
 *     description: Restore content from archived status to draft
 *     parameters:
 *       - $ref: '#/components/parameters/app'
 *       - $ref: '#/components/parameters/schema'
 *       - $ref: '#/components/parameters/id'
 *     responses:
 *       200:
 *         description: Content restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SquidexContent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
