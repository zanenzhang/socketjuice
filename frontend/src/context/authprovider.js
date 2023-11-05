import { createContext, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    
    const [auth, setAuth] = useState("");
    const [persist, setPersist] = useState(JSON.parse(localStorage.getItem("socketjuice-persist")) || true);
    const [browse, setBrowse] = useState(localStorage.getItem("socketjuice-browse") || 'yes');
    const [publicFX, setPublicFX] = useState("CAD");
    const [open, setOpen] = useState(false);

    const [publicRates, setPublicRates] = useState({CAD:{
        USDperCAD: {
            type: Number,
            default: 0.7450
        },
        GBPperCAD: {
            type: Number,
            default: 0.6017
        },
        JPYperCAD: {
            type: Number,
            default: 109.9507
        },
        EURperCAD: {
            type: Number,
            default: 0.6969
        },
        CNYperCAD: {
            type: Number,
            default: 5.4094
        },
        INRperCAD: {
            type: Number,
            default: 61.5697
        },
        AUDperCAD: {
            type: Number,
            default: 1.1564
        },
        NZDperCAD: {
            type: Number,
            default: 1.2544
        },
    }});

    const [socket, setSocket] = useState("");
    const [newMessages, setNewMessages] = useState("");
    const [newRequests, setNewRequests] = useState("");
    const [geoData, setGeoData] = useState('req');
    const [activeTab, setActiveTab] = useState('map');
    const [newIndividualChat, setNewIndividualChat] = useState("");
    const [refresh, setRefresh] = useState(false);


    return (
        <AuthContext.Provider value={{ auth, setAuth, persist, setPersist, 
            socket, setSocket, newMessages, setNewMessages, newIndividualChat, 
            setNewIndividualChat, refresh, setRefresh,
            newRequests, setNewRequests, 
            browse, setBrowse, publicFX, setPublicFX,
            publicRates, setPublicRates, 
            geoData, setGeoData, activeTab, setActiveTab }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;