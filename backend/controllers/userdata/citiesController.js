const User = require('../../model/User')
const ObjectId  = require('mongodb').ObjectId;
const cities = require('all-the-cities');


const getCities = async (req, res) => {

    const adminCodesCanada = {
        '01':   {name: "Alberta", id: 5883102, postal: "AB"},
        '02':   {name: "British Columbia", id:	5909050, postal: "BC"},
        '03':	{name: "Manitoba",	id: 6065171, postal:"MB"},
        '04':	{name: "New Brunswick",	id: 6087430, postal:"NB"},
        '05':	{name: "Newfoundland and Labrador", id: 6354959, postal: "NL"},
        '07':	{name: "Nova Scotia", id: 6091530, postal: "NS"},
        '08':	{name: "Ontario", id: 6093943, postal: "ON"},
        '09':	{name: "Prince Edward Island", id: 6113358, postal:"PE"},
        '10':	{name: "Quebec", id: 6115047, postal:"QC"},
        '11':	{name: "Saskatchewan", id: 6141242, postal: "SK"},
        '12':	{name: "Yukon", id: 6185811, postal: "YT"},
        '13':	{name: "Northwest Territories",	id: 6091069, postal: "NT"},
        '14':	{name: "Nunavut", id: 6091732, postal: "NU"},
      }

    var { citySearch } = req.query

    if (!citySearch || citySearch?.length === 0 ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    if (citySearch?.length > 12){
        citySearch = citySearch.slice(0,12)
    }

    var citySearchLower = citySearch.toLowerCase()

    try {

        var searchResults = [];

        var filtered = cities.filter(function(city) {
          
            if(this.count < 12 && (city.country === 'CA' || city.country === 'US' ) && city.name.toLowerCase().startsWith(citySearchLower) ){
                this.count++ 
                return true
            }
            return false
        
        }, {count: 0})
        
        if(filtered?.length > 0){
            for(let i=0; i< filtered.length; i++){
                if(filtered[i].country === "CA"){
                    if(adminCodesCanada[filtered[i].adminCode] !== undefined){
                        filtered[i].adminCode = adminCodesCanada[filtered[i].adminCode].postal
                    }
                }
            }
            return res.status(201).json({filtered})    
        } else {
            filtered = []
            return res.status(201).json({filtered})    
        }   
        
    } catch(err){

        console.log(err)
        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


const updatePreferences = async (req, res) => {
    
    var { city, region, country, userId } = req.body

    if (!city || !region || !country || !userId || city.length > 30
        || region.length > 30 || country.length > 30 ) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const foundUser = await User.findOne({_id: userId})

        if(foundUser.preferredCity !== city){
            foundUser.city = preferredCity
        }

        if(foundUser.preferredRegion !== region){
            foundUser.region = preferredRegion
        }

        if(foundUser.preferredCountry !== country){
            foundUser.country = preferredCountry
        }

        const saved = await foundUser.save()

        if(saved){
            return res.status(200)
        }
        
    } catch(err){

        return res.status(401).json({ message: 'Cannot get user information' })
    }
}


module.exports = { getCities, updatePreferences }