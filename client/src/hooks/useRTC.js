import React, { useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import app from "../database/firebase.js";
import useIdGenerator from './useIdGenerator.js';
import { useNavigate } from 'react-router-dom';
import { Reciver, Sender } from '../helper/FileTransfer.js';


const useRTC = (isHost, roomID) => {
  // states

  //----> todo : change the structure of peerConnections, make this array of object each object containing connection, name, icon.
  const [peerConnections, setPeerConnections] = useState([]);
  const peerConnctionRef = useRef([]);
  let navigate = useNavigate();

  // database
  const collectionName = "rooooomsss"
  const dbRef = getFirestore(app);
  const roomRef = doc(dbRef, collectionName, roomID)
  const roomQuery = query(collection(dbRef, collectionName), where("roomID", "==", roomID));
  let unsub;

  // rtc
  const myPeerID = useIdGenerator(8);
  const myPeer = new Peer(myPeerID, {
    debug: 2
  })

  // file helper
  const sender = useRef();
  const receiver = useRef();

  useEffect(() => {
    console.log("Your peer Id: ", myPeerID);
    addPeerDb()
    peerListeners(myPeer);
    return (async () => {
      // console.log("unmount");
      await flushPeerConnection(isHost);
    })
  }, [])

  useEffect(() => {
    peerConnctionRef.current = peerConnections;
  }, [peerConnections])

  // db methods
  const addPeerDb = async () => {
    try {
      if (isHost) {
        await setDoc(roomRef, { roomID, peers: [myPeerID] });
      } else {
        await updateDoc(roomRef, { peers: arrayUnion(myPeerID) })
        leaveRoom()
      }
      await sendConnectionRequest();
    } catch (error) {
      console.log("Error while adding peer to db: ", error);
    }
  }

  // const listenChanges = () => {
  //   try {
  //     onSnapshot(roomQuery, (snapshot) => {
  //       snapshot.docChanges().forEach((change) => {
  //         if (change.type == "modified") {
  //           const { peers } = change.doc.data();
  //           peers.forEach((peer) => {
  //             if (peer !== myPeerID && findInPeerConnection(peer) === false) {
  //               const newConn = myPeer.connect(peer, { label: `dc_${myPeerID}` });
  //               connectionListeners(newConn);
  //               // peerConnectionss[peer] = newConn;
  //               // setPeerConnectionss(peerConnectionss);
  //               setPeerConnections(prev => [...prev, { id: peer, connection: newConn }])
  //             }
  //           })
  //         }
  //       })
  //     })
  //   } catch (error) {
  //     console.log("Error while running snapshot: ", error)
  //   }

  // }

  const sendConnectionRequest = async () => {
    const doc = await getDoc(roomRef);
    doc.data().peers.forEach((peer) => {
      if (peer !== myPeerID && findInPeerConnection(peer) === false) {
        const newConn = myPeer.connect(peer, { label: `dc_${myPeerID}` });
        connectionListeners(newConn);
        setPeerConnections(prev => [...prev, { id: peer, connection: newConn }])
      }
    })
  }

  const leaveRoom = () => {
    try {
      unsub = onSnapshot(roomQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type == "removed") {
            navigate(-1);
          }
        })
      })
    } catch (err) {
      console.log(err);
    }
  }
  // rtc methods
  const peerListeners = (peer) => {
    peer.on("connection", handleIncomingConnection);
    peer.on("close", (data) => {
      console.log(data);
    })
    peer.on("error", (error) => {
      console.log("error in peer: ", error);
    })
  }

  const handleIncomingConnection = (connection) => {
    connectionListeners(connection);
    setPeerConnections(prev => [...prev, { id: connection.peer, connection: connection }])
  }

  const connectionListeners = (connection) => {
    connection.on("open", () => {
      console.log("Connected to: ", connection.label);
    })

    connection.on("data", (data) => {
      handleRecievingData(data, connection)
    })

    connection.on("close", () => {
      console.log("Connection with ", connection.peer, " has been closed.")
      const filteredConnection = peerConnctionRef.current.filter(peer => peer.id !== connection.peer)
      setPeerConnections(filteredConnection)
    })

    connection.on("error", (error) => {
      console.log("error in data connection ", connection.label, " : ", error);
    })
  }



  const handleRecievingData = (data, connection) => {

    if (typeof data !== 'string') {
      receiver.current.unload(data);
      sendData(null, "send-next", connection)
      return;
    }
    data = JSON.parse(data);
    switch (data.type) {
      case 'text':
        console.log("Message: ", data.message);
        break;
      case 'file-meta':
        console.log("File: ", data.fileMeta);
        sendData(null, "send-next", connection)
        receiver.current = new Reciver(data.fileMeta);
        break;
      case 'transfer-complete':
        console.log("File Transfer Complete: ", data.fileMeta);
        receiver.current.download();
        break;
      case 'send-next':
        // console.log(sender);
        sender.current.sendChunk();
        break;
      default:
        console.log(data);
    }

  }

  const sendData = (data, type, connection) => {
    if (type == "text") {
      const jsonData = {
        type: "text",
        message: data
      }
      sendToPeer(jsonData, true, connection);
    } else if (type == "file") {
      sender.current = new Sender(data, connection);
      // sendFile(data, connection)
    } else if (type == "send-next") {
      connection.send(JSON.stringify({ type }))
    } else {
      sendToPeer(data, connection);
    }
  }

  // const sendFile = (connection) => {
  //   // first send meta data
  //   const initJson = {
  //     type: "file-meta",
  //     fileMeta: {
  //       name: file.name,
  //       type: file.type,
  //       size: file.size
  //     }
  //   }
  //   sendToPeer(initJson, true, connection);
  //   console.log(file.size);
  //   // now let's send file

  //   let offset = 0;
  //   const fileSize = file.size;
  //   while (offset < fileSize) {
  //     const sliceContents = file.slice(
  //       offset,
  //       offset + 16384
  //     );
  //     sendToPeer(sliceContents, false, connection);
  //     offset += sliceContents.size;
  //     console.log(offset);
  //   }

  //   if (offset >= fileSize) {
  //     const endJson = {
  //       type: "transfer-complete",
  //       fileMeta: {
  //         name: file.name,
  //         type: file.type
  //       }
  //     }
  //     sendToPeer(endJson, true, connection);
  //   }
  // }

  const sendToPeer = (data, isJson = false, connection) => {
    if (connection === "all") {
      peerConnections.forEach((peer) => {
        if (isJson) {
          peer.connection.send(JSON.stringify(data));
        } else {
          peer.connection.send(data);
        }
      })
    } else {
      if (isJson) {
        connection.send(JSON.stringify(data));
      } else {
        connection.send(data);
      }
    }
  }

  // helper function
  // const downloadFile = (filename, blob) => {
  //   const downloadLink = URL.createObjectURL(blob);

  //   const element = document.createElement("a");
  //   element.setAttribute("href", downloadLink);
  //   element.setAttribute("download", filename);

  //   element.style.display = "none";
  //   document.body.appendChild(element);

  //   element.click();

  //   document.body.removeChild(element);
  // }

  const findInPeerConnection = (peerId) => {
    // console.log("In find in peer connection")
    const ifPeer = peerConnections.find(peer => peer.id === peerId);
    if (ifPeer == undefined) {
      return false;
    }
    return ifPeer;
  }

  // unmounting method - remove connection and delete doc from db
  const flushPeerConnection = async (isHost) => {
    // console.log(peerConnctionRef.current);
    peerConnctionRef.current.forEach((peer) => {
      peer.connection.close();
    })
    peerConnctionRef.current = null;
    myPeer.disconnect();

    if (isHost) {
      try {
        const doc = await getDoc(roomRef)
        if (doc.exists()) {
          console.log("deleting it")
          await deleteDoc(roomRef);
        }
      } catch (err) {
        console.log("Error while gettin doc: ", err);
      }
    } else {
      unsub();
      const doc = await getDoc(roomRef)
      if (doc.exists()) {
        console.log("removing my self")
        await updateDoc(roomRef, { peers: arrayRemove(myPeerID) })
      }
    }
  }

  return ({ sendData, peerConnections });
}

export default useRTC