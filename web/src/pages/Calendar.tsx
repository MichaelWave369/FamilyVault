import FullCalendar from '@fullcalendar/react';import dayGridPlugin from '@fullcalendar/daygrid';import timeGridPlugin from '@fullcalendar/timegrid';import interactionPlugin from '@fullcalendar/interaction';
export default function Calendar(){return <div><h2>Calendar</h2><FullCalendar plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]} initialView='dayGridMonth' height='70vh' /></div>}
