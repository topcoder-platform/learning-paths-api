/**
 * Controller for certification progress endpoints
 */
const { StatusCodes } = require('http-status-codes')
const service = require('../services/CertificationProgressService')
const helper = require('../common/helper')

/**
 * Start a certification for a user
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function startCertification(req, res) {
    const result = await service.startCertification(
        req.params.userId,
        req.body)

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
        req.params.certificationProgressId)

    res.send(result)
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

    res.send(result.result)
}

/**
 * Get certification progress for a particular user and certification
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getCertificationProgress(req, res) {
    const result = await service.getCertificationProgress(
        req.params.certificationProgressId)

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
        req.params.certificationProgressId,
        req.body)

    res.send(result)
}

/**
 * Complete a lesson
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function completeLesson(req, res) {
    const result = await service.completeLesson(
        req.params.certificationProgressId,
        req.body)

    res.send(result)
}

/**
 * Update a user's certification and course progress
 * 
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function updateCertificationProgress(req, res) {
    const result = await service.updateCertificationProgress(
        req.params.userId,
        req.params.certification,
        req.body)
    res.send(result)
}

module.exports = {
    completeCertification,
    completeLesson,
    getCertificationProgress,
    searchCertificationProgresses,
    startCertification,
    updateCertificationProgress,
    updateCurrentLesson,
}
