import { useRef, useState, useEffect, useMemo } from 'react';
import axios from '../../api/axios';  
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  DirectionsRenderer, 
} from '@react-google-maps/api'

import MainHeader from '../../components/mainHeader/mainHeader';
import debounce from 'lodash.debounce';
import useAuth from '../../hooks/useAuth';
import getHostProfilesCoord from '../../helpers/HostData/getProfilesCoord';
  
  
const MapPage = () => {
  
  
  const { auth, setActiveTab, socket, setSocket, setNewMessages, setNewRequests } = useAuth();

  const [center, setCenter] = useState({ lat: 48.8584, lng: 2.2945 })
  /*global google*/

  const [map, setMap] = useState(null)
  const [directionsResponse, setDirectionsResponse] = useState(null)
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [waitingCurrent, setWaitingCurrent] = useState(false);
  
  const mapRef = useRef(null);

  const[userLat, setUserLat]= useState();
  const[userLong, setUserLong]= useState();

  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(0);
  const [long, setLong] = useState(0);

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef()
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destinationRef = useRef()

  var { isLoaded } = useJsApiLoader({
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      libraries: ['places'],
    })

  useEffect( ()=> {

      setActiveTab("map")

  }, [])

  function createMapURLDirections(destination){

      // https://www.google.com/maps/dir/?api=1&parameters
      // URL encode origin and destination
      // travelmode=driving

      var destination = "123 Main St, Toronto, ON M4E 2V9"

      var finalAddressEncoding = "https://www.google.com/maps/dir/?api=1&destination=".concat(encodeURIComponent(destination), "&travelmode=driving")

      console.log(finalAddressEncoding)
  }

  useEffect ( ()=> {

    

  }, [auth])

  const handleAddress = (e) => {

    async function getcoordinates(){
        
        if(e.value?.place_id){

            const latlong = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${e.value.place_id}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`)

            if(latlong && latlong.data.results[0].geometry.location.lat && 
              latlong.data.results[0].geometry.location.lng){

                setLat(latlong.data.results[0].geometry.location.lat)
                setLong(latlong.data.results[0].geometry.location.lng)
                setAddress(latlong.data.results[0].formatted_address)
                setCenter({ lat: latlong.data.results[0].geometry.location.lat, lng: latlong.data.results[0].geometry.location.lng })
            }
        }
    }

    getcoordinates()
  }

  async function handleCenterChanged() {
      if (!mapRef.current) return;
      const newPos = mapRef.current.getCenter().toJSON();

      if(newPos && auth.userId){
      
        console.log(newPos);
        var coordinatesInput = [newPos.lng, newPos.lat]
        const locations = await getHostProfilesCoord(coordinatesInput, auth.userId, auth.accessToken)

        if(locations){
          console.log(locations)
        }
      }
  }
  
  const debouncedChangeHandleCenter = useMemo(
      () => debounce(handleCenterChanged, 800)
  , []);

  const handlePanLocation = () => {

      setWaitingCurrent(true)

      navigator.geolocation.getCurrentPosition(position =>{
        setUserLat(position.coords.latitude);
        setUserLong(position.coords.longitude);
        console.log(position.coords.latitude, position.coords.longitude);

        if(position.coords.longitude && position.coords.latitude){
          map.panTo({lat:position.coords.latitude,lng:position.coords.longitude})
          setWaitingCurrent(false)
        }
      })
    };


  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService()
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    })
    setDirectionsResponse(results)
    setDistance(results.routes[0].legs[0].distance.text)
    setDuration(results.routes[0].legs[0].duration.text)
  }

  function clearRoute() {
    setDirectionsResponse(null)
    setDistance('')
    setDuration('')
    originRef.current.value = ''
    destinationRef.current.value = ''
  }

  const handleOnLoad = map => {
      setMap(map)
      mapRef.current = map;
    };

  return (

      <div style={{height:'100svh', width:'100svw'}} 
                  className="bg-white bg-center max-w-full
                      flex flex-col fixed w-full">

      <MainHeader 
          loggedUserId={auth.userId} loggedUsername={auth.username} 
          profilePicURL={auth.profilePicURL} roles={auth.roles}
      />

      {isLoaded ? 

      <div className='flex relative flex-col items-center pt-[6vh] sm:pt-[7vh] 
              md:pt-[8vh] h-[100svh] w-[100svw]'>

          <div className='absolute h-full w-full'>
          {/* Google Map Box */}
          <GoogleMap
              center={center}
              zoom={15}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              }}
              onLoad={(map) => handleOnLoad(map)}
              onCenterChanged={(e)=>debouncedChangeHandleCenter(e)}
          >
          <button>
              <Marker position={center} value={"TESTING"} onClick={(e)=>console.log(e)} />
          </button>

          {/* <div>
              <Marker position={{ lat: 48.8584, lng: 2.2941 }}/>
          </div> */}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}

        </GoogleMap>
      </div>

      {<div className="p-2 rounded-xl m-2 bg-white shadow-sm z-10 
      flex flex-col border">

        <div className='flex flex-row items-center'> 

            <svg xmlns="http://www.w3.org/2000/svg" 
            fill="none" viewBox="0 0 24 24" 
            className="absolute pl-3 h-6 pointer-events-none z-20"
            strokeWidth="2" stroke="#00D3E0">
              <path strokeLinecap="round" strokeLinejoin="round" 
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>

              <GooglePlacesAutocomplete

                  apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                  debounce={400}
                  // autocompletionRequest={{
                  //     componentRestrictions: {
                  //       country: ["ca", "us"] //to set the specific country
                  //     }
                  //   }}
                  selectProps={{
                      defaultInputValue: address,
                      onChange: handleAddress, //save the value gotten from google
                      placeholder: "Search An Address",
                      styles: {
                          control: (provided, state) => ({
                              ...provided,
                              width: "250px",
                              boxShadow: "#00D3E0",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                              paddingLeft: "32px",
                              border: state.isFocused
                              ? "2px solid #00D3E0"
                              : "0.5px solid #00D3E0",
                              '&:focus': {
                                  border: "4px solid #00D3E0"
                              },
                              '&:hover': {
                                  
                              },
                              '&:select': {
                                  border: "4px solid #00D3E0"
                              },
                              borderColor: "#00d3e080",
                              outlineColor: "#00D3E0",
                              "--tw-ring-color": "#00D3E0"
                          }),
                          menu: (provided) => ({
                              ...provided,
                          }),
                          option: (provided) => ({
                            ...provided,
                          }),
                        },
                  }}
              />
        </div>

        <div className='flex flex-row pt-2'>

            <button className='rounded-md px-1 py-3 border border-[#00D3E0] text-gray-500 
            w-[250px] flex flex-row items-center' 
              onClick={(e)=> handlePanLocation(e)}>
                
                {waitingCurrent ?
                  <div aria-label="Loading..." role="status">
                    <svg className="px-1 h-7 w-7 animate-spin" viewBox="3 3 18 18">
                    <path
                        className="fill-gray-200"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                    <path
                        className="fill-[#00D3E0]"
                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                    </svg>
                </div>
                :
                <div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="#00D3E0"
                    height="1.5em"
                    width="1.5em"
                    className="ml-1"
                  >
                    <path d="M15 12 A3 3 0 0 1 12 15 A3 3 0 0 1 9 12 A3 3 0 0 1 15 12 z" />
                    <path d="M13 4.069V2h-2v2.069A8.008 8.008 0 004.069 11H2v2h2.069A8.007 8.007 0 0011 19.931V22h2v-2.069A8.007 8.007 0 0019.931 13H22v-2h-2.069A8.008 8.008 0 0013 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z" />
                  </svg>
                </div>
                }

              <p className='pl-2'>Go To Current Location</p>
            </button>

        </div>

      </div>}

    </div>

        : null }

      </div>
  )
}

export default MapPage