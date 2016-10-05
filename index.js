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
		rootValue: root,
		graphiql: true,
	}));
	app.listen(PORT);
	console.log('running');
} else {
	console.log('You must pass your datapoint key as a command line argument');
	process.exit(-1);
}