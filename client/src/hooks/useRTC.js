import React, { useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  where,
  FieldPath
} from "firebase/firestore";
import app from "../database/firebase.js";
import useIdGenerator from './useIdGenerator.js';
import { async } from '@firebase/util';


const useRTC = (isHost, roomID) => {
  // states
  const [peerConnections, setPeerConnections] = useState({});
  let myConnection;

  // database
  const collectionName = "rooooomsss"
  const dbRef = getFirestore(app);
  const roomRef = doc(dbRef, collectionName, roomID)

  // rtc
  const myPeerID = useIdGenerator(8);
  const myPeer = new Peer(myPeerID, {
    debug: 2
  })

  useEffect(() => {
    console.log("Your peer Id: ", myPeerID);
    addPeerDb()
    peerListeners(myPeer);
    return (async () => {
      console.log("unmount");
      await flushPeerConnection(isHost);
    })
  }, [])

  useEffect(() => {
    console.log("Peer Connection: ", peerConnections);
  }, [peerConnections])

  // db methods
  const addPeerDb = async () => {
    try {
      if (isHost) {
        await setDoc(roomRef, { roomID, peers: [myPeerID] });
      } else {
        await updateDoc(roomRef, { peers: arrayUnion(myPeerID) })
      }
      listenChanges();
    } catch (error) {
      console.log("Error while adding peer to db: ", error);
    }
  }

  const listenChanges = () => {
    const q = query(collection(dbRef, collectionName), where("roomID", "==", roomID));
    try {
      onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type == "modified") {
            const { peers } = change.doc.data();
            peers.forEach((peer) => {
              if (peer !== myPeerID && !(peer in peerConnections)) {
                const newConn = myPeer.connect(peer, { label: `dc_${myPeerID}` });
                connectionListeners(newConn);
                setPeerConnections({ ...peerConnections, [peer]: newConn })
              }
            })
          }
        })
      })
    } catch (error) {
      console.log("Error while running snapshot: ", error)
    }

  }

  // rtc methods
  const handleIncomingConnection = (connection) => {
    const peerID = connection.peer;
    connectionListeners(connection);
    setPeerConnections({ ...peerConnections, [peerID]: connection })
  }

  const connectionListeners = (connection) => {
    connection.on("open", () => {
      console.log("Connected to: ", connection.label);
    })

    connection.on("data", (data) => {
      console.log("From: ", connection.label, "/Data: ", data);
    })

    connection.on("close", () => {
      console.log("Connection with ", connection.peer, " has been closed.")
      delete peerConnections[connection.peer];
      setPeerConnections(peerConnections);
    })

    connection.on("error", (error) => {
      console.log("error in data connection ", connection.label, " : ", error);
    })
  }

  const peerListeners = (peer) => {
    peer.on("connection", handleIncomingConnection);
    peer.on("close", (data) => {
      console.log(data);
    })
    peer.on("error", (error) => {
      console.log("error in peer: ", error);
    })
  }

  // remove connection and delete doc from db
  const flushPeerConnection = async (isHost) => {
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
      const doc = await getDoc(roomRef)
      if (doc.exists()) {
        console.log("removing my self")
        await updateDoc(roomRef, { peers: arrayRemove(myPeerID) })
      }
    }
    Object.values(peerConnections).forEach(peerConnection => {
      peerConnection.close()
    });
    myPeer.disconnect();
  }

  const sendData = (data) => {
    console.log("Sending data: ", data);
    console.log(peerConnections);
    Object.values(peerConnections).forEach(peerConnection => {
      peerConnection.close()
    });
  }

  return ({ sendData });
}

export default useRTC