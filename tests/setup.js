const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const noisyErrorPatterns = [
    /ValidationError:/,
    /SyntaxError: Unexpected end of JSON input/,
];

let consoleErrorSpy;

beforeAll(async () => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
        const message = args.map((arg) => String(arg)).join(' ');
        if (noisyErrorPatterns.some((pattern) => pattern.test(message))) {
            return;
        }
        consoleErrorSpy.mockRestore();
        //console.error(...args);
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    mongoServer = await MongoMemoryServer.create();

    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
});

afterEach(async () => {
    const collections = mongoose.connection.collections;

    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
        await mongoServer.stop();
    }

    if (consoleErrorSpy) {
        consoleErrorSpy.mockRestore();
    }
});