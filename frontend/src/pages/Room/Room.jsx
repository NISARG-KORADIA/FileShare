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
  let receivingFileSize, receivingFileName;
  let receivedFileBuffer = [];
  let totalBufferSize = 0;
  let fileReader;

  const [receivedMessage, setReceivedMessage] = useState([]);
  const [message, setMessage] = useState("");
  const [senderFile, setSenderFile] = useState();

  useEffect(() => {
    createPeerConnection();
  }, []);

  const createPeerConnection = async () => {
    if (isHost) {
      offerDataChannel.current = peerConnection.createDataChannel("chat");
      offerDataChannel.current.binaryType = "arraybuffer";
      offerDataChannel.current.onopen = () => console.log("DC opened");
      offerDataChannel.current.onclose = () => console.log("DC closed");
      offerDataChannel.current.onmessage = handleReceivingData;
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
        answerDataChannel.current.binaryType = "arraybuffer";
        answerDataChannel.current.onopen = () => console.log("DC opened");
        answerDataChannel.current.onclose = () => console.log("DC closed");
        answerDataChannel.current.onmessage = handleReceivingData;
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

  function handleReceivingData(msg) {
    if (typeof message !== "string") {
      setReceivedMessage((previousMessages) => [
        ...previousMessages,
        `Data Received`,
      ]);
      console.log(msg.byteLength);
      return;
    }
    console.log(message);
    // msg = JSON.parse(msg.data);
    // switch (msg.type) {
    //   case "text":
    //     setReceivedMessage((previousMessages) => [
    //       ...previousMessages,
    //       msg.text,
    //     ]);
    //     break;
    //   case "fileMeta":
    //     receivingFileName = msg.fileName;
    //     receivingFileSize = msg.fileSize;
    //     console.log(
    //       "tranfer initiated for: " +
    //         receivingFileName +
    //         " size: " +
    //         receivingFileSize
    //     );
    //     break;
    //   // case "transferInProgress":
    //   //   setReceivedMessage((previousMessages) => [
    //   //     ...previousMessages,
    //   //     `Data Received`,
    //   //   ]);
    //   //   console.log(msg.data);
    //   //   receiveFile(msg.data);
    //   //   break;
    //   case "transferComplete":
    //     setReceivedMessage((previousMessages) => [
    //       ...previousMessages,
    //       `${msg.fileName} - Transfer Completed`,
    //     ]);
    //     // downloadFile();
    //     break;
    //   default:
    //     setReceivedMessage((previousMessages) => [
    //       ...previousMessages,
    //       "unknown case",
    //     ]);
    // }
  }

  function downloadFile() {
    console.log(
      "fileSize: " + receivingFileSize + "\n bufferSize: " + totalBufferSize
    );
    // const receivedFinalFile = new Blob[receivedFileBuffer]();
    // receivedFileBuffer = [];
    // totalBufferSize = 0;
    // var fileURL = window.URL.createObjectURL(data);
    // var tempLink = document.createElement("a");
    // tempLink.href = fileURL;
    // tempLink.setAttribute("download", receivingFileName);
    // tempLink.click();
  }

  function receiveFile(data) {
    console.log();
    receivedFileBuffer.push(data);
    totalBufferSize += data.byteLength;
  }

  function sendMessage() {
    if (isHost) {
      offerDataChannel.current.send(
        JSON.stringify({ type: "text", text: message })
      );
    } else {
      answerDataChannel.current.send(
        JSON.stringify({ type: "text", text: message })
      );
    }
  }

  function sendFile() {
    let dc;
    if (isHost) {
      dc = offerDataChannel.current;
    } else {
      dc = answerDataChannel.current;
    }
    if (senderFile != null || senderFile === "") {
      // dc.send(
      //   JSON.stringify({
      //     type: "fileMeta",
      //     fileName: senderFile.name,
      //     fileSize: senderFile.size,
      //   })
      // );

      const chunkSize = 16384;
      const stream = senderFile.stream();
      fileReader = new FileReader();
      let offset = 0;
      fileReader.addEventListener("error", (error) =>
        console.error("Error reading file:", error)
      );
      fileReader.addEventListener("abort", (event) =>
        console.log("File reading aborted:", event)
      );
      fileReader.addEventListener("load", (e) => {
        console.log(
          "FileRead.onload ",
          e.target.result,
          typeof e.target.result
        );
        dc.send(e.target.result);
        offset += e.target.result.byteLength;
        if (offset < senderFile.size) {
          readSlice(offset);
        } else {
          // dc.send(
          //   JSON.stringify({
          //     type: "transferComplete",
          //     fileName: senderFile.name,
          //   })
          // );
        }
      });

      const readSlice = (o) => {
        console.log("readSlice ", o);
        const slice = senderFile.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
      };
      readSlice(0);
    }
  }

  // Helper Funcion

  let fileDetail;
  if (senderFile) {
    fileDetail = (
      <p>
        File Details {senderFile.name}, {senderFile.size}, {senderFile.type},{" "}
        {senderFile.lastModified}
      </p>
    );
  } else {
    fileDetail = <p>Upload a file to see the detail here</p>;
  }

  return (
    <div>
      This is your room - {roomID}
      <input onChange={(e) => setMessage(e.target.value)}></input>
      <button onClick={sendMessage}>Send</button>
      <br />
      <input
        onChange={(e) => setSenderFile(e.target.files[0])}
        type="file"
        id="fileInput"
      />
      {/* <label htmlFor="file">
        <a>Choose File</a>
      </label> */}
      <button onClick={() => setSenderFile(null)}>Flush File</button>
      {fileDetail}
      <button onClick={sendFile}>Send File</button>
      <br />
      <h4>Received Messages</h4>
      {receivedMessage.map((message, i) => (
        <li key={i}>{message}</li>
      ))}
    </div>
  );
};

export default Room;
