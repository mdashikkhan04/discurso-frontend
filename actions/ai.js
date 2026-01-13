'use server';

import { verifyAccess } from "@/lib/server/auth";
import {
  getNegotiationResponse as getResponse,
  getModeration, makeEnhancedPrompts,
  getNewNegResponse,
  getRealtimeEphemeralKey,
  makePeersFeedbacks,
  getPeerOffer,
  translateContent
} from "@/lib/server/ai";

/**
 * CORE WORKFLOW:
 * 1. Content moderation check on user input
 * 2. Case data retrieval and validation
 * 3. AI interest generation (if not existing)
 * 4. Conversation summary generation (for context)
 * 5. Behavior parameter processing and rescaling
 * 6. Prompt building using config-driven templates
 * 7. LLM response generation
 * 8. Offer extraction and scoring (if applicable)
 * 9. Automatic feedback generation (if negotiation ends)
 * 10. Message persistence
 * 
 * @param {Object} params - Complete parameter object for negotiation response generation
 * 
 * @param {string} [params.negId] - Negotiation session identifier
 *   - Type: string (UUID format recommended)
 *   - Required: No (auto-generated from userId if not provided)
 *   - Purpose: Tracks conversation history and maintains session state
 * 
 * @param {string} params.caseId - Case/scenario identifier
 *   - Type: string (database ID)
 *   - Required: Yes
 *   - Purpose: Determines negotiation context, roles, parameters, and scoring
 * 
 * @param {string} params.userQuery - Human negotiator's input message
 *   - Type: string
 *   - Required: Yes
 *   - Purpose: The human's latest negotiation message/query to respond to
 *   - Special handling: Markdown formatting stripped, ** removed
 * 
 * @param {Array<Object>} [params.pastMessages] - Conversation history
 *   - Type: Array of message objects
 *   - Required: No (empty array used if not provided)
 *   - Structure: [{ role: "user"|"ai", content: string }]
 *   - Purpose: Provides context for AI to maintain conversation continuity
 *   - Example: [
 *       { role: "user", content: "I'd like to start at $100" },
 *       { role: "ai", content: "That's quite high. How about $80?" }
 *     ]
 * 
 * @param {Array<Object>} [params.offer] - Latest offer details
 *   - Type: Array of offer items
 *   - Required: No
 *   - Structure: [{ name: string, value: string|number, id?: string }]
 *   - Purpose: Used in prompts to provide offer context and for scoring calculations
 *   - Limitations: Must match case parameter structure for scoring to work
 *   - Scoring: Only processed if case.scorable === true and scoreFormula exists
 *   - Example: [{ name: "Price", value: 100, id: "price" }, { name: "Quantity", value: 50, id: "qty" }]
 * 
 * @param {string} params.userId - User identifier for the human negotiator
 *   - Type: string (Firebase Auth UID format)
 *   - Required: Yes (throws error if missing)
 *   - Purpose: Message attribution, cost tracking, permission verification
 * 
 * @param {string} [params.aiSide] - Which side the AI plays ("a" or "b")
 *   - Type: string ("a" | "b")
 *   - Required: No (defaults to case.ai if not specified)
 *   - Purpose: Determines AI role, instructions, and interests from case data
 *   - Case mapping: "a" uses case.aInstruct/aInterest, "b" uses case.bInstruct/bInterest
 * 
 * @param {boolean} [params.isPractice] - Practice mode flag
 *   - Type: boolean
 *   - Required: No (defaults to false)
 *   - Purpose: Determines data storage location (practice vs production collections)
 *   - Storage: practice=true uses "practice" collection, false uses "messages" collection
 *   - Feedback: Practice mode returns formatted text, otherwise returns structured data
 * 
 * @param {boolean} [params.overrideEnd] - Force negotiation to end
 *   - Type: boolean
 *   - Required: No (defaults to false)
 *   - Feedback: Automatically generates feedback when overrideEnd=true
 * 
 * @param {Object} [params.behaviourParams] - AI personality/behavior configuration
 *   - Type: Object with numeric properties (1-5 scale)
 *   - Required: No (uses system defaults if not provided)
 *   - Structure: {
 *       hardOnPeople: number,     // 1=soft/collaborative, 5=harsh/competitive
 *       hardOnProblem: number,    // 1=flexible, 5=rigid on issues
 *       processDrive: number,     // 1=let others lead, 5=control process
 *       concessionsDist: number,  // 1=concede early, 5=concede late
 *       ethics: number            // 1=pragmatic, 5=highly ethical
 *     }
 *   - Defaults: { hardOnPeople: 1, hardOnProblem: 5, processDrive: 1, concessionsDist: 5, ethics: 5 }
 *   - Dynamic scaling: concessionsDist automatically adjusts based on conversation length
 * 
 * @param {boolean} [params.isBotSim] - Bot simulation mode
 *   - Type: boolean
 *   - Required: No (defaults to false)
 *   - Admin only: Regular users cannot use this parameter
 *   - Purpose: Disables message persistence and feedback generation for testing
 *   - Use case: AI vs AI simulations, testing, bulk operations
 * 
 * @param {Object} [params.llmConfig] - Language model configuration override
 *   - Type: Object with LLM settings
 *   - Required: No (uses task config defaults)
 *   - Admin only: Regular users cannot override LLM settings
 *   - Structure: {
 *       model?: string,           // LLM model name (e.g., "gpt-4.1-mini", "GEMINI=gemini-1.5-pro")
 *       maxTokens?: number,       // Response length limit
 *       temperature?: number,     // Creativity/randomness (0.0-1.0)
 *       final?: Object,          // Settings for main response generation
 *       helper?: Object          // Settings for helper tasks (summaries, extractions)
 *     }
 * 
 * @param {boolean} [params.returnExtra] - Include cost and config information in response
 *   - Type: boolean
 *   - Required: No (defaults to false)
 *   - Admin only: Regular users cannot access cost and config data
 *   - Format: Returns config and cost in response object (cumulative for all LLM calls)
 * 
 * RETURN VALUE:
 * @returns {Promise<Object>} Negotiation response object
 * 
 * Success Response Structure:
 * {
 *   answer: string,              // AI's negotiation response text
 *   negId: string,               // Session identifier (generated or provided)
 *   shouldEnd?: boolean,         // True if negotiation should end
 *   cost?: number,               // Total LLM cost (if returnExtra=true)
 *   config?: Object,             // LLM config used (if returnExtra=true)
 *   stats?: {                    // Offer scoring data (if applicable)
 *     score: number,             // Calculated score based on case formula
 *     offer: Array<Object>       // Structured offer data
 *   },
 *   feedback?: Object            // Structured feedback (if negotiation ends)
 * }
 * 
 * Content Moderation Response:
 * {
 *   indecent: true,              // Content failed moderation
 *   flags: Array<string>,        // Specific moderation flags
 *   negId: string                // Session identifier
 * }
 */
