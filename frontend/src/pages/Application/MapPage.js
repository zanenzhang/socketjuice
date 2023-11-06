import { React, useRef, useState, useEffect, useMemo, createRef } from 'react';
import axios from '../../api/axios';  
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  DirectionsRenderer, 
} from '@react-google-maps/api';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import MainHeader from '../../components/mainHeader/mainHeader';
import debounce from 'lodash.debounce';
import useAuth from '../../hooks/useAuth';
import getHostProfilesCoord from '../../helpers/HostData/getProfilesCoord';
import getGoogleCoordinates from '../../helpers/Google/getGoogleCoordinates';  
import getGoogleMatrix from '../../helpers/Google/getGoogleMatrix';


const MapPage = () => {

  /*global google*/

  const { auth, setActiveTab, socket, setSocket, setNewMessages, setNewRequests } = useAuth();
  const [center, setCenter] = useState({ lat: 48.8584, lng: 2.2945 })

  const [map, setMap] = useState(null)
  const [directionsResponse, setDirectionsResponse] = useState(null)
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [waitingCurrent, setWaitingCurrent] = useState(false);
  const [currentMarker, setCurrentMarker] = useState("")
  const [currentIcon, setCurrentIcon] = useState("")
  const [scrollRefs, setScrollRefs] = useState([])

  const mapRef = useRef(null);

  const [userLat, setUserLat]= useState();
  const [userLng, setUserLng]= useState();
  const [hostLocations, setHostLocations] = useState([])
  const [userAddress, setUserAddress] = useState('');

  const [openReserveModal, setOpenReserveModal] = useState(false);

  const [iconLarge, setIconLarge] = useState({})
  const [iconRegular, setIconRegular] = useState({})

  const [windowSize, setWindowSize] = useState({
      x: window.innerWidth,
      y: window.innerHeight
  });

  const profileStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 350,
    bgcolor: 'background.paper',
    border: '2px solid #995372',
    boxShadow: 24,
    pt: 2,
    px: 2,
    pb: 3,
    borderRadius: '10px',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyItems: "center",
    height: 425,
    zIndex: 10001,
};

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef()
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destinationRef = useRef()

  var {isLoaded} = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  })

  useEffect( ()=> {

      setActiveTab("map")

  }, [])

  useEffect( () => {

    if(isLoaded && google){

      // setIconRegular({
      //   url: "http://maps.gstatic.com/mapfiles/ms2/micons/ltblue-dot.png",
      //   scaledSize: new google.maps.Size(40, 40), // scaled size
      // })
    
      // setIconLarge({
      //   url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
      //   scaledSize: new google.maps.Size(45, 45), // scaled size
      // })

      const svg = {
        path: "M45.699 24.145l-7.89-13.293c-.314-.584-1.072-.852-1.721-.852h-7.088v-6c0-1.1-.9-2-2-2h-5c-1.1 0-2 .9-2 2v6h-5.96c-.65 0-1.44.268-1.754.852l-7.921 13.398c-1.301 0-2.365.987-2.365 2.322v12.139c0 1.335 1.064 2.289 2.365 2.289h2.635v3.78c0 2.004 1.328 3.22 3.279 3.22h1.183c1.951 0 3.538-1.216 3.538-3.22v-3.78h20v3.78c0 2.004 1.714 3.22 3.665 3.22h1.184c1.951 0 3.151-1.216 3.151-3.22v-3.78h2.763c1.3 0 2.237-.954 2.237-2.289v-12.139c0-1.335-1-2.427-2.301-2.427zm-37.194 9.71c-1.633 0-2.958-1.358-2.958-3.034 0-1.677 1.324-3.035 2.958-3.035s2.957 1.358 2.957 3.035c0 1.676-1.323 3.034-2.957 3.034zm1.774-9.855l5.384-9.377c.292-.598 1.063-.623 1.713-.623h15.376c.65 0 1.421.025 1.712.623l5.385 9.377h-29.57zm31.343 9.855c-1.632 0-2.957-1.358-2.957-3.034 0-1.677 1.325-3.035 2.957-3.035 1.633 0 2.958 1.358 2.958 3.035 0 1.676-1.325 3.034-2.958 3.034z",
        fillColor: "cyan",
        fillOpacity: 1,
        strokeWeight: 1,
        rotation: 0,
        scale: 0.9,
        anchor: new google.maps.Point(30,30),
      }

      setCurrentIcon(svg)
    }

  }, [isLoaded])

  useEffect( ()=> {

    if(hostLocations){
      
      const refs = hostLocations.reduce((acc, value) => {
        acc[value._id] = createRef();
        return acc;
      }, {});

      console.log(refs)
      setScrollRefs(refs)
    }

  }, [hostLocations])


  async function getDistanceDurationsMatrix(destinations, lat, lng){

    if( ( (!userLat && !userLng) && !userAddress) && (!lat && !lng) || destinations?.length === 0 || !destinations){
      alert("Please provide an origin address or your current location")
      return
    }

    var originString = ""
    var destinationString = destinations.join(" ")
    var destinationString = encodeURIComponent(destinationString)
    
    if(userLat && userLng){
      originString = userLat.toString() + " " + userLng.toString()
      originString = encodeURIComponent(originString)
    
    } else if (userAddress) {
      originString = encodeURIComponent(userAddress)
    
    } else if(lat && lng){
      originString = lat.toString() + " " + lng.toString()
      originString = encodeURIComponent(originString)
    } 

    const matrix = await getGoogleMatrix(originString, destinationString, auth.userId, auth.accessToken)

    if(matrix){
      return matrix.data
    }
  
  }

  function createMapURLDirections(destination){

      // https://www.google.com/maps/dir/?api=1&parameters
      // URL encode origin and destination
      // travelmode=driving

      var destination = "123 Main St, Toronto, ON M4E 2V9"

      var finalAddressEncoding = "https://www.google.com/maps/dir/?api=1&destination=".concat(encodeURIComponent(destination), "&travelmode=driving")

      console.log(finalAddressEncoding)
  }

  useEffect ( ()=> {

    if(auth){
      console.log("User is logged in")
    }

  }, [auth])


  const handleOpenReserveModal = (e) => {

    e.preventDefault()

    setOpenReserveModal(true)
  }

  const handleCloseReserveModal = (e) => {

    e.preventDefault()

    setOpenReserveModal(false)
  }

  const handleAddress = (e) => {

    async function getcoordinates(){
        
        if(e.value?.place_id){

            const {latlong} = await getGoogleCoordinates(e.value.place_id, auth.userId, auth.accessToken)

            if(latlong && latlong.results[0].geometry.location.lat && 
              latlong.results[0].geometry.location.lng){

                setUserAddress(latlong.results[0].formatted_address)
                setCenter({ lat: latlong.results[0].geometry.location.lat, lng: latlong.results[0].geometry.location.lng })
            }
        }
    }

    if(auth.userId){
      getcoordinates()
    }
  }

  async function handleCenterChanged() {
      
    if (!mapRef.current){
      return
    } 
      const newPos = mapRef.current.getCenter().toJSON();

      if(newPos && auth.userId){
      
        var coordinatesInput = [newPos.lng, newPos.lat]
        const locations = await getHostProfilesCoord(coordinatesInput, auth.userId, auth.accessToken)

        if(locations){
          console.log(locations)

          var destinations = []
          var hostIndexHash = {}
          
          for(let i=0; i< locations?.foundHostProfiles?.length; i++){
            
            if(locations.foundHostProfiles[i]?.address){

              destinations.push(locations.foundHostProfiles[i].address)

              var address_array = locations.foundHostProfiles[i].address?.split(',');
              locations.foundHostProfiles[i].addressArray = address_array

              hostIndexHash[locations.foundHostProfiles[i].address] = i
            }
          }
          
          // setHostLocations(locations?.foundHostProfiles)
          
          console.log(userLat, userLng)
          if(locations?.foundHostProfiles?.length > 0){
            const {matrix} = await getDistanceDurationsMatrix(destinations, newPos.lat, newPos.lng)

            if(matrix){
              console.log(matrix)
              console.log("Merging into matrix")
              console.log(hostIndexHash)

              for(let i=0; i<matrix?.rows[0]?.elements?.length; i++){
                
                if(matrix?.destination_addresses[i]){
                  
                  var index = hostIndexHash[matrix?.destination_addresses[i]]

                  if(index !== undefined){
                    
                    locations.foundHostProfiles[index].durationValue = matrix?.rows[0]?.elements[i].duration?.value
                    locations.foundHostProfiles[index].durationText = matrix?.rows[0]?.elements[i].duration?.text

                    locations.foundHostProfiles[index].distanceValue = matrix?.rows[0]?.elements[i].distance?.value
                    locations.foundHostProfiles[index].distanceText = matrix?.rows[0]?.elements[i].distance?.text
                  }
                }
              }
              
              locations.foundHostProfiles.sort((a,b) => a.durationValue - b.durationValue)
              setHostLocations(locations.foundHostProfiles)
            }
          }
        }
      }
  }

  const preHandleCenter = (e) => {
    
    if(auth.userId){
      debouncedChangeHandleCenter()
    }
  }


  const colorsList = ["red", "yellow", "orange", "purple", "blue", "aqua", "maroon", "pink", "gray", "lime"]

  const svgMarkerPins = (color) => {

    if(isLoaded){
      return (

        {path: "M25 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 35.135 15 35.135s15-26.924 15-35.135c0-8.21-6.716-14.866-15-14.866zm-.049 19.312c-2.557 0-4.629-2.055-4.629-4.588 0-2.535 2.072-4.589 4.629-4.589 2.559 0 4.631 2.054 4.631 4.589 0 2.533-2.072 4.588-4.631 4.588z",
        fillColor: `${color}`,
        fillOpacity: 1,
        strokeWeight: 1,
        rotation: 0,
        scale: 0.9,
        anchor: new google.maps.Point(25,50),
        }
      )
    }
  } 
  
  const debouncedChangeHandleCenter = useMemo(
      () => debounce(handleCenterChanged, 800)
  , [auth]);


  const handlePanLocation = () => {

      if(auth?.userId){

        setWaitingCurrent(true)

        navigator.geolocation.getCurrentPosition(position =>{
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          console.log(position.coords.latitude, position.coords.longitude);
  
          if(position.coords.longitude && position.coords.latitude){
            map.panTo({lat:position.coords.latitude,lng:position.coords.longitude})
            setWaitingCurrent(false)
          }
        })
      
      } else {
        //Open login modal
      }
    };

    const handleMarkerClick = (e, host) => {

      console.log(host)
      setCurrentMarker(host._id)

      if(scrollRefs){

        scrollRefs[host._id].current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }

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

  const handleOnLoad = (mapinput) => {
      setMap(mapinput)
      mapRef.current = mapinput;
    };

  return (

    <>      
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
              zoom={14}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              }}
              onLoad={(map) => handleOnLoad(map)}
              onCenterChanged={(e)=>preHandleCenter(e)}
          >

          {(userLat && userLng && isLoaded) && <div>
              <Marker position={{ lat: userLat, lng: userLng }}
              icon={currentIcon}
              />
          </div>}

          { hostLocations?.length > 0 ? 
          
            hostLocations.map((host, index)=> (
              
              <div key={`${host._id}_marker`} id={host._id} ref={scrollRefs[host._id]}>
                <button>
                    <Marker position={{lat: host.location.coordinates[1], lng:host.location.coordinates[0]}} 
                      icon={svgMarkerPins(colorsList[index])}
                      value={host.address} onClick={(e)=>handleMarkerClick(e, host)} />
                </button>
              </div>
            ))
          
           : null}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}

        </GoogleMap>
      </div>

      {<div className="p-2 rounded-xl m-2 bg-white shadow-sm z-10 
      flex flex-row border items-center justify-center gap-x-2">

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
                      defaultInputValue: userAddress,
                      onChange: handleAddress, //save the value gotten from google
                      placeholder: "Search",
                      styles: {
                          control: (provided, state) => ({
                              ...provided,
                              width: "175px",
                              height: "50px",
                              boxShadow: "#00D3E0",
                              paddingTop: "8px",
                              paddingBottom: "8px",
                              paddingLeft: "32px",
                              borderRadius: "6px",
                              border: state.isFocused
                              ? "2px solid #00D3E0"
                              : "1px solid #00D3E0",
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

        <div className='flex flex-row'>

            <button className='rounded-md px-1 py-3 border border-[#00D3E0] text-gray-500 
            w-[175px] h-[50px] flex flex-row items-center' 
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

              <p className='pl-2'>Current Location</p>
            </button>

        </div>

      </div>}

      { windowSize.x > 600 &&
        
        <div className='flex w-full justify-start items-start '>
            
            <div className='ml-4 py-2 flex flex-col w-[350px] h-[500px] rounded-xl overflow-y-scroll
              bg-gray-50 border-2 border-[#00D3E0] z-10 items-center px-2'>
                
                {hostLocations.map((host, index) => (
                  
                  <div key={`${host._id}_leftsquare`} 
                  className='w-full flex flex-col px-2 bg-[#c1f2f5]
                  py-2 border border-black rounded-lg'>
                    
                    <div className='flex flex-row'>
                      
                      <svg version="1.2" baseProfile="tiny" 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="25" height="25" viewBox="0 0 50 50" 
                      fill={colorsList[index]}
                      overflow="inherit">
                        <path d="M25 0c-8.284 0-15 6.656-15 14.866 0 8.211 15 35.135 15 35.135s15-26.924 15-35.135c0-8.21-6.716-14.866-15-14.866zm-.049 19.312c-2.557 0-4.629-2.055-4.629-4.588 0-2.535 2.072-4.589 4.629-4.589 2.559 0 4.631 2.054 4.631 4.589 0 2.533-2.072 4.588-4.631 4.588z"/>
                      </svg>

                      <p className='text-base pl-1'>{host?.addressArray.slice(0, -2).join(", ")}</p>
                    
                    </div>
                    
                    <div className='flex flex-row w-full gap-x-4 justify-around pt-2'>
                      <p>Drive Time: {host.durationText}</p>
                      <p>Distance: {host.distanceText}</p>
                    </div>

                    <div className='flex flex-row w-full gap-x-4 justify-around'>
                      <p>Available: Now</p>
                      
                      <button 
                        className='px-3 py-1 bg-[#FFE142] hover:bg-[orange] rounded-lg'
                        onClick={(e)=>handleOpenReserveModal(e)}
                        >
                          Reserve
                      </button>

                    </div>

                  </div>
                ))}
            </div>
        </div>}
       
       {windowSize.x <= 600 && <div className='flex flex-grow justify-end items-end'>
            <div className='flex w-[350px] h-[200px] rounded-lg bg-white z-10'>

            </div>
        </div>}

    </div>

        : null }

      </div>

      <Modal
            open={openReserveModal}
            disableAutoFocus={true}
            onClose={handleCloseReserveModal}
            onClick={(event)=>{event.stopPropagation()}}
            aria-labelledby="child-modal-title"
            aria-describedby="child-modal-description"
        >
            <Box sx={{ ...profileStyle, width: 350 }}>

           

            </Box>
        </Modal>
      </>
  )
}

export default MapPage