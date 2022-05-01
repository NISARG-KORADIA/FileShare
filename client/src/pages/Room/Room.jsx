import React, { Component, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import useRTC from "../../hooks/useRTC";

const Room = () => {
  const { state } = useLocation();
  const isHost = state === null ? false : state.isHost;
  const { roomID } = useParams();
  const { sendData } = useRTC(isHost, roomID);
  const [message, setMessage] = useState("");

  return (
    <>
      <div>{`${roomID} and ${isHost}`}</div>
      <input onChange={(e) => setMessage(e.target.value)} type={"text"} />
      <br />
      <button onClick={() => sendData(message)}>Send Message</button>
    </>
  );
};

export default Room;
