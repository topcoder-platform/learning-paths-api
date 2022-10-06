/**
 * Initializes the env vars required for the script
 * 
 * @param {Array<string>} requiredParams The list of env params that are required
 * @param {Array<string>} outputNames The list of names to be assigned to the env
 * params on output
 * 
 */
function initializeEnvironmentParams(requiredParams, outputNames) {

    const missingParam = requiredParams
        .find(param => !process?.env?.[param])

    if (!!missingParam) {
        throw new Error(`The ${missingParam} is not defined for the environment.`)
    }

    const output = {}
    outputNames
        .forEach((paramName, index) => {
            output[paramName] = process.env[requiredParams[index]]
        })

    return output
}

module.exports = {
    initializeEnvironmentParams,
}
