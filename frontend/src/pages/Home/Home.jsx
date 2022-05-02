import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

const Home = (props) => {
  const githubUrl = "https://github.com/NISARG-KORADIA/FileShare";

  let joinBlock;
  const [wantToJoin, toggleWantToJoin] = useState(false);
  const [customStyle, setCustomStyle] = useState({ background: "none" });

  if (wantToJoin) {
    joinBlock = (
      <>
        <input
          className={styles.codeInput}
          type={"text"}
          placeholder="XXXXX"
          maxLength="5"
        />
        <button className={`button ${styles.joinButton}`}>join</button>
      </>
    );
  } else {
    joinBlock = "join a room";
  }

  const toggleJoin = () => {
    toggleWantToJoin(true);
    setCustomStyle({ borderColor: "#FF6250" });
  };

  const customIdGenerator = () => {
    var result = "";
    var characters = "abcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * 26));
    }
    return result;
  };

  return (
    <>
      <div className={styles.homePage}>
        <div className={`container ${styles.homePage}`}>
          <Link
            id="roomLink"
            className="hide"
            to={{
              pathname: `/room/${customIdGenerator()}`,
              state: { isHost: true },
            }}
          >
            Create Room
          </Link>
          <p className={`${styles.title} ${styles.titleRes}`}>File Share</p>
          <div className={`container ${styles.buttonWrapper}`}>
            <div
              onClick={() => document.getElementById("roomLink").click()}
              className={`button ${styles.createButton}`}
            >
              create a room
            </div>
            <div
              style={customStyle}
              onClick={toggleJoin}
              className={`button ${styles.joinInput}`}
            >
              {joinBlock}
            </div>
          </div>
          <div className={`container ${styles.footer}`}>
            <a className={styles.ankerLink}>Tutorial</a>
            <a href={githubUrl} target="_blank" className={styles.ankerLink}>
              Source Code
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
