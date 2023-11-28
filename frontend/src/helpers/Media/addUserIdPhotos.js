import axios from "../../api/axios";
const UPLOAD_URL = '/auth/useridphotos';

async function addUserIdPhotos(userId, identificationdriverObjectId, identificationplateObjectId,
    hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, hostObjectTypes, hostPreviewObjectType, hostCoverIndex, accessToken) {

    try {

        const response = await axios.post(UPLOAD_URL, 
            JSON.stringify({userId, identificationdriverObjectId, identificationplateObjectId,
                hostPreviewMediaObjectId, hostMediaObjectIds, hostVideoObjectIds, hostObjectTypes, hostPreviewObjectType, hostCoverIndex}),
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

export default addUserIdPhotos
