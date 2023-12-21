import axios from "../../api/axios";
const UPLOAD_URL = '/profile/host';

async function addHostProfile(userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, 
    hostObjectTypes, hostPreviewObjectType, hostCoverIndex, chargeRate, chargeRateFee, currency, connectorType, secondaryConnectorType, chargingLevel,
    hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
    hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
    holidayHoursStart, holidayHoursFinish, 
    closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays, 
    allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
    hostComments,
    accessToken) {

        console.log(userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, 
            hostObjectTypes, hostPreviewObjectType, hostCoverIndex, chargeRate, chargeRateFee, currency, connectorType, secondaryConnectorType, chargingLevel,
            hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
            hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
            holidayHoursStart, holidayHoursFinish, 
            closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays, 
            allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
            hostComments)

    try {

        const response = await axios.post(UPLOAD_URL, 
            JSON.stringify({userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, 
                hostObjectTypes, hostPreviewObjectType, hostCoverIndex, chargeRate, chargeRateFee, currency, connectorType, secondaryConnectorType, chargingLevel,
                hoursMondayStart, hoursMondayFinish, hoursTuesdayStart, hoursTuesdayFinish, hoursWednesdayStart, hoursWednesdayFinish, hoursThursdayStart, hoursThursdayFinish,
                hoursFridayStart, hoursFridayFinish, hoursSaturdayStart, hoursSaturdayFinish, hoursSundayStart, hoursSundayFinish,
                holidayHoursStart, holidayHoursFinish, 
                closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
                allDayMonday, allDayTuesday, allDayWednesday, allDayThursday, allDayFriday, allDaySaturday, allDaySunday, allDayHolidays,
                hostComments
            }),
            {
                headers: { "Authorization": `Bearer ${accessToken} ${userId}`, 
                    'Content-Type': 'application/json'},
                withCredentials: true
            }
        );

        if (response){
            return response
        } else {
            return null
        }

    } catch (err) {
        console.error(err);
    }
}

export default addHostProfile
