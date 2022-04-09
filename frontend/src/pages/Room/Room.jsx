import React, { useEffect } from "react";
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
  var peerConnection, offerDataChannel, answerDataChannel;

  useEffect(() => {
    createPeerConnection();
  }, []);

  const createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection({
      iceServers: freeice(),
    });
    if (isHost) {
      offerDataChannel = peerConnection.createDataChannel("chat");
      offerDataChannel.onopen = () => console.log("DC opened");
      offerDataChannel.onclose = () => console.log("DC closed");
      offerDataChannel.onmessage = (e) => console.log("Message:" + e.data);
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
            peerConnection
              .addIceCandidate(change.doc.data())
              .catch((error) => console.log(error));
          }
        });
      });
      onSnapshot(roomDoc, (snapshot) => {
        const data = snapshot.data();
        if (!peerConnection.currentRemoteDescription && data?.answer) {
          const answerDescription = new RTCSessionDescription(
            data.answerObject
          );
          peerConnection.setRemoteDescription(answerDescription);
          console.log(JSON.stringify(peerConnection.remoteDescription));
        }
      });
    } else {
      peerConnection.ondatachannel = (e) => {
        answerDataChannel = e.channel;
        answerDataChannel.onopen = () => console.log("DC opened");
        answerDataChannel.onclose = () => console.log("DC closed");
        answerDataChannel.onmessage = (e) => console.log("Message: " + e.data);
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
              .catch((error) => console.log(error));
          }
        });
      });
    }
  };

  function checkState() {
    console.log(JSON.stringify(peerConnection.remoteDescription));
  }

  return (
    <div>
      This is your room - {roomID}
      <button onClick={checkState}>check</button>
    </div>
  );
};

export default Room;
