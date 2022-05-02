import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import useRTC from "../../hooks/useRTC";
import styles from "./Room.module.css";

const Room = () => {
  const hostId = 3;
  // const peerConnections = [
  //   {
  //     id: 1,
  //     connection: "someString",
  //   },
  //   {
  //     id: 2,
  //     connection: "someString",
  //   },
  //   {
  //     id: 3,
  //     connection: "someString",
  //   },
  //   {
  //     id: 4,
  //     connection: "someString",
  //   },
  //   // {
  //   //   id: 5,
  //   //   connection: "someString",
  //   // },
  //   // {
  //   //   id: 6,
  //   //   connection: "someString",
  //   // },
  //   // {
  //   //   id: 7,
  //   //   connection: "someString",
  //   // },
  // ];

  const { state } = useLocation();
  const isHost = state === null ? false : state.isHost;
  const { roomID } = useParams();
  const { sendData, peerConnections } = useRTC(isHost, roomID);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    console.log(peerConnections);
  }, [peerConnections]);

  const msgClickHandler = () => {
    sendData(message, "text", "all");
    // console.log(message);
  };

  const fileSendClickHandler = (connection) => {
    sendData(file, "file", connection);
    // console.log("send data");
  };

  return (
    // <div className="homePage">
    //   <div className={`${styles.padding20}`}>
    //     <div className={`container ${styles.topBar}`}>
    //       <div className={styles.avatarContainer}>
    //         <img
    //           className={`${styles.avatar} ${isHost ? styles.hostAvatar : ""}`}
    //           src="https://doodleipsum.com/45/avatar?bg=FDFCF6&shape=circle"
    //         />
    //         {isHost && <label className={styles.hostLable}>Host</label>}
    //       </div>
    //       <div className={`${styles.verticleLine}`}></div>
    //       {peerConnections.map((peer) => {
    //         return (
    //           <div className={styles.avatarContainer} key={peer.id}>
    //             <img
    //               className={`${styles.avatar} ${
    //                 peer.id == hostId ? styles.hostAvatar : ""
    //               }`}
    //               src="https://doodleipsum.com/45/avatar?bg=FDFCF6&shape=circle"
    //             />
    //             {peer.id == hostId && (
    //               <label className={styles.hostLable}>Host</label>
    //             )}
    //           </div>
    //         );
    //       })}
    //     </div>
    //   </div>
    // </div>
    <>
      <div>{`${roomID} and ${isHost}`}</div>
      <input onChange={(e) => setMessage(e.target.value)} type={"text"} />
      <br />
      <button onClick={msgClickHandler}>Send Message</button>
      <br />
      <br />
      <input onChange={(e) => setFile(e.target.files[0])} type={"file"} />
      <br />
      <div>
        {peerConnections.map((peer) => {
          return (
            <div
              className="button"
              key={peer.id}
              onClick={() => fileSendClickHandler(peer.connection)}
            >
              {`send to ${peer.id}`}
            </div>
          );
        })}
      </div>
      {peerConnections.forEach((peer) => {
        <div
          className="button"
          key={peer.connection.label}
          onClick={() => sendData(file, "file", peer.connection)}
        >{`send to ${peer.id}`}</div>;
      })}
    </>
  );
};

export default Room;
