var graphql = require('graphql');
var fetch = require('node-fetch');
var GraphQLObjectType = graphql.GraphQLObjectType;
var GraphQLString = graphql.GraphQLString;
var GraphQLSchema = graphql.GraphQLSchema;
var GraphQLList = graphql.GraphQLList;
var getForecastLocations = function (args) {
	'use strict';
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?key='+GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => json.Locations.Location)
		.then((locations)=> {
			if (args.id){
				for (var i =0; i < locations.length; i++){
					if (locations[i].id === args.id){
						return [locations[i]];
					}
				}
			} else {
				return locations;
			}
		})
};
var calledOnce = false;
var getForecastCapabilities= function (args) {
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/capabilities?res=3hourly&key='+GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => {return json.Resource})
		.then((data) => {
			return {
				dataDate: data.dataDate,
				timeSteps: data.TimeSteps.TS
			}
		});
};
var getObsCapabilities= function (args) {
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxobs/all/json/capabilities?res=hourly&key='+GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => {return json.Resource})
		.then((data) => {
			return {
				dataDate: data.dataDate,
				timeSteps: data.TimeSteps.TS
			}
		});
};
const Datapoint = new GraphQLObjectType({
	name:'Datapoint',
	description:'Forecast and obs data for more than 5000 locations',
	fields: () => ({
		locations: {
			description:'list of the 5000 locations',
			type: new GraphQLList(LocationType),
			args:{
				id:{
					type:GraphQLString
				}
			},
			resolve: (root, id) => {return getForecastLocations(id)}
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
		},
		forecastData:{
			description:'Forecast data',
			type:WeatherType,
			resolve:(root)=> {return getForecastCapabilities()}
		},
		observationData:{
			description:'Observation data',
			type:WeatherType,
			resolve:(root)=> {return getObsCapabilities()}
		},
	})
});
const WeatherType = new GraphQLObjectType({
	name:'WeatherData',
	fields:()=>({
		issued:{
			type:GraphQLString,
			resolve: data => data.dataDate
		},
		timeSteps:{
			type:new GraphQLList(GraphQLString)
		}
	})
});
GLOBAL.schema = new GraphQLSchema({
	query: Datapoint,
});