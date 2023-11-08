import { React, useRef, useState, useEffect, useMemo, createRef } from 'react';
import axios from '../../api/axios';  
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { Calendar, momentLocalizer, dayjsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import dayjs from 'dayjs'
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from 'moment';


const TestPage = () => {

    const localizer = dayjsLocalizer(dayjs);
    const DnDCalendar = withDragAndDrop(Calendar);

    const profileStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyItems: "center",
        height: 600,
        zIndex: 10001,
    };

    const [openModal, setOpenModal] = useState(true)

    const events = [
        {
          start: moment().toDate(),
          end: moment().add(1, "days").toDate(),
          title: "Some title",
        }
      ]

return (

    <Modal
        open={true}
        disableAutoFocus={true}>

        <Box sx={{ ...profileStyle }}>

        <DnDCalendar
          defaultDate={moment().toDate()}
          defaultView="day"
          events={events}
          localizer={localizer}
          style={{ height: "500px" }}
          views={['day']}
        />
    </Box>
</Modal>
  )
}

export default TestPage