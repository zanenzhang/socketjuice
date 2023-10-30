import React, { useState, useEffect, useRef } from 'react';
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import ProfileCropper from './profileCropper'
import axios from '../../../api/axios'
import useAuth from '../../../hooks/useAuth'
import useLogout from '../../../hooks/useLogout';

import MuiPhoneNumber from 'material-ui-phone-number';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { profanity } from '@2toad/profanity';

import editSettingsUserProfile from "../../../helpers/UserData/editSettingsUserProfile";
import getProfileData from '../../../helpers/UserData/getProfileData';
import addWarnings from '../../../helpers/UserData/addWarnings';

const PUBLIC_MEDIA_URL = '/s3/single-profilepic'

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

    const regionData = [
      {region: "Select Region", code:"N/A", country: "N/A"}, 
      {region: "Alabama", code:"AL", country: "United States"}, 
      {region: "Alaska", code:"AK", country: "United States"}, 
      {region: "Arizona", code:"AZ", country: "United States"}, 
      {region: "Arkansas", code:"AR", country: "United States"}, 
      {region: "California", code:"CA", country: "United States"}, 
      {region: "Colorado", code:"CO", country: "United States"}, 
      {region: "Connecticut", code:"CT", country: "United States"}, 
      {region: "Delaware", code:"DE", country: "United States"}, 
      {region: "District of Columbia", code:"DC", country: "United States"}, 
      {region: "Florida", code:"FL", country: "United States"}, 
      {region: "Georgia", code:"GA", country: "United States"}, 
      {region: "Hawaii", code:"HI", country: "United States"}, 
      {region: "Idaho", code:"ID", country: "United States"}, 
      {region: "Illinois", code:"IL", country: "United States"}, 
      {region: "Indiana", code:"IN", country: "United States"}, 
      {region: "Iowa", code:"IA", country: "United States"}, 
      {region: "Kansas", code:"KS", country: "United States"}, 
      {region: "Kentucky", code:"KY", country: "United States"}, 
      {region: "Louisiana", code:"LA", country: "United States"}, 
      {region: "Maine", code:"ME", country: "United States"}, 
      {region: "Maryland", code:"MD", country: "United States"}, 
      {region: "Massachusetts", code:"MA", country: "United States"}, 
      {region: "Michigan", code:"MI", country: "United States"}, 
      {region: "Minnesota", code:"MN", country: "United States"}, 
      {region: "Mississippi", code:"MS", country: "United States"}, 
      {region: "Missouri", code:"MO", country: "United States"}, 
      {region: "Montana", code:"MT", country: "United States"}, 
      {region: "Nebraska", code:"NE", country: "United States"}, 
      {region: "Nevada", code:"NV", country: "United States"}, 
      {region: "New Hampshire", code:"NH", country: "United States"}, 
      {region: "New Jersey", code:"NJ", country: "United States"}, 
      {region: "New Mexico", code:"NM", country: "United States"}, 
      {region: "New York", code:"NY", country: "United States"}, 
      {region: "North Carolina", code:"NC", country: "United States"}, 
      {region: "North Dakota", code:"ND", country: "United States"}, 
      {region: "Ohio", code:"OH", country: "United States"}, 
      {region: "Oklahoma", code:"OK", country: "United States"}, 
      {region: "Oregon", code:"OR", country: "United States"}, 
      {region: "Pennsylvania", code:"PA", country: "United States"}, 
      {region: "Rhode Island", code:"RI", country: "United States"}, 
      {region: "South Carolina", code:"SC", country: "United States"}, 
      {region: "South Dakota", code:"SD", country: "United States"}, 
      {region: "Tennessee", code:"TN", country: "United States"}, 
      {region: "Texas", code:"TX", country: "United States"}, 
      {region: "Utah", code:"UT", country: "United States"}, 
      {region: "Vermont", code:"VT", country: "United States"}, 
      {region: "Virginia", code:"VA", country: "United States"}, 
      {region: "Washington", code:"WA", country: "United States"}, 
      {region: "West Virginia", code:"WV", country: "United States"}, 
      {region: "Wisconsin", code:"WI", country: "United States"}, 
      {region: "Wyoming", code:"WY", country: "United States"}, 
      {region: "Newfoundland and Labrador", code:"NL", country: "Canada"}, 
      {region: "Prince Edward Island", code:"PE", country: "Canada"}, 
      {region: "Nova Scotia", code:"NS", country: "Canada"}, 
      {region: "New Brunswick", code:"NB", country: "Canada"}, 
      {region: "Quebec", code:"QC", country: "Canada"}, 
      {region: "Ontario", code:"ON", country: "Canada"}, 
      {region: "Manitoba", code:"MB", country: "Canada"}, 
      {region: "Saskatchewan", code:"SK", country: "Canada"}, 
      {region: "Alberta", code:"AB", country: "Canada"}, 
      {region: "British Columbia", code:"BC", country: "Canada"}, 
      {region: "Yukon", code:"YT", country: "Canada"}, 
      {region: "Northwest Territories", code:"NT", country: "Canada"}, 
      {region: "Nunavut", code:"NU", country: "Canada"}, 
  ];
  
  const countryData = ['Select Country','Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', "Côte d'Ivoire", 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Congo-Brazzaville)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia (Czech Republic)', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Holy See', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
      'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar (formerly Burma)', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine State', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe']
  

    useEffect( () => {

      async function getData(){

        const response = await getProfileData(loggedUserId, 1, auth.accessToken)

        if(response){
          if(response.userProfile.fullname){
            setFullname(response.userProfile.fullname)
          }
          if(response.userProfile.phonePrimary){
            setPhonePrimary(response.userProfile.phonePrimary)
          }
          if(response.userProfile.region){
            setRegion(response.userProfile.region)
          }
          if(response.userProfile.regionCode){
            setRegionCode(response.userProfile.regionCode)
          }
          if(response.userProfile.country){
            setCountry(response.userProfile.country)
          }
          if(response.userProfile.relationshipStatus){
            setRelationshipStatus(response.userProfile.relationshipStatus)
          }
          if(response.userProfile.birthDate){
            setBirthdate(new Date(response.userProfile.birthDate).toISOString().slice(0,10))
          }
        }
      }

      if(loggedUserId){
        getData()
      }

    }, [loggedUserId])

    useEffect( ()=> {

      for(let i=0; i< regionData.length; i++){
          
          if(regionData[i].region === region && region !== 'Select Region'){
              setCountry(regionData[i].country);
              setCountrySet(true);
          }
      }

  }, [region])

  const handleRegionChange = (event) => {
    var saved = false
    setRegion(event.target.value);
    for(let i=0; i<regionData?.length; i++){
        if(regionData[i].region === event.target.value){
            setRegionCode(regionData[i].code)
            saved = true;
            break
        }
    }
    if(!saved){
        setRegionCode(event.target.value)
    }
}

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

    var textToCheck = fullname.concat(" ", relationshipStatus, " ", region, " ", regionCode);

    profanity.removeWords(['arse', "ass", 'asses', 'cok',"balls",  "boob", "boobs", "bum", "bugger", 'butt',]);

    const profanityCheck = profanity.exists(textToCheck)
        
    if(!profanityCheck){

    // put file into form data

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
          const file = new File([croppedImage], `${loggedUserId}.jpeg`, { type: "image/jpeg" })
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
                          headers: { "Authorization": `Bearer ${auth.accessToken} ${loggedUserId}`,
                          'Content-Type': "multipart/form-data" },
                          withCredentials: true
                      }
                  );

                  if(response?.status === 200){

                      const profilePicURL = response.data.Location;
                      const profilePicKey = response.data.key;

                      const editedSettings = await editSettingsUserProfile(loggedUserId, fullname, phonePrimary, 
                          relationshipStatus, profilePicKey, profilePicURL, birthdate, region, regionCode, 
                          country, auth.accessToken)

                      if(editedSettings){

                          setAuth(prev => {
                              return {
                                  ...prev,
                                  region: region,
                                  country: country,
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

          const editedSettings = await editSettingsUserProfile(loggedUserId, fullname, phonePrimary, 
            relationshipStatus, "", "", birthdate, region, regionCode, country, auth.accessToken)

        if(editedSettings){

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
    
    } else {

      setErrorMessage("Failed to save user profile settings. Please check for inappropriate content!");
        const warnUser = await addWarnings(loggedUserId, auth.accessToken)
        if(warnUser?.status === 202){
            logout();
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
            
              <label className='text-base font-semibold pl-2'>Full Name:</label>
              <input 
                  aria-label="Fullname: " 
                  type="text" 
                  id="Fullname"
                  ref={startRef}
                  autoComplete="new-password"
                  placeholder="First and last name:"
                  className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                    border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                  onChange={ ( e ) => setFullname(e.target.value)}
                  onKeyDown={(e) => 
                    e.stopPropagation()
                  }
                  value={fullname}
                  aria-invalid={validFullname ? "false" : "true"}
                  onFocus={() => setFullnameFocus(true)}
                  onBlur={() => setFullnameFocus(false)}
                  // required
              />
            
          </div>

          <div className='flex flex-col w-full md:w-[45vh] mt-4 md:mt-0 px-4 md:px-0'>
            
              <label className='text-base font-semibold pl-2'>Relationship Status:</label>
              <input 
                aria-label="Relationship status: " 
                type="text" 
                id="relationshipStatus"
                autoComplete="new-password"
                placeholder="(Single, it's complicated...)"
                className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                    border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                onChange={ ( e ) => setRelationshipStatus(e.target.value)}
                onKeyDown={(e) => 
                  e.stopPropagation()
                }
                value={relationshipStatus}
                aria-invalid={validRelationshipStatus ? "false" : "true"}
                onFocus={() => setRelationshipStatusFocus(true)}
                onBlur={() => setRelationshipStatusFocus(false)}
                // required
              />
            
          </div>

        </div>

        <div className='flex flex-col items-center md:flex-row md:justify-center 
          w-full gap-x-6'>
          
          <div className='flex flex-col w-full md:w-[45vh] mt-4 md:mt-0 px-4 md:px-0'>
            
              <label className='text-base font-semibold pl-2'>State/Province/Region:</label>
              <select onChange={(event) => handleRegionChange(event)}
                value={region}
                placeholder="Store Address - State/Province/Region"
                aria-label="Store Address - State/Province/Region" 
                required
                className={`w-full border-2 border-gray-100 rounded-xl h-16 sm:h-auto pl-4 py-4
                p-4 mt-1 bg-white focus:outline-[#8BEDF3] ${region === 'Select Region' ? 
                  'text-gray-400 text-sm' : 'text-black text-base'}`}
                >
                    {regionData?.length > 0 ? regionData
                    .filter(region => (region.region !== "Select All"))
                    .map((item, index) => (

                        <option className='pl-4' key={`${item.region} ${index}`} value={item.region}>{item.region}</option>
                    
                    )) : null}

              </select> 
            
          </div>

          <div className='flex flex-col w-full px-4 md:px-0 md:w-[45vh] mt-4 md:mt-0'>
            
              <label className='text-base font-semibold pl-2'>Country:</label>
              <select onChange={(event) => setCountry(event.target.value)}
                value={country} 
                placeholder="Store Address - Country"
                aria-label="Store Address - Country" 
                required
                disabled={countrySet}
                className={`w-full border-2 border-gray-100 rounded-xl h-16 sm:h-auto pl-4
                p-4 mt-1 bg-white focus:outline-[#8BEDF3] ${country === 'Select Country' ? 'text-gray-400 text-sm' : 'text-black text-base'}`}
                >
                {countryData?.length > 0 ? countryData
                .filter(country => (country !== "Select All"))
                .map((item, index) => (

                    <option className='pl-4' key={`${item} ${index}`} value={item}>{item}</option>
                
                )) : null}

            </select> 
            
          </div>

        </div>

        <div className='flex flex-col items-center md:flex-row md:justify-center 
          w-full gap-x-6'>

          <div className='flex flex-col w-full md:w-[45vh] px-4 md:px-0 mt-4'>
              
                <label className='text-base font-semibold pl-2'>Birth Date:</label>
                <div className='flex justify-center text-sm text-gray-700 w-full px-4 bg-white py-2
                    border-2 border-gray-100 rounded-xl focus:outline-[#8BEDF3]' >

                    <input 
                      aria-label="dateOfBirth" 
                      type="date" 
                      id="birthdate"
                      placeholder="Birthdate"
                      className='text-sm text-gray-base w-full md:mr-3 px-4 h-12
                      border border-gray-primary rounded focus:outline-[#8BEDF3]' 
                      onChange={ ( e ) => setBirthdate(e.target.value)}
                      value={birthdate}
                      aria-invalid={validBirthdate ? "false" : "true"}
                      onFocus={() => setBirthdateFocus(true)}
                      onBlur={() => setBirthdateFocus(false)}
                      required
                  />
                </div>
            </div>

            <div className='flex flex-col w-full md:w-[45vh] px-4 md:px-0 mt-4'>
              
                <label className='text-base font-semibold pl-2'>Phone Number:</label>
                
                <div className={`text-sm text-gray-700 w-full py-4 px-4 bg-white border-gray-100
                    border-2 rounded-xl ${phonePrimaryFocus ? 'outline-[#8BEDF3]' : 'outline-gray-100' }`} >
                <MuiPhoneNumber
                    sx={{ '& svg': { height: '1em', }, }}
                    defaultCountry={'us'}
                    className='mb-8'
                    InputProps={{ disableUnderline: true }}    
                    regions={['north-america']}
                    onChange={ ( e ) => setPhonePrimary(e)} 
                    onFocus={() => setPhonePrimaryFocus(true)}
                    onBlur={() => setPhonePrimaryFocus(false)}
                />
                </div>
              
            </div>

        </div>

        <div className='py-6'>
        <button 
        className={`align-center mb-4 px-4 py-4 text-[#8BEDF3] 
        border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
        hover:bg-[#8BEDF3] hover:text-white flex justify-center items-center gap-x-3
        ${( (fullname && !validFullname) || (phonePrimary && !validPhonePrimary) || 
          (birthdate && !validBirthdate) || (relationshipStatus && !validRelationshipStatus) 
          || isLoading  ) && 'opacity-50' }`}

          disabled={ ( (fullname && !validFullname) || (phonePrimary && !validPhonePrimary) || 
            (birthdate && !validBirthdate) || (relationshipStatus && !validRelationshipStatus) 
            || isLoading ) ? true : false}
        
          type="submit"
          onClick={(e) => onSubmitHandler(e)}>
            {isLoading && 
                <div aria-label="Loading..." role="status">
                    <svg className="h-6 w-6 animate-spin" viewBox="3 3 18 18">
                    <path
                        className="fill-gray-200"
                        d="M12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path>
                    <path
                        className="fill-gray-800"
                        d="M16.9497 7.05015C14.2161 4.31648 9.78392 4.31648 7.05025 7.05015C6.65973 7.44067 6.02656 7.44067 5.63604 7.05015C5.24551 6.65962 5.24551 6.02646 5.63604 5.63593C9.15076 2.12121 14.8492 2.12121 18.364 5.63593C18.7545 6.02646 18.7545 6.65962 18.364 7.05015C17.9734 7.44067 17.3403 7.44067 16.9497 7.05015Z"></path>
                    </svg>
                </div>
            }
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




