/**
 * Controller for certification progress endpoints
 */
const { StatusCodes } = require('http-status-codes')
const service = require('../services/CertificationProgressService')
const helper = require('../common/helper')

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
    const result = await service.getCertificationProgress(req.params.userId, req.params.certification)
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
        req.params.userId,
        req.params.certification,
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
        req.params.userId,
        req.params.certification,
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
    searchCertificationProgresses,
    getCertificationProgress,
    updateCertificationProgress,
    updateCurrentLesson,
    completeLesson
}
