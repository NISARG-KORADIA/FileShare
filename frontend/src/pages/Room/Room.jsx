import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useLocation } from "react-router-dom";
import app from "../../database/firebase";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import freeice from "freeice";

const Room = () => {
  const location = useLocation();
  const isHost = location.state?.isHost ? true : false;
  const { roomID } = useParams();
  const db = getFirestore(app);
  const roomDoc = doc(db, "rooms", roomID);
  const offerCandidates = collection(roomDoc, "offerCandidates");
  const answerCandidates = collection(roomDoc, "answerCandidates");
  const peerConnection = new RTCPeerConnection({
    iceServers: freeice(),
  });

  var offerDataChannel = useRef();
  var answerDataChannel = useRef();

  const [message, setMessage] = useState("");

  useEffect(() => {
    createPeerConnection();
  }, []);

  const createPeerConnection = async () => {
    if (isHost) {
      offerDataChannel.current = peerConnection.createDataChannel("chat");
      offerDataChannel.current.onopen = () => console.log("DC opened");
      offerDataChannel.current.onclose = () => console.log("DC closed");
      offerDataChannel.current.onmessage = (e) =>
        console.log("Message:" + e.data);
      peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          addDoc(offerCandidates, e.candidate.toJSON());
        }
      };
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const offerObject = peerConnection.localDescription.toJSON();
      await setDoc(roomDoc, { offerObject });

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            peerConnection
              .addIceCandidate(candidate)
              .then(console.log("offerIce"))
              .catch((error) => console.log(error));
          }
        });
      });
      onSnapshot(roomDoc, (snapshot) => {
        const data = snapshot.data();
        if (
          peerConnection.currentRemoteDescription == null &&
          data?.answerObject
        ) {
          const answerDescription = new RTCSessionDescription(
            data.answerObject
          );
          peerConnection.setRemoteDescription(answerDescription);
        }
      });
    } else {
      peerConnection.ondatachannel = (e) => {
        answerDataChannel.current = e.channel;
        answerDataChannel.current.onopen = () => console.log("DC opened");
        answerDataChannel.current.onclose = () => console.log("DC closed");
        answerDataChannel.current.onmessage = (e) =>
          console.log("Message: " + e.data);
      };
      peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          addDoc(answerCandidates, e.candidate.toJSON());
        }
      };

      const roomDocData = (await getDoc(roomDoc)).data();

      const peerOffer = new RTCSessionDescription(roomDocData.offerObject);
      await peerConnection.setRemoteDescription(peerOffer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      const answerObject = peerConnection.localDescription.toJSON();
      await updateDoc(roomDoc, { answerObject });

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const candidate = new RTCIceCandidate(change.doc.data());
            peerConnection
              .addIceCandidate(candidate)
              .then(console.log("answerIce"))
              .catch((error) => console.log(error));
          }
        });
      });
    }
  };

  function sendMessage() {
    if (isHost) {
      offerDataChannel.current.send(message);
    } else {
      answerDataChannel.current.send(message);
    }
  }

  return (
    <div>
      This is your room - {roomID}
      <input onChange={(e) => setMessage(e.target.value)}></input>
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Room;
