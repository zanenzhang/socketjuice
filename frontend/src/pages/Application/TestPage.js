import { React, useRef, useState, useEffect, useMemo, createRef, useCallback } from 'react';
import axios from '../../api/axios';  
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import dayjs from 'dayjs'
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";


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

    var today = new Date();

    const [events, setEvents] = useState([
        {
          id: 0,
          title: 'Test Event 1',
          start: new Date(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours()+2),
          isDraggable: true
        },
      ]
    )

    const handleNavigate = (e) => {

        console.log(e)
    }
    
    const handleSelectSlot = (e) => {

        console.log(e)
    }

    const handleSelectEvent = (e) => {

        console.log(e)

    }

    const handleEventResize = (e) => {

        console.log(e)
        
    }

    const handleEventMove = ({event, start, end}) => {

        console.log(event)
        
    }

    const {scrollToTime} = useMemo(
        () => ({
          scrollToTime: new Date(),
        }),
        []
    )

return (

    <Modal
        open={true}
        disableAutoFocus={true}>

        <Box sx={{ ...profileStyle }}>
            
        <DnDCalendar

            style={{ height: "500px" }}

            defaultDate={new Date()}
            defaultView="day"
            events={events}
            localizer={localizer}
            
            startAccessor="start"
            endAccessor="end"
            draggableAccessor="isDraggable"

            views={['day']}

            onSelectEvent={(e)=>handleSelectEvent(e)}
            onEventDrop={(e)=>handleEventMove(e)}
            onEventResize={(e)=>handleEventResize(e)}
            
            onSelectSlot={(e)=>handleSelectSlot(e)}
            scrollToTime={scrollToTime}
            onNavigate={(e)=>handleNavigate(e)}

            selectable
            resizable
        />
        </Box>
    </Modal>
  )
}

export default TestPage