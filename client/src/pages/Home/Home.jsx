import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// hook
import useIdGenerator from "../../hooks/useIdGenerator.js";

// db
import app from "../../database/firebase.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// css
import styles from "./Home.module.css";

const Home = (props) => {
  const githubUrl = "https://github.com/NISARG-KORADIA/FileShare";

  const [showButton, toggleShowButton] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [alertText, setAlertText] = useState(null);
  const [alertAnimation, setAlertAnimation] = useState(null);
  const footerRef = useRef(null);
  const codeInputRef = useRef(null);
  const joinBtnRef = useRef(null);

  const randomRoomID = useIdGenerator(5);

  useEffect(() => {
    footerRef.current?.scrollIntoView({ behavior: "smooth" });
    codeInputRef.current?.focus();
  }, [footerRef, codeInputRef]);

  // handler
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      redirectToRoom();
    }
  };

  const handleOnBlur = () => {
    setTimeout(() => toggleShowButton(false), 200);
  };

  // function
  const redirectToRoom = async () => {
    const roomIsHosted = await doesRoomExist();

    if (roomId.length === 5 && roomIsHosted) {
      setAlertText(null);
      joinBtnRef.current?.click();
    } else if (roomId.length !== 5) {
      raiseAlert("Please enter 5 characters.");
    } else {
      raiseAlert("Room does not exist!");
    }
  };
  const raiseAlert = (alert) => {
    setAlertText(alert);
    setAlertAnimation(styles.alertAnimation);
    codeInputRef.current?.focus();
  };
  const doesRoomExist = async () => {
    const dbRef = getFirestore(app);
    const roomRef = doc(dbRef, "rooooomsss", roomId);
    const docSnap = await getDoc(roomRef);
    return docSnap.exists();
  };

  return (
    <>
      <Link
        ref={joinBtnRef}
        to={`room/${roomId}`}
        state={{ isHost: false }}
        className="hide"
      />
      <div className="homePage">
        <div className={`container ${styles.titleAndButton}`}>
          <p className={`${styles.title} ${styles.titleRes}`}>File Share</p>
          <div className={`container ${styles.buttonWrapper}`}>
            <Link
              to={`room/${randomRoomID}`}
              state={{ isHost: true }}
              className={`button ${styles.createButton}`}
            >
              create a room
            </Link>
            <div className={styles.inputContainer}>
              <input
                ref={codeInputRef}
                onChange={(e) => setRoomId(e.target.value)}
                onBlur={handleOnBlur}
                onFocus={() => toggleShowButton(true)}
                onKeyDown={handleKeyDown}
                className={`button ${styles.codeInput} ${
                  showButton ? styles.shrinkCodeInput : ""
                }`}
                type={"text"}
                placeholder="Join a room"
                spellCheck="false"
                maxLength="5"
              />
              <div
                onClick={redirectToRoom}
                className={`button ${styles.joinButton} ${
                  showButton ? styles.showJoinButton : styles.hideJoinButton
                }`}
              >
                join
              </div>
            </div>
            <div
              className={`${styles.alert} ${alertAnimation}`}
              onAnimationEnd={() => setAlertAnimation(null)}
            >
              {alertText}
            </div>
          </div>
        </div>
        <div ref={footerRef} className={`container ${styles.footer}`}>
          <a className={styles.ankerLink}>Tutorial</a>
          <a href={githubUrl} target="_blank" className={styles.ankerLink}>
            Source Code
          </a>
        </div>
      </div>
    </>
  );
};

export default Home;
