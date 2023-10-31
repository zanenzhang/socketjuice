import axios from "../../api/axios";
const UPLOAD_URL = '/profile/hostphotos';

async function addDriverPhotos(userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, 
    hostObjectTypes, hostPreviewObjectType, hostCoverIndex, accessToken) {

    try {
        const response = await axios.post(UPLOAD_URL, 
            JSON.stringify({userId, hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, 
                hostObjectTypes, hostPreviewObjectType, hostCoverIndex}),
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
