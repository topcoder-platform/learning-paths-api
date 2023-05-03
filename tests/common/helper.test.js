const {
    checkIfExists,
    ensureNoDuplicateOrNullElements,
    ensureRequestForCurrentUser,
    ensureUserCanViewProgress,
    featureFlagSet,
    getFromInternalCache,
    hasTCAAdminRole,
    logExecutionTime,
    parseQueryParam,
    pluralize,
    setToInternalCache,
    toString,
    validateRequestPayload,
} = require('../../src/common/helper');

// use Jest to unit test hasTCAAdminRole function
describe('hasTCAAdminRole', () => {
    test('should return true if user has TCA Admin role', () => {
        const user = {
            roles: ['TCA Admin'],
        };
        expect(hasTCAAdminRole(user)).toBe(true);
    });

    test('should return false if user does not have TCA Admin role', () => {
        const user = {
            roles: ['TCA User'],
        };
        expect(hasTCAAdminRole(user)).toBe(false);
    });

    test('should return false if user does not have any role', () => {
        const user = {
            roles: [],
        };
        expect(hasTCAAdminRole(user)).toBe(false);
    });

    test('should return false if user is null', () => {
        const user = null;
        expect(hasTCAAdminRole(user)).toBe(false);
    });

    test('should return false if user is undefined', () => {
        expect(hasTCAAdminRole()).toBe(false);
    });

    test('should return false if user is empty object', () => {
        const user = {};
        expect(hasTCAAdminRole(user)).toBe(false);
    });

    test('should return false if user is empty string', () => {
        expect(hasTCAAdminRole('')).toBe(false);
    });

    test('should return false if user is empty array', () => {
        expect(hasTCAAdminRole([])).toBe(false);
    });
});

// use Jest to unit test checkIfExists function
describe('checkIfExists', () => {
    test('should throw error if source is not an array', () => {
        expect(() => checkIfExists('')).toThrow();
    });

    test('should throw error if term is not a string or array', () => {
        expect(() => checkIfExists([], {})).toThrow();
    });
});

// use Jest to unit test validateRequestPayload function
describe('validateRequestPayload', () => {
    test('should return undefined if method.schema is missing', () => {
        const method = {};
        expect(validateRequestPayload(method)).toBeUndefined();
    });
});

// use Jest to unit test ensureRequestForCurrentUser function
describe('ensureRequestForCurrentUser', () => {
    test('should throw error if currentUser.userId is undefined and reqUserId is undefined', () => {
        const currentUser = {};
        const reqUserId = undefined;
        expect(() => ensureRequestForCurrentUser(currentUser, reqUserId)).toThrow();
    });

    test('should throw if currentUser is valid but reqUserId is undefined', () => {
        const currentUser = {
            userId: '123',
        };
        const reqUserId = undefined;
        expect(() => ensureRequestForCurrentUser(currentUser, reqUserId)).toThrow();
    });

    test('should throw if currentUser is valid but reqUserId is empty string', () => {
        const currentUser = {
            userId: '123',
        };
        const reqUserId = '';
        expect(() => ensureRequestForCurrentUser(currentUser, reqUserId)).toThrow();
    });
});

// use Jest to unit test ensureNoDuplicateOrNullElements function
describe('ensureNoDuplicateOrNullElements', () => {
    test('should throw error if array contains duplicate elements', () => {
        const array = ['a', 'a'];
        expect(() => ensureNoDuplicateOrNullElements(array)).toThrow();
    });

    test('should throw error if array contains null elements', () => {
        const array = [null, null];
        expect(() => ensureNoDuplicateOrNullElements(array)).toThrow();
    });
});

// use Jest to unit test ensureUserCanViewProgress function
describe('ensureUserCanViewProgress', () => {
    test('should throw error if currentUser.userId is undefined and reqUserId is undefined', () => {
        const currentUser = {};
        const reqUserId = undefined;
        expect(() => ensureUserCanViewProgress(currentUser, reqUserId)).toThrow();
    });

    test('should throw if currentUser is valid but reqUserId is undefined', () => {
        const currentUser = {
            userId: '123',
        };
        const reqUserId = undefined;
        expect(() => ensureUserCanViewProgress(currentUser, reqUserId)).toThrow();
    });
});

// use Jest to unit test featureFlagSet function
describe('featureFlagSet', () => {
    test('should return false if feature flag is not matched', () => {
        const featureFlag = 'TCA_DATASTORE';
        const featureFlagValue = 'any value';
        expect(featureFlagSet(featureFlag, featureFlagValue)).toBe(false);
    });

    test('should return true if feature flag is matched', () => {
        const featureFlag = 'TCA_DATASTORE';
        const featureFlagValue = 'postgres';
        expect(featureFlagSet(featureFlag, featureFlagValue)).toBe(true);
    });
});

// use Jest to unit test setInternalCache and getInternalCache functions
describe('setInternalCache and getInternalCache', () => {
    test('should set and get value from internal cache', () => {
        const key = 'key';
        const value = 'value';
        setToInternalCache(key, value);
        expect(getFromInternalCache(key)).toBe(value);
    });
});

// use Jest to unit test toString function
describe('toString', () => {
    test('should return string value', () => {
        const value = 'value';
        expect(toString(value)).toBe(`'${value}'`);
    });

    test('should return string value', () => {
        const value = 1;
        expect(toString(value)).toBe(value.toString());
    });
});

// use Jest to unit test pluralize function
describe('pluralize', () => {
    test('should return pluralized word', () => {
        const word = 'word';
        const count = 2;
        expect(pluralize(count, word)).toBe(`${count} ${word}s`);
    });
});

// use Jest to unit test logExecutionTime function
describe('logExecutionTime', () => {
    test('should log execution time in milliseconds and function name', () => {
        const functionName = 'functionName';
        const startTime = new Date().getTime();
        const endTime = startTime + 1000;
        logExecutionTime(functionName, startTime, endTime);
    });
});

// use Jest to unit test parseQueryParam function
describe('parseQueryParam', () => {
    test('should parse JSON string to object', () => {
        const queryParam = '{"key":"value"}';
        expect(parseQueryParam(queryParam)).toEqual({ key: 'value' });
    });
});
