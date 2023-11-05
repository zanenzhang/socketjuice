import React, { useState, useEffect, useRef, useMemo } from 'react';
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core";
import ProfileCropper from './profileCropper'
import axios from '../../../api/axios'
import useAuth from '../../../hooks/useAuth'
import useLogout from '../../../hooks/useLogout';
import debounce from 'lodash.debounce';

import '../../../pages/AutoCompleteForm.css';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { cityData } from '../../../listdata/cities';

import editSettingsStoreProfile from '../../../helpers/StoreData/editSettingsStoreProfile';
import getProfileData from '../../../helpers/UserData/getProfileData';
import addWarnings from '../../../helpers/UserData/addWarnings';
import getCityData from '../../../helpers/UserData/getCityData';
import Autocomplete from 'react-autocomplete';

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


export default function ChangeProfileMainStore({loggedUserId, profilePicURL}) {

  const classes = useStyles();
  const { setAuth, auth } = useAuth();
  const logout = useLogout();
  const startRef = useRef();

  const [image, setImage] = useState("");
  const [croppedImage, setCroppedImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const [countrySet, setCountrySet] = useState(false);

  const [phonePrimary, setPhonePrimary] = useState('');
  const [validPhonePrimary, setValidPhonePrimary] = useState(false);
  const [phonePrimaryFocus, setPhonePrimaryFocus] = useState(false);

  const [announcements, setAnnouncements] = useState('');
  const [validAnnouncements, setValidAnnouncements] = useState(false);
  const [announcementsFocus, setAnnouncementsFocus] = useState(false);

  const [closedOnMonday, setClosedOnMonday] = useState(false);
  const [closedOnTuesday, setClosedOnTuesday] = useState(false);
  const [closedOnWednesday, setClosedOnWednesday] = useState(false);
  const [closedOnThursday, setClosedOnThursday] = useState(false);
  const [closedOnFriday, setClosedOnFriday] = useState(false);
  const [closedOnSaturday, setClosedOnSaturday] = useState(false);
  const [closedOnSunday, setClosedOnSunday] = useState(false);
  const [closedOnHolidays, setClosedOnHolidays] = useState(false);

  const [regularHoursMondayStart, setRegularHoursMondayStart] = useState('');
  const [validRegularHoursMondayStart, setValidRegularHoursMondayStart] = useState(false);
  const [regularHoursMondayStartFocus, setRegularHoursMondayStartFocus] = useState(false);

  const [regularHoursMondayFinish, setRegularHoursMondayFinish] = useState('');
  const [validRegularHoursMondayFinish, setValidRegularHoursMondayFinish] = useState(false);
  const [regularHoursMondayFinishFocus, setRegularHoursMondayFinishFocus] = useState(false);

  const [regularHoursTuesdayStart, setRegularHoursTuesdayStart] = useState('');
  const [validRegularHoursTuesdayStart, setValidRegularHoursTuesdayStart] = useState(false);
  const [regularHoursTuesdayStartFocus, setRegularHoursTuesdayStartFocus] = useState(false);

  const [regularHoursTuesdayFinish, setRegularHoursTuesdayFinish] = useState('');
  const [validRegularHoursTuesdayFinish, setValidRegularHoursTuesdayFinish] = useState(false);
  const [regularHoursTuesdayFinishFocus, setRegularHoursTuesdayFinishFocus] = useState(false);

  const [regularHoursWednesdayStart, setRegularHoursWednesdayStart] = useState('');
  const [validRegularHoursWednesdayStart, setValidRegularHoursWednesdayStart] = useState(false);
  const [regularHoursWednesdayStartFocus, setRegularHoursWednesdayStartFocus] = useState(false);

  const [regularHoursWednesdayFinish, setRegularHoursWednesdayFinish] = useState('');
  const [validRegularHoursWednesdayFinish, setValidRegularHoursWednesdayFinish] = useState(false);
  const [regularHoursWednesdayFinishFocus, setRegularHoursWednesdayFinishFocus] = useState(false);

  const [regularHoursThursdayStart, setRegularHoursThursdayStart] = useState('');
  const [validRegularHoursThursdayStart, setValidRegularHoursThursdayStart] = useState(false);
  const [regularHoursThursdayStartFocus, setRegularHoursThursdayStartFocus] = useState(false);

  const [regularHoursThursdayFinish, setRegularHoursThursdayFinish] = useState('');
  const [validRegularHoursThursdayFinish, setValidRegularHoursThursdayFinish] = useState(false);
  const [regularHoursThursdayFinishFocus, setRegularHoursThursdayFinishFocus] = useState(false);

  const [regularHoursFridayStart, setRegularHoursFridayStart] = useState('');
  const [validRegularHoursFridayStart, setValidRegularHoursFridayStart] = useState(false);
  const [regularHoursFridayStartFocus, setRegularHoursFridayStartFocus] = useState(false);

  const [regularHoursFridayFinish, setRegularHoursFridayFinish] = useState('');
  const [validRegularHoursFridayFinish, setValidRegularHoursFridayFinish] = useState(false);
  const [regularHoursFridayFinishFocus, setRegularHoursFridayFinishFocus] = useState(false);

  const [regularHoursSaturdayStart, setRegularHoursSaturdayStart] = useState('');
  const [validRegularHoursSaturdayStart, setValidRegularHoursSaturdayStart] = useState(false);
  const [regularHoursSaturdayStartFocus, setRegularHoursSaturdayStartFocus] = useState(false);

  const [regularHoursSaturdayFinish, setRegularHoursSaturdayFinish] = useState('');
  const [validRegularHoursSaturdayFinish, setValidRegularHoursSaturdayFinish] = useState(false);
  const [regularHoursSaturdayFinishFocus, setRegularHoursSaturdayFinishFocus] = useState(false);

  const [regularHoursSundayStart, setRegularHoursSundayStart] = useState('');
  const [validRegularHoursSundayStart, setValidRegularHoursSundayStart] = useState(false);
  const [regularHoursSundayStartFocus, setRegularHoursSundayStartFocus] = useState(false);

  const [regularHoursSundayFinish, setRegularHoursSundayFinish] = useState('');
  const [validRegularHoursSundayFinish, setValidRegularHoursSundayFinish] = useState(false);
  const [regularHoursSundayFinishFocus, setRegularHoursSundayFinishFocus] = useState(false);

  const [holidayHours, setHolidayHours] = useState('');
  const [validHolidayHours, setValidHolidayHours] = useState(false);
  const [holidayHoursFocus, setHolidayHoursFocus] = useState(false);

  const [holidayHoursStart, setHolidayHoursStart] = useState('');
  const [validHolidayHoursStart, setValidHolidayHoursStart] = useState(false);
  const [holidayHoursStartFocus, setHolidayHoursStartFocus] = useState(false);

  const [holidayHoursFinish, setHolidayHoursFinish] = useState('');
  const [validHolidayHoursFinish, setValidHolidayHoursFinish] = useState(false);
  const [holidayHoursFinishFocus, setHolidayHoursFinishFocus] = useState(false);

  const [address, setAddress] = useState('');
  const [validAddress, setValidAddress] = useState(false);
  const [addressFocus, setAddressFocus] = useState(false);

  const [suggestedCities, setSuggestedCities] = useState(cityData);
  const [cityDisplay, setCityDisplay] = useState('Select All');
  const [city, setCity] = useState('');
  const [citySet, setCitySet] = useState(false);
  const [validCity, setValidCity] = useState(false);
  const [cityFocus, setCityFocus] = useState(false);

  const [region, setRegion] = useState('Select Region');
  const [regionCode, setRegionCode] = useState("");
  const [validRegion, setValidRegion] = useState(false);
  const [regionFocus, setRegionFocus] = useState(false);

  const [country, setCountry] = useState('Select Country');
  const [validCountry, setValidCountry] = useState(false);
  const [countryFocus, setCountryFocus] = useState(false);

  const [manager, setManager] = useState('');
  const [validManager, setValidManager] = useState(false);
  const [ManagerFocus, setManagerFocus] = useState(false);

  const [chain, setChain] = useState("No");
  const [validChain, setValidChain] = useState(false);
  const [chainFocus, setChainFocus] = useState(false);

  const [chainId, setChainId] = useState('');
  const [validChainId, setValidChainId] = useState(false);
  const [chainIdFocus, setChainIdFocus] = useState(false);

  const [oldProfilePicKey, setOldProfilePicKey] = useState('');
  const [oldProfilePicURL, setOldProfilePicURL] = useState('');


  const DISPLAY_NAME_REGEX = /^.{2,48}$/;
  const PHONE_PRIMARY_REGEX = /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/;

  const ANNOUNCEMENTS_REGEX = /^.{2,450}$/;
  const REGULAR_HOURS_REGEX = /^.{2,450}$/;
  const REGULAR_HOURS_REGEX_DAILY = /^.{2,100}$/;
  const HOLIDAY_HOURS_REGEX = /^.{2,100}$/;

const ADDRESS_REGEX = /^.{4,48}$/;
const CITY_REGEX = /^.{1,48}$/;
const REGION_REGEX = /^.{2,48}$/;
const COUNTRY_REGEX = /^.{4,48}$/;

const MANAGER_REGEX = /^.{4,48}$/;
const CHAIN_REGEX = /^.{1,4}$/;
const CHAINID_REGEX = /^.{4,48}$/;


  useEffect(() => {
    const ele = startRef.current
    ele.focus();
    }, [])

    useEffect( ()=> {

        if(chain == 'No'){
            setChainId("")
        }

    }, [chain])

    useEffect(() => {
        setValidPhonePrimary(PHONE_PRIMARY_REGEX.test(phonePrimary));
    }, [phonePrimary])

    useEffect(() => {
        setValidAnnouncements(ANNOUNCEMENTS_REGEX.test(announcements));
    }, [announcements])

    useEffect(() => {
        setValidRegularHoursMondayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursMondayStart));
    }, [regularHoursMondayStart])
    
    useEffect(() => {
        setValidRegularHoursMondayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursMondayFinish));
    }, [regularHoursMondayFinish])

    useEffect(() => {
        setValidRegularHoursTuesdayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursTuesdayStart));
    }, [regularHoursTuesdayStart])

    useEffect(() => {
        setValidRegularHoursTuesdayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursTuesdayFinish));
    }, [regularHoursTuesdayFinish])

    useEffect(() => {
        setValidRegularHoursWednesdayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursWednesdayStart));
    }, [regularHoursWednesdayStart])

    useEffect(() => {
        setValidRegularHoursWednesdayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursWednesdayFinish));
    }, [regularHoursWednesdayFinish])

    useEffect(() => {
        setValidRegularHoursThursdayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursThursdayStart));
    }, [regularHoursThursdayStart])

    useEffect(() => {
        setValidRegularHoursThursdayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursThursdayFinish));
    }, [regularHoursThursdayFinish])

    useEffect(() => {
        setValidRegularHoursFridayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursFridayStart));
    }, [regularHoursFridayStart])

    useEffect(() => {
        setValidRegularHoursFridayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursFridayFinish));
    }, [regularHoursFridayFinish])

    useEffect(() => {
        setValidRegularHoursSaturdayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursSaturdayStart));
    }, [regularHoursSaturdayStart])

    useEffect(() => {
        setValidRegularHoursSaturdayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursSaturdayFinish));
    }, [regularHoursSaturdayFinish])

    useEffect(() => {
        setValidRegularHoursSundayStart(REGULAR_HOURS_REGEX_DAILY.test(regularHoursSundayStart));
    }, [regularHoursSundayStart])

    useEffect(() => {
        setValidRegularHoursSundayFinish(REGULAR_HOURS_REGEX_DAILY.test(regularHoursSundayFinish));
    }, [regularHoursSundayFinish])

    useEffect(() => {
        setValidHolidayHoursStart(HOLIDAY_HOURS_REGEX.test(holidayHoursStart));
    }, [holidayHoursStart])

    useEffect(() => {
        setValidHolidayHoursFinish(HOLIDAY_HOURS_REGEX.test(holidayHoursFinish));
    }, [holidayHoursFinish])

    useEffect(() => {
        setValidAddress(ADDRESS_REGEX.test(address));
    }, [address])

    useEffect(() => {
        setValidCity(CITY_REGEX.test(city));
    }, [city])

    useEffect(() => {
        setValidRegion((REGION_REGEX.test(region) && region !== 'Select Region'));
    }, [region])

    useEffect(() => {
        setValidCountry((COUNTRY_REGEX.test(country) && country !== 'Select Country'));
    }, [country])

    useEffect(() => {
        setValidManager(MANAGER_REGEX.test(manager));
    }, [manager])

    useEffect(() => {
        setValidChain(CHAIN_REGEX.test(chain));
    }, [chain])

    useEffect(() => {
        setValidChainId(CHAINID_REGEX.test(chainId));
    }, [chainId])

    useEffect( () => {

        async function getData(){
  
          const response = await getProfileData(loggedUserId, 2, auth.accessToken)
  
          if(response){
            
            if(response.storeProfile.phonePrimary){
                setPhonePrimary(response.storeProfile.phonePrimary)
            }
            
            if(response.storeProfile.announcements){
                setAnnouncements(response.storeProfile.announcements)
            }
            
            if(response.storeProfile.regularHoursMondayStart){
                setRegularHoursMondayStart(response.storeProfile.regularHoursMondayStart)
            }
            if(response.storeProfile.regularHoursMondayFinish){
                setRegularHoursMondayFinish(response.storeProfile.regularHoursMondayFinish)
            }

            if(response.storeProfile.regularHoursTuesdayStart){
                setRegularHoursTuesdayStart(response.storeProfile.regularHoursTuesdayStart)
            }
            if(response.storeProfile.regularHoursTuesdayFinish){
                setRegularHoursTuesdayFinish(response.storeProfile.regularHoursTuesdayFinish)
            }

            if(response.storeProfile.regularHoursWednesdayStart){
                setRegularHoursWednesdayStart(response.storeProfile.regularHoursWednesdayStart)
            }
            if(response.storeProfile.regularHoursWednesdayFinish){
                setRegularHoursWednesdayFinish(response.storeProfile.regularHoursWednesdayFinish)
            }

            if(response.storeProfile.regularHoursThursdayStart){
                setRegularHoursThursdayStart(response.storeProfile.regularHoursThursdayStart)
            }
            if(response.storeProfile.regularHoursThursdayFinish){
                setRegularHoursThursdayFinish(response.storeProfile.regularHoursThursdayFinish)
            }

            if(response.storeProfile.regularHoursFridayStart){
                setRegularHoursFridayStart(response.storeProfile.regularHoursFridayStart)
            }
            if(response.storeProfile.regularHoursFridayFinish){
                setRegularHoursFridayFinish(response.storeProfile.regularHoursFridayFinish)
            }

            if(response.storeProfile.regularHoursSaturdayStart){
                setRegularHoursSaturdayStart(response.storeProfile.regularHoursSaturdayStart)
            }
            if(response.storeProfile.regularHoursSaturdayFinish){
                setRegularHoursSaturdayFinish(response.storeProfile.regularHoursSaturdayFinish)
            }

            if(response.storeProfile.regularHoursSundayStart){
                setRegularHoursSundayStart(response.storeProfile.regularHoursSundayStart)
            }
            if(response.storeProfile.regularHoursSundayFinish){
                setRegularHoursSundayFinish(response.storeProfile.regularHoursSundayFinish)
            }

            if(response.storeProfile.holidayHoursStart){
                setHolidayHoursStart(response.storeProfile.holidayHoursStart)
            }
            if(response.storeProfile.holidayHoursFinish){
                setHolidayHoursFinish(response.storeProfile.holidayHoursFinish)
            }

            if(response.storeProfile.closedOnMonday){
                setClosedOnMonday(response.storeProfile.closedOnMonday)
            }
            if(response.storeProfile.closedOnTuesday){
                setClosedOnTuesday(response.storeProfile.closedOnTuesday)
            }
            if(response.storeProfile.closedOnWednesday){
                setClosedOnWednesday(response.storeProfile.closedOnWednesday)
            }
            if(response.storeProfile.closedOnThursday){
                setClosedOnThursday(response.storeProfile.closedOnThursday)
            }
            if(response.storeProfile.closedOnFriday){
                setClosedOnFriday(response.storeProfile.closedOnFriday)
            }
            if(response.storeProfile.closedOnSaturday){
                setClosedOnSaturday(response.storeProfile.closedOnSaturday)
            }
            if(response.storeProfile.closedOnSunday){
                setClosedOnSunday(response.storeProfile.closedOnSunday)
            }
            if(response.storeProfile.closedOnHolidays){
                setClosedOnHolidays(response.storeProfile.closedOnHolidays)
            }

            if(response.storeProfile.address){
                setAddress(response.storeProfile.address)
            }
            if(response.storeProfile.city){
                setCity(response.storeProfile.city)
            }
            if(response.storeProfile.region){
                setRegion(response.storeProfile.region)
            }
            if(response.storeProfile.regionCode){
                setRegionCode(response.storeProfile.regionCode)
            }
            if(response.storeProfile.country){
                setCountry(response.storeProfile.country)
            }
            if(response.storeProfile.manager){
                setManager(response.storeProfile.manager)
            }
            if(response.storeProfile.chain){
                setChain(response.storeProfile.chain)
            }
            if(response.storeProfile.chainId){
                setChainId(response.storeProfile.chainId)
            }
            if(response.userData.profilePicKey){
                setOldProfilePicKey(response.userData.profilePicKey)
            }
            if(response.userData.profilePicURL){
                setOldProfilePicURL(response.userData.profilePicURL)
            }
          }
        }
  
        if(loggedUserId){
            getData()
        }
  
      }, [loggedUserId])


      const handleSelectCity = (val, item) => {

        for(let i=0; i<regionData.length; i++){
            if(regionData[i].code === item.adminCode){
                setRegion(regionData[i].region);
                break;
            }
        }

        setCityDisplay(val)
        setCity(val)
        setCitySet(true)
    }

    const handleRegularHourChangeBegin = (event, day) => {

        if (day === 'Monday'){

            if(event.target.value < regularHoursMondayFinish){
                setRegularHoursMondayStart(event.target.value)
            } else {
                setRegularHoursMondayStart(regularHoursMondayFinish)
                setClosedOnMonday(true);
            }

        } else if( day === 'Tuesday'){

            if(event.target.value < regularHoursMondayFinish){
                setRegularHoursTuesdayStart(event.target.value)
            } else {
                setRegularHoursTuesdayStart(regularHoursTuesdayFinish)
                setClosedOnTuesday(true);
            }

        } else if (day === 'Wednesday'){

            if(event.target.value < regularHoursWednesdayFinish){
                setRegularHoursWednesdayStart(event.target.value)
            } else {
                setRegularHoursWednesdayStart(regularHoursWednesdayFinish)
                setClosedOnWednesday(true);
            }

        } else if (day === 'Thursday'){

            if(event.target.value < regularHoursThursdayFinish){
                setRegularHoursThursdayStart(event.target.value)
            } else {
                setRegularHoursThursdayStart(regularHoursThursdayFinish)
                setClosedOnThursday(true);
            }

        } else if (day === 'Friday'){

            if(event.target.value < regularHoursFridayFinish){
                setRegularHoursFridayStart(event.target.value)
            } else {
                setRegularHoursFridayStart(regularHoursFridayFinish)
                setClosedOnFriday(true);
            }

        } else if (day === 'Saturday'){

            if(event.target.value < regularHoursSaturdayFinish){
                setRegularHoursSaturdayStart(event.target.value)
            } else {
                setRegularHoursSaturdayStart(regularHoursSaturdayFinish)
                setClosedOnSaturday(true);
            }

        } else if (day === 'Sunday'){

            if(event.target.value < regularHoursSundayFinish){
                setRegularHoursSundayStart(event.target.value)
            } else {
                setRegularHoursSundayStart(regularHoursSundayFinish)
                setClosedOnSunday(true);
            }

        } else if (day === ' Holiday'){

            if(event.target.value < holidayHoursFinish){
                setHolidayHoursStart(event.target.value)
            } else {
                setHolidayHoursStart(holidayHoursFinish)
                setClosedOnHolidays(true);
            }
            
        }
    }

    const handleRegularHourChangeEnd = (event, day) => {

        if (day === 'Monday'){

            if(event.target.value > regularHoursMondayStart){
                setRegularHoursMondayFinish(event.target.value)
            } else {
                setRegularHoursMondayFinish(regularHoursMondayStart)
                setClosedOnMonday(true);
            }

        } else if( day === 'Tuesday'){

            if(event.target.value > regularHoursMondayStart){
                setRegularHoursTuesdayFinish(event.target.value)
            } else {
                setRegularHoursTuesdayFinish(regularHoursMondayStart)
                setClosedOnTuesday(true);
            }

        } else if (day === 'Wednesday'){

            if(event.target.value > regularHoursWednesdayStart){
                setRegularHoursWednesdayFinish(event.target.value)
            } else {
                setRegularHoursWednesdayFinish(regularHoursWednesdayStart)
                setClosedOnWednesday(true);
            }

        } else if (day === 'Thursday'){

            if(event.target.value > regularHoursThursdayStart){
                setRegularHoursThursdayFinish(event.target.value)
            } else {
                setRegularHoursThursdayFinish(regularHoursThursdayStart)
                setClosedOnThursday(true);
            }

        } else if (day === 'Friday'){

            if(event.target.value > regularHoursFridayStart){
                setRegularHoursFridayFinish(event.target.value)
            } else {
                setRegularHoursFridayFinish(regularHoursFridayStart)
                setClosedOnFriday(true);
            }

        } else if (day === 'Saturday'){

            if(event.target.value > regularHoursSaturdayStart){
                setRegularHoursSaturdayFinish(event.target.value)
            } else {
                setRegularHoursSaturdayFinish(regularHoursSaturdayStart)
                setClosedOnSaturday(true);
            }

        } else if (day === 'Sunday'){

            if(event.target.value > regularHoursSundayStart){
                setRegularHoursSundayFinish(event.target.value)
            } else {
                setRegularHoursSundayFinish(regularHoursSundayStart)
            }

        } else if (day === ' Holiday'){

            if(event.target.value > holidayHoursStart){
                setHolidayHoursFinish(event.target.value)
            } else {
                setHolidayHoursFinish(holidayHoursStart)
            }
            
        }
    }

    const changeHandlerCities = (event) => { 
        setCity(event.target.value);
    };
    
    const debouncedChangeHandlerCities = useMemo(
        () => debounce(changeHandlerCities, 600)
    , []);

    useEffect(() => {
        return () => {
            debouncedChangeHandlerCities.cancel();
        }
      }, []);

    useEffect( async () => {

        if(city && loggedUserId && auth){
            if(city !== "Select All" && city !== '' && !citySet){
                const cityList = await getCityData(city, loggedUserId, auth.accessToken)
                if(cityList){
                    setSuggestedCities((cityList.filtered))
                }
            } else {
                setSuggestedCities(cityData)
            }
        }

    }, [city, loggedUserId, auth])


    const handleCityChange = (event) => {

        setCitySet(false);
        setCityDisplay(event.target.value)
        debouncedChangeHandlerCities(event);

        if(event.target.value === '' && cityData){
            setSuggestedCities(cityData)
        } 
    }

    useEffect( ()=> {

        for(let i=0; i< regionData.length; i++){
            
            if(city?.adminCode === regionData[i].code){
                setRegion(regionData[i].name);
            }
        }
  
      }, [city])

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

    useEffect( ()=> {

        if(region === "Select Region" || region === "Select All"){

            setCountry("Select All")
            setCountrySet(false);

        } else {

            for(let i=0; i< regionData.length; i++){
            
                if(regionData[i].region === region && region !== 'Select Region' && region !== "Select All"){
                    setCountry(regionData[i].country);
                    setCountrySet(true);
                }
            }
        }
  
      }, [region])



  async function onSubmitHandler(e) {

    e.preventDefault();

    if(isLoading){
        return
    }

    setIsLoading(true);

    var textToCheck = address.concat(" ", city, " ", region, " ", regionCode, " ", country);

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

                    if(response?.status == 200){

                        const profilePicURL = response.data.Location;
                        const profilePicKey = response.data.key;
                        
                        const editedSettings = await editSettingsStoreProfile(auth.userId, phonePrimary, profilePicKey, profilePicURL,  
                        regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, regularHoursWednesdayStart, regularHoursWednesdayFinish, regularHoursThursdayStart, regularHoursThursdayFinish,
                        regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, regularHoursSundayStart, regularHoursSundayFinish,
                        holidayHoursStart, holidayHoursFinish, 
                        closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
                        address, city, region, regionCode, country, manager, chain,
                        chainId, auth.accessToken)

                        if(editedSettings){

                            setAuth(prev => {
                                return {
                                    ...prev,
                                    city: city,
                                    region: region,
                                    country: country,
                                    profilePicURL: profilePicURL
                                }
                            });

                            toast.success("Success! Changed user profile!", {
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
                const warnUser = await addWarnings(auth.userId, auth.accessToken)
                if(warnUser?.status == 202){
                    logout();
                }
            }
        }

    } else {


    toast.info("Checking content, please wait...", {
        position: "bottom-center",
        autoClose: 500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
    });

        const editedSettings = await editSettingsStoreProfile(auth.userId,  
        phonePrimary, "", "", regularHoursMondayStart, regularHoursMondayFinish, regularHoursTuesdayStart, regularHoursTuesdayFinish, 
        regularHoursWednesdayStart, regularHoursWednesdayFinish, regularHoursThursdayStart, regularHoursThursdayFinish,
        regularHoursFridayStart, regularHoursFridayFinish, regularHoursSaturdayStart, regularHoursSaturdayFinish, regularHoursSundayStart, regularHoursSundayFinish,
        closedOnMonday, closedOnTuesday, closedOnWednesday, closedOnThursday, closedOnFriday, closedOnSaturday, closedOnSunday, closedOnHolidays,
        address, city, region, regionCode, country, manager, chain,
        chainId, auth.accessToken)

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
  };

  
  return (
    <>
    <Box
        className={classes.container}
    >
        <div className='flex flex-col content-center items-center w-full'>

            <ProfileCropper setCroppedImage={setCroppedImage} setImage={setImage} 
                image={image} profilePicURL={auth.profilePicURL} />

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Monday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Monday Start: " 
                        type="time" 
                        id="regularHoursMondayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Monday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursMondayStart}
                        aria-invalid={validRegularHoursMondayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursMondayStartFocus(true)}
                        onBlur={() => setRegularHoursMondayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Monday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Monday Finish: " 
                        type="time" 
                        id="regularHoursMondayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Monday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursMondayFinish}
                        aria-invalid={validRegularHoursMondayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursMondayFinishFocus(true)}
                        onBlur={() => setRegularHoursMondayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Monday?</label>
                        <FormControlLabel
                            value="Closed on Monday?"
                            control={
                            <Checkbox checked={closedOnMonday}
                                    onChange={()=>setClosedOnMonday(!closedOnMonday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />
                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Tuesday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Tuesday Start: " 
                        type="time" 
                        id="regularHoursTuesdayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Tuesday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursTuesdayStart}
                        aria-invalid={validRegularHoursTuesdayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursTuesdayStartFocus(true)}
                        onBlur={() => setRegularHoursTuesdayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Tuesday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Tuesday Finish: " 
                        type="time" 
                        id="regularHoursTuesdayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Tuesday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursTuesdayFinish}
                        aria-invalid={validRegularHoursTuesdayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursTuesdayFinishFocus(true)}
                        onBlur={() => setRegularHoursTuesdayFinishFocus(false)}
                    />
                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Tuesday?</label>
                        <FormControlLabel
                            value="Closed on Tuesday?"
                            control={
                            <Checkbox checked={closedOnTuesday}
                                    onChange={()=>setClosedOnTuesday(!closedOnTuesday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />

                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Wednesday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Wednesday Start: " 
                        type="time" 
                        id="regularHoursWednesdayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Wednesday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursWednesdayStart}
                        aria-invalid={validRegularHoursWednesdayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursWednesdayStartFocus(true)}
                        onBlur={() => setRegularHoursWednesdayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Wednesday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Wednesday Finish: " 
                        type="time" 
                        id="regularHoursWednesdayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Wednesday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursWednesdayFinish}
                        aria-invalid={validRegularHoursWednesdayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursWednesdayFinishFocus(true)}
                        onBlur={() => setRegularHoursWednesdayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Wednesday?</label>
                        <FormControlLabel
                            value="Closed on Wednesday?"
                            control={
                            <Checkbox checked={closedOnWednesday}
                                    onChange={()=>setClosedOnWednesday(!closedOnWednesday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />

                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Thursday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Thursday Start: " 
                        type="time" 
                        id="regularHoursThursdayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Thursday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursThursdayStart}
                        aria-invalid={validRegularHoursThursdayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursThursdayStartFocus(true)}
                        onBlur={() => setRegularHoursThursdayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Thursday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Thursday Finish: " 
                        type="time" 
                        id="regularHoursThursdayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Thursday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursThursdayFinish}
                        aria-invalid={validRegularHoursThursdayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursThursdayFinishFocus(true)}
                        onBlur={() => setRegularHoursThursdayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Thursday?</label>
                        <FormControlLabel
                            value="Closed on Thursday?"
                            control={
                            <Checkbox checked={closedOnThursday}
                                    onChange={()=>setClosedOnThursday(!closedOnThursday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />

                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Friday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Friday Start: " 
                        type="time" 
                        id="regularHoursFridayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Friday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursFridayStart}
                        aria-invalid={validRegularHoursFridayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursFridayStartFocus(true)}
                        onBlur={() => setRegularHoursFridayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Friday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Friday Finish: " 
                        type="time" 
                        id="regularHoursFridayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Friday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursFridayFinish}
                        aria-invalid={validRegularHoursFridayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursFridayFinishFocus(true)}
                        onBlur={() => setRegularHoursFridayFinishFocus(false)}
                    />
                </div>

            <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Friday?</label>
                        <FormControlLabel
                            value="Closed on Friday?"
                            control={
                            <Checkbox checked={closedOnFriday}
                                    onChange={()=>setClosedOnFriday(!closedOnFriday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />

                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Saturday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Saturday Start: " 
                        type="time" 
                        id="regularHoursSaturdayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Saturday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursSaturdayStart}
                        aria-invalid={validRegularHoursSaturdayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursSaturdayStartFocus(true)}
                        onBlur={() => setRegularHoursSaturdayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Saturday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Saturday Finish: " 
                        type="time" 
                        id="regularHoursSaturdayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Saturday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursSaturdayFinish}
                        aria-invalid={validRegularHoursSaturdayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursSaturdayFinishFocus(true)}
                        onBlur={() => setRegularHoursSaturdayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Saturday?</label>
                        <FormControlLabel
                            value="Closed on Saturday?"
                            control={
                            <Checkbox checked={closedOnSaturday}
                                    onChange={()=>setClosedOnSaturday(!closedOnSaturday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />
                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Sunday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Sunday Start: " 
                        type="time" 
                        id="regularHoursSundayStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Sunday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursSundayStart}
                        aria-invalid={validRegularHoursSundayStart ? "false" : "true"}
                        onFocus={() => setRegularHoursSundayStartFocus(true)}
                        onBlur={() => setRegularHoursSundayStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Sunday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Sunday Finish: " 
                        type="time" 
                        id="regularHoursSundayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Sunday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={regularHoursSundayFinish}
                        aria-invalid={validRegularHoursSundayFinish ? "false" : "true"}
                        onFocus={() => setRegularHoursSundayFinishFocus(true)}
                        onBlur={() => setRegularHoursSundayFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Sunday?</label>
                        <FormControlLabel
                            value="Closed on Sunday?"
                            control={
                            <Checkbox checked={closedOnSunday}
                                    onChange={()=>setClosedOnSunday(!closedOnSunday)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />

                </div>
            </div>


            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Holiday Hours - Start:</label>

                    <input 
                        aria-label="Regular Hours Holiday Start: " 
                        type="time" 
                        id="holidayHoursStart"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeBegin(e, "Holiday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={holidayHoursStart}
                        aria-invalid={validHolidayHoursStart ? "false" : "true"}
                        onFocus={() => setHolidayHoursStartFocus(true)}
                        onBlur={() => setHolidayHoursStartFocus(false)}
                    />

                </div>

                <div className='flex flex-col px-4 md:px-0 w-full md:w-[35vh] mt-4'>

                    <label className='text-base font-semibold pl-2'>Holiday Hours - Finish:</label>

                    <input 
                        aria-label="Regular Hours Holiday Finish: " 
                        type="time" 
                        id="regularHoursHolidayFinish"
                        autoComplete="off"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => handleRegularHourChangeEnd(e, "Holiday")}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={holidayHoursFinish}
                        aria-invalid={validHolidayHoursFinish ? "false" : "true"}
                        onFocus={() => setHolidayHoursFinishFocus(true)}
                        onBlur={() => setHolidayHoursFinishFocus(false)}
                    />

                </div>

                <div className='flex flex-col justify-center items-center px-4 md:px-0 w-2/3
                    md:w-[27vh] mt-4'>

                    <label className='pb-4 font-bold'>Closed on Holidays?</label>
                        <FormControlLabel
                            value="Closed on Holidays?"
                            control={
                            <Checkbox checked={closedOnHolidays}
                                    onChange={()=>setClosedOnHolidays(!closedOnHolidays)}
                                    style ={{
                                    color: "#8BEDF3",
                                    transform: "scale(1.5)",
                                    paddingBottom: '12pt'
                                }}
                                />
                            }
                        />

                </div>
            </div>

        
            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col w-full md:w-[45vh] mt-4 md:mt-0 px-4 md:px-0'>

                <label className='text-base font-semibold pl-2'>Address:</label>
                    <input 
                        aria-label="Address: " 
                        type="text" 
                        id="address"
                        autoComplete="off"
                        placeholder="Address:"
                        className='text-sm text-gray-700 w-full py-4 px-4 bg-white
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => setAddress(e.target.value)}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={address}
                        aria-invalid={validAddress ? "false" : "true"}
                        onFocus={() => setAddressFocus(true)}
                        onBlur={() => setAddressFocus(false)}
                        required
                    />
                </div>

                <div className='flex flex-col w-full md:w-[45vh] mt-4 md:mt-0 px-4 md:px-0'>

                <label className='text-base font-semibold pl-2'>City:</label>

                <div className="autocomplete-wrapper">
                    <Autocomplete
                        inputProps={{ placeholder: 'Select All',
                        onKeyDown: (e) => {
                          e.stopPropagation();
                        },
                       }}
                        value={cityDisplay}
                        items={suggestedCities}
                        getItemValue={item => item.name}
                        renderMenu={item => (
                            <div
                                key={`${item}_menu`} 
                                className="bg-white border border-t-0
                                overflow-auto max-h-[150px]">
                                {item}
                            </div>
                        )}
                        renderItem={(item) =>
                            <div 
                                key={`${item.cityId}_searchItem`} 
                                className={`hover:bg-gray-200 hover:cursor-pointer`}>
                                <p className="pl-2 md:text-base sm:text-sm text-xs break-all py-1">
                                    {item.name}, {item.adminCode}, {item.country}</p>
                            </div>
                        }
                        onChange={ ( e ) => handleCityChange(e)}
                        onSelect={(val, item) => handleSelectCity(val, item)}
                        onFocus={() => setCityFocus(true)}
                        onBlur={() => setCityFocus(false)}
                    />
                    </div>
                </div>
            </div>

            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col w-full md:w-[45vh] mt-4 md:mt-0 px-4 md:px-0'>

                <label className='text-base font-semibold pl-2'>State/Province/Region:</label>
                    <select onChange={(event) => handleRegionChange(event)}
                        value={region}
                        placeholder="Store Address - State/Province/Region"
                        aria-label="Store Address - State/Province/Region" 
                        required
                        className={`w-full border-2 border-gray-100 rounded-xl h-16 sm:h-auto pl-4 py-4
                        p-4 mb-2 bg-white focus:outline-[#8BEDF3] ${region === 'Select Region' ? 'text-gray-400' : 'text-black'}`}
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
                        p-4 mb-2 bg-white focus:outline-[#8BEDF3] ${country === 'Select Country' ? 'text-gray-400' : 'text-black'}`}
                        >
                        {countryData?.length > 0 ? countryData
                        .filter(country => (country !== "Select All"))
                        .map((item, index) => (

                            <option key={`${item} ${index}`} value={item}>{item}</option>
                        
                        )) : null}

                    </select> 
                </div>
            </div>


            <div className='flex flex-col items-center md:flex-row md:justify-center w-full gap-x-6'>

                <div className='flex flex-col w-full md:w-[45vh] px-4 md:px-0 mt-4'>

                <label className='text-base font-semibold pl-2'>Franchise Or Chain?</label>
                    <select 
                        aria-label="Chain: " 
                        type="text" 
                        id="chain"
                        autoComplete="off"
                        placeholder="Chain:"
                        className='text-sm text-gray-700 w-full bg-white h-16 sm:h-auto pl-4
                            p-4 border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]' 
                        onChange={ ( e ) => setChain(e.target.value)}
                        value={chain}
                        aria-invalid={validChain ? "false" : "true"}
                        onFocus={() => setChainFocus(true)}
                        onBlur={() => setChainFocus(false)}
                    >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="N/A">N/A</option>
                        </select>
                </div>

                <div className='flex flex-col w-full md:w-[45vh] px-4 md:px-0 mt-4'>

                <label className='text-base font-semibold pl-2'>Name Of Franchise Or Chain:</label>
                    <input 
                        aria-label="chainName" 
                        type="text" 
                        id="ChainName"
                        autoComplete="off"
                        placeholder="Chain Name:"
                        className={`text-sm text-gray-700 w-full py-4 px-4  ${chain =='No' ? 'bg-gray-100' : 'bg-white' }
                            border-2 border-gray-100 rounded-xl mb-2 focus:outline-[#8BEDF3]`} 
                        onChange={ ( e ) => setChainId(e.target.value)}
                        onKeyDown={(e) => 
                            e.stopPropagation()
                          }
                        value={chainId}
                        aria-invalid={validChainId ? "false" : "true"}
                        onFocus={() => setChainIdFocus(true)}
                        onBlur={() => setChainIdFocus(false)}
                        disabled={chain=='No'}
                    />
                </div>

            </div>

        <div className='py-6'>
        <button 
            className={`align-center mb-4 px-4 py-4 text-[#8BEDF3] 
            border-2 rounded-xl border-[#8BEDF3] bg-white text-base font-semibold
            hover:bg-[#8BEDF3] hover:text-white flex justify-center items-center gap-x-3
            ${ (  ( phonePrimary && !validPhonePrimary) || ( manager && !validManager)
                || (regularHoursMondayStart && !validRegularHoursMondayStart) || (holidayHoursStart && !validHolidayHoursStart )
                || (city && !validCity) || (address && !validAddress) || (region && !validRegion) 
                || (country && !validCountry || (chain && !validChain) || (chainId && !validChainId) ) || isLoading  ) && 'opacity-50' }`}
            disabled={ ( ( phonePrimary && !validPhonePrimary) || ( manager && !validManager) 
                || (regularHoursMondayStart && !validRegularHoursMondayStart) || (holidayHoursStart && !validHolidayHoursStart )
                || (city && !validCity) || (address && !validAddress) || (region && !validRegion) 
                || (country && !validCountry) || (chain && !validChain) || (chainId && !validChainId) || isLoading  ) ? true : false}
        
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
        autoClose={3000}
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




