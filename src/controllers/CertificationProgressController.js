/**
 * Controller for certification progress endpoints
 */

const progressService = require('../services/CertificationProgressService')
const fccService = require('../services/FccCertificationProgressServices')

const helper = require('../common/helper')
const dbHelper = require('../common/dbHelper')

// Switch between DynamoDB and PostgreSQL-based services
let service;
if (dbHelper.featureFlagUsePostgres()) {
    service = fccService;
} else {
    service = progressService;
}

/**
 * Search certification progress
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function searchCertificationProgresses(req, res) {
    const result = await service.searchCertificationProgresses(req.query)
    helper.setResHeaders(req, res, result)

    res.send(result)
}

/**
 * Get certification progress for a particular user and certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCertificationProgress(req, res) {
    const result = await service.getCertificationProgress(
        req.authUser.userId,
        req.params.certificationProgressId)

    res.send(result)
}

/**
 * Delete certification progress for a particular user and certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function deleteCertificationProgress(req, res) {
    const result = await service.deleteCertificationProgress(
        req.authUser,
        req.params.certificationProgressId)

    res.send(result)
}

/**
 * Delete the last completed lesson in a module in a certification 
 * progress for a particular user and certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function deleteLastModuleLesson(req, res) {
    const result = await progressService.deleteLastModuleLesson(
        req.authUser,
        req.params.certificationProgressId,
        req.params.module)

    res.send(result)
}

/**
 * Start a certification for a user
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function startCertification(req, res) {
    const result = await service.startCertification(
        req.authUser,
        req.params.userId,
        req.params.certificationId,
        req.params.courseId,
        req.query)

    res.send(result)
}

/**
 * Complete a certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function completeCertification(req, res) {
    const result = await service.completeCertification(
        req.authUser,
        req.params.certificationProgressId,
        req.query.certificateUrl,
        req.query.certificateElement,
        helper.parseQueryParam(req.query.certificateAlternateParams))
    res.send(result)
}

/**
 * Update the current lesson
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function updateCurrentLesson(req, res) {
    const result = await service.updateCurrentLesson(
        req.authUser,
        req.params.certificationProgressId,
        req.query)

    res.send(result)
}

/**
 * Complete a lesson
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function completeLesson(req, res) {
    const result = await progressService.completeLesson(
        req.authUser,
        req.params.certificationProgressId,
        req.query)

    res.send(result)
}

/**
 * Complete a lesson via data from a MongoDB update trigger
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function completeLessonViaMongoTrigger(req, res) {
    const result = await progressService.completeLessonViaMongoTrigger(req.query)

    res.send(result)
}

/**
 * Accept the academic honesty policy for a certification/course
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function acceptAcademicHonestyPolicy(req, res) {
    const result = await service.acceptAcademicHonestyPolicy(
        req.authUser,
        req.params.certificationProgressId)

    res.send(result)
}

module.exports = {
    acceptAcademicHonestyPolicy,
    completeCertification,
    completeLesson,
    completeLessonViaMongoTrigger,
    deleteCertificationProgress,
    deleteLastModuleLesson,
    getCertificationProgress,
    searchCertificationProgresses,
    startCertification,
    updateCurrentLesson,
}
