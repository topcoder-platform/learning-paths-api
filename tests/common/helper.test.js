const {
    autoWrapExpress,
    checkIfExists,
    ensureNoDuplicateOrNullElements,
    ensureRequestForCurrentUser,
    ensureUserCanViewProgress,
    featureFlagSet,
    getFromInternalCache,
    hasTCAAdminRole,
    logExecutionTime,
    logExecutionTime2,
    parseQueryParam,
    pluralize,
    setToInternalCache,
    toString,
    validateRequestPayload,
    wrapExpress,
    setResHeaders,
    getUserDataFromEmail,
    postBusEvent,
    getMultiMemberDataFromIdM2M,
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

    test('should work if term is a string', () => {
        const source = ['a', 'b', 'c'];
        const term = 'a';
        expect(checkIfExists(source, term)).toBe(true);
    });

    test('should work if term is an array', () => {
        const source = ['a', 'b', 'c'];
        const term = ['a', 'b'];
        expect(checkIfExists(source, term)).toBe(true);
    });

    test('should return false if term is not found in source', () => {
        const source = ['a', 'b', 'c'];
        const term = 'd';
        expect(checkIfExists(source, term)).toBe(false);
    });
});

// use Jest to unit test validateRequestPayload function
describe('validateRequestPayload', () => {
    test('should return undefined if method.schema is missing', () => {
        const method = {};
        expect(validateRequestPayload(method)).toBeUndefined();
    });

    test('should throe error if method.schema is invalid', () => {
        const method = {
            schema: {},
        };
        expect(() => validateRequestPayload(method)).toThrow();
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

    test('should ensure the current user matches the user whose data is being requested', () => {
        const currentUser = {
            userId: '123',
        };
        const reqUserId = '123';
        expect(ensureRequestForCurrentUser(currentUser, reqUserId)).toBe(true);
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

    test('should ensure there are no duplicate or null elements in given array', () => {
        const array = ['a', 'b'];
        expect(ensureNoDuplicateOrNullElements(array)).toBeUndefined();
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

    test('should sanitize string object with array value and return array value', () => {
        const value = ['value'];
        expect(toString(value)).toBe(`[ '${value}' ]`);
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

// use Jest to unit test wrapExpress function
describe('wrapExpress', () => {
    test('should return function', () => {
        const func = () => { };
        expect(typeof wrapExpress(func)).toBe('function');
    });

    test('should Wrap async function to standard express function with error handling', async () => {
        const func = async () => {
            throw new Error('error');
        };
        const wrappedFunc = wrapExpress(func);
        const req = {};
        const res = {};
        const next = jest.fn();
        await wrappedFunc(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

// use Jest to unit test autoWrapExpress function
describe('autoWrapExpress', () => {
    test('should return function', () => {
        const func = () => { };
        expect(typeof autoWrapExpress(func)).toBe('function');
    });

    test('should Wrap async function to standard express function with error handling', async () => {
        const func = async () => {
            throw new Error('error');
        };
        const wrappedFunc = autoWrapExpress(func);
        const req = {};
        const res = {};
        const next = jest.fn();
        await wrappedFunc(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    test('should Wrap array of async functions to standard express function with error handling', async () => {
        const func = async () => {
            throw new Error('error');
        };
        const wrappedFunc = autoWrapExpress([func, func]);
        const req = {};
        const res = {};
        const next1 = jest.fn();
        await wrappedFunc[0](req, res, next1);
        expect(next1).toHaveBeenCalled();
        const next2 = jest.fn();
        await wrappedFunc[0](req, res, next2);
        expect(next2).toHaveBeenCalled();
    });

    test('should Wrap object of async functions to standard express function with error handling', async () => {
        const func = async () => {
            throw new Error('error');
        };
        const wrappedFunc = autoWrapExpress({ func });
        const req = {};
        const res = {};
        const next = jest.fn();
        await wrappedFunc.func(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});

// use Jest to unit test setResHeaders function
describe('setResHeaders', () => {
    test('should set response headers from result', () => {
        const result = {
            total: 10,
            perPage: 5,
            page: 2
        };
        const res = {
            set: jest.fn(),
        };
        setResHeaders({}, res, result);
        expect(res.set).toHaveBeenCalledWith('X-Total', result.total);
        expect(res.set).toHaveBeenCalledWith('X-Prev-Page', result.page - 1);
    });

    test('should set response headers from result to X-Next-Page', () => {
        const result = {
            total: 10,
            perPage: 5,
            page: 1
        };
        const res = {
            set: jest.fn(),
        };
        setResHeaders({}, res, result);
        expect(res.set).toHaveBeenCalledWith('X-Next-Page', result.page + 1);
    });
});

// use Jest to unit test getUserDataFromEmail function
describe('getUserDataFromEmail', () => {
    test('should throw if email is not provided', async () => {
        const email = undefined;
        await expect(getUserDataFromEmail(email)).rejects.toThrow();
    });
});

// use Jest to unit test logExecutionTime2 function
describe('logExecutionTime2', () => {
    test('should log execution time in milliseconds and function name', () => {
        const functionName = 'functionName';
        const startTime = new Date().getTime();
        const endTime = startTime + 1000;
        logExecutionTime2(functionName, startTime, endTime);
    });
});

// use Jest to unit test postBusEvent function
describe('postBusEvent', () => {
    test('should throw without credentials', async () => {
        const credentials = undefined;
        await expect(postBusEvent(credentials)).rejects.toThrow();
    });
});

// use Jest to unit test getMultiMemberDataFromIdM2M function
describe('getMultiMemberDataFromIdM2M', () => {
    test('should throw without credentials', async () => {
        const credentials = undefined;
        await expect(getMultiMemberDataFromIdM2M(credentials)).rejects.toThrow();
    });
});