import { useRef, useState, useEffect } from 'react'

  import { FaLocationArrow, FaTimes } from 'react-icons/fa';
  
  import {
    useJsApiLoader,
    GoogleMap,
    Marker,
    Autocomplete,
    DirectionsRenderer, 
  } from '@react-google-maps/api'

  import MainHeader from '../../components/mainHeader/mainHeader';
  import useAuth from '../../hooks/useAuth';
  
  
  const ProfilePage = () => {
    

    // <img className='w-[375px] py-2' src={evconnectors} />

  //   <div className='w-full flex flex-col items-end pt-4 pr-12'>

  //     <div className="flex flex-row justify-center items-center gap-x-2">

  //         <div className='flex flex-col py-4'>
  //             <p className="flex justify-center items-center pr-2 font-semibold">Offering Charging?</p>
  //             <p className="flex">(can change this later):</p>
  //         </div>

  //         <select onChange={(event)=>setOfferingCharging(event.target.value)}
  //         value={offeringCharging}
  //         className={`text-sm w-30 md:w-40 h-10 text-black justify-center
  //         border border-gray-primary rounded focus:outline-[#00D3E0] pl-6`}>

  //             <option value="Yes">Yes</option>
  //             <option value="No">No</option>

  //         </select> 

  //     </div>

  //     {offeringCharging === "Yes" ?

  //     <div className='w-full flex flex-col items-end gap-y-4'>

  //         <div className="flex flex-row justify-center items-center gap-x-2">

  //             <div className='flex flex-col p-2'>
  //                 <p className="flex font-semibold">Charge Rate Per 30 Min:</p>
  //             </div>
              
  //             <select className="pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center" 
  //             value={chargeRate}
  //             onChange={(event) => {
  //                 setChargeRate(event.target.value);
  //             }}>
              
  //             <option value={1.0}>$1.00</option>
  //             <option value={2.0}>$2.00</option>
  //             <option value={3.0}>$3.00</option>
  //             <option value={4.0}>$4.00</option>
  //             <option value={5.0}>$5.00</option>
  //             <option value={6.0}>$6.00</option>
  //             <option value={7.0}>$7.00</option>
  //             <option value={8.0}>$8.00</option>
  //             <option value={9.0}>$9.00</option>
  //             <option value={10.0}>$10.00</option>
              
  //             </select>
  //         </div>  

  //         <div className="flex flex-row justify-center items-center gap-x-2">

  //             <label className="flex justify-center items-center pr-2 font-semibold">Currency:</label>

  //             <select onChange={(event)=>setCurrency(event.target.value)}
  //             value={currency}
  //             className={`pl-6 w-30 md:w-40 h-9 border border-gray-primary justify-center items-center`}>

  //                 <option value="usd">$USD</option>
  //                 <option value="cad">$CAD</option>
  //                 <option value="eur">€EUR</option>
  //                 <option value="gbp">£GBP</option>
  //                 <option value="inr">₹INR</option>
  //                 <option value="jpy">¥JPY</option>
  //                 <option value="cny">¥CNY</option>
  //                 <option value="aud">$AUD</option>
  //                 <option value="nzd">$NZD</option>

  //             </select> 

  //         </div>

  //         {/* <div className="flex flex-row justify-center items-center gap-x-2">

  //             <label className="flex justify-center items-center pr-2 font-semibold">Connector Type:</label>

  //             <select onChange={(event)=>setConnectorType(event.target.value)}
  //             value={connectorType}
  //             className={`text-sm w-30 md:w-40 h-10 text-black justify-center
  //             border border-gray-primary rounded focus:outline-[#00D3E0] pl-6`}>

  //                 <option value="AC-J1772-Type1">AC-J1772-Type1</option>
  //                 <option value="AC-Mennekes-Type2">AC-Mennekes-Type2</option>
  //                 <option value="AC-GB/T">AC-GB/T</option>
  //                 <option value="DC-CCS1">DC-CCS1</option>
  //                 <option value="DC-CCS2">DC-CCS2</option>
  //                 <option value="DC-CHAdeMO">DC-CHAdeMO</option>
  //                 <option value="DC-GB/T">DC-GB/T</option>

  //             </select> 

  //         </div> */}

  //         <div className="flex flex-row justify-center items-center gap-x-2">

  //             <label className="flex justify-center items-center pr-2 font-semibold">Charging Level:</label>

  //             <select onChange={(event)=>setChargingLevel(event.target.value)}
  //             value={chargingLevel}
  //             className={`text-sm w-30 md:w-40 h-10 text-black justify-center
  //             border border-gray-primary rounded focus:outline-[#00D3E0] pl-6`}>

  //                 <option value="Level 1">Level 1</option>
  //                 <option value="Level 2">Level 2</option>
  //                 <option value="Level 3">Level 3</option>

  //             </select> 

  //         </div>
      
  //     </div>: null}

  // </div> 

    
    const { auth, setActiveTab, socket, setSocket, setNewMessages, setNewRequests } = useAuth();

    const center = { lat: 48.8584, lng: 2.2945 }
    /*global google*/
  
    const [map, setMap] = useState(null)
    const [directionsResponse, setDirectionsResponse] = useState(null)
    const [distance, setDistance] = useState('')
    const [duration, setDuration] = useState('')
    
    const mapRef = useRef(null);

    const[userLat, setUserLat]= useState();
    const[userLong, setUserLong]= useState();
  
    /** @type React.MutableRefObject<HTMLInputElement> */
    const originRef = useRef()
    /** @type React.MutableRefObject<HTMLInputElement> */
    const destinationRef = useRef()

    var { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
      })

      useEffect( ()=> {

        setActiveTab("profile")

    }, [])

    function createMapURLDirections(destination){

        // https://www.google.com/maps/dir/?api=1&parameters
        // URL encode origin and destination
        // travelmode=driving

        var destination = "123 Main St, Toronto, ON M4E 2V9"

        var finalAddressEncoding = "https://www.google.com/maps/dir/?api=1&destination=".concat(encodeURIComponent(destination), "&travelmode=driving")

        console.log(finalAddressEncoding)
    }

    function handleCenterChanged() {
        if (!mapRef.current) return;
        const newPos = mapRef.current.getCenter().toJSON();
        console.log(newPos);
    }

    const handlePanLocation = () => {
        navigator.geolocation.getCurrentPosition(position =>{
          setUserLat(position.coords.latitude);
          setUserLong(position.coords.longitude);
          console.log(position.coords.latitude, position.coords.longitude);

          if(position.coords.longitude && position.coords.latitude){
            map.panTo({lat:position.coords.latitude,lng:position.coords.longitude})
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
                onCenterChanged={(e)=>handleCenterChanged(e)}
            >
            <div>
                <Marker position={center} value={"TESTING"} />
            </div>

            <div>
                <Marker position={{ lat: 48.8584, lng: 2.2941 }}/>
            </div>

            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}

          </GoogleMap>
        </div>

        <div className="p-4 rounded-xl m-4 bg-white shadow-sm w-full z-1">

          {/* <HStack spacing={2} justifyContent='space-between'>
            <Box flexGrow={1}>
              <Autocomplete>
                <Input type='text' placeholder='Origin' ref={originRef} />
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <Autocomplete>
                <Input
                  type='text'
                  placeholder='Destination'
                  ref={destinationRef}
                />
              </Autocomplete>
            </Box>

            <button onClick={(e)=> handlePanLocation(e)}>Pan Location</button>
  
            <ButtonGroup>
              <Button colorScheme='pink' type='submit' onClick={calculateRoute}>
                Calculate Route
              </Button>
              <IconButton
                aria-label='center back'
                icon={<FaTimes />}
                onClick={clearRoute}
              />
            </ButtonGroup>
          </HStack>
          <HStack spacing={4} mt={4} justifyContent='space-between'>
            <Text>Distance: {distance} </Text>
            <Text>Duration: {duration} </Text>
            <IconButton
              aria-label='center back'
              icon={<FaLocationArrow />}
              isRound
              onClick={() => {
                map.panTo(center)
                map.setZoom(15)
              }}
            />
          </HStack> */}
        </div>
      </div>

         : null }

        

        </div>
    )
  }

  export default ProfilePage