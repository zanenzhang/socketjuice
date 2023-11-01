import axios from "../../api/axios";
const UPLOAD_URL = '/auth/driverphotos';

async function addDriverPhotos(userId, driverPreviewMediaObjectId, driverMediaObjectIds, driverVideoObjectIds, 
    driverObjectTypes, driverPreviewObjectType, driverCoverIndex, accessToken) {

    try {
        const response = await axios.post(UPLOAD_URL, 
            JSON.stringify({userId, driverPreviewMediaObjectId, driverMediaObjectIds, 
                driverVideoObjectIds, driverObjectTypes, driverPreviewObjectType, driverCoverIndex}),
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

export default addDriverPhotos