export async function getNegotiationResponse({
  negId, caseId, userQuery, pastMessages, offer, userId, aiSide, isPractice,
  overrideEnd, isBotSim, behaviourParams, llmConfig, returnExtra
}) {
  const bHasAdminConfigs = isBotSim || llmConfig || returnExtra;
  if (!(await verifyAccess(bHasAdminConfigs ? ["admin"] : ["negotiator"]))?.allowed) throw new Error("Unauthorized");
  return await getResponse({
    negId, caseId, userQuery, pastMessages, offer, userId, aiSide, isPractice,
    isBotSim, overrideEnd, behaviourParams, llmConfig, returnExtra
  });
}

/**
 * @param {string} content - Text to moderate
 *   - Type: string
 *   - Required: Yes (throws when empty or whitespace only)
 *   - Purpose: User-generated text that must be checked for policy violations
 *
 * ERROR/EDGE CASES:
 * - Throws Error("Content is empty") when input is blank
 * - Propagates errors from underlying `getModeration()` (network/API/auth)
 *
 * RETURN VALUE:
 * @returns {Promise<Object>} Moderation result
 *
 * Success Response Structure:
 * {
 *   indecent: boolean,       // true when content failed moderation
 *   flags: Array<string>     // provider-specific categories (e.g., "harassment", "hate")
 * }
 *
 * NOTES:
 * - underlying `getModeration()` currently delegates to OpenAI's moderation model (`omni-moderation-latest`).
 */
export async function moderateContent(content) {
  if (!content?.trim()) throw new Error("Content is empty");
  const { decent, flags } = await getModeration(content);
  return {
    indecent: !decent,
    flags,
  }
}

export async function getTranslation(newLanguage, originalContent) {
  const access = await verifyAccess();
  if (!access?.allowed) throw new Error("Unauthorized");
  return await translateContent({ content: originalContent, language: newLanguage, userId: access.uid });
}

/**
 * PEER-TO-PEER FEEDBACK GENERATION:
 * 1. Event and round validation using eventId and round number
 * 2. Case data retrieval from round configuration
 * 3. P2P message history retrieval using negId array
 * 4. User identification and team mapping validation (exactly 2 users required)
 * 5. Match data resolution to determine negotiation sides (a/b assignment)
 * 6. Individual feedback generation for each participant using standard feedback pipeline
 * 7. Parallel processing with structured feedback storage
 * 
 * @param {Object} params - P2P feedback generation parameters
 * 
 * @param {string} params.eventId - Event identifier containing team and match data
 *   - Type: string (database ID)
 *   - Required: Yes
 *   - Purpose: Links to event structure with teams, participants, and round matches
 *   - Validation: Must exist in events collection with valid rounds array
 * 
 * @param {number|string} params.round - Round number within the event
 *   - Type: number or string (converted to number)
 *   - Required: Yes (defaults to 1 if not provided)
 *   - Purpose: Identifies specific round data and match configurations
 *   - Format: 1-indexed (round 1 = index 0 in rounds array)
 *   - Validation: Must exist as valid round in event.rounds array
 * 
 * @param {Array<string>|string} params.negId - Negotiation session identifier(s)
 *   - Type: Array of strings or single string
 *   - Required: Yes
 *   - Purpose: Identifies P2P conversation(s) in p2pMessages collection
 *   - Format: Array for multiple related sessions, string for single session
 *   - Validation: Must have messages from exactly 2 unique users
 * 
 * @param {string} [params.llmModel] - Language model override for feedback generation
 *   - Type: string (model identifier like "OPENAI=gpt-4o", "GOOGLE=gemini-2.5-pro")
 *   - Required: No (uses task config default "negotiation_performance_feedback")
 *   - Admin only: Regular users cannot override LLM model
 *   - Purpose: Controls feedback quality and cost (higher models = better analysis)
 * 
 * RETURN VALUE:
 * @returns {Promise<Object>} User feedback mapping
 * 
 * Success Response Structure:
 * {
 *   [userId1]: feedbackId1,     // Database ID of generated feedback for user 1
 *   [userId2]: feedbackId2      // Database ID of generated feedback for user 2
 * }
 * 
 * Example:
 * {
 *   "user123": "feedback_abc_def",
 *   "user456": "feedback_ghi_jkl"
 * }
 */
