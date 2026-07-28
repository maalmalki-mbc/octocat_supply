/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       required:
 *         - profileId
 *         - userId
 *         - firstName
 *         - lastName
 *         - email
 *       properties:
 *         profileId:
 *           type: integer
 *           description: The unique identifier for the profile
 *         userId:
 *           type: string
 *           description: The associated user identifier
 *         firstName:
 *           type: string
 *           description: First name of the user
 *         lastName:
 *           type: string
 *           description: Last name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user
 *         phone:
 *           type: string
 *           description: Phone number of the user
 *         bio:
 *           type: string
 *           description: Short biography or description of the user
 *         avatarUrl:
 *           type: string
 *           description: URL to the user's avatar image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the profile was created
 */
export interface Profile {
  profileId: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  avatarUrl: string;
  createdAt: string;
}
