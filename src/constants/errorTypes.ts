const commonErrors = {
    AlreadyInUseError: 'AlreadyInUseError',
    ArgumentError: 'ArgumentError',
    ArgumentNullError: 'ArgumentNullError',
    AuthenticationRequiredError: 'AuthenticationRequiredError',
    ConnectionError: 'ConnectionError',
    DataError: {
        MongoDBError: 'MongoDBError'
    },
    Error: 'Error',
    HttpStatusError: 'HttpStatusError',
    InvalidOperationError: 'InvalidOperationError',
    IOError: {
        DirectoryNotFoundError: 'DirectoryNotFoundError',
        DriveNotFoundError: 'DriveNotFoundError',
        EndOfStreamError: 'EndOfStreamError',
        FileLoadError: 'FileLoadError',
        FileNotFoundError: 'FileNotFoundError',
        SocketError: 'SocketError'
    },
    NotFoundError: 'NotFoundError',
    NotImplementedError: 'NotImplementedError',
    NotPermittedError: 'NotPermittedError',
    NotSupportedError: 'NotSupportedError',
    OutOfMemoryError: 'OutOfMemoryError',
    RangeError: 'RangeError',
    ReferenceError: 'ReferenceError',
    StackOverflowError: 'StackOverflowError',
    SyntaxError: 'SyntaxError',
    TimeoutError: 'TimeoutError',
    TypeError: 'TypeError',
    URIError: 'URIError',
    ValidationError: 'ValidationError'
}

export default commonErrors