export async function makeP2PFeedbacks({ eventId, round, negId, llmModel, messages, sides }) {
  if (!(await verifyAccess(llmModel ? ["admin"] : ["negotiator"]))?.allowed) throw new Error("Unauthorized");
  return await makePeersFeedbacks({ eventId, round, negId, llmModel, messages, sides });
}

/**
 * PEER-TO-PEER OFFER EXTRACTION:
 * 1. Case and message data retrieval using caseId and negId
 * 2. Message formatting with anonymized side labels (Side A/Side B)
 * 3. Deal parameter structure extraction from case configuration
 * 4. LLM-powered offer extraction using "latest_offer_extraction" task config
 * 5. JSON parsing and validation of extracted offer structure
 * 6. Cost tracking for billing/usage monitoring
 * 
 * @param {Object} params - P2P offer extraction parameters
 * 
 * @param {Array<string>|string} params.negId - Negotiation session identifier(s)
 *   - Type: Array of strings or single string
 *   - Required: Yes
 *   - Purpose: Identifies P2P conversation in p2pMessages collection
 *   - Format: Array for multiple IDs, string for single ID
 *   - Validation: Must contain messages from negotiation participants
 * 
 * @param {string} params.caseId - Case ID
 *   - Type: string (database ID)
 *   - Required: Yes
 *   - Purpose: Provides deal parameters and structure for offer extraction
 *   - Validation: Must exist in cases collection with valid params array
 * 
 * @param {string} params.userId - User identifier for billing and permissions
 *   - Type: string (Firebase Auth UID)
 *   - Required: Yes
 *   - Purpose: Safety and monitoring
 * 
 * @param {string} [params.llmModel] - Language model override for extraction
 *   - Type: string (model identifier like "OPENAI=gpt-4o", "GOOGLE=gemini-2.5-pro")
 *   - Required: No (uses task config default "latest_offer_extraction")
 *   - Admin only: Regular users cannot override LLM model
 *   - Purpose: Controls extraction accuracy and cost
 * 
 * EXPECTED OFFER STRUCTURE:
 * - LLM returns JSON with "items" array containing offer parameters
 * - Each item: { name: string, value: string|number, id?: string }
 * - Must match case parameter structure for consistency
 * 
 * RETURN VALUE:
 * @returns {Promise<Object>} Extracted offer with cost information
 * 
 * Success Response Structure:
 * {
 *   offer: Array<Object>,       // Structured offer parameters
 *   cost: number               // LLM processing cost
 * }
 * 
 * Offer Array Structure:
 * [
 *   { name: "Price", value: 100, id: "price" },
 *   { name: "Quantity", value: 50, id: "qty" },
 *   { name: "Delivery", value: "2 weeks", id: "delivery" }
 * ]
 */
export async function getP2POffer({ negId, caseId, userId, llmModel }) {
  if (!(await verifyAccess(llmModel ? ["admin"] : ["negotiator"]))?.allowed) throw new Error("Unauthorized");
  return await getPeerOffer({ negId, caseId, userId, llmModel });
}

export async function getRealtimeKey({ caseId, userId, aiModel, aiSide, behaviourParams, withAudio, voice }) {
  await verifyAccess(["negotiator"]);
  return await getRealtimeEphemeralKey({ caseId, userId, aiModel, aiSide, behaviourParams, withAudio, voice });
}

export async function enhancePrompts({ originalPrompts, userRequest, userId, extraData }) {
  if (!(await verifyAccess(["admin"]))?.allowed) throw new Error("Unauthorized");
  return await makeEnhancedPrompts(originalPrompts, userRequest, userId, extraData);
}

// this is a new version of getNegotiationResponse with some changes in the underlying function
export async function getNewNegotiationResponse(...data) {
  if (!(await verifyAccess(["admin"]))?.allowed) throw new Error("Unauthorized");
  return await getNewNegResponse(data);
}