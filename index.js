var express = require('express');
var graphQLHTTP = require('express-graphql');
var locationSchema = require('./datapoint.schema');
if (typeof process.argv[2] !== "undefined") {
	GLOBAL.dataPointKey = process.argv[2];
	const PORT = 3000;
	var app = express();

// app.use('/graphql', bodyParser.json(), apolloExpress({ schema: myGraphQLSchema }));
	app.use('/graphql', graphQLHTTP({
		schema: GLOBAL.schema,
		graphiql: true,
	}));
	app.listen(PORT);
	console.log('running on port 3000, go to http://localhost:3000/graphql to play with some queries');
} else {
	console.error('You must pass your datapoint key as a command line argument');
	process.exit(-1);
}