# serverlessAuth

This is just a coding example project showcasing my ability to write ES6+ code for a backend NodeJS Express API that can be deployed to AWS via serverless.com's utilities.

There is a .env file that has a sample MongoDB test DB setup for the time beihg.
I will remove that DB if too much traffic hits in the next week or two and notify those who requested to see this code.


# Technologies Used:
NodeJs 8.10
MongoDB
Mongoose 5.1
Express 4
ElastiCache Redis
JSON Web Tokens (JWT), bcrypt, etc.

webpack
nodemon
ES2018+ (lots of async/await and other goodies)
ESLint
Jest

see package.json for more details.

# Basic Information to Utilize the Code:

install:
yarn

build: 
yarn build

test:
yarn test
yarn test:watch

run:
yarn start

watch:
yarn watch

# Source Code:

start in src/server.js for the main entry-point.
src/serverless.js is for the serverless version of this that requires some minor tweaks to work with AWS Lambda & API Gateway.

follow the main express server code to see how it works:
src/express.js

configuration (everythng from environment setup, to db/redis clients, error codes and statuses):
src/config/

src/utils/
utility classes and libraries that support the app, including authentication, crypto, logging, profanity filter, helpers, and validation. Again, I wrote all of the code in this project and was meant to be done quickly. There are other standard libraries that have improved enough to use instead of the methods I chose, but you get the idea.

src/controllers/
the main source of controller code use for REST endpoints that map to the models.

src/models/
the main business logic that contains the models used in this API (most User, Account, Blacklist)
I use a lot of async/await to allow the code to be very modern and readable, and have some base and derived classes here.

src/models/schemas/
mongoose schemas for documents and indexes

src/models/base/
base class logic for Base and UserBase - most important classes.

src/models/enums/
data enumerations so I can lock down what can be added to documents.

src/models/objects
reusable objects that work with Mongoose schemas. This allows greater expandability while locking down the documents to what is known (known business rules).


The rest I haven't mentioned is mostly experimental code.






# Test Code:
I migrated from Mocha to Jest full-time last year. This is code I rewrote in a couple hours to standardize on Jest.
The tests are within the src folder. Most are integration/unit tests.
That's a good start to see how the API works and the thought process behind it.
src/test/integration
src/test/unit

redundant data for testing lives in src/test/data

supporting utilities for the tests:
src/test/utils




