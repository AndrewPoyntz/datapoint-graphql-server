var graphql = require('graphql');
var fetch = require('node-fetch');
var moment = require('moment');
var GraphQLObjectType = graphql.GraphQLObjectType;
var GraphQLString = graphql.GraphQLString;
var GraphQLSchema = graphql.GraphQLSchema;
var GraphQLList = graphql.GraphQLList;
var getForecastLocations = function (args) {
	'use strict';
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?key=' + GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => json.Locations.Location)
		.then((locations)=> {
			if (args.id) {
				for (var i = 0; i < locations.length; i++) {
					if (locations[i].id === args.id) {
						return [locations[i]];
					}
				}
			} else {
				return locations;
			}
		})
};
var getForecastCapabilities = function (args) {
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/capabilities?res=3hourly&key=' + GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => {
			return json.Resource
		})
		.then((data) => {
			return {
				dataDate: data.dataDate,
				timeSteps: data.TimeSteps.TS
			}
		});
};
var getObsCapabilities = function (args) {
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxobs/all/json/capabilities?res=hourly&key=' + GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => {
			return json.Resource
		})
		.then((data) => {
			return {
				dataDate: data.dataDate,
				timeSteps: data.TimeSteps.TS
			}
		});
};
var getForecastData = function (id) {
	return fetch('http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/3772?res=3hourly&key=' + GLOBAL.dataPointKey)
		.then(res => res.json())
		.then(json => {
			return json.SiteRep.DV
		})
		.then((data) => {
			return {
				issueTime: data.dataDate,
				days: data.Location.Period
			}
		});
};
const Datapoint = new GraphQLObjectType({
	name: 'Datapoint',
	description: 'Forecast and obs data for more than 5000 locations',
	fields: () => ({
		locations: {
			description: 'list of the 5000 locations',
			type: new GraphQLList(LocationType),
			args: {
				id: {
					type: GraphQLString
				}
			},
			resolve: (root, id) => {
				return getForecastLocations(id)
			}
		},
		forecastTimes: {
			description: 'A list of the available forecast timesteps',
			type: TimesStepsType,
			resolve: (root)=> {
				return getForecastCapabilities()
			}
		},
		observationTimes: {
			description: 'A list of the available observation timesteps',
			type: TimesStepsType,
			resolve: (root)=> {
				return getObsCapabilities()
			}
		}
	})
});
const TimesStepsType = new GraphQLObjectType({
	name: 'Timesteps',
	fields: ()=>({
		issued: {
			type: GraphQLString,
			resolve: data => data.dataDate
		},
		timeSteps: {
			type: new GraphQLList(GraphQLString)
		}
	})
});
const ForecastDays = new GraphQLObjectType({
	name: 'ForecastDays',
	fields: ()=>({
		issueTime: {
			type: GraphQLString,
		},
		days: {
			type: new GraphQLList(ForecastDates),
			resolve: data => sortForecastDates(data.days)
		}
	})
});
var sortForecastDates = function (data) {
	var days = [], i, day, date;
	for (i = 0; i < data.length; i++) {
		day = data[i];
		date = moment(day.value.substring(0, day.value.length - 1) + 'T00:00:00.000Z').toISOString();
		days.push({
			date: date,
			dayData: day
		})
	}
	return days;
};
const ForecastDates = new GraphQLObjectType({
	name: 'ForecastDates',
	fields: ()=>({
		date: {type: GraphQLString},
		timesteps: {
			type: new GraphQLList(ForecastTimesteps),
			resolve: data => {
				return sortForecastTimesteps(data.date, data.dayData.Rep)
			}
		}
	})
});

var sortForecastTimesteps = function (dayDate, data) {
	var timesteps = [], i, timestep;
	for (i = 0; i < data.length; i++) {
		timestep = data[i];
		timesteps.push({
			time: moment(dayDate).add(timestep['$'],'minutes').toISOString(),
			uvIndex:timestep.U,
			weatherType:timestep.W,
			visibility:timestep.V,
			temp:timestep.T,
			windSpeed:timestep.S,
			precipProbab:timestep.Pp,
			relativeHumidity:timestep.H,
			windGust:timestep.G,
			feelsLikeTemp:timestep.F,
			windDirection:timestep.D
		})
	}
	return timesteps;
};
const ForecastTimesteps = new GraphQLObjectType({
	name: 'ForecastTimesteps',
	fields: ()=>({
		time: {type: GraphQLString},
		uvIndex : {type:GraphQLString},
		weatherType : {type:GraphQLString},
		visibility : {type:GraphQLString},
		temp : {type:GraphQLString},
		windSpeed : {type:GraphQLString},
		precipProbab : {type:GraphQLString},
		relativeHumidity : {type:GraphQLString},
		windGust : {type:GraphQLString},
		feelsLikeTemp : {type:GraphQLString},
		windDirection : {type:GraphQLString}
	})
});

const ForecastData = new GraphQLObjectType({
	name: 'ForecastData',
	fields: ()=>({
		test: {type: GraphQLString}
	})
});
const LocationType = new GraphQLObjectType({
	name: 'Location',
	description: 'A Location object defines a single site',
	fields: () => ({
		id: {
			type: GraphQLString
		},
		longitude: {
			type: GraphQLString
		},
		latitude: {
			type: GraphQLString
		},
		name: {
			type: GraphQLString
		},
		forecast: {
			type: ForecastDays,
			resolve: location => {
				return getForecastData(location.id)
			}
		}
	})
});
GLOBAL.schema = new GraphQLSchema({
	query: Datapoint,
});