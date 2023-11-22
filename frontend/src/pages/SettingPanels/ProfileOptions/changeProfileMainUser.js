import React, { useState, useEffect, useRef } from 'react';
import Box from "@material-ui/core/Box";
import { withStyles, Switch } from "@material-ui/core";
import ProfileCropper from './profileCropper'
import axios from '../../../api/axios'
import useAuth from '../../../hooks/useAuth'
import useLogout from '../../../hooks/useLogout';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import editSettingsUserProfile from '../../../helpers/DriverData/editSettingsUserProfile';
import getDriverProfile from '../../../helpers/DriverData/getDriverProfile';

const PUBLIC_MEDIA_URL = '/s3/single-profilepic';



export default function ChangeProfileMainUser({loggedUserId }) {

  const CustomSwitch = withStyles({
    switchBase: {
      color: 'black',
      '&$checked': {
        color: '#8BEDF3',
      },
      '&$checked + $track': {
        backgroundColor: '#8BEDF3',
      },
    },
    checked: {},
    track: {},
  })(Switch);

  const { setAuth, auth } = useAuth();
  const logout = useLogout();

  const [image, setImage] = useState("");
  const [croppedImage, setCroppedImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [validFirstName, setValidFirstName] = useState(false);
  const [firstNameFocus, setFirstNameFocus] = useState(false);

  const [lastName, setLastName] = useState("");
  const [validLastName, setValidLastName] = useState(false);
  const [lastNameFocus, setLastNameFocus] = useState(false);

  const [language, setLanguage] = useState("English");
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)

  const [j1772ACChecked, setj1772ACChecked] = useState(false);
  const [ccs1DCChecked, setccs1DCChecked] = useState(false);
  const [mennekesACChecked, setmennekesACChecked] = useState(false);
  const [ccs2DCChecked, setccs2DCChecked] = useState(false);
  const [chademoDCChecked, setchademoDCChecked] = useState(false);
  const [gbtACChecked, setgbtACChecked] = useState(false);
  const [gbtDCChecked, setgbtDCChecked] = useState(false);
  const [teslaChecked, setteslaChecked] = useState(false);

  const FIRST_NAME_REGEX = /^[a-zA-Z_ ]{0,48}$/;
  const LAST_NAME_REGEX = /^[a-zA-Z_ ]{0,48}$/;

  useEffect(() => {
      setValidFirstName(FIRST_NAME_REGEX.test(firstName));
  }, [firstName])

  useEffect(() => {
    setValidLastName(LAST_NAME_REGEX.test(lastName));
  }, [lastName])
    
  const handleLanguage = (e) => {
    setLanguage(e.target.value)
  }

  const handlePushNotifications = (e) => {
      setPushNotifications(e.target.checked)
  }

  const handleEmailNotifications = (e) => {
      setEmailNotifications(e.target.checked)
  }

  const handleSmsNotifications = (e) => {
      setSmsNotifications(e.target.checked)
  }


    useEffect( () => {

      async function getData(){

        const response = await getDriverProfile(auth.userId, auth.userId, auth.accessToken)

        if(response && response.userFound){

            console.log(response)

            setSmsNotifications(response.userFound?.smsNotifications)
            setEmailNotifications(response.userFound?.emailNotifications)
            setPushNotifications(response.userFound?.pushNotifications)

            setFirstName(response.userFound?.firstName)
            setLastName(response.userFound?.lastName)

            setj1772ACChecked(response.userProfile?.j1772ACChecked)
            setccs1DCChecked(response.userProfile?.ccs1DCChecked)
            setmennekesACChecked(response.userProfile?.mennekesACChecked)
            setccs2DCChecked(response.userProfile?.ccs2DCChecked)
            setchademoDCChecked(response.userProfile?.chademoDCChecked)
            setgbtACChecked(response.userProfile?.gbtACChecked)
            setgbtDCChecked(response.userProfile?.gbtDCChecked)
            setteslaChecked(response.userProfile?.teslaChecked)
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

      if(croppedImage && croppedImage?.length > 0){

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
            headers: { "Authorization": `Bearer ${auth.accessToken} ${auth.userId}`, 
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

                    const editedSettings = await editSettingsUserProfile(auth.userId, firstName, lastName, profilePicKey, profilePicURL, 
                        pushNotifications, emailNotifications, smsNotifications, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, 
                        chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked, auth.accessToken)

                    if(editedSettings){

                        setAuth(prev => {
                            return {
                                ...prev,
                                firstName: firstName,
                                lastName: lastName,
                                profilePicURL: profilePicURL,
                                pushNotifications: pushNotifications,
                                emailNotifications: emailNotifications,
                                smsNotifications: smsNotifications,
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

            }
          }

      } else {

        const editedSettings = await editSettingsUserProfile(auth.userId, firstName, lastName, "", "",
          pushNotifications, emailNotifications, smsNotifications, j1772ACChecked, ccs1DCChecked, mennekesACChecked, ccs2DCChecked, 
          chademoDCChecked, gbtACChecked, gbtDCChecked, teslaChecked, auth.accessToken)

        if(editedSettings){

            setAuth(prev => {
              return {
                  ...prev,
                  firstName: firstName,
                  lastName: lastName,

                  pushNotifications: pushNotifications,
                  emailNotifications: emailNotifications, 
                  smsNotifications: smsNotifications,
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
        style={{display: "flex",
        height: "100%",
        width: "100%",
        justifyContent: "center"}}
    >
        <div className='flex flex-col content-center items-center w-full justify-center'>

        <ProfileCropper setCroppedImage={setCroppedImage} setImage={setImage} 
            image={image} profilePicURL={auth.profilePicURL} />

        <div className='flex flex-col items-center justify-center w-full gap-x-6 mt-5' >
          
          <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh] pt-2'>
            
              <label className='text-base font-semibold pl-2'>First Name:</label>
              <input 
                  aria-label="First name: " 
                  type="text" 
                  id="FirstName"
                  autoComplete="new-password"
                  placeholder="First name:"
                  className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                    border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                  onChange={ ( e ) => setFirstName(e.target.value)}
                  onKeyDown={(e) => 
                    e.stopPropagation()
                  }
                  value={firstName}
                  aria-invalid={validFirstName ? "false" : "true"}
                  onFocus={() => setFirstNameFocus(true)}
                  onBlur={() => setFirstNameFocus(false)}
                  // required
              />

            </div>

          <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh] pt-2'>
            
            <label className='text-base font-semibold pl-2'>Last Name:</label>
            <input 
                aria-label="Lastname: " 
                type="text" 
                id="Lastname"
                autoComplete="new-password"
                placeholder="First name:"
                className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                  border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                onChange={ ( e ) => setLastName(e.target.value)}
                onKeyDown={(e) => 
                  e.stopPropagation()
                }
                value={lastName}
                aria-invalid={validLastName ? "false" : "true"}
                onFocus={() => setLastNameFocus(true)}
                onBlur={() => setLastNameFocus(false)}
                // required
            />
          
          </div>

          {/* <div className='w-[300px] flex flex-col pt-4'>
            <div className='flex justify-start'>
                <label className='text-lg font-medium'>Language</label>
            </div>
            <div className='flex justify-start pl-2'>
                <select 
                    onChange={handleLanguage}
                    value={language}
                    className={`text-sm w-full mr-4 h-10 ${language === "English" ? "text-gray-400" : "text-black" }
                    border border-gray-primary mb-2 rounded focus:outline-[#995372] pl-3
                    `}
                    >
                    <option key={"English"} value={"English"}>{"English"}</option>
                    <option key={`French`} value={'French'}>{"Français"}</option>
                    <option disabled={true} key={`Chinese`} value={'Chinese'}>{"中文"}</option>
                    <option disabled={true} key={`Spanish`} value={'Spanish'}>{"Español"}</option>

                </select> 
            </div>
        </div> */}

          <div className="w-[300px] flex flex-col pt-4">
              <div className='flex justify-start'>
                  <label className='text-base font-semibold'>Email Notifications</label>
              </div>
              <div className='flex justify-start pl-2'>
                  <FormControlLabel control={
                      <CustomSwitch checked={emailNotifications} onChange={handleEmailNotifications} 
                      sx={{
                        "&.MuiSwitch-root .MuiSwitch-switchBase": {
                          color: "#8BEDF3"
                        },
                        "&.MuiSwitch-root .Mui-checked": {
                         color: "#8BEDF3"
                        }
                       }}/>
                  } label={emailNotifications ? "On" : "Off"} />
              </div>
          </div>

          {/* <div className="w-[300px] flex flex-col pt-4">
              <div className='flex justify-start'>
                  <label className='text-lg font-medium'>Push Notifications {pushNotifications ? "On" : "Off"}</label>
              </div>
              <div className='flex justify-start pl-2'>
                  <FormControlLabel control={
                      <CustomSwitch checked={pushNotifications} onChange={handlePushNotifications} />
                  } label={"Push Notifications"} />
              </div>
          </div> */}

          <div className="w-[300px] flex flex-col pt-4">
              <div className='flex justify-start'>
                  <label className='text-base font-semibold'>SMS(Text) Notifications</label>
              </div>
              <div className='flex justify-start pl-2'>
                  <FormControlLabel control={
                      <CustomSwitch checked={smsNotifications} onChange={handleSmsNotifications} />
                  } label={smsNotifications ? "On" : "Off"} />
              </div>
          </div>

          <div className='flex flex-col items-start w-full pt-6'>

            <p className='text-base font-semibold text-center py-4'>
              Driver Plug Preferences</p>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>J1772 AC Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={j1772ACChecked}
                          onChange={()=>setj1772ACChecked(!j1772ACChecked)}
                          style ={{
                          color: "#8BEDF3",
                          transform: "scale(1.5)",
                          paddingBottom: '12pt',
                          paddingLeft: '12pt'
                      }}
                      />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>CCS1 DC Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={ccs1DCChecked}
                          onChange={()=>setccs1DCChecked(!ccs1DCChecked)}
                          style ={{
                          color: "#8BEDF3",
                          transform: "scale(1.5)",
                          paddingBottom: '12pt',
                          paddingLeft: '12pt'
                      }}
                      />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>Mennekes AC Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={mennekesACChecked}
                        onChange={()=>setmennekesACChecked(!mennekesACChecked)}
                        style ={{
                        color: "#8BEDF3",
                        transform: "scale(1.5)",
                        paddingBottom: '12pt',
                        paddingLeft: '12pt'
                    }}
                    />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>CCS2 DC Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={ccs2DCChecked}
                          onChange={()=>setccs2DCChecked(!ccs2DCChecked)}
                          style ={{
                            color: "#8BEDF3",
                            transform: "scale(1.5)",
                            paddingBottom: '12pt',
                            paddingLeft: '12pt'
                      }}
                      />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>CHAdeMO DC Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={chademoDCChecked}
                        onChange={()=>setchademoDCChecked(!chademoDCChecked)}
                        style ={{
                          color: "#8BEDF3",
                          transform: "scale(1.5)",
                          paddingBottom: '12pt',
                          paddingLeft: '12pt'
                    }}
                    />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>GB/T AC Plug</label>    
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={gbtACChecked}
                          onChange={()=>setgbtACChecked(!gbtACChecked)}
                          style ={{
                            color: "#8BEDF3",
                            transform: "scale(1.5)",
                            paddingBottom: '12pt',
                            paddingLeft: '12pt'
                      }}
                      />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>GB/T DC Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={gbtDCChecked}
                      onChange={()=>setgbtDCChecked(!gbtDCChecked)}
                      style ={{
                        color: "#8BEDF3",
                        transform: "scale(1.5)",
                        paddingBottom: '12pt',
                        paddingLeft: '12pt'
                  }}
                  />
                  }
              />
              </div>

              <div className='flex flex-col items-start'>
              <label className='font-medium pb-1'>Tesla Plug</label>
              <FormControlLabel
                  label=""
                  control={
                  <Checkbox checked={teslaChecked}
                      onChange={()=>setteslaChecked(!teslaChecked)}
                      style ={{
                        color: "#8BEDF3",
                        transform: "scale(1.5)",
                        paddingBottom: '12pt',
                        paddingLeft: '12pt'
                    }}
                  />
                  }
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
