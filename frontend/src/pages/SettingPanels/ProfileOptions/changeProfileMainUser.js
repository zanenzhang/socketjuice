import React, { useState, useEffect, useRef } from 'react';
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import ProfileCropper from './profileCropper'
import axios from '../../../api/axios'
import useAuth from '../../../hooks/useAuth'
import useLogout from '../../../hooks/useLogout';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import editSettingsUserProfile from "../../../helpers/UserData/editSettingsUserProfile";
import getProfileData from '../../../helpers/UserData/getProfileData';
import addWarnings from '../../../helpers/UserData/addWarnings';

const PUBLIC_MEDIA_URL = '/s3/single-profilepic';

const useStyles = makeStyles({
  appContainer: {
    display: "flex",
    flexDirection: "row",
    width: "93vw",
    height: "100vh",
  },

  container: {
    display: "flex",
    height: "100%",
    width: "100%",
    justifyContent: "center"
  },
  panel: {
    width: "100%"
  }
});


export default function ChangeProfileMainUser({loggedUserId }) {

  const classes = useStyles();
  const { setAuth, auth } = useAuth();
  const logout = useLogout();
  const startRef = useRef();

  const [image, setImage] = useState("");
  const [croppedImage, setCroppedImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [fullname, setFullname] = useState("");
  const [validFullname, setValidFullname] = useState(false);
  const [fullnameFocus, setFullnameFocus] = useState(false);

  const [phonePrimary, setPhonePrimary] = useState("");
  const [validPhonePrimary, setValidPhonePrimary] = useState(false);
  const [phonePrimaryFocus, setPhonePrimaryFocus] = useState(false);

  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [validRelationshipStatus, setValidRelationshipStatus] = useState(false);
  const [relationshipStatusFocus, setRelationshipStatusFocus] = useState(false);

  const [countrySet, setCountrySet] = useState(false);

  const [region, setRegion] = useState("Select Region");
  const [regionCode, setRegionCode] = useState("");
  const [validRegion, setValidRegion] = useState(false);
  const [regionFocus, setRegionFocus] = useState(false);

  const [country, setCountry] = useState('Select Country');
  const [validCountry, setValidCountry] = useState(false);
  const [countryFocus, setCountryFocus] = useState(false);

  var todaysDate = new Date().toISOString().slice(0, 10)
  var pastDate = new Date()
  pastDate.setFullYear(pastDate.getFullYear() - 13)
  var cutoffDate = pastDate.toISOString().slice(0,10)

  const [birthdate, setBirthdate] = useState("");
  const [validBirthdate, setValidBirthdate] = useState(false);
  const [birthdateFocus, setBirthdateFocus] = useState(false);

  const FULL_NAME_REGEX = /^[a-zA-Z_ ]{0,48}$/;
  const PHONE_PRIMARY_REGEX = /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/;
  const RELATIONSHIP_STATUS_REGEX = /^[a-zA-Z ]{0,48}$/;
  const BIRTHDATE_REGEX = /^[0-9]{4}[-]{1}[0-9]{2}[-]{1}[0-9]{2}$/;
  const REGION_REGEX = /^[a-zA-Z ]{2,48}$/;
  const COUNTRY_REGEX = /^[a-zA-Z ]{2,48}$/;


  useEffect(() => {
    const ele = startRef.current
    ele.focus();
    }, [])

    useEffect(() => {
        setValidFullname(FULL_NAME_REGEX.test(fullname));
    }, [fullname])

    useEffect(() => {
        setValidPhonePrimary(PHONE_PRIMARY_REGEX.test(phonePrimary));
    }, [phonePrimary])

    useEffect(() => {
      setValidRegion((REGION_REGEX.test(region) && region !== 'Select Region'));
  }, [region])

  useEffect(() => {
      setValidCountry((COUNTRY_REGEX.test(country) && country !== 'Select Country'));
  }, [country])

    useEffect(() => {
        setValidRelationshipStatus(RELATIONSHIP_STATUS_REGEX.test(relationshipStatus));
    }, [relationshipStatus])

    useEffect(() => {
      setValidBirthdate(BIRTHDATE_REGEX.test(birthdate) && birthdate > '1920-01-01' && birthdate < cutoffDate);
    }, [birthdate])


    useEffect( () => {

      async function getData(){

        const response = await getProfileData(loggedUserId, auth.accessToken)

        if(response){

          if(response.userProfile.firstname){
            setFirstname(response.userProfile.firstname)
          }

          if(response.userProfile.lastname){
            setLastname(response.userProfile.lastname)
          }
        }
      }

      if(auth.userId){
        getData()
      }

    }, [auth.userId])


  async function onSubmitHandler(e) {

    e.preventDefault();

    if(isLoading){
      return
    }

    toast.info("Checking for inappropriate content, please wait...", {
      position: "bottom-center",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      });

    setIsLoading(true);

      if(croppedImage){

        toast.info("Checking image, please wait...", {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
      });

        const formData = new FormData();
        const file = new File([croppedImage], `${auth.userId}.jpeg`, { type: "image/jpeg" })
        formData.append("image", file);

        const nsfwResults = await axios.post("/nsfw/check", 
        formData,
          {
            headers: { "Authorization": `Bearer ${auth.accessToken} ${loggedUserId}`, 
            'Content-Type': 'multipart/form-data'},
              withCredentials: true
          }
        );

          if (nsfwResults){

            var check1 = null;
            var check2 = null;

            for(let i=0; i<nsfwResults.data.length; i++){

              if(nsfwResults.data[i].className === 'Hentai' && nsfwResults.data[i].probability < 0.2){
                check1 = true
              }
              if(nsfwResults.data[i].className === 'Porn' && nsfwResults.data[i].probability < 0.2){
                check2 = true
              }
            }            

            if(check1 && check2){

              try {
                const response = await axios.post(PUBLIC_MEDIA_URL, 
                    formData,
                    {
                        headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`,
                          'Content-Type': "multipart/form-data" },
                        withCredentials: true
                    }
                );

                if(response?.status === 200){

                    const profilePicURL = response.data.Location;
                    const profilePicKey = response.data.key;

                    const editedSettings = await editSettingsUserProfile(auth.userId, fullname, phonePrimary, 
                        relationshipStatus, profilePicKey, profilePicURL, birthdate, region, regionCode, 
                        country, auth.accessToken)

                    if(editedSettings){

                        setAuth(prev => {
                            return {
                                ...prev,
                                firstName: firstName,
                                lastName: lastName,
                                currency: currency,
                                profilePicURL: profilePicURL
                            }
                        });

                        toast.success("Success! Changed user profile and settings!", {
                          position: "bottom-center",
                          autoClose: 1500,
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          progress: undefined,
                          theme: "colored",
                          });

                        URL.revokeObjectURL(image.photo?.src)
                        setIsLoading(false);
                    }
                }

              } catch (err) {
                  console.error(err);
                  setIsLoading(false);
                  toast.error("Failed to save profile settings! Please try again!", {
                    position: "bottom-center",
                    autoClose: 1500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
                  setErrorMessage("Failed to save profile settings! Please try again!");
              }

            } else {

              toast.error("Your post content did not meet our terms of service. Please check for inappropriate content.", {
                position: "bottom-center",
                autoClose: 1500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });

              setErrorMessage("Your post content did not meet our terms of service. Please check for inappropriate content.");    
              const warnUser = await addWarnings(loggedUserId, auth.accessToken)
              if(warnUser?.status === 202){
                logout();
              }

            }
          }

      } else {

        const editedSettings = await editSettingsUserProfile(auth.userId, firstName, lastName, 
          currency, auth.accessToken)

        if(editedSettings){

            setAuth(prev => {
              return {
                  ...prev,
                  firstName: firstName,
                  lastName: lastName,
                  currency: currency,
                  profilePicURL: profilePicURL
              }
          });

        toast.success("Success! Changed user information!", {
          position: "bottom-center",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          });
          
          URL.revokeObjectURL(image.photo?.src)
          setIsLoading(false);
        }
      }
  };
  
  return (
    <>
    <Box
        className={classes.container}
    >
        <div className='flex flex-col content-center items-center w-full'>

        <ProfileCropper setCroppedImage={setCroppedImage} setImage={setImage} 
            image={image} profilePicURL={auth.profilePicURL} />

        <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6 mt-5' >
          
          <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh] pt-2'>
            
              <label className='text-base font-semibold pl-2'>First Name:</label>
              <input 
                  aria-label="Fullname: " 
                  type="text" 
                  id="Firstname"
                  ref={startRef}
                  autoComplete="new-password"
                  placeholder="First name:"
                  className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                    border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                  onChange={ ( e ) => setFirstname(e.target.value)}
                  onKeyDown={(e) => 
                    e.stopPropagation()
                  }
                  value={firstName}
                  aria-invalid={validFirstname ? "false" : "true"}
                  onFocus={() => setFirstnameFocus(true)}
                  onBlur={() => setFirstnameFocus(false)}
                  // required
              />

          <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh] pt-2'>
            
            <label className='text-base font-semibold pl-2'>Last Name:</label>
            <input 
                aria-label="Lastname: " 
                type="text" 
                id="Lastname"
                ref={startRef}
                autoComplete="new-password"
                placeholder="First name:"
                className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                  border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                onChange={ ( e ) => setLastname(e.target.value)}
                onKeyDown={(e) => 
                  e.stopPropagation()
                }
                value={firstName}
                aria-invalid={validFirstname ? "false" : "true"}
                onFocus={() => setLastnameFocus(true)}
                onBlur={() => setLastnameFocus(false)}
                // required
            />
          
          </div>
            
        </div>

      </div>

      <div className='py-6'>
        <button 
        className={`align-center mb-4 px-4 py-4 text-[#8BEDF3] 
        border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
        hover:bg-[#8BEDF3] hover:text-white flex justify-center items-center gap-x-3`}
        
          type="submit"
          onClick={(e) => onSubmitHandler(e)}>
            {isLoading && 
                <div aria-label="Loading..." role="status">
                  <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                  <path
                      className="fill-gray-200"
                      d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                  <path
                      className="fill-[#00D3E0]"
                      d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                  </svg>
              </div>}
          
          Save Changes

        </button>
        </div>

        {errorMessage && <div className="justify-center items-center mt-5 mb-5">
        {errorMessage && <div className="error">{errorMessage}</div>}
        </div>}

        </div>
    </Box>

    <ToastContainer
      toastStyle={{ backgroundColor: "#8BEDF3" }}
      position="bottom-center"
      autoClose={1500}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      />
    </>
  );
}
