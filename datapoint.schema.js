var graphql = require('graphql');
var fetch = require('node-fetch');
var GraphQLObjectType = graphql.GraphQLObjectType;
var GraphQLString = graphql.GraphQLString;
var GraphQLSchema = graphql.GraphQLSchema;
var GraphQLList = graphql.GraphQLList;

var getForecastLocations = function () {
	'use strict';
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?key='+GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => json.Locations.Location)
};
const LocationList = new GraphQLObjectType({
	name:'LocationList',
	description:'A list of the UK forecast locations',
	fields: () => ({
		allLocations: {
			type: new GraphQLList(LocationType),
			resolve: root => getForecastLocations()
		}
	})
});
const LocationType = new GraphQLObjectType({
	name:'Location',
	description: 'A Location object defines a single site',
	fields: () => ({
		id: {
			type:GraphQLString
		},
		longitude:{
			type:GraphQLString
		},
		latitude: {
			type:GraphQLString
		},
		name: {
			type:GraphQLString
		}
	})
})
GLOBAL.schema = new GraphQLSchema({
	query: LocationList,
});