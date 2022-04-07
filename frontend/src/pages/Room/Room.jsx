import React from 'react'
import {useParams} from 'react-router';
const Room = () => {

  const {roomID} = useParams();

  return (
    <div>This is your room - {roomID}</div>
  )
}

export default Room